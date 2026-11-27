<script setup lang="ts">
import { reactive, ref } from 'vue'
import { LockKeyhole, Mail } from '@lucide/vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'

import AuthLayout from '@/components/auth/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import FormAlert from '@/components/ui/FormAlert.vue'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import { useResendCooldown } from '@/composables/useResendCooldown'
import { resendVerification } from '@/lib/api/auth'
import { ApiError, getUserFacingMessage, rateLimitMessage } from '@/lib/api/client'
import { isInternalPath } from '@/lib/redirect'
import { hasErrors, normalizeEmailInput, validateLogin } from '@/lib/validation'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive<{ email?: string; password?: string }>({})
const serverError = ref<string | null>(null)

/** E-mail autenticado mas ainda não confirmado (403 email_not_verified). */
const unverifiedEmail = ref<string | null>(null)
const resending = ref(false)
const resendFeedback = ref<{ variant: 'success' | 'error'; message: string } | null>(null)
const { remaining, canResend, start } = useResendCooldown(60)

function clearFieldError(field: 'email' | 'password') {
  errors[field] = undefined
  serverError.value = null
}

function validateField(field: 'email' | 'password') {
  const result = validateLogin(form.email, form.password)
  errors[field] = result[field]
}

async function onResendVerification() {
  if (!unverifiedEmail.value || resending.value || !canResend.value) return

  resending.value = true
  resendFeedback.value = null

  try {
    await resendVerification(unverifiedEmail.value)
    resendFeedback.value = {
      variant: 'success',
      message: 'E-mail de confirmação reenviado. Verifique sua caixa de entrada.',
    }
    start()
  } catch (error) {
    resendFeedback.value = {
      variant: 'error',
      message:
        error instanceof ApiError && error.code === 'rate_limited'
          ? rateLimitMessage(error)
          : getUserFacingMessage(error, 'Não foi possível reenviar o e-mail. Tente novamente.'),
    }
  } finally {
    resending.value = false
  }
}

async function onSubmit() {
  // Previne envios duplicados enquanto uma tentativa está em andamento.
  if (auth.loading) return

  Object.assign(errors, validateLogin(form.email, form.password))
  serverError.value = null
  unverifiedEmail.value = null
  resendFeedback.value = null

  if (hasErrors(errors)) return

  try {
    await auth.login({ email: normalizeEmailInput(form.email), password: form.password })

    const redirect = route.query.redirect
    await router.push(isInternalPath(redirect) ? redirect : { name: 'workspace' })
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === 'invalid_credentials' || error.status === 401) {
        serverError.value = 'E-mail ou senha incorretos.'
      } else if (error.code === 'email_not_verified') {
        unverifiedEmail.value = normalizeEmailInput(form.email)
      } else if (error.code === 'rate_limited') {
        serverError.value = rateLimitMessage(error)
      } else {
        serverError.value = getUserFacingMessage(error, 'Não foi possível entrar. Tente novamente.')
      }
    } else {
      serverError.value = getUserFacingMessage(error, 'Não foi possível entrar. Tente novamente.')
    }
  }
}
</script>

<template>
  <AuthLayout title="Entrar no Applya" description="Acesse seu currículo-base e suas versões">
    <form class="space-y-3" novalidate @submit.prevent="onSubmit">
      <FormAlert v-if="serverError" variant="error" :message="serverError" />

      <div v-if="unverifiedEmail" class="space-y-3">
        <FormAlert
          variant="error"
          message="Seu e-mail ainda não foi confirmado. Reenvie o link de confirmação para ativar sua conta."
        />
        <FormAlert
          v-if="resendFeedback"
          :variant="resendFeedback.variant"
          :message="resendFeedback.message"
        />
        <AppButton
          type="button"
          variant="outline"
          block
          :loading="resending"
          :disabled="!canResend"
          @click="onResendVerification"
        >
          <template v-if="resending">Enviando…</template>
          <template v-else-if="!canResend">Reenviar em {{ remaining }}s</template>
          <template v-else>Reenviar e-mail de confirmação</template>
        </AppButton>
      </div>

      <AppInput
        v-model="form.email"
        label="E-mail"
        hide-label
        type="email"
        autocomplete="email"
        placeholder="E-mail"
        maxlength="254"
        :error="errors.email"
        :disabled="auth.loading"
        required
        @input="clearFieldError('email')"
        @blur="validateField('email')"
      >
        <template #leading>
          <Mail class="size-4" aria-hidden="true" />
        </template>
      </AppInput>

      <PasswordInput
        v-model="form.password"
        label="Senha"
        hide-label
        autocomplete="current-password"
        placeholder="Senha"
        maxlength="256"
        :error="errors.password"
        :disabled="auth.loading"
        required
        @input="clearFieldError('password')"
        @blur="validateField('password')"
      >
        <template #leading>
          <LockKeyhole class="size-4" aria-hidden="true" />
        </template>
      </PasswordInput>

      <div class="flex justify-end">
        <RouterLink
          :to="{ name: 'forgot-password' }"
          class="text-xs text-text-secondary transition-colors duration-150 hover:text-text-primary motion-reduce:transition-none"
        >
          Esqueceu sua senha?
        </RouterLink>
      </div>

      <AppButton type="submit" size="lg" block class="mt-2" :loading="auth.loading">
        {{ auth.loading ? 'Entrando…' : 'Entrar' }}
      </AppButton>
    </form>

    <template #footer>
      Não tem uma conta?
      <RouterLink
        :to="{ name: 'register' }"
        class="font-medium text-text-primary underline decoration-border-strong decoration-1 underline-offset-4 transition-colors duration-150 hover:decoration-text-primary motion-reduce:transition-none"
      >
        Criar conta
      </RouterLink>
    </template>
  </AuthLayout>
</template>
