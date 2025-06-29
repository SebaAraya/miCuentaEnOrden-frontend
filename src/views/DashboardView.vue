<template>
  <AppLayout>
    <!-- Contenido del dashboard -->
    <!-- Bienvenida -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card border-0 bg-gradient-primary text-white">
          <div class="card-body p-4">
            <div class="row align-items-center">
              <div class="col-md-8">
                <h1 class="h3 mb-2">¡Bienvenido, {{ authStore.userName }}! 👋</h1>
                <p class="mb-0 opacity-75">
                  Aquí tienes un resumen de tus finanzas. Tu rol actual es:
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
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <div class="d-flex align-items-center justify-content-center mb-3">
              <div class="bg-success bg-opacity-10 rounded-circle p-3">
                <i class="bi bi-arrow-up-circle text-success" style="font-size: 1.5rem;"></i>
              </div>
            </div>
            <h5 class="card-title text-muted small">Ingresos del Mes</h5>
            <h3 class="text-success mb-0">{{ formatCurrency(totalIncome) }}</h3>
            <small class="text-muted">{{ incomeTransactions.length }} transacciones</small>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <div class="d-flex align-items-center justify-content-center mb-3">
              <div class="bg-danger bg-opacity-10 rounded-circle p-3">
                <i class="bi bi-arrow-down-circle text-danger" style="font-size: 1.5rem;"></i>
              </div>
            </div>
            <h5 class="card-title text-muted small">Gastos del Mes</h5>
            <h3 class="text-danger mb-0">{{ formatCurrency(totalExpenses) }}</h3>
            <small class="text-muted">{{ expenseTransactions.length }} transacciones</small>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <div class="d-flex align-items-center justify-content-center mb-3">
              <div class="bg-primary bg-opacity-10 rounded-circle p-3">
                <i class="bi bi-wallet2 text-primary" style="font-size: 1.5rem;"></i>
              </div>
            </div>
            <h5 class="card-title text-muted small">Balance</h5>
            <h3 :class="netAmount >= 0 ? 'text-success' : 'text-danger'" class="mb-0">
              {{ formatCurrency(netAmount) }}
            </h3>
            <small class="text-muted">
              {{ netAmount >= 0 ? 'Ahorro positivo' : 'Déficit' }}
            </small>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <div class="d-flex align-items-center justify-content-center mb-3">
              <div class="bg-warning bg-opacity-10 rounded-circle p-3">
                <i class="bi bi-receipt text-warning" style="font-size: 1.5rem;"></i>
              </div>
            </div>
            <h5 class="card-title text-muted small">Total Transacciones</h5>
            <h3 class="text-warning mb-0">{{ transactions.length }}</h3>
            <small class="text-muted">Registradas</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráficos y resúmenes -->
    <div class="row g-4 mb-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pb-0">
            <h5 class="card-title mb-0">
              <i class="bi bi-bar-chart-line me-2"></i>
              Distribución por Categorías
            </h5>
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
                    <span class="fw-medium">{{ formatCurrency(stat.total) }}</span>
                    <small class="text-muted ms-2">({{ stat.count }} transacciones)</small>
                  </div>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar" :style="{
                    width: stat.percentage + '%',
                    backgroundColor: stat.category?.colorHex || '#6c757d'
                  }"></div>
                </div>
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

      <div class="col-lg-4">
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
      </div>
    </div>

    <!-- Transacciones recientes -->
    <div class="row">
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">
              <i class="bi bi-clock-history me-2"></i>
              Transacciones Recientes
            </h5>
            <router-link to="/transactions" class="btn btn-outline-primary btn-sm">
              <i class="bi bi-arrow-right me-1"></i>
              Ver todas
            </router-link>
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
              <router-link to="/transactions" class="btn btn-primary">
                <i class="bi bi-plus-lg me-2"></i>
                Agregar primera transacción
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import { UserRole } from '@/types/auth'
import { TransactionType } from '@/types/financial'

import {
  formatCurrency,
  formatDateForDisplay,
  getTransactionTypeIcon,
  getTransactionTypeClass
} from '@/services/financialService'
import AppLayout from '@/components/layout/AppLayout.vue'

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
  getCategoryById
} = useCategories()

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

  transactions.value.forEach(transaction => {
    const categoryId = transaction.categoryId
    if (!stats.has(categoryId)) {
      stats.set(categoryId, {
        categoryId,
        category: getCategoryById(categoryId),
        total: 0,
        count: 0
      })
    }

    const stat = stats.get(categoryId)
    stat.total += parseFloat(transaction.amount)
    stat.count += 1
  })

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
  await Promise.all([
    fetchTransactions({ limit: 50 }),
    fetchCategories()
  ])
}

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error durante logout:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
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