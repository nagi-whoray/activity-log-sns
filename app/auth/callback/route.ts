import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('🔐 Auth Callback - Code present:', !!code)

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('🔐 Auth Callback - Session exchange error:', error?.message)
    console.log('🔐 Auth Callback - Session established:', !!sessionData?.session)

    if (!error && sessionData?.session) {
      // 新規ユーザーの場合、display_nameがNULLならAI名前生成
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('🔐 Auth Callback - User ID:', user?.id)

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', user.id)
            .single()

          console.log('🔐 Auth Callback - Profile:', JSON.stringify(profile))

          // display_nameがNULL、またはusername(メールプレフィックス)と同じ場合は名前を生成
          const emailPrefix = user.email?.split('@')[0]
          const needsNameGeneration = profile && (
            !profile.display_name ||
            profile.display_name === profile.username ||
            profile.display_name === emailPrefix
          )

          console.log('🔐 Auth Callback - Needs name generation:', needsNameGeneration)

          if (needsNameGeneration) {
            // iOSと同じく/api/generate-nameを呼び出す
            const accessToken = sessionData.session.access_token
            console.log('🔐 Auth Callback - Calling generate-name API with token length:', accessToken.length)

            const apiUrl = `${origin}/api/generate-name`
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ userId: user.id }),
            })

            const result = await response.json()
            console.log('🔐 Auth Callback - Generate name result:', JSON.stringify(result))
          }
        }
      } catch (nameError) {
        // 名前生成に失敗しても認証は成功とする
        console.error('🔐 Auth Callback - Name generation error:', nameError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // エラーの場合はログインページにリダイレクト
  console.log('🔐 Auth Callback - Redirecting to login due to error')
  return NextResponse.redirect(`${origin}/login`)
}
