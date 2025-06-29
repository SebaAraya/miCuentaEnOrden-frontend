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
 * Convertir fecha ISO a formato local para input date
 * Esto corrige el problema de zona horaria que causaba que se mostrara un día menos
 */
export function formatDateForInput(date: Date | string): string {
  // Si la fecha viene como string, necesitamos parsearlo correctamente
  let d: Date
  
  if (typeof date === 'string') {
    // Si es una fecha ISO del backend, usamos el constructor Date
    d = new Date(date)
    
    // Para evitar problemas de zona horaria, extraemos solo la parte de fecha
    // y creamos una nueva fecha local
    if (date.includes('T')) {
      const dateOnly = date.split('T')[0]
      const [year, month, day] = dateOnly.split('-').map(Number)
      d = new Date(year, month - 1, day)
    }
  } else {
    d = date
  }
  
  // Usar getFullYear, getMonth, getDate para obtener la fecha en zona horaria local
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Convertir fecha de input local a formato para envío al backend
 * Convierte la fecha a formato ISO manteniendo la fecha local
 */
export function formatDateForBackend(dateString: string): string {
  // dateString viene como "2025-06-29" del input
  // Creamos la fecha a las 12:00 del día para evitar problemas de zona horaria
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0)
  return date.toISOString()
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