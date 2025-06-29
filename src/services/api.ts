import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types/auth'

const API_BASE_URL = 'http://localhost:3000/api/v1'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })

    // Request interceptor para agregar token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor para manejo de errores
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken)
              const { accessToken } = response.data.data
              
              localStorage.setItem('accessToken', accessToken)
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
              
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            // Si el refresh falla, limpiar tokens y redirigir al login
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private async refreshToken(refreshToken: string): Promise<AxiosResponse<ApiResponse>> {
    return axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
  }

  // Métodos públicos
  async get<T>(url: string): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.get(url)
  }

  async post<T>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.post(url, data)
  }

  async put<T>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.put(url, data)
  }

  async delete<T>(url: string): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.delete(url)
  }

  // Método para limpiar tokens
  clearTokens(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  // Método para establecer tokens
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }
}

export default new ApiService() 