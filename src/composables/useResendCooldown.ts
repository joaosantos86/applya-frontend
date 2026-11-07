import { computed, onBeforeUnmount, ref } from 'vue'

/**
 * Controle de intervalo entre reenvios (anti-abuso no cliente).
 * O backend continua sendo a autoridade final de rate limiting.
 */
export function useResendCooldown(seconds = 60) {
  const remaining = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const canResend = computed(() => remaining.value === 0)

  function start() {
    if (remaining.value > 0) return
    remaining.value = seconds

    timer = setInterval(() => {
      remaining.value -= 1
      if (remaining.value <= 0) {
        stop()
      }
    }, 1000)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onBeforeUnmount(stop)

  return { remaining, canResend, start }
}
