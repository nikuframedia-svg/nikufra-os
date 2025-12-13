#!/bin/bash

echo "🚀 Iniciando servidor de desenvolvimento ProdPlan 4.0 OS..."
echo ""
echo "📦 Verificando dependências..."

if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm install
fi

echo ""
echo "✅ Iniciando servidor na porta 3000..."
echo "🌐 A aplicação estará disponível em: http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""

npm run dev


