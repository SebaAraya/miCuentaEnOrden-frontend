<template>
    <div class="budget-input">
        <label v-if="label" :for="inputId" class="form-label">
            <i v-if="icon" :class="icon" class="me-1"></i>
            {{ label }}
            <span v-if="required" class="text-danger">*</span>
        </label>

        <div class="input-group">
            <span class="input-group-text">
                <i class="bi bi-currency-dollar"></i>
            </span>
            <input :id="inputId" v-model="displayValue" type="text" class="form-control"
                :class="{ 'is-invalid': hasError }" :placeholder="placeholder" :disabled="disabled" :readonly="readonly"
                @input="handleInput" @blur="handleBlur" @focus="handleFocus" />
            <span v-if="props.currency" class="input-group-text">{{ props.currency }}</span>
        </div>

        <div v-if="hasError" class="invalid-feedback d-block">
            {{ errorMessage }}
        </div>

        <div v-if="helpText" class="form-text">
            {{ helpText }}
        </div>

        <!-- Mostrar valor formateado cuando no está enfocado -->
        <div v-if="showFormattedValue && !isFocused && modelValue" class="mt-1">
            <small class="text-success">
                <i class="bi bi-check-circle me-1"></i>
                Valor: {{ formattedValue }}
            </small>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps<{
    modelValue: string | number
    label?: string
    icon?: string
    placeholder?: string
    helpText?: string
    currency?: string
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    min?: number
    max?: number
    showFormattedValue?: boolean
    error?: string
}>()

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: string]
    'valid-change': [isValid: boolean]
}>()

// Estado local
const displayValue = ref('')
const isFocused = ref(false)
const localError = ref('')

// Computed
const inputId = computed(() => `budget-input-${Math.random().toString(36).substr(2, 9)}`)

const hasError = computed(() => !!(props.error || localError.value))

const errorMessage = computed(() => props.error || localError.value)

const numericValue = computed(() => {
    const cleaned = displayValue.value.replace(/[^\d]/g, '')
    return cleaned ? parseInt(cleaned, 10) : 0
})

const formattedValue = computed(() => {
    if (!numericValue.value) return ''

    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(numericValue.value)
})

// Métodos
const formatDisplayValue = (value: string | number): string => {
    if (!value) return ''

    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return ''

    // Formatear con separadores de miles
    return new Intl.NumberFormat('es-CL').format(num)
}

const validateValue = (): boolean => {
    localError.value = ''

    if (props.required && !numericValue.value) {
        localError.value = 'Este campo es requerido'
        return false
    }

    if (numericValue.value && props.min !== undefined && numericValue.value < props.min) {
        localError.value = `El valor mínimo es ${formatDisplayValue(props.min)}`
        return false
    }

    if (numericValue.value && props.max !== undefined && numericValue.value > props.max) {
        localError.value = `El valor máximo es ${formatDisplayValue(props.max)}`
        return false
    }

    return true
}

const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    let value = target.value

    // Permitir solo números, comas y puntos
    value = value.replace(/[^\d.,]/g, '')

    // Convertir comas a puntos para decimales
    value = value.replace(/,/g, '.')

    // Solo un punto decimal
    const parts = value.split('.')
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('')
    }

    displayValue.value = value

    // Emitir valor limpio
    const cleanValue = value.replace(/\./g, '') // Remover puntos para valor entero
    emit('update:modelValue', cleanValue)

    // Validar
    const isValid = validateValue()
    emit('valid-change', isValid)
}

const handleFocus = () => {
    isFocused.value = true
    // Mostrar valor sin formato para edición
    if (numericValue.value) {
        displayValue.value = numericValue.value.toString()
    }
}

const handleBlur = () => {
    isFocused.value = false

    // Formatear valor para mostrar
    if (numericValue.value) {
        displayValue.value = formatDisplayValue(numericValue.value)
    }

    // Validar al salir del campo
    validateValue()
}

// Watchers
watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue !== displayValue.value) {
            const num = typeof newValue === 'string' ? parseFloat(newValue) : newValue
            if (!isNaN(num) && num > 0) {
                displayValue.value = isFocused.value ?
                    num.toString() :
                    formatDisplayValue(num)
            } else {
                displayValue.value = ''
            }
        }
    },
    { immediate: true }
)

// Limpiar error externo cuando se cambia el valor
watch(
    () => displayValue.value,
    () => {
        if (props.error) {
            // Notificar que el error externo debería limpiarse
            emit('valid-change', !hasError.value)
        }
    }
)
</script>

<style scoped>
.budget-input {
    position: relative;
}

.form-control:focus {
    border-color: #0d6efd;
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.input-group-text {
    background-color: #f8f9fa;
    border-color: #ced4da;
    color: #495057;
}

.is-invalid {
    border-color: #dc3545;
}

.is-invalid:focus {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.invalid-feedback {
    font-size: 0.875rem;
    color: #dc3545;
}

.form-text {
    font-size: 0.875rem;
    color: #6c757d;
}

.form-label {
    font-weight: 500;
    color: #495057;
    margin-bottom: 0.5rem;
}

/* Animación para el ícono de validación */
.text-success i {
    animation: checkmark 0.3s ease-in-out;
}

@keyframes checkmark {
    0% {
        opacity: 0;
        transform: scale(0.8);
    }

    100% {
        opacity: 1;
        transform: scale(1);
    }
}

/* Estados del input */
.form-control:disabled {
    background-color: #e9ecef;
    opacity: 1;
}

.form-control:read-only {
    background-color: #f8f9fa;
}

/* Responsive */
@media (max-width: 576px) {
    .input-group-text {
        padding: 0.375rem 0.5rem;
        font-size: 0.875rem;
    }
}
</style>