'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        alert('確認メールを送信しました。メールをご確認ください。')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // ログイン成功後、名前生成が必要かチェック
        if (data.session) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, username')
              .eq('id', data.user.id)
              .single()

            const emailPrefix = email.split('@')[0]
            const needsNameGeneration = profile && (
              !profile.display_name ||
              profile.display_name === profile.username ||
              profile.display_name === emailPrefix
            )

            if (needsNameGeneration) {
              // iOSと同じくBearerトークンで名前生成APIを呼び出し
              await fetch('/api/generate-name', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${data.session.access_token}`,
                },
                body: JSON.stringify({ userId: data.user.id }),
              })
            }
          } catch (nameError) {
            console.error('Name generation error:', nameError)
            // 名前生成に失敗してもログインは成功とする
          }
        }

        router.push('/')
        router.refresh()
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'エラーが発生しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isSignUp ? 'アカウント登録' : 'ログイン'}</CardTitle>
        <CardDescription>
          {isSignUp
            ? 'メールアドレスとパスワードでアカウントを作成'
            : 'メールアドレスとパスワードでログイン'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          {isSignUp && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                disabled={loading}
              />
              <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                <a href="/terms" target="_blank" className="text-blue-600 underline hover:text-blue-800">利用規約</a>
                および
                <a href="/privacy" target="_blank" className="text-blue-600 underline hover:text-blue-800">プライバシーポリシー</a>
                に同意する
              </label>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading || (isSignUp && !agreedToTerms)}>
            {loading ? '処理中...' : isSignUp ? 'アカウント登録' : 'ログイン'}
          </Button>
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setAgreedToTerms(false) }}
            className="text-sm text-muted-foreground hover:text-foreground"
            disabled={loading}
          >
            {isSignUp
              ? 'すでにアカウントをお持ちの方はこちら'
              : 'アカウントをお持ちでない方はこちら'}
          </button>
        </CardFooter>
      </form>
    </Card>
  )
}
