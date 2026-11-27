<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { CircleCheck, TriangleAlert } from '@lucide/vue'

import AuthLayout from '@/components/auth/AuthLayout.vue'
import PasswordRequirements from '@/components/auth/PasswordRequirements.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormAlert from '@/components/ui/FormAlert.vue'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import { resetPassword } from '@/lib/api/auth'
import { ApiError, getUserFacingMessage, rateLimitMessage } from '@/lib/api/client'
import { hasErrors, validateResetPassword } from '@/lib/validation'
import type { ResetPasswordFormErrors } from '@/lib/validation'

const route = useRoute()
const router = useRouter()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' && value.length > 0 ? value : null
})

const form = reactive({
  password: '',
  confirmPassword: '',
})

const errors = ref<ResetPasswordFormErrors>({})
const errorMessage = ref<string | null>(null)
const submitting = ref(false)

/**
 * Código do erro da API. Para erros de token (invalid/expired/used) o
 * formulário não faz sentido ser reenviado: exibe link para um novo token.
 */
const tokenError = ref<string | null>(null)

/** true quando a senha foi redefinida com sucesso. */
const done = ref(false)

type Field = keyof ResetPasswordFormErrors

function clearFieldError(field: Field) {
  errors.value[field] = undefined
  errorMessage.value = null
  tokenError.value = null
}

function validateField(field: Field) {
  const result = validateResetPassword(form.password, form.confirmPassword)
  errors.value[field] = result[field]
}

async function onSubmit() {
  if (!token.value) return

  errors.value = validateResetPassword(form.password, form.confirmPassword)
  errorMessage.value = null
  tokenError.value = null

  if (hasErrors(errors.value) || submitting.value) return

  submitting.value = true
  try {
    // A redefinição NÃO autentica o usuário: ele volta ao login em seguida.
    await resetPassword(token.value, form.password)
    done.value = true
    // Remove o token da URL/histórico: não deve persistir após o uso.
    await router.replace({ query: {} })
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === 'expired_token') {
        tokenError.value = 'expired_token'
        errorMessage.value =
          'Este link de redefinição expirou. Solicite um novo link de recuperação.'
      } else if (error.code === 'token_used') {
        tokenError.value = 'token_used'
        errorMessage.value = 'Este link já foi utilizado. Solicite um novo link de recuperação.'
      } else if (error.code === 'invalid_token') {
        tokenError.value = 'invalid_token'
        errorMessage.value = 'Este link de redefinição é inválido.'
      } else if (error.code === 'rate_limited') {
        errorMessage.value = rateLimitMessage(error)
      } else {
        errorMessage.value = getUserFacingMessage(
          error,
          'Não foi possível redefinir sua senha. Tente novamente.',
        )
      }
    } else {
      errorMessage.value = getUserFacingMessage(
        error,
        'Não foi possível redefinir sua senha. Tente novamente.',
      )
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Redefinir senha" description="Escolha uma nova senha para acessar sua conta">
    <!-- Redefinição concluída (precede os demais estados: após remover o
         token da URL, a view continua exibindo o sucesso) -->
    <div v-if="done" class="space-y-5">
      <CircleCheck class="size-8 text-success" aria-hidden="true" />
      <p class="text-sm text-text-secondary">
        Senha redefinida com sucesso. Entre com sua nova senha.
      </p>
      <RouterLink to="/login" class="block">
        <AppButton block>Ir para o login</AppButton>
      </RouterLink>
    </div>

    <!-- Token ausente -->
    <div v-else-if="!token" class="space-y-5">
      <TriangleAlert class="size-8 text-error" aria-hidden="true" />
      <p class="text-sm text-text-secondary">
        Link de redefinição inválido. Solicite um novo link de recuperação de senha.
      </p>
      <div class="space-y-3">
        <RouterLink to="/forgot-password" class="block">
          <AppButton variant="outline" block>Solicitar novo link</AppButton>
        </RouterLink>
        <RouterLink to="/login" class="block">
          <AppButton variant="ghost" block>Voltar ao login</AppButton>
        </RouterLink>
      </div>
    </div>

    <!-- Formulário -->
    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
      <FormAlert v-if="errorMessage" variant="error" :message="errorMessage" />

      <p v-if="tokenError" class="text-sm text-text-secondary">
        <RouterLink
          :to="{ name: 'forgot-password' }"
          class="font-medium text-text-primary underline decoration-border-strong decoration-1 underline-offset-4 transition-colors duration-150 hover:decoration-text-primary motion-reduce:transition-none"
        >
          Solicitar novo link
        </RouterLink>
      </p>

      <div class="space-y-2">
        <PasswordInput
          v-model="form.password"
          label="Nova senha"
          autocomplete="new-password"
          placeholder="Crie uma nova senha"
          maxlength="256"
          :error="errors.password"
          :disabled="submitting"
          required
          @input="clearFieldError('password')"
          @blur="validateField('password')"
        />
        <PasswordRequirements :password="form.password" />
      </div>

      <PasswordInput
        v-model="form.confirmPassword"
        label="Confirmar nova senha"
        autocomplete="new-password"
        placeholder="Repita a nova senha"
        maxlength="256"
        :error="errors.confirmPassword"
        :disabled="submitting"
        required
        @input="clearFieldError('confirmPassword')"
        @blur="validateField('confirmPassword')"
      />

      <AppButton type="submit" size="lg" block class="mt-6" :loading="submitting">
        {{ submitting ? 'Redefinindo…' : 'Redefinir senha' }}
      </AppButton>

      <p class="text-sm text-text-secondary">
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
