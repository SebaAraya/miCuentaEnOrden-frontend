import { Decimal } from '@prisma/client/runtime/library'

export interface Budget {
  id: string
  name: string
  description?: string
  monthlyAmount: Decimal
  categoryId: string
  userId: string
  startDate: Date
  endDate?: Date
  isActive: boolean
  alertThreshold: Decimal
  createdAt: Date
  updatedAt: Date
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
  budgetedAmount: Decimal
  spentAmount: Decimal
  remainingAmount: Decimal
  percentageUsed: Decimal
  status: 'UNDER_BUDGET' | 'ON_TRACK' | 'WARNING' | 'EXCEEDED'
}

export interface BudgetAlert {
  id: string
  budgetId: string
  userId: string
  alertType: 'BUDGET_WARNING' | 'BUDGET_EXCEEDED' | 'MONTHLY_SUMMARY'
  thresholdAmount: Decimal
  currentAmount: Decimal
  message: string
  isRead: boolean
  createdAt: Date
}

export interface CreateBudgetData {
  name: string
  description?: string
  monthlyAmount: number
  categoryId: string
  startDate: string
  endDate?: string
  alertThreshold?: number
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
}

export interface BudgetFilters {
  categoryId?: string
  isActive?: boolean
  page?: number
  limit?: number
  search?: string
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

export interface BudgetSummary {
  monthlyBudgeted: number
  monthlySpent: number
  monthlyRemaining: number
  budgetsCount: number
  budgetsOnTrack: number
  budgetsWarning: number
  budgetsExceeded: number
}

// Tipos para respuestas de API
export interface BudgetApiResponse {
  success: boolean
  data?: BudgetWithRelations
  message: string
}

export interface BudgetsListApiResponse {
  success: boolean
  data?: {
    budgets: BudgetWithRelations[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  message: string
}

export interface BudgetReportApiResponse {
  success: boolean
  data?: BudgetReport
  message: string
}

export interface BudgetStatusApiResponse {
  success: boolean
  data?: BudgetStatus
  message: string
} 