export function elapsedFromHora(horaInicio: string | null | undefined, now: Date) {
  if (!horaInicio) return ''
  const [hh, mm, ss = 0] = horaInicio.split(':').map(Number)
  if (Number.isNaN(hh) || Number.isNaN(mm)) return ''

  const start = new Date(now)
  start.setHours(hh, mm, ss, 0)
  let diffMs = now.getTime() - start.getTime()
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
