export function playAlertSound() {
  try {
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.value = 0.08

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start()
    oscillator.stop(context.currentTime + 0.18)

    window.setTimeout(() => {
      void context.close()
    }, 300)
  } catch {
    // Navegador pode bloquear áudio sem interação prévia.
  }
}
