'use client'

/**
 * API Client - Centralized HTTP client with interceptors
 * Handles authentication, error handling, and request management
 */

import axios, { AxiosError, AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores/auth.store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    try {
      const token = useAuthStore.getState().user?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error getting auth token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      try {
        useAuthStore.getState().logout()
      } catch (e) {
        console.error('Error logging out:', e)
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Auth API endpoints
 */
export async function loginUser(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export async function registerUser(username: string, email: string, password: string) {
  const response = await api.post('/auth/register', {
    username,
    email,
    password,
  })
  return response.data
}

export async function verifyToken(token: string) {
  const response = await api.post('/auth/verify', { token })
  return response.data
}

/**
 * Match API endpoints
 */
export async function createMatch(entryFee: number) {
  const response = await api.post('/matches', { entryFee })
  return response.data
}

export async function joinMatch(matchId: string) {
  const response = await api.post(`/matches/${matchId}/join`)
  return response.data
}

export async function getMatch(matchId: string) {
  const response = await api.get(`/matches/${matchId}`)
  return response.data
}

export async function placeBid(matchId: string, bidAmount: number) {
  const response = await api.post(`/matches/${matchId}/bid`, {
    bidAmount,
  })
  return response.data
}

export async function getMatches(page = 1, limit = 10) {
  const response = await api.get(`/matches?page=${page}&limit=${limit}`)
  return response.data
}

/**
 * Wallet API endpoints
 */
export async function getWallet() {
  const response = await api.get('/wallet')
  return response.data
}

export async function depositFunds(amount: number, provider: string) {
  const response = await api.post('/wallet/deposit', {
    amount,
    provider,
  })
  return response.data
}

export async function withdrawFunds(amount: number, destination: string) {
  const response = await api.post('/wallet/withdraw', {
    amount,
    destination,
  })
  return response.data
}

export async function getTransactions(page = 1, limit = 10) {
  const response = await api.get(`/wallet/transactions?page=${page}&limit=${limit}`)
  return response.data
}

/**
 * User API endpoints
 */
export async function getProfile() {
  const response = await api.get('/user/profile')
  return response.data
}

export async function updateProfile(data: any) {
  const response = await api.put('/user/profile', data)
  return response.data
}

export async function getLeaderboard(page = 1, limit = 10) {
  const response = await api.get(`/user/leaderboard?page=${page}&limit=${limit}`)
  return response.data
}

export async function getMatchHistory(page = 1, limit = 10) {
  const response = await api.get(`/user/matches?page=${page}&limit=${limit}`)
  return response.data
}

/**
 * useAPI - Hook for making custom API requests
 */
import { useCallback } from 'react'

interface ApiResponse<T = any> {
  data: T
  status: number
  message?: string
}

export function useAPI() {
  const get = useCallback(async <T = any>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await api.get<T>(url)
      return {
        data: response.data,
        status: response.status,
      }
    } catch (error) {
      const err = error as AxiosError
      console.error('API GET error:', err)
      throw {
        status: err.response?.status || 500,
        message: err.response?.data || err.message,
      }
    }
  }, [])

  const post = useCallback(async <T = any>(url: string, data: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.post<T>(url, data)
      return {
        data: response.data,
        status: response.status,
      }
    } catch (error) {
      const err = error as AxiosError
      console.error('API POST error:', err)
      throw {
        status: err.response?.status || 500,
        message: err.response?.data || err.message,
      }
    }
  }, [])

  const put = useCallback(async <T = any>(url: string, data: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.put<T>(url, data)
      return {
        data: response.data,
        status: response.status,
      }
    } catch (error) {
      const err = error as AxiosError
      console.error('API PUT error:', err)
      throw {
        status: err.response?.status || 500,
        message: err.response?.data || err.message,
      }
    }
  }, [])

  const del = useCallback(async <T = any>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await api.delete<T>(url)
      return {
        data: response.data,
        status: response.status,
      }
    } catch (error) {
      const err = error as AxiosError
      console.error('API DELETE error:', err)
      throw {
        status: err.response?.status || 500,
        message: err.response?.data || err.message,
      }
    }
  }, [])

  return { get, post, put, delete: del }
}
