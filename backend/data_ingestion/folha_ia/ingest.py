"""Main ingestion script for Folha_IA.xlsx."""
import logging
from pathlib import Path
from typing import Dict, Optional
import pandas as pd
from sqlalchemy.orm import Session

from backend.config import FOLHA_IA_PATH
from backend.models.database import get_session, init_db
from backend.data_ingestion.folha_ia.excel_reader import read_excel_sheets, get_sheet_structure
from backend.data_ingestion.folha_ia.data_cleaner import handle_duplicates
from backend.data_ingestion.folha_ia.mappers import (
    map_order_row,
    map_order_phase_row,
    map_worker_row,
    map_phase_row,
    map_product_row,
    map_order_phase_worker_row,
    map_order_error_row,
    map_worker_phase_skill_row,
    map_product_phase_standard_row,
)
from backend.models import (
    Order,
    OrderPhase,
    Worker,
    Phase,
    Product,
    OrderPhaseWorker,
    OrderError,
    WorkerPhaseSkill,
    ProductPhaseStandard,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FolhaIAIngester:
    """Main ingestion class for Folha IA data."""
    
    def __init__(self, file_path: Optional[str] = None, session: Optional[Session] = None):
        """
        Initialize ingester.
        
        Args:
            file_path: Path to Excel file.
            session: Database session. If None, creates new one.
        """
        self.file_path = file_path or FOLHA_IA_PATH
        self.session = session or get_session()
        self.sheets: Dict[str, pd.DataFrame] = {}
        self.structure: Dict = {}
    
    def analyze_structure(self) -> Dict:
        """
        Analyze Excel file structure.
        
        Returns:
            Structure information dictionary.
        """
        logger.info(f"Analyzing structure of {self.file_path}")
        self.structure = get_sheet_structure(self.file_path)
        return self.structure
    
    def load_sheets(self):
        """Load all sheets from Excel file."""
        logger.info(f"Loading sheets from {self.file_path}")
        self.sheets = read_excel_sheets(self.file_path)
        logger.info(f"Loaded {len(self.sheets)} sheets: {list(self.sheets.keys())}")
    
    def ingest_products(self) -> Dict[str, int]:
        """
        Ingest products (Modelos) sheet.
        
        Returns:
            Dictionary with counts: {'inserted': X, 'updated': Y}
        """
        if "Modelos" not in self.sheets:
            logger.warning("Modelos sheet not found")
            return {"inserted": 0, "updated": 0}
        
        df = self.sheets["Modelos"]
        df = handle_duplicates(df, ["Modelo_Id"])
        
        inserted = 0
        updated = 0
        
        for _, row in df.iterrows():
            mapped = map_product_row(row)
            
            if not mapped.get("product_code"):
                continue
            
            # Check if exists
            existing = self.session.query(Product).filter(
                Product.product_code == mapped["product_code"]
            ).first()
            
            if existing:
                # Update
                for key, value in mapped.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                updated += 1
            else:
                # Insert
                product = Product(**mapped)
                self.session.add(product)
                inserted += 1
        
        self.session.commit()
        logger.info(f"Products: {inserted} inserted, {updated} updated")
        return {"inserted": inserted, "updated": updated}
    
    def ingest_phases(self) -> Dict[str, int]:
        """
        Ingest phases (Fases) sheet.
        
        Returns:
            Dictionary with counts.
        """
        if "Fases" not in self.sheets:
            logger.warning("Fases sheet not found")
            return {"inserted": 0, "updated": 0}
        
        df = self.sheets["Fases"]
        df = handle_duplicates(df, ["Fase_Id"])
        
        inserted = 0
        updated = 0
        
        for _, row in df.iterrows():
            mapped = map_phase_row(row)
            
            if not mapped.get("phase_code"):
                continue
            
            existing = self.session.query(Phase).filter(
                Phase.phase_code == mapped["phase_code"]
            ).first()
            
            if existing:
                for key, value in mapped.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                updated += 1
            else:
                phase = Phase(**mapped)
                self.session.add(phase)
                inserted += 1
        
        self.session.commit()
        logger.info(f"Phases: {inserted} inserted, {updated} updated")
        return {"inserted": inserted, "updated": updated}
    
    def ingest_workers(self) -> Dict[str, int]:
        """
        Ingest workers (Funcionarios) sheet.
        
        Returns:
            Dictionary with counts.
        """
        if "Funcionarios" not in self.sheets:
            logger.warning("Funcionarios sheet not found")
            return {"inserted": 0, "updated": 0}
        
        df = self.sheets["Funcionarios"]
        df = handle_duplicates(df, ["Funcionario_Id"])
        
        inserted = 0
        updated = 0
        
        for _, row in df.iterrows():
            mapped = map_worker_row(row)
            
            if not mapped.get("worker_code"):
                continue
            
            existing = self.session.query(Worker).filter(
                Worker.worker_code == mapped["worker_code"]
            ).first()
            
            if existing:
                for key, value in mapped.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                updated += 1
            else:
                worker = Worker(**mapped)
                self.session.add(worker)
                inserted += 1
        
        self.session.commit()
        logger.info(f"Workers: {inserted} inserted, {updated} updated")
        return {"inserted": inserted, "updated": updated}
    
    def ingest_orders(self) -> Dict[str, int]:
        """
        Ingest orders (OrdensFabrico) sheet.
        
        Returns:
            Dictionary with counts.
        """
        if "OrdensFabrico" not in self.sheets:
            logger.warning("OrdensFabrico sheet not found")
            return {"inserted": 0, "updated": 0}
        
        df = self.sheets["OrdensFabrico"]
        df = handle_duplicates(df, ["Of_Id"])
        
        inserted = 0
        updated = 0
        
        for _, row in df.iterrows():
            mapped = map_order_row(row)
            
            if not mapped.get("of_id"):
                continue
            
            # Lookup product_id if product_code is provided
            if "product_code" in mapped:
                product = self.session.query(Product).filter(
                    Product.product_code == mapped["product_code"]
                ).first()
                if product:
                    mapped["product_id"] = product.id
                del mapped["product_code"]
            
            existing = self.session.query(Order).filter(
                Order.of_id == mapped["of_id"]
            ).first()
            
            if existing:
                for key, value in mapped.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                updated += 1
            else:
                order = Order(**mapped)
                self.session.add(order)
                inserted += 1
        
        self.session.commit()
        logger.info(f"Orders: {inserted} inserted, {updated} updated")
        return {"inserted": inserted, "updated": updated}
    
    def ingest_order_phases(self) -> Dict[str, int]:
        """
        Ingest order phases (FasesOrdemFabrico) sheet.
        
        Returns:
            Dictionary with counts.
        """
        if "FasesOrdemFabrico" not in self.sheets:
            logger.warning("FasesOrdemFabrico sheet not found")
            return {"inserted": 0, "updated": 0}
        
        df = self.sheets["FasesOrdemFabrico"]
        df = handle_duplicates(df, ["FaseOf_Id"])
        
        inserted = 0
        updated = 0
        skipped = 0
        
        for _, row in df.iterrows():
            mapped = map_order_phase_row(row)
            
            if not mapped.get("fase_of_id"):
                skipped += 1
                continue
            
            # Lookup order.id from of_id (String)
            if "of_id" in mapped and mapped["of_id"]:
                order = self.session.query(Order).filter(
                    Order.of_id == mapped["of_id"]
                ).first()
                if order:
                    mapped["of_id"] = order.id
                else:
                    logger.warning(f"Order not found for of_id: {mapped['of_id']}")
                    skipped += 1
                    continue
            else:
                skipped += 1
                continue
            
            # Lookup phase.id from phase_code
            if "phase_code" in mapped and mapped["phase_code"]:
                phase = self.session.query(Phase).filter(
                    Phase.phase_code == str(mapped["phase_code"])
                ).first()
                if phase:
                    mapped["phase_id"] = phase.id
                del mapped["phase_code"]
            
            existing = self.session.query(OrderPhase).filter(
                OrderPhase.fase_of_id == mapped["fase_of_id"]
            ).first()
            
            if existing:
                for key, value in mapped.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                updated += 1
            else:
                order_phase = OrderPhase(**mapped)
                self.session.add(order_phase)
                inserted += 1
            
            # Commit in batches for performance
            if (inserted + updated) % 10000 == 0:
                self.session.commit()
                logger.info(f"Order phases progress: {inserted} inserted, {updated} updated, {skipped} skipped")
        
        self.session.commit()
        logger.info(f"Order phases: {inserted} inserted, {updated} updated, {skipped} skipped")
        return {"inserted": inserted, "updated": updated, "skipped": skipped}
    
    def ingest_product_phase_standards(self) -> Dict[str, int]:
        """
        Ingest product phase standards (FasesStandardModelos) sheet.
        
        Returns:
            Dictionary with counts.
        """
        if "FasesStandardModelos" not in self.sheets:
            logger.warning("FasesStandardModelos sheet not found")
            return {"inserted": 0, "updated": 0}
        
        df = self.sheets["FasesStandardModelos"]
        df = handle_duplicates(df, ["ProdutoFase_ProdutoId", "ProdutoFase_FaseId", "ProdutoFase_Sequencia"])
        
        inserted = 0
        updated = 0
        skipped = 0
        
        for _, row in df.iterrows():
            mapped = map_product_phase_standard_row(row)
            
            if not mapped.get("product_code") or not mapped.get("phase_code"):
                skipped += 1
                continue
            
            # Lookup product.id from product_code
            product = self.session.query(Product).filter(
                Product.product_code == str(mapped["product_code"])
            ).first()
            if not product:
                skipped += 1
                continue
            mapped["product_id"] = product.id
            del mapped["product_code"]
            
            # Lookup phase.id from phase_code
            phase = self.session.query(Phase).filter(
                Phase.phase_code == str(mapped["phase_code"])
            ).first()
            if not phase:
                skipped += 1
                continue
            mapped["phase_id"] = phase.id
            del mapped["phase_code"]
            
            # Check if exists (composite key: product_id + phase_id + sequence_order)
            existing = self.session.query(ProductPhaseStandard).filter(
                ProductPhaseStandard.product_id == mapped["product_id"],
                ProductPhaseStandard.phase_id == mapped["phase_id"],
                ProductPhaseStandard.sequence_order == mapped.get("sequence_order", 0)
            ).first()
            
            if existing:
                for key, value in mapped.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                updated += 1
            else:
                product_phase_std = ProductPhaseStandard(**mapped)
                self.session.add(product_phase_std)
                inserted += 1
            
            # Commit in batches
            if (inserted + updated) % 5000 == 0:
                self.session.commit()
                logger.info(f"Product phase standards progress: {inserted} inserted, {updated} updated")
        
        self.session.commit()
        logger.info(f"Product phase standards: {inserted} inserted, {updated} updated, {skipped} skipped")
        return {"inserted": inserted, "updated": updated, "skipped": skipped}
    
    def ingest_worker_phase_skills(self) -> Dict[str, int]:
        """
        Ingest worker phase skills (FuncionariosFasesAptos) sheet.
        
        Returns:
            Dictionary with counts.
        """
        if "FuncionariosFasesAptos" not in self.sheets:
            logger.warning("FuncionariosFasesAptos sheet not found")
            return {"inserted": 0, "updated": 0}
        
        df = self.sheets["FuncionariosFasesAptos"]
        df = handle_duplicates(df, ["FuncionarioFase_FuncionarioId", "FuncionarioFase_FaseId"])
        
        inserted = 0
        updated = 0
        skipped = 0
        
        for _, row in df.iterrows():
            mapped = map_worker_phase_skill_row(row)
            
            if not mapped.get("worker_code") or not mapped.get("phase_code"):
                skipped += 1
                continue
            
            # Lookup worker.id from worker_code
            worker = self.session.query(Worker).filter(
                Worker.worker_code == str(mapped["worker_code"])
            ).first()
            if not worker:
                skipped += 1
                continue
            mapped["worker_id"] = worker.id
            del mapped["worker_code"]
            
            # Lookup phase.id from phase_code
            phase = self.session.query(Phase).filter(
                Phase.phase_code == str(mapped["phase_code"])
            ).first()
            if not phase:
                skipped += 1
                continue
            mapped["phase_id"] = phase.id
            del mapped["phase_code"]
            
            # Check if exists (composite key: worker_id + phase_id)
            existing = self.session.query(WorkerPhaseSkill).filter(
                WorkerPhaseSkill.worker_id == mapped["worker_id"],
                WorkerPhaseSkill.phase_id == mapped["phase_id"]
            ).first()
            
            if existing:
                for key, value in mapped.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                updated += 1
            else:
                worker_phase_skill = WorkerPhaseSkill(**mapped)
                self.session.add(worker_phase_skill)
                inserted += 1
        
        self.session.commit()
        logger.info(f"Worker phase skills: {inserted} inserted, {updated} updated, {skipped} skipped")
        return {"inserted": inserted, "updated": updated, "skipped": skipped}
    
    def ingest_order_phase_workers(self) -> Dict[str, int]:
        """
        Ingest order phase workers (FuncionariosFaseOrdemFabrico) sheet.
        
        Returns:
            Dictionary with counts.
        """
        if "FuncionariosFaseOrdemFabrico" not in self.sheets:
            logger.warning("FuncionariosFaseOrdemFabrico sheet not found")
            return {"inserted": 0, "updated": 0}
        
        df = self.sheets["FuncionariosFaseOrdemFabrico"]
        df = handle_duplicates(df, ["FuncionarioFaseOf_FaseOfId", "FuncionarioFaseOf_FuncionarioId"])
        
        inserted = 0
        updated = 0
        skipped = 0
        
        for _, row in df.iterrows():
            mapped = map_order_phase_worker_row(row)
            
            if not mapped.get("fase_of_id") or not mapped.get("worker_code"):
                skipped += 1
                continue
            
            # Lookup order_phase.id from fase_of_id
            order_phase = self.session.query(OrderPhase).filter(
                OrderPhase.fase_of_id == str(mapped["fase_of_id"])
            ).first()
            if not order_phase:
                skipped += 1
                continue
            mapped["order_phase_id"] = order_phase.id
            del mapped["fase_of_id"]
            
            # Lookup worker.id from worker_code
            worker = self.session.query(Worker).filter(
                Worker.worker_code == str(mapped["worker_code"])
            ).first()
            if not worker:
                skipped += 1
                continue
            mapped["worker_id"] = worker.id
            del mapped["worker_code"]
            
            # Check if exists (composite key: order_phase_id + worker_id)
            existing = self.session.query(OrderPhaseWorker).filter(
                OrderPhaseWorker.order_phase_id == mapped["order_phase_id"],
                OrderPhaseWorker.worker_id == mapped["worker_id"]
            ).first()
            
            if existing:
                for key, value in mapped.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                updated += 1
            else:
                order_phase_worker = OrderPhaseWorker(**mapped)
                self.session.add(order_phase_worker)
                inserted += 1
            
            # Commit in batches
            if (inserted + updated) % 10000 == 0:
                self.session.commit()
                logger.info(f"Order phase workers progress: {inserted} inserted, {updated} updated, {skipped} skipped")
        
        self.session.commit()
        logger.info(f"Order phase workers: {inserted} inserted, {updated} updated, {skipped} skipped")
        return {"inserted": inserted, "updated": updated, "skipped": skipped}
    
    def ingest_order_errors(self) -> Dict[str, int]:
        """
        Ingest order errors (OrdemFabricoErros) sheet.
        
        Returns:
            Dictionary with counts.
        """
        if "OrdemFabricoErros" not in self.sheets:
            logger.warning("OrdemFabricoErros sheet not found")
            return {"inserted": 0, "updated": 0}
        
        df = self.sheets["OrdemFabricoErros"]
        # No natural unique key, so we'll insert all
        
        inserted = 0
        skipped = 0
        
        for _, row in df.iterrows():
            mapped = map_order_error_row(row)
            
            if not mapped.get("of_id"):
                skipped += 1
                continue
            
            # Lookup order.id from of_id
            order = self.session.query(Order).filter(
                Order.of_id == str(mapped["of_id"])
            ).first()
            if not order:
                skipped += 1
                continue
            mapped["order_id"] = order.id
            del mapped["of_id"]
            
            # Lookup order_phase.id from fase_of_avaliacao_id if available
            if "fase_of_avaliacao_id" in mapped and mapped["fase_of_avaliacao_id"]:
                order_phase = self.session.query(OrderPhase).filter(
                    OrderPhase.fase_of_id == str(mapped["fase_of_avaliacao_id"])
                ).first()
                if order_phase:
                    mapped["order_phase_id"] = order_phase.id
                # Keep fase_of_avaliacao_id and fase_of_culpada_id as strings for reference
            
            order_error = OrderError(**mapped)
            self.session.add(order_error)
            inserted += 1
            
            # Commit in batches
            if inserted % 10000 == 0:
                self.session.commit()
                logger.info(f"Order errors progress: {inserted} inserted, {skipped} skipped")
        
        self.session.commit()
        logger.info(f"Order errors: {inserted} inserted, {skipped} skipped")
        return {"inserted": inserted, "skipped": skipped}
    
    def ingest_all(self) -> Dict[str, Dict[str, int]]:
        """
        Ingest all sheets in correct order (respecting FK dependencies).
        
        Returns:
            Dictionary with ingestion results per entity.
        """
        logger.info("Starting full ingestion process")
        
        # Initialize database
        init_db()
        
        # Load sheets
        self.load_sheets()
        
        # Ingest in dependency order
        results = {}
        
        # 1. Master data (no dependencies)
        results["products"] = self.ingest_products()
        results["phases"] = self.ingest_phases()
        results["workers"] = self.ingest_workers()
        
        # 2. Orders (depends on products)
        results["orders"] = self.ingest_orders()
        
        # 3. Order phases (depends on orders and phases)
        results["order_phases"] = self.ingest_order_phases()
        
        # 4. Product phase standards (depends on products and phases)
        results["product_phase_standards"] = self.ingest_product_phase_standards()
        
        # 5. Worker phase skills (depends on workers and phases)
        results["worker_phase_skills"] = self.ingest_worker_phase_skills()
        
        # 6. Order phase workers (depends on order_phases and workers)
        results["order_phase_workers"] = self.ingest_order_phase_workers()
        
        # 7. Order errors (depends on orders and optionally order_phases)
        results["order_errors"] = self.ingest_order_errors()
        
        logger.info("Ingestion completed")
        return results


def main():
    """Main entry point for ingestion."""
    ingester = FolhaIAIngester()
    
    # First, analyze structure
    structure = ingester.analyze_structure()
    logger.info(f"Excel structure: {list(structure.keys())}")
    
    # Then ingest
    results = ingester.ingest_all()
    logger.info(f"Ingestion results: {results}")


if __name__ == "__main__":
    main()


