# DATA RELATIONSHIP MAP - Modelo Relacional Final

**Data:** 2024-12-13  
**Sistema:** PRODPLAN 4.0 OS  
**Base de Dados:** SQLite (desenvolvimento) / PostgreSQL (produção)

---

## DIAGRAMA RELACIONAL (Texto)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CORE ENTITIES                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Products   │         │    Phases     │         │   Workers    │
│──────────────│         │──────────────│         │──────────────│
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ product_code │◄──┐     │ phase_code   │◄──┐     │ worker_code   │◄──┐
│ name         │   │     │ name         │   │     │ name         │   │
│ weight       │   │     │ sequence_...│   │     │ active       │   │
└──────────────┘   │     └──────────────┘   │     └──────────────┘   │
       │           │            │           │            │           │
       │ 1:N       │            │ N:M       │            │ N:M       │
       │           │            │           │            │           │
┌──────────────┐   │     ┌──────────────┐  │     ┌──────────────┐  │
│    Orders    │   │     │ProductPhase  │  │     │WorkerPhase   │  │
│──────────────│   │     │  Standards   │  │     │   Skills     │  │
│ id (PK)      │   │     │──────────────│  │     │──────────────│  │
│ of_id (UK)   │   │     │ product_id   │──┘     │ worker_id    │──┘
│ product_id   │───┘     │ phase_id     │──┐     │ phase_id     │──┐
│ creation_... │         │ sequence_... │  │     │ certified    │  │
│ completion_..│         │ coeficiente  │  │     │ cert_date    │  │
└──────────────┘         └──────────────┘  │     └──────────────┘  │
       │                                    │                       │
       │ 1:N                                │                       │
       │                                    │                       │
┌──────────────┐                           │                       │
│ Order Phases │                           │                       │
│──────────────│                           │                       │
│ id (PK)      │                           │                       │
│ fase_of_id   │                           │                       │
│ of_id (FK)   │───────────────────────────┘                       │
│ phase_id (FK)│───────────────────────────────────────────────────┘
│ start_date   │
│ end_date     │
│ coeficiente  │
│ peso         │
│ turno        │
└──────────────┘
       │
       │ 1:N
       │
