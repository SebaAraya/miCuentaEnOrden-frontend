import { ref, reactive, computed, watch } from 'vue'
import UserService, { 
  type User, 
  type UserFilters,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserStats
} from '@/services/userService'
import OrganizationService, { type Organization } from '@/services/organizationService'
import { useRoles } from '@/composables/useRoles'
import { useAuthStore } from '@/stores/auth'

// Estado global compartido
const users = ref<User[]>([])
const selectedUser = ref<User | null>(null)
const userStats = ref<UserStats | null>(null)
const organizations = ref<Organization[]>([])

// Estados de carga
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const modalError = ref<string | null>(null)

// Paginación
const pagination = reactive({
  page: 1,
  limit: 15,
  total: 0,
  pages: 0
})

// Filtros
const filters = reactive<UserFilters>({
  search: '',
  role: '',
  isActive: undefined,
  organizationId: '',
  page: 1,
  limit: 15
})

export function useUsers() {
  const authStore = useAuthStore()
  
  // Computed
  const filteredUsers = computed(() => {
    let result = [...users.value]
    
    // El filtrado se hace en el backend, pero podemos hacer filtrado adicional aquí si es necesario
    return result
  })

  // Opciones de roles para filtros (incluye "Todos los roles")
  const roleOptions = computed(() => {
    const currentUserRole = authStore.user?.role

    if (currentUserRole === 'ADMIN') {
      return [
        { value: '', label: 'Todos los roles' },
        { value: 'ADMIN', label: 'Administrador' },
        { value: 'COLABORADOR', label: 'Colaborador' },
        { value: 'USUARIO_BASICO', label: 'Usuario Básico' }
      ]
    } else if (currentUserRole === 'COLABORADOR') {
      return [
        { value: '', label: 'Todos los roles' },
        { value: 'COLABORADOR', label: 'Colaborador' },
        { value: 'USUARIO_BASICO', label: 'Usuario Básico' }
      ]
    } else {
      return [
        { value: '', label: 'Todos los roles' },
        { value: 'USUARIO_BASICO', label: 'Usuario Básico' }
      ]
    }
  })

  // Roles disponibles para crear/editar usuarios (sin "Todos los roles")
  const availableRoles = computed(() => {
    const currentUserRole = authStore.user?.role

    if (currentUserRole === 'ADMIN') {
      return [
        { value: 'ADMIN', label: 'Administrador' },
        { value: 'COLABORADOR', label: 'Colaborador' },
        { value: 'USUARIO_BASICO', label: 'Usuario Básico' }
      ]
    } else if (currentUserRole === 'COLABORADOR') {
      return [
        { value: 'COLABORADOR', label: 'Colaborador' },
        { value: 'USUARIO_BASICO', label: 'Usuario Básico' }
      ]
    } else {
      return [
        { value: 'USUARIO_BASICO', label: 'Usuario Básico' }
      ]
    }
  })

  const organizationOptions = computed(() => [
    { value: '', label: 'Todas las organizaciones' },
    ...organizations.value.map(org => ({
      value: org.id,
      label: org.name
    }))
  ])

  // Watchers
  watch(() => filters.page, (newPage) => {
    if (newPage !== pagination.page) {
      pagination.page = newPage
    }
  })

  // Funciones principales
  async function fetchUsers() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await UserService.getUsers({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      
      if (response.success && response.data) {
        users.value = response.data.users || []
        pagination.total = response.data.total || 0
        pagination.pages = response.data.pages || 0
        pagination.page = response.data.page || 1
      } else {
        throw new Error(response.message || 'Error al cargar los usuarios')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar los usuarios'
      console.error('Error fetching users:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUserStats() {
    try {
      const response = await UserService.getUserStats()
      
      if (response.success && response.data) {
        userStats.value = response.data
      }
    } catch (err: any) {
      console.error('Error fetching user stats:', err)
    }
  }

  async function fetchOrganizations() {
    try {
      const response = await OrganizationService.getAllOrganizations()
      
      if (response.success && response.data) {
        organizations.value = response.data
      }
    } catch (err: any) {
      console.error('Error fetching organizations:', err)
    }
  }

  async function createUser(data: CreateUserRequest): Promise<boolean> {
    isSubmitting.value = true
    modalError.value = null
    
    try {
      const response = await UserService.createUser(data)
      
      if (response.success && response.data) {
        users.value.unshift(response.data)
        return true
      } else {
        throw new Error(response.message || 'Error al crear el usuario')
      }
    } catch (err: any) {
      modalError.value = err.message || 'Error al crear el usuario'
      console.error('Error creating user:', err)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function updateUser(id: string, data: UpdateUserRequest): Promise<boolean> {
    isSubmitting.value = true
    modalError.value = null
    
    try {
      const response = await UserService.updateUser(id, data)
      
      if (response.success && response.data) {
        const index = users.value.findIndex(user => user.id === id)
        if (index !== -1) {
          users.value[index] = response.data
        }
        
        if (selectedUser.value?.id === id) {
          selectedUser.value = response.data
        }
        
        return true
      } else {
        throw new Error(response.message || 'Error al actualizar el usuario')
      }
    } catch (err: any) {
      modalError.value = err.message || 'Error al actualizar el usuario'
      console.error('Error updating user:', err)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function updateUserRole(id: string, role: 'ADMIN' | 'COLABORADOR' | 'USUARIO_BASICO'): Promise<boolean> {
    try {
      const response = await UserService.updateUserRole(id, role)
      
      if (response.success && response.data) {
        const index = users.value.findIndex(user => user.id === id)
        if (index !== -1) {
          users.value[index] = response.data
        }
        
        return true
      } else {
        throw new Error(response.message || 'Error al cambiar el rol del usuario')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cambiar el rol del usuario'
      console.error('Error updating user role:', err)
      return false
    }
  }

  async function toggleUserStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
      const response = await UserService.toggleUserStatus(id, isActive)
      
      if (response.success && response.data) {
        const index = users.value.findIndex(user => user.id === id)
        if (index !== -1) {
          users.value[index] = response.data
        }
        
        return true
      } else {
        throw new Error(response.message || 'Error al cambiar el estado del usuario')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cambiar el estado del usuario'
      console.error('Error toggling user status:', err)
      return false
    }
  }

  async function deleteUser(id: string): Promise<boolean> {
    try {
      const response = await UserService.deleteUser(id)
      
      if (response.success) {
        users.value = users.value.filter(user => user.id !== id)
        
        if (selectedUser.value?.id === id) {
          selectedUser.value = null
        }
        
        return true
      } else {
        throw new Error(response.message || 'Error al eliminar el usuario')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar el usuario'
      console.error('Error deleting user:', err)
      return false
    }
  }

  async function resetUserPassword(id: string): Promise<string | null> {
    try {
      const response = await UserService.resetUserPassword(id)
      
      if (response.success && response.data) {
        return response.data.temporaryPassword
      } else {
        throw new Error(response.message || 'Error al resetear la contraseña')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al resetear la contraseña'
      console.error('Error resetting password:', err)
      return null
    }
  }

  async function moveUserToOrganization(userId: string, organizationId: string): Promise<boolean> {
    try {
      const response = await UserService.moveUserToOrganization(userId, organizationId)
      
      if (response.success && response.data) {
        const index = users.value.findIndex(user => user.id === userId)
        if (index !== -1) {
          users.value[index] = response.data
        }
        
        return true
      } else {
        throw new Error(response.message || 'Error al mover el usuario')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al mover el usuario'
      console.error('Error moving user:', err)
      return false
    }
  }

  async function inviteUser(data: {
    email: string
    name: string
    role: 'ADMIN' | 'COLABORADOR' | 'USUARIO_BASICO'
    organizationId?: string
  }): Promise<boolean> {
    isSubmitting.value = true
    modalError.value = null
    
    try {
      const response = await UserService.inviteUser(data)
      
      if (response.success) {
        await fetchUsers()
        return true
      } else {
        throw new Error(response.message || 'Error al enviar la invitación')
      }
    } catch (err: any) {
      modalError.value = err.message || 'Error al enviar la invitación'
      console.error('Error inviting user:', err)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function validateEmail(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const response = await UserService.validateEmail(email, excludeUserId)
      
      if (response.success && response.data) {
        return response.data.isAvailable
      }
      
      return false
    } catch (err: any) {
      console.error('Error validating email:', err)
      return false
    }
  }

  // Funciones de utilidad
  function applyFilters() {
    pagination.page = 1
    filters.page = 1
    fetchUsers()
  }

  function clearFilters() {
    filters.search = ''
    filters.role = ''
    filters.isActive = undefined
    filters.organizationId = ''
    filters.page = 1
    pagination.page = 1
    fetchUsers()
  }

  function changePage(page: number) {
    if (page >= 1 && page <= pagination.pages) {
      pagination.page = page
      filters.page = page
      fetchUsers()
    }
  }

  function setSelectedUser(user: User | null) {
    selectedUser.value = user
  }

  function clearError() {
    error.value = null
  }

  function clearModalError() {
    modalError.value = null
  }

  function getUserById(id: string): User | undefined {
    return users.value.find(user => user.id === id)
  }

  function getUsersByOrganization(organizationId: string): User[] {
    return users.value.filter(user => user.organizationId === organizationId)
  }

  function getUsersByRole(role: string): User[] {
    return users.value.filter(user => user.role === role)
  }

  // Funciones de validación
  function validateUserForm(data: CreateUserRequest | UpdateUserRequest): string[] {
    const errors: string[] = []
    
    if ('name' in data && (!data.name || !data.name.trim())) {
      errors.push('El nombre es requerido')
    }
    
    if ('email' in data && (!data.email || !data.email.trim())) {
      errors.push('El email es requerido')
    }
    
    if ('email' in data && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('El formato del email es inválido')
    }
    
    if ('password' in data && (!data.password || data.password.length < 6)) {
      errors.push('La contraseña debe tener al menos 6 caracteres')
    }
    
    if ('role' in data && data.role && !['ADMIN', 'COLABORADOR', 'USUARIO_BASICO'].includes(data.role)) {
      errors.push('El rol seleccionado es inválido')
    }
    
    return errors
  }

  // Funciones de formato
  function formatRole(role: string): string {
    const roleMap = {
      'ADMIN': 'Administrador',
      'COLABORADOR': 'Colaborador',
      'USUARIO_BASICO': 'Usuario Básico'
    }
    return roleMap[role as keyof typeof roleMap] || role
  }

  function getRoleColor(role: string): string {
    const colorMap = {
      'ADMIN': 'danger',
      'COLABORADOR': 'warning',
      'USUARIO_BASICO': 'info'
    }
    return colorMap[role as keyof typeof colorMap] || 'secondary'
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    // Estado
    users: filteredUsers,
    selectedUser,
    userStats,
    organizations,
    isLoading,
    isSubmitting,
    error,
    modalError,
    
    // Paginación y filtros
    pagination,
    filters,
    
    // Computed
    roleOptions,
    availableRoles,
    organizationOptions,
    
    // Funciones principales
    fetchUsers,
    fetchUserStats,
    fetchOrganizations,
    createUser,
    updateUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    resetUserPassword,
    moveUserToOrganization,
    inviteUser,
    validateEmail,
    
    // Funciones de utilidad
    applyFilters,
    clearFilters,
    changePage,
    setSelectedUser,
    clearError,
    clearModalError,
    getUserById,
    getUsersByOrganization,
    getUsersByRole,
    validateUserForm,
    formatRole,
    getRoleColor,
    formatDate
  }
}

export default useUsers 