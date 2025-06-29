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

.navbar-toggler:focus {
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.navbar-toggler-icon {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2875, 85, 99, 0.8%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
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