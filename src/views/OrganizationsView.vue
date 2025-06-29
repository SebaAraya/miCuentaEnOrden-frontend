<template>
    <div class="organizations-view">
        <div class="container-fluid">
            <!-- Header -->
            <div class="row mb-4">
                <div class="col-md-8">
                    <h1 class="display-6">Gestión de Organizaciones</h1>
                    <p class="text-muted">Administra las organizaciones del sistema</p>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-primary" @click="openCreateModal">
                        <i class="bi bi-building-plus me-2"></i>
                        Nueva Organización
                    </button>
                </div>
            </div>

            <!-- Stats -->
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi bi-building display-4 text-primary"></i>
                            <h3>{{ organizationStats.total }}</h3>
                            <p class="text-muted">Total Organizaciones</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi bi-people display-4 text-success"></i>
                            <h3>{{ organizationStats.totalUsers }}</h3>
                            <p class="text-muted">Total Usuarios</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi bi-check-circle display-4 text-info"></i>
                            <h3>{{ organizationStats.active }}</h3>
                            <p class="text-muted">Organizaciones Activas</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi bi-tags display-4 text-warning"></i>
                            <h3>{{ organizationStats.totalCategories }}</h3>
                            <p class="text-muted">Categorías Totales</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Organizations List -->
            <div class="card">
                <div class="card-header">
                    <h5>Lista de Organizaciones</h5>
                </div>
                <div class="card-body">
                    <div v-if="loading" class="text-center p-4">
                        <div class="spinner-border"></div>
                        <p class="mt-2">Cargando organizaciones...</p>
                    </div>

                    <div v-else-if="organizations.length === 0" class="text-center p-4">
                        <i class="bi bi-building display-4 text-muted"></i>
                        <h4 class="mt-3">No hay organizaciones</h4>
                        <p class="text-muted">Crea la primera organización</p>
                        <button class="btn btn-primary" @click="openCreateModal">
                            <i class="bi bi-building-plus me-2"></i>
                            Crear Organización
                        </button>
                    </div>

                    <div v-else>
                        <div class="row g-4">
                            <div v-for="org in organizations" :key="org.id" class="col-lg-4 col-md-6">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-3">
                                            <h6 class="card-title">{{ org.name }}</h6>
                                            <span class="badge" :class="org.isActive ? 'bg-success' : 'bg-secondary'">
                                                {{ org.isActive ? 'Activa' : 'Inactiva' }}
                                            </span>
                                        </div>

                                        <p class="card-text text-muted">{{ org.description || 'Sin descripción' }}</p>

                                        <div class="row text-center">
                                            <div class="col-6">
                                                <small class="text-muted">Usuarios</small>
                                                <div class="fw-bold">{{ org._count?.users || 0 }}</div>
                                            </div>
                                            <div class="col-6">
                                                <small class="text-muted">Categorías</small>
                                                <div class="fw-bold">{{ org._count?.categories || 0 }}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="card-footer bg-transparent">
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm"
                                                @click="viewOrganization(org)">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                            <button class="btn btn-outline-warning btn-sm"
                                                @click="editOrganization(org)">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-outline-info btn-sm" @click="manageUsers(org)">
                                                <i class="bi bi-people"></i>
                                            </button>
                                            <button v-if="org._count?.users === 0" class="btn btn-outline-danger btn-sm"
                                                @click="confirmDeleteOrganization(org)">
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

            <!-- Filters Section -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label">Buscar Organización</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-search"></i>
                                </span>
                                <input v-model="filters.search" type="text" class="form-control"
                                    placeholder="Buscar por nombre o descripción...">
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Estado</label>
                            <select v-model="filters.isActive" class="form-select">
                                <option :value="undefined">Todas</option>
                                <option :value="true">Activas</option>
                                <option :value="false">Inactivas</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button @click="applyFilters" class="btn btn-primary me-2">
                                <i class="bi bi-funnel"></i>
                                Filtrar
                            </button>
                            <button @click="clearFilters" class="btn btn-outline-secondary">
                                <i class="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="alert alert-danger alert-dismissible" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                {{ error }}
                <button type="button" class="btn-close" @click="clearError"></button>
            </div>

            <!-- Pagination -->
            <div v-if="pagination.pages > 1" class="d-flex justify-content-center mt-4">
                <nav>
                    <ul class="pagination">
                        <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
                            <button class="page-link" @click="changePage(pagination.page - 1)"
                                :disabled="pagination.page <= 1">
                                <i class="bi bi-chevron-left"></i>
                            </button>
                        </li>
                        <li v-for="page in getPageNumbers()" :key="page" class="page-item"
                            :class="{ active: page === pagination.page }">
                            <button class="page-link" @click="changePage(page)">{{ page }}</button>
                        </li>
                        <li class="page-item" :class="{ disabled: pagination.page >= pagination.pages }">
                            <button class="page-link" @click="changePage(pagination.page + 1)"
                                :disabled="pagination.page >= pagination.pages">
                                <i class="bi bi-chevron-right"></i>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>

        <!-- Create/Edit Modal -->
        <div class="modal fade" id="orgModal" tabindex="-1" ref="orgModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-building me-2"></i>
                            {{ isEditing ? 'Editar' : 'Nueva' }} Organización
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Modal Error -->
                        <div v-if="modalError" class="alert alert-danger" role="alert">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            {{ modalError }}
                        </div>

                        <form @submit.prevent="submitForm">
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label">Nombre de la Organización <span
                                            class="text-danger">*</span></label>
                                    <input v-model="form.name" type="text" class="form-control"
                                        :class="{ 'is-invalid': errors.name }" placeholder="Nombre de la organización"
                                        maxlength="100" required>
                                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                                </div>

                                <div class="col-12">
                                    <label class="form-label">Descripción</label>
                                    <textarea v-model="form.description" class="form-control"
                                        :class="{ 'is-invalid': errors.description }" rows="3"
                                        placeholder="Descripción opcional de la organización"
                                        maxlength="500"></textarea>
                                    <div v-if="errors.description" class="invalid-feedback">{{ errors.description }}
                                    </div>
                                </div>

                                <div class="col-12">
                                    <label class="form-label">Configuraciones</label>
                                    <div class="border rounded p-3 bg-light">
                                        <div class="form-check mb-2">
                                            <input v-model="form.settings.allowSelfRegistration"
                                                class="form-check-input" type="checkbox" id="allowSelfRegistration">
                                            <label class="form-check-label" for="allowSelfRegistration">
                                                Permitir auto-registro de usuarios
                                            </label>
                                        </div>
                                        <div class="form-check mb-2">
                                            <input v-model="form.settings.requireEmailVerification"
                                                class="form-check-input" type="checkbox" id="requireEmailVerification">
                                            <label class="form-check-label" for="requireEmailVerification">
                                                Requerir verificación de email
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input v-model="form.settings.enableBudgetAlerts" class="form-check-input"
                                                type="checkbox" id="enableBudgetAlerts">
                                            <label class="form-check-label" for="enableBudgetAlerts">
                                                Habilitar alertas de presupuesto
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" @click="submitForm" :disabled="submitting">
                            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                            {{ isEditing ? 'Actualizar' : 'Crear' }} Organización
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Detail Modal -->
        <div class="modal fade" id="detailModal" tabindex="-1" ref="detailModal">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-building me-2"></i>
                            Detalles de {{ selectedOrganization?.name }}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="selectedOrganization" class="row g-4">
                            <!-- Organization Info -->
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="card-title mb-0">
                                            <i class="bi bi-info-circle me-2"></i>
                                            Información General
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <dl class="row mb-0">
                                            <dt class="col-sm-4">Nombre:</dt>
                                            <dd class="col-sm-8">{{ selectedOrganization.name || '' }}</dd>

                                            <dt class="col-sm-4">Descripción:</dt>
                                            <dd class="col-sm-8">{{ selectedOrganization.description
                                                || 'Sin descripción' }}</dd>

                                            <dt class="col-sm-4">Estado:</dt>
                                            <dd class="col-sm-8">
                                                <span class="badge"
                                                    :class="selectedOrganization.isActive ? 'bg-success' : 'bg-secondary'">
                                                    <i :class="selectedOrganization.isActive ? 'bi-check-circle' : 'bi-pause-circle'"
                                                        class="me-1"></i>
                                                    {{ selectedOrganization.isActive ? 'Activa' : 'Inactiva' }}
                                                </span>
                                            </dd>

                                            <dt class="col-sm-4">Creada:</dt>
                                            <dd class="col-sm-8">{{ formatDate(selectedOrganization.createdAt) }}</dd>

                                            <dt class="col-sm-4">Actualizada:</dt>
                                            <dd class="col-sm-8">{{ formatDate(selectedOrganization.updatedAt) }}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>

                            <!-- Quick Stats -->
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="card-title mb-0">
                                            <i class="bi bi-graph-up me-2"></i>
                                            Estadísticas Rápidas
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-3">
                                            <div class="col-6">
                                                <div class="text-center">
                                                    <div class="h4 text-primary mb-1">{{
                                                        selectedOrganization._count?.users || 0 }}</div>
                                                    <small class="text-muted">Usuarios Totales</small>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="text-center">
                                                    <div class="h4 text-success mb-1">{{
                                                        organizationUsers.filter(u => u.isActive).length}}</div>
                                                    <small class="text-muted">Usuarios Activos</small>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="text-center">
                                                    <div class="h4 text-info mb-1">{{
                                                        selectedOrganization._count?.categories || 0 }}</div>
                                                    <small class="text-muted">Categorías</small>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="text-center">
                                                    <div class="h4 text-warning mb-1">-</div>
                                                    <small class="text-muted">Transacciones</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Users List -->
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h6 class="card-title mb-0">
                                            <i class="bi bi-people me-2"></i>
                                            Usuarios de la Organización
                                        </h6>
                                        <button class="btn btn-sm btn-primary"
                                            @click="manageUsers(selectedOrganization)">
                                            <i class="bi bi-person-plus me-1"></i>
                                            Gestionar Usuarios
                                        </button>
                                    </div>
                                    <div class="card-body">
                                        <div v-if="organizationUsers.length === 0" class="text-center py-3">
                                            <i class="bi bi-people text-muted" style="font-size: 2rem;"></i>
                                            <p class="text-muted mt-2">No hay usuarios en esta organización</p>
                                        </div>
                                        <div v-else class="table-responsive">
                                            <table class="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Usuario</th>
                                                        <th>Rol</th>
                                                        <th>Estado</th>
                                                        <th>Creado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="user in organizationUsers.slice(0, 5)" :key="user.id">
                                                        <td>
                                                            <div>
                                                                <div class="fw-medium">{{ user.name }}</div>
                                                                <small class="text-muted">{{ user.email }}</small>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span class="badge bg-secondary">{{ user.role }}</span>
                                                        </td>
                                                        <td>
                                                            <span class="badge"
                                                                :class="user.isActive ? 'bg-success' : 'bg-secondary'">
                                                                {{ user.isActive ? 'Activo' : 'Inactivo' }}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <small>{{ formatDate(user.createdAt) }}</small>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div v-if="organizationUsers.length > 5" class="text-center">
                                                <small class="text-muted">
                                                    Y {{ organizationUsers.length - 5 }} usuarios más...
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cerrar
                        </button>
                        <button type="button" class="btn btn-warning" @click="editOrganization(selectedOrganization)">
                            <i class="bi bi-pencil me-1"></i>
                            Editar Organización
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoles } from '@/composables/useRoles'
import { useOrganizations } from '@/composables/useOrganizations'
import { Modal } from 'bootstrap'

