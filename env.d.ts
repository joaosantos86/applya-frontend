/// <reference types="vite/client" />

// Permite que o TypeScript reconheça imports de SFCs também fora do vue-tsc.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent
  export default component
}

interface ImportMetaEnv {
  /** URL base da API do Applya (backend Go). Ex.: http://localhost:8080 */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
