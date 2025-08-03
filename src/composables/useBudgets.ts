import { ref, computed } from 'vue'
import budgetService from '../services/budgetService'
import { useAuthStore } from '../stores/auth'
import { getCurrentYear, getCurrentMonth } from '../utils/dateUtils'
import type { 
  BudgetWithRelations, 
  CreateBudgetData, 
  UpdateBudgetData,
  BudgetReport,
  BudgetStatus,
  BudgetUpdateConfirmation
} from '../types/budget'

// Estado global del composable
const budgets = ref<BudgetWithRelations[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const report = ref<BudgetReport | null>(null)

// Paginación
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0
})

// Filtros
const filters = ref({
  search: '',
  categoryId: undefined as string | undefined,
  isActive: true as boolean | undefined,  // Por defecto solo mostrar presupuestos activos
  year: getCurrentYear() as number | undefined,
  month: getCurrentMonth() as number | undefined
})

export function useBudgets() {
  const authStore = useAuthStore()

  // Computed properties
  const canCreateBudgets = computed(() => {
    const role = authStore.user?.role
    return role === 'ADMIN' || role === 'COLABORADOR'
  })

  const canEditBudgets = computed(() => {
    const role = authStore.user?.role
    return role === 'ADMIN' || role === 'COLABORADOR'
  })

  const canDeleteBudgets = computed(() => {
    const role = authStore.user?.role
    return role === 'ADMIN'
  })

  // Computed para obtener la organización seleccionada
  const selectedOrganizationId = computed(() => {
    return authStore.selectedOrganization?.id
  })

  // Métodos principales
  const fetchBudgets = async () => {
    try {
      if (!selectedOrganizationId.value) {
        error.value = 'Debe seleccionar una organización'
        budgets.value = []
        return
      }

      loading.value = true
      error.value = null

      console.log('filters.value', filters.value)
      
      const params = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        search: filters.value.search || undefined,
        categoryId: filters.value.categoryId,
        isActive: filters.value.isActive,
        year: filters.value.year,
        month: filters.value.month
      }

      const { budgets: fetchedBudgets, pagination: paginationData } = await budgetService.getBudgets(selectedOrganizationId.value, params)
      
      budgets.value = fetchedBudgets
      pagination.value = {
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        pages: paginationData.pages
      }
    } catch (err: any) {
      console.error('Error fetching budgets:', err)
      error.value = err.message || 'Error al cargar presupuestos'
      budgets.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchBudgetById = async (id: string): Promise<BudgetWithRelations | null> => {
    try {
      if (!selectedOrganizationId.value) {
        throw new Error('Debe seleccionar una organización')
      }

      return await budgetService.getBudgetById(id, selectedOrganizationId.value)
    } catch (err: any) {
      console.error('Error fetching budget:', err)
      error.value = err.message || 'Error al cargar presupuesto'
      return null
    }
  }

  const createBudget = async (data: CreateBudgetData): Promise<void> => {
    try {
      if (!selectedOrganizationId.value) {
        throw new Error('Debe seleccionar una organización')
      }

      loading.value = true
      error.value = null

      const budgetData = {
        ...data,
        organizationId: selectedOrganizationId.value
      }

      await budgetService.createBudget(budgetData, selectedOrganizationId.value)
      // Recargar presupuestos después de crear
      await fetchBudgets()
      await fetchBudgetReport()
    } catch (err: any) {
      console.error('Error creating budget:', err)
      error.value = err.message || 'Error al crear presupuesto'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateBudget = async (id: string, data: UpdateBudgetData): Promise<BudgetUpdateConfirmation | null> => {
    try {
      if (!selectedOrganizationId.value) {
        throw new Error('Debe seleccionar una organización')
      }

      loading.value = true
      error.value = null

      const result = await budgetService.updateBudget(id, data, selectedOrganizationId.value)
      
      // Si es una respuesta de confirmación, devolverla
      if ('requiresConfirmation' in result && result.requiresConfirmation) {
        return result
      }
      
      // Si es una actualización exitosa, recargar datos
      await fetchBudgets()
      await fetchBudgetReport()
      return null
    } catch (err: any) {
      console.error('Error updating budget:', err)
      error.value = err.message || 'Error al actualizar presupuesto'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateBudgetWithConfirmation = async (
    id: string, 
    data: UpdateBudgetData, 
    updateFutureBudgets: boolean
  ): Promise<void> => {
    try {
      if (!selectedOrganizationId.value) {
        throw new Error('Debe seleccionar una organización')
      }

      loading.value = true
      error.value = null

      await budgetService.updateBudgetWithConfirmation(id, data, updateFutureBudgets, selectedOrganizationId.value)
      // Recargar presupuestos después de actualizar
      await fetchBudgets()
      await fetchBudgetReport()
    } catch (err: any) {
      console.error('Error updating budget with confirmation:', err)
      error.value = err.message || 'Error al actualizar presupuesto'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteBudget = async (id: string): Promise<void> => {
    try {
      if (!selectedOrganizationId.value) {
        throw new Error('Debe seleccionar una organización')
      }

      loading.value = true
      error.value = null

      await budgetService.deleteBudget(id, selectedOrganizationId.value)
      // Recargar presupuestos después de eliminar
      await fetchBudgets()
      await fetchBudgetReport()
    } catch (err: any) {
      console.error('Error deleting budget:', err)
      error.value = err.message || 'Error al eliminar presupuesto'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchBudgetReport = async (): Promise<void> => {
    try {
      if (!selectedOrganizationId.value) {
        report.value = null
        return
      }

      console.log('🔍 Obteniendo reporte con filtros:', {
        organizationId: selectedOrganizationId.value,
        year: filters.value.year,
        month: filters.value.month
      })

      const reportData = await budgetService.getBudgetReport(
        selectedOrganizationId.value,
        filters.value.year,
        filters.value.month
      )
      report.value = reportData
      
      console.log('📊 Reporte obtenido:', reportData)
    } catch (err: any) {
      console.error('Error fetching budget report:', err)
      report.value = null
    }
  }

  // Métodos de filtrado y paginación
  const updateFilters = (newFilters: Partial<typeof filters.value>) => {
    console.log('🔄 Actualizando filtros:', newFilters)
    filters.value = { ...filters.value, ...newFilters }
    console.log('🔄 Filtros actualizados:', filters.value)
    pagination.value.page = 1 // Resetear a primera página
    fetchBudgets()
    fetchBudgetReport() // También actualizar el reporte
  }

  const resetFilters = () => {
    filters.value = {
      search: '',
      categoryId: undefined,
      isActive: true,  // Mantener filtro de activos por defecto
      year: getCurrentYear(), // Mantener año actual
      month: getCurrentMonth() // Mantener mes actual
    }
    pagination.value.page = 1
    fetchBudgets()
    fetchBudgetReport() // También resetear el reporte
  }

  const changePage = (page: number) => {
    if (page >= 1 && page <= pagination.value.pages) {
      pagination.value.page = page
      fetchBudgets()
    }
  }

  const refreshBudgets = () => {
    fetchBudgets()
    fetchBudgetReport()
  }

  // Métodos de utilidad
  const formatAmount = (amount: string | number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount)
  }

  const formatPercentage = (percentage: string | number | null | undefined): string => {
    // Validar que el valor no sea null, undefined o vacío
    if (percentage === null || percentage === undefined || percentage === '') {
      return '0.0%'
    }
    
    const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage
    
    // Validar que el resultado sea un número válido
    if (isNaN(numPercentage) || !isFinite(numPercentage)) {
      return '0.0%'
    }
    
    return `${numPercentage.toFixed(1)}%`
  }

  // Métodos de utilidad para estados
  const getStatusColor = (status: BudgetStatus['status']): string => {
    console.log('🔍 Obteniendo color para estado:', status)
    switch (status) {
      case 'UNDER_BUDGET':
        return 'bg-success'
      case 'ON_TRACK':
        return 'bg-info'
      case 'WARNING':
        return 'bg-warning'
      case 'EXCEEDED':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
  }

  const getStatusLabel = (status: BudgetStatus['status']): string => {
    switch (status) {
      case 'UNDER_BUDGET':
        return 'Bajo presupuesto'
      case 'ON_TRACK':
        return 'En línea'
      case 'WARNING':
        return 'Advertencia'
      case 'EXCEEDED':
        return 'Excedido'
      default:
        return 'Desconocido'
    }
  }

  return {
    // Estado
    budgets,
    loading,
    error,
    report,
    pagination,
    filters,

    // Computed
    canCreateBudgets,
    canEditBudgets,
    canDeleteBudgets,
    selectedOrganizationId,

    // Métodos
    fetchBudgets,
    fetchBudgetById,
    createBudget,
    updateBudget,
    updateBudgetWithConfirmation,
    deleteBudget,
    fetchBudgetReport,
    updateFilters,
    resetFilters,
    changePage,
    refreshBudgets,
    formatAmount,
    formatPercentage,
    getStatusColor,
    getStatusLabel
  }
} 