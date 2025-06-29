export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  organizationId?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  preferences?: any
  organization?: Organization
}

export interface Organization {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  settings?: any
}

export enum UserRole {
  ADMIN = 'ADMIN',
  COLABORADOR = 'COLABORADOR',
  USUARIO_BASICO = 'USUARIO_BASICO'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  organizationId?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
} 