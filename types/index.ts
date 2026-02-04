import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']

export type ActivityLogWithProfile = ActivityLog & {
  profiles: Profile
}

export type ActivityLogWithAll = ActivityLog & {
  profiles: Profile
  likes: Like[]
  comments: CommentWithProfile[]
  user_has_liked?: boolean
}

export type CommentWithProfile = Comment & {
  profiles: Profile
}

// 後方互換性のため（既存コードで使用されている場合）
export type Post = Database['public']['Tables']['activity_logs']['Row']
export type PostWithProfile = ActivityLogWithProfile
