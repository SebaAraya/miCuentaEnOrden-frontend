import { Decimal } from '@prisma/client/runtime/library'
import type { AmountValidation, DateRangeValidation } from '../types/financial.js'

/**
 * Valida y normaliza montos financieros
 */
export function validateAmount(amount: number | string | Decimal): AmountValidation {
  try {
    // Convertir a string para procesamiento
    const amountStr = amount.toString().trim()
    
    // Verificar que no esté vacío
    if (!amountStr) {
      return {
        isValid: false,
        error: 'El monto es requerido'
      }
    }

    // Crear Decimal y validar
    const decimalAmount = new Decimal(amountStr)
    
    // Verificar que sea positivo
    if (decimalAmount.lessThanOrEqualTo(0)) {
      return {
        isValid: false,
        error: 'El monto debe ser mayor a 0'
      }
    }

    // Verificar límites razonables (máximo 999,999,999.99)
    const maxAmount = new Decimal('999999999.99')
    if (decimalAmount.greaterThan(maxAmount)) {
      return {
        isValid: false,
        error: 'El monto excede el límite máximo permitido'
      }
    }

    // Verificar que tenga máximo 2 decimales
    if (decimalAmount.decimalPlaces() > 2) {
      return {
        isValid: false,
        error: 'El monto no puede tener más de 2 decimales'
      }
    }

    return {
      isValid: true,
      normalizedAmount: decimalAmount
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Formato de monto inválido'
    }
  }
}

/**
 * Valida y normaliza rangos de fechas
 */
export function validateDateRange(
  startDate: Date | string | undefined,
  endDate: Date | string | undefined
): DateRangeValidation {
  try {
    let normalizedStartDate: Date | undefined
    let normalizedEndDate: Date | undefined

    // Validar fecha de inicio
    if (startDate) {
      normalizedStartDate = new Date(startDate)
      if (isNaN(normalizedStartDate.getTime())) {
        return {
          isValid: false,
          error: 'Fecha de inicio inválida'
        }
      }
    }

    // Validar fecha de fin
    if (endDate) {
      normalizedEndDate = new Date(endDate)
      if (isNaN(normalizedEndDate.getTime())) {
        return {
          isValid: false,
          error: 'Fecha de fin inválida'
        }
      }
    }

    // Verificar que la fecha de inicio sea anterior a la fecha de fin
    if (normalizedStartDate && normalizedEndDate) {
      if (normalizedStartDate >= normalizedEndDate) {
        return {
          isValid: false,
          error: 'La fecha de inicio debe ser anterior a la fecha de fin'
        }
      }
    }

    // Verificar que las fechas no sean muy antiguas (más de 10 años)
    const tenYearsAgo = new Date()
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)

    if (normalizedStartDate && normalizedStartDate < tenYearsAgo) {
      return {
        isValid: false,
        error: 'La fecha de inicio no puede ser anterior a 10 años'
      }
    }

    // Verificar que las fechas no sean muy futuras (más de 5 años)
    const fiveYearsFromNow = new Date()
    fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5)

    if (normalizedEndDate && normalizedEndDate > fiveYearsFromNow) {
      return {
        isValid: false,
        error: 'La fecha de fin no puede ser posterior a 5 años'
      }
    }

    return {
      isValid: true,
      normalizedStartDate,
      normalizedEndDate
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Error validando fechas'
    }
  }
}

/**
 * Convierte Decimal a string para respuestas JSON
 */
export function decimalToString(decimal: Decimal | null | undefined): string {
  if (!decimal) return '0.00'
  return decimal.toFixed(2)
}

/**
 * Convierte string a Decimal de forma segura
 */
export function stringToDecimal(value: string | number): Decimal {
  return new Decimal(value.toString())
}

/**
 * Calcula porcentaje de uso de presupuesto
 */
export function calculateBudgetUsage(spent: Decimal, budget: Decimal): number {
  if (budget.lessThanOrEqualTo(0)) return 0
  return spent.dividedBy(budget).mul(100).toNumber()
}

/**
 * Determina el estado del presupuesto basado en el porcentaje usado
 */
export function getBudgetStatus(usagePercentage: number): string {
  if (usagePercentage <= 50) return 'UNDER_BUDGET'
  if (usagePercentage <= 80) return 'ON_TRACK'
  if (usagePercentage <= 100) return 'WARNING'
  return 'EXCEEDED'
}

/**
 * Valida descripción de transacción
 */
export function validateDescription(description: string): { isValid: boolean; error?: string } {
  const trimmed = description.trim()
  
  if (!trimmed) {
    return {
      isValid: false,
      error: 'La descripción es requerida'
    }
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'La descripción debe tener al menos 3 caracteres'
    }
  }

  if (trimmed.length > 255) {
    return {
      isValid: false,
      error: 'La descripción no puede exceder 255 caracteres'
    }
  }

  return { isValid: true }
}

/**
 * Valida nombre de categoría
 */
export function validateCategoryName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim()
  
  if (!trimmed) {
    return {
      isValid: false,
      error: 'El nombre de la categoría es requerido'
    }
  }

  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: 'El nombre debe tener al menos 2 caracteres'
    }
  }

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: 'El nombre no puede exceder 50 caracteres'
    }
  }

  // Verificar caracteres válidos (letras, números, espacios, algunos símbolos)
  const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_\.]+$/
  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'El nombre contiene caracteres no válidos'
    }
  }

  return { isValid: true }
}

/**
 * Valida código de color hexadecimal
 */
export function validateColorHex(color: string): { isValid: boolean; error?: string } {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  
  if (!hexPattern.test(color)) {
    return {
      isValid: false,
      error: 'Formato de color inválido. Use formato hexadecimal (#RRGGBB)'
    }
  }

  return { isValid: true }
}

/**
 * Genera resumen financiero para un período
 */
export function calculateFinancialSummary(transactions: Array<{
  amount: Decimal
  type: string
}>): {
  totalIncome: Decimal
  totalExpenses: Decimal
  netAmount: Decimal
} {
  let totalIncome = new Decimal(0)
  let totalExpenses = new Decimal(0)

  for (const transaction of transactions) {
    if (transaction.type === 'INCOME') {
      totalIncome = totalIncome.plus(transaction.amount)
    } else if (transaction.type === 'EXPENSE') {
      totalExpenses = totalExpenses.plus(transaction.amount)
    }
  }

  const netAmount = totalIncome.minus(totalExpenses)

  return {
    totalIncome,
    totalExpenses,
    netAmount
  }
}

/**
 * Formatea monto para mostrar en UI
 */
export function formatCurrency(amount: Decimal | string | number, currency = '$'): string {
  const decimal = typeof amount === 'string' || typeof amount === 'number' 
    ? new Decimal(amount) 
    : amount
  
  const formatted = decimal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${currency}${formatted}`
}

/**
 * Obtiene el primer y último día del mes
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  
  return { start, end }
} 