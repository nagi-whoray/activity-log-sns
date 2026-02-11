import Image from 'next/image'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/recowork-logo.png"
            alt="Recowork"
            width={120}
            height={120}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight">Recowork</h1>
          <p className="text-muted-foreground mt-2">
            日々頑張る人たちのSNS
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
