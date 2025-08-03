import api from './api'
import type { 
  BudgetWithRelations,
  CreateBudgetData,
  UpdateBudgetData,
  BudgetFilters,
  BudgetReport,
  BudgetStatus,
  BudgetsListApiResponse,
  BudgetApiResponse,
  BudgetReportApiResponse,
  BudgetStatusApiResponse,
  BudgetUpdateConfirmation
} from '../types/budget'

class BudgetService {
  
  /**
   * Obtener lista de presupuestos
   */
  async getBudgets(
    organizationId?: string,
    filters?: BudgetFilters
  ): Promise<{ budgets: BudgetWithRelations[], pagination: any }> {
    try {
      const params = new URLSearchParams()
      
      if (filters?.categoryId) params.append('categoryId', filters.categoryId)
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString())
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.search) params.append('search', filters.search)
      if (filters?.year) params.append('year', filters.year.toString())
      if (filters?.month) params.append('month', filters.month.toString())

      const headers: Record<string, string> = {}
      if (organizationId) {
        headers['x-organization-id'] = organizationId
      }

      const response = await api.get<BudgetsListApiResponse>(
        `/budgets?${params.toString()}`,
        { headers }
      )

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error obteniendo presupuestos')
      }

      return {
        budgets: response.data.data.budgets,
        pagination: response.data.data.pagination
      }
    } catch (error: any) {
      console.error('Error getting budgets:', error)
      throw new Error(error.message || 'Error obteniendo presupuestos')
    }
  }

  /**
   * Obtener presupuesto por ID
   */
  async getBudgetById(id: string, organizationId?: string): Promise<BudgetWithRelations> {
    try {
      const headers: Record<string, string> = {}
      if (organizationId) {
        headers['x-organization-id'] = organizationId
      }

      const response = await api.get<BudgetApiResponse>(
        `/budgets/${id}`,
        { headers }
      )

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Presupuesto no encontrado')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Error getting budget:', error)
      throw new Error(error.message || 'Error obteniendo presupuesto')
    }
  }

  /**
   * Crear nuevo presupuesto
   */
  async createBudget(data: CreateBudgetData, organizationId?: string): Promise<BudgetWithRelations> {
    try {
      const headers: Record<string, string> = {}
      if (organizationId) {
        headers['x-organization-id'] = organizationId
      }

      const response = await api.post<BudgetApiResponse>(
        '/budgets',
        data,
        { headers }
      )

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error creando presupuesto')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Error creating budget:', error)
      throw new Error(error.message || 'Error creando presupuesto')
    }
  }

  /**
   * Actualizar presupuesto
   */
  async updateBudget(id: string, data: UpdateBudgetData, organizationId?: string): Promise<BudgetWithRelations | BudgetUpdateConfirmation> {
    try {
      const headers: Record<string, string> = {}
      if (organizationId) {
        headers['x-organization-id'] = organizationId
      }

      const response = await api.put<BudgetApiResponse | BudgetUpdateConfirmation>(
        `/budgets/${id}`,
        data,
        { headers }
      )

      // Si el backend pide confirmación, retornar la respuesta de confirmación
      if ('requiresConfirmation' in response.data && response.data.requiresConfirmation) {
        return response.data as BudgetUpdateConfirmation
      }

      // Si es una respuesta normal exitosa
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error actualizando presupuesto')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Error updating budget:', error)
      throw new Error(error.message || 'Error actualizando presupuesto')
    }
  }

  /**
   * Actualizar presupuesto con confirmación para presupuestos futuros
   */
  async updateBudgetWithConfirmation(
    id: string, 
    data: UpdateBudgetData, 
    updateFutureBudgets: boolean,
    organizationId?: string
  ): Promise<BudgetWithRelations> {
    try {
      const headers: Record<string, string> = {}
      if (organizationId) {
        headers['x-organization-id'] = organizationId
      }

      const updateData = {
        ...data,
        updateFutureBudgets
      }

      const response = await api.put<BudgetApiResponse>(
        `/budgets/${id}`,
        updateData,
        { headers }
      )

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error actualizando presupuesto')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Error updating budget with confirmation:', error)
      throw new Error(error.message || 'Error actualizando presupuesto')
    }
  }

  /**
   * Eliminar presupuesto
   */
  async deleteBudget(id: string, organizationId?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {}
      if (organizationId) {
        headers['x-organization-id'] = organizationId
      }

      const response = await api.delete(
        `/budgets/${id}`,
        { headers }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error eliminando presupuesto')
      }
    } catch (error: any) {
      console.error('Error deleting budget:', error)
      throw new Error(error.message || 'Error eliminando presupuesto')
    }
  }

  /**
   * Obtener reporte de presupuestos
   */
  async getBudgetReport(
    organizationId?: string,
    year?: number,
    month?: number
  ): Promise<BudgetReport> {
    try {
      const params = new URLSearchParams()
      if (year) params.append('year', year.toString())
      if (month) params.append('month', month.toString())

      const headers: Record<string, string> = {}
      if (organizationId) {
        headers['x-organization-id'] = organizationId
      }

      const response = await api.get<BudgetReportApiResponse>(
        `/budgets/reports/summary?${params.toString()}`,
        { headers }
      )

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error obteniendo reporte')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Error getting budget report:', error)
      throw new Error(error.message || 'Error obteniendo reporte')
    }
  }

  /**
   * Obtener estado específico de presupuesto
   */
  async getBudgetStatus(
    id: string,
    organizationId?: string,
    year?: number,
    month?: number
  ): Promise<BudgetStatus> {
    try {
      const params = new URLSearchParams()
      if (year) params.append('year', year.toString())
      if (month) params.append('month', month.toString())

      const headers: Record<string, string> = {}
      if (organizationId) {
        headers['x-organization-id'] = organizationId
      }

      const response = await api.get<BudgetStatusApiResponse>(
        `/budgets/${id}/status?${params.toString()}`,
        { headers }
      )

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error obteniendo estado')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Error getting budget status:', error)
      throw new Error(error.message || 'Error obteniendo estado')
    }
  }

  /**
   * Verificar alertas de presupuesto
   */
  async checkBudgetAlerts(id: string, organizationId?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {}
      if (organizationId) {
        headers['x-organization-id'] = organizationId
      }

      const response = await api.post(
        `/budgets/${id}/check-alerts`,
        undefined,
        { headers }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error verificando alertas')
      }
    } catch (error: any) {
      console.error('Error checking budget alerts:', error)
      throw new Error(error.message || 'Error verificando alertas')
    }
  }

  /**
   * Formatear monto para mostrar
   */
  formatAmount(amount: string | number): string {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(numericAmount)
  }

  /**
   * Formatear porcentaje
   */
  formatPercentage(percentage: string | number): string {
    const numericPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage
    return `${numericPercentage.toFixed(1)}%`
  }

  /**
   * Obtener color del estado del presupuesto
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'UNDER_BUDGET':
        return 'success'
      case 'ON_TRACK':
        return 'info'
      case 'WARNING':
        return 'warning'
      case 'EXCEEDED':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  /**
   * Obtener label del estado del presupuesto
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'UNDER_BUDGET':
        return 'Bajo presupuesto'
      case 'ON_TRACK':
        return 'En línea'
      case 'WARNING':
        return 'Alerta'
      case 'EXCEEDED':
        return 'Excedido'
      default:
        return 'Desconocido'
    }
  }
}

export default new BudgetService() 