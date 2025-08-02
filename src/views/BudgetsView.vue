<template>
  <!-- Selector de organización cuando es requerido -->
  <OrganizationPicker v-if="authStore.requiresOrganizationSelection" />

  <AppLayout v-else>
    <!-- Header de la página -->
    <div class="page-header mb-4">
      <div class="row align-items-center">
        <div class="col-lg-8">
          <div class="header-actions">
            <div class="d-grid gap-2 d-md-flex">
              <div class="header-icon">
                <i class="bi bi-piggy-bank"></i>
              </div>
              <div class="ms-2 d-flex align-items-center">
                <div>
                  <h1 class="header-title mb-1">Presupuestos</h1>
                  <p v-if="authStore.selectedOrganization" class="mb-0 text-muted small">
                    <i class="bi bi-building me-1"></i>
                    {{ authStore.selectedOrganization.name }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="header-actions">
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
              <button v-if="canCreateBudgets" class="btn btn-primary" data-bs-toggle="modal"
                data-bs-target="#budgetModal" @click="openCreateModal">
                <i class="bi bi-plus-lg me-2"></i>
                Nuevo Presupuesto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen de presupuestos -->
    <div class="row g-3 mb-4" v-if="report">
      <!-- Tarjeta 1: Total Presupuestado -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100 budget-summary-card p-0">
          <div class="card-body text-center">
            <div class="d-flex justify-content-center align-items-center mb-3">
              <div class="summary-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-3">
                <i class="bi bi-wallet2 text-primary fs-2"></i>
              </div>
            </div>
            <h6 class="text-muted mb-2 text-uppercase fw-normal" style="font-size: 0.75rem; letter-spacing: 0.5px;">
              Total Presupuestado
            </h6>
            <h3 class="text-primary mb-0 fw-bold">
              {{ formatCurrency(parseFloat(report.totalBudgetedAmount)) }}
            </h3>
            <small class="text-muted">{{ report.totalBudgets }} presupuesto{{ report.totalBudgets !== 1 ? 's' : ''
              }}</small>
          </div>
        </div>
      </div>

      <!-- Tarjeta 2: Total Gastado -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100 budget-summary-card p-0">
          <div class="card-body text-center">
            <div class="d-flex justify-content-center align-items-center mb-3">
              <div class="summary-icon-wrapper bg-success bg-opacity-10 rounded-circle p-3">
                <i class="bi bi-cash-stack text-success fs-2"></i>
              </div>
            </div>
            <h6 class="text-muted mb-2 text-uppercase fw-normal" style="font-size: 0.75rem; letter-spacing: 0.5px;">
              Total Gastado
            </h6>
            <h3 class="text-success mb-0 fw-bold">
              {{ formatCurrency(parseFloat(report.totalSpentAmount)) }}
            </h3>
            <small class="text-muted">
              {{ formatPercentage(report.averageUsagePercentage) }} del presupuesto
            </small>
          </div>
        </div>
      </div>

      <!-- Tarjeta 3: Disponible -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100 budget-summary-card p-0">
          <div class="card-body text-center">
            <div class="d-flex justify-content-center align-items-center mb-3">
              <div class="summary-icon-wrapper bg-info bg-opacity-10 rounded-circle p-3">
                <i class="bi bi-piggy-bank text-info fs-2"></i>
              </div>
            </div>
            <h6 class="text-muted mb-2 text-uppercase fw-normal" style="font-size: 0.75rem; letter-spacing: 0.5px;">
              Disponible
            </h6>
            <h3 class="text-info mb-0 fw-bold">
              {{ formatCurrency(parseFloat(report.totalRemainingAmount)) }}
            </h3>
            <small class="text-muted">
              {{ formatPercentage(100 - report.averageUsagePercentage) }} restante
            </small>
          </div>
        </div>
      </div>

      <!-- Tarjeta 4: Estado General -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100 budget-summary-card p-0">
          <div class="card-body text-center">
            <div class="d-flex justify-content-center align-items-center mb-3">
              <div class="summary-icon-wrapper bg-warning bg-opacity-10 rounded-circle p-3">
                <i class="bi bi-speedometer2 text-warning fs-2"></i>
              </div>
            </div>
            <h6 class="text-muted mb-2 text-uppercase fw-normal" style="font-size: 0.75rem; letter-spacing: 0.5px;">
              Estado General
            </h6>
            <h3 class="text-warning mb-0 fw-bold">
              {{ formatPercentage(report.averageUsagePercentage) }}
            </h3>
            <small class="text-muted">promedio de uso</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen de ingresos y gastos del mes -->
    <div class="row g-3 mb-4" v-if="financialSummary">
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <h6 class="text-muted mb-2 text-uppercase fw-normal" style="font-size: 0.75rem;">Ingresos del mes</h6>
            <h3 class="text-success mb-0 fw-bold">
              {{ formatCurrency(financialSummary.totalIncome) }}
            </h3>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <h6 class="text-muted mb-2 text-uppercase fw-normal" style="font-size: 0.75rem;">Gastos del mes</h6>
            <h3 class="text-danger mb-0 fw-bold">
              {{ formatCurrency(financialSummary.totalExpenses) }}
            </h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección de análisis detallado -->
    <div class="row g-3 mb-4" v-if="report && report.budgetsByStatus">
      <!-- Distribución por estado -->
      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pb-0">
            <h6 class="card-title mb-0">
              <i class="bi bi-pie-chart me-2"></i>
              Distribución por Estado
            </h6>
          </div>
          <div class="card-body">
            <div class="row g-2">
              <div class="col-6">
                <div class="d-flex align-items-center p-2 rounded bg-success bg-opacity-10">
                  <div class="me-2">
                    <i class="bi bi-check-circle-fill text-success"></i>
                  </div>
                  <div class="flex-grow-1">
                    <small class="text-muted d-block">Bajo presupuesto</small>
                    <span class="fw-bold text-success">{{ report.budgetsByStatus.UNDER_BUDGET }}</span>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="d-flex align-items-center p-2 rounded bg-info bg-opacity-10">
                  <div class="me-2">
                    <i class="bi bi-dash-circle-fill text-info"></i>
                  </div>
                  <div class="flex-grow-1">
                    <small class="text-muted d-block">En línea</small>
                    <span class="fw-bold text-info">{{ report.budgetsByStatus.ON_TRACK }}</span>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="d-flex align-items-center p-2 rounded bg-warning bg-opacity-10">
                  <div class="me-2">
                    <i class="bi bi-exclamation-triangle-fill text-warning"></i>
                  </div>
                  <div class="flex-grow-1">
                    <small class="text-muted d-block">Advertencia</small>
                    <span class="fw-bold text-warning">{{ report.budgetsByStatus.WARNING }}</span>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="d-flex align-items-center p-2 rounded bg-danger bg-opacity-10">
                  <div class="me-2">
                    <i class="bi bi-x-circle-fill text-danger"></i>
                  </div>
                  <div class="flex-grow-1">
                    <small class="text-muted d-block">Excedido</small>
                    <span class="fw-bold text-danger">{{ report.budgetsByStatus.EXCEEDED }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top categorías -->
      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pb-0">
            <h6 class="card-title mb-0">
              <i class="bi bi-bar-chart me-2"></i>
              Top Categorías
            </h6>
          </div>
          <div class="card-body">
            <div v-if="report.topCategoriesByBudget && report.topCategoriesByBudget.length > 0" class="space-y-3">
              <div v-for="(category, index) in report.topCategoriesByBudget.slice(0, 4)" :key="category.categoryId"
                class="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                <div class="d-flex align-items-center">
                  <div class="me-2">
                    <span class="badge bg-primary rounded-pill">{{ index + 1 }}</span>
                  </div>
                  <div>
                    <div class="fw-medium">{{ category.categoryName }}</div>
                    <small class="text-muted">
                      {{ formatCurrency(parseFloat(category.totalSpent)) }} / {{
                        formatCurrency(parseFloat(category.totalBudgeted)) }}
                    </small>
                  </div>
                </div>
                <div class="text-end">
                  <div class="fw-bold" :class="category.percentage > 100 ? 'text-danger' : 'text-success'">
                    {{ formatPercentage(category.percentage) }}
                  </div>
                  <div class="progress" style="width: 60px; height: 4px;">
                    <div class="progress-bar" :class="category.percentage > 100 ? 'bg-danger' : 'bg-success'"
                      :style="{ width: Math.min(category.percentage, 100) + '%' }">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted py-3">
              <i class="bi bi-bar-chart fs-3 mb-2 d-block"></i>
              <small>No hay datos de categorías disponibles</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de presupuestos -->
    <div class="row">
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-0">
            <div
              class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
              <h5 class="card-title mb-0">
                <i class="bi bi-list-ul me-2"></i>
                <span class="d-none d-sm-inline">Presupuestos ({{ budgets.length }})</span>
                <span class="d-sm-none">Presupuestos</span>
              </h5>

              <!-- Filtros -->
              <div class="d-flex gap-2 flex-wrap">
                <!-- Filtro por año -->
                <select v-model="filters.year" @change="updateFilters({ year: filters.year })"
                  class="form-select form-select-sm" style="width: auto;">
                  <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                </select>

                <!-- Filtro por mes -->
                <select v-model="filters.month" @change="updateFilters({ month: filters.month })"
                  class="form-select form-select-sm" style="width: auto;">
                  <option v-for="(monthName, monthIndex) in monthNames" :key="monthIndex + 1" :value="monthIndex + 1">
                    {{ monthName }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <!-- Loading state -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mt-3 text-muted">Cargando presupuestos...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="alert alert-danger m-3" role="alert">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ error }}
            </div>

            <!-- Empty state -->
            <div v-else-if="budgets.length === 0" class="text-center py-5">
              <i class="bi bi-piggy-bank text-muted" style="font-size: 4rem;"></i>
              <h5 class="text-muted mt-3">No hay presupuestos</h5>
              <p class="text-muted">Comienza creando tu primer presupuesto</p>
              <button v-if="canCreateBudgets" class="btn btn-primary" data-bs-toggle="modal"
                data-bs-target="#budgetModal" @click="openCreateModal">
                <i class="bi bi-plus-lg me-2"></i>
                Crear Presupuesto
              </button>
            </div>

            <!-- Budgets list -->
            <div v-else>
              <!-- Desktop table -->
              <div class="d-none d-md-block">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th class="text-end">Presupuesto</th>
                        <th class="text-end">Gastado</th>
                        <th class="text-center">Estado</th>
                        <th class="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="budget in budgets" :key="budget.id">
                        <td>
                          <div class="fw-medium">{{ budget.name }}</div>
                        </td>
                        <td>
                          <span class="badge" :style="{
                            backgroundColor: budget.category?.colorHex + '20',
                            color: budget.category?.colorHex,
                            border: `1px solid ${budget.category?.colorHex}40`
                          }">
                            {{ budget.category?.icon }}
                            {{ budget.category?.name }}
                          </span>
                        </td>
                        <!-- <td>
                          <small class="text-muted">
                            {{ formatDate(budget.startDate) }} - {{ formatDate(budget.endDate) }}
                          </small>
                        </td> -->
                        <td class="text-end">
                          <span class="fw-medium">{{ formatCurrency(parseFloat(budget.monthlyAmount)) }}</span>
                        </td>
                        <td class="text-end">
                          <span class="fw-medium">{{ formatCurrency(budget.currentMonthStatus?.spentAmount ?
                            parseFloat(budget.currentMonthStatus.spentAmount) : 0) }}</span>
                        </td>
                        <td class="text-center">
                          <span class="badge" :class="getStatusColor(budget.currentMonthStatus?.status as string)">
                            {{ getStatusLabel(budget.currentMonthStatus?.status as string) }}
                          </span>
                        </td>
                        <td class="text-center">
                          <div class="btn-group btn-group-sm">
                            <button v-if="canEditBudgets" class="btn btn-outline-primary" @click="openEditModal(budget)"
                              data-bs-toggle="modal" data-bs-target="#budgetModal">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button v-if="canDeleteBudgets" class="btn btn-outline-danger"
                              @click="confirmDelete(budget)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Mobile cards -->
              <div class="d-md-none">
                <div class="row g-3">
                  <div v-for="budget in budgets" :key="`mobile-${budget.id}`" class="col-12">
                    <div class="card border-0 shadow-sm budget-card">
                      <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <div class="flex-grow-1">
                            <h6 class="mb-1 fw-bold">{{ budget.name }}</h6>
                            <small class="text-muted">
                              <i class="bi bi-calendar3 me-1"></i>
                              {{ formatDate(budget.startDate) }} - {{ formatDate(budget.endDate) }}
                            </small>
                          </div>
                          <span class="badge" :class="getStatusColor(budget.currentMonthStatus?.status as string)">
                            {{ getStatusLabel(budget.currentMonthStatus?.status as string) }}
                          </span>
                        </div>
                        <div class="row g-2 mb-3">
                          <div class="col-6">
                            <small class="text-muted d-block">Presupuestado</small>
                            <span class="fw-medium">{{ formatCurrency(parseFloat(budget.monthlyAmount)) }}</span>
                          </div>
                          <div class="col-6">
                            <small class="text-muted d-block">Gastado</small>
                            <span class="fw-medium">{{ formatCurrency(budget.currentMonthStatus?.spentAmount ?
                              parseFloat(budget.currentMonthStatus.spentAmount) : 0) }}</span>
                          </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                          <span class="badge" :style="{
                            backgroundColor: budget.category?.colorHex + '20',
                            color: budget.category?.colorHex,
                            border: `1px solid ${budget.category?.colorHex}40`
                          }">
                            {{ budget.category?.icon }}
                            {{ budget.category?.name }}
                          </span>
                          <div class="btn-group btn-group-sm">
                            <button v-if="canEditBudgets" class="btn btn-outline-primary btn-sm"
                              @click="openEditModal(budget)" data-bs-toggle="modal" data-bs-target="#budgetModal">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button v-if="canDeleteBudgets" class="btn btn-outline-danger btn-sm"
                              @click="confirmDelete(budget)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de presupuesto -->
    <div class="modal fade" id="budgetModal" ref="budgetModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-piggy-bank me-2"></i>
              {{ isEditing ? 'Editar' : 'Nuevo' }} Presupuesto
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Nombre *</label>
                  <input v-model="form.name" type="text" class="form-control" :class="{ 'is-invalid': formErrors.name }"
                    placeholder="Ej: Presupuesto de Alimentación" maxlength="100" required>
                  <div v-if="formErrors.name" class="invalid-feedback">{{ formErrors.name }}</div>
                  <div class="form-text">
                    <i class="bi bi-info-circle me-1"></i>
                    El nombre se completará automáticamente con el mes seleccionado
                  </div>
                </div>

                <!-- Selector de período mensual -->
                <div class="col-12">
                  <div class="card bg-light border-0 mb-3 p-1">
                    <div class="card-body">
                      <h6 class="card-title mb-3">
                        <i class="bi bi-calendar-month me-2"></i>
                        Período del Presupuesto
                      </h6>
                      <div class="row g-3">
                        <div class="col-md-6">
                          <label class="form-label">Mes *</label>
                          <select v-model="form.selectedMonth" class="form-select" @change="updateDatesFromMonth"
                            required>
                            <option value="">Seleccionar mes</option>
                            <option v-for="(month, index) in monthOptions" :key="index" :value="index + 1">
                              {{ month }}
                            </option>
                          </select>
                        </div>
                        <div class="col-md-6">
                          <label class="form-label">Año *</label>
                          <select v-model="form.selectedYear" class="form-select" @change="updateDatesFromMonth"
                            required>
                            <option v-for="year in yearOptions" :key="year" :value="year">
                              {{ year }}
                            </option>
                          </select>
                        </div>
                      </div>
                      <div class="mt-3 p-2 bg-white rounded border">
                        <small class="text-muted">
                          <i class="bi bi-calendar-range me-1"></i>
                          Período: {{ formatSelectedPeriod() }}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Opciones de recurrencia -->
                <div class="col-12">
                  <div class="card bg-primary bg-opacity-10 border-primary border-opacity-25 p-1">
                    <div class="card-body">
                      <h6 class="card-title text-primary mb-3">
                        <i class="bi bi-arrow-repeat me-2"></i>
                        Presupuesto Recurrente
                      </h6>
                      <div class="form-check form-switch">
                        <input v-model="form.isRecurring" class="form-check-input" type="checkbox" id="isRecurring">
                        <label class="form-check-label" for="isRecurring">
                          <strong>Crear automáticamente cada mes</strong>
                        </label>
                      </div>
                      <div v-if="form.isRecurring" class="mt-3">
                        <div class="row g-3">
                          <div class="col-md-6">
                            <label class="form-label">Duración</label>
                            <select v-model="form.recurringMonths" class="form-select">
                              <option value="3">3 meses</option>
                              <option value="6">6 meses</option>
                              <option value="12">12 meses (1 año)</option>
                              <option value="24">24 meses (2 años)</option>
                              <option value="-1">Indefinido</option>
                            </select>
                          </div>
                          <div class="col-md-6">
                            <label class="form-label">Ajuste automático</label>
                            <select v-model="form.autoAdjust" class="form-select">
                              <option value="none">Monto fijo</option>
                              <option value="inflation">Ajustar por inflación (+3%)</option>
                              <option value="previous">Basado en gasto anterior</option>
                            </select>
                          </div>
                        </div>
                        <div class="mt-2 p-2 bg-white rounded border">
                          <small class="text-muted">
                            <i class="bi bi-info-circle me-1"></i>
                            {{ getRecurringDescription() }}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Categoría *</label>
                  <select v-model="form.categoryId" class="form-select" :class="{ 'is-invalid': formErrors.categoryId }"
                    required>
                    <option value="">Seleccionar categoría</option>
                    <option v-for="category in categoriesList" :key="category.id" :value="category.id">
                      {{ category.icon }} {{ category.name }}
                    </option>
                  </select>
                  <div v-if="formErrors.categoryId" class="invalid-feedback">{{ formErrors.categoryId }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Monto Presupuestado *</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input v-model="form.budgetAmount" type="number" step="1" min="1" class="form-control"
                      :class="{ 'is-invalid': formErrors.budgetAmount }" placeholder="0" required>
                  </div>
                  <div v-if="formErrors.budgetAmount" class="invalid-feedback">{{ formErrors.budgetAmount }}</div>
                  <div class="form-text">
                    <i class="bi bi-calculator me-1"></i>
                    Monto mensual para esta categoría
                  </div>
                </div>

                <!-- Fechas ocultas (calculadas automáticamente) -->
                <input v-model="form.startDate" type="hidden">
                <input v-model="form.endDate" type="hidden">

                <div class="col-12">
                  <label class="form-label">Descripción</label>
                  <textarea v-model="form.description" class="form-control"
                    :class="{ 'is-invalid': formErrors.description }" rows="3"
                    placeholder="Descripción opcional del presupuesto" maxlength="500"></textarea>
                  <div v-if="formErrors.description" class="invalid-feedback">{{ formErrors.description }}</div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditing ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <div class="modal fade" id="deleteConfirmModal" ref="deleteConfirmModal" tabindex="-1">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title text-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Confirmar eliminación
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <p class="mb-1">¿Estás seguro de eliminar este presupuesto?</p>
            <p class="text-muted small mb-0">Esta acción no se puede deshacer</p>
            <div v-if="budgetToDelete" class="mt-3 p-3 bg-light rounded">
              <div class="fw-medium">{{ budgetToDelete.name }}</div>
              <div class="text-muted">{{ formatCurrency(parseFloat(budgetToDelete.monthlyAmount)) }}</div>
            </div>
          </div>
          <div class="modal-footer border-0 justify-content-center">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" @click="handleDelete" :disabled="deleting">
              <span v-if="deleting" class="spinner-border spinner-border-sm me-2"></span>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue'
import { useCategories } from '../composables/useCategories'
import { useBudgets } from '../composables/useBudgets'
import { useAuthStore } from '../stores/auth'
import type { BudgetWithRelations, CreateBudgetData, UpdateBudgetData } from '../types/budget'
import AppLayout from '../components/layout/AppLayout.vue'
import OrganizationPicker from '../components/forms/OrganizationPicker.vue'
import { getFinancialSummary, formatCurrency } from '../services/financialService'
import type { FinancialSummary } from '../types/financial'

// Composables
const authStore = useAuthStore()
const { categories: categoriesList, fetchCategories } = useCategories()
const {
  budgets,
  report,
  loading,
  error,
  filters,
  fetchBudgets,
  fetchBudgetReport,
  createBudget,
  updateBudget,
  deleteBudget,
  updateFilters,
  getStatusColor,
  getStatusLabel,
  formatPercentage,
  canCreateBudgets,
  canEditBudgets,
  canDeleteBudgets
} = useBudgets()

// Refs para modales
const budgetModal = ref(null)
const deleteConfirmModal = ref(null)

// Estado local
const isEditing = ref(false)
const editingBudget = ref<BudgetWithRelations | null>(null)
const submitting = ref(false)
const deleting = ref(false)
const budgetToDelete = ref<BudgetWithRelations | null>(null)
const isInitialized = ref(false)
const financialSummary = ref<FinancialSummary | null>(null)

// Formulario
const form = reactive({
  name: '',
  categoryId: '',
  budgetAmount: '',
  startDate: '',
  endDate: '',
  description: '',
  selectedMonth: '',
  selectedYear: '',
  isRecurring: false,
  recurringMonths: '12',
  autoAdjust: 'none'
})

// Opciones para los selectores
const monthOptions = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const yearOptions = ref<number[]>([])

// Variables para filtros de fecha
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const availableYears = ref<number[]>([])

// Inicializar años (año actual - 2 hasta año actual + 2)
function initializeYearOptions() {
  const currentYear = new Date().getFullYear()
  yearOptions.value = []
  for (let year = currentYear - 1; year <= currentYear + 2; year++) {
    yearOptions.value.push(year)
  }

  // Para los filtros, incluir más años
  availableYears.value = []
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    availableYears.value.push(year)
  }
}

// Funciones para el manejo de fechas mensuales
function updateDatesFromMonth() {
  if (!form.selectedMonth || !form.selectedYear) return

  const year = parseInt(form.selectedYear)
  const month = parseInt(form.selectedMonth)

  // Primer día del mes
  const startDate = new Date(year, month - 1, 1)
  // Último día del mes
  const endDate = new Date(year, month, 0)

  form.startDate = startDate.toISOString().split('T')[0]
  form.endDate = endDate.toISOString().split('T')[0]

  // Actualizar nombre automáticamente si está vacío o es un nombre auto-generado
  if (!form.name || form.name.includes(' - ')) {
    const categoryName = categoriesList.value.find(c => c.id === form.categoryId)?.name || 'Presupuesto'
    form.name = `${categoryName} - ${monthNames[month - 1]} ${year}`
  }
}

function formatSelectedPeriod(): string {
  if (!form.selectedMonth || !form.selectedYear) {
    return 'Selecciona mes y año'
  }

  const monthName = monthOptions[parseInt(form.selectedMonth) - 1]
  return `${monthName} ${form.selectedYear}`
}

function getRecurringDescription(): string {
  if (!form.isRecurring) return ''

  const duration = form.recurringMonths === '-1' ? 'indefinidamente' : `por ${form.recurringMonths} meses`
  const adjustment = form.autoAdjust === 'none' ? 'con el mismo monto' :
    form.autoAdjust === 'inflation' ? 'con ajuste por inflación (+3%)' :
      'ajustando según el gasto del mes anterior'

  return `Se creará automáticamente cada mes ${duration}, ${adjustment}.`
}

// Inicializar mes y año actuales
function setCurrentMonthYear() {
  const now = new Date()
  form.selectedMonth = (now.getMonth() + 1).toString()
  form.selectedYear = now.getFullYear().toString()
  updateDatesFromMonth()
}

const formErrors = reactive({
  name: '',
  categoryId: '',
  budgetAmount: '',
  startDate: '',
  endDate: '',
  description: ''
})

// Funciones de utilidad
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CL')
}

