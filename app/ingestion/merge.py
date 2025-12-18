"""
Merge Phase: staging -> core with typed casts + rejects.
Idempotent upserts with ON CONFLICT.
Data-first: staging é texto, core é tipado. O merge faz CAST com base em information_schema.

Correções chave:
- Resolve schema core/public automaticamente.
- CAST correcto (int/numeric/date/timestamptz/bool) e tratamento do literal "NULL".
- Rejects por tabela: <tabela>_rejects com payload JSONB.
- Erros: fingerprint com pgcrypto digest quando disponível, fallback para Python.
"""

from __future__ import annotations

from contextlib import closing
from dataclasses import dataclass
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import os
import time
import json
import hashlib
import logging

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from psycopg2.extras import execute_values

try:
    import structlog
    logger = structlog.get_logger()
except Exception:
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("merge")

BATCH_SIZE = 50_000


def _normalize_str(x: object) -> str:
    if x is None:
        return ""
    return " ".join(str(x).strip().lower().split())


def _python_fingerprint(*parts: object) -> str:
    s = "|".join(_normalize_str(p) for p in parts)
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class MergeConfig:
    sheet_name: str
    staging_table: str
    core_table: str
    preferred_conflict_cols: List[str]
    column_mapping: Dict[str, str]
    is_errors: bool = False


