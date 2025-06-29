import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/authService'
import type { User, LoginRequest, RegisterRequest } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Selección de organización global
  const selectedOrganizationId = ref<string | null>(null)
  const availableOrganizations = ref<any[]>([])

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const userRole = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.name || '')
  const userEmail = computed(() => user.value?.email || '')
  const requiresOrganizationSelection = computed(() => {
    return (userRole.value === 'ADMIN' || userRole.value === 'COLABORADOR') && 
           availableOrganizations.value.length > 0 &&
           !selectedOrganizationId.value
  })
  const selectedOrganization = computed(() => {
    return availableOrganizations.value.find(org => org.id === selectedOrganizationId.value) || null
  })
  const canSelectOrganization = computed(() => {
    return (userRole.value === 'ADMIN' || userRole.value === 'COLABORADOR') && 
           availableOrganizations.value.length > 0
  })

  // Actions
  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null
    
    try {
      const authResponse = await authService.login(credentials)
      
      user.value = authResponse.user
      accessToken.value = authResponse.accessToken
      refreshToken.value = authResponse.refreshToken
      
      return authResponse
    } catch (err: any) {
      error.value = err.message || 'Error en el login'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function register(userData: RegisterRequest) {
    isLoading.value = true
    error.value = null
    
    try {
      const authResponse = await authService.register(userData)
      
      user.value = authResponse.user
      accessToken.value = authResponse.accessToken
      refreshToken.value = authResponse.refreshToken
      
      return authResponse
    } catch (err: any) {
      error.value = err.message || 'Error en el registro'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function getCurrentUser() {
    if (!authService.isAuthenticated()) {
      return null
    }

    isLoading.value = true
    error.value = null
    
    try {
      const userData = await authService.getCurrentUser()
      user.value = userData
      return userData
    } catch (err: any) {
      error.value = err.message || 'Error obteniendo usuario'
      await logout() // Si hay error, hacer logout
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(userData: Partial<User>) {
    isLoading.value = true
    error.value = null
    
    try {
      const updatedUser = await authService.updateProfile(userData)
      user.value = updatedUser
      return updatedUser
    } catch (err: any) {
      error.value = err.message || 'Error actualizando perfil'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    
    try {
      await authService.logout()
    } catch (err) {
      console.warn('Error durante logout:', err)
    } finally {
      // Limpiar estado local
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      selectedOrganizationId.value = null
      availableOrganizations.value = []
      error.value = null
      isLoading.value = false
      
      // Limpiar localStorage
      localStorage.removeItem('selectedOrganizationId')
    }
  }

  async function logoutAll() {
    isLoading.value = true
    
    try {
      await authService.logoutAll()
    } catch (err) {
      console.warn('Error durante logout completo:', err)
    } finally {
      // Limpiar estado local
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      selectedOrganizationId.value = null
      availableOrganizations.value = []
      error.value = null
      isLoading.value = false
      
      // Limpiar localStorage
      localStorage.removeItem('selectedOrganizationId')
    }
  }

  function initializeAuth() {
    const tokens = authService.getStoredTokens()
    if (tokens.accessToken && tokens.refreshToken) {
      accessToken.value = tokens.accessToken
      refreshToken.value = tokens.refreshToken
      // Intentar obtener usuario actual
      getCurrentUser().catch(() => {
        // Si falla, limpiar tokens
        logout()
      })
    }
  }

  async function fetchAvailableOrganizations() {
    if (!isAuthenticated.value) return

    try {
      const response = await fetch('/api/v1/users/me/organizations', {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        availableOrganizations.value = data.data || []
        
        // Intentar cargar selección persistida
        const savedOrgId = localStorage.getItem('selectedOrganizationId')
        const validSavedOrg = availableOrganizations.value.find(org => org.id === savedOrgId)
        
        if (validSavedOrg) {
          selectedOrganizationId.value = savedOrgId
        } else if (availableOrganizations.value.length === 1) {
          // Auto-seleccionar la primera organización si solo hay una
          selectOrganization(availableOrganizations.value[0].id)
        } else if (userRole.value === 'COLABORADOR' && user.value?.organizationId) {
          // Para COLABORADOR, auto-seleccionar su organización
          selectOrganization(user.value.organizationId)
        }
      }
    } catch (err) {
      console.error('Error fetching organizations:', err)
    }
  }

  function selectOrganization(organizationId: string | null) {
    selectedOrganizationId.value = organizationId
    
    // Persistir selección en localStorage
    if (organizationId) {
      localStorage.setItem('selectedOrganizationId', organizationId)
    } else {
      localStorage.removeItem('selectedOrganizationId')
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    selectedOrganizationId,
    availableOrganizations,
    
    // Getters
    isAuthenticated,
    userRole,
    userName,
    userEmail,
    requiresOrganizationSelection,
    selectedOrganization,
    canSelectOrganization,
    
    // Actions
    login,
    register,
    getCurrentUser,
    updateProfile,
    logout,
    logoutAll,
    initializeAuth,
    fetchAvailableOrganizations,
    selectOrganization,
    clearError
  }
}) 