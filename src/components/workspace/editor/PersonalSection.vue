<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { User } from '@lucide/vue'

import AppInput from '@/components/ui/AppInput.vue'
import SectionCard from './SectionCard.vue'
import { validatePersonal } from '@/lib/resume/validation'
import { useResumesStore } from '@/stores/resumes'

const store = useResumesStore()
const { selectedResume: resume } = storeToRefs(store)

const errors = computed(() => validatePersonal(resume.value.personal))
</script>

<template>
  <SectionCard
    id="resume-section-personal"
    title="Dados pessoais"
    description="Como você quer ser apresentado no currículo."
    :icon="User"
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <AppInput
        v-model="resume.personal.fullName"
        label="Nome completo"
        autocomplete="name"
        placeholder="Seu nome"
        :error="errors.fullName"
        required
      />
      <AppInput
        v-model="resume.personal.headline"
        label="Título profissional"
        placeholder="Ex.: Desenvolvedor Full Stack"
      />
      <AppInput
        v-model="resume.personal.email"
        label="E-mail"
        type="email"
        autocomplete="email"
        placeholder="voce@exemplo.com"
        :error="errors.email"
      />
      <AppInput
        v-model="resume.personal.phone"
        label="Telefone"
        type="tel"
        autocomplete="tel"
        placeholder="(11) 99999-9999"
        :error="errors.phone"
      />
      <AppInput
        v-model="resume.personal.location"
        label="Cidade e estado"
        placeholder="São Paulo, SP"
      />
      <AppInput v-model="resume.personal.website" label="Site pessoal" placeholder="seusite.dev" />
      <AppInput
        v-model="resume.personal.linkedin"
        label="LinkedIn"
        placeholder="linkedin.com/in/seu-perfil"
      />
      <AppInput
        v-model="resume.personal.github"
        label="GitHub"
        placeholder="github.com/seu-usuario"
      />
    </div>
  </SectionCard>
</template>