class CoreMerger:
    def __init__(self, db_url: str, ingestion_run_id: int):
        self.engine: Engine = create_engine(db_url, pool_pre_ping=True, future=True)
        self.run_id = ingestion_run_id

    # ----------------- schema resolve -----------------
    @staticmethod
    def _to_regclass(cur, qualified: str) -> Optional[str]:
        cur.execute("SELECT to_regclass(%s)", (qualified,))
        r = cur.fetchone()
        return r[0] if r else None

    def _resolve_table(self, cur, raw: str, schemas: List[str]) -> str:
        if "." in raw:
            if self._to_regclass(cur, raw) is None:
                raise ValueError(f"Table does not exist: {raw}")
            return raw
        for s in schemas:
            q = f"{s}.{raw}"
            if self._to_regclass(cur, q) is not None:
                return q
        if self._to_regclass(cur, raw) is not None:
            return raw
        raise ValueError(f"Table does not exist in {schemas}: {raw}")

    # ----------------- ingestion_runs resolve -----------------
    def _resolve_ingestion_runs_table(self, cur) -> str:
        for s in ("public", "core"):
            q = f"{s}.ingestion_runs"
            if self._to_regclass(cur, q) is not None:
                return q
        raise RuntimeError("ingestion_runs not found (public/core). Run migrations first.")

    def _update_ingestion_run_status(self, status: str, error: Optional[str] = None) -> None:
        try:
            with closing(self.engine.raw_connection()) as conn:
                cur = conn.cursor()
                try:
                    cur.execute("SET search_path TO public, core, staging;")
                    ir = self._resolve_ingestion_runs_table(cur)
                    cur.execute(
                        f"""
                        UPDATE {ir}
                        SET status=%s,
                            error_message=%s,
                            completed_at = CASE WHEN %s THEN now() ELSE completed_at END
                        WHERE run_id=%s
                        """,
                        (status, (error or None), status in ("MERGE_DONE", "completed"), self.run_id),
                    )
                    conn.commit()
                except Exception:
                    conn.rollback()
                    raise
                finally:
                    cur.close()
        except Exception as e:
            try:
                logger.warning("failed to update ingestion_runs", status=status, error=str(e))
            except Exception:
                pass

    # ----------------- column types -----------------
    def _get_core_column_types(self, cur, qualified_core: str) -> Dict[str, Dict[str, Any]]:
        if "." in qualified_core:
            schema, rel = qualified_core.split(".", 1)
        else:
            schema, rel = "public", qualified_core
        cur.execute(
            """
            SELECT column_name, udt_name, is_nullable
            FROM information_schema.columns
            WHERE table_schema=%s AND table_name=%s
            ORDER BY ordinal_position
            """,
            (schema, rel),
        )
        out: Dict[str, Dict[str, Any]] = {}
        for name, udt, nullable in cur.fetchall():
            out[name] = {"udt": udt, "nullable": (nullable == "YES")}
        return out

    @staticmethod
    def _sql_nullify(expr: str) -> str:
        # Trata NULL real e literais comuns vindos do CSV
        return f"""
        CASE
          WHEN {expr} IS NULL THEN NULL
          WHEN trim({expr}) = '' THEN NULL
          WHEN upper(trim({expr})) IN ('NULL','NONE','NIL') THEN NULL
          ELSE trim({expr})
        END
        """.strip()

    def _cast_expr(self, stg_col: str, core_col: str, core_udt: str) -> str:
        e = f"t.{stg_col}"
        n = self._sql_nullify(e)

        if core_udt in ("int2", "int4", "int8"):
            # Only cast if it's a valid integer (no decimal point)
            return f"""
            CASE
              WHEN {e} IS NULL THEN NULL
              WHEN trim({e}) = '' THEN NULL
              WHEN upper(trim({e})) IN ('NULL','NONE','NIL') THEN NULL
              WHEN trim({e}) ~ '^[0-9]+$' THEN (trim({e}))::bigint
              ELSE NULL
            END AS {core_col}
            """.strip()
        if core_udt in ("numeric", "float4", "float8"):
            return f"({n})::numeric AS {core_col}"
        if core_udt == "date":
            return f"({n})::date AS {core_col}"
        if core_udt in ("timestamp",):
            return f"({n})::timestamp AS {core_col}"
        if core_udt in ("timestamptz",):
            return f"({n})::timestamptz AS {core_col}"
        if core_udt == "bool":
            return f"""
            CASE
              WHEN {e} IS NULL THEN NULL
              WHEN upper(trim({e})) IN ('TRUE','T','1','YES','Y') THEN true
              WHEN upper(trim({e})) IN ('FALSE','F','0','NO','N') THEN false
              ELSE NULL
            END AS {core_col}
            """.strip()

        # text/varchar/uuid/etc: mantém texto limpo
        return f"{n} AS {core_col}"

    # ----------------- unique targets -----------------
    def _get_unique_sets(self, cur, qualified: str) -> List[Tuple[str, Tuple[str, ...]]]:
        if "." in qualified:
            schema, rel = qualified.split(".", 1)
        else:
            schema, rel = "public", qualified

        out: List[Tuple[str, Tuple[str, ...]]] = []

        cur.execute(
            """
            SELECT c.contype,
                   array_agg(a.attname ORDER BY array_position(c.conkey, a.attnum)) AS cols
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid=t.oid
            JOIN pg_namespace n ON t.relnamespace=n.oid
            JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum = ANY(c.conkey)
            WHERE n.nspname=%s AND t.relname=%s AND c.contype IN ('p','u')
            GROUP BY c.contype, c.conkey
            """,
            (schema, rel),
        )
        for contype, cols in cur.fetchall():
            out.append(("PK" if contype == "p" else "UNIQUE", tuple(cols)))

        cur.execute(
            """
            SELECT array_agg(a.attname ORDER BY array_position(i.indkey, a.attnum)) AS cols
            FROM pg_index i
            JOIN pg_class t ON i.indrelid=t.oid
            JOIN pg_namespace n ON t.relnamespace=n.oid
            JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum = ANY(i.indkey)
            WHERE n.nspname=%s AND t.relname=%s AND i.indisunique=true
            GROUP BY i.indkey
            """,
            (schema, rel),
        )
        for (cols,) in cur.fetchall():
            if cols:
                out.append(("UNIQUE_INDEX", tuple(cols)))

        return out

    def _resolve_conflict_target(self, cur, qualified_core: str, preferred: List[str]) -> List[str]:
        uniques = self._get_unique_sets(cur, qualified_core)
        wanted = set(preferred)

        for _, cols in uniques:
            if set(cols) == wanted:
                return list(cols)

        for kind, cols in uniques:
            if kind == "PK":
                return list(cols)

        available = [f"{k}({', '.join(c)})" for k, c in uniques]
        raise ValueError(f"No ON CONFLICT target for {qualified_core}. Available: {available}")

    # ----------------- rejects -----------------
    def _ensure_rejects_table(self, cur, qualified_core: str) -> str:
        if "." in qualified_core:
            schema, rel = qualified_core.split(".", 1)
        else:
            schema, rel = "public", qualified_core

        name = f"{rel}_rejects"
        q = f"{schema}.{name}"

        cur.execute(
            """
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables
              WHERE table_schema=%s AND table_name=%s
            )
            """,
            (schema, name),
        )
        exists = cur.fetchone()[0]

        if not exists:
            cur.execute(
                f"""
                CREATE TABLE {q} (
                  reject_id BIGSERIAL PRIMARY KEY,
                  run_id BIGINT NOT NULL,
                  sheet_name TEXT NOT NULL,
                  reason_code TEXT NOT NULL,
                  reason_detail TEXT NULL,
                  payload JSONB NOT NULL,
                  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );
                """
            )
        return q

    def _insert_rejects(self, cur, rejects_q: str, staging_q: str, sheet: str, code: str, detail: str, where_sql: str) -> int:
        cur.execute(
            f"""
            INSERT INTO {rejects_q} (run_id, sheet_name, reason_code, reason_detail, payload)
            SELECT %s, %s, %s, %s, to_jsonb(t)
            FROM {staging_q} t
            WHERE {where_sql}
            """,
            (self.run_id, sheet, code, detail),
        )
        return cur.rowcount

    # ----------------- merge sheet -----------------
    def merge_sheet(self, cfg: MergeConfig) -> Dict[str, Any]:
        t0 = time.time()
        processed = 0
        rejected = 0

        with closing(self.engine.raw_connection()) as conn:
            cur = conn.cursor()
            try:
                cur.execute("SET search_path TO public, core, staging;")

                staging_q = self._resolve_table(cur, cfg.staging_table, ["staging"])
                core_q = self._resolve_table(cur, cfg.core_table, ["public", "core"])

                rejects_q = self._ensure_rejects_table(cur, core_q)

                cur.execute(f"SELECT COUNT(*) FROM {staging_q}")
                staging_count = int(cur.fetchone()[0])

                conflict_cols = self._resolve_conflict_target(cur, core_q, cfg.preferred_conflict_cols)

                core_types = self._get_core_column_types(cur, core_q)

                # -------- errors (fingerprint) --------
                if cfg.is_errors:
                    rejected += self._insert_rejects(
                        cur, rejects_q, staging_q, cfg.sheet_name,
                        "NULL_REQUIRED",
                        "Erro_Descricao ou Erro_OfId está NULL",
                        "t.ofch_descricao_erro IS NULL OR t.ofch_of_id IS NULL",
                    )
                    rejected += self._insert_rejects(
                        cur, rejects_q, staging_q, cfg.sheet_name,
                        "INVALID_GRAVIDADE",
                        "OFCH_GRAVIDADE fora de {1,2,3}",
                        "t.ofch_gravidade IS NOT NULL AND (CASE WHEN upper(trim(t.ofch_gravidade))='NULL' THEN NULL ELSE trim(t.ofch_gravidade)::int END) NOT IN (1,2,3)",
                    )

                    # tenta SQL digest
                    sql_digest_ok = True
                    try:
                        cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
                    except Exception:
                        sql_digest_ok = False

                    if sql_digest_ok:
                        cur.execute(
                            f"""
                            INSERT INTO {core_q} (
                              ofch_descricao_erro, ofch_of_id, ofch_fase_avaliacao,
                              ofch_gravidade, ofch_faseof_avaliacao, ofch_faseof_culpada,
                              ofch_fingerprint
                            )
                            SELECT
                              t.ofch_descricao_erro,
                              t.ofch_of_id,
                              (CASE WHEN upper(trim(t.ofch_fase_avaliacao))='NULL' OR trim(t.ofch_fase_avaliacao)='' THEN NULL ELSE trim(t.ofch_fase_avaliacao)::bigint END),
                              (CASE WHEN upper(trim(t.ofch_gravidade))='NULL' OR trim(t.ofch_gravidade)='' THEN NULL ELSE trim(t.ofch_gravidade)::int END),
                              (CASE WHEN upper(trim(t.ofch_faseof_avaliacao))='NULL' OR trim(t.ofch_faseof_avaliacao)='' THEN NULL ELSE trim(t.ofch_faseof_avaliacao) END),
                              (CASE WHEN upper(trim(t.ofch_faseof_culpada))='NULL' OR trim(t.ofch_faseof_culpada)='' THEN NULL ELSE trim(t.ofch_faseof_culpada) END),
                              encode(
                                digest(
                                  regexp_replace(lower(trim(coalesce(t.ofch_descricao_erro,''))), '\\s+',' ','g') || '|' ||
                                  regexp_replace(lower(trim(coalesce(t.ofch_of_id::text,''))), '\\s+',' ','g') || '|' ||
                                  regexp_replace(lower(trim(coalesce(t.ofch_fase_avaliacao::text,''))), '\\s+',' ','g') || '|' ||
                                  regexp_replace(lower(trim(coalesce(t.ofch_gravidade::text,''))), '\\s+',' ','g') || '|' ||
                                  regexp_replace(lower(trim(coalesce(t.ofch_faseof_avaliacao::text,''))), '\\s+',' ','g') || '|' ||
                                  regexp_replace(lower(trim(coalesce(t.ofch_faseof_culpada::text,''))), '\\s+',' ','g'),
                                  'sha256'
                                ),
                                'hex'
                              )
                            FROM {staging_q} t
                            WHERE t.ofch_descricao_erro IS NOT NULL
                              AND t.ofch_of_id IS NOT NULL
                              AND trim(t.ofch_of_id) != ''
                              AND upper(trim(t.ofch_of_id)) != 'NULL'
                              AND EXISTS (SELECT 1 FROM ordens_fabrico o WHERE o.of_id::text = trim(t.ofch_of_id))
                            ON CONFLICT ({", ".join(conflict_cols)})
                            DO UPDATE SET
                              ofch_descricao_erro = EXCLUDED.ofch_descricao_erro,
                              ofch_fase_avaliacao = EXCLUDED.ofch_fase_avaliacao,
                              ofch_gravidade = EXCLUDED.ofch_gravidade,
                              ofch_faseof_avaliacao = EXCLUDED.ofch_faseof_avaliacao,
                              ofch_faseof_culpada = EXCLUDED.ofch_faseof_culpada,
                              ofch_fingerprint = EXCLUDED.ofch_fingerprint
                            """
                        )
                        processed = cur.rowcount
                    else:
                        # python fallback (mais lento, mas funciona)
                        cur.execute(
                            f"""
                            SELECT t.ofch_descricao_erro, t.ofch_of_id, t.ofch_fase_avaliacao, t.ofch_gravidade, t.ofch_faseof_avaliacao, t.ofch_faseof_culpada
                            FROM {staging_q} t
                            WHERE t.ofch_descricao_erro IS NOT NULL 
                              AND t.ofch_of_id IS NOT NULL
                              AND trim(t.ofch_of_id) != ''
                              AND upper(trim(t.ofch_of_id)) != 'NULL'
                              AND EXISTS (SELECT 1 FROM ordens_fabrico o WHERE o.of_id::text = trim(t.ofch_of_id))
                            """
                        )
                        rows = cur.fetchall()
                        vals = []
                        for r in rows:
                            fp = _python_fingerprint(*r)
                            vals.append((r[0], r[1], r[2], r[3], r[4], r[5], fp))

                        if vals:
                            execute_values(
                                cur,
                                f"""
                                INSERT INTO {core_q} (
                                  ofch_descricao_erro, ofch_of_id, ofch_fase_avaliacao, ofch_gravidade,
                                  ofch_faseof_avaliacao, ofch_faseof_culpada, ofch_fingerprint
                                ) VALUES %s
                                ON CONFLICT ({", ".join(conflict_cols)})
                                DO UPDATE SET
                                  ofch_descricao_erro = EXCLUDED.ofch_descricao_erro,
                                  ofch_fase_avaliacao = EXCLUDED.ofch_fase_avaliacao,
                                  ofch_gravidade = EXCLUDED.ofch_gravidade,
                                  ofch_faseof_avaliacao = EXCLUDED.ofch_faseof_avaliacao,
                                  ofch_faseof_culpada = EXCLUDED.ofch_faseof_culpada,
                                  ofch_fingerprint = EXCLUDED.ofch_fingerprint
                                """,
                                vals,
                                page_size=BATCH_SIZE,
                            )
                            processed = len(vals)

                # -------- standard tables --------
                else:
                    # rejects: conflito não pode ser NULL
                    rev = {core: stg for stg, core in cfg.column_mapping.items()}
                    null_checks = []
                    for c in conflict_cols:
                        if c in rev:
                            null_checks.append(f"t.{rev[c]} IS NULL OR trim(t.{rev[c]})='' OR upper(trim(t.{rev[c]}))='NULL'")
                    if null_checks:
                        rejected += self._insert_rejects(
                            cur, rejects_q, staging_q, cfg.sheet_name,
                            "NULL_CONFLICT_KEY",
                            f"Chaves de conflito inválidas: {', '.join(conflict_cols)}",
                            " OR ".join(null_checks),
                        )
                        where_valid = " AND ".join([f"NOT ({x})" for x in null_checks])
                    else:
                        where_valid = "TRUE"

                    # Get NOT NULL columns and validate they won't be NULL after cast
                    not_null_cols = [
                        col for col, info in core_types.items()
                        if not info["nullable"] and col in cfg.column_mapping.values()
                    ]
                    
                    # Reject rows where NOT NULL cols will be NULL after cast
                    for not_null_col in not_null_cols:
                        if not_null_col not in conflict_cols and not_null_col in rev:
                            stg_col = rev[not_null_col]
                            udt = core_types.get(not_null_col, {}).get("udt", "text")
                            cast_expr = self._cast_expr(stg_col, not_null_col, udt).split(" AS ")[0]  # Remove AS clause
                            # Check if cast will result in NULL
                            rejected += self._insert_rejects(
                                cur, rejects_q, staging_q, cfg.sheet_name,
                                "NULL_REQUIRED_FIELD",
                                f"Campo obrigatório {not_null_col} será NULL após cast",
                                f"{where_valid} AND ({cast_expr} IS NULL)"
                            )
                            # Add to WHERE to exclude these rows
                            where_valid = f"{where_valid} AND ({cast_expr} IS NOT NULL)"
                    
                    # Special validation for fases_ordem_fabrico: faseof_fim must be >= faseof_inicio
                    table_name = core_q.split(".")[-1]
                    if table_name == "fases_ordem_fabrico" and "faseof_inicio" in rev and "faseof_fim" in rev:
                        inicio_stg = rev["faseof_inicio"]
                        fim_stg = rev["faseof_fim"]
                        inicio_cast = self._cast_expr(inicio_stg, "faseof_inicio", "timestamptz").split(" AS ")[0]
                        fim_cast = self._cast_expr(fim_stg, "faseof_fim", "timestamptz").split(" AS ")[0]
                        rejected += self._insert_rejects(
                            cur, rejects_q, staging_q, cfg.sheet_name,
                            "INVALID_TIME_RANGE",
                            "faseof_fim < faseof_inicio",
                            f"{where_valid} AND {fim_cast} IS NOT NULL AND {inicio_cast} IS NOT NULL AND {fim_cast} < {inicio_cast}"
                        )
                        # Exclude invalid ranges from WHERE
                        where_valid = f"{where_valid} AND ({fim_cast} IS NULL OR {inicio_cast} IS NULL OR {fim_cast} >= {inicio_cast})"
                    
                    # Validate foreign keys for funcionarios_fase_ordem_fabrico
                    if table_name == "funcionarios_fase_ordem_fabrico" and "funcionariofaseof_funcionario_id" in cfg.column_mapping.values():
                        fk_col = "funcionariofaseof_funcionario_id"
                        if fk_col in rev:
                            fk_stg = rev[fk_col]
                            fk_udt = core_types.get(fk_col, {}).get("udt", "int4")
                            fk_cast = self._cast_expr(fk_stg, fk_col, fk_udt).split(" AS ")[0]
                            # Reject rows where FK doesn't exist
                            rejected += self._insert_rejects(
                                cur, rejects_q, staging_q, cfg.sheet_name,
                                "FOREIGN_KEY_VIOLATION",
                                f"{fk_col} não existe em funcionarios",
                                f"{where_valid} AND {fk_cast} IS NOT NULL AND NOT EXISTS (SELECT 1 FROM funcionarios f WHERE f.funcionario_id = {fk_cast})"
                            )
                            # Exclude invalid FKs from WHERE
                            where_valid = f"{where_valid} AND ({fk_cast} IS NULL OR EXISTS (SELECT 1 FROM funcionarios f WHERE f.funcionario_id = {fk_cast}))"

                    staging_cols = list(cfg.column_mapping.keys())
                    core_cols = list(cfg.column_mapping.values())

                    select_exprs = []
                    for stg, core in cfg.column_mapping.items():
                        udt = core_types.get(core, {}).get("udt", "text")
                        select_exprs.append(self._cast_expr(stg, core, udt))

                    update_set = ", ".join(
                        f"{col}=EXCLUDED.{col}" for col in core_cols if col not in conflict_cols
                    )
                    if not update_set:
                        update_set = f"{conflict_cols[0]}=EXCLUDED.{conflict_cols[0]}"

                    distinct_on = ", ".join([f"t.{rev[c]}" for c in conflict_cols if c in rev])
                    order_by = distinct_on if distinct_on else "t.ctid"

                    cur.execute(
                        f"""
                        INSERT INTO {core_q} ({", ".join(core_cols)})
                        SELECT DISTINCT ON ({distinct_on}) {", ".join(select_exprs)}
                        FROM {staging_q} t
                        WHERE {where_valid}
                        ORDER BY {order_by}, t.ctid
                        ON CONFLICT ({", ".join(conflict_cols)})
                        DO UPDATE SET {update_set}
                        """
                    )
                    processed = cur.rowcount

                conn.commit()

                elapsed = time.time() - t0
                try:
                    logger.info(
                        "merged",
                        sheet=cfg.sheet_name,
                        staging=staging_q,
                        core=core_q,
                        staging_count=staging_count,
                        processed=processed,
                        rejected=rejected,
                        elapsed_seconds=round(elapsed, 2),
                    )
                except Exception:
                    pass

                return {
                    "sheet_name": cfg.sheet_name,
                    "staging_count": staging_count,
                    "processed": processed,
                    "rejected": rejected,
                    "elapsed_seconds": round(elapsed, 2),
                }

            except Exception as e:
                conn.rollback()
                try:
                    logger.error("merge failed", sheet=cfg.sheet_name, error=str(e), exc_info=True)
                except Exception:
                    pass
                raise
            finally:
                cur.close()

    def populate_derived_columns(self) -> None:
        with self.engine.begin() as conn:
            conn.execute(text("SET search_path TO public, core, staging;"))
            conn.execute(text("""
                UPDATE fases_ordem_fabrico
                SET
                  faseof_event_time = COALESCE(faseof_fim, faseof_inicio, faseof_data_prevista),
                  faseof_duration_seconds = CASE
                    WHEN faseof_fim IS NOT NULL AND faseof_inicio IS NOT NULL
                    THEN LEAST(EXTRACT(EPOCH FROM (faseof_fim - faseof_inicio))::numeric, 99999999.99)
                    ELSE NULL
                  END,
                  faseof_is_open = (faseof_inicio IS NOT NULL AND faseof_fim IS NULL),
                  faseof_is_done = (faseof_fim IS NOT NULL)
                WHERE faseof_event_time IS NULL OR faseof_is_open IS NULL OR faseof_is_done IS NULL;
            """))

    def merge_all(self, load_report: Dict[str, Any]) -> Dict[str, Any]:
        self._update_ingestion_run_status("MERGE_RUNNING")

        configs: List[MergeConfig] = [
            MergeConfig("Fases", "staging.fases_catalogo_raw", "fases_catalogo",
                        ["fase_id"],
                        {"fase_id":"fase_id","fase_nome":"fase_nome","fase_sequencia":"fase_sequencia","fase_de_producao":"fase_de_producao","fase_automatica":"fase_automatica"}),
            MergeConfig("Modelos", "staging.modelos_raw", "modelos",
                        ["produto_id"],
                        {"produto_id":"produto_id","produto_nome":"produto_nome","produto_peso_desmolde":"produto_peso_desmolde","produto_peso_acabamento":"produto_peso_acabamento","produto_qtd_gel_deck":"produto_qtd_gel_deck","produto_qtd_gel_casco":"produto_qtd_gel_casco"}),
            MergeConfig("Funcionarios", "staging.funcionarios_raw", "funcionarios",
                        ["funcionario_id"],
                        {"funcionario_id":"funcionario_id","funcionario_nome":"funcionario_nome","funcionario_activo":"funcionario_activo"}),
            MergeConfig("FuncionariosFasesAptos", "staging.funcionarios_fases_aptos_raw", "funcionarios_fases_aptos",
                        ["funcionario_id","fase_id"],
                        {"funcionario_id":"funcionario_id","fase_id":"fase_id","funcionariofase_inicio":"funcionariofase_inicio"}),
            MergeConfig("FasesStandardModelos", "staging.fases_standard_modelos_raw", "fases_standard_modelos",
                        ["produto_id","fase_id","sequencia"],
                        {"produto_id":"produto_id","fase_id":"fase_id","sequencia":"sequencia","coeficiente":"coeficiente","coeficiente_x":"coeficiente_x"}),
            MergeConfig("OrdensFabrico", "staging.ordens_fabrico_raw", "ordens_fabrico",
                        ["of_id"],
                        {"of_id":"of_id","of_data_criacao":"of_data_criacao","of_data_acabamento":"of_data_acabamento","of_produto_id":"of_produto_id","of_fase_id":"of_fase_id","of_data_transporte":"of_data_transporte"}),
            MergeConfig("FasesOrdemFabrico", "staging.fases_ordem_fabrico_raw", "fases_ordem_fabrico",
                        ["faseof_id","faseof_fim"],
                        {"faseof_id":"faseof_id","faseof_of_id":"faseof_of_id","faseof_inicio":"faseof_inicio","faseof_fim":"faseof_fim","faseof_data_prevista":"faseof_data_prevista","faseof_coeficiente":"faseof_coeficiente","faseof_coeficiente_x":"faseof_coeficiente_x","faseof_fase_id":"faseof_fase_id","faseof_turno":"faseof_turno","faseof_retorno":"faseof_retorno","faseof_peso":"faseof_peso","faseof_sequencia":"faseof_sequencia"}),
            MergeConfig("FuncionariosFaseOrdemFabrico", "staging.funcionarios_fase_ordem_fabrico_raw", "funcionarios_fase_ordem_fabrico",
                        ["funcionariofaseof_faseof_id","funcionariofaseof_funcionario_id"],
                        {"funcionariofaseof_faseof_id":"funcionariofaseof_faseof_id","funcionariofaseof_funcionario_id":"funcionariofaseof_funcionario_id","funcionariofaseof_chefe":"funcionariofaseof_chefe"}),
            MergeConfig("OrdemFabricoErros", "staging.erros_ordem_fabrico_raw", "erros_ordem_fabrico",
                        ["ofch_fingerprint","ofch_of_id"],
                        {"ofch_descricao_erro":"ofch_descricao_erro","ofch_of_id":"ofch_of_id","ofch_fase_avaliacao":"ofch_fase_avaliacao","ofch_gravidade":"ofch_gravidade","ofch_faseof_avaliacao":"ofch_faseof_avaliacao","ofch_faseof_culpada":"ofch_faseof_culpada"},
                        is_errors=True),
        ]

        available = set((load_report.get("results") or {}).keys())
        results: Dict[str, Any] = {}
        total_processed = 0
        total_rejected = 0

        try:
            for cfg in configs:
                if cfg.sheet_name not in available:
                    continue
                r = self.merge_sheet(cfg)
                results[cfg.sheet_name] = r
                total_processed += int(r["processed"])
                total_rejected += int(r["rejected"])

            self.populate_derived_columns()
            self._update_ingestion_run_status("MERGE_DONE")

            return {
                "run_id": self.run_id,
                "merged_sheets": len(results),
                "total_processed": total_processed,
                "total_rejected": total_rejected,
                "results": results,
            }
        except Exception as e:
            self._update_ingestion_run_status("MERGE_FAILED", f"{type(e).__name__}: {e}")
            raise


def _get_latest_run_id(engine: Engine) -> int:
    with engine.begin() as conn:
        r = conn.execute(text("SELECT run_id FROM ingestion_runs ORDER BY run_id DESC LIMIT 1")).fetchone()
        if not r:
            raise RuntimeError("No ingestion_runs found.")
        return int(r[0])


def main() -> None:
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise SystemExit("DATABASE_URL em falta.")

    engine = create_engine(db_url, pool_pre_ping=True, future=True)
    run_id = int(os.environ.get("INGESTION_RUN_ID") or _get_latest_run_id(engine))

    processed_dir = Path(__file__).resolve().parents[2] / "data" / "processed"
    load_report_path = processed_dir / "load_report.json"
    if not load_report_path.exists():
        raise SystemExit(f"load_report.json não existe: {load_report_path}")

    with open(load_report_path, "r", encoding="utf-8") as f:
        load_report = json.load(f)

    merger = CoreMerger(db_url, run_id)
    report = merger.merge_all(load_report)

    merge_report = processed_dir / "merge_report.json"
    with open(merge_report, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("✅ MERGE OK:", merge_report)


if __name__ == "__main__":
    main()
