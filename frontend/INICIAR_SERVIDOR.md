# 🚀 Como Iniciar o Servidor de Desenvolvimento

## Método 1: Usando o script (Recomendado)

```bash
cd frontend
./start-dev.sh
```

## Método 2: Manual

```bash
cd frontend
npm install  # Apenas na primeira vez
npm run dev
```

## 🌐 Acesso

Depois de iniciar, a aplicação estará disponível em:

**http://localhost:3000**

## 📋 Páginas Disponíveis

- **http://localhost:3000/overview** - Overview da Fábrica
- **http://localhost:3000/work-centers** - Lista de Centros de Trabalho
- **http://localhost:3000/work-centers/MC-01** - Detalhe de um Centro (exemplo)

## ⚠️ Notas

- O servidor usa a porta **3000** por padrão
- Se a porta estiver ocupada, o Vite tentará usar a próxima disponível
- O servidor tem hot-reload: mudanças no código são refletidas automaticamente
- Para parar o servidor, pressione `Ctrl+C`

## 🔧 Configuração de Variáveis de Ambiente

No Vite, as variáveis de ambiente devem começar com `VITE_` para serem expostas ao código do cliente.

Criar ficheiro `.env` na pasta `frontend`:
```
VITE_API_URL=http://localhost:8000/api
```

## 🔧 Troubleshooting

### Porta já em uso
```bash
# Verificar o que está a usar a porta 3000
lsof -ti:3000

# Matar o processo se necessário
kill -9 $(lsof -ti:3000)
```

### Erros de dependências
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erros de TypeScript
```bash
# Verificar erros
npm run build
```

