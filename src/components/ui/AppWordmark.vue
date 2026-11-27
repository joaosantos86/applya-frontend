<script setup lang="ts">
withDefaults(defineProps<{ size?: 'md' | 'lg' }>(), { size: 'md' })
</script>

<template>
  <!-- O ponto pêssego é a assinatura do Applya: reaparece como marcador do
       item ativo (versão selecionada, seção atual) e em nenhum outro lugar. -->
  <span
    class="font-semibold tracking-tight text-text-primary"
    :class="size === 'lg' ? 'text-2xl' : 'text-lg'"
  >
    applya<span class="text-accent">.</span>
  </span>
</template>
