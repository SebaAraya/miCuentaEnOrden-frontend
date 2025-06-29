import { ref, computed, type Ref } from 'vue'
import type { Transaction, TransactionFilters, CreateTransactionRequest, UpdateTransactionRequest } from '@/types/financial'
import { 
  getTransactions, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction,
  getTransactionById 
} from '@/services/financialService'

export function useTransactions() {
  // Estado reactivo
  const transactions: Ref<Transaction[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalTransactions = ref(0)

  // Estado para filtros
  const filters: Ref<TransactionFilters> = ref({
    page: 1,
    limit: 10
  })

  // Computed
  const hasTransactions = computed(() => transactions.value.length > 0)
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  // Métodos
  async function fetchTransactions(newFilters?: Partial<TransactionFilters>) {
    try {
      loading.value = true
      error.value = null

      if (newFilters) {
        filters.value = { ...filters.value, ...newFilters }
      }

      const result = await getTransactions(filters.value)
      console.log('result', result)
      transactions.value = result
      
      // Actualizar paginación (por ahora simple, se mejorará cuando el backend devuelva metadata)
      currentPage.value = filters.value.page || 1
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar transacciones'
      console.error('Error fetching transactions:', err)
    } finally {
      loading.value = false
    }
  }

  async function addTransaction(transactionData: CreateTransactionRequest) {
    try {
      loading.value = true
      error.value = null

      const newTransaction = await createTransaction(transactionData)
      
      // Agregar al inicio de la lista
      transactions.value.unshift(newTransaction)
      totalTransactions.value++

      return newTransaction
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear transacción'
      console.error('Error creating transaction:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function editTransaction(id: string, transactionData: UpdateTransactionRequest) {
    try {
      loading.value = true
      error.value = null

      const updatedTransaction = await updateTransaction(id, transactionData)
      
      // Actualizar en la lista
      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) {
        transactions.value[index] = updatedTransaction
      }

      return updatedTransaction
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar transacción'
      console.error('Error updating transaction:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeTransaction(id: string) {
    try {
      loading.value = true
      error.value = null

      await deleteTransaction(id)
      
      // Remover de la lista
      transactions.value = transactions.value.filter(t => t.id !== id)
      totalTransactions.value--

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar transacción'
      console.error('Error deleting transaction:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getTransaction(id: string): Promise<Transaction | null> {
    try {
      loading.value = true
      error.value = null

      return await getTransactionById(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar transacción'
      console.error('Error fetching transaction:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  function nextPage() {
    if (hasNextPage.value) {
      fetchTransactions({ page: currentPage.value + 1 })
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      fetchTransactions({ page: currentPage.value - 1 })
    }
  }

  function setPage(page: number) {
    fetchTransactions({ page })
  }

  function clearFilters() {
    filters.value = { page: 1, limit: 10 }
    fetchTransactions()
  }

  function clearError() {
    error.value = null
  }

  // Métodos de utilidad
  function getTransactionsByType(type: 'INCOME' | 'EXPENSE') {
    return transactions.value.filter(t => t.type === type)
  }

  function getTotalByType(type: 'INCOME' | 'EXPENSE'): number {
    return getTransactionsByType(type)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  }

  const totalIncome = computed(() => getTotalByType('INCOME'))
  const totalExpenses = computed(() => getTotalByType('EXPENSE'))
  const netAmount = computed(() => totalIncome.value - totalExpenses.value)

  return {
    // Estado
    transactions,
    loading,
    error,
    currentPage,
    totalPages,
    totalTransactions,
    filters,

    // Computed
    hasTransactions,
    hasNextPage,
    hasPrevPage,
    totalIncome,
    totalExpenses,
    netAmount,

    // Métodos
    fetchTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
    getTransaction,
    nextPage,
    prevPage,
    setPage,
    clearFilters,
    clearError,
    getTransactionsByType,
    getTotalByType
  }
} 