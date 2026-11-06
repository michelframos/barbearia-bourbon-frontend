import { Building2, Bell, Clock, Link2, Monitor, Settings2 } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { useEmpresaConfig } from '@/modules/empresa/hooks/useEmpresaConfig'
import { agendamentosApi } from '@/modules/agenda/api/agendamentosApi'
import type { TrinksExportResult } from '@/modules/agenda/types/agendamento'
import type {
  Empresa,
  FonteOrdemAssistente,
  MomentoAtribuicaoAssistente,
  ModoSelecaoAssistente,
  ResetCursorAssistente,
} from '@/modules/empresa/types/empresa'
import { ApiError } from '@/shared/api/httpClient'
import { PageHeader } from '@/shared/layout/PageHeader'
import { Button } from '@/shared/ui/button'
import { FieldLabel } from '@/shared/ui/field-label'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'
import { Switch } from '@/shared/ui/switch'

type FormState = {
  nome: string
  telefone: string
  endereco: string
  horario_abertura: string
  horario_fechamento: string
  intervalo_agenda_minutos: string
  painel_tv_auto_refresh: boolean
  painel_tv_intervalo_segundos: string
  notificacoes_ativas: boolean
  som_alerta_ativo: boolean
  modo_selecao_assistente: ModoSelecaoAssistente
  max_atendimentos_simultaneos_assistente: string
  fonte_ordem_assistente: FonteOrdemAssistente
  reset_cursor_assistente: ResetCursorAssistente
  momento_atribuicao_assistente: MomentoAtribuicaoAssistente
  trinks_ativo: boolean
  trinks_estabelecimento_id: string
  trinks_api_key: string
}

function formFromEmpresa(empresa: Empresa): FormState {
  return {
    nome: empresa.nome,
    telefone: empresa.telefone ?? '',
    endereco: empresa.endereco ?? '',
    horario_abertura: empresa.horario_abertura ?? '08:00',
    horario_fechamento: empresa.horario_fechamento ?? '19:00',
    intervalo_agenda_minutos: String(empresa.intervalo_agenda_minutos),
    painel_tv_auto_refresh: empresa.painel_tv_auto_refresh,
    painel_tv_intervalo_segundos: String(empresa.painel_tv_intervalo_segundos),
    notificacoes_ativas: empresa.notificacoes_ativas ?? true,
    som_alerta_ativo: empresa.som_alerta_ativo ?? false,
    modo_selecao_assistente: empresa.modo_selecao_assistente,
    max_atendimentos_simultaneos_assistente: String(empresa.max_atendimentos_simultaneos_assistente),
    fonte_ordem_assistente: empresa.fonte_ordem_assistente ?? 'manual',
    reset_cursor_assistente: empresa.reset_cursor_assistente ?? 'meia_noite',
    momento_atribuicao_assistente: empresa.momento_atribuicao_assistente ?? 'iniciar_atendimento',
    trinks_ativo: empresa.trinks_ativo ?? false,
    trinks_estabelecimento_id: empresa.trinks_estabelecimento_id ?? '',
    trinks_api_key: '',
  }
}

