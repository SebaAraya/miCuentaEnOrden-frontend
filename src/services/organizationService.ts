import api from './api'
import type { ApiResponse, PaginatedResponse } from '@/types/auth'

export interface Organization {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  settings?: Record<string, any>
  users?: User[]
  _count?: {
    users: number
    categories: number
  }
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  organization?: {
    id: string
    name: string
  }
}

export interface CreateOrganizationRequest {
  name: string
  description?: string
  settings?: Record<string, any>
}

export interface UpdateOrganizationRequest {
  name?: string
  description?: string
  settings?: Record<string, any>
}

export interface OrganizationFilters {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface OrganizationStats {
  id: string
  name: string
  userCount: number
  activeUserCount: number
  categoryCount: number
  transactionCount: number
  totalTransactions: number
}

/**
 * Servicio para gestión de organizaciones
 */
export class OrganizationService {
  
  /**
   * Obtener lista de organizaciones con filtros y paginación
   */
  static async getOrganizations(filters: OrganizationFilters = {}): Promise<PaginatedResponse<Organization>> {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    
    const response = await api.get(`/organizations?${params.toString()}`)
    return response.data
  }

  /**
   * Obtener organización específica por ID
   */
  static async getOrganizationById(id: string): Promise<ApiResponse<Organization>> {
    const response = await api.get(`/organizations/${id}`)
    return response.data
  }

  /**
   * Crear nueva organización
   */
  static async createOrganization(data: CreateOrganizationRequest): Promise<ApiResponse<Organization>> {
    const response = await api.post('/organizations', data)
    return response.data
  }

  /**
   * Actualizar organización existente
   */
  static async updateOrganization(
    id: string, 
    data: UpdateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    const response = await api.put(`/organizations/${id}`, data)
    return response.data
  }

  /**
   * Desactivar organización (soft delete)
   */
  static async deleteOrganization(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/organizations/${id}`)
    return response.data
  }

  /**
   * Obtener usuarios de una organización
   */
  static async getOrganizationUsers(
    id: string, 
    filters: { page?: number; limit?: number; role?: string; isActive?: boolean } = {}
  ): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.role) params.append('role', filters.role)
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
    
    const response = await api.get(`/organizations/${id}/users?${params.toString()}`)
    return response.data
  }

  /**
   * Cambiar rol de usuario en organización
   */
  static async updateUserRole(
    organizationId: string,
    userId: string,
    role: string
  ): Promise<ApiResponse<User>> {
    const response = await api.put(`/organizations/${organizationId}/users/${userId}/role`, { role })
    return response.data
  }

  /**
   * Obtener estadísticas de organización
   */
  static async getOrganizationStats(id: string): Promise<ApiResponse<OrganizationStats>> {
    const response = await api.get(`/organizations/${id}/stats`)
    return response.data
  }

  /**
   * Obtener todas las organizaciones para selects/dropdowns (sin paginación)
   */
  static async getAllOrganizations(): Promise<ApiResponse<Organization[]>> {
    const response = await api.get('/organizations?limit=1000')
    return {
      success: response.data.success,
      data: response.data.data?.organizations || [],
      message: response.data.message
    }
  }
}

export default OrganizationService 