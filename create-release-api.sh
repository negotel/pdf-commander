#!/bin/bash

# Script de Release Automático via API do GitHub
# Uso: ./create-release-api.sh

set -e

echo "🚀 PDF Commander - Release Automático via API"
echo "=============================================="

# Verificar se GITHUB_TOKEN está definido
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Erro: GITHUB_TOKEN não definido"
    echo "Configure a variável de ambiente: export GITHUB_TOKEN=seu_token_aqui"
    exit 1
fi

# Verificar se estamos em uma tag
if ! git describe --tags --exact-match >/dev/null 2>&1; then
    echo "❌ Erro: Este commit não está em uma tag"
    echo "Use: git tag -a v1.0.9 -m 'Release message' && git push origin v1.0.9"
    exit 1
fi

echo "✅ Tag verificada: $(git describe --tags --exact-match)"
echo ""

# Executar o script Node.js
node create-release-api.js

echo ""
echo "🎉 Processo de release concluído!"
echo "Verifique a release em: https://github.com/negotel/pdf-commander/releases"