# Data Dictionary

**Generated at:** 2025-12-17T14:16:08.663770
**Source file:** /Users/martimnicolau/nelo/data/raw/Folha_IA.xlsx

---

## Sheet: `OrdensFabrico`

- **Row count:** 27,380
- **Column count:** 6

- **Primary key candidates:** Of_Id

### Columns

| Column Name | Type | Null Rate | Null Count | Cardinality | Cardinality Rate | Examples | Min Date | Max Date |
|-------------|------|-----------|------------|-------------|------------------|----------|----------|----------|
| `Of_Id` | string | 0.00% | 0 | 10,000 | 100.00% | 133626, 128959, 137959 | None | None |
| `Of_DataCriacao` | string | 0.00% | 0 | 1,767 | 17.67% | 2025-12-10 14:17:00, 2025-07-03 00:00:00, 2023-... | None | None |
| `Of_DataAcabamento` | string | 0.00% | 0 | 9,417 | 94.17% | 2021-12-09 16:18:00, 2022-06-13 15:36:00, 2022-... | None | None |
| `Of_ProdutoId` | string | 0.00% | 0 | 841 | 8.41% | 27247, 22183, 33741 | None | None |
| `Of_FaseId` | string | 0.00% | 0 | 33 | 0.33% | 20, 76, 42 | None | None |
| `Of_DataTransporte` | string | 0.00% | 0 | 294 | 2.94% | 2021-01-29 00:00:00, 2020-11-27 00:00:00, 2022-... | None | None |

---

## Sheet: `FasesOrdemFabrico`

- **Row count:** 519,079
- **Column count:** 12

- **Primary key candidates:** FaseOf_Id

### Columns

| Column Name | Type | Null Rate | Null Count | Cardinality | Cardinality Rate | Examples | Min Date | Max Date |
|-------------|------|-----------|------------|-------------|------------------|----------|----------|----------|
| `FaseOf_Id` | string | 0.00% | 0 | 10,000 | 100.00% | 2035981, 2004137, 2052336 | None | None |
| `FaseOf_OfId` | string | 0.00% | 0 | 920 | 9.20% | 820026, 27247, 125494 | None | None |
| `FaseOf_Inicio` | string | 0.00% | 0 | 7,249 | 72.49% | 2020-05-21 11:12:00, 2020-05-05 09:31:00, 2020-... | None | None |
| `FaseOf_Fim` | string | 0.00% | 0 | 7,189 | 71.89% | 2020-05-21 11:12:00, 2020-05-05 09:31:00, 2020-... | None | None |
| `FaseOf_DataPrevista` | string | 0.00% | 0 | 105 | 1.05% | 2020-05-04 00:00:00, 2020-02-04 00:00:00, 2020-... | None | None |
| `FaseOf_Coeficiente` | string | 0.00% | 0 | 29 | 0.29% | 2.7, 0.4, 6 | None | None |
| `FaseOf_CoeficienteX` | string | 0.00% | 0 | 15 | 0.15% | 0.75, 0.740740740740741, 1.11 | None | None |
| `FaseOf_FaseId` | string | 0.00% | 0 | 30 | 0.30% | 20, 42, 40 | None | None |
| `FaseOf_Peso` | string | 0.00% | 0 | 757 | 7.57% | 11.45, 7.81, 9.98 | None | None |
| `FaseOf_Retorno` | string | 0.00% | 0 | 2 | 0.02% | 1, 0 | None | None |
| `FaseOf_Turno` | string | 0.00% | 0 | 4 | 0.04% | 2, 1, NULL | None | None |
| `FaseOf_Sequencia` | string | 0.00% | 0 | 32 | 0.32% | 20, 26, 6 | None | None |

---

## Sheet: `FuncionariosFaseOrdemFabrico`

- **Row count:** 423,769
- **Column count:** 3

- **Primary key candidates:** FuncionarioFaseOf_FaseOfId

### Columns

| Column Name | Type | Null Rate | Null Count | Cardinality | Cardinality Rate | Examples | Min Date | Max Date |
|-------------|------|-----------|------------|-------------|------------------|----------|----------|----------|
| `FuncionarioFaseOf_FaseOfId` | string | 0.00% | 0 | 10,000 | 100.00% | 2937985, 2091456, 2945846 | None | None |
| `FuncionarioFaseOf_FuncionarioId` | string | 0.00% | 0 | 134 | 1.34% | 25133, 25049, 24897 | None | None |
| `FuncionarioFaseOf_Chefe` | string | 0.00% | 0 | 2 | 0.02% | 1, 0 | None | None |

---

## Sheet: `OrdemFabricoErros`

- **Row count:** 89,836
- **Column count:** 6

### Columns

| Column Name | Type | Null Rate | Null Count | Cardinality | Cardinality Rate | Examples | Min Date | Max Date |
|-------------|------|-----------|------------|-------------|------------------|----------|----------|----------|
| `Erro_Descricao` | string | 0.00% | 0 | 47 | 0.47% | Pintura Malhada, Pintura com escorridos, Pintur... | None | None |
| `Erro_OfId` | string | 0.00% | 0 | 2,152 | 21.52% | 130226, 800393, 33741 | None | None |
| `Erro_FaseAvaliacao` | string | 0.00% | 0 | 2 | 0.02% | 6, 8 | None | None |
| `OFCH_GRAVIDADE` | string | 0.00% | 0 | 3 | 0.03% | 1, 2, 3 | None | None |
| `Erro_FaseOfAvaliacao` | string | 0.00% | 0 | 2,293 | 22.93% | 2960509, 2244361, 2796363 | None | None |
| `Erro_FaseOfCulpada` | string | 0.00% | 0 | 4,001 | 40.01% | 3481707, 2184218, 3624142 | None | None |

