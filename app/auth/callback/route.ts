import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 新規ユーザーの場合、display_nameがNULLならAI名前生成
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', user.id)
            .single()

          // display_nameがNULL、またはusername(メールプレフィックス)と同じ場合は名前を生成
          const needsNameGeneration = profile && (
            !profile.display_name ||
            profile.display_name === profile.username ||
            profile.display_name === user.email?.split('@')[0]
          )

          if (needsNameGeneration) {
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
              : null

            if (generatedName) {
              await supabase
                .from('profiles')
                .update({ display_name: generatedName })
                .eq('id', user.id)
            }
          }
        }
      } catch (nameError) {
        // 名前生成に失敗しても認証は成功とする
        console.error('Name generation error in callback:', nameError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // エラーの場合はログインページにリダイレクト
  return NextResponse.redirect(`${origin}/login`)
}
