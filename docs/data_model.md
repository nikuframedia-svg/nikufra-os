# Data Model Documentation

## Overview

This document describes the relational data model for the Nelo production data system, inferred from `Folha_IA.xlsx`.

## Entity Relationship Diagram

```
┌─────────────┐
│   Orders   │
│────────────│
│ id (PK)    │
│ of_id      │
│ product_id │──┐
│ ...        │  │
└────────────┘  │
                │
                │ 1:N
                │
┌─────────────┐ │  ┌──────────────┐
│   Products  │◄┘  │ Order Phases │
│─────────────│    │──────────────│
│ id (PK)     │    │ id (PK)      │
│ product_code│    │ of_id (FK)   │
│ name        │    │ phase_id (FK)│──┐
│ ...         │    │ ...          │  │
└─────────────┘    └──────────────┘  │
                                     │
                                     │ N:1
                                     │
┌─────────────┐                      │
│   Phases    │◄─────────────────────┘
│─────────────│
│ id (PK)     │
│ phase_code  │
│ name        │
│ ...         │
└─────────────┘
       │
       │ N:M
       │
┌─────────────┐    ┌──────────────────────┐
│   Workers   │    │ Worker Phase Skills  │
│─────────────│    │──────────────────────│
│ id (PK)     │◄───│ worker_id (FK)       │
│ worker_code │    │ phase_id (FK)        │
│ name        │    │ certified            │
│ ...         │    │ ...                  │
└─────────────┘    └──────────────────────┘

┌─────────────┐    ┌──────────────────────┐
│ Order Phases│    │ Order Phase Workers  │
│─────────────│    │──────────────────────│
│ id (PK)     │◄───│ order_phase_id (FK)  │
│ ...         │    │ worker_id (FK)       │
└─────────────┘    │ start_time           │
       │           │ end_time             │
       │ 1:N       └──────────────────────┘
       │
┌─────────────┐
│Order Errors │
│─────────────│
│ id (PK)     │
│ order_id    │
│ order_phase │
│ ...         │
└─────────────┘

┌─────────────┐    ┌──────────────────────┐
│   Products  │    │ Product Phase        │
│─────────────│    │ Standards            │
│ id (PK)     │◄───│──────────────────────│
│ ...         │    │ product_id (FK)      │
└─────────────┘    │ phase_id (FK)        │
                   │ sequence_order       │
                   │ ...                  │
                   └──────────────────────┘
```

## Core Entities

### Orders (OrdensFabrico)

Represents production orders.

**Primary Key:** `id`

**Key Attributes:**
- `of_id`: Original order ID from Excel (unique)
- `product_id`: Foreign key to Products
- `creation_date`: Order creation date
- `completion_date`: Order completion date
- `quantity`: Quantity produced
- `status`: Order status
- `priority`: Order priority

**Relationships:**
- 1:N with `OrderPhase` (an order has multiple phases)
- 1:N with `OrderError` (an order can have multiple errors)
- N:1 with `Product` (many orders for one product)

### Order Phases (FasesOrdemFabrico)

Represents individual phases within a production order.

**Primary Key:** `id`

**Key Attributes:**
- `fase_of_id`: Original phase ID from Excel (unique)
- `of_id`: Foreign key to Orders
- `phase_id`: Foreign key to Phases catalog
- `start_date`: Actual start date
- `end_date`: Actual end date
- `planned_start`: Planned start date
- `planned_end`: Planned end date
- `duration_minutes`: Calculated duration
- `machine_id`: Machine used
- `center`: Work center

**Relationships:**
- N:1 with `Order` (many phases belong to one order)
- N:1 with `Phase` (many order phases reference one phase type)
- 1:N with `OrderPhaseWorker` (a phase can have multiple workers)
- 1:N with `OrderError` (a phase can have multiple errors)

### Phases (Fases)

Catalog of phase types.

**Primary Key:** `id`

**Key Attributes:**
- `phase_code`: Phase code (unique)
- `name`: Phase name
- `description`: Phase description
- `standard_duration_minutes`: Standard duration
- `machine_type`: Required machine type
- `center`: Work center
- `sequence_order`: Default sequence order

**Relationships:**
- 1:N with `OrderPhase` (one phase type appears in many order phases)
- N:M with `Worker` via `WorkerPhaseSkill` (workers can be skilled in multiple phases)
- N:M with `Product` via `ProductPhaseStandard` (products have standard phase sequences)

### Products (Modelos)

Catalog of products/models.

**Primary Key:** `id`

