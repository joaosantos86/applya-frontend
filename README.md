# Applya frontend

Applya is a personal project for building resumes tailored to job applications.
This repository contains the Vue frontend; the API lives in
[applya-backend](https://github.com/joaosantos86/applya-backend).

The current app covers registration, sign-in, email verification, password recovery,
and session management. The dashboard is a placeholder with a sign-out action.
Resume editing and export are not implemented yet. Interface copy is in Brazilian Portuguese.

## Stack

Vue 3 with TypeScript and `<script setup>`, Vite, Vue Router, Pinia, Tailwind CSS v4,
and Lucide icons. API requests use native fetch through a shared HTTP client.

## Run locally

Use Node.js 22.18+ within the 22.x release line, or 24.12+. Start the Go backend
at `http://localhost:8080`, then run:

```sh
npm ci
cp .env.example .env
npm run dev
```

In PowerShell, use `Copy-Item .env.example .env` to copy the environment file.
Open **http://localhost:5173**. Vite uses a fixed port and stops if it is already
occupied. Use `localhost` for both services so the frontend matches the backend's
allowed origin and cookie hostname.

The local environment file contains:

```dotenv
VITE_API_URL=http://localhost:8080
```

This is the API origin, without `/api/v1`. Restart Vite after changing it.
`.env` is ignored by Git; `.env.example` is tracked. Variables prefixed with
`VITE_` are included in the browser bundle, so they must not contain secrets.
The backend has its own configuration and does not read this file.

To check that the API is running:

```sh
curl http://localhost:8080/health
```

The expected response is `{"status":"ok"}`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run oxlint and ESLint with automatic fixes |
| `npm run type-check` | Check TypeScript and Vue types |
| `npm run format` | Format `src/` with Prettier |
| `npm run build` | Check types and build into `dist/` |
| `npm run preview` | Serve the production build locally |

There are currently no test files. Vitest, Vue Test Utils, and happy-dom remain
configured, but `npm test` exits with an error because no tests are found.

## Authentication

The backend stores the session in an HTTP-only cookie. The frontend keeps the
current user in Pinia and sends `credentials: 'include'` with every API request.
Session credentials are not stored in localStorage or sessionStorage.

On the first navigation, the route guard checks `/api/v1/auth/me`. Protected pages
redirect guests to sign-in. After signing in, users return to the requested internal
path or the dashboard. Registration requires email verification before sign-in.
Password reset does not sign the user in automatically.

The HTTP client obtains a CSRF token from `/api/v1/auth/csrf` and sends it as
`X-CSRF-Token` on POST, PUT, PATCH, and DELETE requests. It caches the token and
refreshes it once if a mutation returns `403 csrf_failed`. Sign-in invalidates the
cache because the backend rotates the token. The token comes from the JSON
response: the CSRF cookie uses `Path=/api`, so auth pages cannot read it directly.

Errors are handled by code. Server errors use generic messages, and rate-limit
feedback uses `Retry-After` when available. Password recovery accepts the expected
202 response and shows the same success message regardless of account existence;
operational failures leave the form available for another attempt.

Email verification requires a button click. Its token is removed from the URL when
the page opens and kept in memory; reloading requires reopening the original link.
The reset-password page removes its token after a successful reset. The resend page
accepts an email in the query string and lets users enter or correct it.

## Routes

| Path | Purpose |
| --- | --- |
| `/login` | Sign in |
| `/register` | Create an account |
| `/verify-email` | Confirm an email address |
| `/check-email` | Request another verification email |
| `/forgot-password` | Request a password reset |
| `/reset-password` | Set a new password |
| `/dashboard` | Protected placeholder page |

Signed-in users are redirected away from `/login` and `/register`. `/` and unknown
paths redirect to `/dashboard`, where the authentication guard applies.

## Source layout

```text
src/
  assets/main.css       Theme tokens and base styles
  components/auth/      Shared auth layout, illustrations, password requirements
  components/ui/        Buttons, inputs, password fields, alerts
  composables/          Resend cooldown
  lib/api/client.ts     Fetch, cookies, CSRF, timeouts, error handling
  lib/api/auth.ts       Auth endpoints and response types
  lib/validation.ts     Form validation
  lib/redirect.ts       Internal redirect checks
  router/               Routes and navigation guards
  stores/auth.ts        Session state
  views/auth/           Auth screens
  views/DashboardView.vue
```

Keep HTTP calls in `client.ts`, endpoint functions in `auth.ts`, and validation
rules in `validation.ts`. Views handle form state and navigation.

## Visual style

The Warm Peach theme uses a cream background, white surfaces, dark text, and peach
buttons. Auth screens share a centered card with fine-line illustrations on larger
screens. Typography uses Inter, with system fonts as a fallback.

Colors are defined in [src/assets/main.css](src/assets/main.css). Use the existing
Tailwind tokens, such as `bg-background`, `bg-primary`, and `text-text-secondary`,
instead of adding hex values to components. Green is reserved for success feedback.

## Deployment

Set `VITE_API_URL` to the deployed API origin before building. Vite embeds this value
at build time. Upload `dist/` to a static host and configure an SPA fallback to
`index.html` so direct links to auth pages work.

The backend must allow the frontend origin, credentials, and the `Content-Type`
and `X-CSRF-Token` request headers. Its CORS middleware must handle preflight OPTIONS
requests. Check this in a browser: a successful curl POST alone does not verify CORS.

HTTPS, cookie settings, and response headers need to be configured for the deployed
environment. Validate the browser flows before publishing; local builds do not
verify the hosting configuration.

Run dependency and secret checks before a release:

```sh
npm audit
npm audit --omit=dev
gitleaks detect --source . --no-git --redact
```
