/**
 * Auth module types
 */

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    username: string
    isGuest: boolean
  }
  token: string
  refreshToken: string
}

export interface GuestSessionResponse {
  user: {
    id: string
    username: string
    isGuest: true
  }
  token: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
}
