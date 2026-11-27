<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Mail } from '@lucide/vue'

import AuthLayout from '@/components/auth/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import FormAlert from '@/components/ui/FormAlert.vue'
import { forgotPassword } from '@/lib/api/auth'
import { ApiError, NetworkError, rateLimitMessage } from '@/lib/api/client'
import { hasErrors, normalizeEmailInput, validateForgotPassword } from '@/lib/validation'

const form = reactive({ email: '' })

const errors = reactive<{ email?: string }>({})
const sending = ref(false)

/** true quando a resposta genérica de confirmação foi exibida. */
const sent = ref(false)
const errorMessage = ref<string | null>(null)

function clearFieldError() {
  errors.email = undefined
  errorMessage.value = null
}

function validateField() {
  errors.email = validateForgotPassword(form.email).email
}

async function onSubmit() {
  errors.email = validateForgotPassword(normalizeEmailInput(form.email)).email
  errorMessage.value = null

  if (hasErrors(errors) || sending.value) return

  sending.value = true
  try {
    await forgotPassword(normalizeEmailInput(form.email))
    // Resposta sempre genérica: não revela se o e-mail está cadastrado.
    sent.value = true
  } catch (error) {
    // Não exibe mensagens HTTP que possam revelar a existência de uma conta.
    if (error instanceof ApiError && error.code === 'rate_limited') {
      errorMessage.value = rateLimitMessage(error)
    } else if (error instanceof NetworkError) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Não foi possível enviar o link. Tente novamente.'
    }
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <AuthLayout
    title="Esqueceu sua senha?"
    description="Informe seu e-mail e enviaremos um link para redefinir sua senha"
  >
    <div v-if="sent" class="space-y-5">
      <FormAlert
        variant="success"
        message="Se existir uma conta associada a este e-mail, enviaremos um link para redefinir sua senha. Verifique também a pasta de spam."
      />
      <p class="text-sm text-text-secondary">
        <RouterLink
          :to="{ name: 'login' }"
          class="font-medium text-text-primary underline decoration-border-strong decoration-1 underline-offset-4 transition-colors duration-150 hover:decoration-text-primary motion-reduce:transition-none"
        >
          Voltar ao login
        </RouterLink>
      </p>
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
      <FormAlert v-if="errorMessage" variant="error" :message="errorMessage" />

      <AppInput
        v-model="form.email"
        label="E-mail"
        type="email"
        autocomplete="email"
        placeholder="voce@exemplo.com"
        maxlength="254"
        :error="errors.email"
        :disabled="sending"
        required
        @input="clearFieldError"
        @blur="validateField"
      >
        <template #leading>
          <Mail class="size-4" aria-hidden="true" />
        </template>
      </AppInput>

      <AppButton type="submit" size="lg" block class="mt-6" :loading="sending">
        {{ sending ? 'Enviando…' : 'Enviar link de recuperação' }}
      </AppButton>

      <p class="text-sm text-text-secondary">
        Lembrou sua senha?
        <RouterLink
          :to="{ name: 'login' }"
          class="font-medium text-text-primary underline decoration-border-strong decoration-1 underline-offset-4 transition-colors duration-150 hover:decoration-text-primary motion-reduce:transition-none"
        >
          Voltar ao login
        </RouterLink>
      </p>
    </form>
  </AuthLayout>
</template>
