/**
 * Feedback efêmero do workspace (criação/renomeação/exclusão de versões).
 *
 * O estado é compartilhado entre componentes por um módulo singleton — não é
 * dado de domínio, então não pertence ao store de currículos.
 */
import { ref } from 'vue'

export type ToastVariant = 'success' | 'info' | 'error'

export interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

const toasts = ref<Toast[]>([])
let nextId = 0

function dismissToast(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function notify(message: string, variant: ToastVariant = 'success'): void {
  const id = ++nextId
  toasts.value = [...toasts.value, { id, message, variant }]

  setTimeout(() => dismissToast(id), 3600)
}

export function useToast() {
  return { toasts, notify, dismissToast }
}
