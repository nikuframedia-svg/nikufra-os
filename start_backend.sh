#!/bin/bash

echo "🚀 Iniciando backend ProdPlan 4.0 OS..."
echo ""
echo "📦 Verificando dependências..."

if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "Instalando dependências..."
  pip3 install -r requirements.txt
fi

echo ""
echo "✅ Iniciando servidor na porta 8000..."
echo "🌐 A API estará disponível em: http://localhost:8000"
echo "📚 Documentação: http://localhost:8000/docs"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""

cd /Users/martimnicolau/nelo
python3 -m uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000


