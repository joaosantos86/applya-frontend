# Applya — Frontend

Frontend do **Applya**, aplicação pessoal para criar, editar, personalizar e
gerenciar versões de currículo adaptadas a diferentes oportunidades de emprego.

Este repositório implementa a **autenticação completa** (login, cadastro,
confirmação de e-mail, recuperação e redefinição de senha) com a identidade
visual **Warm Peach**, integrada ao backend Go ([`applya-backend`](https://github.com/joaosantos86/applya-backend)).

## Stack

| Tecnologia | Uso |
|---|---|
| [Vue 3](https://vuejs.org) | Interface (Composition API + `<script setup>`) |
| [TypeScript](https://www.typescriptlang.org) | Tipagem estática |
| [Vite](https://vite.dev) | Build e dev server |
| [Vue Router](https://router.vuejs.org) | Rotas e guards de proteção |
| [Pinia](https://pinia.vuejs.org) | Estado global (sessão) |
| [Tailwind CSS v4](https://tailwindcss.com) | Estilização com design tokens |
| [Lucide](https://lucide.dev) (`@lucide/vue`) | Ícones |
| [Vitest](https://vitest.dev) + [@vue/test-utils](https://test-utils.vuejs.org) + happy-dom | Testes unitários |

## Como executar

```sh
npm install
cp .env.example .env         # ajuste a VITE_API_URL se necessário
npm run dev                  # http://localhost:5173
```

O Vite usa `localhost:5173` com porta fixa para respeitar a origem permitida
pelo CORS do backend. Se a porta estiver ocupada, reutilize o servidor existente
ou encerre-o antes de iniciar outro. Abra o frontend por `localhost`, não por
`127.0.0.1`, para manter o mesmo hostname dos cookies da API.
Reinicie o Vite após alterar `.env`.

Para verificar a API local: `curl http://localhost:8080/health` deve retornar
`{"status":"ok"}`. O backend não lê os arquivos de ambiente deste frontend.

### Build de produção

```sh
npm run build      # type-check + vite build
npm run preview    # serve o build de dist/
```

### Testes

A suíte de testes foi removida. A configuração do Vitest foi mantida para uso
futuro; atualmente `npm test` encerra com erro por não encontrar arquivos de teste.

```sh
npm test           # vitest run (uma execução)
npm run test:watch # modo watch
```

### Lint e formatação

```sh
npm run lint     # oxlint + eslint (com --fix)
npm run format   # prettier
npm run type-check
```

## Variáveis de ambiente

| Variável | Obrigatória | Padrão (fallback em código) | Descrição |
|---|---|---|---|
| `VITE_API_URL` | não | `http://localhost:8080` | URL base da API (backend Go), sem barra final |

**Desenvolvimento local:** o repositório já vem com `.env.example`; copie-o
para `.env` (ignorado pelo Git) e ajuste o valor:

```sh
cp .env.example .env   # Windows: copy .env.example .env
```

**Produção (Render):** defina `VITE_API_URL` no painel do serviço
(*Environment → Environment Variables*) com a URL pública do backend
(ex.: `https://applya-api.onrender.com`) e reimplante. Em produção, se a
variável estiver ausente, o app exibe um aviso no console — configure antes
de publicar.

> Não coloque credenciais privadas em variáveis `VITE_*`: tudo o que começa com
> `VITE_` é embutido no bundle enviado ao navegador. Segredos (banco, sessão,
> e-mail) pertencem exclusivamente ao backend.

## Rotas

### Públicas (acesso livre)

| Rota | Página | Observações |
|---|---|---|
| `/login` | Entrar | Bloqueada para usuários já autenticados (redireciona ao painel) |
| `/register` | Criar conta | Idem; após cadastro vai para `/check-email` |
| `/verify-email` | Confirmação de e-mail | Recebe `?token=`; consome o token com ação explícita do usuário |
| `/check-email` | Verifique seu e-mail | Recebe `?email=`; botão de reenvio com cooldown de 60 s |
| `/forgot-password` | Recuperação de senha | Resposta sempre genérica (não revela se o e-mail existe) |
| `/reset-password` | Redefinir senha | Recebe `?token=`; não autentica após redefinir |

### Privadas (exigem autenticação)

| Rota | Página | Observações |
|---|---|---|
| `/dashboard` | Painel | Placeholder provisório com logout; currículos virão em etapas futuras |

`/` redireciona para `/dashboard` (que, para convidados, cai no login).
Qualquer rota inexistente também redireciona ao painel.

## Estrutura de diretórios

```text
src/
├── assets/
│   └── main.css                  # Tailwind v4 + design tokens Warm Peach
├── components/
│   ├── auth/
│   │   ├── AuthLayout.vue        # layout compartilhado das páginas de auth
│   │   └── PasswordRequirements.vue
│   └── ui/
│       ├── AppButton.vue         # botão (variants, loading, disabled)
│       ├── AppInput.vue          # campo com label, erro e hint
│       ├── PasswordInput.vue     # campo de senha com mostrar/ocultar
│       └── FormAlert.vue         # feedback de sucesso/erro (role alert/status)
├── composables/
│   └── useResendCooldown.ts      # intervalo mínimo entre reenvios
├── lib/
│   ├── api/
│   │   ├── client.ts             # cliente HTTP centralizado (único ponto de fetch)
│   │   └── auth.ts               # endpoints de autenticação + tipos
│   ├── redirect.ts               # validação de redirect interno (anti open redirect)
│   └── validation.ts             # validações puras e reutilizáveis
├── router/
│   ├── index.ts                  # criação do router
│   ├── routes.ts                 # tabela de rotas
│   └── guards.ts                 # guards de autenticação + meta tipadas
├── stores/
│   └── auth.ts                   # estado de sessão (Pinia)
├── views/
│   ├── DashboardView.vue
│   └── auth/                     # LoginView, RegisterView, VerifyEmailView,
│                                 # CheckEmailView, ForgotPasswordView, ResetPasswordView
├── App.vue
└── main.ts
```

Os testes ficam em `src/**/__tests__/*.spec.ts`, ao lado do código que testam.

## Como funciona a autenticação

1. **Sessão por cookie HTTP-only** — o frontend nunca vê nem armazena tokens.
   Todas as requisições usam `credentials: 'include'` (ver `src/lib/api/client.ts`).
2. **Inicialização da sessão** — na primeira navegação, o guard de rotas chama
   `GET /api/v1/auth/me` uma única vez (deduplicado). Nenhum dado local é
   tratado como prova de autenticação.
3. **Login** — `POST /api/v1/auth/login` com e-mail/senha; em caso de sucesso o
   usuário vai para `/dashboard` ou para a rota privada que tentou acessar
   (via `?redirect=`, validado como caminho interno).
4. **Cadastro** — `POST /api/v1/auth/register` **não autentica**: o usuário vai
   para `/check-email` até confirmar o e-mail.
5. **Confirmação de e-mail** — o link traz `?token=`; a página exibe um botão e
   só então chama `POST /api/v1/auth/verify-email`. Tokens nunca vão para
   localStorage nem aparecem em logs.
6. **Recuperação de senha** — `POST /api/v1/auth/forgot-password` responde
   sempre com a mesma mensagem genérica, exista a conta ou não.
7. **Redefinição de senha** — `POST /api/v1/auth/reset-password` com token e
   nova senha; **não** autentica automaticamente.
8. **Logout** — `POST /api/v1/auth/logout` e limpeza do estado local (mesmo que
   a requisição falhe).

## Integração com o backend Go

### Status da integração

Os endpoints de autenticação estão **implementados no backend** e o frontend
está integrado aos contratos reais (ver `internal/http/handlers/auth.go`).

| Método | Endpoint | Contrato (resumo) |
|---|---|---|
| POST | `/api/v1/auth/register` | `201 {user, verification_email_sent}` |
| POST | `/api/v1/auth/login` | `200 {user}` + cookie de sessão HTTP-only |
| POST | `/api/v1/auth/logout` | `204` (idempotente, revoga a sessão) |
| GET | `/api/v1/auth/me` | `200 {user}` / `401 authentication_required` |
| POST | `/api/v1/auth/verify-email` | `200 {message}`; erros `invalid_token`/`expired_token`/`token_used` |
| POST | `/api/v1/auth/resend-verification` | `202 {message}` (sempre genérico, anti-enumeração) |
| POST | `/api/v1/auth/forgot-password` | `202 {message}` (sempre genérico, anti-enumeração) |
| POST | `/api/v1/auth/reset-password` | `200 {message}`; body `{token, new_password}` |
| GET | `/api/v1/auth/csrf` | `200 {csrf_token}` (usado automaticamente pelo client) |

### Contratos reais (implementados em `src/lib/api/auth.ts`)

```jsonc
// POST /register, POST /login
{ "email": "ana@example.com", "password": "senha-forte-123" }
// POST /register também envia
{ "name": "Ana Santos" }

// POST /verify-email
{ "token": "<token>" }

// POST /reset-password
{ "token": "<token>", "new_password": "nova-senha-456" }

// POST /resend-verification, POST /forgot-password
{ "email": "ana@example.com" }

// GET /me e POST /login retornam (desembrulhado pelo client)
{ "user": { "id": "...", "name": "Ana Santos", "email": "ana@example.com", "email_verified": false } }

// POST /register
{ "user": { ... }, "verification_email_sent": true }
```

O formato de **erro** é o padrão do backend e o client o interpreta sempre por
`code` (nunca pelo texto):

```json
{ "error": { "code": "invalid_credentials", "message": "E-mail ou senha inválidos.", "request_id": "..." } }
```

Códigos tratados: `validation_failed`, `invalid_token`, `expired_token`,
`token_used`, `authentication_required`, `invalid_credentials`,
`email_not_verified`, `csrf_failed`, `email_already_registered`,
`rate_limited` (com header `Retry-After`) e `internal_error`.

### Rate limits do backend (respeitados no frontend)

| Operação | Limite |
|---|---|
| Cadastro | 10/h por IP |
| Login | 10 tentativas/15 min por e-mail+IP |
| Reenvio de confirmação | 3/h por e-mail |
| Recuperação de senha | 5/15 min por e-mail+IP |

Respostas `429` trazem `Retry-After`; as views exibem
"Muitas tentativas. Tente novamente em Xs/min/h.".

### Regras de senha

O frontend espelha a validação do backend (`internal/auth/validation.go`):
**8 a 256 caracteres**, sem exigência de maiúscula, minúscula ou número.
E-mails são normalizados para minúsculas (trim + lowercase) antes do envio,
como o backend faz.

### CSRF (obrigatório em toda mutação)

O backend usa double-submit (cookie `applya_csrf` + header `X-CSRF-Token`) e
validação de origem. O client (`src/lib/api/client.ts`) cuida disso sozinho:

1. antes de cada POST/PUT/PATCH/DELETE, obtém o token via `GET /api/v1/auth/csrf`
   (com cache; chamadas concorrentes compartilham a mesma requisição);
2. envia o token no header `X-CSRF-Token`;
3. se a resposta for `403 csrf_failed` (o backend rotaciona o token no login),
   invalida o cache, busca um token novo e repete a mutação **uma única vez**.

Nenhuma view precisa se preocupar com CSRF.

Como o cookie tem `Path=/api`, ele não fica acessível por `document.cookie`
nas páginas de auth. O cliente usa o token JSON de `/api/v1/auth/csrf`;
o navegador armazena e envia o cookie com `credentials: 'include'`.

A store também expõe `fetchMe()` para revalidar a sessão: `401` com código
`authentication_required` representa uma sessão deslogada; outros erros são
propagados ao chamador. `initialize()` mantém a inicialização deduplicada usada
pelos guards.

### Configurações necessárias de CORS e cookies

Como frontend e backend ficam em domínios diferentes:

- **CORS**: o backend já usa `CORS_ALLOWED_ORIGINS` com lista explícita e
  `AllowCredentials: true` (`*` é rejeitado). Inclua a origem do frontend
  (ex.: `http://localhost:5173` em dev, a URL do Render em produção).
- **Cookies**: os cookies `applya_session` (HTTP-only) e `applya_csrf` têm
  `Path=/api` e são configurados pelo backend. Em dev local
  (`localhost:5173` → `localhost:8080`) é same-site: `SameSite=Lax` funciona.
  Em produção cross-site o backend usa `COOKIE_SAMESITE=none` + `Secure`
  (exige HTTPS) — no frontend nada muda, só o requisito de HTTPS.
- **CSRF**: implementado ponta a ponta (double-submit + origem) — o client
  envia o header automaticamente; nada a configurar nas views.
- **Timeout**: cada requisição do frontend aborta após 10 s.
- **Referrer**: o app envia `<meta name="referrer" content="no-referrer">`
  (tokens de confirmação trafegam por query string) — reforçado pelo header
  `Referrer-Policy` na hospedagem (abaixo).

## Design tokens (Warm Peach)

Definidos em `src/assets/main.css` no bloco `@theme` do Tailwind v4. Use sempre
as utilities derivadas (`bg-background`, `text-text-secondary`, `border-border`,
`bg-primary`, `text-error`…), nunca valores hexadecimais soltos nos componentes.

| Token | Cor |
|---|---|
| `background` | `#F7F5EF` |
| `surface` | `#FFFFFF` |
| `primary` | `#FFCA91` |
| `primary-hover` | `#F4B66F` |
| `text-primary` | `#1E1E1E` |
| `text-secondary` | `#77736D` |
| `border` | `#E6E1D8` |
| `error` | `#C2413B` |
| `success` | `#3F7A4F` (apenas feedback de sucesso) |

Fonte: **Inter** (Google Fonts, com fallback para fontes do sistema).

## Segurança

- Sem tokens de sessão no `localStorage`/`sessionStorage`; o estado local é
  descartado no logout e quando o backend responde 401 (sessão expirada).
- Resultados de requisições em voo são invalidados após logout (sem
  "ressurreição" de sessão antiga).
- Senhas e tokens nunca são registrados em log.
- `?redirect=` do login só aceita caminhos internos (anti open redirect).
- Tokens de confirmação/redefinição são removidos da URL após o uso.
- Mensagens de erro da API são as do backend (seguras por contrato) apenas
  para 4xx; **erros 5xx sempre exibem mensagem genérica**, mesmo que o corpo
  traga uma mensagem (defesa contra vazamento interno).
- Nenhuma credencial real no código ou em arquivos versionados (apenas
  `.env.example` demonstrativo).
- Sem `v-html`/injeção de HTML: todo conteúdo dinâmico usa interpolação Vue.

### Cabeçalhos de segurança recomendados (configurar na hospedagem)

Estes cabeçalhos dependem do provedor (Render) e **não são configuráveis pelo
Vite**. Recomendado para o serviço estático do frontend:

| Header | Valor sugerido | Observação |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://<api>.onrender.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` | Ajuste `connect-src` para a origem real da API. Valide o app após aplicar |
| `Referrer-Policy` | `no-referrer` | Protege tokens trafegados por query string |
| `X-Content-Type-Options` | `nosniff` | O backend já envia nas respostas JSON |
| `X-Frame-Options` | `DENY` | Reforço contra clickjacking |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Somente com HTTPS (Render já serve HTTPS) |
| `Cache-Control` (HTML do SPA) | `private, no-store` | Evita cache de páginas autenticadas |

### Auditoria de dependências

```sh
npm audit            # vulnerabilidades
npm audit signatures # assinaturas/attestations do registry
```

Status da auditoria (ver `SECURITY.md`): `npm audit --omit=dev` não encontra
vulnerabilidades no bundle de produção. Restam avisos **moderate apenas em
ferramentas de desenvolvimento** (cadeia minimatch/eslint/@vue/test-utils),
sem correção compatível atual; não afetam o código publicado.

Para varredura de segredos antes de publicar, use
[Gitleaks](https://github.com/gitleaks/gitleaks):

```sh
gitleaks detect --source . --no-git   # ou sem --no-git para histórico completo
```

## Decisões arquiteturais

- **Fetch nativo** em um único cliente (`src/lib/api/client.ts`) — sem axios;
  a superfície é pequena e `fetch` cobre tudo (timeout via `AbortController`).
- **Guard único com inicialização de sessão** — o `router.beforeEach` aguarda a
  verificação de `/me` antes de decidir, evitando flash de tela errada e
  requisições duplicadas.
- **Componentes próprios em vez de shadcn-vue** — a biblioteca não estava
  instalada e o conjunto necessário é pequeno (Button/Input/Alert); os
  componentes em `src/components/ui/` seguem os mesmos princípios de acessibilidade.
- **Validações puras em `src/lib/validation.ts`** — testáveis isoladamente,
  compartilhadas entre views e indicador de requisitos de senha.
- **Verificação de e-mail por ação explícita** — o token só é consumido quando
  o usuário clica no botão, evitando consumo acidental por scanners de link.

Ver também [`AGENTS.md`](AGENTS.md) para convenções do repositório.
