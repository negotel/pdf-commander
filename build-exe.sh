#!/bin/bash

echo "🚀 Processador de PDFs - Build Completo"
echo "======================================="

echo "🏗️  1/3 - Gerando build React..."
cd config-ui
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao gerar build React!"
    exit 1
fi

echo "✅ Build React concluído!"

echo "📦 2/3 - Gerando executável..."
cd ..
npm run build:exe

if [ $? -ne 0 ]; then
    echo "❌ Erro ao gerar executável!"
    exit 1
fi

echo "✅ Executável gerado com sucesso!"
echo ""
echo "📁 Arquivos gerados em: ./dist-release/"
echo "   📦 Processador Setup 1.0.0.exe - Instalador"
echo "   📂 win-unpacked/ - Aplicação portável"
echo ""
echo "🎯 Para executar:"
echo "   • Instalar: Execute 'Processador Setup 1.0.0.exe'"
echo "   • Portável: Execute './dist-release/win-unpacked/Processador.exe'"
echo ""
echo "✅ Build completo finalizado!"
