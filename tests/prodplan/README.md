# Test Cases for PRODPLAN 4.0

Este diretório contém os testes para os módulos do PRODPLAN 4.0.

## Estrutura

- `test_module1_prodplan.py` - Módulo 1: Planeamento, Shopfloor, Máquinas
- `test_module2_smartinventory.py` - Módulo 2: Stock, MRP, ROP, WIP, Spares
- `test_module3_duplios.py` - Módulo 3: PDM, DPP, LCA, TRUST, Compliance (a criar)
- `test_module4_digital_twin.py` - Módulo 4: Digital Twin, PredictiveCare (a criar)
- `test_module5_intelligence.py` - Módulo 5: Causal, Otimização, What-If (a criar)
- `test_module6_rd.py` - Módulo 6: R&D (WP1-WP4) (a criar)
- `test_module7_error_prevention.py` - Módulo 7: Prevenção de Erros (a criar)
- `test_module8_chat_copilot.py` - Módulo 8: Chat/Copilot

## Executar Testes

```bash
# Todos os testes
pytest tests/prodplan/

# Módulo específico
pytest tests/prodplan/test_module1_prodplan.py

# Teste específico
pytest tests/prodplan/test_module1_prodplan.py::TestA1_PlanningRespectsPrecedences
```

## Status

Atualmente, todos os testes estão marcados como `@pytest.mark.skip` porque as funcionalidades ainda não foram implementadas. Conforme os módulos forem desenvolvidos, os testes serão implementados e ativados.

## Integração com Base de Dados

Os testes podem usar a base de dados criada no CONTRATO 23:
- Modelos de dados (Orders, Phases, Workers, etc.)
- Feature engineering (lead times, durações, gargalos)
- Serviços de predição baseline


