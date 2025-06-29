import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export enum UserRole {
  ADMIN = 'ADMIN',
  COLABORADOR = 'COLABORADOR',
  USUARIO_BASICO = 'USUARIO_BASICO'
}

export interface UserPermissions {
  // Organizaciones
  canManageOrganizations: boolean
  canViewOrganizations: boolean
  canEditOwnOrganization: boolean
  
  // Usuarios
  canManageAllUsers: boolean
  canManageOrgUsers: boolean
  canViewOrgUsers: boolean
  canChangeUserRoles: boolean
  
  // Transacciones
  canViewAllTransactions: boolean
  canViewOrgTransactions: boolean
  canManageAllTransactions: boolean
  canManageOrgTransactions: boolean
  
  // Presupuestos
  canViewAllBudgets: boolean
  canViewOrgBudgets: boolean
  canManageAllBudgets: boolean
  canManageOrgBudgets: boolean
  
  // Categorías
  canManageCategories: boolean
  canCreateCategories: boolean
  
  // Reportes
  canViewAllReports: boolean
  canViewOrgReports: boolean
  canExportData: boolean
}

export function useRoles() {
  const authStore = useAuthStore()

  // Usuario actual
  const currentUser = computed(() => authStore.user)
  const userRole = computed(() => currentUser.value?.role as UserRole)
  const userOrganizationId = computed(() => currentUser.value?.organizationId)

  // Verificaciones básicas de rol
  const isAdmin = computed(() => userRole.value === UserRole.ADMIN)
  const isColaborador = computed(() => userRole.value === UserRole.COLABORADOR)
  const isUsuarioBasico = computed(() => userRole.value === UserRole.USUARIO_BASICO)

  // Verificaciones avanzadas
  const hasOrganization = computed(() => !!userOrganizationId.value)
  const canManageUsers = computed(() => isAdmin.value || isColaborador.value)
  const canViewFinancialData = computed(() => isAdmin.value || isColaborador.value)

  // Permisos detallados
  const permissions = computed<UserPermissions>(() => {
    const role = userRole.value

    return {
      // Organizaciones
      canManageOrganizations: role === UserRole.ADMIN,
      canViewOrganizations: role === UserRole.ADMIN || role === UserRole.COLABORADOR,
      canEditOwnOrganization: role === UserRole.ADMIN || role === UserRole.COLABORADOR,

      // Usuarios
      canManageAllUsers: role === UserRole.ADMIN,
      canManageOrgUsers: role === UserRole.ADMIN || role === UserRole.COLABORADOR,
      canViewOrgUsers: role === UserRole.ADMIN || role === UserRole.COLABORADOR,
      canChangeUserRoles: role === UserRole.ADMIN,

      // Transacciones
      canViewAllTransactions: role === UserRole.ADMIN,
      canViewOrgTransactions: role === UserRole.ADMIN || role === UserRole.COLABORADOR,
      canManageAllTransactions: role === UserRole.ADMIN,
      canManageOrgTransactions: role === UserRole.ADMIN || role === UserRole.COLABORADOR,

      // Presupuestos
      canViewAllBudgets: role === UserRole.ADMIN,
      canViewOrgBudgets: role === UserRole.ADMIN || role === UserRole.COLABORADOR,
      canManageAllBudgets: role === UserRole.ADMIN,
      canManageOrgBudgets: role === UserRole.ADMIN || role === UserRole.COLABORADOR,

      // Categorías
      canManageCategories: true, // Todos pueden gestionar categorías
      canCreateCategories: true,

      // Reportes
      canViewAllReports: role === UserRole.ADMIN,
      canViewOrgReports: role === UserRole.ADMIN || role === UserRole.COLABORADOR,
      canExportData: role !== UserRole.USUARIO_BASICO
    }
  })

  // Funciones de verificación
  function hasPermission(permission: keyof UserPermissions): boolean {
    return permissions.value[permission]
  }

  function canAccessResource(resourceUserId: string, resourceOrgId?: string): boolean {
    // Admin puede acceder a cualquier recurso
    if (isAdmin.value) return true

    // El usuario puede acceder a sus propios recursos
    if (resourceUserId === currentUser.value?.id) return true

    // Colaborador puede acceder a recursos de su organización
    if (isColaborador.value && resourceOrgId && resourceOrgId === userOrganizationId.value) {
      return true
    }

    return false
  }

  function canManageUser(targetUserId: string, targetUserRole?: UserRole): boolean {
    // No puede gestionarse a sí mismo
    if (targetUserId === currentUser.value?.id) return false

    // Admin puede gestionar cualquier usuario
    if (isAdmin.value) return true

    // Colaborador puede gestionar usuarios básicos de su organización
    if (isColaborador.value && targetUserRole === UserRole.USUARIO_BASICO) {
      return true
    }

    return false
  }

  function getAccessLevel(): 'full' | 'organization' | 'own' {
    if (isAdmin.value) return 'full'
    if (isColaborador.value) return 'organization'
    return 'own'
  }

  function getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.COLABORADOR]: 'Colaborador',
      [UserRole.USUARIO_BASICO]: 'Usuario Básico'
    }
    return roleNames[role] || role
  }

  function getRoleColor(role: UserRole): string {
    const roleColors = {
      [UserRole.ADMIN]: 'danger',
      [UserRole.COLABORADOR]: 'warning',
      [UserRole.USUARIO_BASICO]: 'success'
    }
    return roleColors[role] || 'secondary'
  }

  function getRoleIcon(role: UserRole): string {
    const roleIcons = {
      [UserRole.ADMIN]: 'bi-shield-fill-check',
      [UserRole.COLABORADOR]: 'bi-people-fill',
      [UserRole.USUARIO_BASICO]: 'bi-person-fill'
    }
    return roleIcons[role] || 'bi-person'
  }

  return {
    // Estado
    currentUser,
    userRole,
    userOrganizationId,
    
    // Verificaciones básicas
    isAdmin,
    isColaborador,
    isUsuarioBasico,
    hasOrganization,
    canManageUsers,
    canViewFinancialData,
    
    // Permisos
    permissions,
    
    // Funciones
    hasPermission,
    canAccessResource,
    canManageUser,
    getAccessLevel,
    getRoleDisplayName,
    getRoleColor,
    getRoleIcon
  }
} 