import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    const supabase = await createClient()

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

    // 生成した名前をプロフィールに保存
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: generatedName })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ name: generatedName, saved: false })
    }

    return NextResponse.json({ name: generatedName, saved: true })
  } catch (error) {
    console.error('Name generation error:', error)
    return NextResponse.json(
      { error: '名前の生成に失敗しました', name: '名無しさん' },
      { status: 500 }
    )
  }
}