const roles = useRoles()

// Verificar permisos de ADMIN
if (!roles.isAdmin.value) {
    throw new Error('Acceso denegado: Solo administradores pueden gestionar organizaciones')
}

// Composable de organizaciones
const {
    organizations,
    selectedOrganization,
    organizationUsers,
    isLoading: loading,
    isSubmitting: submitting,
    error,
    modalError,
    pagination,
    filters,
    globalStats: organizationStats,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    fetchOrganizationById,
    fetchOrganizationUsers,
    applyFilters,
    clearFilters,
    changePage,
    setSelectedOrganization,
    clearError,
    clearModalError,
    validateOrganizationForm
} = useOrganizations()

// Estados locales
const isEditing = ref(false)

// Formulario
const form = reactive({
    id: '',
    name: '',
    description: '',
    settings: {
        allowSelfRegistration: false,
        requireEmailVerification: true,
        enableBudgetAlerts: true
    }
})

const errors = reactive({
    name: '',
    description: ''
})

// Referencias de modales
const orgModal = ref<HTMLElement>()
const detailModal = ref<HTMLElement>()
let orgModalInstance: Modal | null = null
let detailModalInstance: Modal | null = null

// Funciones de modales
function openCreateModal() {
    isEditing.value = false
    resetForm()
    clearModalError()

    if (orgModalInstance) {
        orgModalInstance.show()
    }
}

