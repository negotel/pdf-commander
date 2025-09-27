#!/bin/bash

# Script completo para release automatizado
# Incrementa versão, atualiza interface, cria release
# Uso: ./release.sh

set -e

echo "🚀 Iniciando processo de release automatizado..."

# 1. Incrementar versão (patch)
echo "📈 Incrementando versão..."
OLD_VERSION=$(node -p "require('./package.json').version")
npm version patch --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")

echo "✅ Versão atualizada: $OLD_VERSION → $NEW_VERSION"

# 2. Atualizar interface com nova versão
echo "� Atualizando interface..."
./update-ui-version.sh

# 3. Criar release
echo "📦 Criando release..."
TAG_NAME="v$NEW_VERSION"
TOKEN=$(cat token | cut -d' ' -f2)

./create-release.sh "$TAG_NAME" "$TOKEN"

echo ""
echo "🎉 RELEASE COMPLETO REALIZADO COM SUCESSO!"
echo "📋 Resumo:"
echo "   • Versão incrementada: $OLD_VERSION → $NEW_VERSION"
echo "   • Interface atualizada e reconstruída"
echo "   • Release criado: $TAG_NAME"
echo "   • Assets enviados (instalador, blockmap, latest.yml)"
echo ""
echo "📱 O aplicativo irá detectar a atualização automaticamente!"
echo "🔔 Modal de nova versão aparecerá para os usuários"
echo "📍 URL: https://github.com/negotel/pdf-commander/releases/tag/$TAG_NAME"