import api from './api'
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User, 
  ApiResponse 
} from '@/types/auth'

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken } = response.data.data
      api.setTokens(accessToken, refreshToken)
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Error en el login')
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData)
    
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken } = response.data.data
      api.setTokens(accessToken, refreshToken)
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Error en el registro')
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Error obteniendo usuario')
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await api.put<User>('/auth/me', userData)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Error actualizando perfil')
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch (error) {
      console.warn('Error durante logout:', error)
    } finally {
      api.clearTokens()
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await api.post('/auth/logout-all')
    } catch (error) {
      console.warn('Error durante logout completo:', error)
    } finally {
      api.clearTokens()
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken')
  }

  getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken')
    }
  }
}

export default new AuthService() 