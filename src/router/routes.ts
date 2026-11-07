import type { RouteRecordRaw } from 'vue-router'

/**
 * Rotas da aplicação.
 *
 * Convenções:
 * - `requiresAuth`: só para usuários autenticados (guard redireciona ao login);
 * - `guestOnly`: páginas de login/cadastro, bloqueadas para quem já está
 *   autenticado (guard redireciona ao painel);
 * - `title`: título do documento (`Documento · Applya`).
 *
 * A proteção aqui é apenas UX de navegação; a autorização real é do backend.
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: 'dashboard' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Painel' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guestOnly: true, title: 'Entrar' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guestOnly: true, title: 'Criar conta' },
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: () => import('@/views/auth/VerifyEmailView.vue'),
    meta: { title: 'Confirmar e-mail' },
  },
  {
    path: '/check-email',
    name: 'check-email',
    component: () => import('@/views/auth/CheckEmailView.vue'),
    meta: { title: 'Verifique seu e-mail' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { title: 'Recuperar senha' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { title: 'Redefinir senha' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'dashboard' },
  },
]
