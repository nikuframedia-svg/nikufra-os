import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { DataTable } from '../components/DataTable'
import api from '../utils/api'
import { InventoryResponse, InventorySKU } from '../types'

const classes = ['AX', 'AY', 'AZ', 'BX', 'BY', 'BZ', 'CX', 'CY', 'CZ']

const emptyMessage = 'Sem dados — carregue Excel em “Carregar Dados”.'

const normalizeSku = (raw: Partial<InventorySKU> & Record<string, unknown>): InventorySKU => {
  const asNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const asString = (value: unknown, fallback = '') => {
    if (value === null || value === undefined) return fallback
    return String(value)
  }

  const rawRisco = asNumber(raw.risco_30d ?? raw.risco30 ?? raw.risco ?? raw.risco_pct, 0)
  const risco = rawRisco <= 1 ? rawRisco * 100 : rawRisco

  return {
    sku: asString(raw.sku ?? (raw as Record<string, unknown>).SKU ?? raw.codigo ?? raw.produto, ''),
    classe: asString(raw.classe ?? raw.class ?? raw.classe_abc ?? raw.abc, ''),
    xyz: asString(raw.xyz ?? raw.XYZ ?? raw.classe_xyz ?? raw.xyz_class, ''),
    stock_atual: asNumber(raw.stock_atual ?? raw.stockAtual ?? raw.saldo ?? raw.stock, 0),
    ads_180: asNumber(raw.ads_180 ?? raw.ads ?? raw.consumo_medio ?? raw.avg_demand_180, 0),
    cobertura_dias: asNumber(raw.cobertura_dias ?? raw.cobertura ?? raw.coverage_days ?? raw.coverage, 0),
    risco_30d: risco,
    rop: asNumber(raw.rop ?? raw.ponto_reposicao ?? raw.reorder_point ?? raw.ROP, 0),
    acao: asString(raw.acao ?? raw.acao_sugerida ?? raw.action ?? 'Monitorizar'),
  }
}

const EmptyState = () => (
  <div className="rounded-2xl border border-border/60 bg-surface/60 p-6 text-sm text-text-muted">{emptyMessage}</div>
)

export const Inventory = () => {
  const [classeFilter, setClasseFilter] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const { data, isLoading, error } = useQuery<InventoryResponse>({
    queryKey: ['inventory', classeFilter, search],
    queryFn: async () => {
      const response = await api.get('/inventory/', {
        params: { classe: classeFilter || undefined, search: search || undefined },
      })
      return response.data
    },
  })

  const matrix = data?.matrix
  const hasMatrix = useMemo(() => {
    if (!matrix) return false
    return ['A', 'B', 'C'].every((bucket) => Boolean(matrix[bucket as 'A' | 'B' | 'C']))
  }, [matrix])

  const normalizedSkus = useMemo(() => {
    if (!data?.skus) return []
    return data.skus.map((item) => normalizeSku(item))
  }, [data?.skus])

  const hasSkus = normalizedSkus.length > 0

  const handleMatrixClick = (abc: 'A' | 'B' | 'C', xyz: 'X' | 'Y' | 'Z') => {
    const key = `${abc}${xyz}`
    setClasseFilter((current) => (current === key ? '' : key))
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Cobertura & reposição</p>
          <h2 className="text-2xl font-semibold text-text-primary">Inventário inteligente</h2>
          <p className="mt-2 max-w-3xl text-sm text-text-muted">
            Monitoriza a matriz ABC/XYZ, cobertura em dias e pontos de reposição calculados com serviço alvo de 95%.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Pesquisar SKU"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-nikufra"
          />
          <select
            value={classeFilter}
            onChange={(event) => setClasseFilter(event.target.value)}
            className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition hover:border-nikufra"
          >
            <option value="">Todas as classes</option>
            {classes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          Não foi possível carregar os dados de inventário. {String(error)}
        </div>
      )}

      {isLoading ? (
        <Skeleton height={220} baseColor="#121212" highlightColor="#1c1c1c" />
      ) : hasMatrix ? (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <h3 className="text-sm font-semibold text-text-primary">Matriz ABC/XYZ</h3>
          <p className="mt-2 text-xs text-text-muted">Clica numa célula para filtrar a tabela de SKUs por classe.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[480px] border-separate border-spacing-2 text-center text-sm">
              <thead className="text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="text-left">Classe</th>
                  <th>X</th>
                  <th>Y</th>
                  <th>Z</th>
                </tr>
              </thead>
              <tbody>
                {(['A', 'B', 'C'] as Array<'A' | 'B' | 'C'>).map((abc) => (
                  <tr key={abc} className="text-text-primary">
                    <td className="text-left font-semibold">{abc}</td>
                    {( ['X', 'Y', 'Z'] as Array<'X' | 'Y' | 'Z'>).map((xyz) => {
                      const isActive = classeFilter === `${abc}${xyz}`
                      return (
                        <td
                          key={`${abc}${xyz}`}
                          onClick={() => handleMatrixClick(abc, xyz)}
                          className={`cursor-pointer rounded-xl border px-3 py-2 transition ${
                            isActive
                              ? 'border-nikufra bg-nikufra/15 text-nikufra shadow-[0_0_20px_rgba(69,255,193,0.25)]'
                              : 'border-border/60 bg-background/40 hover:border-nikufra/60 hover:text-nikufra'
                          }`}
                        >
                          {matrix?.[abc]?.[xyz] ?? 0}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}

      {isLoading ? (
        <Skeleton height={320} baseColor="#121212" highlightColor="#1c1c1c" />
      ) : hasSkus ? (
        <DataTable<InventorySKU>
          columns={[
            { key: 'sku', header: 'SKU' },
            { key: 'classe', header: 'Classe', align: 'center', tooltip: 'Classe ABC baseada em valor anual.' },
            { key: 'xyz', header: 'XYZ', align: 'center', tooltip: 'Variabilidade da procura (X estável, Z errática).' },
            { key: 'stock_atual', header: 'Stock Atual', align: 'center', tooltip: 'Saldo disponível no snapshot mais recente.' },
            { key: 'ads_180', header: 'ADS-180', align: 'center', tooltip: 'Consumo médio diário dos últimos 180 dias.' },
            {
              key: 'cobertura_dias',
              header: 'Cobertura (dias)',
              align: 'center',
              tooltip: 'Dias de cobertura = stock atual / ADS-180.',
            },
            {
              key: 'risco_30d',
              header: 'Risco 30d',
              align: 'center',
              tooltip: 'Risco 30D = probabilidade de stockout nos próximos 30 dias.',
              render: (row) => (
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    row.risco_30d > 50
                      ? 'bg-danger/10 text-danger'
                      : row.risco_30d > 25
                      ? 'bg-warning/10 text-warning'
                      : 'bg-nikufra/10 text-nikufra'
                  }`}
                >
                  {row.risco_30d.toFixed(1)}%
                </span>
              ),
            },
            { key: 'rop', header: 'ROP', align: 'center', tooltip: 'Ponto de reposição calculado (service level 95%).' },
            {
              key: 'acao',
              header: 'Ação',
              tooltip: 'Orientação imediata sugerida pelo motor de inventário.',
              render: (row) => {
                const tone =
                  row.acao === 'Comprar agora'
                    ? 'bg-danger/10 text-danger'
                    : row.acao === 'Excesso'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-nikufra/10 text-nikufra'
                return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{row.acao}</span>
              },
            },
          ]}
          data={normalizedSkus}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

