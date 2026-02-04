import { Card, CardContent } from '@/components/ui/card'
import { FollowButton } from '@/components/follow-button'

interface UserProfileHeaderProps {
  profile: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
  }
  postCount: number
  followerCount: number
  followingCount: number
  isOwnProfile: boolean
  currentUserId: string | null
  isFollowing: boolean
}

export function UserProfileHeader({
  profile,
  postCount,
  followerCount,
  followingCount,
  isOwnProfile,
  currentUserId,
  isFollowing,
}: UserProfileHeaderProps) {
  const displayName = profile.display_name || profile.username

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold shrink-0">
            {displayName[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{displayName}</h2>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
              {!isOwnProfile && (
                <FollowButton
                  targetUserId={profile.id}
                  currentUserId={currentUserId}
                  isFollowing={isFollowing}
                />
              )}
            </div>
            {profile.bio && (
              <p className="mt-2 text-sm text-gray-700">{profile.bio}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span><span className="font-semibold text-foreground">{postCount}</span> 投稿</span>
              <span><span className="font-semibold text-foreground">{followerCount}</span> フォロワー</span>
              <span><span className="font-semibold text-foreground">{followingCount}</span> フォロー中</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
