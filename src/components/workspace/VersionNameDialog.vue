<script setup lang="ts">
import { ref, watch } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    mode: 'create' | 'rename'
    initialName?: string
    /** Requisição em andamento: desabilita o envio. */
    submitting?: boolean
  }>(),
  {
    initialName: '',
    submitting: false,
  },
)

const emit = defineEmits<{
  close: []
  submit: [name: string]
}>()

const name = ref('')
const error = ref<string | undefined>()

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.initialName
    error.value = undefined
  },
)

function onSubmit() {
  const trimmed = name.value.trim()

  if (!trimmed) {
    error.value = 'Informe um nome para a versão.'
    return
  }

  if (trimmed.length > 60) {
    error.value = 'Use no máximo 60 caracteres.'
    return
  }

  error.value = undefined
  emit('submit', trimmed)
}
</script>

<template>
  <AppModal
    :open="open"
    :title="mode === 'create' ? 'Nova versão' : 'Renomear versão'"
    :description="
      mode === 'create'
        ? 'A versão começa com uma cópia do currículo-base salvo e fica independente.'
        : 'O novo nome aparece na sidebar e no topo do editor.'
    "
    close-label="Fechar diálogo"
    @close="emit('close')"
  >
    <form class="space-y-5" novalidate @submit.prevent="onSubmit">
      <AppInput
        v-model="name"
        label="Nome da versão"
        placeholder="Ex.: Backend Go"
        :error="error"
        maxlength="60"
        required
      />

      <div class="flex justify-end gap-2">
        <AppButton variant="ghost" @click="emit('close')">Cancelar</AppButton>
        <AppButton type="submit" :loading="submitting">
          {{ mode === 'create' ? 'Criar versão' : 'Salvar nome' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
