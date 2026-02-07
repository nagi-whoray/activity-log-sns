import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { TabType } from '@/components/timeline-tabs'
import { ActivityCategory } from '@/types/database'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const cursor = searchParams.get('cursor')
  const tab = (searchParams.get('tab') || 'all') as TabType
  const category = searchParams.get('category') as ActivityCategory | null
  const userId = searchParams.get('userId')
  const date = searchParams.get('date')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // フォロー中のユーザーIDを取得（followingタブの場合のみ）
  let followingIds: string[] = []
  if (tab === 'following' && user) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    followingIds = (follows || []).map((f) => f.following_id)

    // フォロー中のユーザーがいない場合は空配列を返す
    if (followingIds.length === 0) {
      return NextResponse.json({
        logs: [],
        nextCursor: null,
        hasMore: false,
      })
    }
  }

  // クエリを構築
  let query = supabase
    .from('activity_logs')
    .select(`
      *,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      ),
      likes (
        id,
        user_id,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        )
      ),
      comments (
        id,
        content,
        created_at,
        user_id,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1) // 1件多く取得してhasMoreを判定

  // カーソルベースのページネーション
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  // ユーザーIDでフィルタリング（プロフィールページ用）
  if (userId) {
    query = query.eq('user_id', userId)
  }

  // タブでフィルタリング
  if (tab === 'following') {
    query = query.in('user_id', followingIds)
  } else if (tab === 'activity') {
    query = query.eq('log_type', 'activity')
  } else if (tab === 'achievement') {
    query = query.eq('log_type', 'achievement')
  }

  // カテゴリでフィルタリング
  if (category) {
    query = query.eq('category', category)
  }

  // 日付でフィルタリング（プロフィールページのカレンダー用）
  if (date) {
    query = query.eq('activity_date', date)
  }

  const { data: logs, error } = await query

  if (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }

  // hasMoreを判定し、余分な1件を削除
  const hasMore = (logs?.length || 0) > PAGE_SIZE
  const resultLogs = hasMore ? logs?.slice(0, PAGE_SIZE) : logs

  // 次のカーソルを取得
  const nextCursor = hasMore && resultLogs && resultLogs.length > 0
    ? resultLogs[resultLogs.length - 1].created_at
    : null

  return NextResponse.json({
    logs: resultLogs || [],
    nextCursor,
    hasMore,
  })
}
