import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    const supabase = await createClient()

    // 認証チェック（iOSアプリからのBearerトークンまたはWebのセッション）
    const authHeader = request.headers.get('Authorization')
    let authenticatedUserId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      // iOSアプリ: Bearerトークンを検証
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return NextResponse.json(
          { error: '認証に失敗しました', name: '名無しさん' },
          { status: 401 }
        )
      }

      authenticatedUserId = user.id
    } else {
      // Webアプリ: クッキーベースのセッション
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
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
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

    // 生成した名前をプロフィールに保存（認証済みユーザーのIDを使用）
    // まずupdateを試み、プロフィールが存在しない場合はリトライ
    let saved = false
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: generatedName })
        .eq('id', authenticatedUserId)

      if (updateError) {
        console.error(`Profile update error (attempt ${attempt + 1}):`, updateError)
      } else {
        saved = true
        break
      }
      // DBトリガーによるプロフィール作成を待つ
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return NextResponse.json({ name: generatedName, saved })
  } catch (error) {
    console.error('Name generation error:', error)
    return NextResponse.json(
      { error: '名前の生成に失敗しました', name: '名無しさん' },
      { status: 500 }
    )
  }
}
