<template>
    <div class="users-view">
        <!-- Header -->
        <div class="header-section">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="header-content">
                            <div class="header-icon">
                                <i class="bi bi-people-fill"></i>
                            </div>
                            <div>
                                <nav aria-label="breadcrumb">
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item">
                                            <router-link to="/dashboard">Dashboard</router-link>
                                        </li>
                                        <li class="breadcrumb-item active">Usuarios</li>
                                    </ol>
                                </nav>
                                <h1 class="header-title">Gestión de Usuarios</h1>
                                <p class="header-description">
                                    {{ roles.isAdmin ? 'Administra todos los usuarios del sistema'
                                        : 'Administra usuarios de tu organización' }}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary btn-lg me-2" @click="openCreateModal"
                            v-if="roles.canManageUsers">
                            <i class="bi bi-person-plus me-2"></i>
                            Nuevo Usuario
                        </button>
                        <button class="btn btn-outline-success btn-lg" @click="openInviteModal"
                            v-if="roles.canManageUsers">
                            <i class="bi bi-envelope me-2"></i>
                            Invitar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats Overview -->
        <div class="container-fluid mb-4">
            <div class="row g-4">
                <div class="col-lg-3 col-md-6">
                    <div class="stat-card">
                        <div class="stat-icon bg-primary">
                            <i class="bi bi-people"></i>
                        </div>
                        <div class="stat-content">
                            <h3>{{ pagination.total }}</h3>
                            <p>Total Usuarios</p>
                            <small class="text-success">
                                <i class="bi bi-person-check"></i>
                                {{users.filter(u => u.isActive).length}} activos
                            </small>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="stat-card">
                        <div class="stat-icon bg-danger">
                            <i class="bi bi-shield-check"></i>
                        </div>
                        <div class="stat-content">
                            <h3>{{users.filter(u => u.role === 'ADMIN').length}}</h3>
                            <p>Administradores</p>
                            <small class="text-info">
                                <i class="bi bi-gear"></i>
                                Control total
                            </small>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="stat-card">
                        <div class="stat-icon bg-warning">
                            <i class="bi bi-person-gear"></i>
                        </div>
                        <div class="stat-content">
                            <h3>{{users.filter(u => u.role === 'COLABORADOR').length}}</h3>
                            <p>Colaboradores</p>
                            <small class="text-primary">
                                <i class="bi bi-people-fill"></i>
                                Gestión org
                            </small>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="stat-card">
                        <div class="stat-icon bg-info">
                            <i class="bi bi-person"></i>
                        </div>
                        <div class="stat-content">
                            <h3>{{users.filter(u => u.role === 'USUARIO_BASICO').length}}</h3>
                            <p>Usuarios Básicos</p>
                            <small class="text-muted">
                                <i class="bi bi-person-circle"></i>
                                Acceso personal
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="container-fluid mb-4">
            <div class="card">
                <div class="card-body">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label">Buscar Usuario</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-search"></i>
                                </span>
                                <input v-model="filters.search" type="text" class="form-control"
                                    placeholder="Buscar por nombre o email...">
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Rol</label>
                            <select v-model="filters.role" class="form-select">
                                <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Estado</label>
                            <select v-model="filters.isActive" class="form-select">
                                <option :value="undefined">Todos</option>
                                <option :value="true">Activos</option>
                                <option :value="false">Inactivos</option>
                            </select>
                        </div>
                        <div class="col-md-2" v-if="roles.isAdmin">
                            <label class="form-label">Organización</label>
                            <select v-model="filters.organizationId" class="form-select">
                                <option value="">Todas</option>
                                <option v-for="org in organizations" :key="org.id" :value="org.id">
                                    {{ org.name }}
                                </option>
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
        </div>

        <!-- Users List -->
        <div class="container-fluid">
            <div class="row">
                <!-- Loading -->
                <div v-if="isLoading" class="col-12">
                    <div class="text-center p-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-3 text-muted">Cargando usuarios...</p>
                    </div>
                </div>

                <!-- Error -->
                <div v-else-if="error" class="col-12">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        {{ error }}
                        <button @click="fetchUsers" class="btn btn-sm btn-outline-danger ms-2">
                            Reintentar
                        </button>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="users.length === 0" class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-people"></i>
                        <h3>No hay usuarios</h3>
                        <p>{{ filters.search || filters.role ? 'No se encontraron usuarios con los filtros aplicados' :
                            'Comienza agregando el primer usuario' }}</p>
                        <button v-if="roles.canManageUsers && !filters.search && !filters.role" @click="openCreateModal"
                            class="btn btn-primary">
                            <i class="bi bi-person-plus me-2"></i>
                            Crear Primer Usuario
                        </button>
                    </div>
                </div>

                <!-- Users Grid -->
                <div v-else class="col-12">
                    <div class="row g-4">
                        <div v-for="user in users" :key="user.id" class="col-xl-4 col-lg-6">
                            <div class="user-card">
                                <div class="user-header">
                                    <div class="user-avatar">
                                        <i class="bi bi-person-circle"></i>
                                    </div>
                                    <div class="user-info">
                                        <h6 class="user-name">{{ user.name }}</h6>
                                        <p class="user-email">{{ user.email }}</p>
                                        <div class="user-badges">
                                            <span class="badge me-1" :class="`bg-${getRoleColor(user.role)}`">
                                                {{ formatRole(user.role) }}
                                            </span>
                                            <span class="badge" :class="user.isActive ? 'bg-success' : 'bg-secondary'">
                                                <i :class="user.isActive ? 'bi-check-circle' : 'bi-x-circle'"
                                                    class="me-1"></i>
                                                {{ user.isActive ? 'Activo' : 'Inactivo' }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div class="user-details">
                                    <div class="detail-row">
                                        <div class="detail-item">
                                            <i class="bi bi-building text-info"></i>
                                            <span>{{ user.organization?.name || 'Sin organización' }}</span>
                                        </div>
                                    </div>
                                    <div class="detail-row">
                                        <div class="detail-item">
                                            <i class="bi bi-calendar-check text-success"></i>
                                            <span>{{ user.lastLogin ? formatDate(user.lastLogin) : 'Nunca' }}</span>
                                        </div>
                                    </div>
                                    <div class="detail-row">
                                        <div class="detail-item">
                                            <i class="bi bi-clock text-muted"></i>
                                            <span>{{ formatDate(user.createdAt) }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="user-actions" v-if="roles.canManageUsers">
                                    <div class="btn-group w-100">
                                        <button @click="viewUser(user)" class="btn btn-outline-primary btn-sm"
                                            title="Ver detalles">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                        <button @click="editUser(user)" class="btn btn-outline-warning btn-sm"
                                            title="Editar">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-outline-secondary btn-sm dropdown-toggle"
                                                data-bs-toggle="dropdown" title="Más acciones">
                                                <i class="bi bi-three-dots"></i>
                                            </button>
                                            <ul class="dropdown-menu">
                                                <li>
                                                    <button @click="toggleUserStatus(user)" class="dropdown-item">
                                                        <i :class="user.isActive ? 'bi-pause-circle' : 'bi-play-circle'"
                                                            class="me-2"></i>
                                                        {{ user.isActive ? 'Desactivar' : 'Activar' }}
                                                    </button>
                                                </li>
                                                <li>
                                                    <button @click="resetPassword(user)" class="dropdown-item">
                                                        <i class="bi bi-key me-2"></i>
                                                        Resetear Contraseña
                                                    </button>
                                                </li>
                                                <li v-if="roles.isAdmin && user.role !== 'ADMIN'">
                                                    <button @click="changeRole(user)" class="dropdown-item">
                                                        <i class="bi bi-person-gear me-2"></i>
                                                        Cambiar Rol
                                                    </button>
                                                </li>
                                                <li>
                                                    <hr class="dropdown-divider">
                                                </li>
                                                <li>
                                                    <button @click="deleteUser(user)" class="dropdown-item text-danger"
                                                        :disabled="user.role === 'ADMIN'">
                                                        <i class="bi bi-trash me-2"></i>
                                                        Eliminar
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <div v-if="pagination.pages > 1" class="d-flex justify-content-center mt-4">
                        <nav>
                            <ul class="pagination">
                                <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
                                    <button class="page-link" @click="changePage(pagination.page - 1)">
                                        <i class="bi bi-chevron-left"></i>
                                    </button>
                                </li>
                                <li v-for="page in getPageNumbers" :key="page" class="page-item"
                                    :class="{ active: page === pagination.page }">
                                    <button class="page-link" @click="changePage(page)">{{ page }}</button>
                                </li>
                                <li class="page-item" :class="{ disabled: pagination.page >= pagination.pages }">
                                    <button class="page-link" @click="changePage(pagination.page + 1)">
                                        <i class="bi bi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create/Edit User Modal -->
        <div class="modal fade" id="userModal" tabindex="-1" ref="userModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-person me-2"></i>
                            {{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="submitUserForm">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Nombre Completo <span class="text-danger">*</span></label>
                                    <input v-model="userForm.name" type="text" class="form-control"
                                        :class="{ 'is-invalid': userFormErrors.name }"
                                        placeholder="Nombre completo del usuario" required>
                                    <div v-if="userFormErrors.name" class="invalid-feedback">
                                        {{ userFormErrors.name }}
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <label class="form-label">Email <span class="text-danger">*</span></label>
                                    <input v-model="userForm.email" type="email" class="form-control"
                                        :class="{ 'is-invalid': userFormErrors.email }" placeholder="email@empresa.com"
                                        required>
                                    <div v-if="userFormErrors.email" class="invalid-feedback">
                                        {{ userFormErrors.email }}
                                    </div>
                                </div>

                                <div class="col-md-6" v-if="!isEditing">
                                    <label class="form-label">Contraseña <span class="text-danger">*</span></label>
                                    <input v-model="userForm.password" type="password" class="form-control"
                                        :class="{ 'is-invalid': userFormErrors.password }"
                                        placeholder="Mínimo 6 caracteres" :required="!isEditing">
                                    <div v-if="userFormErrors.password" class="invalid-feedback">
                                        {{ userFormErrors.password }}
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <label class="form-label">Rol <span class="text-danger">*</span></label>
                                    <select v-model="userForm.role" class="form-select"
                                        :class="{ 'is-invalid': userFormErrors.role }" required>
                                        <option value="">Selecciona un rol</option>
                                        <option v-for="option in availableRoles" :key="option.value"
                                            :value="option.value">
                                            {{ option.label }}
                                        </option>
                                    </select>
                                    <div v-if="userFormErrors.role" class="invalid-feedback">
                                        {{ userFormErrors.role }}
                                    </div>
                                </div>

                                <div class="col-12" v-if="roles.isAdmin">
                                    <label class="form-label">Organización</label>
                                    <select v-model="userForm.organizationId" class="form-select">
                                        <option value="">Sin organización</option>
                                        <option v-for="org in organizations" :key="org.id" :value="org.id">
                                            {{ org.name }}
                                        </option>
                                    </select>
                                </div>

                                <div class="col-12" v-if="isEditing">
                                    <div class="form-check">
                                        <input v-model="userForm.isActive" class="form-check-input" type="checkbox"
                                            id="userActive">
                                        <label class="form-check-label" for="userActive">
                                            Usuario activo
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" @click="submitUserForm" :disabled="isSubmitting">
                            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                            {{ isEditing ? 'Actualizar' : 'Crear' }} Usuario
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
import { useUsers } from '@/composables/useUsers'
import { useOrganizations } from '@/composables/useOrganizations'
import { Modal } from 'bootstrap'

const roles = useRoles()

// Composables
const {
    users,
    selectedUser,
    isLoading,
    isSubmitting,
    error,
    pagination,
    filters,
    roleOptions,
    availableRoles,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser: deleteUserService,
    applyFilters,
    clearFilters,
    formatRole,
    getRoleColor
} = useUsers()

const { organizations, fetchOrganizations } = useOrganizations()

// Estados locales
const isEditing = ref(false)

// Formulario de usuario
const userForm = reactive({
    id: '',
    name: '',
    email: '',
    password: '',
    role: '',
    organizationId: '',
    isActive: true
})

const userFormErrors = reactive({
    name: '',
    email: '',
    password: '',
    role: ''
})

// Referencias de modales
const userModal = ref<HTMLElement>()
let userModalInstance: Modal | null = null

// Computed
const getPageNumbers = computed(() => {
    const pages = []
    const start = Math.max(1, pagination.page - 2)
    const end = Math.min(pagination.pages, pagination.page + 2)

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }
    return pages
})

// Funciones de modal
function openCreateModal() {
    isEditing.value = false
    resetUserForm()

    if (userModalInstance) {
        userModalInstance.show()
    }
}

function openInviteModal() {
    // TODO: Implementar modal de invitación
    console.log('Opening invite modal')
}

async function editUser(user: any) {
    isEditing.value = true
    userForm.id = user.id
    userForm.name = user.name
    userForm.email = user.email
    userForm.role = user.role
    userForm.organizationId = user.organizationId || ''
    userForm.isActive = user.isActive
    userForm.password = '' // No mostrar contraseña actual
    clearUserFormErrors()

    if (userModalInstance) {
        userModalInstance.show()
    }
}

function viewUser(user: any) {
    selectedUser.value = user
    // TODO: Implementar modal de detalles del usuario
    console.log('Viewing user:', user)
}

async function toggleUserStatus(user: any) {
    const newStatus = !user.isActive
    const action = newStatus ? 'activar' : 'desactivar'

    if (confirm(`¿Estás seguro de que deseas ${action} a ${user.name}?`)) {
        // TODO: Implementar toggle status
        console.log(`${action} user:`, user)
    }
}

async function resetPassword(user: any) {
    if (confirm(`¿Estás seguro de que deseas resetear la contraseña de ${user.name}?\n\nSe generará una contraseña temporal.`)) {
        // TODO: Implementar reset password
        console.log('Reset password for user:', user)
    }
}

function changeRole(user: any) {
    // TODO: Implementar modal de cambio de rol
    console.log('Change role for user:', user)
}

async function deleteUser(user: any) {
    if (user.role === 'ADMIN') {
        alert('No se puede eliminar usuarios administradores')
        return
    }

    const confirmMessage = `¿Estás seguro de que deseas eliminar a ${user.name}?\n\nEsta acción no se puede deshacer.`

    if (confirm(confirmMessage)) {
        const success = await deleteUserService(user.id)
        if (success) {
            console.log('Usuario eliminado correctamente')
        }
    }
}

async function submitUserForm() {
    if (!validateUserForm()) return

    const userData = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        role: userForm.role as 'ADMIN' | 'COLABORADOR' | 'USUARIO_BASICO',
        organizationId: userForm.organizationId || undefined,
        ...(isEditing.value ? { isActive: userForm.isActive } : { password: userForm.password })
    }

    let success = false

    if (isEditing.value) {
        success = await updateUser(userForm.id, userData)
    } else {
        success = await createUser(userData as any)
    }

    if (success) {
        // Cerrar modal y resetear formulario
        if (userModalInstance) {
            userModalInstance.hide()
        }
        resetUserForm()
    }
}

function changePage(page: number) {
    if (page >= 1 && page <= pagination.pages) {
        pagination.page = page
        filters.page = page
        fetchUsers()
    }
}

// Validación del formulario
function validateUserForm(): boolean {
    clearUserFormErrors()

    if (!userForm.name.trim()) {
        userFormErrors.name = 'El nombre es requerido'
        return false
    }

    if (!userForm.email.trim()) {
        userFormErrors.email = 'El email es requerido'
        return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
        userFormErrors.email = 'El formato del email es inválido'
        return false
    }

    if (!isEditing.value && (!userForm.password || userForm.password.length < 6)) {
        userFormErrors.password = 'La contraseña debe tener al menos 6 caracteres'
        return false
    }

    if (!userForm.role) {
        userFormErrors.role = 'El rol es requerido'
        return false
    }

    return true
}

function clearUserFormErrors() {
    userFormErrors.name = ''
    userFormErrors.email = ''
    userFormErrors.password = ''
    userFormErrors.role = ''
}

function resetUserForm() {
    userForm.id = ''
    userForm.name = ''
    userForm.email = ''
    userForm.password = ''
    userForm.role = ''
    userForm.organizationId = ''
    userForm.isActive = true
    clearUserFormErrors()
}

// Funciones de utilidad
function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Lifecycle
onMounted(async () => {
    // Inicializar modales de Bootstrap
    await nextTick()

    if (userModal.value) {
        userModalInstance = new Modal(userModal.value, {
            keyboard: true,
            backdrop: 'static'
        })
    }

    // Cargar datos iniciales
    await Promise.all([
        fetchUsers(),
        fetchOrganizations()
    ])
})
</script>

<style scoped>
.users-view {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.header-section {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
    padding: 2rem 0;
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(34, 197, 94, 0.1);
}

.header-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.header-icon {
    width: 4rem;
    height: 4rem;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.header-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
}

.header-description {
    color: #6b7280;
    margin: 0.5rem 0 0 0;
    font-size: 1.1rem;
}

.breadcrumb {
    margin-bottom: 0.5rem;
}

.breadcrumb a {
    color: #22c55e;
    text-decoration: none;
}

.stat-card {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(229, 231, 235, 0.8);
    display: flex;
    align-items: center;
    gap: 1rem;
    height: 100%;
    transition: transform 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: white;
    flex-shrink: 0;
}

.stat-content h3 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    color: #1f2937;
}

.stat-content p {
    margin: 0.25rem 0;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
}

.empty-state {
    text-align: center;
    padding: 4rem 2rem;
}

.empty-state i {
    font-size: 4rem;
    color: #d1d5db;
    margin-bottom: 1rem;
}

.empty-state h3 {
    color: #374151;
    margin-bottom: 0.5rem;
}

.empty-state p {
    color: #6b7280;
    margin-bottom: 2rem;
}

.user-card {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(229, 231, 235, 0.8);
    transition: all 0.2s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.user-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.user-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
}

.user-avatar {
    width: 3rem;
    height: 3rem;
    background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #64748b;
    flex-shrink: 0;
}

.user-info {
    flex-grow: 1;
}

.user-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
}

.user-email {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0 0 0.5rem 0;
}

.user-badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.user-details {
    flex-grow: 1;
    margin-bottom: 1rem;
}

.detail-row {
    display: flex;
    margin-bottom: 0.5rem;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
}

.detail-item i {
    font-size: 1rem;
    width: 1rem;
}

.user-actions .btn-group {
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.user-actions .btn {
    font-size: 0.8rem;
    padding: 0.375rem 0.75rem;
    border-color: #d1d5db;
}

.user-actions .btn:hover {
    transform: none;
}

.pagination .page-link {
    color: #22c55e;
    border-color: #d1d5db;
}

.pagination .page-item.active .page-link {
    background-color: #22c55e;
    border-color: #22c55e;
}

.pagination .page-link:hover {
    background-color: rgba(34, 197, 94, 0.1);
    border-color: #22c55e;
}

.modal-content {
    border: none;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem;
}

.modal-body {
    padding: 1.5rem;
}

.modal-footer {
    border-top: 1px solid #e5e7eb;
    padding: 1rem 1.5rem;
}

.form-control:focus,
.form-select:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 0.2rem rgba(34, 197, 94, 0.25);
}

.btn-primary {
    background-color: #22c55e;
    border-color: #22c55e;
}

.btn-primary:hover {
    background-color: #16a34a;
    border-color: #16a34a;
}

.btn-outline-success {
    color: #22c55e;
    border-color: #22c55e;
}

.btn-outline-success:hover {
    background-color: #22c55e;
    border-color: #22c55e;
}

.dropdown-menu {
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.dropdown-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}

.dropdown-item:hover {
    background-color: #f3f4f6;
}

.dropdown-item.text-danger:hover {
    background-color: #fef2f2;
    color: #dc2626;
}

.dropdown-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }

    .user-actions .btn-group {
        justify-content: center;
    }

    .stat-card {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
    }

    .stat-icon {
        align-self: center;
    }

    .detail-row {
        flex-direction: column;
        gap: 0.25rem;
    }
}

@media (max-width: 576px) {
    .user-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .user-badges {
        justify-content: center;
    }
}
</style>