function getCurrentDateForInput(): string {
  return new Date().toISOString().split('T')[0]
}

// Funciones del formulario
function resetForm() {
  form.name = ''
  form.categoryId = ''
  form.budgetAmount = ''
  form.startDate = getCurrentDateForInput()
  form.endDate = getCurrentDateForInput()
  form.description = ''
  form.selectedMonth = ''
  form.selectedYear = ''
  form.isRecurring = false
  form.recurringMonths = '12'
  form.autoAdjust = 'none'
  setCurrentMonthYear()
  clearFormErrors()
}

function clearFormErrors() {
  Object.keys(formErrors).forEach(key => {
    formErrors[key as keyof typeof formErrors] = ''
  })
}

function validateForm(): boolean {
  clearFormErrors()
  let isValid = true

  if (!form.name.trim()) {
    formErrors.name = 'El nombre es requerido'
    isValid = false
  }

  if (!form.categoryId) {
    formErrors.categoryId = 'La categoría es requerida'
    isValid = false
  }

  if (!form.budgetAmount || parseFloat(form.budgetAmount) <= 0) {
    formErrors.budgetAmount = 'El monto debe ser mayor a 0'
    isValid = false
  }

  if (!form.startDate) {
    formErrors.startDate = 'La fecha de inicio es requerida'
    isValid = false
  }

  if (!form.endDate) {
    formErrors.endDate = 'La fecha de fin es requerida'
    isValid = false
  }

  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    formErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio'
    isValid = false
  }

  return isValid
}

