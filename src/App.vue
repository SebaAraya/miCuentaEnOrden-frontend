<script setup lang="ts">
// App principal con router
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
