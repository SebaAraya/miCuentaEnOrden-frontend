import type { 
  Category, 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionResponse,
  FinancialSummary,
  CreateCategoryRequest
} from '@/types/financial'
import apiService from './api'

// ========================================
// CATEGORÍAS
// ========================================

/**
 * Obtener todas las categorías
 */
export async function getCategories(): Promise<Category[]> {
  const response = await apiService.get<Category[]>('/financial/categories')
  return response.data.data || []
}

/**
 * Crear nueva categoría
 */
export async function createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
  const response = await apiService.post<Category>('/financial/categories', categoryData)
  return response.data.data!
}

// ========================================
// TRANSACCIONES
// ========================================

/**
 * Obtener transacciones con filtros y paginación
 */
export async function getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const params = new URLSearchParams()
  
  if (filters.type) params.append('type', filters.type)
  if (filters.categoryId) params.append('categoryId', filters.categoryId)
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.minAmount) params.append('minAmount', filters.minAmount.toString())
  if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString())
  if (filters.description) params.append('description', filters.description)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  const queryString = params.toString()
  const url = `/financial/transactions${queryString ? `?${queryString}` : ''}`
  
  const response = await apiService.get<TransactionResponse>(url)
  console.log('response', response)
  return response.data.data?.transactions || []
}

/**
 * Obtener transacción por ID
 */
export async function getTransactionById(id: string): Promise<Transaction> {
  const response = await apiService.get<Transaction>(`/financial/transactions/${id}`)
  return response.data.data!
}

/**
 * Crear nueva transacción
 */
export async function createTransaction(transactionData: CreateTransactionRequest): Promise<Transaction> {
  const response = await apiService.post<Transaction>('/financial/transactions', transactionData)
  return response.data.data!
}

/**
 * Actualizar transacción
 */
export async function updateTransaction(id: string, transactionData: UpdateTransactionRequest): Promise<Transaction> {
  const response = await apiService.put<Transaction>(`/financial/transactions/${id}`, transactionData)
  return response.data.data!
}

/**
 * Eliminar transacción
 */
export async function deleteTransaction(id: string): Promise<void> {
  await apiService.delete(`/financial/transactions/${id}`)
}

/**
 * Obtener resumen financiero
 */
export async function getFinancialSummary(): Promise<FinancialSummary> {
  const response = await apiService.get<FinancialSummary>('/financial/summary')
  return response.data.data!
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Formatear monto para mostrar en UI
 */
export function formatCurrency(amount: string | number, currency = '$'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return `${currency}0`
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num).replace('CLP', currency)
}

/**
 * Validar monto
 */
export function validateAmount(amount: string): { isValid: boolean; error?: string } {
  console.log('amount', amount)

  if (!amount || String(amount).trim() === '') {
    return { isValid: false, error: 'El monto es requerido' }
  }

  const num = parseFloat(amount)
  if (isNaN(num)) {
    return { isValid: false, error: 'El monto debe ser un número válido' }
  }

  if (num <= 0) {
    return { isValid: false, error: 'El monto debe ser mayor a 0' }
  }

  if (num > 999999999.99) {
    return { isValid: false, error: 'El monto excede el límite máximo' }
  }

  return { isValid: true }
}

/**
 * Validar descripción
 */
export function validateDescription(description: string): { isValid: boolean; error?: string } {
  if (!description || description.trim() === '') {
    return { isValid: false, error: 'La descripción es requerida' }
  }

  if (description.trim().length < 3) {
    return { isValid: false, error: 'La descripción debe tener al menos 3 caracteres' }
  }

  if (description.trim().length > 255) {
    return { isValid: false, error: 'La descripción no puede exceder 255 caracteres' }
  }

  return { isValid: true }
}

/**
 * Obtener fecha en formato para input date
 */
export function formatDateForInput(date: Date | string): string {
  console.log('date', date)
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

/**
 * Obtener fecha actual en formato para input date
 */
export function getCurrentDateForInput(): string {
  return formatDateForInput(new Date())
}

/**
 * Formatear fecha para mostrar en UI
 */
export function formatDateForDisplay(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Obtener icono para tipo de transacción
 */
export function getTransactionTypeIcon(type: 'INCOME' | 'EXPENSE'): string {
  return type === 'INCOME' ? 'bi-arrow-up-circle-fill text-success' : 'bi-arrow-down-circle-fill text-danger'
}

/**
 * Obtener clase CSS para tipo de transacción
 */
export function getTransactionTypeClass(type: 'INCOME' | 'EXPENSE'): string {
  return type === 'INCOME' ? 'text-success' : 'text-danger'
} 