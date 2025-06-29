<template>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card border-0 shadow-lg">
                    <div class="card-body p-5">
                        <!-- Header -->
                        <div class="text-center mb-4">
                            <div class="org-selector-icon mb-3">
                                <i class="bi bi-building"></i>
                            </div>
                            <h3 class="text-primary mb-2">Seleccionar Organización</h3>
                            <p class="text-muted mb-0">
                                {{ getMessageByRole() }}
                            </p>
                        </div>

                        <!-- Loading State -->
                        <div v-if="isLoading" class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando organizaciones...</span>
                            </div>
                            <p class="mt-3 text-muted">Cargando organizaciones disponibles...</p>
                        </div>

                        <!-- Error State -->
                        <div v-else-if="error" class="alert alert-danger" role="alert">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                <div>
                                    <strong>Error al cargar organizaciones</strong>
                                    <div class="mt-1">{{ error }}</div>
                                </div>
                            </div>
                            <button @click="retry" class="btn btn-outline-danger btn-sm mt-2">
                                <i class="bi bi-arrow-clockwise me-1"></i>
                                Reintentar
                            </button>
                        </div>

                        <!-- Organizations List -->
                        <div v-else-if="availableOrganizations.length > 0" class="organizations-list">
                            <div class="row g-3">
                                <div v-for="organization in availableOrganizations" :key="organization.id"
                                    class="col-12">
                                    <div class="organization-card" @click="selectOrganization(organization.id)"
                                        role="button" tabindex="0"
                                        @keypress.enter="selectOrganization(organization.id)">
                                        <div class="d-flex align-items-center">
                                            <div class="org-icon me-3">
                                                <i class="bi bi-building"></i>
                                            </div>
                                            <div class="flex-grow-1">
                                                <h5 class="mb-1 fw-bold">{{ organization.name }}</h5>
                                                <p class="mb-1 text-muted" v-if="organization.description">
                                                    {{ organization.description }}
                                                </p>
                                                <div class="d-flex align-items-center text-muted">
                                                    <i class="bi bi-people me-1"></i>
                                                    <small>{{ organization.userCount || 0 }} usuarios</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Empty State -->
                        <div v-else class="text-center py-4">
                            <i class="bi bi-info-circle text-muted mb-3" style="font-size: 3rem;"></i>
                            <h5 class="text-muted">No hay organizaciones disponibles</h5>
                            <p class="text-muted">
                                Contacta al administrador del sistema para obtener acceso a una organización.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const isLoading = ref(false)
const error = ref<string | null>(null)

const availableOrganizations = computed(() => authStore.availableOrganizations)
const userRole = computed(() => authStore.userRole)

function getMessageByRole() {
    switch (userRole.value) {
        case 'ADMIN':
            return 'Selecciona una organización para gestionar sus transacciones o continúa sin seleccionar para ver todas.'
        case 'COLABORADOR':
            return 'Selecciona tu organización para acceder a las transacciones.'
        default:
            return 'Selecciona una organización para continuar.'
    }
}

async function loadOrganizations() {
    isLoading.value = true
    error.value = null

    try {
        await authStore.fetchAvailableOrganizations()

        if (availableOrganizations.value.length === 0) {
            error.value = 'No tienes acceso a ninguna organización'
        }
    } catch (err: any) {
        error.value = err.message || 'Error al cargar las organizaciones'
        console.error('Error loading organizations:', err)
    } finally {
        isLoading.value = false
    }
}

function selectOrganization(organizationId: string | null) {
    authStore.selectOrganization(organizationId)
}

function retry() {
    loadOrganizations()
}

onMounted(() => {
    // Solo cargar si no hay organizaciones disponibles
    if (availableOrganizations.value.length === 0) {
        loadOrganizations()
    }
})
</script>

<style scoped>
.org-selector-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    color: white;
    font-size: 2rem;
    box-shadow: 0 8px 16px rgba(34, 197, 94, 0.3);
    position: relative;
}

.org-selector-icon::after {
    content: '';
    position: absolute;
    inset: -4px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border-radius: 50%;
    z-index: -1;
    opacity: 0.2;
    filter: blur(8px);
}

.organizations-list {}

.organization-card {
    padding: 1.5rem 1.25rem;
    border: 2px solid #e5e7eb;
    border-radius: 1rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.organization-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
    transform: scaleX(0);
    transition: transform 0.3s ease;
}

.organization-card:hover::before {
    transform: scaleX(1);
}

.organization-card:hover {
    border-color: #22c55e;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.15);
    transform: translateY(-2px);
}

.organization-card:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.org-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.select-arrow {
    color: #6b7280;
    font-size: 1.5rem;
    transition: all 0.3s ease;
}

.organization-card:hover .select-arrow {
    color: #22c55e;
    transform: translateX(4px);
}

.organization-card h5 {
    color: #111827;
    transition: color 0.3s ease;
}

.organization-card:hover h5 {
    color: #16a34a;
}

/* Custom scrollbar */
.organizations-list::-webkit-scrollbar {
    width: 6px;
}

.organizations-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.organizations-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.organizations-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Loading and error states */
.spinner-border {
    width: 2.5rem;
    height: 2.5rem;
}

.alert {
    border-radius: 0.75rem;
    border: none;
}

/* Responsive */
@media (max-width: 768px) {
    .card-body {
        padding: 2rem 1.5rem !important;
    }

    .organization-card {
        padding: 1rem;
    }

    .org-icon {
        width: 40px;
        height: 40px;
        font-size: 1rem;
    }

    .org-selector-icon {
        width: 60px;
        height: 60px;
        font-size: 1.5rem;
    }
}
</style>