// Funciones del modal
function openCreateModal() {
  isEditing.value = false
  editingBudget.value = null
  resetForm()
}

function openEditModal(budget: BudgetWithRelations) {
  isEditing.value = true
  editingBudget.value = budget

  form.name = budget.name
  form.categoryId = budget.categoryId
  form.budgetAmount = budget.monthlyAmount.toString()
  form.startDate = budget.startDate.split('T')[0]
  form.endDate = budget.endDate ? budget.endDate.split('T')[0] : ''
  form.description = budget.description || ''

  // Calcular mes y año desde la fecha de inicio
  const startDate = new Date(budget.startDate)
  form.selectedMonth = (startDate.getMonth() + 1).toString()
  form.selectedYear = startDate.getFullYear().toString()

  form.isRecurring = budget.isRecurring || false
  form.recurringMonths = (budget.recurringMonths || 12).toString()
  form.autoAdjust = budget.autoAdjust || 'none'

  // NO llamar updateDatesFromMonth() en edición para preservar las fechas originales
  // updateDatesFromMonth()

  clearFormErrors()
}

async function handleSubmit() {
  if (!validateForm()) return

  try {
    submitting.value = true

    const budgetData: CreateBudgetData | UpdateBudgetData = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      monthlyAmount: parseFloat(form.budgetAmount),
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description.trim() || undefined,
      isRecurring: form.isRecurring,
      recurringMonths: parseInt(form.recurringMonths),
      autoAdjust: form.autoAdjust as 'none' | 'inflation' | 'previous'
    }

    if (isEditing.value && editingBudget.value) {
      await updateBudget(editingBudget.value.id, budgetData as UpdateBudgetData)
    } else {
      await createBudget(budgetData as CreateBudgetData)
    }

    // Cerrar modal usando ref
    if (budgetModal.value) {
      const modal = budgetModal.value as HTMLElement
      const bootstrapModal = (window as any).bootstrap?.Modal?.getInstance(modal)
      if (bootstrapModal) {
        bootstrapModal.hide()
      } else {
        // Fallback: intentar crear nueva instancia y cerrar
        try {
          const newBootstrapModal = new (window as any).bootstrap.Modal(modal)
          newBootstrapModal.hide()
        } catch (error) {
          console.error('No se pudo cerrar el modal automáticamente:', error)
          // Fallback manual usando el ref
          const closeButton = modal.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement
          if (closeButton) {
            closeButton.click()
          }
        }
      }
    }

    resetForm()
  } catch (error) {
    console.error('Error al guardar presupuesto:', error)
  } finally {
    submitting.value = false
  }
}

