<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { CircleCheck, LoaderCircle, TriangleAlert } from '@lucide/vue'

import AuthLayout from '@/components/auth/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormAlert from '@/components/ui/FormAlert.vue'
import { verifyEmail } from '@/lib/api/auth'
import { ApiError, getUserFacingMessage, rateLimitMessage } from '@/lib/api/client'
import { isValidEmail, normalizeEmailInput } from '@/lib/validation'

type Status = 'idle' | 'confirming' | 'success' | 'error'

const route = useRoute()
const router = useRouter()

// O link recebido contém o token; mantenha-o apenas em memória após abrir a página.
const token = ref(typeof route.query.token === 'string' ? route.query.token : null)
onMounted(() => {
  if ('token' in route.query) {
    const query = { ...route.query }
    delete query.token
    void router.replace({ query })
  }
})

const resendLocation = computed(() => {
  const email = typeof route.query.email === 'string' ? normalizeEmailInput(route.query.email) : ''
  return { name: 'check-email', query: isValidEmail(email) ? { email } : {} }
})

const status = ref<Status>('idle')
const errorMessage = ref<string | null>(null)

/**
 * Código do erro da API (null = erro transitório/desconhecido). Determina as
 * ações exibidas no estado de erro:
 * - expired_token/invalid_token → oferecer novo e-mail;
 * - token_used → e-mail já confirmado, ir ao login;
 * - rate_limited → aguardar.
 */
const errorCode = ref<string | null>(null)

const confirming = computed(() => status.value === 'confirming')

async function onConfirm() {
  if (!token.value || confirming.value) return

  status.value = 'confirming'
  errorMessage.value = null
  errorCode.value = null

  try {
    // Consumo explícito do token: nada é enviado sem a ação do usuário,
    // evitando consumo acidental por scanners de link.
    await verifyEmail(token.value)
    token.value = null
    status.value = 'success'
    // Remove o token da URL/histórico: não deve persistir após o uso.
    await router.replace({ query: {} })
  } catch (error) {
    status.value = 'error'
    if (error instanceof ApiError) {
      errorCode.value = error.code
      if (error.code === 'expired_token') {
        errorMessage.value =
          'Este link de confirmação expirou. Solicite um novo e-mail de confirmação.'
      } else if (error.code === 'token_used') {
        errorMessage.value = 'Este e-mail já foi confirmado. Você pode entrar na sua conta.'
      } else if (error.code === 'invalid_token') {
        errorMessage.value = 'Este link de confirmação é inválido.'
      } else if (error.code === 'rate_limited') {
        errorMessage.value = rateLimitMessage(error)
      } else {
        errorMessage.value = getUserFacingMessage(
          error,
          'Não foi possível confirmar seu e-mail. Tente novamente.',
        )
      }
    } else {
      errorMessage.value = getUserFacingMessage(
        error,
        'Não foi possível confirmar seu e-mail. Tente novamente.',
      )
    }
  }
}
</script>

<template>
  <AuthLayout
    title="Confirme seu e-mail"
    description="Confirme seu endereço de e-mail para ativar sua conta"
  >
    <!-- Confirmação concluída (precede os demais estados: após remover o
         token da URL, a view continua exibindo o sucesso) -->
    <div v-if="status === 'success'" class="space-y-5">
      <CircleCheck class="size-8 text-success" aria-hidden="true" />
      <p class="text-sm text-text-secondary">
        E-mail confirmado com sucesso. Sua conta está ativa e pronta para usar.
      </p>
      <RouterLink to="/login" class="block">
        <AppButton block>Ir para o login</AppButton>
      </RouterLink>
    </div>

    <!-- Token ausente -->
    <div v-else-if="!token" class="space-y-5">
      <TriangleAlert class="size-8 text-error" aria-hidden="true" />
      <p class="text-sm text-text-secondary">
        Link de confirmação inválido. Solicite um novo e-mail de confirmação ou entre na sua conta.
      </p>
      <div class="space-y-3">
        <RouterLink :to="resendLocation" class="block">
          <AppButton variant="outline" block>Solicitar novo e-mail</AppButton>
        </RouterLink>
        <RouterLink to="/login" class="block">
          <AppButton variant="ghost" block>Voltar ao login</AppButton>
        </RouterLink>
      </div>
    </div>

    <!-- Confirmação em andamento -->
    <div v-else-if="status === 'confirming'" class="space-y-4">
      <LoaderCircle
        class="size-8 animate-spin text-primary motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p class="text-sm text-text-secondary">Confirmando seu e-mail…</p>
    </div>

    <!-- Erro -->
    <div v-else-if="status === 'error'" class="space-y-5">
      <FormAlert
        variant="error"
        :message="errorMessage ?? 'Não foi possível confirmar seu e-mail.'"
      />
      <div class="flex flex-col gap-3">
        <AppButton v-if="errorCode === null" block @click="onConfirm">Tentar novamente</AppButton>
        <RouterLink v-if="errorCode === 'token_used'" to="/login" class="block">
          <AppButton block>Ir para o login</AppButton>
        </RouterLink>
        <RouterLink v-else :to="resendLocation" class="block">
          <AppButton variant="outline" block>Solicitar novo e-mail de confirmação</AppButton>
        </RouterLink>
      </div>
    </div>

    <!-- Ação explícita para consumir o token -->
    <div v-else class="space-y-5">
      <p class="text-sm text-text-secondary">
        Clique no botão abaixo para confirmar seu endereço de e-mail e ativar sua conta.
      </p>
      <AppButton block size="lg" :loading="confirming" @click="onConfirm">
        {{ confirming ? 'Confirmando…' : 'Confirmar meu e-mail' }}
      </AppButton>
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
