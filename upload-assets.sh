#!/bin/bash

# Script para fazer upload de assets para release existente
# Uso: ./upload-assets.sh <tag>

set -e

TAG_NAME=$1

if [ -z "$TAG_NAME" ]; then
    echo "Uso: $0 <tag>"
    echo "Exemplo: $0 v1.0.7"
    exit 1
fi

REPO_OWNER="negotel"
REPO_NAME="pdf-commander"

echo "📎 Fazendo upload de assets para $TAG_NAME..."

# Pegar token
TOKEN=$(cat token | cut -d' ' -f2)

# Obter upload_url do release existente
UPLOAD_URL=$(curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/tags/$TAG_NAME" | \
  jq -r '.upload_url' | sed 's/{.*}//')

if [ "$UPLOAD_URL" = "null" ] || [ -z "$UPLOAD_URL" ]; then
    echo "❌ Release não encontrado ou erro na API"
    exit 1
fi

echo "✅ Release encontrado!"
echo "📎 Upload URL: $UPLOAD_URL"

# Fazer upload dos arquivos
echo "📎 Upload instalador..."
curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"dist-release/PDF Commander Setup 1.0.0.exe" \
  "$UPLOAD_URL?name=PDF Commander Setup $TAG_NAME.exe"

echo "📎 Upload blockmap..."
curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"dist-release/PDF Commander Setup 1.0.0.exe.blockmap" \
  "$UPLOAD_URL?name=PDF Commander Setup $TAG_NAME.exe.blockmap"

echo "📎 Upload latest.yml..."
curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/x-yaml" \
  --data-binary @"dist-release/latest.yml" \
  "$UPLOAD_URL?name=latest.yml"

echo "🎉 Upload concluído!"
echo "📍 URL: https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$TAG_NAME"