function confirmDelete(budget: BudgetWithRelations) {
  budgetToDelete.value = budget
  if (deleteConfirmModal.value) {
    const modal = deleteConfirmModal.value as HTMLElement
    try {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal)
      bootstrapModal.show()
    } catch (error) {
      console.error('Error al mostrar modal de confirmación:', error)
      // Fallback: usar confirm nativo
      if (confirm(`¿Estás seguro de eliminar el presupuesto "${budget.name}"?\nEsta acción no se puede deshacer.`)) {
        deleteBudget(budget.id)
      }
    }
  }
}

async function handleDelete() {
  if (!budgetToDelete.value) return

  try {
    deleting.value = true
    await deleteBudget(budgetToDelete.value.id)

    // Cerrar modal usando ref
    if (deleteConfirmModal.value) {
      const modal = deleteConfirmModal.value as HTMLElement
      const bootstrapModal = (window as any).bootstrap?.Modal?.getInstance(modal)
      if (bootstrapModal) {
        bootstrapModal.hide()
      } else {
        // Fallback manual usando el ref
        const closeButton = modal.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement
        if (closeButton) {
          closeButton.click()
        }
      }
    }

    budgetToDelete.value = null
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error)
  } finally {
    deleting.value = false
  }
}

// Inicialización
async function initializeData() {
  // Cargar organizaciones disponibles si es necesario
  if (authStore.userRole === 'ADMIN' || authStore.userRole === 'COLABORADOR') {
    await authStore.fetchAvailableOrganizations()
  }

  // Cargar categorías
  await fetchCategories()

  // Después de cargar organizaciones, verificar si cargar presupuestos
  if (!authStore.requiresOrganizationSelection) {
    await fetchBudgets()
    await fetchBudgetReport()
  }

  isInitialized.value = true
}

