// Enums que coinciden con el backend
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  COLABORADOR = 'COLABORADOR',
  USUARIO_BASICO = 'USUARIO_BASICO'
}

// Interfaces para categorías
export interface Category {
  id: string
  name: string
  description?: string
  colorHex: string
  icon: string
  isDefault: boolean
  organizationId?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  colorHex?: string
  icon?: string
}

// Interfaces para transacciones
export interface Transaction {
  id: string
  amount: string // Viene como string del backend
  type: TransactionType
  description: string
  transactionDate: string
  categoryId: string
  userId: string
  recurringPatternId?: string
  metadata?: any
  createdAt: string
  updatedAt: string
  // Relaciones
  category?: {
    id: string
    name: string
    colorHex: string
    icon: string
  }
  user?: {
    id: string
    name: string
  }
}

export interface CreateTransactionRequest {
  amount: number | string
  type: TransactionType
  description: string
  transactionDate: string
  categoryId: string
  metadata?: any
}

export interface UpdateTransactionRequest {
  amount?: number | string
  type?: TransactionType
  description?: string
  transactionDate?: string
  categoryId?: string
  metadata?: any
}

export interface TransactionFilters {
  type?: TransactionType
  categoryId?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  description?: string
  page?: number
  limit?: number
}

// Interfaces para respuestas de API
export interface TransactionResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FinancialSummary {
  totalIncome: string
  totalExpenses: string
  netAmount: string
  incomeCount: number
  expenseCount: number
  totalCount: number
  period: {
    startDate: string
    endDate: string
  }
}

// Interfaces para formularios
export interface TransactionFormData {
  amount: string
  type: TransactionType
  description: string
  transactionDate: string
  categoryId: string
}

export interface CategoryFormData {
  name: string
  description: string
  colorHex: string
  icon: string
}

// Interfaces para validación
export interface ValidationError {
  field: string
  message: string
}

export interface FormValidation {
  isValid: boolean
  errors: ValidationError[]
}

// Interfaces para estadísticas del dashboard
export interface DashboardStats {
  totalIncome: string
  totalExpenses: string
  netAmount: string
  transactionCount: number
  categoriesCount: number
  recentTransactions: Transaction[]
  topCategories: Array<{
    category: Category
    amount: string
    count: number
    percentage: number
  }>
} 