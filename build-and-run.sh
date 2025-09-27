#!/bin/bash

echo "🏗️  Gerando build de produção..."
cd config-ui
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build React gerado com sucesso!"
    echo "� Gerando executável..."
    cd ..
    npm run build:exe
    
    if [ $? -eq 0 ]; then
        echo "✅ Executável gerado com sucesso!"
        echo "📁 Localizado em: ./dist-final/"
        echo "🚀 Executando aplicação..."
        npm start
    else
        echo "❌ Erro ao gerar executável!"
        echo "🚀 Executando versão de desenvolvimento..."
        npm start
    fi
else
    echo "❌ Erro ao gerar build!"
    exit 1
fi
