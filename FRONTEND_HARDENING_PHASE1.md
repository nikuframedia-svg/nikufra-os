# Frontend Hardening - Fase 1 Completa

## ✅ 1. Sanitização de Params (1.1-1.2)

**Ficheiros criados:**
- `frontend/src/api/utils/sanitizeParams.ts`

**Ficheiros modificados:**
- `frontend/src/services/api-client.ts` - Interceptor sanitiza params automaticamente

**Evidência:**
```typescript
// Interceptor sanitiza params antes de enviar
api.interceptors.request.use((config) => {
  if (config.params) {
    config.params = sanitizeParams(config.params as Record<string, unknown>);
  }
  return config;
});
```

**Resultado:**
- ✅ Params undefined/null/empty são removidos
- ✅ Nunca aparece "undefined" na URL
- ✅ Build passa

## ✅ 2. Classificação de Erros (2.1-2.3)

**Ficheiros criados:**
- `frontend/src/api/utils/errorClassification.ts`

**Ficheiros modificados:**
- `frontend/src/services/api-client.ts` - handleError usa classifyApiError

**Evidência:**
```typescript
export type ApiErrorKind =
  | 'OFFLINE'
  | 'NOT_SUPPORTED_BACKEND'
  | 'NOT_SUPPORTED_BY_DATA'
  | 'VALIDATION'
  | 'SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'UNKNOWN';

export interface ApiErrorNormalized {
  endpoint: string;
  status: number | null;
  message: string;
  correlationId?: string;
  kind: ApiErrorKind;
}
```

**Mapeamento:**
- Network error/timeout/ECONNREFUSED → `OFFLINE`
- HTTP 404 → `NOT_SUPPORTED_BACKEND`
- Payload `{status:"NOT_SUPPORTED_BY_DATA"}` → `NOT_SUPPORTED_BY_DATA`
- HTTP 400/422 → `VALIDATION`
- HTTP 500 → `SERVER_ERROR`
- HTTP 503 → `OFFLINE`
- HTTP 401/403 → `UNAUTHORIZED`

**Resultado:**
- ✅ Erros classificados corretamente
- ✅ UI pode derivar estados sem duplicação
- ✅ Build passa

## ✅ 3. Retries Inteligentes (3.1-3.4)

**Ficheiros modificados:**
- `frontend/src/App.tsx` - QueryClient com retry function

**Evidência:**
```typescript
retry: (failureCount, error: any) => {
  const normalized = error?.normalized || /* ... */;
  const kind = normalized.kind || 'UNKNOWN';
  
  // Não retry para erros que não vão melhorar
  if (['NOT_SUPPORTED_BACKEND', 'NOT_SUPPORTED_BY_DATA', 'VALIDATION', 'UNAUTHORIZED'].includes(kind)) {
    return false;
  }
  
  // Retry limitado para OFFLINE e SERVER_ERROR
  if (kind === 'OFFLINE' || kind === 'SERVER_ERROR') {
    return failureCount < 1; // Apenas 1 retry
  }
  
  return failureCount < 2;
}
```

**Resultado:**
- ✅ 404 não gera 20 chamadas repetidas
- ✅ 503 não entra em loop (máx 1 retry)
- ✅ 500 não gera spam
- ✅ Build passa

## ✅ 4. Endpoint Registry (4.1-4.3)

**Ficheiros criados:**
- `frontend/src/api/endpoints.ts`

**Evidência:**
```typescript
export const SMARTINVENTORY = {
  WIP: `${BASE}/smartinventory/wip`,
  WIP_MASS: `${BASE}/smartinventory/wip_mass`,
  // ...
} as const;

// NOTA: Não existe /ops/ingestion/status no backend
// NOTA: Não existe endpoint de chat no backend atual
```

**Resultado:**
- ✅ Endpoints mapeados do backend real
- ✅ Notas sobre endpoints inexistentes
- ✅ Build passa

## ✅ 7. Quality Hooks Corrigidos (7.1-7.2)

**Ficheiros modificados:**
- `frontend/src/services/api-client.ts` - qualityApi.getOverview e getRisk sanitizam params
- `frontend/src/api/hooks/index.ts` - useQualityOverview e useQualityRisk usam qualityApi

**Evidência:**
```typescript
async getOverview(faseAvaliacaoId?: number, faseCulpadaId?: number) {
  const params: Record<string, number> = {};
  if (faseAvaliacaoId !== undefined) params.fase_avaliacao_id = faseAvaliacaoId;
  if (faseCulpadaId !== undefined) params.fase_culpada_id = faseCulpadaId;
  // ...
}
```

**Resultado:**
- ✅ Não envia modelo_id/fase_id se undefined
- ✅ Build passa

## 📊 Build Status

```bash
$ npm run build
✓ built in 1.74s
```

**Status**: ✅ **PASSA SEM ERROS**

## 📝 Próximos Passos

1. ⏳ Criar PageScaffold (5.1-5.2)
2. ⏳ Completar SmartInventory Overview (6.1-6.2)
3. ⏳ Verificar Router e lazy routes (8.1-8.3)
4. ⏳ Verificar design industrial (9.1-9.3)
5. ⏳ Entrega final (10)

