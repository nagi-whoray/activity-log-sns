import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Post {
  id: string
  content: string
  created_at: string
  profiles: {
    id: string
    username: string
    avatar_url: string | null
  } | null
}

interface PostListProps {
  posts: Post[]
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">まだ投稿がありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {post.profiles?.username || 'Unknown User'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(post.created_at).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{post.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
