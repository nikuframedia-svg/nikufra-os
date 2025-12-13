import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'
import api from '../utils/api'
import { GanttChart } from '../components/GanttChart'
import { KPICard } from '../components/KPICard'

interface VIPPayload {
  sku: string
  quantidade: number
  prazo: string
}

interface AvariaPayload {
  recurso: string
  de: string
  ate: string
}

export const WhatIf = () => {
  const [mode, setMode] = useState<'vip' | 'avaria'>('vip')
  const [vipForm, setVipForm] = useState<VIPPayload>({
    sku: '',
    quantidade: 100,
    prazo: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
  })
  const [avariaForm, setAvariaForm] = useState<AvariaPayload>({
    recurso: '',
    de: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    ate: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
  })

  const [result, setResult] = useState<any>(null)

  const vipMutation = useMutation({
    mutationFn: async (payload: VIPPayload) => {
      const response = await api.post('/whatif/vip', payload)
      return response.data
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success('Simulação VIP concluída')
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Não foi possível simular VIP'),
  })

  const avariaMutation = useMutation({
    mutationFn: async (payload: AvariaPayload) => {
      const response = await api.post('/whatif/avaria', payload)
      return response.data
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success('Simulação de avaria concluída')
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Não foi possível simular avaria'),
  })

  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/planning/plano/aplicar', {
        scenario: mode,
        impact: result?.kpis?.impacto ?? {},
      })
      return response.data
    },
    onSuccess: (data) => {
      toast.success(`Plano aplicado às ${new Date(data.committed_at).toLocaleTimeString('pt-PT')}`)
    },
    onError: () => toast.error('Falha ao aplicar o plano.'),
  })

  const loading = vipMutation.isLoading || avariaMutation.isLoading
  const simulationActive = Boolean(result)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Laboratório de cenários</p>
          <h2 className="text-2xl font-semibold text-text-primary">What-if & Resiliência</h2>
          <p className="mt-2 max-w-3xl text-sm text-text-muted">
            Testa pedidos VIP ou avarias de recurso e observa o impacto direto nos KPIs, lead time e OTD.
          </p>
        </div>
        {simulationActive && (
          <button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isLoading}
            className="rounded-2xl border border-nikufra bg-nikufra/10 px-4 py-2 text-sm font-semibold text-nikufra transition hover:bg-nikufra hover:text-background disabled:cursor-not-allowed disabled:opacity-60"
          >
            Aplicar plano
          </button>
        )}
      </div>

      {simulationActive && result?.kpis?.impacto?.lead_time_pct !== undefined && (
        <div className="rounded-2xl border border-border/60 bg-nikufra/10 p-4 text-sm font-semibold text-nikufra shadow-glow">
          🧩 Simulação ativa • Lead time {result.kpis.impacto.lead_time_pct >= 0 ? '-' : '+'}
          {Math.abs(result.kpis.impacto.lead_time_pct).toFixed(1)} % vs baseline.
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setMode('vip')}
          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
            mode === 'vip'
              ? 'border border-nikufra bg-nikufra text-background shadow-glow'
              : 'border border-border bg-surface text-text-muted hover:text-text-primary'
          }`}
        >
          Simular VIP
        </button>
        <button
          onClick={() => setMode('avaria')}
          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
            mode === 'avaria'
              ? 'border border-warning bg-warning text-background shadow-glow'
              : 'border border-border bg-surface text-text-muted hover:text-text-primary'
          }`}
        >
          Simular Avaria
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          {mode === 'vip' ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                vipMutation.mutate(vipForm)
              }}
            >
              <h3 className="text-sm font-semibold text-text-primary">Fluxo VIP</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex flex-col gap-2 text-xs text-text-muted">
                  SKU
                  <input
                    value={vipForm.sku}
                    onChange={(event) => setVipForm((prev) => ({ ...prev, sku: event.target.value }))}
                    placeholder="SKU-123"
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-nikufra"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs text-text-muted">
                  Quantidade
                  <input
                    type="number"
                    min={1}
                    value={vipForm.quantidade}
                    onChange={(event) => setVipForm((prev) => ({ ...prev, quantidade: Number(event.target.value) }))}
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-nikufra"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs text-text-muted">
                  Prazo
                  <input
                    type="date"
                    value={vipForm.prazo}
                    onChange={(event) => setVipForm((prev) => ({ ...prev, prazo: event.target.value }))}
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-nikufra"
                    required
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl border border-nikufra bg-nikufra px-4 py-2 text-sm font-semibold text-background transition hover:bg-nikufra-hover disabled:opacity-60"
              >
                {loading ? 'A processar...' : 'Simular VIP'}
              </button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                avariaMutation.mutate(avariaForm)
              }}
            >
              <h3 className="text-sm font-semibold text-text-primary">Fluxo Avaria</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex flex-col gap-2 text-xs text-text-muted">
                  Recurso
                  <input
                    value={avariaForm.recurso}
                    onChange={(event) => setAvariaForm((prev) => ({ ...prev, recurso: event.target.value }))}
                    placeholder="M-12"
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-warning"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs text-text-muted">
                  De
                  <input
                    type="datetime-local"
                    value={avariaForm.de}
                    onChange={(event) => setAvariaForm((prev) => ({ ...prev, de: event.target.value }))}
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-warning"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs text-text-muted">
                  Até
                  <input
                    type="datetime-local"
                    value={avariaForm.ate}
                    onChange={(event) => setAvariaForm((prev) => ({ ...prev, ate: event.target.value }))}
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none transition focus:border-warning"
                    required
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl border border-warning bg-warning px-4 py-2 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? 'A processar...' : 'Simular Avaria'}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          {result ? (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
              <h3 className="text-sm font-semibold text-text-primary">Impacto em KPIs</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <KPICard
                  title="OTD Antes"
                  value={result.kpis?.antes?.otd_pct ?? 0}
                  format="percentage"
                  tooltip="Nível de serviço antes da simulação."
                />
                <KPICard
                  title="OTD Depois"
                  value={result.kpis?.depois?.otd_pct ?? 0}
                  format="percentage"
                  tooltip="Nível de serviço após aplicar a simulação."
                />
                <KPICard
                  title="Δ OTD"
                  value={result.kpis?.impacto?.otd_pp ?? 0}
                  unit="pp"
                  format="number"
                  delta={result.kpis?.impacto?.otd_pct}
                  tooltip="Variação percentual e em pontos percentuais do OTD."
                />
                <KPICard
                  title="Δ Lead Time"
                  value={result.kpis?.impacto?.lead_time_h ?? 0}
                  unit="h"
                  format="number"
                  delta={result.kpis?.impacto?.lead_time_pct}
                  tooltip="Redução ou aumento previsto no lead time médio."
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-muted shadow-glow">
              Nenhuma simulação executada ainda.
            </div>
          )}

          {result?.operations && result.operations.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
              <h3 className="text-sm font-semibold text-text-primary">Trecho afetado</h3>
              <div className="mt-4">
                <GanttChart
                  operations={result.operations}
                  title="Gantt parcial"
                  startDate={new Date(result.operations[0].start_time)}
                  endDate={new Date(result.operations[result.operations.length - 1].end_time)}
                />
              </div>
            </div>
          )}

          {result?.explicacoes && (
            <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-muted shadow-glow">
              <h3 className="mb-3 text-sm font-semibold text-text-primary">Notas</h3>
              <ul className="space-y-2">
                {result.explicacoes.map((item: string, index: number) => (
                  <li key={index} className="rounded-xl border border-border/60 bg-background/50 px-4 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

