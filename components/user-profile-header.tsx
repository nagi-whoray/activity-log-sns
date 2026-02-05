import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FollowButton } from '@/components/follow-button'

interface UserProfileHeaderProps {
  profile: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    background_url: string | null
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
    <Card className="overflow-hidden">
      {/* 背景画像 */}
      <div className="relative w-full h-36">
        {profile.background_url ? (
          <Image
            src={profile.background_url}
            alt="背景画像"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500" />
        )}
      </div>

      <CardContent className="relative pt-0">
        {/* アイコン画像（背景画像に重なる位置） */}
        <div className="-mt-10 mb-3">
          <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
                {displayName[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </div>

        {/* ユーザー情報 */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{displayName}</h2>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
          {isOwnProfile ? (
            <Link href="/profile/edit">
              <Button variant="outline" size="sm">
                プロフィール編集
              </Button>
            </Link>
          ) : (
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
      </CardContent>
    </Card>
  )
}
