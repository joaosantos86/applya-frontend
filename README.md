# Applya Frontend

🇺🇸

Applya is a Vue app for tailoring a resume to different jobs. Each user edits a base resume step by step, creates independent versions, imports projects from public GitHub repositories, and downloads the open draft as an A4 PDF. It talks to the Go API in [applya-backend](https://github.com/joaosantos86/applya-backend).

## Run locally

1. Install Node.js 22.18+ (22.x line) or 24.12+, and start the backend at `http://localhost:8080` with `CORS_ALLOWED_ORIGINS=http://localhost:5173`.
2. Copy `.env.example` to `.env`. It needs one value, the API origin without `/api/v1`:

   ```dotenv
   VITE_API_URL=http://localhost:8080
   ```

3. Install the dependencies and start the dev server:

   ```powershell
   npm ci
   npm run dev
   ```

4. Open `http://localhost:5173`, register an account, and open the verification link printed in the backend log. After signing in, the workspace loads your base resume and its versions.

Use `localhost` for both services so the browser sends the session cookie. Vite uses a fixed port and stops if 5173 is taken. Restart it after changing `.env`. Every `VITE_` variable ends up in the browser bundle, so never put secrets there.

## Commands

| Task | Command |
| --- | --- |
| Start the dev server | `npm run dev` |
| Lint with automatic fixes | `npm run lint` |
| Check TypeScript and Vue types | `npm run type-check` |
| Build into `dist/` | `npm run build` |

## Production

The app is deployed on Fabroku with buildpacks: `.buildpacks` builds it with Node.js and serves `dist/` with nginx. `static.json` falls back to `index.html`, so direct links to app routes work.

Set `VITE_API_URL` to the public API origin in the app environment before building. Vite embeds it at build time, so changing it needs a new build. On the backend, add the frontend's HTTPS origin to `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL`. If the frontend and API are on different sites, set `COOKIE_SAMESITE=none`.

## Disclaimer

Applya is a personal, educational project. It is not a commercial product and is not affiliated with any other product or company named Applya.

## License

[MIT](LICENSE)

---

🇧🇷

O Applya é um app em Vue para adaptar currículos a diferentes vagas. Cada usuário edita seu currículo-base em etapas, cria versões independentes, importa projetos de repositórios públicos do GitHub e baixa o rascunho aberto em PDF A4. Ele se comunica com a API em Go do [applya-backend](https://github.com/joaosantos86/applya-backend).

### Executar localmente

1. Instale o Node.js 22.18 ou superior (linha 22.x) ou o 24.12 ou superior, e inicie o backend em `http://localhost:8080` com `CORS_ALLOWED_ORIGINS=http://localhost:5173`.
2. Copie `.env.example` para `.env`. Ele precisa de um único valor, a origem da API sem `/api/v1`:

   ```dotenv
   VITE_API_URL=http://localhost:8080
   ```

3. Instale as dependências e inicie o servidor de desenvolvimento:

   ```powershell
   npm ci
   npm run dev
   ```

4. Acesse `http://localhost:5173`, cadastre uma conta e abra o link de confirmação exibido no log do backend. Após o login, o workspace carrega seu currículo-base e suas versões.

Use `localhost` nos dois serviços para que o navegador envie o cookie de sessão. O Vite usa uma porta fixa e para se a 5173 estiver ocupada. Reinicie-o depois de alterar o `.env`. Toda variável `VITE_` vai para o código enviado ao navegador, então nunca coloque segredos nelas.

### Comandos

| Ação | Comando |
| --- | --- |
| Iniciar o servidor de desenvolvimento | `npm run dev` |
| Rodar o lint com correções automáticas | `npm run lint` |
| Verificar os tipos de TypeScript e Vue | `npm run type-check` |
| Gerar o build em `dist/` | `npm run build` |

### Produção

O app é publicado no Fabroku com buildpacks: o `.buildpacks` faz o build com Node.js e serve o `dist/` com nginx. O `static.json` redireciona para o `index.html`, então links diretos para as rotas do app funcionam.

Defina `VITE_API_URL` com a origem pública da API no ambiente do app antes do build. O Vite embute esse valor no build, então alterá-lo exige um novo build. No backend, inclua a origem HTTPS do frontend em `CORS_ALLOWED_ORIGINS` e `FRONTEND_URL`. Se o frontend e a API estiverem em sites diferentes, defina `COOKIE_SAMESITE=none`.

### Aviso

O Applya é um projeto pessoal e educacional. Não é um produto comercial e não tem relação com outros produtos ou empresas chamados Applya.

### Licença

[MIT](LICENSE)
