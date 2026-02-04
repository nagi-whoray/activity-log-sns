import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']

export type PostWithProfile = Post & {
  profiles: Profile
}
