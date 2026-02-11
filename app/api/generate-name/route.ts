import { createAnthropicClient } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    // 認証チェック（iOSアプリからのBearerトークンまたはWebのセッション）
    const authHeader = request.headers.get('Authorization')
    let authenticatedUserId: string | null = null

    // Admin権限を持つクライアント（トークン検証とDB操作用、RLS回避）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey)

    if (authHeader?.startsWith('Bearer ')) {
      // iOSアプリまたはWebアプリ: Bearerトークンを検証
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

      if (error || !user) {
        console.error('Bearer token validation failed:', error?.message)
        return NextResponse.json(
          { error: '認証に失敗しました', name: '名無しさん' },
          { status: 401 }
        )
      }

      authenticatedUserId = user.id
    } else {
      // Webアプリ: クッキーベースのセッション
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: '認証が必要です', name: '名無しさん' },
          { status: 401 }
        )
      }

      authenticatedUserId = user.id
    }

    // リクエストのuserIdと認証ユーザーが一致するか確認
    if (userId && userId !== authenticatedUserId) {
      return NextResponse.json(
        { error: '権限がありません', name: '名無しさん' },
        { status: 403 }
      )
    }

    // Claude APIでユーモアのある名前を生成
    const client = createAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `フィットネス・学習・美容の活動を記録するSNSアプリのユーザー用に、ユーモアがあって親しみやすいニックネームを1つだけ生成してください。

要件:
- 日本語で5〜10文字程度
- 絵文字は使わない
- 敬称（さん、くん等）は不要
- 前向きで元気な印象
- 例: 「がんばる山田」「継続の達人」「朝活マスター」「ストイック田中」

ニックネームだけを出力してください（説明不要）。`
      }]
    })

    const generatedName = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : '名無しさん'

    console.log(`🎭 Generated name: "${generatedName}" for user: ${authenticatedUserId}`)

    // 生成した名前をプロフィールに保存（Admin権限でRLS回避）
    // .select()で実際に更新された行を確認
    let saved = false
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ display_name: generatedName })
        .eq('id', authenticatedUserId)
        .select('id')

      if (updateError) {
        console.error(`Profile update error (attempt ${attempt + 1}):`, updateError)
      } else if (data && data.length > 0) {
        // 実際に行が更新された
        saved = true
        console.log(`✅ Name saved successfully for user: ${authenticatedUserId}`)
        break
      } else {
        // プロフィールが存在しない（0行更新）
        console.log(`⏳ Profile not found, retry ${attempt + 1}/3 for user: ${authenticatedUserId}`)
      }
      // DBトリガーによるプロフィール作成を待つ
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (!saved) {
      console.error(`❌ Failed to save name after 3 attempts for user: ${authenticatedUserId}`)
    }

    return NextResponse.json({ name: generatedName, saved })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Name generation error:', errorMessage)
    return NextResponse.json(
      { error: '名前の生成に失敗しました', name: '名無しさん' },
      { status: 500 }
    )
  }
}
