"""
Load Phase: COPY from CSV.gz to staging tables (UNLOGGED).
Ultra-fast bulk load with PostgreSQL COPY.
"""
import gzip
import csv
from contextlib import closing
from pathlib import Path
from typing import Dict, Any, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
import psycopg2
from psycopg2.extras import execute_values
import structlog
import time

logger = structlog.get_logger()

BATCH_SIZE = 50000  # Batches de 50k para performance


class StagingLoader:
    """Load CSV.gz files to staging tables using COPY."""
    
    def __init__(self, db_url: str, processed_dir: Path):
        """
        Initialize loader.
        
        Args:
            db_url: Database URL
            processed_dir: Directory with CSV.gz files
        """
        self.engine = create_engine(db_url)
        self.processed_dir = Path(processed_dir)
    
    def load_sheet(
        self,
        sheet_name: str,
        csv_gz_path: Path,
        staging_table: str,
        columns: list
    ) -> Dict[str, Any]:
        """
        Load a sheet from CSV.gz to staging table using COPY.
        
        Args:
            sheet_name: Sheet name
            csv_gz_path: Path to CSV.gz file
            staging_table: Target staging table name
            columns: List of column names
        
        Returns:
            Load stats
        """
        logger.info(f"Loading {sheet_name} to {staging_table}")
        
        start_time = time.time()
        
        # Get raw connection for COPY with explicit transaction handling
        with closing(self.engine.raw_connection()) as conn:
            cur = conn.cursor()
            try:
                # Configure session for fast load
                cur.execute("SET synchronous_commit = off")
                cur.execute("SET maintenance_work_mem = '256MB'")
                cur.execute("SET work_mem = '64MB'")
                cur.execute("SET statement_timeout = '1h'")
                
                # Truncate staging table
                cur.execute(f"TRUNCATE TABLE {staging_table}")
                
                # Prepare COPY command
                copy_sql = f"""
                    COPY {staging_table} ({', '.join(columns)})
                    FROM STDIN
                    WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"')
                """
                
                # Read CSV.gz and COPY
                row_count = 0
                with gzip.open(csv_gz_path, 'rt', encoding='utf-8') as gz_file:
                    cur.copy_expert(copy_sql, gz_file)
                    row_count = cur.rowcount
                
                conn.commit()
                
                elapsed = time.time() - start_time
                throughput = row_count / elapsed if elapsed > 0 else 0
                
                logger.info(
                    f"Loaded {sheet_name}",
                    row_count=row_count,
                    elapsed_seconds=round(elapsed, 2),
                    throughput_rows_per_sec=round(throughput, 0)
                )
                
                return {
                    'sheet_name': sheet_name,
                    'staging_table': staging_table,
                    'row_count': row_count,
                    'elapsed_seconds': round(elapsed, 2),
                    'throughput_rows_per_sec': round(throughput, 0)
                }
                
            except Exception:
                conn.rollback()
                logger.error(f"Error loading {sheet_name}", exc_info=True)
                raise
            finally:
                cur.close()
    
    def load_all(self, extraction_report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load all extracted sheets to staging.
        
        Args:
            extraction_report: Report from extract phase
        
        Returns:
            Load results
        """
        results = {}
        
        # Map sheet names to staging tables and columns
        sheet_to_staging = {
            'OrdensFabrico': {
                'table': 'staging.ordens_fabrico_raw',
                'columns': ['of_id', 'of_data_criacao', 'of_data_acabamento', 
                           'of_produto_id', 'of_fase_id', 'of_data_transporte']
            },
            'FasesOrdemFabrico': {
                'table': 'staging.fases_ordem_fabrico_raw',
                'columns': ['faseof_id', 'faseof_of_id', 'faseof_inicio', 'faseof_fim',
                           'faseof_data_prevista', 'faseof_coeficiente', 'faseof_coeficiente_x',
                           'faseof_fase_id', 'faseof_turno', 'faseof_retorno', 'faseof_peso',
                           'faseof_sequencia']
            },
            'FuncionariosFaseOrdemFabrico': {
                'table': 'staging.funcionarios_fase_ordem_fabrico_raw',
                'columns': ['funcionariofaseof_faseof_id', 'funcionariofaseof_funcionario_id',
                           'funcionariofaseof_chefe']
            },
            'OrdemFabricoErros': {
                'table': 'staging.erros_ordem_fabrico_raw',
                'columns': ['ofch_descricao_erro', 'ofch_of_id', 'ofch_fase_avaliacao',
                           'ofch_gravidade', 'ofch_faseof_avaliacao', 'ofch_faseof_culpada']
            },
            'Funcionarios': {
                'table': 'staging.funcionarios_raw',
                'columns': ['funcionario_id', 'funcionario_nome', 'funcionario_activo']
            },
            'FuncionariosFasesAptos': {
                'table': 'staging.funcionarios_fases_aptos_raw',
                'columns': ['funcionario_id', 'fase_id', 'funcionariofase_inicio']
            },
            'Fases': {
                'table': 'staging.fases_catalogo_raw',
                'columns': ['fase_id', 'fase_nome', 'fase_sequencia', 'fase_de_producao',
                           'fase_automatica']
            },
            'Modelos': {
                'table': 'staging.modelos_raw',
                'columns': ['produto_id', 'produto_nome', 'produto_peso_desmolde',
                           'produto_peso_acabamento', 'produto_qtd_gel_deck', 'produto_qtd_gel_casco']
            },
            'FasesStandardModelos': {
                'table': 'staging.fases_standard_modelos_raw',
                'columns': ['produto_id', 'fase_id', 'sequencia', 'coeficiente', 'coeficiente_x']
            }
        }
        
        for sheet_name, sheet_data in extraction_report['sheets'].items():
            if sheet_name not in sheet_to_staging:
                logger.warning(f"No staging mapping for sheet: {sheet_name}")
                continue
            
            staging_config = sheet_to_staging[sheet_name]
            csv_gz_path = Path(sheet_data['file_path'])
            
            if not csv_gz_path.exists():
                logger.error(f"CSV.gz file not found: {csv_gz_path}")
                continue
            
            result = self.load_sheet(
                sheet_name,
                csv_gz_path,
                staging_config['table'],
                staging_config['columns']
            )
            results[sheet_name] = result
        
        return {
            'loaded_sheets': len(results),
            'results': results,
            'loaded_at': time.time()
        }


def main():
    """CLI entry point."""
    import sys
    import json
    from pathlib import Path
    
    processed_dir = Path(__file__).parent.parent.parent / "data" / "processed"
    extraction_report_path = processed_dir / "extraction_report.json"
    
    if not extraction_report_path.exists():
        print(f"Error: Extraction report not found: {extraction_report_path}")
        print("Run extract phase first.")
        sys.exit(1)
    
    with open(extraction_report_path) as f:
        extraction_report = json.load(f)
    
    db_url = "postgresql://nelo_user:nelo_pass@localhost:5432/nelo_db"
    
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
        ]
    )
    
    loader = StagingLoader(db_url, processed_dir)
    results = loader.load_all(extraction_report)
    
    # Save load report
    report_path = processed_dir / "load_report.json"
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✅ Load complete!")
    print(f"  Sheets loaded: {results['loaded_sheets']}")
    print(f"  Report saved: {report_path}")


if __name__ == "__main__":
    main()