function ToggleOption({
  title,
  description,
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  ariaLabel: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-[var(--foreground-muted)]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={ariaLabel} />
    </div>
  )
}

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description?: string
  icon: typeof Building2
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function ConfiguracoesPage() {
  const { empresa, loading, error, update } = useEmpresaConfig()
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const [exportResumo, setExportResumo] = useState<TrinksExportResult | null>(null)

  useEffect(() => {
    if (empresa) {
      setForm(formFromEmpresa(empresa))
    }
  }, [empresa])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form) return

    setSaving(true)
    setFormError(null)
    setSuccess(null)

    const maxSimultaneos = Number(form.max_atendimentos_simultaneos_assistente)
    const intervaloAgenda = Number(form.intervalo_agenda_minutos)
    const intervaloTv = Number(form.painel_tv_intervalo_segundos)

    if (!form.nome.trim()) {
      setFormError('Informe o nome da barbearia.')
      setSaving(false)
      return
    }

    if (Number.isNaN(maxSimultaneos) || maxSimultaneos < 1 || maxSimultaneos > 10) {
      setFormError('Atendimentos simultâneos por assistente deve ser entre 1 e 10.')
      setSaving(false)
      return
    }

    if (Number.isNaN(intervaloAgenda) || intervaloAgenda < 5 || intervaloAgenda > 120) {
      setFormError('Intervalo da agenda deve ser entre 5 e 120 minutos.')
      setSaving(false)
      return
    }

    if (Number.isNaN(intervaloTv) || intervaloTv < 10 || intervaloTv > 300) {
      setFormError('Intervalo do Painel TV deve ser entre 10 e 300 segundos.')
      setSaving(false)
      return
    }

    if (form.trinks_ativo) {
      if (!form.trinks_estabelecimento_id.trim()) {
        setFormError('Informe o ID do estabelecimento na Trinks.')
        setSaving(false)
        return
      }

      if (!form.trinks_api_key.trim() && !empresa?.trinks_api_key_definida) {
        setFormError('Informe a chave da API da Trinks.')
        setSaving(false)
        return
      }
    }

    try {
      await update({
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || null,
        endereco: form.endereco.trim() || null,
        horario_abertura: form.horario_abertura,
        horario_fechamento: form.horario_fechamento,
        intervalo_agenda_minutos: intervaloAgenda,
        painel_tv_auto_refresh: form.painel_tv_auto_refresh,
        painel_tv_intervalo_segundos: intervaloTv,
        notificacoes_ativas: form.notificacoes_ativas,
        som_alerta_ativo: form.som_alerta_ativo,
        modo_selecao_assistente: form.modo_selecao_assistente,
        max_atendimentos_simultaneos_assistente: maxSimultaneos,
        fonte_ordem_assistente: form.fonte_ordem_assistente,
        reset_cursor_assistente: form.reset_cursor_assistente,
        momento_atribuicao_assistente: form.momento_atribuicao_assistente,
        trinks_ativo: form.trinks_ativo,
        trinks_estabelecimento_id: form.trinks_estabelecimento_id.trim() || null,
        ...(form.trinks_api_key.trim() ? { trinks_api_key: form.trinks_api_key.trim() } : {}),
      })
      setSuccess('Configurações salvas com sucesso.')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Falha ao salvar configurações.')
    } finally {
      setSaving(false)
    }
  }

  async function enviarLocais() {
    setExportando(true)
    setExportResumo(null)
    setFormError(null)
    setSuccess(null)
    try {
      const resultado = await agendamentosApi.exportarTrinks()
      setExportResumo(resultado)
      setSuccess(
        resultado.erros.length > 0
          ? `Enviados ${resultado.enviados} agendamento(s). Alguns não foram aceitos pela Trinks.`
          : `Enviados ${resultado.enviados} agendamento(s) para a Trinks.`,
      )
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Falha ao enviar agendamentos para a Trinks.')
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Dados da barbearia, Painel TV e regras operacionais."
      />

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {loading || !form ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
          <Section
            title="Barbearia"
            description="Informações gerais exibidas no sistema e no Painel TV."
            icon={Building2}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <FieldLabel htmlFor="cfg-nome">Nome</FieldLabel>
                <Input
                  id="cfg-nome"
                  value={form.nome}
                  onChange={(e) => setForm((prev) => prev && { ...prev, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-telefone">Telefone</FieldLabel>
                <Input
                  id="cfg-telefone"
                  value={form.telefone}
                  onChange={(e) => setForm((prev) => prev && { ...prev, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-endereco">Endereço</FieldLabel>
                <Input
                  id="cfg-endereco"
                  value={form.endereco}
                  onChange={(e) => setForm((prev) => prev && { ...prev, endereco: e.target.value })}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Horário e agenda"
            description="Expediente padrão e intervalo dos slots da agenda."
            icon={Clock}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-abertura">Abertura</FieldLabel>
                <Input
                  id="cfg-abertura"
                  type="time"
                  value={form.horario_abertura}
                  onChange={(e) =>
                    setForm((prev) => prev && { ...prev, horario_abertura: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-fechamento">Fechamento</FieldLabel>
                <Input
                  id="cfg-fechamento"
                  type="time"
                  value={form.horario_fechamento}
                  onChange={(e) =>
                    setForm((prev) => prev && { ...prev, horario_fechamento: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-intervalo-agenda">Intervalo da agenda (min)</FieldLabel>
                <Input
                  id="cfg-intervalo-agenda"
                  type="number"
                  min={5}
                  max={120}
                  value={form.intervalo_agenda_minutos}
                  onChange={(e) =>
                    setForm((prev) => prev && { ...prev, intervalo_agenda_minutos: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </Section>

          <Section
            title="Painel TV"
            description="Atualização automática do display público."
            icon={Monitor}
          >
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] px-4 py-3">
              <div>
                <p className="font-medium">Atualização automática</p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Recarrega o snapshot do painel em intervalos regulares.
                </p>
              </div>
              <Switch
                checked={form.painel_tv_auto_refresh}
                onCheckedChange={(checked) =>
                  setForm((prev) => prev && { ...prev, painel_tv_auto_refresh: checked })
                }
                aria-label="Atualização automática do Painel TV"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="cfg-intervalo-tv">Intervalo de refresh (segundos)</FieldLabel>
              <Input
                id="cfg-intervalo-tv"
                type="number"
                min={10}
                max={300}
                value={form.painel_tv_intervalo_segundos}
                onChange={(e) =>
                  setForm((prev) => prev && { ...prev, painel_tv_intervalo_segundos: e.target.value })
                }
                disabled={!form.painel_tv_auto_refresh}
                required
              />
            </div>
          </Section>

          <Section title="Sistema" icon={Bell}>
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              <ToggleOption
                title="Notificações"
                description="Alertas de novos atendimentos"
                checked={form.notificacoes_ativas}
                onCheckedChange={(checked) =>
                  setForm((prev) => prev && { ...prev, notificacoes_ativas: checked })
                }
                ariaLabel="Notificações de novos atendimentos"
              />
              <div className="border-t border-[var(--border)]" />
              <ToggleOption
                title="Som de alerta"
                description="Notificação sonora ao registrar cliente"
                checked={form.som_alerta_ativo}
                onCheckedChange={(checked) =>
                  setForm((prev) => prev && { ...prev, som_alerta_ativo: checked })
                }
                ariaLabel="Som de alerta ao registrar cliente"
              />
            </div>
          </Section>

          <Section
            title="Operação"
            description="Regras de fila e seleção de assistente."
            icon={Settings2}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-modo">Seleção de assistente</FieldLabel>
                <Select
                  id="cfg-modo"
                  value={form.modo_selecao_assistente}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            modo_selecao_assistente: e.target.value as ModoSelecaoAssistente,
                          }
                        : prev,
                    )
                  }
                >
                  <option value="manual">Manual</option>
                  <option value="automatico_sequencial">Sequencial automático</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-max">Atendimentos simultâneos por assistente</FieldLabel>
                <Input
                  id="cfg-max"
                  type="number"
                  min={1}
                  max={10}
                  value={form.max_atendimentos_simultaneos_assistente}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? { ...prev, max_atendimentos_simultaneos_assistente: e.target.value }
                        : prev,
                    )
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-fonte">Fonte da ordem da fila</FieldLabel>
                <Select
                  id="cfg-fonte"
                  value={form.fonte_ordem_assistente}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            fonte_ordem_assistente: e.target.value as FonteOrdemAssistente,
                          }
                        : prev,
                    )
                  }
                >
                  <option value="manual">Ordem manual (cadastro)</option>
                  <option value="checkin">Ordem do check-in</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-reset">Reset da sequência</FieldLabel>
                <Select
                  id="cfg-reset"
                  value={form.reset_cursor_assistente}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            reset_cursor_assistente: e.target.value as ResetCursorAssistente,
                          }
                        : prev,
                    )
                  }
                >
                  <option value="meia_noite">À meia-noite</option>
                  <option value="primeiro_checkin_dia">No primeiro check-in do dia</option>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <FieldLabel htmlFor="cfg-momento">Momento da atribuição</FieldLabel>
                <Select
                  id="cfg-momento"
                  value={form.momento_atribuicao_assistente}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            momento_atribuicao_assistente:
                              e.target.value as MomentoAtribuicaoAssistente,
                          }
                        : prev,
                    )
                  }
                >
                  <option value="iniciar_atendimento">Ao iniciar o atendimento</option>
                  <option value="checkin_cliente">No check-in do cliente</option>
                </Select>
              </div>
            </div>
          </Section>

          <Section
            title="Trinks"
            description="Integração de agendamentos com a API da Trinks."
            icon={Link2}
          >
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] px-4 py-3">
              <div>
                <p className="font-medium">Usar a API da Trinks</p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Com a integração ativa, criar, alterar e cancelar agendamentos também envia os dados à
                  Trinks.
                </p>
              </div>
              <Switch
                checked={form.trinks_ativo}
                onCheckedChange={(checked) =>
                  setForm((prev) => prev && { ...prev, trinks_ativo: checked })
                }
                aria-label="Usar a API da Trinks"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-trinks-estabelecimento">ID do estabelecimento</FieldLabel>
                <Input
                  id="cfg-trinks-estabelecimento"
                  value={form.trinks_estabelecimento_id}
                  onChange={(e) =>
                    setForm((prev) => prev && { ...prev, trinks_estabelecimento_id: e.target.value })
                  }
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-trinks-chave">Chave da API</FieldLabel>
                <Input
                  id="cfg-trinks-chave"
                  type="password"
                  value={form.trinks_api_key}
                  onChange={(e) =>
                    setForm((prev) => prev && { ...prev, trinks_api_key: e.target.value })
                  }
                  placeholder={
                    empresa?.trinks_api_key_definida
                      ? 'Chave já salva. Preencha só para substituir.'
                      : 'Cole a chave da API'
                  }
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-[var(--border)] px-4 py-4">
              <div>
                <p className="font-medium">Webhook</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  O webhook é o endereço que a Trinks chama quando um agendamento é criado, alterado ou
                  cancelado lá. Este sistema recebe esses avisos e atualiza a agenda local. Nas
                  configurações da Trinks, no campo de webhook do Conecta Trinks, informe somente este
                  endereço:
                </p>
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cfg-trinks-webhook">URL para cadastrar na Trinks</FieldLabel>
                <Input id="cfg-trinks-webhook" value={empresa?.trinks_webhook_url ?? ''} readOnly />
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">
                A Trinks envia todos os eventos para a mesma URL. Este sistema trata inclusão, alteração e
                exclusão de agendamento. O endereço precisa ser HTTPS e acessível na internet. Um endereço
                local, como localhost, não recebe os avisos da Trinks.
              </p>
            </div>
            {empresa?.trinks_ativo ? (
              <div className="space-y-3">
                <Button type="button" variant="outline" disabled={exportando} onClick={() => void enviarLocais()}>
                  {exportando ? 'Enviando…' : 'Enviar agendamentos locais para a Trinks'}
                </Button>
                {exportResumo && exportResumo.erros.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-red-300">
                    {exportResumo.erros.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </Section>

          {formError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {formError}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {success}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar configurações'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
