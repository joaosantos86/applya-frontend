import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'

import ResumePreview from '../ResumePreview.vue'
import { createInitialWorkspace } from '@/lib/resume/factory'
import type { Resume } from '@/lib/resume/types'

function makeResume(): Resume {
  return reactive(createInitialWorkspace().base)
}

describe('ResumePreview', () => {
  it('renders the resume data instead of fixed placeholder content', () => {
    const resume = makeResume()
    const wrapper = mount(ResumePreview, { props: { resume } })

    expect(wrapper.text()).toContain(resume.personal.fullName)
    expect(wrapper.text()).toContain(resume.personal.headline)
    expect(wrapper.text()).toContain(resume.experiences[0]?.company ?? '')
    expect(wrapper.text()).toContain(resume.education[0]?.institution ?? '')
    expect(wrapper.text()).toContain(resume.skills[0] ?? '')
    expect(wrapper.text()).toContain(resume.projects[0]?.name ?? '')
    expect(wrapper.text()).toContain(resume.languages[0]?.name ?? '')
  })

  it('updates when the resume data changes', async () => {
    const resume = makeResume()
    const wrapper = mount(ResumePreview, { props: { resume } })

    resume.personal.fullName = 'Marina Alves'
    resume.summary = 'Novo resumo profissional.'
    resume.skills.push('Kubernetes')
    await nextTick()

    expect(wrapper.text()).toContain('Marina Alves')
    expect(wrapper.text()).toContain('Novo resumo profissional.')
    expect(wrapper.text()).toContain('Kubernetes')
  })

  it('hides sections that have no items', () => {
    const resume = makeResume()
    resume.projects = []
    resume.languages = []

    const wrapper = mount(ResumePreview, { props: { resume } })

    expect(wrapper.text()).not.toContain('Projetos')
    expect(wrapper.text()).not.toContain('Idiomas')
  })
})
