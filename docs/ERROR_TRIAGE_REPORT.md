# ERROR TRIAGE REPORT

**Generated**: 2025-12-17T14:16:10.260360

**Total Errors**: 6

## Errors by Category

### DATA_INTEGRITY (1 errors)

#### E5: Release gate fails

- **Category**: DATA_INTEGRITY
- **Status**: PENDING
- **Reproduction**:
  ```bash
  python3 scripts/release_gate.py
  ```

- **Root Cause**: Traceback (most recent call last):
  File "/Users/martimnicolau/nelo/scripts/release_gate.py", line 30, in <module>
    from backend.config import DATABASE_URL
  File "/Users/martimnicolau/nelo/backen

- **Fix Plan**:
  1. Check docs/RELEASE_BLOCKED.md for details
  2. Fix failing checks
  3. Re-run release gate

- **Acceptance Criteria**: release_gate.py exits with code 0

---

### ENV (1 errors)

#### E1: Prerequisites validation failed

- **Category**: ENV
- **Status**: PENDING
- **Reproduction**:
  ```bash
  python3 scripts/validate_prerequisites.py
  ```

- **Root Cause**: DATABASE_URL not configured or PostgreSQL not available

- **Fix Plan**:
  1. Configure DATABASE_URL
  2. Ensure PostgreSQL 15+ is running
  3. Run docker compose up -d db

- **Acceptance Criteria**: python3 scripts/validate_prerequisites.py exits with code 0

---

### INGESTION (1 errors)

#### E4.1: Extraction report not generated

- **Category**: INGESTION
- **Status**: PENDING
- **Reproduction**:
  ```bash
  python3 app/ingestion/main_turbo.py
  ```

- **Root Cause**: Extract phase does not generate extraction_report.json

- **Fix Plan**:
  1. Ensure extract.py generates extraction_report.json
  2. Check data/processed/ directory exists

- **Acceptance Criteria**: extraction_report.json exists after extract phase

---

### PERFORMANCE (1 errors)

#### E7.1: Performance tests fail

- **Category**: PERFORMANCE
- **Status**: PENDING
- **Reproduction**:
  ```bash
  pytest tests/performance/test_slos.py
  ```

- **Root Cause**: SLO validation failed

- **Fix Plan**:
  1. Fix performance issues
  2. Optimize queries
  3. Check SLO thresholds

- **Acceptance Criteria**: Performance tests pass with SLOs met

---

### SERVICES (1 errors)

#### E6.1: Tests fail

- **Category**: SERVICES
- **Status**: PENDING
- **Reproduction**:
  ```bash
  pytest -q
  ```

- **Root Cause**: Test failures detected

- **Fix Plan**:
  1. Fix failing tests
  2. Ensure test database is configured
  3. Check test data setup

- **Acceptance Criteria**: pytest passes with exit code 0

---

### UNKNOWN (1 errors)

#### E-MIGRATIONS: Exception during Migrations check

- **Category**: UNKNOWN
- **Status**: PENDING
- **Reproduction**:
  ```bash
  Run Migrations check
  ```

- **Root Cause**: No module named 'backend'

- **Fix Plan**:
  1. Check error details
  2. Fix underlying issue

- **Acceptance Criteria**: Migrations check completes without exception

---

