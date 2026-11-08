import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent } from 'vue'

import WorkspaceView from '../WorkspaceView.vue'
import { useAuthStore } from '@/stores/auth'

const EmptyView = defineComponent({ template: '<div />' })

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/workspace', name: 'workspace', component: EmptyView },
      { path: '/login', name: 'login', component: EmptyView },
    ],
  })
}

describe('WorkspaceView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders the sidebar, editor, and live preview for the base resume', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const auth = useAuthStore()
    auth.user = {
      id: 'user-1',
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      email_verified: true,
    }

    const router = createTestRouter()
    await router.push('/workspace')
    await router.isReady()

    const wrapper = mount(WorkspaceView, { global: { plugins: [pinia, router] } })

    expect(wrapper.text()).toContain('Currículo-base')
    expect(wrapper.text()).toContain('Backend Go')
    expect(wrapper.text()).toContain('Full Stack Developer')
    expect(wrapper.text()).toContain('Frontend Vue')
    expect(wrapper.text()).toContain('Lucas Ferreira')
    expect(wrapper.text()).toContain('Pré-visualização')
    expect(wrapper.text()).toContain('Ana Souza')
  })
})
