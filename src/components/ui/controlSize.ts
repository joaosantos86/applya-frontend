import type { InjectionKey } from 'vue'

export type ControlSize = 'md' | 'lg'

/**
 * Tamanho padrão dos campos dentro de um layout. O `AuthLayout` fornece `lg`
 * para que os formulários de autenticação tenham campos maiores sem
 * sobrescrever estilos dos componentes filhos.
 */
export const controlSizeKey: InjectionKey<ControlSize> = Symbol('controlSize')
