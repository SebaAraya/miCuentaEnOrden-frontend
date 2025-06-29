<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Cargar organizaciones cuando el usuario esté autenticado
async function loadOrganizationsIfNeeded() {
  if (authStore.isAuthenticated &&
    (authStore.userRole === 'ADMIN' || authStore.userRole === 'COLABORADOR') &&
    authStore.availableOrganizations.length === 0) {
    await authStore.fetchAvailableOrganizations()
  }
}

// Watcher para cargar organizaciones cuando se autentique
watch(() => authStore.isAuthenticated, async (isAuthenticated) => {
  if (isAuthenticated) {
    await loadOrganizationsIfNeeded()
  }
})

onMounted(async () => {
  // Cargar organizaciones si ya está autenticado
  await loadOrganizationsIfNeeded()
})
</script>

<template>
  <router-view />
</template>

<style>
/* Estilos globales para la aplicación */
body {
  font-family: 'Inter', sans-serif;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}

/* Animaciones de transición para rutas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
