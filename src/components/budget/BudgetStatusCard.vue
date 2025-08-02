<template>
    <div class="budget-status-card">
        <div class="card h-100" :class="cardClass">
            <div class="card-body">
                <!-- Header con nombre y categoría -->
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h6 class="card-title mb-1">{{ budget.name }}</h6>
                        <small class="text-muted">{{ budget.category.name }}</small>
                    </div>
                    <span class="badge rounded-pill"
                        :style="{ backgroundColor: budget.category.colorHex, color: '#fff' }">
                        {{ budget.category.icon }}
                    </span>
                </div>

                <!-- Montos y progreso -->
                <div v-if="budget.currentMonthStatus" class="mb-3">
                    <!-- Monto presupuestado vs gastado -->
                    <div class="d-flex justify-content-between text-sm mb-2">
                        <span class="text-muted">Presupuestado:</span>
                        <strong>{{ formatAmount(budget.currentMonthStatus.budgetedAmount) }}</strong>
                    </div>

                    <div class="d-flex justify-content-between text-sm mb-2">
                        <span class="text-muted">Gastado:</span>
                        <span :class="spentAmountClass">
                            {{ formatAmount(budget.currentMonthStatus.spentAmount) }}
                        </span>
                    </div>

                    <div class="d-flex justify-content-between text-sm mb-3">
                        <span class="text-muted">Disponible:</span>
                        <strong :class="remainingAmountClass">
                            {{ formatAmount(budget.currentMonthStatus.remainingAmount) }}
                        </strong>
                    </div>

                    <!-- Barra de progreso -->
                    <div class="progress mb-2" style="height: 10px;">
                        <div class="progress-bar" :class="progressBarClass" :style="{ width: progressWidth + '%' }"
                            role="progressbar" :aria-valuenow="progressPercentage" aria-valuemin="0"
                            aria-valuemax="100"></div>
                    </div>

                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            {{ formatPercentage(budget.currentMonthStatus.percentageUsed) }} usado
                        </small>
                        <span class="badge" :class="statusBadgeClass">
                            {{ getStatusLabel(budget.currentMonthStatus.status) }}
                        </span>
                    </div>
                </div>

                <!-- Sin datos del mes actual -->
                <div v-else class="text-center py-4">
                    <i class="bi bi-graph-up text-muted fs-4"></i>
                    <p class="text-muted mb-0 mt-2">Sin transacciones este mes</p>
                    <small class="text-muted">
                        Presupuesto: {{ formatAmount(budget.monthlyAmount) }}
                    </small>
                </div>

                <!-- Descripción si existe -->
                <div v-if="budget.description" class="mt-3 pt-3 border-top">
                    <small class="text-muted">{{ budget.description }}</small>
                </div>
            </div>

            <!-- Footer con acciones -->
            <div v-if="showActions" class="card-footer bg-transparent">
                <div class="d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-sm btn-outline-primary" @click="$emit('edit', budget)"
                        title="Editar presupuesto">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-info" @click="$emit('view-details', budget)"
                        title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="$emit('delete', budget)"
                        title="Eliminar presupuesto">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>

            <!-- Indicador de alerta si se supera el umbral -->
            <div v-if="budget.currentMonthStatus && isOverThreshold" class="position-absolute top-0 end-0 m-2">
                <i class="bi bi-exclamation-triangle-fill text-warning fs-5" title="Umbral de alerta superado"></i>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBudgets } from '../../composables/useBudgets'
import type { BudgetWithRelations } from '../../types/budget'

// Props
const props = defineProps<{
    budget: BudgetWithRelations
    showActions?: boolean
}>()

// Emits
defineEmits<{
    edit: [budget: BudgetWithRelations]
    'view-details': [budget: BudgetWithRelations]
    delete: [budget: BudgetWithRelations]
}>()

// Composables
const { formatAmount, formatPercentage, getStatusColor, getStatusLabel } = useBudgets()

// Computed
const progressPercentage = computed(() => {
    if (!props.budget.currentMonthStatus) return 0
    return Math.min(parseFloat(props.budget.currentMonthStatus.percentageUsed), 100)
})

const progressWidth = computed(() => {
    return Math.max(progressPercentage.value, 2) // Mínimo 2% para visibilidad
})

const statusColor = computed(() => {
    if (!props.budget.currentMonthStatus) return 'secondary'
    return getStatusColor(props.budget.currentMonthStatus.status)
})

const cardClass = computed(() => {
    return {
        'border-success': statusColor.value === 'success',
        'border-info': statusColor.value === 'info',
        'border-warning': statusColor.value === 'warning',
        'border-danger': statusColor.value === 'danger',
        'border-secondary': statusColor.value === 'secondary'
    }
})

const progressBarClass = computed(() => {
    return `bg-${statusColor.value}`
})

const statusBadgeClass = computed(() => {
    return `bg-${statusColor.value}`
})

const spentAmountClass = computed(() => {
    if (!props.budget.currentMonthStatus) return ''

    const percentage = parseFloat(props.budget.currentMonthStatus.percentageUsed)
    if (percentage > 100) return 'text-danger fw-bold'
    if (percentage > 80) return 'text-warning fw-bold'
    return 'text-info'
})

const remainingAmountClass = computed(() => {
    if (!props.budget.currentMonthStatus) return ''

    const remaining = parseFloat(props.budget.currentMonthStatus.remainingAmount)
    return remaining < 0 ? 'text-danger' : 'text-success'
})

const isOverThreshold = computed(() => {
    if (!props.budget.currentMonthStatus) return false

    const percentage = parseFloat(props.budget.currentMonthStatus.percentageUsed)
    const threshold = parseFloat(props.budget.alertThreshold)

    return percentage >= threshold
})
</script>

<style scoped>
.budget-status-card {
    position: relative;
}

.card {
    transition: all 0.3s ease;
    border-width: 2px;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-title {
    font-weight: 600;
    color: #495057;
}

.progress {
    background-color: #e9ecef;
    border-radius: 10px;
}

.progress-bar {
    border-radius: 10px;
    transition: width 0.6s ease;
}

.text-sm {
    font-size: 0.875rem;
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
}

.badge {
    font-size: 0.75rem;
}

.card-footer {
    border-top: 1px solid rgba(0, 0, 0, 0.125);
}

.position-absolute {
    z-index: 10;
}

/* Colores específicos para estados */
.border-success {
    border-color: #198754 !important;
}

.border-info {
    border-color: #0dcaf0 !important;
}

.border-warning {
    border-color: #ffc107 !important;
}

.border-danger {
    border-color: #dc3545 !important;
}

.border-secondary {
    border-color: #6c757d !important;
}

@media (max-width: 576px) {
    .card-footer .d-flex {
        flex-direction: column;
        gap: 0.5rem;
    }

    .card-footer .btn {
        width: 100%;
        justify-content: center;
    }
}
</style>