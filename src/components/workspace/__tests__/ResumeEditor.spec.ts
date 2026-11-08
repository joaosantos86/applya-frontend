import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ResumeEditor from '../ResumeEditor.vue'
import { useResumesStore } from '@/stores/resumes'

describe('ResumeEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes field edits into the selected resume and starts saving', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useResumesStore()

    const wrapper = mount(ResumeEditor, { global: { plugins: [pinia] } })
    await wrapper.get('input[autocomplete="name"]').setValue('Marina Alves')

    expect(store.selectedResume.personal.fullName).toBe('Marina Alves')
    expect(store.saveStatus).toBe('saving')
  })

  it('adds and removes experience cards', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useResumesStore()
    const initialCount = store.selectedResume.experiences.length

    const wrapper = mount(ResumeEditor, { global: { plugins: [pinia] } })

    const addButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Adicionar experiência'))
    expect(addButton).toBeDefined()
    await addButton?.trigger('click')

    expect(store.selectedResume.experiences.length).toBe(initialCount + 1)

    await wrapper.get('button[aria-label^="Remover experiência"]').trigger('click')

    expect(store.selectedResume.experiences.length).toBe(initialCount)
  })
})
