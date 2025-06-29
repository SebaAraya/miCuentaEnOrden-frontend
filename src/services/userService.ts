import api from './api'
import type { ApiResponse, PaginatedResponse } from '@/types/auth'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'COLABORADOR' | 'USUARIO_BASICO'
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  organizationId?: string
  organization?: {
    id: string
    name: string
  }
}

export interface CreateUserRequest {
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'COLABORADOR' | 'USUARIO_BASICO'
  organizationId?: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  role?: 'ADMIN' | 'COLABORADOR' | 'USUARIO_BASICO'
  isActive?: boolean
  organizationId?: string
}

export interface UserFilters {
  search?: string
  role?: string
  isActive?: boolean
  organizationId?: string
  page?: number
  limit?: number
}

export interface UserStats {
  total: number
  active: number
  byRole: {
    ADMIN: number
    COLABORADOR: number
    USUARIO_BASICO: number
  }
  byOrganization: Record<string, number>
}

/**
 * Servicio para gestión de usuarios
 */
export class UserService {
  
  /**
   * Obtener lista de usuarios con filtros y paginación
   */
  static async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.role) params.append('role', filters.role)
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
    if (filters.organizationId) params.append('organizationId', filters.organizationId)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    
    const response = await api.get(`/users?${params.toString()}`)
    return response.data
  }

  /**
   * Obtener usuario específico por ID
   */
  static async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`)
    return response.data
  }

  /**
   * Crear nuevo usuario
   */
  static async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await api.post('/users', data)
    return response.data
  }

  /**
   * Actualizar usuario existente
   */
  static async updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  }

  /**
   * Cambiar rol de usuario
   */
  static async updateUserRole(
    id: string, 
    role: 'ADMIN' | 'COLABORADOR' | 'USUARIO_BASICO'
  ): Promise<ApiResponse<User>> {
    const response = await api.put(`/users/${id}/role`, { role })
    return response.data
  }

  /**
   * Activar/Desactivar usuario
   */
  static async toggleUserStatus(id: string, isActive: boolean): Promise<ApiResponse<User>> {
    const response = await api.put(`/users/${id}/status`, { isActive })
    return response.data
  }

  /**
   * Eliminar usuario (soft delete)
   */
  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/users/${id}`)
    return response.data
  }

  /**
   * Resetear contraseña de usuario
   */
  static async resetUserPassword(id: string): Promise<ApiResponse<{ temporaryPassword: string }>> {
    const response = await api.post(`/users/${id}/reset-password`)
    return response.data
  }

  /**
   * Obtener usuarios de una organización específica
   */
  static async getUsersByOrganization(
    organizationId: string,
    filters: Omit<UserFilters, 'organizationId'> = {}
  ): Promise<PaginatedResponse<User>> {
    return this.getUsers({ ...filters, organizationId })
  }

  /**
   * Obtener estadísticas de usuarios
   */
  static async getUserStats(): Promise<ApiResponse<UserStats>> {
    const response = await api.get('/users/stats')
    return response.data
  }

  /**
   * Mover usuario a otra organización
   */
  static async moveUserToOrganization(
    userId: string, 
    organizationId: string
  ): Promise<ApiResponse<User>> {
    const response = await api.put(`/users/${userId}/organization`, { organizationId })
    return response.data
  }

  /**
   * Validar email único
   */
  static async validateEmail(email: string, excludeUserId?: string): Promise<ApiResponse<{ isAvailable: boolean }>> {
    const params = new URLSearchParams()
    params.append('email', email)
    if (excludeUserId) params.append('excludeUserId', excludeUserId)
    
    const response = await api.get(`/users/validate-email?${params.toString()}`)
    return response.data
  }

  /**
   * Invitar usuario por email (envía invitación)
   */
  static async inviteUser(data: {
    email: string
    name: string
    role: 'ADMIN' | 'COLABORADOR' | 'USUARIO_BASICO'
    organizationId?: string
  }): Promise<ApiResponse<{ invitationId: string }>> {
    const response = await api.post('/users/invite', data)
    return response.data
  }

  /**
   * Reenviar invitación
   */
  static async resendInvitation(userId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/users/${userId}/resend-invitation`)
    return response.data
  }

  /**
   * Obtener perfil del usuario actual
   */
  static async getMyProfile(): Promise<ApiResponse<User>> {
    const response = await api.get('/users/me')
    return response.data
  }

  /**
   * Actualizar perfil del usuario actual
   */
  static async updateMyProfile(data: {
    name?: string
    email?: string
  }): Promise<ApiResponse<User>> {
    const response = await api.put('/users/me', data)
    return response.data
  }
}

export default UserService 