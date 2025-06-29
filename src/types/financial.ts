import { Decimal } from '@prisma/client/runtime/library'

// Enums from Prisma
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum AlertType {
  BUDGET_WARNING = 'BUDGET_WARNING',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  MONTHLY_SUMMARY = 'MONTHLY_SUMMARY'
}

export enum BudgetStatus {
  UNDER_BUDGET = 'UNDER_BUDGET',
  ON_TRACK = 'ON_TRACK',
  WARNING = 'WARNING',
  EXCEEDED = 'EXCEEDED'
}

export enum RecurringFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

// Category interfaces
export interface ICategory {
  id: string
  name: string
  description?: string
  colorHex: string
  icon: string
  isDefault: boolean
  organizationId?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  colorHex?: string
  icon?: string
  organizationId?: string
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  colorHex?: string
  icon?: string
  isActive?: boolean
}

// Transaction interfaces
export interface ITransaction {
  id: string
  amount: Decimal
  type: TransactionType
  description: string
  transactionDate: Date
  categoryId: string
  userId: string
  recurringPatternId?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
  // Relations
  category?: ICategory
  user?: any
}

export interface CreateTransactionRequest {
  amount: number | string
  type: TransactionType
  description: string
  transactionDate: Date | string
  categoryId: string
  recurringPatternId?: string
  metadata?: any
}

export interface UpdateTransactionRequest {
  amount?: number | string
  type?: TransactionType
  description?: string
  transactionDate?: Date | string
  categoryId?: string
  recurringPatternId?: string
  metadata?: any
}

export interface TransactionFilters {
  type?: TransactionType
  categoryId?: string
  startDate?: Date | string
  endDate?: Date | string
  minAmount?: number
  maxAmount?: number
  description?: string
  page?: number
  limit?: number
  sortBy?: 'amount' | 'transactionDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// Budget interfaces
export interface IBudget {
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
  // Relations
  category?: ICategory
  user?: any
}

export interface CreateBudgetRequest {
  name: string
  description?: string
  monthlyAmount: number | string
  categoryId: string
  startDate: Date | string
  endDate?: Date | string
  alertThreshold?: number
}

export interface UpdateBudgetRequest {
  name?: string
  description?: string
  monthlyAmount?: number | string
  categoryId?: string
  startDate?: Date | string
  endDate?: Date | string
  isActive?: boolean
  alertThreshold?: number
}

// Monthly Summary interfaces
export interface IMonthlySummary {
  id: string
  userId: string
  categoryId: string
  year: number
  month: number
  totalIncome: Decimal
  totalExpenses: Decimal
  netAmount: Decimal
  transactionCount: number
  calculatedAt: Date
  updatedAt: Date
  // Relations
  category?: ICategory
}

export interface MonthlyUserSummary {
  id: string
  userId: string
  year: number
  month: number
  totalIncome: Decimal
  totalExpenses: Decimal
  netSavings: Decimal
  budgetVariance: Decimal
  categoriesCount: number
  calculatedAt: Date
  updatedAt: Date
}

// Response interfaces
export interface TransactionResponse extends Omit<ITransaction, 'amount'> {
  amount: string // Convert Decimal to string for JSON
}

export interface BudgetResponse extends Omit<IBudget, 'monthlyAmount' | 'alertThreshold'> {
  monthlyAmount: string
  alertThreshold: string
}

export interface CategoryWithStats extends ICategory {
  transactionCount?: number
  totalAmount?: string
  budgetCount?: number
}

export interface FinancialSummary {
  totalIncome: string
  totalExpenses: string
  netAmount: string
  transactionCount: number
  categoriesUsed: number
  period: {
    startDate: Date
    endDate: Date
  }
}

// Validation interfaces
export interface AmountValidation {
  isValid: boolean
  error?: string
  normalizedAmount?: Decimal
}

export interface DateRangeValidation {
  isValid: boolean
  error?: string
  normalizedStartDate?: Date
  normalizedEndDate?: Date
} 