---

## Sheet: `Funcionarios`

- **Row count:** 902
- **Column count:** 3

### Columns

| Column Name | Type | Null Rate | Null Count | Cardinality | Cardinality Rate | Examples | Min Date | Max Date |
|-------------|------|-----------|------------|-------------|------------------|----------|----------|----------|
| `Funcionario_Id` | integer | 0.00% | 0 | 301 | 33.37% | 25133, 32044, 25049 | None | None |
| `Funcionario_Nome` | string | 0.00% | 0 | 301 | 33.37% | z) Eduardo Pereira Pinto, z) Ana de Carvalho Pe... | None | None |
| `Funcionario_Activo` | integer | 0.00% | 0 | 2 | 0.22% | 1, 0 | None | None |

---

## Sheet: `FuncionariosFasesAptos`

- **Row count:** 902
- **Column count:** 3

### Columns

| Column Name | Type | Null Rate | Null Count | Cardinality | Cardinality Rate | Examples | Min Date | Max Date |
|-------------|------|-----------|------------|-------------|------------------|----------|----------|----------|
| `FuncionarioFase_FuncionarioId` | integer | 0.00% | 0 | 301 | 33.37% | 25133, 32044, 25049 | None | None |
| `FuncionarioFase_FaseId` | integer | 0.00% | 0 | 38 | 4.21% | 20, 76, 71 | None | None |
| `FuncionarioFase_Inicio` | date | 0.00% | 0 | 338 | 37.47% | 2019-02-21 00:00:00, 2022-02-07 00:00:00, 2025-... | 1997-08-01T00:00:00 | 2025-12-11T13:08:00 |

---

## Sheet: `Fases`

- **Row count:** 71
- **Column count:** 5

- **Primary key candidates:** Fase_Id, Fase_Nome

### Columns

| Column Name | Type | Null Rate | Null Count | Cardinality | Cardinality Rate | Examples | Min Date | Max Date |
|-------------|------|-----------|------------|-------------|------------------|----------|----------|----------|
| `Fase_Id` | integer | 0.00% | 0 | 71 | 100.00% | 58, 20, 71 | None | None |
| `Fase_Nome` | string | 0.00% | 0 | 71 | 100.00% | CAD, Exterior, Acabamento 2 | None | None |
| `Fase_Sequencia` | integer | 0.00% | 0 | 50 | 70.42% | 20, 26, 42 | None | None |
| `Fase_DeProducao` | integer | 0.00% | 0 | 2 | 2.82% | 1, 0 | None | None |
| `Fase_Automatica` | integer | 0.00% | 0 | 2 | 2.82% | 1, 0 | None | None |

---

## Sheet: `Modelos`

- **Row count:** 894
- **Column count:** 6

- **Primary key candidates:** Produto_Id, Produto_Nome

### Columns

| Column Name | Type | Null Rate | Null Count | Cardinality | Cardinality Rate | Examples | Min Date | Max Date |
|-------------|------|-----------|------------|-------------|------------------|----------|----------|----------|
| `Produto_Id` | integer | 0.00% | 0 | 894 | 100.00% | 27247, 22183, 22475 | None | None |
| `Produto_Nome` | string | 0.00% | 0 | 894 | 100.00% | K2 7 XXL WWR, Viper 44 ST SCS, K1 Vanquish Quat... | None | None |
| `Produto_PesoDesmolde` | float | 0.00% | 0 | 60 | 6.71% | 7.6, 110, 20 | None | None |
| `Produto_PesoAcabamento` | float | 0.00% | 0 | 61 | 6.82% | 6.5, 20, 17.5 | None | None |
| `Produto_QtdGelDeck` | float | 0.00% | 0 | 28 | 3.13% | 1.075, 7.6, 0.9 | None | None |
| `Produto_QtdGelCasco` | float | 0.00% | 0 | 39 | 4.36% | 1.075, 0.9, 0.8 | None | None |

---

## Sheet: `FasesStandardModelos`

- **Row count:** 15,347
- **Column count:** 5

### Columns

| Column Name | Type | Null Rate | Null Count | Cardinality | Cardinality Rate | Examples | Min Date | Max Date |
|-------------|------|-----------|------------|-------------|------------------|----------|----------|----------|
| `ProdutoFase_ProdutoId` | string | 0.00% | 0 | 585 | 5.85% | 27247, 22183, 22475 | None | None |
| `ProdutoFase_FaseId` | string | 0.00% | 0 | 27 | 0.27% | 71, 42, 40 | None | None |
| `ProdutoFase_Sequencia` | string | 0.00% | 0 | 21 | 0.21% | 20, 6, 3 | None | None |
| `ProdutoFase_Coeficiente` | string | 0.00% | 0 | 26 | 0.26% | 2.7, 0.4, 6 | None | None |
| `ProdutoFase_CoeficienteX` | string | 0.00% | 0 | 34 | 0.34% | 1.85185185185185, 1.48148148148148, 3.555555555... | None | None |

---
