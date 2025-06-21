<template>
  <div class="container my-5">
    <!-- Header -->
    <div class="text-center mb-5">
      <h1 class="display-4 mb-3">
        <i class="bi bi-bank2 text-primary me-3"></i>
        MiCuentaEnOrden
      </h1>
      <p class="lead">Sistema de componentes Bootstrap para gestión financiera</p>
    </div>

    <!-- Componentes Base -->
    <div class="row mb-5">
      <div class="col-12">
        <h2 class="h3 mb-4">
          <i class="bi bi-puzzle me-2"></i>
          Componentes Base
        </h2>

        <!-- Botones Financieros -->
        <div class="mb-4">
          <h4 class="h5 mb-3">Botones Financieros</h4>
          <div class="d-flex flex-wrap gap-3">
            <BaseButton variant="financial" icon="plus-circle">
              Nueva Transacción
            </BaseButton>
            <BaseButton variant="income" icon="arrow-up-circle">
              Registrar Ingreso
            </BaseButton>
            <BaseButton variant="expense" icon="arrow-down-circle">
              Registrar Gasto
            </BaseButton>
            <BaseButton variant="primary" icon="chart-bar" loading>
              Generando Reporte
            </BaseButton>
            <BaseButton variant="outline-primary" icon="download" size="sm">
              Exportar
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Cards Financieras -->
    <div class="row mb-5">
      <div class="col-12">
        <h2 class="h3 mb-4">
          <i class="bi bi-card-list me-2"></i>
          Cards Financieras
        </h2>

        <div class="row">
          <!-- Card de Balance -->
          <div class="col-md-4 mb-3">
            <BaseCard variant="balance" title="Balance Total" icon="wallet2">
              <div class="text-center">
                <h2 class="money-display display-5 mb-0">$12,500.00</h2>
                <small class="opacity-75">Actualizado hoy</small>
              </div>
            </BaseCard>
          </div>

          <!-- Card de Transacción -->
          <div class="col-md-4 mb-3">
            <BaseCard variant="transaction" title="Transacción Reciente" hoverable>
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1">Supermercado</h6>
                  <small class="text-muted">Alimentación • Hoy</small>
                </div>
                <span class="money-display h5 text-danger mb-0">-$45.30</span>
              </div>
            </BaseCard>
          </div>

          <!-- Card de Presupuesto -->
          <div class="col-md-4 mb-3">
            <BaseCard variant="budget" title="Presupuesto Mensual">
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Entretenimiento</span>
                  <span class="badge bg-warning">75% usado</span>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-warning" style="width: 75%"></div>
                </div>
                <div class="d-flex justify-content-between small text-muted mt-1">
                  <span>$150 de $200</span>
                  <span class="money-display">$50 restante</span>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>

    <!-- Formularios Financieros -->
    <div class="row mb-5">
      <div class="col-12">
        <h2 class="h3 mb-4">
          <i class="bi bi-journal-text me-2"></i>
          Formularios Financieros
        </h2>

        <div class="row">
          <div class="col-md-6">
            <BaseCard title="Nueva Transacción" icon="plus-circle">
              <form>
                <MoneyInput v-model="formData.amount" label="Monto" placeholder="0.00" currency="USD"
                  :error="errors.amount" required />

                <div class="mb-3">
                  <label class="form-label">Categoría</label>
                  <select v-model="formData.category" class="form-select">
                    <option value="">Seleccionar categoría...</option>
                    <option value="alimentacion">🍽️ Alimentación</option>
                    <option value="transporte">🚗 Transporte</option>
                    <option value="entretenimiento">🎬 Entretenimiento</option>
                    <option value="salud">🏥 Salud</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">Tipo de Transacción</label>
                  <div class="btn-group w-100" role="group">
                    <input type="radio" class="btn-check" name="type" id="income" value="income"
                      v-model="formData.type">
                    <label class="btn btn-outline-success" for="income">
                      <i class="bi bi-arrow-up-circle me-1"></i>Ingreso
                    </label>
                    <input type="radio" class="btn-check" name="type" id="expense" value="expense"
                      v-model="formData.type">
                    <label class="btn btn-outline-danger" for="expense">
                      <i class="bi bi-arrow-down-circle me-1"></i>Gasto
                    </label>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea v-model="formData.description" class="form-control" rows="3"
                    placeholder="Agregar descripción opcional..."></textarea>
                </div>

                <div class="d-grid gap-2">
                  <BaseButton variant="financial" icon="check-circle" :loading="isSubmitting" @click="handleSubmit">
                    Guardar Transacción
                  </BaseButton>
                </div>
              </form>
            </BaseCard>
          </div>

          <div class="col-md-6">
            <BaseCard title="Resumen Financiero" icon="chart-pie">
              <!-- Estadísticas -->
              <div class="mb-4">
                <div class="row text-center">
                  <div class="col-4">
                    <div class="text-success">
                      <i class="bi bi-arrow-up-circle h3 mb-1"></i>
                      <div class="money-display fw-bold">$2,340</div>
                      <small class="text-muted">Ingresos</small>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="text-danger">
                      <i class="bi bi-arrow-down-circle h3 mb-1"></i>
                      <div class="money-display fw-bold">$1,840</div>
                      <small class="text-muted">Gastos</small>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="text-primary">
                      <i class="bi bi-piggy-bank h3 mb-1"></i>
                      <div class="money-display fw-bold">$500</div>
                      <small class="text-muted">Ahorro</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Progreso de Presupuesto -->
              <div class="mb-3">
                <h6 class="mb-2">Presupuesto Mensual</h6>
                <div class="progress mb-2" style="height: 8px;">
                  <div class="progress-bar bg-success" style="width: 60%" role="progressbar"></div>
                </div>
                <div class="d-flex justify-content-between small text-muted">
                  <span>$1,840 gastado</span>
                  <span>$3,000 presupuesto</span>
                </div>
              </div>

              <!-- Categorías Top -->
              <div>
                <h6 class="mb-2">Categorías Principales</h6>
                <div class="list-group list-group-flush">
                  <div class="list-group-item d-flex justify-content-between px-0">
                    <span><i class="bi bi-basket me-2 text-danger"></i>Alimentación</span>
                    <span class="money-display text-danger">-$680</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between px-0">
                    <span><i class="bi bi-car-front me-2 text-warning"></i>Transporte</span>
                    <span class="money-display text-warning">-$450</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between px-0">
                    <span><i class="bi bi-film me-2 text-info"></i>Entretenimiento</span>
                    <span class="money-display text-info">-$320</span>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas y Estados -->
    <div class="row mb-5">
      <div class="col-12">
        <h2 class="h3 mb-4">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Alertas y Estados
        </h2>

        <div class="row">
          <div class="col-md-6">
            <div class="alert alert-success" role="alert">
              <i class="bi bi-check-circle me-2"></i>
              <strong>¡Excelente!</strong> Estás por debajo de tu presupuesto mensual.
            </div>
            <div class="alert alert-warning" role="alert">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>Atención:</strong> Has gastado el 75% de tu presupuesto de entretenimiento.
            </div>
            <div class="alert alert-danger" role="alert">
              <i class="bi bi-x-circle me-2"></i>
              <strong>Límite excedido:</strong> Has superado tu presupuesto de transporte.
            </div>
          </div>

          <div class="col-md-6">
            <!-- Badges de Estado -->
            <div class="mb-3">
              <h6>Estados de Transacción</h6>
              <span class="badge bg-success me-2">
                <i class="bi bi-arrow-up-circle me-1"></i>Ingreso
              </span>
              <span class="badge bg-danger me-2">
                <i class="bi bi-arrow-down-circle me-1"></i>Gasto
              </span>
              <span class="badge bg-primary me-2">
                <i class="bi bi-clock me-1"></i>Pendiente
              </span>
              <span class="badge bg-secondary">
                <i class="bi bi-check-circle me-1"></i>Completado
              </span>
            </div>

            <!-- Badges de Presupuesto -->
            <div class="mb-3">
              <h6>Estados de Presupuesto</h6>
              <span class="badge bg-success me-2">Dentro del límite</span>
              <span class="badge bg-warning me-2">Cerca del límite</span>
              <span class="badge bg-danger">Límite excedido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from './base/BaseButton.vue'
import BaseCard from './base/BaseCard.vue'
import MoneyInput from './forms/MoneyInput.vue'

const formData = ref({
  amount: null as number | null,
  category: '',
  type: 'expense',
  description: ''
})

const errors = ref({
  amount: ''
})

const isSubmitting = ref(false)

const handleSubmit = async () => {
  errors.value.amount = ''

  if (!formData.value.amount) {
    errors.value.amount = 'El monto es requerido'
    return
  }

  if (formData.value.amount <= 0) {
    errors.value.amount = 'El monto debe ser mayor a 0'
    return
  }

  isSubmitting.value = true

  // Simular llamada a API
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Reset form
  formData.value = {
    amount: null,
    category: '',
    type: 'expense',
    description: ''
  }

  isSubmitting.value = false

  // Mostrar toast de éxito (implementar después)
  console.log('Transacción guardada exitosamente')
}
</script>

<style scoped>
.money-display {
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-variant-numeric: tabular-nums;
}

.list-group-item {
  border-left: 0;
  border-right: 0;
}

.list-group-item:first-child {
  border-top: 0;
}

.list-group-item:last-child {
  border-bottom: 0;
}
</style>