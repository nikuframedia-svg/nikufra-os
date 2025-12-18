#!/bin/bash
# Script para rodar todos os testes de validação

echo "=========================================="
echo "TESTES DE VALIDAÇÃO - PRODPLAN 4.0 OS"
echo "=========================================="
echo ""

echo "1. Testes de Qualidade de Dados..."
pytest tests/test_data_quality.py -v -s
echo ""

echo "2. Testes de Integridade..."
pytest tests/test_integrity.py -v -s
echo ""

echo "3. Testes de Serviços Corrigidos..."
pytest tests/test_services_corrected.py -v -s
echo ""

echo "=========================================="
echo "TESTES CONCLUÍDOS"
echo "=========================================="

