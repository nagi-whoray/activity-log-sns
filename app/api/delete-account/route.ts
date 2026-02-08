import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
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
          { error: '認証に失敗しました' },
          { status: 401 }
        )
      }

      authenticatedUserId = user.id
    } else {
      // Webアプリ: クッキーベースのセッション
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: '認証が必要です' },
          { status: 401 }
        )
      }

      authenticatedUserId = user.id
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'ユーザーIDが取得できません' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Starting account deletion for user: ${authenticatedUserId}`)

    // Admin権限を持つクライアントを作成（Auth削除に必要）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase admin credentials')
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      )
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Storage: プロフィール画像を削除 (profiles/{user_id}/*)
    console.log('📁 Deleting profile images...')
    const { data: profileFiles } = await adminClient.storage
      .from('activity-images')
      .list(`profiles/${authenticatedUserId}`)

    if (profileFiles && profileFiles.length > 0) {
      const profilePaths = profileFiles.map(file => `profiles/${authenticatedUserId}/${file.name}`)
      await adminClient.storage
        .from('activity-images')
        .remove(profilePaths)
    }

    // 2. Storage: 投稿画像を削除 ({user_id}/*)
    console.log('📁 Deleting activity images...')
    const { data: activityFiles } = await adminClient.storage
      .from('activity-images')
      .list(authenticatedUserId)

    if (activityFiles && activityFiles.length > 0) {
      const activityPaths = activityFiles.map(file => `${authenticatedUserId}/${file.name}`)
      await adminClient.storage
        .from('activity-images')
        .remove(activityPaths)
    }

    // 3. 自分の投稿に対するいいね・コメントを取得するため、投稿IDを取得
    console.log('📝 Fetching user activity log IDs...')
    const { data: activityLogs } = await adminClient
      .from('activity_logs')
      .select('id')
      .eq('user_id', authenticatedUserId)

    const activityLogIds = activityLogs?.map(log => log.id) || []

    // 4. likes: 自分がしたいいねを削除
    console.log('❤️ Deleting likes made by user...')
    await adminClient
      .from('likes')
      .delete()
      .eq('user_id', authenticatedUserId)

    // 5. likes: 自分の投稿へのいいねを削除
    if (activityLogIds.length > 0) {
      console.log('❤️ Deleting likes on user posts...')
      await adminClient
        .from('likes')
        .delete()
        .in('activity_log_id', activityLogIds)
    }

    // 6. comments: 自分がしたコメントを削除
    console.log('💬 Deleting comments made by user...')
    await adminClient
      .from('comments')
      .delete()
      .eq('user_id', authenticatedUserId)

    // 7. comments: 自分の投稿へのコメントを削除
    if (activityLogIds.length > 0) {
      console.log('💬 Deleting comments on user posts...')
      await adminClient
        .from('comments')
        .delete()
        .in('activity_log_id', activityLogIds)
    }

    // 8. follows: フォロー関係を削除（フォローしている・されている両方）
    console.log('👥 Deleting follow relationships...')
    await adminClient
      .from('follows')
      .delete()
      .or(`follower_id.eq.${authenticatedUserId},following_id.eq.${authenticatedUserId}`)

    // 9. activity_logs: 投稿を削除
    console.log('📝 Deleting activity logs...')
    await adminClient
      .from('activity_logs')
      .delete()
      .eq('user_id', authenticatedUserId)

    // 10. user_routines: ルーティンを削除
    console.log('🔄 Deleting user routines...')
    await adminClient
      .from('user_routines')
      .delete()
      .eq('user_id', authenticatedUserId)

    // 11. user_items: アイテムを削除
    console.log('📦 Deleting user items...')
    await adminClient
      .from('user_items')
      .delete()
      .eq('user_id', authenticatedUserId)

    // 12. profiles: プロフィールを削除
    console.log('👤 Deleting profile...')
    await adminClient
      .from('profiles')
      .delete()
      .eq('id', authenticatedUserId)

    // 13. Supabase Auth: ユーザーを削除
    console.log('🔐 Deleting auth user...')
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
      authenticatedUserId
    )

    if (authDeleteError) {
      console.error('Auth delete error:', authDeleteError)
      return NextResponse.json(
        { error: 'アカウントの削除に失敗しました' },
        { status: 500 }
      )
    }

    console.log(`✅ Account deletion completed for user: ${authenticatedUserId}`)

    return NextResponse.json({ success: true, message: 'アカウントが削除されました' })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'アカウントの削除中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
