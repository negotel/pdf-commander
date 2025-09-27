# 📄 Processador de PDFs

Sistema completo para unir, normalizar e organizar arquivos PDF com interface React moderna.

## ✨ Funcionalidades

- **🔄 Unir PDFs**: Combina múltiplos PDFs em um arquivo único
- **📏 Normalização**: Redimensiona PDFs para tamanho padrão (100x145mm)
- **📑 Layout Grade**: Organiza 4 PDFs por página A4
- **🏷️ Sistema de Etiquetas**: Gera etiquetas com código de barras
- **🖥️ Interface Moderna**: React + TailwindCSS
- **💾 Backup Automático**: Preserva arquivos originais
- **⚡ Electron App**: Executável standalone

## 🚀 Como Usar

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Instalar dependências do React
cd config-ui && npm install && cd ..

# Iniciar ambiente completo (React + Electron)
bash start-dev-full.sh
```

### Uso Básico
1. Coloque seus PDFs na pasta `entrada/`
2. Execute o aplicativo
3. Navegue para "Unir PDFs"
4. Configure as opções desejadas
5. Clique em "Unir PDFs"
6. Os arquivos processados aparecerão na pasta `saida/`

## 📁 Estrutura do Projeto

```
├── config-ui/          # Interface React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   └── App.js      # App principal
│   └── package.json    # Dependências React
├── entrada/            # PDFs de entrada
├── saida/              # PDFs processados
├── main.js             # Electron principal
├── index.js            # Engine de processamento
├── config-manager.js   # Gerenciamento de configurações
├── config.json         # Configurações do sistema
└── start-dev-full.sh   # Script de desenvolvimento
```

## 🔧 Arquivos Gerados

- `documento_unido.pdf` - PDF único com todas as páginas
- `composto_4por_folha.pdf` - PDF com 4 páginas por folha A4  
- `entrada_[DATA]_[N]arquivos.zip` - Backup dos originais

## 📦 Build para Produção

```bash
# Gerar build React
cd config-ui && npm run build && cd ..

# Criar executável (será implementado)
npm run dist
```

## 🛠️ Tecnologias

- **Electron** - Desktop app
- **React 18** - Interface moderna
- **TailwindCSS** - Estilização
- **PDF-lib** - Manipulação de PDFs
- **jsBarcode** - Geração de códigos de barras

## 📋 Requisitos

- Node.js 16+ (apenas para desenvolvimento)
- Windows/Mac/Linux

> **Nota**: O executável final não requer Node.js instalado no cliente.

## 🆘 Teste Rápido

```bash
# Criar PDFs de teste
node criar-teste.js

# Iniciar aplicativo
bash start-dev-full.sh
```