// Watcher para recargar cuando se seleccione organización
watch(() => authStore.selectedOrganizationId, async (newOrgId) => {
  if (newOrgId && isInitialized.value) {
    await fetchBudgets()
    await fetchBudgetReport()
  }
})

// Lifecycle
onMounted(async () => {
  initializeYearOptions()
  await initializeData()
  await fetchFinancialSummary()
})

// Función para mostrar información detallada de presupuestos
function showBudgetInfo(budget: BudgetWithRelations) {
  const parentInfo = budget.parentBudgetId ? '(Hijo)' : budget.isRecurring ? '(Padre)' : ''
  const dateInfo = `${formatDate(budget.startDate)} - ${budget.endDate ? formatDate(budget.endDate) : 'Sin fin'}`

  console.log(`📊 Presupuesto: ${budget.name} ${parentInfo}`)
  console.log(`📅 Período: ${dateInfo}`)
  console.log(`💰 Monto: $${formatCurrency(budget.monthlyAmount)}`)
  console.log(`🏷️  Categoría: ${budget.category.name}`)

  if (budget.isRecurring) {
    console.log(`🔄 Recurrente: ${budget.recurringMonths || 12} meses`)
    console.log(`⚙️ Ajuste: ${budget.autoAdjust}`)
  }

  if (budget.parentBudgetId) {
    console.log(`👨‍👩‍👧‍👦 Padre: ${budget.parentBudgetId}`)
  }
}

