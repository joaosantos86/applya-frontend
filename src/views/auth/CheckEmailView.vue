<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Mail } from '@lucide/vue'

import AuthLayout from '@/components/auth/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import FormAlert from '@/components/ui/FormAlert.vue'
import { useResendCooldown } from '@/composables/useResendCooldown'
import { resendVerification } from '@/lib/api/auth'
import { ApiError, getUserFacingMessage, rateLimitMessage } from '@/lib/api/client'
import { isValidEmail, normalizeEmailInput, validateForgotPassword } from '@/lib/validation'

const route = useRoute()

const email = ref('')
const emailError = ref<string>()
watch(
  () => route.query.email,
  (value) => {
    email.value = typeof value === 'string' ? normalizeEmailInput(value) : ''
    emailError.value = undefined
  },
  { immediate: true },
)
const validEmail = computed(() => isValidEmail(normalizeEmailInput(email.value)))

/** true quando o envio automático falhou no cadastro (a conta foi criada). */
const emailNotSent = computed(() => route.query.sent === 'false')

const { remaining, canResend, start } = useResendCooldown(60)

const sending = ref(false)
const feedback = ref<{ variant: 'success' | 'error'; message: string } | null>(null)

function clearFeedback() {
  emailError.value = undefined
  feedback.value = null
}

async function onResend() {
  if (sending.value || !canResend.value) return
  emailError.value = validateForgotPassword(normalizeEmailInput(email.value)).email
  if (emailError.value) return

  sending.value = true
  feedback.value = null

  try {
    await resendVerification(normalizeEmailInput(email.value))
    feedback.value = {
      variant: 'success',
      message: 'E-mail de confirmação reenviado. Verifique sua caixa de entrada.',
    }
    start()
  } catch (error) {
    feedback.value = {
      variant: 'error',
      message:
        error instanceof ApiError && error.code === 'rate_limited'
          ? rateLimitMessage(error)
          : getUserFacingMessage(error, 'Não foi possível reenviar o e-mail. Tente novamente.'),
    }
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <AuthLayout
    title="Verifique seu e-mail"
    description="Confira sua caixa de entrada ou solicite um novo link de confirmação"
  >
    <div class="space-y-5">
      <div class="flex">
        <span
          class="flex size-10 items-center justify-center rounded-md border border-border bg-subtle"
        >
          <Mail class="size-5 text-text-secondary" aria-hidden="true" />
        </span>
      </div>

      <p class="text-sm text-text-secondary">
        <template v-if="validEmail">
          Confira a caixa de entrada de
          <span class="font-medium text-text-primary">{{ email }}</span
          >. Use o link de confirmação para ativar sua conta.
        </template>
        <template v-else>
          Informe o e-mail usado no cadastro para solicitar um novo link de confirmação.
        </template>
      </p>

      <p class="text-sm text-text-secondary">
        Não encontrou o e-mail? Verifique também a pasta de spam ou lixo eletrônico.
      </p>

      <FormAlert
        v-if="emailNotSent"
        variant="error"
        message="Não foi possível enviar o e-mail de confirmação automaticamente. Sua conta foi criada — use o botão abaixo para reenviar."
      />

      <FormAlert v-if="feedback" :variant="feedback.variant" :message="feedback.message" />

      <form class="space-y-4" novalidate @submit.prevent="onResend">
        <AppInput
          v-model="email"
          label="E-mail"
          type="email"
          autocomplete="email"
          maxlength="254"
          required
          :disabled="sending"
          :error="emailError"
          @input="clearFeedback"
          @blur="emailError = validateForgotPassword(normalizeEmailInput(email)).email"
        />
        <AppButton
          type="submit"
          class="mt-6"
          block
          size="lg"
          :loading="sending"
          :disabled="!canResend || !validEmail"
        >
          <template v-if="sending">Enviando…</template>
          <template v-else-if="!canResend">Reenviar em {{ remaining }}s</template>
          <template v-else>Reenviar e-mail</template>
        </AppButton>
      </form>

      <p class="text-sm text-text-secondary">
        <RouterLink
          :to="{ name: 'login' }"
          class="font-medium text-text-primary underline decoration-border-strong decoration-1 underline-offset-4 transition-colors duration-150 hover:decoration-text-primary motion-reduce:transition-none"
        >
          Voltar ao login
        </RouterLink>
      </p>
    </div>
  </AuthLayout>
</template>