async function editOrganization(org: any) {
    isEditing.value = true
    form.id = org.id
    form.name = org.name
    form.description = org.description || ''
    form.settings = { ...org.settings } || form.settings
    clearErrors()
    clearModalError()

    if (orgModalInstance) {
        orgModalInstance.show()
    }
}

async function viewOrganization(org: any) {
    setSelectedOrganization(org)

    // Cargar datos detallados
    await Promise.all([
        fetchOrganizationUsers(org.id),
        // fetchOrganizationStats(org.id) // Si necesitas estadísticas adicionales
    ])

    if (detailModalInstance) {
        detailModalInstance.show()
    }
}

function manageUsers(org: any) {
    // Redirigir a gestión de usuarios con filtro de organización
    console.log('Managing users for organization:', org)
    // TODO: Implementar navegación a UsersView con filtro
}

async function confirmDeleteOrganization(org: any) {
    const confirmMessage = `¿Estás seguro de que deseas eliminar la organización "${org.name}"?\n\nEsta acción no se puede deshacer.`

    if (confirm(confirmMessage)) {
        const success = await deleteOrganization(org.id)
        if (success) {
            // Mostrar mensaje de éxito
            console.log('Organización eliminada correctamente')
        }
    }
}

async function submitForm() {
    if (!validateLocalForm()) return

    clearModalError()

    const organizationData = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        settings: form.settings
    }

    let success = false

    if (isEditing.value) {
        success = await updateOrganization(form.id, organizationData)
    } else {
        success = await createOrganization(organizationData)
    }

    if (success) {
        // Cerrar modal y resetear formulario
        if (orgModalInstance) {
            orgModalInstance.hide()
        }
        resetForm()
    }
}

