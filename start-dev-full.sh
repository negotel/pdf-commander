#!/bin/bash

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Mata processos anteriores se existirem
echo "🧹 Limpando processos anteriores..."
pkill -f "react-scripts"
pkill -f "electron"

# Inicia o servidor React em background
echo "⚛️  Iniciando servidor React na porta 3001..."
cd /c/projetos-pessoal/unir-pdfs/config-ui
PORT=3001 npm start &
REACT_PID=$!

# Aguarda o React inicializar
echo "⏳ Aguardando React inicializar..."
sleep 8

# Inicia o Electron
echo "🖥️  Iniciando Electron..."
cd /c/projetos-pessoal/unir-pdfs
NODE_ENV=development npm start &
ELECTRON_PID=$!

echo "✅ Ambiente iniciado!"
echo "📱 React: http://localhost:3001"
echo "🖥️  Electron: PID $ELECTRON_PID"
echo ""
echo "Para parar, pressione Ctrl+C ou execute:"
echo "kill $REACT_PID $ELECTRON_PID"

# Aguarda sinais para terminar
trap "echo '🛑 Parando serviços...'; kill $REACT_PID $ELECTRON_PID 2>/dev/null; exit" INT TERM

# Mantém o script rodando
wait
