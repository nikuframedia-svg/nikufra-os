# Schema Audit for Merge Hardening

Generated automatically from PostgreSQL schema.

## Schemas

- `public`
- `staging`

## Core Tables

### public.erros_ordem_fabrico

**Columns:**
- `erro_id`: integer (int4) NOT NULL
- `ofch_descricao_erro`: text (text) NOT NULL
- `ofch_of_id`: character varying (varchar) NOT NULL
- `ofch_fase_avaliacao`: integer (int4) NULL
- `ofch_gravidade`: integer (int4) NOT NULL
- `ofch_faseof_avaliacao`: character varying (varchar) NULL
- `ofch_faseof_culpada`: character varying (varchar) NULL
- `criado_em`: timestamp with time zone (timestamptz) NOT NULL
- `ofch_id`: integer (int4) NOT NULL
- `ofch_event_time`: timestamp with time zone (timestamptz) NULL
- `ofch_fingerprint`: text (text) NOT NULL

**Primary Key:** erro_id, ofch_of_id


**Unique Indexes:**
- `erros_ordem_fabrico_pkey`: (erro_id, ofch_of_id)
- `ux_erros_ofch_fingerprint`: (ofch_fingerprint, ofch_of_id)

### public.fases_catalogo

**Columns:**
- `fase_id`: integer (int4) NOT NULL
- `fase_nome`: character varying (varchar) NOT NULL
- `fase_sequencia`: integer (int4) NULL
- `fase_de_producao`: integer (int4) NOT NULL
- `fase_automatica`: integer (int4) NOT NULL
- `criado_em`: timestamp with time zone (timestamptz) NOT NULL
- `atualizado_em`: timestamp with time zone (timestamptz) NOT NULL

**Primary Key:** fase_id


**Unique Indexes:**
- `fases_catalogo_pkey`: (fase_id)
- `idx_fases_nome`: (fase_nome)

### public.fases_ordem_fabrico

**Columns:**
- `faseof_id`: character varying (varchar) NOT NULL
- `faseof_of_id`: character varying (varchar) NOT NULL
- `faseof_inicio`: timestamp with time zone (timestamptz) NULL
- `faseof_fim`: timestamp with time zone (timestamptz) NOT NULL
- `faseof_data_prevista`: date (date) NULL
- `faseof_coeficiente`: numeric (numeric) NULL
- `faseof_coeficiente_x`: numeric (numeric) NULL
- `faseof_fase_id`: integer (int4) NULL
- `faseof_peso`: numeric (numeric) NULL
- `faseof_retorno`: integer (int4) NULL
- `faseof_turno`: integer (int4) NULL
- `faseof_sequencia`: integer (int4) NULL
- `faseof_event_time`: timestamp with time zone (timestamptz) NULL
- `faseof_duration_seconds`: numeric (numeric) NULL
- `faseof_is_open`: boolean (bool) NULL
- `faseof_is_done`: boolean (bool) NULL
- `criado_em`: timestamp with time zone (timestamptz) NOT NULL
- `atualizado_em`: timestamp with time zone (timestamptz) NOT NULL

**Primary Key:** faseof_id, faseof_fim


**Unique Indexes:**
- `fases_ordem_fabrico_pkey`: (faseof_id, faseof_fim)

### public.fases_standard_modelos

**Columns:**
- `produto_id`: integer (int4) NOT NULL
- `fase_id`: integer (int4) NOT NULL
- `sequencia`: integer (int4) NOT NULL
- `coeficiente`: numeric (numeric) NULL
- `coeficiente_x`: numeric (numeric) NULL
- `criado_em`: timestamp with time zone (timestamptz) NOT NULL

**Primary Key:** produto_id, fase_id, sequencia


**Unique Indexes:**
- `fases_standard_modelos_pkey`: (produto_id, fase_id, sequencia)

### public.funcionarios

**Columns:**
- `funcionario_id`: integer (int4) NOT NULL
- `funcionario_nome`: character varying (varchar) NOT NULL
- `funcionario_activo`: integer (int4) NOT NULL
- `criado_em`: timestamp with time zone (timestamptz) NOT NULL
- `atualizado_em`: timestamp with time zone (timestamptz) NOT NULL

**Primary Key:** funcionario_id


**Unique Indexes:**
- `funcionarios_pkey`: (funcionario_id)

### public.funcionarios_fase_ordem_fabrico

**Columns:**
- `funcionariofaseof_faseof_id`: character varying (varchar) NOT NULL
- `funcionariofaseof_funcionario_id`: integer (int4) NOT NULL
- `funcionariofaseof_chefe`: integer (int4) NOT NULL
- `criado_em`: timestamp with time zone (timestamptz) NOT NULL

**Primary Key:** funcionariofaseof_faseof_id, funcionariofaseof_funcionario_id


**Unique Indexes:**
- `funcionarios_fase_ordem_fabrico_pkey`: (funcionariofaseof_faseof_id, funcionariofaseof_funcionario_id)

### public.funcionarios_fases_aptos

**Columns:**
- `funcionario_id`: integer (int4) NOT NULL
- `fase_id`: integer (int4) NOT NULL
- `funcionariofase_inicio`: date (date) NOT NULL
- `criado_em`: timestamp with time zone (timestamptz) NOT NULL

**Primary Key:** funcionario_id, fase_id


**Unique Indexes:**
- `funcionarios_fases_aptos_pkey`: (funcionario_id, fase_id)

### public.modelos

**Columns:**
- `produto_id`: integer (int4) NOT NULL
- `produto_nome`: character varying (varchar) NOT NULL
- `produto_peso_desmolde`: numeric (numeric) NULL
- `produto_peso_acabamento`: numeric (numeric) NULL
- `produto_qtd_gel_deck`: numeric (numeric) NULL
- `produto_qtd_gel_casco`: numeric (numeric) NULL
- `criado_em`: timestamp with time zone (timestamptz) NOT NULL
- `atualizado_em`: timestamp with time zone (timestamptz) NOT NULL

**Primary Key:** produto_id


**Unique Indexes:**
- `idx_modelos_nome`: (produto_nome)
- `modelos_pkey`: (produto_id)

### public.ordens_fabrico

**Columns:**
- `of_id`: character varying (varchar) NOT NULL
- `of_data_criacao`: timestamp with time zone (timestamptz) NOT NULL
- `of_data_acabamento`: timestamp with time zone (timestamptz) NULL
- `of_produto_id`: integer (int4) NULL
- `of_fase_id`: integer (int4) NULL
- `of_data_transporte`: timestamp with time zone (timestamptz) NULL
- `criado_em`: timestamp with time zone (timestamptz) NOT NULL
- `atualizado_em`: timestamp with time zone (timestamptz) NOT NULL

**Primary Key:** of_id


**Unique Indexes:**
- `ordens_fabrico_pkey`: (of_id)

