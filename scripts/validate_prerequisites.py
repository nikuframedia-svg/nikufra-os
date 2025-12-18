#!/usr/bin/env python3
"""
Valida pré-requisitos antes de rodar migrations e ingestão.
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.config import DATABASE_URL

def check_database():
    """Verifica se DATABASE_URL está configurado para PostgreSQL."""
    if not DATABASE_URL:
        print("❌ DATABASE_URL não está configurado")
        print("   Configure DATABASE_URL no .env ou export:")
        print("   export DATABASE_URL='postgresql://user:password@localhost:5432/nelo_db'")
        return False
    
    if DATABASE_URL.startswith("sqlite"):
        print("❌ DATABASE_URL está configurado para SQLite")
        print("   SQLite NÃO é suportado (migrations usam PARTITION BY, INCLUDE, etc.)")
        print("   Configure DATABASE_URL para PostgreSQL:")
        print("   export DATABASE_URL='postgresql://user:password@localhost:5432/nelo_db'")
        return False
    
    if not DATABASE_URL.startswith("postgresql://"):
        print(f"❌ DATABASE_URL não é PostgreSQL: {DATABASE_URL[:50]}...")
        print("   Apenas PostgreSQL é suportado")
        return False
    
    print(f"✅ DATABASE_URL configurado: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'OK'}")
    return True

def check_postgres_connection():
    """Tenta conectar ao PostgreSQL e verifica versão >= 15."""
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            # Test connection
            conn.execute(text("SELECT 1"))
            
            # Check PostgreSQL version (REQUIRED >= 15)
            result = conn.execute(text("SELECT version()"))
            version_str = result.scalar()
            
            # Extract version number (e.g., "PostgreSQL 15.3" -> 15)
            import re
            version_match = re.search(r'PostgreSQL (\d+)', version_str)
            if version_match:
                version_num = int(version_match.group(1))
                if version_num < 15:
                    print(f"❌ PostgreSQL versão {version_num} detectada")
                    print("   PostgreSQL 15+ é obrigatório")
                    print("   Algumas features (partitioning, INCLUDE, etc.) requerem PostgreSQL 15+")
                    return False
                else:
                    print(f"✅ PostgreSQL versão {version_num} OK (>= 15)")
            else:
                print("⚠️  Versão PostgreSQL não detectada, assumindo OK")
            
            # Check for required features
            try:
                # Test PARTITION BY (PostgreSQL 10+)
                conn.execute(text("SELECT 1 FROM (SELECT 1) AS test"))
                print("✅ PostgreSQL features OK")
            except Exception as e:
                print(f"⚠️  Erro ao verificar features: {e}")
            
        return True
    except Exception as e:
        print(f"❌ Erro ao conectar PostgreSQL: {e}")
        print("   Verifique se PostgreSQL está rodando e DATABASE_URL está correto")
        print("   Para iniciar via Docker: docker compose up -d db")
        return False

def check_excel_file():
    """Verifica se Excel file existe."""
    from backend.config import FOLHA_IA_PATH
    path = Path(FOLHA_IA_PATH)
    if path.exists():
        print(f"✅ Excel file encontrado: {FOLHA_IA_PATH}")
        return True
    else:
        print(f"❌ Excel file não encontrado: {FOLHA_IA_PATH}")
        print("   Coloque Folha_IA.xlsx em data/raw/")
        return False

def main():
    """Valida todos os pré-requisitos."""
    print("="*80)
    print("VALIDAÇÃO DE PRÉ-REQUISITOS")
    print("="*80)
    print()
    
    checks = []
    
    print("1. Verificando DATABASE_URL...")
    checks.append(check_database())
    print()
    
    if checks[-1]:
        print("2. Testando conexão PostgreSQL...")
        checks.append(check_postgres_connection())
        print()
    
    print("3. Verificando Excel file...")
    checks.append(check_excel_file())
    print()
    
    print("="*80)
    if all(checks):
        print("✅ TODOS OS PRÉ-REQUISITOS OK")
        print("   Pode prosseguir com: alembic upgrade head")
        return 0
    else:
        print("❌ PRÉ-REQUISITOS FALTANDO")
        print("   Corrija os problemas acima antes de continuar")
        return 1

if __name__ == "__main__":
    sys.exit(main())

