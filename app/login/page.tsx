import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Recowork</h1>
          <p className="text-muted-foreground mt-2">
            毎日の活動を記録して共有しよう
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
