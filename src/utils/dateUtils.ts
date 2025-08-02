/**
 * Utilidades para manejo de fechas sin problemas de zona horaria
 */

/**
 * Convierte una fecha string a Date sin problemas de zona horaria
 * Asegura que la fecha se mantenga como fue enviada (sin cambios de hora)
 */
export function parseDate(dateString: string): Date {
  // Si viene en formato YYYY-MM-DD, agregar hora local para evitar cambios de zona horaria
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateString + 'T00:00:00.000')
  }
  
  // Para otros formatos, usar el constructor normal
  return new Date(dateString)
}

/**
 * Convierte una fecha a string en formato YYYY-MM-DD sin problemas de zona horaria
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Crea una fecha para el primer día del mes sin horas
 */
export function getStartOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1, 0, 0, 0, 0)
}

/**
 * Crea una fecha para el último día del mes sin horas
 */
export function getEndOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0, 23, 59, 59, 999)
}

/**
 * Crea una fecha para el inicio del día sin horas
 */
export function getStartOfDay(date: Date): Date {
  const newDate = new Date(date)
  newDate.setHours(0, 0, 0, 0)
  return newDate
}

/**
 * Crea una fecha para el final del día
 */
export function getEndOfDay(date: Date): Date {
  const newDate = new Date(date)
  newDate.setHours(23, 59, 59, 999)
  return newDate
}

/**
 * Normaliza una fecha string para ser guardada en la base de datos
 * Convierte YYYY-MM-DD a una fecha sin problemas de zona horaria
 */
export function normalizeDateForDB(dateString: string): Date {
  // Si es una fecha en formato YYYY-MM-DD, crear fecha local
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day, 0, 0, 0, 0)
  }
  
  // Para otros formatos, parsear normalmente
  const date = new Date(dateString)
  
  // Asegurar que no tenga horas
  date.setHours(0, 0, 0, 0)
  
  return date
}

/**
 * Normaliza una fecha de fin para ser guardada en la base de datos
 * Convierte YYYY-MM-DD a una fecha al final del día
 */
export function normalizeEndDateForDB(dateString: string): Date {
  // Si es una fecha en formato YYYY-MM-DD, crear fecha local al final del día
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day, 23, 59, 59, 999)
  }
  
  // Para otros formatos, parsear y poner al final del día
  const date = new Date(dateString)
  date.setHours(23, 59, 59, 999)
  
  return date
}

/**
 * Verifica si una fecha está en el rango especificado
 */
export function isDateInRange(date: Date, startDate: Date, endDate?: Date): boolean {
  if (date < startDate) {
    return false
  }
  
  if (endDate && date > endDate) {
    return false
  }
  
  return true
}

/**
 * Obtiene el rango de fechas para un mes específico
 */
export function getMonthDateRange(year: number, month: number) {
  return {
    start: getStartOfMonth(year, month),
    end: getEndOfMonth(year, month)
  }
} 