// Función para detectar y mostrar duplicados
function detectDuplicates() {
  const duplicates = new Map<string, BudgetWithRelations[]>()
  budgets.value.forEach(budget => {
    const key = `${budget.categoryId}-${budget.startDate.split('T')[0]}`
    if (!duplicates.has(key)) {
      duplicates.set(key, [])
    }
    duplicates.get(key)!.push(budget)
  })
  console.log('🔍 Análisis de duplicados:')
  duplicates.forEach((budgets, key) => {
    if (budgets.length > 1) {
      console.log(`⚠️  DUPLICADO encontrado para ${key}:`)
      budgets.forEach(budget => {
        console.log(`  - ${budget.name} (ID: ${budget.id.substring(0, 8)}...)`)
      })
    }
  })
}

async function fetchFinancialSummary() {
  financialSummary.value = await getFinancialSummary()
}

// Si quieres que el resumen se actualice al cambiar mes/año:
watch(() => [filters.value.year, filters.value.month], () => {
  fetchFinancialSummary()
})
</script>

<style scoped>
/* Header Section Moderno */
.page-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(229, 231, 235, 0.5);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.header-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.75rem;
  box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.4);
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.budget-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0.75rem;
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.budget-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: rgba(34, 197, 94, 0.3);
}

.btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.4);
}

