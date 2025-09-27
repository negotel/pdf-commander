#!/bin/bash

# Script para atualizar a versão no config.js da interface
# Uso: ./update-ui-version.sh

set -e

# Pegar versão do package.json raiz
VERSION=$(node -p "require('./package.json').version")

echo "🔄 Atualizando versão da interface para: $VERSION"

# Atualizar arquivo config.js
sed -i "s/version: '[0-9]\+\.[0-9]\+\.[0-9]\+'*,/version: '$VERSION',/" config-ui/src/config.js

echo "✅ Versão atualizada!"

# Reconstruir interface
echo "🏗️  Reconstruindo interface..."
cd config-ui && npm run build

echo "🎉 Interface atualizada com versão $VERSION!"