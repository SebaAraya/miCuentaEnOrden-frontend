<template>
  <div class="auth-container">
    <div class="container-fluid vh-100">
      <div class="row h-100">
        <!-- Lado izquierdo - Información -->
        <div class="col-lg-6 d-none d-lg-flex auth-info-side">
          <div class="d-flex flex-column justify-content-center p-5">
            <div class="text-center mb-4">
              <i class="bi bi-wallet2 text-primary" style="font-size: 4rem;"></i>
              <h1 class="h2 text-white mt-3 mb-4">MiCuentaEnOrden</h1>
              <p class="text-white-50 fs-5">Tus finanzas bajo control</p>
            </div>
            
            <div class="features-list">
              <div class="feature-item mb-3">
                <i class="bi bi-check-circle-fill text-success me-3"></i>
                <span class="text-white">Gestiona tus transacciones</span>
              </div>
              <div class="feature-item mb-3">
                <i class="bi bi-check-circle-fill text-success me-3"></i>
                <span class="text-white">Controla tus presupuestos</span>
              </div>
              <div class="feature-item mb-3">
                <i class="bi bi-check-circle-fill text-success me-3"></i>
                <span class="text-white">Reportes detallados</span>
              </div>
              <div class="feature-item">
                <i class="bi bi-check-circle-fill text-success me-3"></i>
                <span class="text-white">Colaboración en equipo</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Lado derecho - Formulario -->
        <div class="col-lg-6 d-flex align-items-center justify-content-center">
          <div class="auth-form-container w-100">
            <div class="card border-0 shadow-lg">
              <div class="card-body p-5">
                <div class="text-center mb-4">
                  <h2 class="h3 mb-2">Iniciar Sesión</h2>
                  <p class="text-muted">Accede a tu cuenta de MiCuentaEnOrden</p>
                </div>

                <!-- Alert de error -->
                <div v-if="authStore.error" class="alert alert-danger alert-dismissible fade show" role="alert">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  {{ authStore.error }}
                  <button type="button" class="btn-close" @click="authStore.clearError()"></button>
                </div>

                <!-- Formulario -->
                <form @submit.prevent="handleLogin" novalidate>
                  <div class="mb-3">
                    <label for="email" class="form-label">
                      <i class="bi bi-envelope me-2"></i>
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      class="form-control"
                      id="email"
                      v-model="form.email"
                      :class="{ 'is-invalid': errors.email }"
                      placeholder="tu@email.com"
                      required
                    >
                    <div v-if="errors.email" class="invalid-feedback">
                      {{ errors.email }}
                    </div>
                  </div>

                  <div class="mb-4">
                    <label for="password" class="form-label">
                      <i class="bi bi-lock me-2"></i>
                      Contraseña
                    </label>
                    <div class="input-group">
                      <input
                        :type="showPassword ? 'text' : 'password'"
                        class="form-control"
                        id="password"
                        v-model="form.password"
                        :class="{ 'is-invalid': errors.password }"
                        placeholder="Tu contraseña"
                        required
                      >
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        @click="showPassword = !showPassword"
                      >
                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                      </button>
                      <div v-if="errors.password" class="invalid-feedback">
                        {{ errors.password }}
                      </div>
                    </div>
                  </div>

                  <div class="d-grid gap-2">
                    <button
                      type="submit"
                      class="btn btn-primary btn-lg"
                      :disabled="authStore.isLoading"
                    >
                      <span v-if="authStore.isLoading" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-box-arrow-in-right me-2"></i>
                      {{ authStore.isLoading ? 'Iniciando...' : 'Iniciar Sesión' }}
                    </button>
                  </div>
                </form>

                <hr class="my-4">

                <div class="text-center">
                  <p class="mb-0">
                    ¿No tienes cuenta?
                    <router-link to="/register" class="text-decoration-none">
                      Regístrate aquí
                    </router-link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { LoginRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)

const form = reactive<LoginRequest>({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

function validateForm(): boolean {
  // Limpiar errores
  errors.email = ''
  errors.password = ''

  let isValid = true

  // Validar email
  if (!form.email) {
    errors.email = 'El correo electrónico es requerido'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'El correo electrónico no es válido'
    isValid = false
  }

  // Validar contraseña
  if (!form.password) {
    errors.password = 'La contraseña es requerida'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres'
    isValid = false
  }

  return isValid
}

async function handleLogin() {
  if (!validateForm()) {
    return
  }

  try {
    await authStore.login(form)
    
    // Redirigir al dashboard o a la ruta anterior
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || '/dashboard')
  } catch (error) {
    console.error('Error en login:', error)
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-info-side {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  position: relative;
}

.auth-info-side::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="white" opacity="0.1"/><circle cx="10" cy="50" r="1" fill="white" opacity="0.1"/><circle cx="90" cy="30" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.auth-form-container {
  max-width: 450px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  border-radius: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.form-control {
  border-radius: 0.5rem;
  border: 2px solid #e9ecef;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

@media (max-width: 991.98px) {
  .auth-container {
    background: #f8f9fa;
  }
  
  .auth-form-container {
    padding: 1rem;
  }
}
</style> 