┌──────────────────────────┐         ┌──────────────────────────┐
│  Order Phase Workers      │         │      Order Errors         │
│──────────────────────────│         │──────────────────────────│
│ order_phase_id (FK)      │         │ order_id (FK)             │
│ worker_id (FK)           │─────────│ order_phase_id (FK, opt)  │
│ is_chefe                 │         │ error_description         │
│ role                     │         │ severity                  │
└──────────────────────────┘         └──────────────────────────┘
```

---

## ENTIDADES E RELAÇÕES

### 1. Products (Modelos)
**Tabela:** `products`  
**Chave Primária:** `id` (Integer, auto-increment)  
**Chave Natural Única:** `product_code` (String)

**Campos Críticos:**
- `product_code`: Código único do produto (ex: "20168")
- `name`: Nome do produto
- `weight`: Peso (Numeric)

**Relações:**
- **1:N** → `Order` (um produto pode ter múltiplas ordens)
- **N:M** → `Phase` via `ProductPhaseStandard` (roteiros padrão)

**Constraints:**
- `UNIQUE(product_code)`
- `NOT NULL(product_code, name)`

---

### 2. Phases (Fases)
**Tabela:** `phases`  
**Chave Primária:** `id` (Integer, auto-increment)  
**Chave Natural Única:** `phase_code` (String)

**Campos Críticos:**
- `phase_code`: Código único da fase (ex: "1", "2")
- `name`: Nome da fase (ex: "Laminagem", "Cura")
- `sequence_order`: Ordem padrão na sequência

**Relações:**
- **1:N** → `OrderPhase` (uma fase aparece em múltiplas fases de ordens)
- **N:M** → `Product` via `ProductPhaseStandard` (roteiros)
- **N:M** → `Worker` via `WorkerPhaseSkill` (competências)

**Constraints:**
- `UNIQUE(phase_code)`
- `NOT NULL(phase_code, name)`

---

### 3. Workers (Funcionarios)
**Tabela:** `workers`  
**Chave Primária:** `id` (Integer, auto-increment)  
**Chave Natural Única:** `worker_code` (String)

**Campos Críticos:**
- `worker_code`: Código único do trabalhador (ex: "20343")
- `name`: Nome do trabalhador
- `active`: Boolean (ativo/inativo)

**Relações:**
- **N:M** → `Phase` via `WorkerPhaseSkill` (competências)
- **N:M** → `OrderPhase` via `OrderPhaseWorker` (atribuições)

**Constraints:**
- `UNIQUE(worker_code)`
- `NOT NULL(worker_code)`

---

### 4. Orders (OrdensFabrico)
**Tabela:** `orders`  
**Chave Primária:** `id` (Integer, auto-increment)  
**Chave Natural Única:** `of_id` (String)

**Campos Críticos:**
- `of_id`: ID original da ordem (ex: "13949")
- `product_id`: FK para `products.id` (nullable)
- `creation_date`: Data de criação
- `completion_date`: Data de conclusão

**Relações:**
- **N:1** → `Product` (muitas ordens para um produto)
- **1:N** → `OrderPhase` (uma ordem tem múltiplas fases)
- **1:N** → `OrderError` (uma ordem pode ter múltiplos erros)

**Constraints:**
- `UNIQUE(of_id)`
- `NOT NULL(of_id)`
- `FOREIGN KEY(product_id) REFERENCES products(id)`

---

### 5. OrderPhase (FasesOrdemFabrico)
**Tabela:** `order_phases`  
**Chave Primária:** `id` (Integer, auto-increment)  
**Chave Natural Única:** `fase_of_id` (String)

**Campos Críticos:**
- `fase_of_id`: ID original da fase da ordem (ex: "810177")
- `of_id`: FK para `orders.id` (NOT NULL)
- `phase_id`: FK para `phases.id` (nullable)
- `start_date`: Data de início real
- `end_date`: Data de fim real
- `planned_start`: Data prevista início
- `coeficiente`: Coeficiente de produção
- `coeficiente_x`: Coeficiente X
- `peso`: Peso processado
- `turno`: Turno (1, 2, 3)
- `sequence_order`: Ordem na sequência da ordem

**Relações:**
- **N:1** → `Order` (múltiplas fases pertencem a uma ordem)
- **N:1** → `Phase` (múltiplas fases de ordem referenciam um tipo de fase)
- **1:N** → `OrderPhaseWorker` (uma fase pode ter múltiplos trabalhadores)
- **1:N** → `OrderError` (uma fase pode ter múltiplos erros)

**Constraints:**
- `UNIQUE(fase_of_id)`
- `NOT NULL(fase_of_id, of_id)`
- `FOREIGN KEY(of_id) REFERENCES orders(id)`
- `FOREIGN KEY(phase_id) REFERENCES phases(id)`
- `CHECK(end_date >= start_date)` (validação lógica)

---

### 6. ProductPhaseStandard (FasesStandardModelos)
**Tabela:** `product_phase_standards`  
**Chave Primária:** `id` (Integer, auto-increment)  
**Chave Composta Única:** `(product_id, phase_id, sequence_order)`

**Campos Críticos:**
- `product_id`: FK para `products.id` (NOT NULL)
- `phase_id`: FK para `phases.id` (NOT NULL)
- `sequence_order`: Ordem na sequência (NOT NULL)
- `coeficiente`: Coeficiente padrão
- `coeficiente_x`: Coeficiente X padrão

**Relações:**
- **N:1** → `Product` (múltiplos standards para um produto)
- **N:1** → `Phase` (múltiplos standards referenciam uma fase)

**Constraints:**
- `NOT NULL(product_id, phase_id, sequence_order)`
- `FOREIGN KEY(product_id) REFERENCES products(id)`
- `FOREIGN KEY(phase_id) REFERENCES phases(id)`
- `UNIQUE(product_id, phase_id, sequence_order)` (implicitamente)

---

### 7. WorkerPhaseSkill (FuncionariosFasesAptos)
**Tabela:** `worker_phase_skills`  
**Chave Primária:** `id` (Integer, auto-increment)  
**Chave Composta Única:** `(worker_id, phase_id)`

**Campos Críticos:**
- `worker_id`: FK para `workers.id` (NOT NULL)
- `phase_id`: FK para `phases.id` (NOT NULL)
- `certified`: Boolean (certificado para esta fase)
- `certification_date`: Data de certificação

**Relações:**
- **N:1** → `Worker` (múltiplas competências para um trabalhador)
- **N:1** → `Phase` (múltiplas competências referenciam uma fase)

**Constraints:**
- `NOT NULL(worker_id, phase_id)`
- `FOREIGN KEY(worker_id) REFERENCES workers(id)`
- `FOREIGN KEY(phase_id) REFERENCES phases(id)`
- `UNIQUE(worker_id, phase_id)` (implicitamente)

---

### 8. OrderPhaseWorker (FuncionariosFaseOrdemFabrico)
**Tabela:** `order_phase_workers`  
**Chave Primária:** `id` (Integer, auto-increment)  
**Chave Composta Única:** `(order_phase_id, worker_id)`

**Campos Críticos:**
- `order_phase_id`: FK para `order_phases.id` (NOT NULL)
- `worker_id`: FK para `workers.id` (NOT NULL)
- `is_chefe`: String ("0"/"1" ou "sim"/"não")
- `role`: String ("chefe" ou "trabalhador")

**Relações:**
- **N:1** → `OrderPhase` (múltiplos trabalhadores numa fase)
- **N:1** → `Worker` (um trabalhador pode estar em múltiplas fases)

**Constraints:**
- `NOT NULL(order_phase_id, worker_id)`
- `FOREIGN KEY(order_phase_id) REFERENCES order_phases(id)`
- `FOREIGN KEY(worker_id) REFERENCES workers(id)`
- `UNIQUE(order_phase_id, worker_id)` (implicitamente)

---

### 9. OrderError (OrdemFabricoErros)
**Tabela:** `order_errors`  
**Chave Primária:** `id` (Integer, auto-increment)  
**Sem chave natural única** (múltiplos erros por ordem/fase)

**Campos Críticos:**
- `order_id`: FK para `orders.id` (NOT NULL)
- `order_phase_id`: FK para `order_phases.id` (nullable)
- `error_description`: Text (descrição do erro)
- `severity`: String (gravidade: "1", "2", "3" ou "alta", "média", "baixa")
- `fase_avaliacao`: String (código da fase de avaliação)
- `fase_of_avaliacao_id`: String (FaseOf_Id da fase avaliada)
- `fase_of_culpada_id`: String (FaseOf_Id da fase culpada)

**Relações:**
- **N:1** → `Order` (múltiplos erros para uma ordem)
- **N:1** → `OrderPhase` (múltiplos erros para uma fase, opcional)

**Constraints:**
- `NOT NULL(order_id)`
- `FOREIGN KEY(order_id) REFERENCES orders(id)`
- `FOREIGN KEY(order_phase_id) REFERENCES order_phases(id)`

---

## CARDINALIDADES RESUMIDAS

| Entidade A | Relação | Entidade B | Tipo | Tabela Ponte |
|------------|---------|-----------|------|--------------|
| Product | 1:N | Order | FK | - |
| Product | N:M | Phase | Many-to-Many | ProductPhaseStandard |
| Phase | 1:N | OrderPhase | FK | - |
| Order | 1:N | OrderPhase | FK | - |
| OrderPhase | N:M | Worker | Many-to-Many | OrderPhaseWorker |
| Worker | N:M | Phase | Many-to-Many | WorkerPhaseSkill |
| Order | 1:N | OrderError | FK | - |
| OrderPhase | 1:N | OrderError | FK (opcional) | - |

---

## ÍNDICES E PERFORMANCE

### Índices Existentes (via SQLAlchemy)

**Primary Keys (automáticos):**
- Todas as tabelas têm `id` como PK com índice automático

**Unique Indexes:**
- `products.product_code`
- `phases.phase_code`
- `workers.worker_code`
- `orders.of_id`
- `order_phases.fase_of_id`

**Foreign Key Indexes:**
- `orders.product_id`
- `order_phases.of_id`
- `order_phases.phase_id`
- `order_phase_workers.order_phase_id`
- `order_phase_workers.worker_id`
- `order_errors.order_id`
- `order_errors.order_phase_id`
- `product_phase_standards.product_id`
- `product_phase_standards.phase_id`
- `worker_phase_skills.worker_id`
- `worker_phase_skills.phase_id`

**Índices Recomendados (futuros):**
- `order_phases.start_date` (para queries temporais)
- `order_phases.end_date` (para queries temporais)
- `orders.creation_date` (para queries temporais)
- `orders.completion_date` (para queries temporais)
- `(order_phases.of_id, order_phases.sequence_order)` (composite, para ordenação)

---

## VALIDAÇÕES DE INTEGRIDADE

### 1. Referential Integrity (Orphans)
- ✅ Nenhum `OrderPhase` sem `Order` correspondente
- ✅ Nenhum `OrderPhaseWorker` sem `OrderPhase` correspondente
- ✅ Nenhum `OrderError` sem `Order` correspondente
- ✅ Nenhum `ProductPhaseStandard` sem `Product` ou `Phase` correspondente
- ✅ Nenhum `WorkerPhaseSkill` sem `Worker` ou `Phase` correspondente

### 2. Unique Constraints
- ✅ `product_code` único em `products`
- ✅ `phase_code` único em `phases`
- ✅ `worker_code` único em `workers`
- ✅ `of_id` único em `orders`
- ✅ `fase_of_id` único em `order_phases`
- ✅ `(product_id, phase_id, sequence_order)` único em `product_phase_standards`
- ✅ `(worker_id, phase_id)` único em `worker_phase_skills`
- ✅ `(order_phase_id, worker_id)` único em `order_phase_workers`

### 3. Data Consistency
- ✅ `end_date >= start_date` em `order_phases`
- ✅ `completion_date >= creation_date` em `orders`
- ✅ `duration_minutes >= 0` em `order_phases`
- ✅ `quantity >= 0` em `orders`
- ✅ `coeficiente >= 0` e `coeficiente_x >= 0` onde aplicável

---

## COMANDOS DE VALIDAÇÃO

```bash
# Executar validação completa
python3 scripts/validate_data_integrity.py

# Verificar contagens
python3 -c "
from backend.models.database import get_session
from backend.models import *
s = get_session()
print('Orders:', s.query(Order).count())
print('OrderPhases:', s.query(OrderPhase).count())
print('Products:', s.query(Product).count())
print('Phases:', s.query(Phase).count())
print('Workers:', s.query(Worker).count())
"
```

---

**Última Atualização:** 2024-12-13  
**Versão do Modelo:** 1.0


