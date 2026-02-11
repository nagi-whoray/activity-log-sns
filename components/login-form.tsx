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
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (isSignUp) {
        setLoadingMessage('アカウントを作成中...')
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        // 登録成功 → ログイン画面に切り替え
        setIsSignUp(false)
        setAgreedToTerms(false)
        setSuccessMessage('確認メールを送信しました。メールを確認後、ログインしてください。')
        setPassword('')
        setLoading(false)
        setLoadingMessage(null)
      } else {
        setLoadingMessage('ログイン中...')
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // ログイン成功後、名前生成が必要かチェック
        if (data.session) {
          try {
            // プロフィールが作成されるまで少し待つ（新規ユーザーの場合DBトリガーのタイミング）
            let profile = null
            for (let attempt = 0; attempt < 3; attempt++) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('display_name, username')
                .eq('id', data.user.id)
                .single()

              if (profileData) {
                profile = profileData
                break
              }
              // プロフィールが見つからない場合、少し待ってリトライ
              await new Promise(resolve => setTimeout(resolve, 1000))
            }

            const emailPrefix = email.split('@')[0]
            const needsNameGeneration = !profile || (
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
      setLoading(false)
      setLoadingMessage(null)
    }
  }

  return (
    <div className="relative">
      {/* 処理中オーバーレイ */}
      {loading && loadingMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            <p className="text-sm font-medium text-gray-700">{loadingMessage}</p>
          </div>
        </div>
      )}
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
            {successMessage && (
              <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md">
                {successMessage}
              </div>
            )}
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
            onClick={() => { setIsSignUp(!isSignUp); setAgreedToTerms(false); setSuccessMessage(null); setError(null) }}
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
    </div>
  )
}
