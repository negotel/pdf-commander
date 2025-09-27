#!/bin/bash

echo "🧹 Limpando processos e arquivos antes do build..."

# Mata processos do Electron se existirem
echo "🔍 Verificando processos em execução..."
pkill -f electron 2>/dev/null || echo "Nenhum processo Electron encontrado"
pkill -f Processador 2>/dev/null || echo "Nenhum processo Processador encontrado"

# Aguarda um pouco para os processos terminarem
sleep 2

# Tenta remover o diretório dist-final
echo "📁 Removendo diretório dist-final..."
if [ -d "dist-final" ]; then
    rm -rf dist-final 2>/dev/null || {
        echo "⚠️  Não foi possível remover automaticamente."
        echo "💡 Feche manualmente qualquer instância do Processador.exe e tente novamente."
        exit 1
    }
fi

echo "✅ Limpeza concluída!"
echo ""
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
    echo "💡 Tente fechar todas as instâncias do programa e executar novamente."
    exit 1
fi

echo "✅ Executável gerado com sucesso!"
echo ""
echo "📁 Arquivos gerados em: ./dist-final/"
echo "   📦 Processador Setup 1.0.0.exe - Instalador"
echo "   📂 win-unpacked/ - Aplicação portável"
echo ""
echo "🎯 Para executar:"
echo "   • Instalar: Execute 'Processador Setup 1.0.0.exe'"
echo "   • Portável: Execute './dist-final/win-unpacked/Processador.exe'"
echo ""
echo "✅ Build completo finalizado!"