.table th {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: none;
  color: #374151;
  padding: 1rem;
}

.badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
}

.form-control,
.form-select {
  transition: all 0.2s ease;
  border-radius: 0.5rem;
}

.form-control:focus,
.form-select:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

/* Responsive */
@media (max-width: 991.98px) {
  .page-header {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .header-title {
    font-size: 1.75rem;
  }

  .header-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
}

@media (max-width: 767.98px) {
  .page-header {
    padding: 1rem;
  }

  .header-title {
    font-size: 1.5rem;
  }
}

/* Estilos para las tarjetas de resumen mejoradas */
.budget-summary-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 1rem;
  border: 1px solid rgba(229, 231, 235, 0.5);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
  backdrop-filter: blur(10px);
}

.budget-summary-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.summary-icon-wrapper {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.budget-summary-card:hover .summary-icon-wrapper {
  transform: scale(1.1);
}

.budget-summary-card .card-body {
  padding: 1.75rem 1.5rem;
}

.budget-summary-card h3 {
  font-size: 1.75rem;
  line-height: 1.2;
  font-weight: 700;
}

.budget-summary-card h6 {
  font-weight: 500;
  color: #6b7280;
}

/* Estilos para la sección de análisis */
.card-header h6 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.space-y-3>*+* {
  margin-top: 0.75rem;
}

.progress {
  border-radius: 2px;
  height: 4px;
  background-color: rgba(229, 231, 235, 0.5);
}

.progress-bar {
  border-radius: 2px;
  transition: width 0.6s ease;
}

/* Animaciones para los elementos de análisis */
.bg-success.bg-opacity-10,
.bg-info.bg-opacity-10,
.bg-warning.bg-opacity-10,
.bg-danger.bg-opacity-10 {
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.bg-success.bg-opacity-10:hover {
  border-color: rgba(34, 197, 94, 0.3);
  transform: translateY(-1px);
}

.bg-info.bg-opacity-10:hover {
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.bg-warning.bg-opacity-10:hover {
  border-color: rgba(245, 158, 11, 0.3);
  transform: translateY(-1px);
}

.bg-danger.bg-opacity-10:hover {
  border-color: rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

/* Responsive adjustments para resumen */
@media (max-width: 576px) {
  .budget-summary-card h3 {
    font-size: 1.5rem;
  }

  .summary-icon-wrapper {
    width: 50px;
    height: 50px;
  }

  .summary-icon-wrapper i {
    font-size: 1.5rem !important;
  }

  .budget-summary-card .card-body {
    padding: 1.25rem 1rem;
  }
}

@media (max-width: 991.98px) {
  .space-y-3>*+* {
    margin-top: 0.5rem;
  }
}
</style>