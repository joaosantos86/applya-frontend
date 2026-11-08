/**
 * Dados fictícios do workspace.
 *
 * Nenhum dado aqui pertence a uma pessoa real. O currículo-base é a fonte
 * usada ao criar novas versões; `versionSeeds` apenas descreve como as três
 * versões de demonstração diferem dele.
 */
import { BASE_RESUME_ID } from './id'
import type { Resume } from './types'

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

export const baseResume: Resume = {
  id: BASE_RESUME_ID,
  name: 'Currículo-base',
  kind: 'base',
  baseId: null,
  createdAt: daysAgo(180),
  updatedAt: daysAgo(1),
  personal: {
    fullName: 'Lucas Ferreira',
    headline: 'Desenvolvedor Full Stack',
    email: 'lucas.ferreira@exemplo.com',
    phone: '(11) 98765-4321',
    location: 'São Paulo, SP',
    linkedin: 'linkedin.com/in/lucasferreira',
    github: 'github.com/lucasferreira',
    website: 'lucasferreira.dev',
  },
  summary:
    'Desenvolvedor Full Stack com 6 anos de experiência construindo produtos web de ponta a ponta. Gosto de transformar problemas complexos em interfaces simples, APIs bem modeladas e código sustentável. Tenho forte atuação em TypeScript, Go e PostgreSQL, além de experiência com times que trabalham em ciclos curtos de entrega.',
  experiences: [
    {
      id: 'exp-nimbus',
      company: 'Nimbus Labs',
      role: 'Desenvolvedor Full Stack',
      location: 'São Paulo, SP',
      startDate: '2022-04',
      endDate: '',
      current: true,
      description:
        'Liderança técnica da área de onboarding, atendendo mais de 40 mil usuários por mês.\nModelagem de uma API em Go e PostgreSQL que reduziu o tempo médio de resposta em 38%.\nImplantação de testes automatizados no pipeline, diminuindo regressões em produção.',
    },
    {
      id: 'exp-aurora',
      company: 'Aurora Digital',
      role: 'Desenvolvedor Backend',
      location: 'Remoto',
      startDate: '2020-02',
      endDate: '2022-03',
      current: false,
      description:
        'Construção de serviços REST responsáveis pela integração com parceiros financeiros.\nOtimização de consultas e cache com Redis, reduzindo custos de infraestrutura.\nParticipação ativa em revisões de arquitetura e mentoria de pessoas desenvolvedoras júnior.',
    },
    {
      id: 'exp-pixel',
      company: 'Studio Pixel',
      role: 'Desenvolvedor Frontend Júnior',
      location: 'São Paulo, SP',
      startDate: '2018-08',
      endDate: '2020-01',
      current: false,
      description:
        'Desenvolvimento de interfaces responsivas em Vue.js para clientes de varejo.\nCriação de uma biblioteca interna de componentes acessíveis.\nColaboração com design para padronizar a linguagem visual dos produtos.',
    },
  ],
  education: [
    {
      id: 'edu-usp',
      institution: 'Universidade de São Paulo',
      course: 'Sistemas de Informação',
      degree: 'Bacharelado',
      period: '2015 — 2019',
      description:
        'Trabalho de conclusão sobre acessibilidade em aplicações web e monitoria em Algoritmos.',
    },
    {
      id: 'edu-etec',
      institution: 'ETEC Professor Basílio de Oliveira',
      course: 'Técnico em Informática',
      degree: 'Técnico',
      period: '2013 — 2014',
      description: '',
    },
  ],
  skills: [
    'TypeScript',
    'Go',
    'Vue.js',
    'Node.js',
    'PostgreSQL',
    'Docker',
    'AWS',
    'REST APIs',
    'Testes automatizados',
    'Git',
  ],
  projects: [
    {
      id: 'proj-fintrack',
      name: 'FinTrack',
      description:
        'Aplicativo de controle financeiro pessoal com importação de extratos e relatórios mensais.',
      technologies: ['Vue 3', 'TypeScript', 'Go', 'PostgreSQL'],
      url: 'https://fintrack.exemplo.com',
      repository: 'https://github.com/lucasferreira/fintrack',
    },
    {
      id: 'proj-opennotes',
      name: 'OpenNotes',
      description:
        'Editor de notas em Markdown com sincronização offline e busca instantânea no navegador.',
      technologies: ['Vue 3', 'IndexedDB', 'Vite'],
      url: 'https://opennotes.exemplo.com',
      repository: 'https://github.com/lucasferreira/opennotes',
    },
    {
      id: 'proj-devroast',
      name: 'DevRoast',
      description:
        'Ferramenta colaborativa para revisão de código com cards de feedback e métricas de time.',
      technologies: ['Go', 'React', 'Redis', 'Docker'],
      url: '',
      repository: 'https://github.com/lucasferreira/devroast',
    },
  ],
  languages: [
    { id: 'lang-pt', name: 'Português', proficiency: 'Nativo' },
    { id: 'lang-en', name: 'Inglês', proficiency: 'Fluente' },
    { id: 'lang-es', name: 'Espanhol', proficiency: 'Intermediário' },
  ],
}

/** Diferenças entre uma versão de demonstração e o currículo-base. */
export interface VersionSeed {
  id: string
  name: string
  updatedDaysAgo: number
  headline: string
  summary: string
  skills: string[]
}

export const versionSeeds: VersionSeed[] = [
  {
    id: 'version-backend-go',
    name: 'Backend Go',
    updatedDaysAgo: 3,
    headline: 'Desenvolvedor Backend & Go',
    summary:
      'Desenvolvedor Backend especializado em Go, com experiência na construção de APIs de alta disponibilidade e integrações com serviços financeiros. Gosto de sistemas simples de operar, bem testados e observáveis.',
    skills: [
      'Go',
      'PostgreSQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'AWS',
      'gRPC',
      'REST APIs',
      'Testes automatizados',
      'Observabilidade',
    ],
  },
  {
    id: 'version-full-stack',
    name: 'Full Stack Developer',
    updatedDaysAgo: 6,
    headline: 'Desenvolvedor Full Stack',
    summary:
      'Profissional Full Stack com experiência em produtos digitais de ponta a ponta, do desenho da API à interface. Trabalho bem em times multidisciplinares e tenho familiaridade com todo o ciclo de entrega.',
    skills: [
      'TypeScript',
      'Vue.js',
      'Go',
      'Node.js',
      'PostgreSQL',
      'Docker',
      'AWS',
      'REST APIs',
      'Git',
      'CI/CD',
    ],
  },
  {
    id: 'version-frontend-vue',
    name: 'Frontend Vue',
    updatedDaysAgo: 14,
    headline: 'Desenvolvedor Frontend Vue',
    summary:
      'Desenvolvedor Frontend focado em Vue.js, acessibilidade e design systems. Gosto de criar interfaces rápidas, consistentes e fáceis de manter, trabalhando próxima à pessoa responsável pelo design.',
    skills: [
      'Vue.js',
      'TypeScript',
      'Pinia',
      'Vite',
      'Tailwind CSS',
      'Vitest',
      'Acessibilidade',
      'Design Systems',
    ],
  },
]
