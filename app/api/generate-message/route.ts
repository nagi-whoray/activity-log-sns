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
    const { logType, category, content, userId } = await request.json()

    const supabase = await createClient()

    // 過去のアクティビティを取得（最新10件）
    const { data: recentLogs } = await supabase
      .from('activity_logs')
      .select('category, content, log_type, activity_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // 統計情報を取得
    const { data: allLogs } = await supabase
      .from('activity_logs')
      .select('log_type, category, activity_date')
      .eq('user_id', userId)

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

    // Claude APIでメッセージ生成（最速モデルを使用）
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `あなたはフィットネス・学習・美容のアクティビティログSNSのAIアシスタントです。
ユーザーが${logType === 'achievement' ? '達成' : '活動'}を記録しました。

【今回の記録】
カテゴリ: ${categoryLabel}
内容: ${content}
タイプ: ${logType === 'achievement' ? '達成ログ' : '活動ログ'}

【ユーザーの実績】
- 連続活動日数: ${streak}日
- ${categoryLabel}の${logType === 'achievement' ? '達成' : '活動'}記録: 今回で${currentCount}回目
- 総活動ログ数: ${totalActivityCount}件
- 総達成ログ数: ${totalAchievementCount}件

【過去の記録（最新10件）】
${recentLogs?.map(log => `- [${log.log_type === 'achievement' ? '達成' : '活動'}] ${CATEGORY_LABELS[log.category] || log.category}: ${log.content.substring(0, 50)}${log.content.length > 50 ? '...' : ''}`).join('\n') || 'なし'}

${logType === 'achievement'
  ? 'この達成を祝福し、次の目標に向けて励ますメッセージを2-3文で生成してください。'
  : 'この活動を称え、継続を励ますメッセージを2-3文で生成してください。'
}
連続日数や回数などの実績を適宜メッセージに含めてください。
絵文字を適度に使い、フレンドリーな口調でお願いします。`
      }]
    })

    const generatedMessage = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ message: generatedMessage })
  } catch (error) {
    console.error('Message generation error:', error)
    return NextResponse.json(
      { error: 'メッセージの生成に失敗しました' },
      { status: 500 }
    )
  }
}
