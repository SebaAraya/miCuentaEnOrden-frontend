export interface Budget {
  id: string
  name: string
  description?: string
  monthlyAmount: string // Decimal viene como string del backend
  categoryId: string
  userId: string
  startDate: string
  endDate?: string
  isActive: boolean
  alertThreshold: string // Decimal viene como string del backend
  isRecurring?: boolean
  recurringMonths?: number
  autoAdjust?: 'none' | 'inflation' | 'previous'
  parentBudgetId?: string
  createdAt: string
  updatedAt: string
}

export interface BudgetWithRelations extends Budget {
  category: {
    id: string
    name: string
    icon: string
    colorHex: string
  }
  user: {
    id: string
    name: string
    email: string
  }
  currentMonthStatus?: BudgetStatus
}

export interface BudgetStatus {
  budgetedAmount: string
  spentAmount: string
  remainingAmount: string
  percentageUsed: string
  status: 'UNDER_BUDGET' | 'ON_TRACK' | 'WARNING' | 'EXCEEDED'
}

export interface CreateBudgetData {
  name: string
  description?: string
  monthlyAmount: number
  categoryId: string
  startDate: string
  endDate?: string
  alertThreshold?: number
  isRecurring?: boolean
  recurringMonths?: number
  autoAdjust?: 'none' | 'inflation' | 'previous'
}

export interface UpdateBudgetData {
  name?: string
  description?: string
  monthlyAmount?: number
  categoryId?: string
  startDate?: string
  endDate?: string
  isActive?: boolean
  alertThreshold?: number
  isRecurring?: boolean
  recurringMonths?: number
  autoAdjust?: 'none' | 'inflation' | 'previous'
  updateFutureBudgets?: boolean
}

export interface BudgetUpdateConfirmation {
  success: false
  requiresConfirmation: true
  message: string
  budgetType: 'infinite_recurring' | 'limited_recurring' | 'child_of_recurring' | 'not_recurring'
  affectedBudgetsCount: number
  parentBudgetId?: string
}

export interface BudgetFilters {
  categoryId?: string
  isActive?: boolean
  page?: number
  limit?: number
  search?: string
  year?: number
  month?: number
}

export interface BudgetReport {
  totalBudgets: number
  totalBudgetedAmount: number
  totalSpentAmount: number
  totalRemainingAmount: number
  averageUsagePercentage: number
  budgetsByStatus: {
    UNDER_BUDGET: number
    ON_TRACK: number
    WARNING: number
    EXCEEDED: number
  }
  topCategoriesByBudget: Array<{
    categoryId: string
    categoryName: string
    totalBudgeted: number
    totalSpent: number
    percentage: number
  }>
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message: string
}

export type BudgetApiResponse = ApiResponse<BudgetWithRelations>
export type BudgetsListApiResponse = ApiResponse<{
  budgets: BudgetWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}>
export type BudgetReportApiResponse = ApiResponse<BudgetReport>
export type BudgetStatusApiResponse = ApiResponse<BudgetStatus>

// Tipos para UI
export interface BudgetFormData {
  name: string
  description: string
  monthlyAmount: string
  categoryId: string
  startDate: string
  endDate: string
  alertThreshold: string
}

export const BudgetStatusLabels = {
  UNDER_BUDGET: 'Bajo presupuesto',
  ON_TRACK: 'En línea',
  WARNING: 'Advertencia',
  EXCEEDED: 'Excedido'
} as const

export const BudgetStatusColors = {
  UNDER_BUDGET: 'success',
  ON_TRACK: 'info', 
  WARNING: 'warning',
  EXCEEDED: 'danger'
} as const 