import type { Atendimento, PainelAssistenteColuna, PainelRef } from '@/modules/painel/types/atendimento'

export function atendimentosDaColuna(coluna: PainelAssistenteColuna): Atendimento[] {
  return coluna.slots.map((slot) => slot.atendimento).filter((item): item is Atendimento => item !== null)
}

export function mapaBarbeiros(barbeiros: PainelRef[]): Map<number, PainelRef> {
  return new Map(barbeiros.map((barbeiro) => [barbeiro.id, barbeiro]))
}

export function nomeDoBarbeiro(
  item: Atendimento,
  barbeirosPorId: Map<number, PainelRef>,
): string | null {
  if (item.barbeiro?.nome) return item.barbeiro.nome
  if (item.id_barbeiro) return barbeirosPorId.get(item.id_barbeiro)?.nome ?? null
  return null
}

export function emAtendimentosDaAssistente(coluna: PainelAssistenteColuna): Atendimento[] {
  return atendimentosDaColuna(coluna).filter((item) => item.status_atendimento === 'em_atendimento')
}

export function barbeirosAuxiliando(
  coluna: PainelAssistenteColuna,
  barbeirosPorId: Map<number, PainelRef>,
): string[] {
  const nomes = atendimentosDaColuna(coluna)
    .filter((item) => ['em_atendimento', 'chamado'].includes(item.status_atendimento))
    .map((item) => nomeDoBarbeiro(item, barbeirosPorId))
    .filter((nome): nome is string => Boolean(nome))

  return [...new Set(nomes)]
}

export function proximoDaAssistente(coluna: PainelAssistenteColuna): Atendimento | null {
  return (
    atendimentosDaColuna(coluna).find((item) =>
      ['aguardando', 'chamado'].includes(item.status_atendimento),
    ) ?? null
  )
}

export function atendimentoAtivoDoBarbeiro(
  barbeiroId: number,
  atendimentos: Atendimento[],
): Atendimento | null {
  return (
    atendimentos.find(
      (item) => item.id_barbeiro === barbeiroId && item.status_atendimento === 'em_atendimento',
    ) ?? null
  )
}
