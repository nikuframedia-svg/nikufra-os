/**
 * OPS Release Gate - Validação de readiness para produção
 * Industrial: pass/fail claro, checks detalhados
 */

import {
  Panel,
  SectionHeader,
  Badge,
  Loading,
  Empty,
  Error as ErrorState,
  NotSupportedState,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
} from '../../../../ui-kit';
import { useReleaseGate, type ReleaseGateResult } from '../../../../api/hooks';

export default function OpsReleaseGate() {
  const releaseGate = useReleaseGate();

  if (releaseGate.isLoading && !releaseGate.data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ 
          fontSize: tokens.typography.fontSize.title.lg, 
          fontWeight: tokens.typography.fontWeight.bold, 
          color: tokens.colors.text.title, 
          marginBottom: tokens.spacing.lg 
        }}>
          Release Gate
        </h1>
        <Loading />
      </div>
    );
  }

  if (releaseGate.isError) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ 
          fontSize: tokens.typography.fontSize.title.lg, 
          fontWeight: tokens.typography.fontWeight.bold, 
          color: tokens.colors.text.title, 
          marginBottom: tokens.spacing.lg 
        }}>
          Release Gate
        </h1>
        <Panel>
          <ErrorState 
            message="Endpoint não disponível" 
            reason={releaseGate.errorMessage || `O endpoint /api/ops/release-gate não está implementado no backend. Status: ${releaseGate.errorStatusCode || '404'}`} 
          />
          <div style={{ marginTop: tokens.spacing.md, padding: tokens.spacing.md, backgroundColor: tokens.colors.card.elevated, borderRadius: tokens.borderRadius.card }}>
            <div style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary, marginBottom: tokens.spacing.sm }}>
              <strong>Como executar Release Gate:</strong>
            </div>
            <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.muted, fontFamily: 'monospace' }}>
              <div>1. Execute: <code>python scripts/release_gate.py</code></div>
              <div>2. Ou via Makefile: <code>make release-gate</code></div>
              <div>3. O resultado será salvo em <code>docs/RELEASE_GATE_RESULT.json</code></div>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  if (releaseGate.isNotSupported) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <NotSupportedState reason={releaseGate.notSupportedReason} feature="release-gate" />
      </div>
    );
  }

  const gateData: ReleaseGateResult | null = releaseGate.data || null;

  if (!gateData) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ 
          fontSize: tokens.typography.fontSize.title.lg, 
          fontWeight: tokens.typography.fontWeight.bold, 
          color: tokens.colors.text.title, 
          marginBottom: tokens.spacing.lg 
        }}>
          Release Gate
        </h1>
        <Empty message="Nenhum resultado de release gate disponível" />
      </div>
    );
  }

  const passedCount = gateData.checks?.filter(check => check.passed).length ?? 0;
  const totalCount = gateData.checks?.length ?? 0;

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onSearch={() => {}} />
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: tokens.spacing.lg 
      }}>
        <div>
          <h1 style={{ 
            fontSize: tokens.typography.fontSize.title.lg, 
            fontWeight: tokens.typography.fontWeight.bold, 
            color: tokens.colors.text.title, 
            margin: 0, 
            marginBottom: tokens.spacing.xs 
          }}>
            Release Gate
          </h1>
          <p style={{ 
            fontSize: tokens.typography.fontSize.body.sm, 
            color: tokens.colors.text.secondary, 
            margin: 0 
          }}>
            Validação de readiness para produção
          </p>
        </div>
        <div style={{ display: 'flex', gap: tokens.spacing.md, alignItems: 'center' }}>
          {gateData.timestamp && <DataFreshnessChip lastIngestion={gateData.timestamp} />}
          <Badge variant={gateData.passed ? 'success' : 'danger'}>
            {gateData.passed ? 'PASS' : 'FAIL'}
          </Badge>
        </div>
      </div>

      {/* Summary */}
      <Panel style={{ marginBottom: tokens.spacing.lg }}>
        <SectionHeader title="Summary" />
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: tokens.spacing.md,
          padding: tokens.spacing.md 
        }}>
          <div>
            <div style={{ fontSize: tokens.typography.fontSize.label, color: tokens.colors.text.muted, marginBottom: tokens.spacing.xs }}>
              Overall Status
            </div>
            <Badge variant={gateData.passed ? 'success' : 'danger'}>
              {gateData.passed ? 'PASS' : 'FAIL'}
            </Badge>
          </div>
          <div>
            <div style={{ fontSize: tokens.typography.fontSize.label, color: tokens.colors.text.muted, marginBottom: tokens.spacing.xs }}>
              Checks Passed
            </div>
            <div style={{ fontSize: tokens.typography.fontSize.title.md, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title }}>
              {passedCount} / {totalCount}
            </div>
          </div>
        </div>
        {gateData.blocked_reason && (
          <div style={{
            marginTop: tokens.spacing.md,
            padding: tokens.spacing.md,
            backgroundColor: tokens.colors.status.error + '20',
            borderRadius: tokens.borderRadius.card,
            borderLeft: `3px solid ${tokens.colors.status.error}`,
          }}>
            <div style={{ 
              fontSize: tokens.typography.fontSize.body.sm, 
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.status.error,
              marginBottom: tokens.spacing.xs,
            }}>
              ⚠️ Release Blocked
            </div>
            <div style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.body }}>
              {gateData.blocked_reason}
            </div>
          </div>
        )}
      </Panel>

      {/* Checks */}
      <Panel>
        <SectionHeader title="Validation Checks" />
        {gateData.checks && gateData.checks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xs }}>
            {gateData.checks.map((check, idx) => (
              <div
                key={idx}
                style={{
                  padding: tokens.spacing.md,
                  backgroundColor: check.passed ? tokens.colors.status.success + '10' : tokens.colors.status.error + '10',
                  borderRadius: tokens.borderRadius.card,
                  borderLeft: `3px solid ${check.passed ? tokens.colors.status.success : tokens.colors.status.error}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: tokens.spacing.md,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: tokens.spacing.sm,
                    marginBottom: tokens.spacing.xs,
                  }}>
                    <Badge variant={check.passed ? 'success' : 'danger'}>
                      {check.passed ? '✓' : '✗'}
                    </Badge>
                    <span style={{ 
                      fontSize: tokens.typography.fontSize.body.sm, 
                      fontWeight: tokens.typography.fontWeight.semibold,
                      color: tokens.colors.text.title,
                    }}>
                      {check.name}
                    </span>
                  </div>
                  {check.reason && (
                    <div style={{ 
                      fontSize: tokens.typography.fontSize.body.xs, 
                      color: tokens.colors.text.secondary,
                      marginTop: tokens.spacing.xs,
                    }}>
                      {check.reason}
                    </div>
                  )}
                  {check.details && (
                    <div style={{ 
                      fontSize: tokens.typography.fontSize.body.xs, 
                      color: tokens.colors.text.muted,
                      marginTop: tokens.spacing.xs,
                      fontFamily: 'monospace',
                    }}>
                      {check.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty message="Nenhum check disponível" />
        )}
      </Panel>
    </div>
  );
}

