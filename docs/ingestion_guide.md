# Data Ingestion Guide

## Overview

This guide explains how to ingest data from `Folha_IA.xlsx` into the database.

## Prerequisites

1. Place `Folha_IA.xlsx` in `data/raw/` directory
2. Configure database connection in `.env` file:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/nelo_db
   FOLHA_IA_PATH=data/raw/Folha_IA.xlsx
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Excel Sheet Structure

The ingestion expects the following sheets:

- `OrdensFabrico`: Production orders
- `FasesOrdemFabrico`: Order phases
- `FuncionariosFaseOrdemFabrico`: Worker assignments to phases
- `OrdemFabricoErros`: Error records
- `Funcionarios`: Worker catalog
- `FuncionariosFasesAptos`: Worker skills matrix
- `Fases`: Phase catalog
- `Modelos`: Product catalog
- `FasesStandardModelos`: Standard product-phase routes

## Running Ingestion

### Basic Ingestion

```python
from backend.data_ingestion.folha_ia.ingest import FolhaIAIngester

ingester = FolhaIAIngester()
results = ingester.ingest_all()
print(results)
```

### Command Line

```bash
python -m backend.data_ingestion.folha_ia.ingest
```

### Analyzing Structure First

```python
from backend.data_ingestion.folha_ia.ingest import FolhaIAIngester

ingester = FolhaIAIngester()
structure = ingester.analyze_structure()
print(structure)
```

## Ingestion Process

1. **Initialize Database**: Creates all tables if they don't exist
2. **Load Sheets**: Reads all sheets from Excel
3. **Ingest Master Data** (no dependencies):
   - Products (Modelos)
   - Phases (Fases)
   - Workers (Funcionarios)
4. **Ingest Transactions** (depends on master data):
   - Orders (OrdensFabrico)
   - Order Phases (FasesOrdemFabrico)
   - Order Phase Workers (FuncionariosFaseOrdemFabrico)
   - Order Errors (OrdemFabricoErros)
   - Worker Phase Skills (FuncionariosFasesAptos)
   - Product Phase Standards (FasesStandardModelos)

## Data Cleaning

The ingestion process automatically:

- Parses dates from various formats
- Converts numeric strings to numbers
- Handles missing values
- Removes duplicates based on primary keys
- Calculates durations where applicable

## Incremental Ingestion

The ingestion supports upsert (update or insert):

- If a record with the same primary key exists, it's updated
- If not, a new record is inserted

This allows re-running ingestion on updated Excel files without creating duplicates.

## Troubleshooting

### File Not Found

Ensure `Folha_IA.xlsx` is in the correct location:
```bash
ls data/raw/Folha_IA.xlsx
```

### Missing Sheets

If a sheet is missing, the ingestion will log a warning and continue with available sheets.

### Data Type Errors

Check the Excel file for:
- Invalid date formats
- Non-numeric values in numeric columns
- Missing required fields

### Foreign Key Violations

Ensure master data (Products, Phases, Workers) is ingested before transaction data (Orders, etc.).

## Next Steps

After ingestion:

1. Compute features:
   ```python
   from backend.features.compute_all import compute_and_store_all_features
   from backend.models.database import get_session
   
   session = get_session()
   compute_and_store_all_features(session)
   ```

2. Run analytics:
   ```python
   from backend.features.order_features import compute_order_statistics
   
   stats = compute_order_statistics(session)
   print(stats)
   ```



