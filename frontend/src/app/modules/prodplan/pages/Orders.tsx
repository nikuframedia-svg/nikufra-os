/**
 * PRODPLAN Orders - Lista de ordens com keyset pagination
 * Industrial: tabela densa, filtros eficientes, zero decoração
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Panel,
  DenseTable,
  FiltersBar,
  Loading,
  Empty,
  Error as ErrorComponent,
  NotSupportedState,
  Badge,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
} from '../../../../ui-kit';
import { prodplanApi } from '../../../../api/api-client';

interface Order {
  of_id: string;
  of_data_criacao: string | null;
  of_data_acabamento: string | null;
  of_data_transporte: string | null;
  of_produto_id: number | null;
  of_fase_id: number | null;
  status?: 'CREATED' | 'IN_PROGRESS' | 'DONE' | 'LATE' | 'AT_RISK';
  eta?: string | null;
  due_date?: string | null;
}

export default function Orders() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [faseId, setFaseId] = useState<number | null>(null);
  const [produtoId, setProdutoId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['prodplan', 'orders', searchTerm, cursor, faseId, produtoId, statusFilter],
    queryFn: () =>
      prodplanApi.getOrders({
        limit: 100,
        cursor: cursor || undefined,
        of_id: searchTerm || undefined,
        fase_id: faseId || undefined,
        produto_id: produtoId || undefined,
      }),
    staleTime: 30000,
  });

  // Error handling
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = String(error.message);
    if (errorMessage.includes('NOT_SUPPORTED_BY_DATA')) {
      return (
        <div style={{ padding: tokens.spacing.lg }}>
          <PageCommandBox onSearch={() => {}} />
          <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
            Ordens de Fabrico
          </h1>
          <NotSupportedState reason={errorMessage} feature="prodplan.orders" />
        </div>
      );
    }
  }

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Ordens de Fabrico
        </h1>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Ordens de Fabrico
        </h1>
        <ErrorComponent message="Erro ao carregar ordens" reason={error instanceof Error ? error.message : 'Unknown error'} />
      </div>
    );
  }

  const orders = data?.orders || [];
  const nextCursor = data?.next_cursor || null;

  // Filter by status
  const filteredOrders = orders.filter((order: Order) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  // Status badge color
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'DONE':
        return <Badge variant="success">DONE</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">IN_PROGRESS</Badge>;
      case 'LATE':
        return <Badge variant="danger">LATE</Badge>;
      case 'AT_RISK':
        return <Badge variant="warning">AT_RISK</Badge>;
      default:
        return <Badge variant="default">CREATED</Badge>;
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Table columns
  const columns = [
    {
      key: 'of_id',
      header: 'OF ID',
      render: (row: Order) => (
        <span
          style={{
            color: tokens.colors.primary.default,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onClick={() => navigate(`/prodplan/orders/${row.of_id}`)}
        >
          {row.of_id}
        </span>
      ),
    },
    {
      key: 'produto_id',
      header: 'Produto',
      render: (row: Order) => row.of_produto_id?.toString() || 'N/A',
    },
    {
      key: 'fase_id',
      header: 'Fase',
      render: (row: Order) => row.of_fase_id?.toString() || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Order) => getStatusBadge(row.status),
    },
    {
      key: 'created_at',
      header: 'Criada',
      render: (row: Order) => formatDate(row.of_data_criacao),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (row: Order) => formatDate(row.due_date || null),
    },
    {
      key: 'eta',
      header: 'ETA',
      render: (row: Order) => formatDate(row.eta || null),
    },
  ];

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <PageCommandBox onSearch={(q) => setSearchTerm(q)} />
      <div style={{ padding: tokens.spacing.lg, borderBottom: `1px solid ${tokens.colors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.xs }}>
          <h1
            style={{
              fontSize: tokens.typography.fontSize.title.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.text.title,
              fontFamily: tokens.typography.fontFamily,
              margin: 0,
            }}
          >
            Ordens de Fabrico
          </h1>
          {data && 'generated_at' in data && <DataFreshnessChip lastIngestion={String(data.generated_at)} />}
        </div>
        {filteredOrders.length === 0 && !isLoading && (
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.muted, marginTop: tokens.spacing.xs }}>
            {orders.length === 0 ? 'Nenhuma ordem encontrada' : `Filtros aplicados: ${orders.length - filteredOrders.length} ordens ocultas`}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <FiltersBar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: 'Search OF ID...',
          }}
          chips={[
            { label: 'All', active: statusFilter === 'all', onClick: () => setStatusFilter('all') },
            {
              label: 'CREATED',
              active: statusFilter === 'CREATED',
              onClick: () => setStatusFilter('CREATED'),
            },
            {
              label: 'IN_PROGRESS',
              active: statusFilter === 'IN_PROGRESS',
              onClick: () => setStatusFilter('IN_PROGRESS'),
            },
            {
              label: 'LATE',
              active: statusFilter === 'LATE',
              onClick: () => setStatusFilter('LATE'),
            },
            {
              label: 'AT_RISK',
              active: statusFilter === 'AT_RISK',
              onClick: () => setStatusFilter('AT_RISK'),
            },
          ]}
          selects={[
            {
              label: 'Fase',
              value: faseId || '',
              options: [{ value: '', label: 'Todas' }], // TODO: Load from API
              onChange: (val) => setFaseId(val ? Number(val) : null),
            },
            {
              label: 'Produto',
              value: produtoId || '',
              options: [{ value: '', label: 'Todos' }], // TODO: Load from API
              onChange: (val) => setProdutoId(val ? Number(val) : null),
            },
          ]}
        />

        <div style={{ flex: 1, overflow: 'auto', padding: tokens.spacing.lg }}>
          <Panel>
            {filteredOrders.length > 0 ? (
              <>
                <DenseTable
                  columns={columns}
                  data={filteredOrders}
                  onRowClick={(row: Order) => navigate(`/prodplan/orders/${row.of_id}`)}
                />
                {nextCursor && (
                  <div style={{ marginTop: tokens.spacing.md, textAlign: 'center' }}>
                    <button
                      onClick={() => setCursor(nextCursor)}
                      style={{
                        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                        backgroundColor: tokens.colors.primary.default,
                        color: tokens.colors.text.onAction,
                        border: 'none',
                        borderRadius: tokens.borderRadius.button,
                        cursor: 'pointer',
                        fontSize: tokens.typography.fontSize.body.sm,
                        fontFamily: tokens.typography.fontFamily,
                      }}
                    >
                      Carregar Mais
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Empty message="Nenhuma ordem encontrada" />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
