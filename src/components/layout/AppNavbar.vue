<template>
    <nav class="navbar navbar-expand-lg navbar-light modern-navbar">
        <div class="container-fluid">
            <!-- Brand -->
            <router-link to="/dashboard" class="navbar-brand">
                <i class="bi bi-wallet2 me-2"></i>
                MiCuentaEnOrden
            </router-link>

            <!-- Toggle button for mobile -->
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <!-- Navigation items -->
            <div class="collapse navbar-collapse" id="navbarNav">
                <!-- Main navigation -->
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <router-link to="/dashboard" class="nav-link" active-class="active">
                            <i class="bi bi-house me-1"></i>
                            Dashboard
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/transactions" class="nav-link" active-class="active">
                            <i class="bi bi-arrow-left-right me-1"></i>
                            Transacciones
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/budgets" class="nav-link" active-class="active">
                            <i class="bi bi-piggy-bank me-1"></i>
                            Presupuestos
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/reports" class="nav-link" active-class="active">
                            <i class="bi bi-graph-up me-1"></i>
                            Reportes
                        </router-link>
                    </li>
                </ul>

                <!-- User dropdown -->
                <ul class="navbar-nav">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle user-dropdown" href="#" role="button"
                            data-bs-toggle="dropdown" aria-expanded="false">

                            {{ authStore.userName || 'Usuario' }}
                            <!-- <span class="role-badge" :class="`badge-${roleInfo.color}`">
                                {{ roleInfo.name }}
                            </span> -->
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <!-- User Info -->
                            <li class="dropdown-header">
                                <div class="user-info">
                                    <i :class="roleInfo.icon" class="me-2"></i>
                                    <div>
                                        <div class="fw-bold">{{ authStore.userName }}
                                            <span class="role-badge" :class="`badge-${roleInfo.color}`">
                                                {{ roleInfo.name }}
                                            </span>
                                        </div>
                                        <!-- <small class="text-muted">{{ roleInfo.name }}</small> -->
                                        <div v-if="authStore.selectedOrganization" class="text-muted mt-1">
                                            <i class="bi bi-building me-1"></i>
                                            <small>{{ authStore.selectedOrganization.name }}</small>
                                        </div>
                                        <div v-else-if="authStore.canSelectOrganization" class="text-warning mt-1">
                                            <i class="bi bi-exclamation-triangle me-1"></i>
                                            <small>Seleccionar organización</small>
                                        </div>
                                    </div>
                                </div>
                            </li>

                            <!-- Organization Selection -->
                            <template v-if="authStore.canSelectOrganization">
                                <li>
                                    <hr class="dropdown-divider">
                                </li>
                                <li class="dropdown-header">
                                    <small class="text-primary fw-semibold">
                                        <i class="bi bi-building me-1"></i>
                                        Cambiar Organización
                                    </small>
                                </li>
                                <li v-for="organization in authStore.availableOrganizations" :key="organization.id">
                                    <button class="dropdown-item d-flex align-items-center justify-content-between"
                                        @click="selectOrganization(organization.id)"
                                        :class="{ 'active-org': organization.id === authStore.selectedOrganizationId }">
                                        <div class="d-flex align-items-center">
                                            <i class="bi bi-building me-2"></i>
                                            <div>
                                                <div class="fw-medium">{{ organization.name }}</div>
                                                <small class="text-muted" v-if="organization.description">
                                                    {{ organization.description }}
                                                </small>
                                            </div>
                                        </div>
                                        <i class="bi bi-check text-success"
                                            v-if="organization.id === authStore.selectedOrganizationId"></i>
                                    </button>
                                </li>

                                <!-- Limpiar selección (solo para ADMIN) -->
                                <!-- <li v-if="authStore.userRole === 'ADMIN' && authStore.selectedOrganizationId">
                                    <button class="dropdown-item text-muted d-flex align-items-center"
                                        @click="selectOrganization(null)">
                                        <i class="bi bi-x-circle me-2"></i>
                                        Limpiar selección
                                    </button>
                                </li> -->
                            </template>

                            <li>
                                <hr class="dropdown-divider">
                            </li>

                            <!-- Profile -->
                            <li>
                                <router-link to="/profile" class="dropdown-item">
                                    <i class="bi bi-person me-2"></i>
                                    Mi Perfil
                                </router-link>
                            </li>

                            <!-- Admin/Colaborador Options -->
                            <li v-if="roles.canManageUsers">
                                <router-link to="/users" class="dropdown-item">
                                    <i class="bi bi-people me-2"></i>
                                    Gestionar Usuarios
                                </router-link>
                            </li>
                            <li v-if="roles.canManageUsers">
                                <router-link to="/categories" class="dropdown-item">
                                    <i class="bi bi-grid-3x3-gap me-2"></i>
                                    Gestionar Categorías
                                </router-link>
                            </li>
                            <li v-if="roles.hasPermission('canManageOrganizations')">
                                <router-link to="/organizations" class="dropdown-item">
                                    <i class="bi bi-building me-2"></i>
                                    Organizaciones
                                </router-link>
                            </li>

                            <li>
                                <hr class="dropdown-divider">
                            </li>

                            <!-- Logout -->
                            <li>
                                <a class="dropdown-item logout-item" href="#" @click.prevent="handleLogout">
                                    <i class="bi bi-box-arrow-right me-2"></i>
                                    Cerrar Sesión
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useRoles, UserRole } from '@/composables/useRoles'


