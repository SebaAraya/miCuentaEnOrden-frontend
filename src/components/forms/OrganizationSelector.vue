<template>
    <div class="organization-selector">
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card border-0 shadow-sm">
                    <div class="card-body p-4">
                        <!-- Header -->
                        <div class="text-center mb-4">
                            <div class="organization-icon mb-3">
                                <i class="bi bi-building display-4 text-primary"></i>
                            </div>
                            <h4 class="card-title">Seleccionar Organización</h4>
                            <p class="text-muted">
                                <span v-if="userRole === 'ADMIN'">
                                    Como administrador, debes seleccionar una organización para gestionar las
                                    transacciones.
                                </span>
                                <span v-else-if="userRole === 'COLABORADOR'">
                                    Selecciona la organización que deseas gestionar.
                                </span>
                            </p>
                        </div>

                        <!-- Loading -->
                        <div v-if="isLoading" class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando organizaciones...</span>
                            </div>
                        </div>

                        <!-- Error -->
                        <div v-else-if="error" class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            {{ error }}
                            <button @click="$emit('retry')" class="btn btn-sm btn-outline-danger ms-2">
                                Reintentar
                            </button>
                        </div>

                        <!-- Sin organizaciones -->
                        <div v-else-if="organizations.length === 0" class="text-center py-4">
                            <i class="bi bi-building text-muted" style="font-size: 3rem;"></i>
                            <h5 class="text-muted mt-3">No hay organizaciones disponibles</h5>
                            <p class="text-muted">Contacta al administrador del sistema.</p>
                        </div>

                        <!-- Lista de organizaciones -->
                        <div v-else class="organizations-list">
                            <div class="row g-3">
                                <div v-for="org in organizations" :key="org.id" class="col-12">
                                    <div class="organization-card" :class="{ 'selected': selectedId === org.id }"
                                        @click="selectOrganization(org.id)">
                                        <div class="d-flex align-items-center">
                                            <div class="organization-info flex-grow-1">
                                                <h6 class="mb-1">{{ org.name }}</h6>
                                                <small class="text-muted">
                                                    {{ org.description || 'Sin descripción' }}
                                                </small>
                                                <div class="organization-stats mt-1">
                                                    <small class="badge bg-light text-dark">
                                                        <i class="bi bi-people me-1"></i>
                                                        {{ org._count?.users || 0 }} usuarios
                                                    </small>
                                                </div>
                                            </div>
                                            <div class="organization-select">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" :id="`org-${org.id}`"
                                                        :value="org.id" v-model="selectedId">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Botón continuar -->
                            <div class="text-center mt-4">
                                <button @click="handleContinue" :disabled="!selectedId" class="btn btn-primary px-4">
                                    <i class="bi bi-arrow-right me-2"></i>
                                    Continuar con {{ selectedOrganization?.name }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps } from 'vue'

interface Organization {
    id: string
    name: string
    description?: string
    _count?: {
        users: number
    }
}

// Props
const props = defineProps<{
    organizations: Organization[]
    isLoading: boolean
    error: string | null
    userRole: string
}>()

// Emits
const emit = defineEmits<{
    select: [organizationId: string]
    retry: []
}>()

// State
const selectedId = ref<string | null>(null)

// Computed
const selectedOrganization = computed(() => {
    return props.organizations.find(org => org.id === selectedId.value) || null
})

// Methods
function selectOrganization(id: string) {
    selectedId.value = id
}

function handleContinue() {
    if (selectedId.value) {
        emit('select', selectedId.value)
    }
}
</script>

<style scoped>
.organization-selector {
    min-height: 100vh;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem 0;
}

.card {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
}

.organization-icon {
    opacity: 0.8;
}

.organization-card {
    padding: 1rem;
    border: 2px solid #e9ecef;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fff;
}

.organization-card:hover {
    border-color: #0d6efd;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.organization-card.selected {
    border-color: #0d6efd;
    background: #f8f9ff;
    box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
}

.organization-stats .badge {
    font-size: 0.75rem;
}

.form-check-input:checked {
    background-color: #0d6efd;
    border-color: #0d6efd;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>