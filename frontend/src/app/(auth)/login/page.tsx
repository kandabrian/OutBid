'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, Button, Input } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { setUser, setToken } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ form: data.error?.message || 'Login failed. Please try again.' })
        return
      }

      setToken(data.token)
      setUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        isGuest: false,
      })

      router.push('/wallet')
    } catch (err) {
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px-200px)] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Card title="Sign In" description="Access your OutBid account">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm">{errors.form}</p>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              error={errors.email}
              disabled={isLoading}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              error={errors.password}
              disabled={isLoading}
              required
            />

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
            <p className="text-sm text-slate-400 text-center">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300">
                Create one
              </Link>
            </p>
            <Link href="/">
              <Button variant="ghost" size="lg" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}