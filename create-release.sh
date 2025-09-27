#!/bin/bash

# Script para criar release via GitHub API
# Uso: ./create-release.sh <tag> <token>

set -e

TAG_NAME=$1
TOKEN=$2

if [ -z "$TAG_NAME" ] || [ -z "$TOKEN" ]; then
    echo "Uso: $0 <tag> <token>"
    echo "Exemplo: $0 v1.1.2 ghp_xxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

REPO_OWNER="negotel"
REPO_NAME="pdf-commander"

echo "🚀 Criando release $TAG_NAME..."

# 1. Criar o release
echo "📝 Criando release..."
cat > /tmp/release-data.json << EOF
{
  "tag_name": "$TAG_NAME",
  "name": "PDF Commander $TAG_NAME",
  "body": "🎉 **PDF Commander $TAG_NAME**\\n\\n⚡ Uma ferramenta desktop profissional para manipulação avançada de PDFs!\\n\\n## ✨ Funcionalidades\\n- 🔄 União automática de múltiplos PDFs\\n- 📏 Normalização para tamanhos padrão (100x145mm)\\n- 📑 Layout em grade (4 PDFs por página A4)\\n- 🏷️ Sistema completo de geração de etiquetas\\n- 📊 Dashboard de monitoramento em tempo real\\n- 🔄 Atualização automática via GitHub\\n- 💾 Backup automático de arquivos\\n\\n## 📥 Instalação\\n1. Baixe o arquivo \`PDF Commander Setup $TAG_NAME.exe\`\\n2. Execute o instalador\\n3. Siga as instruções na tela\\n\\n## 🤖 Desenvolvido com IA\\nEste projeto foi criado utilizando tecnologias de IA para acelerar o desenvolvimento e otimizar a experiência do usuário.\\n\\n---\\n**⭐ Se este projeto foi útil para você, considere dar uma estrela!**",
  "draft": false,
  "prerelease": false
}
EOF

CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/release-data.json \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases")

# Extrair o upload_url
UPLOAD_URL=$(echo $CREATE_RESPONSE | jq -r '.upload_url' | sed 's/{.*}//')

if [ "$UPLOAD_URL" = "null" ] || [ -z "$UPLOAD_URL" ]; then
    echo "❌ Erro ao criar release:"
    echo $CREATE_RESPONSE
    exit 1
fi

echo "✅ Release criado com sucesso!"

# 2. Fazer upload dos arquivos
echo "📎 Fazendo upload dos arquivos..."

# Instalador
echo "📎 Upload instalador..."
curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"dist-release/PDF Commander Setup 1.0.0.exe" \
  "$UPLOAD_URL?name=PDF Commander Setup $TAG_NAME.exe"

# Blockmap
echo "📎 Upload blockmap..."
curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"dist-release/PDF Commander Setup 1.0.0.exe.blockmap" \
  "$UPLOAD_URL?name=PDF Commander Setup $TAG_NAME.exe.blockmap"

# Latest.yml
echo "📎 Upload latest.yml..."
curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/x-yaml" \
  --data-binary @dist-release/latest.yml \
  "$UPLOAD_URL?name=latest.yml"

echo "🎉 Release $TAG_NAME criado com sucesso!"
echo "📍 URL: https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$TAG_NAME"