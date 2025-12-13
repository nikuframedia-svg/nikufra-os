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
        # TODO: Implement when needed
        
        # 4. Other relationships
        # TODO: Implement when needed
        
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


