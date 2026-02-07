import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const CATEGORY_LABELS: Record<string, string> = {
  workout: '筋トレ',
  study: '勉強',
  beauty: '美容',
}

// 連続活動日数を計算
function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  // 日付を昇順でソート（重複を除去）
  const sortedDates = Array.from(new Set(dates)).sort()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let currentDate = today

  // 今日から遡って連続日数をカウント
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const logDate = new Date(sortedDates[i])
    logDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0 || diffDays === 1) {
      streak++
      currentDate = logDate
    } else {
      break
    }
  }

  return streak
}

export async function POST(request: Request) {
  try {
    const { logType, category, content, userId, logId } = await request.json()

    const supabase = await createClient()

    // 過去のアクティビティを取得（最新50件）
    const { data: recentLogs } = await supabase
      .from('activity_logs')
      .select('category, content, log_type, activity_date, ai_message')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false })
      .limit(50)

    // 統計情報を取得
    const { data: allLogs } = await supabase
      .from('activity_logs')
      .select('log_type, category, activity_date')
      .eq('user_id', userId)

    // ユーザーのAI設定とプロフィールを取得
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name, bio, goal, ai_prompt, ai_tone')
      .eq('id', userId)
      .single()

    // 各種カウントを計算
    const totalActivityCount = allLogs?.filter(log => log.log_type === 'activity').length || 0
    const totalAchievementCount = allLogs?.filter(log => log.log_type === 'achievement').length || 0
    const categoryActivityCount = allLogs?.filter(log => log.log_type === 'activity' && log.category === category).length || 0
    const categoryAchievementCount = allLogs?.filter(log => log.log_type === 'achievement' && log.category === category).length || 0

    // 連続活動日数を計算
    const activityDates = allLogs?.map(log => log.activity_date) || []
    const streak = calculateStreak(activityDates)

    const categoryLabel = CATEGORY_LABELS[category] || category

    // 今回が何回目かを計算（今回の投稿を含む）
    const currentCount = logType === 'achievement'
      ? categoryAchievementCount + 1
      : categoryActivityCount + 1

    // コンパクトなデータ形式に変換（AIがパターン分析しやすい形式）
    const compactLogs = recentLogs?.map(log => ({
      d: log.activity_date,
      c: log.category,
      t: log.log_type,
      s: log.content.substring(0, 50),
      m: log.ai_message?.substring(0, 80) || ''
    })) || []

    // ユーザープロフィール情報を組み立て
    const profileInfo = []
    if (userProfile?.display_name) profileInfo.push(`名前: ${userProfile.display_name}`)
    if (userProfile?.bio) profileInfo.push(`自己紹介: ${userProfile.bio}`)
    if (userProfile?.goal) profileInfo.push(`目標: ${userProfile.goal}`)

    const userProfileContext = profileInfo.length > 0
      ? `\n【ユーザープロフィール】\n${profileInfo.map(p => `- ${p}`).join('\n')}\n`
      : ''

    // ユーザーのAI設定をプロンプトに組み込む
    const userContext = userProfile?.ai_prompt
      ? `\n【AIへの指示】\n${userProfile.ai_prompt}\n`
      : ''

    const toneInstruction = userProfile?.ai_tone
      ? `- 口調・スタイル: ${userProfile.ai_tone}`
      : '- フレンドリーな口調'

    // Claude APIでメッセージ生成（最速モデルを使用）
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `あなたはフィットネス・学習・美容のアクティビティログSNSのAIアシスタントです。
ユーザーが${logType === 'achievement' ? '達成' : '活動'}を記録しました。
${userProfileContext}${userContext}
【今回の記録】
カテゴリ: ${categoryLabel}
内容: ${content}
タイプ: ${logType === 'achievement' ? '達成ログ' : '活動ログ'}

【確定した統計（サーバー計算済み）】
- 連続活動日数: ${streak}日
- ${categoryLabel}の${logType === 'achievement' ? '達成' : '活動'}記録: 今回で${currentCount}回目
- 総活動ログ数: ${totalActivityCount}件
- 総達成ログ数: ${totalAchievementCount}件

【過去の活動履歴 (JSON形式、最新順、d=日付, c=カテゴリ, t=タイプ, s=内容, m=過去のAIメッセージ)】
${JSON.stringify(compactLogs)}

上記の統計情報と活動履歴を参考に、パーソナライズされた励ましのメッセージを2-3文で生成してください。

要件:
- 上記の統計数値をそのまま使用すること
- 活動履歴から週間習慣やカテゴリ傾向を見つけて言及（例：「週3回ペースで筋トレ」「最近は勉強に力を入れている」など）
- ${logType === 'achievement' ? 'この達成を祝福し、次の目標に向けて励ます' : 'この活動を称え、継続を励ます'}
- 過去のAIメッセージ(m)と同じ表現・フレーズを繰り返さない。新鮮で多様な言い回しを使う
- 日本語で記述、絵文字を適度に使用
${toneInstruction}`
      }]
    })

    const generatedMessage = message.content[0].type === 'text' ? message.content[0].text : ''

    // 生成したメッセージをログに保存
    if (logId && generatedMessage) {
      await supabase
        .from('activity_logs')
        .update({ ai_message: generatedMessage })
        .eq('id', logId)
        .eq('user_id', userId)
    }

    return NextResponse.json({ message: generatedMessage })
  } catch (error) {
    console.error('Message generation error:', error)
    return NextResponse.json(
      { error: 'メッセージの生成に失敗しました' },
      { status: 500 }
    )
  }
}
