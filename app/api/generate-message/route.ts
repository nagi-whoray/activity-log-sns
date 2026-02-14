import { createAnthropicClient, createMessageWithFallback } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const CATEGORY_LABELS: Record<string, string> = {
  workout: '筋トレ',
  study: '勉強',
  beauty: '美容',
  meal: '食事',
  work: '仕事',
  dev: '開発',
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
    const { logType, category, content, userId, logId, activityDurationMinutes } = await request.json()

    const supabase = await createClient()

    // Check for Authorization header (from iOS app)
    const authHeader = request.headers.get('Authorization')
    let authenticatedUserId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      // iOS app: Verify the Bearer token
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return NextResponse.json(
          { error: '認証に失敗しました' },
          { status: 401 }
        )
      }

      authenticatedUserId = user.id
    } else {
      // Web app: Check cookie-based session
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: '認証が必要です' },
          { status: 401 }
        )
      }

      authenticatedUserId = user.id
    }

    // Verify that the userId in the request matches the authenticated user
    if (userId && userId !== authenticatedUserId) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    // 過去のアクティビティを取得（最新10件）
    const { data: recentLogs } = await supabase
      .from('activity_logs')
      .select('category, content, log_type, activity_date, ai_message')
      .eq('user_id', authenticatedUserId)
      .order('activity_date', { ascending: false })
      .limit(10)

    // 統計情報を取得
    const { data: allLogs } = await supabase
      .from('activity_logs')
      .select('log_type, category, activity_date')
      .eq('user_id', authenticatedUserId)

    // ユーザーのAI設定とプロフィールを取得
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name, bio, goal, ai_prompt, ai_tone')
      .eq('id', authenticatedUserId)
      .single()

    // 各種カウントを計算
    const totalActivityCount = allLogs?.filter(log => log.log_type === 'activity').length || 0
    const totalAchievementCount = allLogs?.filter(log => log.log_type === 'achievement').length || 0
    const categoryActivityCount = allLogs?.filter(log => log.log_type === 'activity' && log.category === category).length || 0
    const categoryAchievementCount = allLogs?.filter(log => log.log_type === 'achievement' && log.category === category).length || 0

    // 連続活動日数を計算
    const activityDates = allLogs?.map(log => log.activity_date) || []
    const streak = calculateStreak(activityDates)

    // streak が2以上のときだけ統計に含める（「1日連続」は不自然なため除外）
    const streakLine = streak >= 2
      ? `- 連続活動日数: ${streak}日（この数値は正確です。そのまま使ってください）\n`
      : ''

    const categoryLabel = CATEGORY_LABELS[category] || category

    // 今回が何回目かを計算（今回の投稿を含む）
    const currentCount = logType === 'achievement'
      ? categoryAchievementCount + 1
      : categoryActivityCount + 1

    // パターン分析用のコンパクトなログ（AIメッセージは別管理）
    const compactLogs = recentLogs?.map(log => ({
      d: log.activity_date,
      c: log.category,
      t: log.log_type,
      s: log.content.substring(0, 30),
    })) || []

    // 重複回避用：直近5件のAIメッセージのみ抽出
    const recentAiMessages = recentLogs
      ?.filter(log => log.ai_message)
      .slice(0, 5)
      .map(log => log.ai_message!.substring(0, 60)) || []

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

    // 統計ブロック：カテゴリ別と全体を明確に分離
    const statisticsBlock = `【今回の${categoryLabel}に関する統計】
- 今回は${categoryLabel}の${logType === 'achievement' ? '達成' : '活動'}記録で、通算${currentCount}回目です
${streakLine}
【全カテゴリの累計統計（参考情報・今回の記録には直接関係なし）】
- 全カテゴリ合計の活動ログ数: ${totalActivityCount}件
- 全カテゴリ合計の達成ログ数: ${totalAchievementCount}件`

    // 履歴をテキストテーブル形式に変換（JSONより読みやすい）
    const compactLogsFormatted = compactLogs.length > 0
      ? compactLogs.map(log =>
          `${log.d} | ${CATEGORY_LABELS[log.c] || log.c} | ${log.t === 'achievement' ? '達成' : '活動'} | ${log.s}`
        ).join('\n')
      : 'まだ過去の記録はありません'

    const recentAiMessagesFormatted = recentAiMessages.length > 0
      ? `\n【直近のAIメッセージ（同じ表現を避けること）】\n${recentAiMessages.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
      : ''

    // システムプロンプト：役割定義・厳守ルール・禁止事項
    const systemPrompt = `あなたは活動記録SNSアプリの励ましAIアシスタントです。ユーザーが活動や達成を記録したとき、パーソナライズされた短い励ましメッセージを生成します。

## あなたの役割
- ユーザーの活動を認め、称え、継続を励ます
- 統計データを正確に引用する
- 2〜3文で簡潔に応答する
- 日本語で記述し、絵文字を適度に使用する
${toneInstruction}

## 厳守すべきルール

### 数値の正確性
- 「今回の記録に関する統計」セクションの数値のみを、今回の活動に言及する際に使用すること
- 「全カテゴリの累計統計」の数値は、今回の特定カテゴリの回数としては絶対に使わないこと
- 例：筋トレが「通算5回目」と記載されているなら「5回目」と言うこと。全カテゴリ合計の活動ログ数が20件でも「20回目の筋トレ」とは絶対に言わないこと

### 連続日数について
- 連続活動日数が統計に含まれている場合のみ言及してよい
- 統計に連続活動日数が記載されていない場合、連続日数には一切触れないこと
- 「1日連続」という表現は日本語として不自然なので絶対に使わないこと

### 表現の多様性
- 直近のAIメッセージが提示されている場合、それらと同じフレーズや構文パターンを避けること
- 毎回異なる切り口で励ますこと（数値、習慣パターン、具体的な内容への共感など）

### 禁止事項
- ユーザーが記入していない情報を捏造しない
- 統計データを独自に計算・推測しない（提示された数値をそのまま使う）
- 3文を超えない
- 「連続」という言葉を、統計に連続日数の記載がないのに使わない`

    // ユーザープロンプト：リクエストごとの動的データ
    const userPrompt = `ユーザーが${logType === 'achievement' ? '達成' : '活動'}を記録しました。励ましメッセージを生成してください。
${userProfileContext}${userContext}
【今回の記録】
カテゴリ: ${categoryLabel}
内容: ${content}
タイプ: ${logType === 'achievement' ? '達成ログ' : '活動ログ'}${activityDurationMinutes ? `\n活動時間: ${activityDurationMinutes}分` : ''}

${statisticsBlock}

【最近の活動パターン（参考）】
${compactLogsFormatted}${recentAiMessagesFormatted}

${logType === 'achievement' ? 'この達成を祝福し次の目標に向けて励ます' : 'この活動を称え継続を励ます'}メッセージを2〜3文で生成してください。メッセージ本文のみ出力してください。`

    // Claude APIでメッセージ生成（フォールバック付き）
    const client = createAnthropicClient()
    const message = await createMessageWithFallback(client, {
      max_tokens: 250,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    const generatedMessage = message.content[0].type === 'text' ? message.content[0].text : ''

    // 生成したメッセージをログに保存
    if (logId && generatedMessage) {
      await supabase
        .from('activity_logs')
        .update({ ai_message: generatedMessage })
        .eq('id', logId)
        .eq('user_id', authenticatedUserId)
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
