#!/bin/bash

echo "🏗️  Gerando build de produção..."

# Navegue para a pasta do React
cd config-ui

# Execute o build
npm run build

# Verifique se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build gerado com sucesso!"
    echo "📁 Arquivos gerados em: ./config-ui/build/"
    echo ""
    echo "Para executar a aplicação em produção:"
    echo "  npm start"
    echo ""
    echo "Para executar o build automaticamente:"
    echo "  ./build-and-run.sh"
else
    echo "❌ Erro ao gerar build!"
    exit 1
fi
