<template>
  <!-- Selector de organización cuando es requerido -->
  <OrganizationPicker v-if="authStore.requiresOrganizationSelection" />

  <AppLayout v-else>
    <!-- Contenido del dashboard -->
    <!-- Bienvenida -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card border-0 bg-gradient-primary text-white p-0">
          <div class="card-body p-4">
            <div class="row align-items-center">
              <div class="col-md-8">
                <h1 class="h3 mb-2">¡Bienvenido, {{ authStore.userName }}! 👋</h1>
                <p class="mb-1 opacity-75">
                  Aquí tienes un resumen de tus finanzas para <strong>{{ currentMonthText }}</strong>
                </p>
                <p class="mb-0 opacity-75">
                  Tu rol actual es:
                  <span class="badge bg-light text-dark ms-1">{{ userRoleText }}</span>
                </p>
              </div>
              <div class="col-md-4 text-md-end">
                <i class="bi bi-graph-up-arrow" style="font-size: 3rem; opacity: 0.3;"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-3 text-muted">Cargando datos financieros...
        {{ transactionsLoading }}
        {{ categoriesLoading }}
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      {{ error }}
      <button @click="loadDashboardData" class="btn btn-outline-danger btn-sm ms-2">
        <i class="bi bi-arrow-clockwise me-1"></i>
        Reintentar
      </button>
    </div>

    <!-- Contenido principal -->

    <!-- Cards de resumen -->
    <!-- Gráficos y resúmenes -->
    <div class="row g-4 mb-4">
      <div class="col-lg-3">
        <div class="card border-0 shadow-sm mb-2 p-0">
          <div class="card-body text-center py-3 px-2">
            <h6 class="card-title text-muted small mb-1 d-flex align-items-center justify-content-center">
              <span class="me-2">💰</span>Ingresos del Mes
            </h6>
            <h4 class="text-success mb-1">{{ formatCurrency(totalIncome) }}</h4>
            <small class="text-muted">{{ incomeTransactions.length }} transacciones</small>
          </div>
        </div>
        <div class="card border-0 shadow-sm my-2 p-0">
          <div class="card-body text-center py-3 px-2">
            <h6 class="card-title text-muted small mb-1 d-flex align-items-center justify-content-center">
              <span class="me-2">💸</span>Gastos del Mes
            </h6>
            <h4 class="text-danger mb-1">{{ formatCurrency(totalExpenses) }}</h4>
            <small class="text-muted">{{ expenseTransactions.length }} transacciones</small>
          </div>
        </div>
        <div class="card border-0 shadow-sm my-2 p-0">
          <div class="card-body text-center py-3 px-2">
            <h6 class="card-title text-muted small mb-1 d-flex align-items-center justify-content-center">
              <span class="me-2">⚖️</span>Balance
            </h6>
            <h4 :class="netAmount >= 0 ? 'text-success' : 'text-danger'" class="mb-1">
              {{ formatCurrency(netAmount) }}
            </h4>
            <small class="text-muted">
              {{ netAmount >= 0 ? 'Ahorro positivo' : 'Déficit' }}
            </small>
          </div>
        </div>
        <div class="card border-0 shadow-sm mt-2 p-0">
          <div class="card-body text-center py-3 px-2">
            <h6 class="card-title text-muted small mb-1 d-flex align-items-center justify-content-center">
              <span class="me-2">📊</span>Total Transacciones
            </h6>
            <h4 class="text-warning mb-1">{{ transactions.length }}</h4>
            <small class="text-muted">Registradas</small>
          </div>
        </div>
      </div>
      <div class="col-lg-9">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pb-0">
            <h5 class="card-title mb-0">
              <i class="bi bi-bar-chart-line me-2"></i>
              Distribución por Categorías
            </h5>
            <small class="text-muted">
              <i class="bi bi-calendar-month me-1"></i>
              {{ currentMonthText }}
            </small>
          </div>
          <div class="card-body">
            <div v-if="categoryStats.length > 0">
              <div v-for="stat in categoryStats" :key="stat.categoryId" class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="d-flex align-items-center">
                    <span class="me-2">{{ stat.category?.icon || '📊' }}</span>
                    <span class="fw-medium">{{ stat.category?.name || 'Sin categoría' }}</span>
                  </div>
                  <div class="text-end">
                    <div>
                      <span class="fw-medium">{{ formatCurrency(stat.total) }}</span>
                      <span v-if="stat.budgetAmount > 0" class="text-muted ms-2">
                        / {{ formatCurrency(stat.budgetAmount) }}
                      </span>
                    </div>
                    <div class="small text-muted">
                      <span v-if="stat.count > 0">({{ stat.count }} transacciones)</span>
                      <span v-if="stat.budgetAmount > 0" class="ms-2">
                        <i class="bi bi-piggy-bank me-1"></i>Presupuesto
                      </span>
                    </div>
                  </div>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar" :style="{
                    width: stat.percentage + '%',
                    backgroundColor: stat.category?.colorHex || '#6c757d'
                  }"></div>
                </div>
                <!-- Barra de progreso del presupuesto (si existe) -->
                <div v-if="stat.budgetAmount > 0" class="progress mt-1" style="height: 4px;">
                  <div class="progress-bar" :class="{
                    'bg-success': (stat.total / stat.budgetAmount) * 100 <= 80,
                    'bg-warning': (stat.total / stat.budgetAmount) * 100 > 80 && (stat.total / stat.budgetAmount) * 100 <= 100,
                    'bg-danger': (stat.total / stat.budgetAmount) * 100 > 100
                  }" :style="{ width: Math.min((stat.total / stat.budgetAmount) * 100, 100) + '%' }"
                    :title="`${((stat.total / stat.budgetAmount) * 100).toFixed(1)}% del presupuesto usado`">
                  </div>
                </div>
              </div>
              <!-- Leyenda -->
              <div class="mt-3 pt-2 border-top">
                <small class="text-muted">
                  <i class="bi bi-info-circle me-1"></i>
                  <strong>Barra superior:</strong> Distribución de gastos por categoría.
                  <strong>Barra inferior:</strong> Progreso vs. presupuesto (si existe).
                </small>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="bi bi-graph-up text-muted" style="font-size: 3rem;"></i>
              <p class="text-muted mt-3">No hay datos para mostrar</p>
              <small class="text-muted">Agrega algunas transacciones para ver las estadísticas</small>
            </div>
          </div>
        </div>
      </div>

      <!-- <div class="col-lg-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pb-0">
            <h5 class="card-title mb-0">
              <i class="bi bi-collection me-2"></i>
              Categorías Disponibles
            </h5>
          </div>
          <div class="card-body">
            <div v-if="categories.length > 0" class="row g-2">
              <div v-for="category in categories.slice(0, 8)" :key="category.id" class="col-6">
                <div class="p-2 rounded text-center small" :style="getCategoryStyle(category)">
                  <div class="mb-1">{{ category.icon }}</div>
                  <div class="fw-medium">{{ category.name }}</div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="bi bi-collection text-muted" style="font-size: 3rem;"></i>
              <p class="text-muted mt-3">No hay categorías</p>
            </div>
          </div>
        </div>
      </div> -->
    </div>

    <!-- Transacciones recientes -->
    <div class="row">
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
            <div>
              <h5 class="card-title mb-0">
                <i class="bi bi-clock-history me-2"></i>
                Transacciones Recientes
              </h5>
              <small class="text-muted">
                <i class="bi bi-calendar-month me-1"></i>
                {{ currentMonthText }}
              </small>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#dashboardTransactionModal">
                <i class="bi bi-plus-lg me-1"></i>
                Nueva
              </button>
              <router-link to="/transactions" class="btn btn-outline-primary btn-sm">
                <i class="bi bi-arrow-right me-1"></i>
                Ver todas
              </router-link>
            </div>
          </div>
          <div class="card-body">
            <div v-if="recentTransactions.length > 0" class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Tipo</th>
                    <th class="text-end">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="transaction in recentTransactions" :key="transaction.id">
                    <td>
                      <small class="text-muted">{{ formatDateForDisplay(transaction.transactionDate) }}</small>
                    </td>
                    <td>
                      <div class="fw-medium">{{ transaction.description }}</div>
                    </td>
                    <td>
                      <span class="badge" :style="{
                        backgroundColor: transaction.category?.colorHex + '20',
                        color: transaction.category?.colorHex,
                        border: `1px solid ${transaction.category?.colorHex}40`
                      }">
                        {{ transaction.category?.icon }} {{ transaction.category?.name }}
                      </span>
                    </td>
                    <td>
                      <span class="badge"
                        :class="transaction.type === 'INCOME' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                        <i :class="getTransactionTypeIcon(transaction.type)"></i>
                        {{ transaction.type === 'INCOME' ? 'Ingreso' : 'Gasto' }}
                      </span>
                    </td>
                    <td class="text-end">
                      <span class="fw-medium" :class="getTransactionTypeClass(transaction.type)">
                        {{ transaction.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center py-4">
              <i class="bi bi-receipt text-muted" style="font-size: 3rem;"></i>
              <p class="text-muted mt-3">No hay transacciones recientes</p>
              <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#dashboardTransactionModal">
                <i class="bi bi-plus-lg me-2"></i>
                Agregar primera transacción
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para nueva transacción -->
    <TransactionModal modal-id="dashboardTransactionModal" @transaction-created="handleTransactionCreated" />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import { useBudgets } from '@/composables/useBudgets'
import { UserRole } from '@/types/auth'
import { getCurrentYear, getCurrentMonth, getStartOfMonth, getEndOfMonth, getMonthName } from '@/utils/dateUtils'

import {
  formatCurrency,
  formatDateForDisplay,
  getTransactionTypeIcon,
  getTransactionTypeClass
} from '@/services/financialService'
import AppLayout from '@/components/layout/AppLayout.vue'
import OrganizationPicker from '@/components/forms/OrganizationPicker.vue'
import TransactionModal from '@/components/forms/TransactionModal.vue'

const router = useRouter()
const authStore = useAuthStore()

// Composables
const {
  transactions,
  loading: transactionsLoading,
  error: transactionsError,
  totalIncome,
  totalExpenses,
  netAmount,
  fetchTransactions,
  getTransactionsByType
} = useTransactions()

const {
  categories,
  loading: categoriesLoading,
  error: categoriesError,
  fetchCategories,
  getCategoryByIdLocal
} = useCategories()

const {
  report: budgetReport,
  fetchBudgetReport,
  updateFilters: updateBudgetFilters
} = useBudgets()

// Estado local
const loading = computed(() => transactionsLoading.value || categoriesLoading.value)
const error = computed(() => transactionsError.value || categoriesError.value)

// Computed properties
const userRoleText = computed(() => {
  switch (authStore.userRole) {
    case UserRole.ADMIN:
      return 'Administrador'
    case UserRole.COLABORADOR:
      return 'Colaborador'
    case UserRole.USUARIO_BASICO:
      return 'Usuario Básico'
    default:
      return 'Usuario'
  }
})

const currentMonthText = computed(() => {
  const year = getCurrentYear()
  const month = getCurrentMonth()
  return `${getMonthName(month)} ${year}`
})

const incomeTransactions = computed(() => getTransactionsByType('INCOME'))
const expenseTransactions = computed(() => getTransactionsByType('EXPENSE'))

const recentTransactions = computed(() => {
  return transactions.value
    .slice()
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 5)
})

const categoryStats = computed(() => {
  const stats = new Map()

  // Agregar datos de transacciones (gastos reales)
  transactions.value.forEach(transaction => {
    const categoryId = transaction.categoryId
    if (!stats.has(categoryId)) {
      stats.set(categoryId, {
        categoryId,
        category: getCategoryByIdLocal(categoryId),
        total: 0,
        count: 0,
        budgetAmount: 0
      })
    }

    const stat = stats.get(categoryId)
    stat.total += parseFloat(transaction.amount)
    stat.count += 1
  })

  // Agregar datos de presupuestos
  if (budgetReport.value?.topCategoriesByBudget) {
    budgetReport.value.topCategoriesByBudget.forEach(budgetCategory => {
      if (!stats.has(budgetCategory.categoryId)) {
        stats.set(budgetCategory.categoryId, {
          categoryId: budgetCategory.categoryId,
          category: getCategoryByIdLocal(budgetCategory.categoryId),
          total: 0,
          count: 0,
          budgetAmount: 0
        })
      }

      const stat = stats.get(budgetCategory.categoryId)
      stat.budgetAmount = budgetCategory.totalBudgeted
    })
  }

  const totalAmount = Array.from(stats.values()).reduce((sum, stat) => sum + stat.total, 0)

  return Array.from(stats.values())
    .map(stat => ({
      ...stat,
      percentage: totalAmount > 0 ? (stat.total / totalAmount) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
})

// Métodos
function getCategoryStyle(category: any) {
  return {
    backgroundColor: category.colorHex + '20',
    borderLeft: `4px solid ${category.colorHex}`
  }
}

async function loadDashboardData() {
  // Obtener fechas del mes actual
  const currentYear = getCurrentYear()
  const currentMonth = getCurrentMonth()
  const startOfMonth = getStartOfMonth(currentYear, currentMonth)
  const endOfMonth = getEndOfMonth(currentYear, currentMonth)

  const filters: any = {
    limit: 50,
    startDate: startOfMonth.toISOString().split('T')[0], // YYYY-MM-DD
    endDate: endOfMonth.toISOString().split('T')[0]      // YYYY-MM-DD
  }

  // Agregar organizationId para ADMIN y COLABORADOR
  if (authStore.userRole === 'ADMIN' || authStore.userRole === 'COLABORADOR') {
    if (authStore.selectedOrganizationId) {
      filters.organizationId = authStore.selectedOrganizationId
    }
  }

  // Configurar filtros de presupuesto para el mes actual
  updateBudgetFilters({
    year: currentYear,
    month: currentMonth
  })

  await Promise.all([
    fetchTransactions(filters),
    fetchCategories(),
    fetchBudgetReport()
  ])
}

// Handler para cuando se crea una nueva transacción
const handleTransactionCreated = () => {
  // Recargar datos del dashboard
  loadDashboardData()
}

// Watcher para recargar cuando se seleccione organización
watch(() => authStore.selectedOrganizationId, (newOrgId) => {
  if (newOrgId || authStore.userRole === 'USUARIO_BASICO') {
    loadDashboardData()
  }
})

// Lifecycle
onMounted(async () => {
  // Cargar organizaciones disponibles si es necesario para ADMIN/COLABORADOR
  if (authStore.userRole === 'ADMIN' || authStore.userRole === 'COLABORADOR') {
    await authStore.fetchAvailableOrganizations()
  }

  // Una vez que las organizaciones estén cargadas, verificar si cargar datos
  if (!authStore.requiresOrganizationSelection) {
    loadDashboardData()
  }
})
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
}

.navbar-brand {
  font-weight: 600;
  font-size: 1.25rem;
}

.nav-link.active {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
}
</style>