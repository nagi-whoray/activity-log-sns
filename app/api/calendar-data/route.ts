import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    )
  }

  // 全期間のカレンダーデータを取得
  const { data: activityDateRows, error } = await supabase
    .from('activity_logs')
    .select('activity_date, category, log_type')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching calendar data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }

  // activityDateMapを構築
  const activityDateMap: Record<string, { categories: string[], hasAchievement: boolean }> = {}
  for (const r of activityDateRows || []) {
    if (!activityDateMap[r.activity_date]) {
      activityDateMap[r.activity_date] = { categories: [], hasAchievement: false }
    }
    if (!activityDateMap[r.activity_date].categories.includes(r.category)) {
      activityDateMap[r.activity_date].categories.push(r.category)
    }
    if (r.log_type === 'achievement') {
      activityDateMap[r.activity_date].hasAchievement = true
    }
  }

  return NextResponse.json({ activityDateMap })
}
