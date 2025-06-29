<template>
  <div class="auth-container">
    <div class="container-fluid vh-100">
      <div class="row h-100">
        <!-- Lado izquierdo - Información -->
        <div class="col-lg-6 d-none d-lg-flex auth-info-side">
          <div class="d-flex flex-column justify-content-center p-5">
            <div class="text-center mb-4">
              <i class="bi bi-person-plus text-primary" style="font-size: 4rem;"></i>
              <h1 class="h2 text-white mt-3 mb-4">Únete a MiCuentaEnOrden</h1>
              <p class="text-white-50 fs-5">Comienza a gestionar tus finanzas hoy</p>
            </div>

            <div class="benefits-list">
              <div class="benefit-item mb-3">
                <i class="bi bi-shield-check text-success me-3"></i>
                <span class="text-white">Seguridad garantizada</span>
              </div>
              <div class="benefit-item mb-3">
                <i class="bi bi-graph-up text-success me-3"></i>
                <span class="text-white">Análisis inteligente</span>
              </div>
              <div class="benefit-item mb-3">
                <i class="bi bi-people text-success me-3"></i>
                <span class="text-white">Colaboración familiar</span>
              </div>
              <div class="benefit-item">
                <i class="bi bi-clock text-success me-3"></i>
                <span class="text-white">Disponible 24/7</span>
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
                  <h2 class="h3 mb-2">Crear Cuenta</h2>
                  <p class="text-muted">Regístrate en MiCuentaEnOrden</p>
                </div>

                <!-- Alert de error -->
                <div v-if="authStore.error" class="alert alert-danger alert-dismissible fade show" role="alert">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  {{ authStore.error }}
                  <button type="button" class="btn-close" @click="authStore.clearError()"></button>
                </div>

                <!-- Formulario -->
                <form @submit.prevent="handleRegister" novalidate>
                  <div class="mb-3">
                    <label for="name" class="form-label">
                      <i class="bi bi-person me-2"></i>
                      Nombre completo
                    </label>
                    <input type="text" class="form-control" id="name" v-model="form.name"
                      :class="{ 'is-invalid': errors.name }" placeholder="Tu nombre completo" required>
                    <div v-if="errors.name" class="invalid-feedback">
                      {{ errors.name }}
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="email" class="form-label">
                      <i class="bi bi-envelope me-2"></i>
                      Correo electrónico
                    </label>
                    <input type="email" class="form-control" id="email" v-model="form.email"
                      :class="{ 'is-invalid': errors.email }" placeholder="tu@email.com" required>
                    <div v-if="errors.email" class="invalid-feedback">
                      {{ errors.email }}
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="password" class="form-label">
                      <i class="bi bi-lock me-2"></i>
                      Contraseña
                    </label>
                    <div class="input-group">
                      <input :type="showPassword ? 'text' : 'password'" class="form-control" id="password"
                        v-model="form.password" :class="{ 'is-invalid': errors.password }"
                        placeholder="Mínimo 8 caracteres" required>
                      <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword">
                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                      </button>
                      <div v-if="errors.password" class="invalid-feedback">
                        {{ errors.password }}
                      </div>
                    </div>

                    <!-- Indicador de fortaleza de contraseña -->
                    <div v-if="form.password" class="password-strength mt-2">
                      <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Fortaleza:</small>
                        <small :class="passwordStrengthClass">{{ passwordStrengthText }}</small>
                      </div>
                      <div class="progress" style="height: 4px;">
                        <div class="progress-bar" :class="passwordStrengthClass"
                          :style="{ width: passwordStrengthPercentage + '%' }"></div>
                      </div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label for="confirmPassword" class="form-label">
                      <i class="bi bi-lock-fill me-2"></i>
                      Confirmar contraseña
                    </label>
                    <input :type="showConfirmPassword ? 'text' : 'password'" class="form-control" id="confirmPassword"
                      v-model="confirmPassword" :class="{ 'is-invalid': errors.confirmPassword }"
                      placeholder="Confirma tu contraseña" required>
                    <div class="input-group-append">
                      <button type="button" class="btn btn-outline-secondary position-absolute end-0 top-0 h-100"
                        style="z-index: 10; border-top-left-radius: 0; border-bottom-left-radius: 0;"
                        @click="showConfirmPassword = !showConfirmPassword">
                        <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                      </button>
                    </div>
                    <div v-if="errors.confirmPassword" class="invalid-feedback">
                      {{ errors.confirmPassword }}
                    </div>
                  </div>

                  <div class="mb-4">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="acceptTerms" v-model="acceptTerms"
                        :class="{ 'is-invalid': errors.acceptTerms }">
                      <label class="form-check-label" for="acceptTerms">
                        Acepto los
                        <a href="#" class="text-decoration-none">términos y condiciones</a>
                        y la
                        <a href="#" class="text-decoration-none">política de privacidad</a>
                      </label>
                      <div v-if="errors.acceptTerms" class="invalid-feedback">
                        {{ errors.acceptTerms }}
                      </div>
                    </div>
                  </div>

                  <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary btn-lg" :disabled="authStore.isLoading">
                      <span v-if="authStore.isLoading" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-person-plus me-2"></i>
                      {{ authStore.isLoading ? 'Creando cuenta...' : 'Crear Cuenta' }}
                    </button>
                  </div>
                </form>

                <hr class="my-4">

                <div class="text-center">
                  <p class="mb-0">
                    ¿Ya tienes cuenta?
                    <router-link to="/login" class="text-decoration-none">
                      Inicia sesión aquí
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RegisterRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const confirmPassword = ref('')
const acceptTerms = ref(false)

const form = reactive<RegisterRequest>({
  name: '',
  email: '',
  password: ''
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: ''
})

// Validación de fortaleza de contraseña
const passwordStrength = computed(() => {
  const password = form.password
  if (!password) return 0

  let score = 0

  // Longitud
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Caracteres
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  return score
})

const passwordStrengthPercentage = computed(() => {
  return (passwordStrength.value / 6) * 100
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'Débil'
  if (strength <= 4) return 'Media'
  return 'Fuerte'
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'text-danger bg-danger'
  if (strength <= 4) return 'text-warning bg-warning'
  return 'text-success bg-success'
})

function validateForm(): boolean {
  // Limpiar errores
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  let isValid = true

  // Validar nombre
  if (!form.name.trim()) {
    errors.name = 'El nombre es requerido'
    isValid = false
  } else if (form.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres'
    isValid = false
  }

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
  } else if (form.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres'
    isValid = false
  } else if (passwordStrength.value < 3) {
    errors.password = 'La contraseña debe incluir mayúsculas, minúsculas, números y símbolos'
    isValid = false
  }

  // Validar confirmación de contraseña
  if (!confirmPassword.value) {
    errors.confirmPassword = 'Debes confirmar la contraseña'
    isValid = false
  } else if (form.password !== confirmPassword.value) {
    errors.confirmPassword = 'Las contraseñas no coinciden'
    isValid = false
  }

  // Validar términos
  if (!acceptTerms.value) {
    errors.acceptTerms = 'Debes aceptar los términos y condiciones'
    isValid = false
  }

  return isValid
}

async function handleRegister() {
  if (!validateForm()) {
    return
  }

  try {
    await authStore.register(form)

    // Redirigir al dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Error en registro:', error)
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
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  border-radius: 1rem;
}

.benefit-item {
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

.password-strength .progress {
  border-radius: 2px;
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