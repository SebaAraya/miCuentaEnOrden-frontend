import { ref, reactive, computed, watch } from 'vue'
import OrganizationService, { 
  type Organization, 
  type OrganizationFilters,
  type CreateOrganizationRequest,
  type UpdateOrganizationRequest,
  type OrganizationStats,
  type User
} from '@/services/organizationService'

// Estado global compartido
const organizations = ref<Organization[]>([])
const selectedOrganization = ref<Organization | null>(null)
const organizationUsers = ref<User[]>([])
const organizationStats = ref<Record<string, OrganizationStats>>({})

// Estados de carga
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const modalError = ref<string | null>(null)

// Paginación
const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0,
  pages: 0
})

// Filtros
const filters = reactive<OrganizationFilters>({
  search: '',
  isActive: undefined,
  page: 1,
  limit: 12
})

export function useOrganizations() {
  
  // Computed
  const globalStats = computed(() => {
    if (organizations.value.length === 0) {
      return {
        total: 0,
        active: 0,
        totalUsers: 0,
        totalCategories: 0
      }
    }
    
    return {
      total: organizations.value.length,
      active: organizations.value.filter(org => org.isActive).length,
      totalUsers: organizations.value.reduce((sum, org) => sum + (org._count?.users || 0), 0),
      totalCategories: organizations.value.reduce((sum, org) => sum + (org._count?.categories || 0), 0)
    }
  })

  const filteredOrganizations = computed(() => {
    let result = [...organizations.value]
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      result = result.filter(org => 
        org.name.toLowerCase().includes(searchTerm) ||
        (org.description && org.description.toLowerCase().includes(searchTerm))
      )
    }
    
    if (filters.isActive !== undefined) {
      result = result.filter(org => org.isActive === filters.isActive)
    }
    
    return result
  })

  // Watchers
  watch(() => filters.page, (newPage) => {
    if (newPage !== pagination.page) {
      pagination.page = newPage
    }
  })

  // Funciones principales
  async function fetchOrganizations() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await OrganizationService.getOrganizations({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      
      if (response.success && response.data) {
        organizations.value = response.data.organizations || []
        pagination.total = response.data.total || 0
        pagination.pages = response.data.pages || 0
        pagination.page = response.data.page || 1
      } else {
        throw new Error(response.message || 'Error al cargar las organizaciones')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar las organizaciones'
      console.error('Error fetching organizations:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createOrganization(data: CreateOrganizationRequest): Promise<boolean> {
    isSubmitting.value = true
    modalError.value = null
    
    try {
      const response = await OrganizationService.createOrganization(data)
      
      if (response.success && response.data) {
        // Agregar la nueva organización al array local
        organizations.value.unshift(response.data)
        return true
      } else {
        throw new Error(response.message || 'Error al crear la organización')
      }
    } catch (err: any) {
      modalError.value = err.message || 'Error al crear la organización'
      console.error('Error creating organization:', err)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<boolean> {
    isSubmitting.value = true
    modalError.value = null
    
    try {
      const response = await OrganizationService.updateOrganization(id, data)
      
      if (response.success && response.data) {
        // Actualizar la organización en el array local
        const index = organizations.value.findIndex(org => org.id === id)
        if (index !== -1) {
          organizations.value[index] = response.data
        }
        
        // Actualizar también la organización seleccionada si coincide
        if (selectedOrganization.value?.id === id) {
          selectedOrganization.value = response.data
        }
        
        return true
      } else {
        throw new Error(response.message || 'Error al actualizar la organización')
      }
    } catch (err: any) {
      modalError.value = err.message || 'Error al actualizar la organización'
      console.error('Error updating organization:', err)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function deleteOrganization(id: string): Promise<boolean> {
    try {
      const response = await OrganizationService.deleteOrganization(id)
      
      if (response.success) {
        // Remover la organización del array local
        organizations.value = organizations.value.filter(org => org.id !== id)
        
        // Limpiar la selección si era la organización eliminada
        if (selectedOrganization.value?.id === id) {
          selectedOrganization.value = null
        }
        
        return true
      } else {
        throw new Error(response.message || 'Error al eliminar la organización')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar la organización'
      console.error('Error deleting organization:', err)
      return false
    }
  }

  async function fetchOrganizationById(id: string): Promise<Organization | null> {
    try {
      const response = await OrganizationService.getOrganizationById(id)
      
      if (response.success && response.data) {
        selectedOrganization.value = response.data
        return response.data
      } else {
        throw new Error(response.message || 'Error al cargar la organización')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar la organización'
      console.error('Error fetching organization:', err)
      return null
    }
  }

  async function fetchOrganizationUsers(id: string, userFilters: any = {}): Promise<void> {
    try {
      const response = await OrganizationService.getOrganizationUsers(id, userFilters)
      
      if (response.success && response.data) {
        organizationUsers.value = response.data.users || []
      } else {
        throw new Error(response.message || 'Error al cargar los usuarios')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar los usuarios'
      console.error('Error fetching organization users:', err)
    }
  }

  async function fetchOrganizationStats(id: string): Promise<OrganizationStats | null> {
    try {
      const response = await OrganizationService.getOrganizationStats(id)
      
      if (response.success && response.data) {
        organizationStats.value[id] = response.data
        return response.data
      } else {
        throw new Error(response.message || 'Error al cargar las estadísticas')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar las estadísticas'
      console.error('Error fetching organization stats:', err)
      return null
    }
  }

  // Funciones de utilidad
  function applyFilters() {
    pagination.page = 1
    filters.page = 1
    fetchOrganizations()
  }

  function clearFilters() {
    filters.search = ''
    filters.isActive = undefined
    filters.page = 1
    pagination.page = 1
    fetchOrganizations()
  }

  function changePage(page: number) {
    if (page >= 1 && page <= pagination.pages) {
      pagination.page = page
      filters.page = page
      fetchOrganizations()
    }
  }

  function setSelectedOrganization(organization: Organization | null) {
    selectedOrganization.value = organization
  }

  function clearError() {
    error.value = null
  }

  function clearModalError() {
    modalError.value = null
  }

  // Funciones de validación
  function validateOrganizationForm(data: CreateOrganizationRequest | UpdateOrganizationRequest): string[] {
    const errors: string[] = []
    
    if ('name' in data && (!data.name || !data.name.trim())) {
      errors.push('El nombre es requerido')
    }
    
    if ('name' in data && data.name && data.name.length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres')
    }
    
    if (data.description && data.description.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres')
    }
    
    return errors
  }

  return {
    // Estado
    organizations: filteredOrganizations,
    selectedOrganization,
    organizationUsers,
    organizationStats,
    isLoading,
    isSubmitting,
    error,
    modalError,
    
    // Paginación y filtros
    pagination,
    filters,
    
    // Computed
    globalStats,
    
    // Funciones principales
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    fetchOrganizationById,
    fetchOrganizationUsers,
    fetchOrganizationStats,
    
    // Funciones de utilidad
    applyFilters,
    clearFilters,
    changePage,
    setSelectedOrganization,
    clearError,
    clearModalError,
    validateOrganizationForm
  }
}

export default useOrganizations 