const authStore = useAuthStore()
const router = useRouter()
const roles = useRoles()

// Información del rol actual
const roleInfo = computed(() => {
    const userRole = authStore.user?.role as UserRole
    return {
        name: roles.getRoleDisplayName(userRole),
        color: roles.getRoleColor(userRole),
        icon: roles.getRoleIcon(userRole)
    }
})

const handleLogout = async () => {
    try {
        await authStore.logout()
        await router.push({ name: 'login' })
    } catch (error) {
        console.error('Error durante el logout:', error)
        // Forzar redirección en caso de error
        await router.push({ name: 'login' })
    }
}

function selectOrganization(organizationId: string | null) {
    authStore.selectOrganization(organizationId)
}
</script>

<style scoped>
/* Navbar Moderno */
.modern-navbar {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(229, 231, 235, 0.8);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    z-index: 1030;
    position: relative;
}

.navbar-brand {
    font-weight: 700;
    font-size: 1.5rem;
    color: #16a34a !important;
    transition: all 0.3s ease;
}

.navbar-brand:hover {
    color: #15803d !important;
    transform: scale(1.05);
}

.navbar-brand i {
    color: #22c55e;
    transition: transform 0.3s ease;
}

.navbar-brand:hover i {
    transform: rotate(10deg);
}

.nav-link {
    font-weight: 500;
    color: #4b5563 !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 0.5rem;
    margin: 0 0.25rem;
    padding: 0.5rem 1rem !important;
}

.nav-link:hover {
    color: #16a34a !important;
    background-color: rgba(34, 197, 94, 0.1);
    transform: translateY(-1px);
}

.nav-link.active {
    color: #16a34a !important;
    background-color: rgba(34, 197, 94, 0.15);
    font-weight: 600;
}

.dropdown-menu {
    border: none;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    padding: 0.5rem;
    z-index: 1040;
}

.dropdown-item {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 0.5rem;
    margin: 0.125rem 0;
    padding: 0.5rem 0.75rem;
    font-weight: 500;
}

.dropdown-item:hover {
    background-color: #22c55e;
    color: white;
    transform: translateX(4px);
}

.dropdown-item i {
    width: 1.25rem;
    text-align: center;
    margin-right: 0.5rem;
}

.navbar-toggler {
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    z-index: 1031;
    position: relative;
}

/* Organization Selector in Dropdown */
.dropdown-item.active-org {
    background-color: rgba(34, 197, 94, 0.1) !important;
    color: #16a34a !important;
}

.dropdown-item.active-org:hover {
    background-color: #22c55e !important;
    color: white !important;
}

.dropdown-item.active-org .text-muted {
    color: rgba(22, 163, 74, 0.7) !important;
}

.dropdown-item.active-org:hover .text-muted {
    color: rgba(255, 255, 255, 0.8) !important;
}

.user-info {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.25rem 0;
}

.user-info>div {
    flex: 1;
    min-width: 0;
}

.dropdown-header small {
    font-size: 0.75rem;
    letter-spacing: 0.025em;
    text-transform: uppercase;
}

/* Estilos específicos para roles */
.role-badge {
    font-size: 0.6rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    margin-left: 0.5rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    text-transform: uppercase;
}

.badge-admin {
    background-color: #dc2626;
    color: white;
}

.badge-colaborador {
    background-color: #2563eb;
    color: white;
}

.badge-usuario_basico {
    background-color: #16a34a;
    color: white;
}

.user-dropdown {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #374151 !important;
    text-decoration: none;
    padding: 0.5rem 1rem !important;
    border-radius: 0.75rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-dropdown:hover {
    background-color: rgba(34, 197, 94, 0.1);
    color: #16a34a !important;
    transform: none;
}

.logout-item:hover {
    background-color: #dc2626 !important;
    color: white !important;
}

.navbar-toggler:focus {
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.navbar-toggler-icon {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2875, 85, 99, 0.8%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

/* User Dropdown */
.user-dropdown {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.role-badge {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    margin-left: 0.5rem;
}

.badge-danger {
    background-color: #dc3545;
    color: white;
}

.badge-warning {
    background-color: #ffc107;
    color: #212529;
}

.badge-success {
    background-color: #198754;
    color: white;
}

.badge-secondary {
    background-color: #6c757d;
    color: white;
}

.dropdown-header {
    padding: 0.75rem 1rem;
    background-color: rgba(34, 197, 94, 0.05);
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.user-info i {
    font-size: 1.5rem;
    color: #22c55e;
}

.logout-item:hover {
    background-color: #dc3545 !important;
    color: white !important;
}

/* Responsive */
@media (max-width: 991.98px) {
    .navbar-collapse {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 0.75rem;
        margin-top: 1rem;
        padding: 1rem;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1035;
        position: relative;
    }

    .nav-link {
        padding: 0.75rem 1rem !important;
        margin: 0.25rem 0;
    }

    .dropdown-menu {
        background: rgba(255, 255, 255, 0.98);
        margin-top: 0.5rem;
    }
}

/* Animaciones */
@media (prefers-reduced-motion: reduce) {

    .nav-link,
    .navbar-brand,
    .dropdown-item {
        transition: none !important;
    }

    .nav-link:hover,
    .dropdown-item:hover,
    .navbar-brand:hover {
        transform: none !important;
    }
}
</style>