// Validación local del formulario
function validateLocalForm(): boolean {
    clearErrors()

    if (!form.name.trim()) {
        errors.name = 'El nombre es requerido'
        return false
    }

    if (form.name.length > 100) {
        errors.name = 'El nombre no puede exceder 100 caracteres'
        return false
    }

    if (form.description && form.description.length > 500) {
        errors.description = 'La descripción no puede exceder 500 caracteres'
        return false
    }

    return true
}

function clearErrors() {
    errors.name = ''
    errors.description = ''
}

function resetForm() {
    form.id = ''
    form.name = ''
    form.description = ''
    form.settings = {
        allowSelfRegistration: false,
        requireEmailVerification: true,
        enableBudgetAlerts: true
    }
    clearErrors()
}

// Funciones de utilidad
function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount)
}

function getPageNumbers() {
    const pages = []
    const start = Math.max(1, pagination.page - 2)
    const end = Math.min(pagination.pages, pagination.page + 2)

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }
    return pages
}

// Lifecycle
onMounted(async () => {
    // Inicializar modales de Bootstrap
    await nextTick()

    if (orgModal.value) {
        orgModalInstance = new Modal(orgModal.value, {
            keyboard: true,
            backdrop: 'static'
        })
    }

    if (detailModal.value) {
        detailModalInstance = new Modal(detailModal.value, {
            keyboard: true,
            backdrop: true
        })
    }

    // Cargar organizaciones
    await fetchOrganizations()
})
</script>

<style scoped>
.organizations-view {
    padding: 2rem 0;
    min-height: 100vh;
    background: #f8f9fa;
}

.card {
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
}

.card:hover {
    transform: translateY(-2px);
}

.display-6 {
    font-weight: 600;
    color: #2c3e50;
}

.btn-group .btn {
    border-radius: 0;
}

.btn-group .btn:first-child {
    border-radius: 0.375rem 0 0 0.375rem;
}

.btn-group .btn:last-child {
    border-radius: 0 0.375rem 0.375rem 0;
}
</style>