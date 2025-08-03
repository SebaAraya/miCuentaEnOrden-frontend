import type { 
  Category, 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionResponse,
  FinancialSummary,
  CreateCategoryRequest,
  UpdateCategoryRequest
} from '@/types/financial'
import apiService from './api'
import { 
  formatDateForInput, 
  formatEndDateForInput,
  formatDateForBackend, 
  formatEndDateForBackend,
  formatDateForDisplay, 
  getCurrentDateForInput,
  validateDateString 
} from '@/utils/dateUtils'

// ========================================
// CATEGORÍAS
// ========================================

/**
 * Obtener todas las categorías
 */
export async function getCategories(organizationId?: string): Promise<Category[]> {
  const params = new URLSearchParams()
  if (organizationId) params.append('organizationId', organizationId)
  
  const queryString = params.toString()
  const url = `/financial/categories${queryString ? `?${queryString}` : ''}`
  
  const response = await apiService.get<Category[]>(url)
  return response.data.data || []
}

/**
 * Obtener categoría por ID
 */
export async function getCategoryById(id: string): Promise<Category> {
  const response = await apiService.get<Category>(`/financial/categories/${id}`)
  return response.data.data!
}

/**
 * Crear nueva categoría
 */
export async function createCategory(categoryData: CreateCategoryRequest, organizationId?: string): Promise<Category> {
  const data = { ...categoryData }
  if (organizationId) {
    data.organizationId = organizationId
  }
  const response = await apiService.post<Category>('/financial/categories', data)
  return response.data.data!
}

/**
 * Actualizar categoría
 */
export async function updateCategory(id: string, categoryData: UpdateCategoryRequest): Promise<Category> {
  const response = await apiService.put<Category>(`/financial/categories/${id}`, categoryData)
  return response.data.data!
}

/**
 * Eliminar categoría
 */
export async function deleteCategory(id: string): Promise<void> {
  await apiService.delete(`/financial/categories/${id}`)
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
  if (filters.organizationId) params.append('organizationId', filters.organizationId)
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
 * Validar fecha
 */
export function validateDate(dateString: string): { isValid: boolean; error?: string } {
  if (!dateString || dateString.trim() === '') {
    return { isValid: false, error: 'La fecha es requerida' }
  }

  if (!validateDateString(dateString)) {
    return { isValid: false, error: 'La fecha no tiene un formato válido' }
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

// Funciones de fecha movidas a /utils/dateUtils.ts
// Mantenemos estas funciones para compatibilidad hacia atrás
export { formatDateForInput, formatEndDateForInput } from '@/utils/dateUtils'

// Funciones movidas a /utils/dateUtils.ts
// Mantenemos estas funciones para compatibilidad hacia atrás
export { formatDateForBackend, formatEndDateForBackend } from '@/utils/dateUtils'

// Función movida a /utils/dateUtils.ts
// Mantenemos esta función para compatibilidad hacia atrás
export { getCurrentDateForInput } from '@/utils/dateUtils'

// Función movida a /utils/dateUtils.ts
// Mantenemos esta función para compatibilidad hacia atrás
export { formatDateForDisplay } from '@/utils/dateUtils'

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