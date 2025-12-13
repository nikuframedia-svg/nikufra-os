# Nelo - Data Foundations & Feature Engineering

Sistema de base de dados e motor de inteligência para dados de produção, baseado em `Folha_IA.xlsx`.

## Estrutura do Projeto

```
nelo/
├── backend/
│   ├── data_ingestion/     # Camada de ingestão
│   ├── models/             # Modelos ORM (SQLAlchemy)
│   ├── features/           # Feature engineering
│   ├── services/           # Serviços de negócio
│   └── ml_hooks/           # Hooks para modelos ML futuros
├── data/
│   ├── raw/                # Dados brutos (Folha_IA.xlsx)
│   └── processed/          # Dados processados
├── tests/                  # Testes
└── docs/                   # Documentação
```

## Setup

1. Instalar dependências:
```bash
pip install -r requirements.txt
```

2. Configurar variáveis de ambiente (criar `.env`):
```
DATABASE_URL=postgresql://user:password@localhost/nelo_db
```

3. Executar ingestão:
```bash
python -m backend.data_ingestion.folha_ia.ingest
```

## Fases de Desenvolvimento

- **FASE 1**: Modelo de dados inferido do Excel ✅
- **FASE 2**: Ingestão e limpeza ✅
- **FASE 3**: Feature engineering básico ✅
- **FASE 4**: Hooks para modelos ML/APS ✅
- **FASE 5**: Testes e documentação ✅

## Módulos PRODPLAN 4.0

O sistema está preparado para suportar os seguintes módulos (casos de teste documentados):

- **Módulo 1**: PRODPLAN (Planeamento, Shopfloor, Máquinas)
- **Módulo 2**: SMARTINVENTORY (Stock, MRP, ROP, WIP, Spares)
- **Módulo 3**: DUPLIOS (PDM, DPP, LCA, TRUST, Compliance, ESG)
- **Módulo 4**: DIGITAL TWIN (Máquinas & Produto, PredictiveCare)
- **Módulo 5**: INTELIGÊNCIA (Causal, Otimização, What-If, ZDM)
- **Módulo 6**: R&D (WP1–WP4 + WPX)
- **Módulo 7**: PREVENÇÃO DE ERROS (Guard PDM + Shopfloor)
- **Módulo 8**: CHAT / COPILOT

Ver `docs/test_cases_prodplan.md` para casos de teste detalhados.

