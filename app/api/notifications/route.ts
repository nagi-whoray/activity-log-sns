import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    let query = supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey (
          id, username, display_name, avatar_url
        ),
        activity_log:activity_logs (
          id, content, category, profiles (id, username, display_name)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1)

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('通知取得エラー:', error)
      return NextResponse.json({ error: '通知の取得に失敗しました' }, { status: 500 })
    }

    const hasMore = (notifications?.length || 0) > PAGE_SIZE
    const result = hasMore ? notifications?.slice(0, PAGE_SIZE) : notifications
    const nextCursor = hasMore && result?.length ? result[result.length - 1].created_at : null

    return NextResponse.json({
      notifications: result || [],
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error('通知API エラー:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
