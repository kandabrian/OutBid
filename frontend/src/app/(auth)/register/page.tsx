'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, Button, Input, Checkbox } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'

interface FormErrors {
  [key: string]: string
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useAuthStore()

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms'
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock registration
      setUser({
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        username: formData.username,
        email: formData.email,
        isGuest: false,
      })

      console.log('Registration successful')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px-200px)] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Card title="Create Account" description="Join OutBid and start playing">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              value={formData.username}
              onChange={handleInputChange}
              name="username"
              placeholder="Choose a username"
              error={errors.username}
              disabled={isLoading}
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              name="email"
              placeholder="you@example.com"
              error={errors.email}
              disabled={isLoading}
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              name="password"
              placeholder="At least 8 characters"
              error={errors.password}
              disabled={isLoading}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              name="confirmPassword"
              placeholder="Repeat password"
              error={errors.confirmPassword}
              disabled={isLoading}
              required
            />

            {/* Terms Agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="mt-1"
                disabled={isLoading}
              />
              <label htmlFor="terms" className="text-sm text-slate-400">
                I agree to the{' '}
                <a href="#" className="text-indigo-400 hover:text-indigo-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-indigo-400 hover:text-indigo-300">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-400">{errors.agreeToTerms}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 text-center">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
