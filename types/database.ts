export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// 活動カテゴリの型
export type ActivityCategory = 'workout' | 'study' | 'beauty' | 'meal' | 'work' | 'dev'

// カテゴリの日本語ラベル
export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  workout: '運動',
  study: '勉強',
  beauty: '美容',
  meal: '食事',
  work: '仕事',
  dev: '開発',
}

// ログタイプの型（活動ログ/達成ログ）
export type LogType = 'activity' | 'achievement'

// ログタイプの日本語ラベル
export const LOG_TYPE_LABELS: Record<LogType, string> = {
  activity: '活動ログ',
  achievement: '達成ログ',
}

// 通知タイプの型
export type NotificationType = 'like' | 'comment' | 'follow'

// 通知タイプの日本語ラベル
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  like: 'いいね',
  comment: 'コメント',
  follow: 'フォロー',
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          background_url: string | null
          goal: string | null
          ai_prompt: string | null
          ai_tone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          background_url?: string | null
          goal?: string | null
          ai_prompt?: string | null
          ai_tone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          background_url?: string | null
          goal?: string | null
          ai_prompt?: string | null
          ai_tone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          category: ActivityCategory
          title: string
          content: string
          activity_date: string
          activity_duration_minutes: number | null
          image_url: string | null
          is_image_private: boolean
          log_type: LogType
          ai_message: string | null
          routine_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: ActivityCategory
          title: string
          content: string
          activity_date?: string
          activity_duration_minutes?: number | null
          image_url?: string | null
          is_image_private?: boolean
          log_type?: LogType
          ai_message?: string | null
          routine_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: ActivityCategory
          title?: string
          content?: string
          activity_date?: string
          activity_duration_minutes?: number | null
          image_url?: string | null
          is_image_private?: boolean
          log_type?: LogType
          ai_message?: string | null
          routine_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          activity_log_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          activity_log_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          activity_log_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          activity_log_id: string
          user_id: string
          content: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          activity_log_id: string
          user_id: string
          content: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          activity_log_id?: string
          user_id?: string
          content?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      ogp_cache: {
        Row: {
          id: string
          url: string
          title: string | null
          description: string | null
          image_url: string | null
          site_name: string | null
          favicon_url: string | null
          fetched_at: string
          expires_at: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          title?: string | null
          description?: string | null
          image_url?: string | null
          site_name?: string | null
          favicon_url?: string | null
          fetched_at?: string
          expires_at?: string
          error_message?: string | null
          created_at?: string
        }
        Update: {
          url?: string
          title?: string | null
          description?: string | null
          image_url?: string | null
          site_name?: string | null
          favicon_url?: string | null
          fetched_at?: string
          expires_at?: string
          error_message?: string | null
        }
      }
      user_items: {
        Row: {
          id: string
          user_id: string
          product_name: string
          product_url: string | null
          usage_method: string | null
          started_at: string
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_name: string
          product_url?: string | null
          usage_method?: string | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_name?: string
          product_url?: string | null
          usage_method?: string | null
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_routines: {
        Row: {
          id: string
          user_id: string
          title: string
          category: ActivityCategory
          duration_minutes: number | null
          content: string | null
          started_at: string
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category: ActivityCategory
          duration_minutes?: number | null
          content?: string | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: ActivityCategory
          duration_minutes?: number | null
          content?: string | null
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          type: NotificationType
          activity_log_id: string | null
          comment_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id: string
          type: NotificationType
          activity_log_id?: string | null
          comment_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
    }
    Views: {
      activity_logs_with_counts: {
        Row: {
          id: string
          user_id: string
          category: ActivityCategory
          title: string
          content: string
          activity_date: string
          activity_duration_minutes: number | null
          image_url: string | null
          is_image_private: boolean
          log_type: LogType
          ai_message: string | null
          created_at: string
          updated_at: string
          username: string
          display_name: string | null
          avatar_url: string | null
          likes_count: number
          comments_count: number
        }
      }
    }
    Enums: {
      activity_category: ActivityCategory
    }
  }
}

// 便利なエイリアス型
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']
export type ActivityLogUpdate = Database['public']['Tables']['activity_logs']['Update']

export type Like = Database['public']['Tables']['likes']['Row']
export type LikeInsert = Database['public']['Tables']['likes']['Insert']

export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']
export type CommentUpdate = Database['public']['Tables']['comments']['Update']

export type Follow = Database['public']['Tables']['follows']['Row']
export type FollowInsert = Database['public']['Tables']['follows']['Insert']

export type OgpCache = Database['public']['Tables']['ogp_cache']['Row']
export type OgpCacheInsert = Database['public']['Tables']['ogp_cache']['Insert']
export type OgpCacheUpdate = Database['public']['Tables']['ogp_cache']['Update']

export type UserItem = Database['public']['Tables']['user_items']['Row']
export type UserItemInsert = Database['public']['Tables']['user_items']['Insert']
export type UserItemUpdate = Database['public']['Tables']['user_items']['Update']

export type UserRoutine = Database['public']['Tables']['user_routines']['Row']
export type UserRoutineInsert = Database['public']['Tables']['user_routines']['Insert']
export type UserRoutineUpdate = Database['public']['Tables']['user_routines']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type ActivityLogWithCounts = Database['public']['Views']['activity_logs_with_counts']['Row']

// JOINを含む型
export type ActivityLogWithProfile = ActivityLog & {
  profiles: Profile
}

export type ActivityLogWithAll = ActivityLog & {
  profiles: Profile
  likes: Like[]
  comments: (Comment & { profiles: Profile })[]
  routine: { id: string; title: string } | null
}

export type CommentWithProfile = Comment & {
  profiles: Profile
}

// 通知のJOIN型
export type NotificationWithDetails = Notification & {
  actor: Profile
  activity_log?: ActivityLog & { profiles: Profile }
}

// ページネーション用の型
export interface PaginatedResponse<T> {
  logs: T[]
  nextCursor: string | null
  hasMore: boolean
}

export interface ActivityLogFilters {
  tab: 'all' | 'following' | 'activity' | 'achievement'
  category: ActivityCategory | null
  userId?: string
  date?: string
}
