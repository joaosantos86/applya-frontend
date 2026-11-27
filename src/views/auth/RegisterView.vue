<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { LockKeyhole, Mail, User } from '@lucide/vue'

import AuthLayout from '@/components/auth/AuthLayout.vue'
import PasswordRequirements from '@/components/auth/PasswordRequirements.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import FormAlert from '@/components/ui/FormAlert.vue'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import { register } from '@/lib/api/auth'
import { ApiError, getUserFacingMessage, rateLimitMessage } from '@/lib/api/client'
import { hasErrors, normalizeEmailInput, validateRegister } from '@/lib/validation'
import type { RegisterFormErrors } from '@/lib/validation'

const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = ref<RegisterFormErrors>({})
const serverError = ref<string | null>(null)
const submitting = ref(false)

/** E-mail já cadastrado (409 email_already_registered). */
const emailTaken = ref(false)

type Field = keyof RegisterFormErrors

function clearFieldError(field: Field) {
  errors.value[field] = undefined
  serverError.value = null
  emailTaken.value = false
}

function validateField(field: Field) {
  const result = validateRegister(form.name, form.email, form.password, form.confirmPassword)
  errors.value[field] = result[field]
}

async function onSubmit() {
  errors.value = validateRegister(form.name, form.email, form.password, form.confirmPassword)
  serverError.value = null
  emailTaken.value = false

  if (hasErrors(errors.value) || submitting.value) return

  submitting.value = true
  try {
    const email = normalizeEmailInput(form.email)

    // O cadastro NÃO autentica o usuário: o e-mail precisa ser confirmado
    // antes do primeiro login.
    const result = await register({ name: form.name.trim(), email, password: form.password })

    await router.push({
      name: 'check-email',
      query: {
        email,
        // Avisa a tela seguinte quando o envio automático falhou (a conta
        // foi criada mesmo assim; o usuário pode reenviar).
        ...(result.verification_email_sent ? {} : { sent: 'false' }),
      },
    })
  } catch (error) {
    if (error instanceof ApiError && error.code === 'email_already_registered') {
      emailTaken.value = true
    } else if (error instanceof ApiError && error.code === 'rate_limited') {
      serverError.value = rateLimitMessage(error)
    } else {
      serverError.value = getUserFacingMessage(
        error,
        'Não foi possível criar sua conta. Tente novamente.',
      )
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout
    title="Crie sua conta"
    description="Um currículo-base para começar, versões para cada vaga depois"
  >
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <FormAlert v-if="serverError" variant="error" :message="serverError" />

      <div v-if="emailTaken" class="space-y-3">
        <FormAlert variant="error" message="Este e-mail já está cadastrado." />
        <p class="text-sm text-text-secondary">
          <RouterLink
            :to="{ name: 'login' }"
            class="font-medium text-text-primary underline decoration-border-strong decoration-1 underline-offset-4 transition-colors duration-150 hover:decoration-text-primary motion-reduce:transition-none"
          >
            Entrar
          </RouterLink>
          ou
          <RouterLink
            :to="{ name: 'forgot-password' }"
            class="font-medium text-text-primary underline decoration-border-strong decoration-1 underline-offset-4 transition-colors duration-150 hover:decoration-text-primary motion-reduce:transition-none"
          >
            recuperar a senha
          </RouterLink>
        </p>
      </div>

      <AppInput
        v-model="form.name"
        label="Nome completo"
        autocomplete="name"
        placeholder="Seu nome"
        maxlength="100"
        :error="errors.name"
        :disabled="submitting"
        required
        @input="clearFieldError('name')"
        @blur="validateField('name')"
      >
        <template #leading>
          <User class="size-4" aria-hidden="true" />
        </template>
      </AppInput>

      <AppInput
        v-model="form.email"
        label="E-mail"
        type="email"
        autocomplete="email"
        placeholder="voce@exemplo.com"
        maxlength="254"
        :error="errors.email"
        :disabled="submitting"
        required
        @input="clearFieldError('email')"
        @blur="validateField('email')"
      >
        <template #leading>
          <Mail class="size-4" aria-hidden="true" />
        </template>
      </AppInput>

      <div class="space-y-2">
        <PasswordInput
          v-model="form.password"
          label="Senha"
          autocomplete="new-password"
          placeholder="Crie uma senha"
          maxlength="256"
          :error="errors.password"
          :disabled="submitting"
          required
          @input="clearFieldError('password')"
          @blur="validateField('password')"
        >
          <template #leading>
            <LockKeyhole class="size-4" aria-hidden="true" />
          </template>
        </PasswordInput>
        <PasswordRequirements :password="form.password" />
      </div>

      <PasswordInput
        v-model="form.confirmPassword"
        label="Confirmar senha"
        autocomplete="new-password"
        placeholder="Repita a senha"
        maxlength="256"
        :error="errors.confirmPassword"
        :disabled="submitting"
        required
        @input="clearFieldError('confirmPassword')"
        @blur="validateField('confirmPassword')"
      >
        <template #leading>
          <LockKeyhole class="size-4" aria-hidden="true" />
        </template>
      </PasswordInput>

      <AppButton type="submit" size="lg" block class="mt-6" :loading="submitting">
        {{ submitting ? 'Criando conta…' : 'Criar conta' }}
      </AppButton>
    </form>

    <template #footer>
      Já tem uma conta?
      <RouterLink
        :to="{ name: 'login' }"
        class="font-medium text-text-primary underline decoration-border-strong decoration-1 underline-offset-4 transition-colors duration-150 hover:decoration-text-primary motion-reduce:transition-none"
      >
        Entrar
      </RouterLink>
    </template>
  </AuthLayout>
</template>
