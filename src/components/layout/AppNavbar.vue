<template>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
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
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown"
                            aria-expanded="false">
                            <i class="bi bi-person-circle me-1"></i>
                            {{ authStore.userName || 'Usuario' }}
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <router-link to="/profile" class="dropdown-item">
                                    <i class="bi bi-person me-2"></i>
                                    Mi Perfil
                                </router-link>
                            </li>
                            <li>
                                <hr class="dropdown-divider">
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" @click.prevent="handleLogout">
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
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

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
</script>

<style scoped>
/* Estilos para la navegación */
.navbar-brand {
    font-weight: 600;
    font-size: 1.25rem;
}

.navbar-brand:hover {
    transform: scale(1.02);
    transition: transform 0.2s ease;
}

.nav-link {
    font-weight: 500;
    transition: all 0.2s ease;
    border-radius: 0.375rem;
    margin: 0 0.125rem;
}

.nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
}

.nav-link.active {
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: 600;
}

.dropdown-menu {
    border: none;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    border-radius: 0.5rem;
}

.dropdown-item {
    transition: all 0.2s ease;
    border-radius: 0.25rem;
    margin: 0.125rem;
}

.dropdown-item:hover {
    background-color: var(--bs-primary);
    color: white;
    transform: translateX(4px);
}

.dropdown-item i {
    width: 1.25rem;
    text-align: center;
}

/* Animaciones para mobile toggle */
.navbar-toggler {
    border: none;
    padding: 0.25rem 0.5rem;
}

.navbar-toggler:focus {
    box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
}

/* Responsive adjustments */
@media (max-width: 991.98px) {
    .navbar-collapse {
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: 0.5rem;
        margin-top: 0.5rem;
        padding: 1rem;
    }

    .nav-link {
        padding: 0.75rem 1rem;
        margin: 0.125rem 0;
    }

    .dropdown-menu {
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        margin-top: 0.5rem;
    }
}

/* Brand icon animation */
.navbar-brand i {
    transition: transform 0.3s ease;
}

.navbar-brand:hover i {
    transform: rotate(10deg);
}

/* Mejoras para accesibilidad */
@media (prefers-reduced-motion: reduce) {

    .nav-link,
    .navbar-brand,
    .dropdown-item {
        transition: none !important;
    }

    .nav-link:hover,
    .dropdown-item:hover {
        transform: none !important;
    }
}
</style>