# TEST CASES – REGRAS DE NEGÓCIO PRODPLAN 4.0

Este documento contém os casos de teste para validação das regras de negócio do sistema PRODPLAN 4.0.

## Índice

- [Módulo 1 – PRODPLAN (Planeamento, Shopfloor, Máquinas)](#módulo-1--prodplan)
- [Módulo 2 – SMARTINVENTORY (Stock, MRP, ROP, WIP, Spares)](#módulo-2--smartinventory)
- [Módulo 3 – DUPLIOS (PDM, DPP, LCA, TRUST, Compliance, ESG, Fornecedores)](#módulo-3--duplios)
- [Módulo 4 – DIGITAL TWIN (Máquinas & Produto, PredictiveCare)](#módulo-4--digital-twin)
- [Módulo 5 – INTELIGÊNCIA (Causal, Otimização, What-If Avançado, ZDM)](#módulo-5--inteligência)
- [Módulo 6 – R&D (WP1–WP4 + WPX)](#módulo-6--rd)
- [Módulo 7 – PREVENÇÃO DE ERROS (Guard PDM + Shopfloor)](#módulo-7--prevenção-de-erros)
- [Módulo 8 – CHAT / COPILOT](#módulo-8--chat--copilot)

---

## MÓDULO 1 – PRODPLAN

### A1 – Planeamento respeita precedências e capacidade

**ID:** A1  
**Módulo:** PRODPLAN  
**Prioridade:** Alta

**Pré-condições:**
- Existem ordens com várias operações (OP10, OP20, OP30).
- Cada operação tem máquina e tempo definido.

**Passos:**
1. Carregar ordens para o sistema.
2. Correr "Recalcular plano".

**Resultado esperado:**
- Nenhuma operação de uma ordem começa antes da operação anterior acabar.
- Nenhuma máquina tem duas operações a correr em simultâneo.

**Status:** ⏳ Pendente

---

### A2 – Prioridade e data de entrega afetam ordem de sequenciação

**ID:** A2  
**Módulo:** PRODPLAN  
**Prioridade:** Alta

**Pré-condições:**
- Duas ordens (A e B) usam a mesma máquina.
- A com data de entrega mais cedo e prioridade maior.

**Passos:**
1. Recalcular plano com heurística normal (EDD/priority).

**Resultado esperado:**
- Ordem A aparece antes de B no Gantt.
- Se trocar prioridades/datas, o comportamento inverte-se de forma coerente.

**Status:** ⏳ Pendente

---

### A3 – Tempos "data-driven" alteram o plano

**ID:** A3  
**Módulo:** PRODPLAN  
**Prioridade:** Média

**Pré-condições:**
- Existem logs reais de execução com tempos bem diferentes dos tempos padrão.

**Passos:**
1. Recalcular plano com "usar tempos históricos" desligado.
2. Recalcular com "usar tempos históricos" ligado.

**Resultado esperado:**
- Duração de operações ajusta-se para mais realista.
- O plano muda (datas de início/fim, OTD) de forma coerente com esses tempos.

**Status:** ⏳ Pendente

---

### A4 – Simulação VIP reduz atraso da ordem marcada

**ID:** A4  
**Módulo:** PRODPLAN  
**Prioridade:** Média

**Pré-condições:**
- Ordem X está em atraso no plano base.

**Passos:**
1. Correr plano base.
2. Marcar ordem X como VIP.
3. Recalcular / simular VIP.

**Resultado esperado:**
- Ordem X passa para posição mais favorável nas máquinas críticas.
- Atraso de X reduz ou desaparece.
- Se necessário, outras ordens sacrificadas (trade-off visível nos KPIs).

**Status:** ⏳ Pendente

---

### A5 – Simulação de avaria retira capacidade e ajusta plano

**ID:** A5  
**Módulo:** PRODPLAN  
**Prioridade:** Média

**Pré-condições:**
- Plano calculado com carga na máquina M1.

**Passos:**
1. Simular avaria de M1 num intervalo de tempo.
2. Recalcular.

**Resultado esperado:**
- Intervalo de avaria aparece como indisponível no Gantt.
- Operações de M1 são movidas antes/depois ou para alternativas, se existirem.
- KPIs (atrasos, makespan) refletem pior desempenho.

**Status:** ⏳ Pendente

---

### A6 – Registos de Shopfloor alimentam tempos reais e WIP

**ID:** A6  
**Módulo:** PRODPLAN  
**Prioridade:** Alta

**Pré-condições:**
- Ordem com rota definida.

**Passos:**
1. Operador faz Start/Pause/Stop da ordem no Shopfloor.
2. Regista quantidade boa e sucata.

**Resultado esperado:**
- É criado registo de execução (tempos reais, quantidades).
- Estes dados são usados em DataDrivenDurations em planos futuros.
- Estado WIP da ordem/fase é atualizado.

**Status:** ⏳ Pendente

---

### A7 – Aba Máquinas mostra estado completo dos equipamentos

**ID:** A7  
**Módulo:** PRODPLAN  
**Prioridade:** Média

**Pré-condições:**
- Máquinas com dados de produção e, se existir, de sensores.

**Passos:**
1. Abrir ProdPlan → tab "Máquinas".

**Resultado esperado:**
- Para cada máquina:
  - estado (Healthy/Warning/Critical),
  - SHI (se disponível), RUL (se disponível),
  - horas de paragem recentes,
  - próximas manutenções planeadas,
  - OEE simples ou indicador básico de desempenho.
- Não falta nenhuma máquina que exista no modelo.

**Status:** ⏳ Pendente

---

## MÓDULO 2 – SMARTINVENTORY

### B1 – Cálculo de ROP clássico correto

**ID:** B1  
**Módulo:** SMARTINVENTORY  
**Prioridade:** Alta

**Pré-condições:**
- SKU com μ (consumo médio/dia), σ (desvio standard), L (lead time dias), nível serviço (z).

**Passos:**
1. Calcular ROP.

**Resultado esperado:**
- ROP = μ * L + z * σ * √L (aproximadamente, dentro de erro esperado).

**Status:** ⏳ Pendente

---

### B2 – Probabilidade de rutura 30 dias faz sentido

**ID:** B2  
**Módulo:** SMARTINVENTORY  
**Prioridade:** Alta

**Pré-condições:**
- SKU com stock S0 e parâmetros de consumo.

**Passos:**
1. Correr função de "Risco 30d".

**Resultado esperado:**
- Se S0 muito alto → risco próximo de 0.
- Se S0 muito baixo → risco próximo de 1.
- Valores sempre entre 0 e 1.

**Status:** ⏳ Pendente

---

### B3 – MRP gera ordens planeadas respeitando MOQ e múltiplos

**ID:** B3  
**Módulo:** SMARTINVENTORY  
**Prioridade:** Alta

**Pré-condições:**
- BOM A→B (2 unidades de B por A).
- Ordem de A: qty 100.
- Stock B: 50; MOQ B: 200; múltiplo: 50.

**Passos:**
1. Correr MRP.

**Resultado esperado:**
- Necessidade líquida de B = 100*2 - 50 = 150.
- Ordem planeada para B = 200 (respeita MOQ e múltiplo).

**Status:** ⏳ Pendente

---

### B4 – ABC/XYZ classifica SKUs corretamente

**ID:** B4  
**Módulo:** SMARTINVENTORY  
**Prioridade:** Média

**Pré-condições:**
- 3 SKUs com consumo/valor diferentes.

**Passos:**
1. Correr classificação ABC/XYZ.

**Resultado esperado:**
- SKU mais relevante em valor → A.
- Menos relevante → C.
- XYZ condiz com variabilidade (baixa variação = X, alta = Z).

**Status:** ⏳ Pendente

---

### B5 – WIP é reconstruído dos movimentos internos / logs

**ID:** B5  
**Módulo:** SMARTINVENTORY  
**Prioridade:** Alta

**Pré-condições:**
- Movimentos internos (ou logs Shopfloor) de entrada/saída de fases.

**Passos:**
1. Correr cálculo de WIP.

**Resultado esperado:**
- Para cada ordem:
  - fase atual determinada,
  - percentagem concluída coerente,
  - sem "buracos" lógicos (não aparecer em fases impossíveis).

**Status:** ⏳ Pendente

---

### B6 – Previsão de spares baseada em RUL

**ID:** B6  
**Módulo:** SMARTINVENTORY  
**Prioridade:** Média

**Pré-condições:**
- Peça sobresselente P associada à máquina M.
- RUL da máquina/peça indica substituição em breve.

**Passos:**
1. Correr previsão de necessidades de spares.

**Resultado esperado:**
- Sistema aponta necessidade de P em determinado horizonte.
- MRP incorpora esse pedido como demanda adicional para P.

**Status:** ⏳ Pendente

---

## MÓDULO 3 – DUPLIOS

### C1 – PDM impede release de revisão incompleta

**ID:** C1  
**Módulo:** DUPLIOS  
**Prioridade:** Alta

**Pré-condições:**
- Revisão Draft de um produto sem BOM/ou sem routing/ou sem docs.

**Passos:**
1. Tentar libertar revisão (Release).

**Resultado esperado:**
- Sistema recusa release.
- Lista erros concretos (ex.: "BOM em falta", "Routing em falta", "Desenho técnico em falta").

**Status:** ⏳ Pendente

---

### C2 – Trust Index aumenta quando passamos de estimado para medido/auditado

**ID:** C2  
**Módulo:** DUPLIOS  
**Prioridade:** Alta

**Pré-condições:**
- DPP com CO₂ estimado (uncertainty alta).

**Passos:**
1. Inserir valor de CO₂ medido, com metadados de auditoria.
2. Recalcular Trust Index.

**Resultado esperado:**
- Score global de Trust aumenta.
- Campo CO₂ passa a classificado como MEDIDO/VERIFICADO.
- Incerteza baixa.

**Status:** ⏳ Pendente

---

### C3 – Gap Filling Lite preenche campos em falta com flag correto

**ID:** C3  
**Módulo:** DUPLIOS  
**Prioridade:** Média

**Pré-condições:**
- DPP sem CO₂/água, mas com composição/material.

**Passos:**
1. Clicar "Preencher automaticamente (estimativa)".

**Resultado esperado:**
- CO₂/água são preenchidos por cálculo (fatores médios).
- Metadados do campo marcam "source = estimated".
- Trust Index reflete penalização de incerteza.

**Status:** ⏳ Pendente

---

### C4 – Compliance Radar destaca gaps regulatórios

**ID:** C4  
**Módulo:** DUPLIOS  
**Prioridade:** Alta

**Pré-condições:**
- DPP de categoria onde ESPR se aplica, com falta de reciclabilidade%.

**Passos:**
1. Abrir secção de compliance.

**Resultado esperado:**
- ESPR score < 100.
- Lista de gaps inclui "recyclability_percent em falta".
- CBAM/CSRD só avaliados se categoria aplicável.

**Status:** ⏳ Pendente

---

### C5 – Smart Questioning atualiza DPP e melhora Trust

**ID:** C5  
**Módulo:** DUPLIOS  
**Prioridade:** Média

**Pré-condições:**
- DPP depende de fornecedor F sem dados de CO₂.

**Passos:**
1. Enviar questionário a F.
2. Fornecedor responde (valor + metodologia).
3. Recalcular DPP/Trust.

**Resultado esperado:**
- Campo de CO₂ desse componente é preenchido.
- Trust Index do DPP aumenta.
- Fornecedor passa a ter registo de resposta.

**Status:** ⏳ Pendente

---

### C6 – Foresight (cenário ESG) não altera dados reais

**ID:** C6  
**Módulo:** DUPLIOS  
**Prioridade:** Média

**Pré-condições:**
- DPP com CO₂ calculado.

**Passos:**
1. Correr cenário "mudar fornecedor" ou "100% energia renovável".

**Resultado esperado:**
- UI mostra CO₂ "scenario" diferente.
- Dados base do DPP permanecem inalterados (cenário é só simulação).

**Status:** ⏳ Pendente

---

## MÓDULO 4 – DIGITAL TWIN

### D1 – SHI (Smart Health Index) fica sempre entre 0 e 100

**ID:** D1  
**Módulo:** DIGITAL TWIN  
**Prioridade:** Alta

**Pré-condições:**
- Máquinas com dados de sensores ou proxies.

**Passos:**
1. Calcular SHI para cada máquina.

**Resultado esperado:**
- Valores em [0,100].
- Máquinas saudáveis → SHI alto.
- Máquinas com anomalias → SHI mais baixo.

**Status:** ⏳ Pendente

---

### D2 – RUL não é negativo e tende a diminuir com o uso

**ID:** D2  
**Módulo:** DIGITAL TWIN  
**Prioridade:** Alta

**Pré-condições:**
- Máquina em operação normal.

**Passos:**
1. Ler RUL em T0.
2. Simular avanço de tempo ou novas leituras sem manutenção.

**Resultado esperado:**
- RUL >= 0.
- RUL(T1) <= RUL(T0) (monotonia geral), salvo reset/maintenance.

**Status:** ⏳ Pendente

---

### D3 – Anomalia forte dispara alerta PredictiveCare

**ID:** D3  
**Módulo:** DIGITAL TWIN  
**Prioridade:** Alta

**Pré-condições:**
- Dados de sensores mostram pico (vibração extrema, temperatura fora de norma).

**Passos:**
1. Ingerir dados e correr motor PredictiveCare.

**Resultado esperado:**
- Risco de falha a curto prazo sobe.
- Sistema gera ordem de manutenção preditiva com prioridade alta.
- Aparece na aba Máquinas e/ou módulo de manutenção.

**Status:** ⏳ Pendente

---

### D4 – XAI-DT identifica desvios e sugere causa provável

**ID:** D4  
**Módulo:** DIGITAL TWIN  
**Prioridade:** Média

**Pré-condições:**
- CAD + scan 3D de peça com desvio significativo numa zona.

**Passos:**
1. Correr análise XAI-DT para essa peça.

**Resultado esperado:**
- Deviation Score > 0.
- Heatmap de desvio mostra zona problemática.
- Lista de causas prováveis (ex.: desgaste de ferramenta, erro de fixação) com sugestões de ação.

**Status:** ⏳ Pendente

---

## MÓDULO 5 – INTELIGÊNCIA

### E1 – Causal OLS devolve efeito coerente

**ID:** E1  
**Módulo:** INTELIGÊNCIA  
**Prioridade:** Média

**Pré-condições:**
- Dataset simples onde se sabe que aumentar setups aumenta custo/tempo.

**Passos:**
1. Pedir efeito do treatment "setup_frequency" no outcome "makespan" usando método OLS.

**Resultado esperado:**
- Beta1 (coeficiente) com sinal concordante com intuição (positivo se mais setups aumentam makespan).
- IC e p-value calculados, sem erros.

**Status:** ⏳ Pendente

---

### E2 – DML faz fallback para OLS em caso de falha

**ID:** E2  
**Módulo:** INTELIGÊNCIA  
**Prioridade:** Média

**Pré-condições:**
- Ambiente sem libs avançadas ou com erro interno.

**Passos:**
1. Pedir causal effect com método "DML".

**Resultado esperado:**
- Se DML funcionar, devolve ATE.
- Se falhar, o sistema recai para OLS, loga aviso, não crasha.

**Status:** ⏳ Pendente

---

### E3 – What-If avançado altera KPIs globais de forma coerente

**ID:** E3  
**Módulo:** INTELIGÊNCIA  
**Prioridade:** Alta

**Pré-condições:**
- Plano e inventário base.

**Passos:**
1. Correr cenário "+1 turno por semana" ou "reduzir procura de família X".

**Resultado esperado:**
- KPIs agregados (throughput, lead time, OTD global) ajustam de forma lógica.
- Nenhuma restrição base é violada (não aparece produção fora de calendário, etc.).

**Status:** ⏳ Pendente

---

## MÓDULO 6 – R&D

### F1 – WP1 compara políticas de routing e regista resultado

**ID:** F1  
**Módulo:** R&D  
**Prioridade:** Média

**Passos:**
1. Correr WP1 com policies [FIFO, SPT, EDD, MILP, CP-SAT].

**Resultado esperado:**
- Para cada política: KPIs calculados.
- Melhor política identificada (best_policy).
- Experimento registado em R&D (rd_experiments + tabela WP1).

**Status:** ⏳ Pendente

---

### F2 – WP2 classifica sugestões IA como boas/neutras/más

**ID:** F2  
**Módulo:** R&D  
**Prioridade:** Média

**Passos:**
1. Clicar "Evaluate All Suggestions".

**Resultado esperado:**
- Para cada sugestão: cálculo de delta de KPIs (antes/depois).
- Label BENEFICIAL/NEUTRAL/HARMFUL atribuída.
- Resumo global (% de cada categoria).

**Status:** ⏳ Pendente

---

### F3 – WP3 compara políticas de inventário (Conservative/Baseline/Lean)

**ID:** F3  
**Módulo:** R&D  
**Prioridade:** Média

**Passos:**
1. Correr WP3.

**Resultado esperado:**
- KPIs por política (stock médio, custo, stockouts, OTD).
- Ranking de políticas claro.
- Experimento registado.

**Status:** ⏳ Pendente

---

### F4 – WP4 (Learning Scheduler) atualiza bandit e regret

**ID:** F4  
**Módulo:** R&D  
**Prioridade:** Média

**Passos:**
1. Correr WP4 com bandit configurado (ex.: epsilon-greedy) por N episódios.

**Resultado esperado:**
- Reward médio por política,
- Regret médio,
- Melhor política aprendida,
- Registos guardados em WP4.

**Status:** ⏳ Pendente

---

## MÓDULO 7 – PREVENÇÃO DE ERROS

### G1 – PDM Guard bloqueia release quando regras são violadas

**ID:** G1  
**Módulo:** PREVENÇÃO DE ERROS  
**Prioridade:** Alta

**Pré-condições:**
- Revisão com BOM/routing incompletos, ou sem docs obrigatórios.

**Passos:**
1. Tentar libertar revisão.

**Resultado esperado:**
- Release bloqueado.
- Lista de problemas concreta (não mensagem genérica).

**Status:** ⏳ Pendente

---

### G2 – Shopfloor Guard impede arranque com material errado

**ID:** G2  
**Módulo:** PREVENÇÃO DE ERROS  
**Prioridade:** Alta

**Pré-condições:**
- OP com BOM conhecida.

**Passos:**
1. Operador escaneia material diferente do exigido.
2. Tenta iniciar OP.

**Resultado esperado:**
- Sistema bloqueia início, indica "material incorreto".

**Status:** ⏳ Pendente

---

### G3 – Modelo de risco de defeito assinala OP de alto risco

**ID:** G3  
**Módulo:** PREVENÇÃO DE ERROS  
**Prioridade:** Média

**Pré-condições:**
- ML de risco treinado com dados históricos.

**Passos:**
1. Criar OP com combinação produto+máquina+turno marcada como "alto risco" no modelo.

**Resultado esperado:**
- OP recebe flag de "alta probabilidade de defeito".
- Sistema sugere mitigação (ex.: inspeção extra, mudar máquina, etc.).

**Status:** ⏳ Pendente

---

## MÓDULO 8 – CHAT / COPILOT

### H1 – Pergunta sobre gargalos devolve máquina correta

**ID:** H1  
**Módulo:** CHAT/COPILOT  
**Prioridade:** Alta

**Passos:**
1. No Chat: "Onde está o gargalo hoje?"

**Resultado esperado:**
- Chat chama serviço de gargalos.
- Resposta indica máquina/célula gargalo e fila aproximada.

**Status:** ⏳ Pendente

---

### H2 – Pergunta sobre stock em risco usa SmartInventory

**ID:** H2  
**Módulo:** CHAT/COPILOT  
**Prioridade:** Alta

**Passos:**
1. No Chat: "Quais SKUs com risco de rutura nos próximos 30 dias?"

**Resultado esperado:**
- Chat chama serviço de risco 30d do SmartInventory.
- Lista SKUs e probabilidade de rutura.

**Status:** ⏳ Pendente

---

### H3 – Pergunta sobre Trust Index produto X usa Duplios

**ID:** H3  
**Módulo:** CHAT/COPILOT  
**Prioridade:** Média

**Passos:**
1. No Chat: "Qual o Trust Index do produto X?"

**Resultado esperado:**
- Chat chama Trust Index do DPP associado a X.
- Devolve score e breve explicação (ex.: "CO₂ medido, água estimada, reciclabilidade desconhecida").

**Status:** ⏳ Pendente

---

## Status Geral

- **Total de casos de teste:** 33
- **Pendentes:** 33
- **Em desenvolvimento:** 0
- **Concluídos:** 0

## Notas

Estes casos de teste serão implementados progressivamente conforme os módulos do PRODPLAN 4.0 forem desenvolvidos. A base de dados criada no CONTRATO 23 fornece a fundação para muitos destes testes.