**Key Attributes:**
- `product_code`: Product code (unique)
- `name`: Product name
- `description`: Product description
- `weight`: Product weight
- `dimensions`: Product dimensions
- `category`: Product category

**Relationships:**
- 1:N with `Order` (one product can have many orders)
- N:M with `Phase` via `ProductPhaseStandard` (products have standard phase sequences)

### Workers (Funcionarios)

Catalog of workers/employees.

**Primary Key:** `id`

**Key Attributes:**
- `worker_code`: Worker code (unique)
- `name`: Worker name
- `department`: Department
- `position`: Job position
- `hire_date`: Hire date
- `active`: Active status

**Relationships:**
- N:M with `Phase` via `WorkerPhaseSkill` (workers can be skilled in multiple phases)
- N:M with `OrderPhase` via `OrderPhaseWorker` (workers can work on multiple phases)

### Order Phase Workers (FuncionariosFaseOrdemFabrico)

Assignment of workers to order phases.

**Primary Key:** `id`

**Key Attributes:**
- `order_phase_id`: Foreign key to OrderPhase
- `worker_id`: Foreign key to Worker
- `start_time`: Assignment start time
- `end_time`: Assignment end time
- `hours_worked`: Hours worked
- `role`: Worker role in this phase

**Relationships:**
- N:1 with `OrderPhase`
- N:1 with `Worker`

### Worker Phase Skills (FuncionariosFasesAptos)

Matrix of worker skills/aptitudes for phases.

**Primary Key:** `id`

**Key Attributes:**
- `worker_id`: Foreign key to Worker
- `phase_id`: Foreign key to Phase
- `certified`: Certification status
- `certification_date`: Certification date
- `skill_level`: Skill level (beginner, intermediate, advanced, expert)

**Relationships:**
- N:1 with `Worker`
- N:1 with `Phase`

### Order Errors (OrdemFabricoErros)

Error records for orders or phases.

**Primary Key:** `id`

**Key Attributes:**
- `order_id`: Foreign key to Order
- `order_phase_id`: Foreign key to OrderPhase (optional)
- `error_date`: Error date
- `error_type`: Error type
- `error_description`: Error description
- `severity`: Error severity
- `resolved`: Resolution status
- `resolution_date`: Resolution date

**Relationships:**
- N:1 with `Order`
- N:1 with `OrderPhase` (optional)

### Product Phase Standards (FasesStandardModelos)

Standard phase sequences for products (routing standards).

**Primary Key:** `id`

**Key Attributes:**
- `product_id`: Foreign key to Product
- `phase_id`: Foreign key to Phase
- `sequence_order`: Order in the sequence (1, 2, 3...)
- `standard_duration_minutes`: Standard duration for this product-phase combination
- `mandatory`: Whether phase is mandatory
- `notes`: Additional notes

**Relationships:**
- N:1 with `Product`
- N:1 with `Phase`

## Feature Tables

### Order Features

Stored computed features for orders:
- `lead_time_days`: Total lead time
- `phase_count`: Number of phases
- `error_count`: Number of errors
- `total_duration_minutes`: Total duration

### Phase Features

Stored computed features for phases:
- `real_duration_minutes`: Actual duration
- `standard_duration_minutes`: Standard duration
- `correction_factor`: Real / Standard ratio
- `variance_minutes`: Difference from standard
- `queue_time_minutes`: Queue/delay time

### Worker Features

Stored computed features for workers:
- `total_phases_executed`: Total phases worked on
- `total_hours_worked`: Total hours
- `avg_hours_per_phase`: Average hours per phase
- `error_count`: Associated errors
- `error_rate`: Error rate

### Bottleneck Stats

Stored bottleneck statistics:
- `total_minutes`: Total time spent
- `avg_minutes`: Average time
- `phase_count`: Number of phases
- `avg_queue_minutes`: Average queue time
- `error_count`: Error count
- `bottleneck_score`: Combined bottleneck score

## Data Flow

1. **Ingestion**: Excel sheets → Database models
2. **Feature Engineering**: Database models → Feature tables
3. **ML/Prediction**: Feature tables → Prediction services
4. **Analytics**: Feature tables → Dashboards/Reports

## Notes

- All dates are stored as `DateTime` type
- Durations are stored in minutes (can be converted to hours/days as needed)
- IDs from Excel are preserved in `*_id` fields (e.g., `of_id`, `fase_of_id`)
- Database IDs are auto-incrementing integers
- Foreign key relationships enforce referential integrity


