/**
 * Utilidades para manejo de fechas en el frontend
 * Utiliza day.js para operaciones de fecha más robustas
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/es'

// Configurar plugins de dayjs
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.locale('es')

// Zona horaria por defecto para Chile
const DEFAULT_TIMEZONE = 'America/Santiago'

/**
 * Convierte una fecha string a Date sin problemas de zona horaria
 */
export function parseDate(dateString: string): Date {
  // Si viene en formato YYYY-MM-DD, usar dayjs para manejo preciso
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dayjs(dateString, 'YYYY-MM-DD').startOf('day').toDate()
  }
  
  // Para fechas ISO completas, usar dayjs
  if (dateString.includes('T')) {
    return dayjs(dateString).toDate()
  }
  
  // Para otros formatos, usar dayjs con parsing automático
  return dayjs(dateString).toDate()
}

/**
 * Convierte una fecha a string en formato YYYY-MM-DD sin problemas de zona horaria
 */
export function formatDateToString(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * Convierte una fecha a string para mostrar al usuario (formato chileno)
 */
export function formatDateForDisplay(date: Date | string): string {
  return dayjs(date).format('DD/MM/YYYY')
}

/**
 * Convierte una fecha a string con hora para mostrar al usuario
 */
export function formatDateTimeForDisplay(date: Date | string): string {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('DD/MM/YYYY HH:mm')
}

/**
 * Convierte fecha ISO a formato local para input date
 * Corrige el problema de zona horaria que causaba que se mostrara un día menos
 */
export function formatDateForInput(date: Date | string): string {
  // Si la fecha viene como string del backend, necesitamos parsearlo correctamente
  if (typeof date === 'string') {
    // Para fechas ISO del backend, usar dayjs para parseo preciso
    if (date.includes('T')) {
      return dayjs(date).format('YYYY-MM-DD')
    }
    
    // Para fechas en formato YYYY-MM-DD, devolverlas tal como están
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date
    }
  }
  
  // Para objetos Date, usar dayjs para formateo
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * Convierte fecha de fin del backend a formato para input
 * Específica para endDate que viene como final del día
 */
export function formatEndDateForInput(date: Date | string): string {
  if (typeof date === 'string') {
    // Para fechas ISO del backend que representan final del día
    if (date.includes('T')) {
      const parsed = dayjs(date)
      // Si es final del día (23:59:59), mostrar ese día
      // Si es inicio del día siguiente, mostrar el día anterior
      if (parsed.hour() === 23 && parsed.minute() === 59) {
        return parsed.format('YYYY-MM-DD')
      } else if (parsed.hour() === 0 && parsed.minute() === 0) {
        return parsed.subtract(1, 'day').format('YYYY-MM-DD')
      }
      return parsed.format('YYYY-MM-DD')
    }
    
    // Para fechas en formato YYYY-MM-DD, devolverlas tal como están
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date
    }
  }
  
  // Para objetos Date, usar dayjs para formateo
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * Convierte fecha de input local a formato para envío al backend
 * Mantiene el formato YYYY-MM-DD sin conversión de zona horaria
 */
export function formatDateForBackend(dateString: string): string {
  // dateString viene como "2025-06-29" del input
  // Para transacciones, solo necesitamos la fecha, no la hora
  // Evitamos conversiones de zona horaria enviando solo la fecha
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString
  }
  
  // Si viene en otro formato, convertir a YYYY-MM-DD
  return dayjs(dateString).format('YYYY-MM-DD')
}

/**
 * Convierte fecha de input local a formato para envío al backend (final del día)
 * Específicamente para fechas de fin (endDate)
 */
export function formatEndDateForBackend(dateString: string): string {
  // dateString viene como "2025-06-29" del input
  // Crear fecha al final del día para fechas de fin
  const date = dayjs(dateString, 'YYYY-MM-DD').endOf('day')
  return date.toISOString()
}

/**
 * Obtiene fecha actual en formato para input date
 */
export function getCurrentDateForInput(): string {
  return dayjs().format('YYYY-MM-DD')
}

/**
 * Crea una fecha para el primer día del mes
 */
export function getStartOfMonth(year: number, month: number): Date {
  return dayjs().year(year).month(month - 1).startOf('month').toDate()
}

/**
 * Crea una fecha para el último día del mes
 */
export function getEndOfMonth(year: number, month: number): Date {
  return dayjs().year(year).month(month - 1).endOf('month').toDate()
}

/**
 * Crea una fecha para el inicio del día
 */
export function getStartOfDay(date: Date): Date {
  return dayjs(date).startOf('day').toDate()
}

/**
 * Crea una fecha para el final del día
 */
export function getEndOfDay(date: Date): Date {
  return dayjs(date).endOf('day').toDate()
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

/**
 * Valida si una fecha string tiene un formato válido
 */
export function validateDateString(dateString: string): boolean {
  return dayjs(dateString).isValid()
}

/**
 * Agrega días a una fecha
 */
export function addDays(date: Date, days: number): Date {
  return dayjs(date).add(days, 'day').toDate()
}

/**
 * Agrega meses a una fecha
 */
export function addMonths(date: Date, months: number): Date {
  return dayjs(date).add(months, 'month').toDate()
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function diffInDays(date1: Date, date2: Date): number {
  return dayjs(date1).diff(dayjs(date2), 'day')
}

/**
 * Verifica si una fecha es anterior a otra
 */
export function isBefore(date1: Date, date2: Date): boolean {
  return dayjs(date1).isBefore(dayjs(date2))
}

/**
 * Verifica si una fecha es posterior a otra
 */
export function isAfter(date1: Date, date2: Date): boolean {
  return dayjs(date1).isAfter(dayjs(date2))
}

/**
 * Verifica si dos fechas son del mismo día
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return dayjs(date1).isSame(dayjs(date2), 'day')
}

/**
 * Obtiene el nombre del mes en español
 */
export function getMonthName(month: number): string {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return monthNames[month - 1] || 'Mes inválido'
}

/**
 * Obtiene el nombre del día de la semana en español
 */
export function getDayName(date: Date): string {
  return dayjs(date).format('dddd')
}

/**
 * Verifica si una fecha está en el rango especificado
 */
export function isDateInRange(date: Date, startDate: Date, endDate?: Date): boolean {
  const targetDate = dayjs(date)
  const start = dayjs(startDate)
  
  if (targetDate.isBefore(start)) {
    return false
  }
  
  if (endDate && targetDate.isAfter(dayjs(endDate))) {
    return false
  }
  
  return true
}

/**
 * Obtiene el número de días en un mes específico
 */
export function getDaysInMonth(year: number, month: number): number {
  return dayjs().year(year).month(month - 1).daysInMonth()
}

/**
 * Convierte una fecha a timestamp
 */
export function dateToTimestamp(date: Date): number {
  return dayjs(date).valueOf()
}

/**
 * Convierte un timestamp a fecha
 */
export function timestampToDate(timestamp: number): Date {
  return dayjs(timestamp).toDate()
}

/**
 * Obtiene la fecha actual
 */
export function getCurrentDate(): Date {
  return dayjs().toDate()
}

/**
 * Obtiene el año actual
 */
export function getCurrentYear(): number {
  return dayjs().year()
}

/**
 * Obtiene el mes actual (1-12)
 */
export function getCurrentMonth(): number {
  return dayjs().month() + 1
}

/**
 * Obtiene el día actual del mes
 */
export function getCurrentDay(): number {
  return dayjs().date()
}