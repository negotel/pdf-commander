# ⚡ PDF Commander

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/SEU_USERNAME/pdf-commander/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-33.0.2-47848F)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB)](https://reactjs.org/)

> **PDF Commander** é uma ferramenta desktop profissional para manipulação avançada de arquivos PDF, desenvolvida com Electron e React. Oferece uma interface moderna e intuitiva para processar PDFs de forma eficiente e automatizada.

## ✨ Funcionalidades Principais

### � Processamento de PDFs
- **Unir PDFs**: Combina múltiplos arquivos PDF em um único documento
- **Normalização**: Redimensiona PDFs para tamanhos padrão (100x145mm)
- **Layout em Grade**: Organiza até 4 PDFs por página A4
- **Corte de PDFs**: Divide PDFs em páginas individuais ou seções específicas

### 🏷️ Sistema de Etiquetas
- **Geração Automática**: Cria etiquetas com códigos de barras
- **Formatos ZPL**: Suporte completo para impressoras Zebra
- **Códigos de Barras**: Geração de EAN-13, Code 128, QR Code
- **Templates Customizáveis**: Layouts flexíveis para diferentes necessidades

### 📊 Monitoramento e Analytics
- **Dashboard Interativo**: Visualização de estatísticas em tempo real
- **Logs Detalhados**: Rastreamento completo de operações
- **Relatórios de Performance**: Análise de produtividade e eficiência

### 🔄 Atualização Automática
- **Verificação Automática**: Busca por novas versões no GitHub
- **Download One-Click**: Instalação automática de atualizações
- **Notificações Inteligentes**: Alertas não-intrusivos sobre novas versões

### 💾 Gestão de Arquivos
- **Backup Automático**: Preservação de arquivos originais
- **Organização Inteligente**: Estrutura de pastas otimizada
- **Limpeza Automática**: Remoção de arquivos temporários

## 🖥️ Tecnologias Utilizadas

### Frontend
- **React 18.2.0** - Framework JavaScript para interfaces
- **TailwindCSS** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones moderna
- **Headless UI** - Componentes acessíveis

### Backend
- **Electron 33.0.2** - Framework para aplicações desktop
- **Node.js** - Runtime JavaScript
- **Express.js** - Servidor web para APIs locais

### Processamento de PDFs
- **PDF-lib** - Manipulação avançada de PDFs
- **PDFKit** - Geração de PDFs
- **Canvas** - Renderização gráfica
- **html2canvas** - Conversão HTML para imagens

### Utilitários
- **Axios** - Cliente HTTP para APIs
- **fs-extra** - Operações avançadas de filesystem
- **jsbarcode** - Geração de códigos de barras

## 📋 Pré-requisitos

- **Node.js** 18.x ou superior
- **npm** ou **yarn** para gerenciamento de pacotes
- **Windows 10/11** (64-bit)
- **Git** para controle de versão

## 🚀 Instalação

### Opção 1: Download do Executável (Recomendado)

1. Acesse as [Releases](https://github.com/SEU_USERNAME/pdf-commander/releases) do projeto
2. Baixe o arquivo `PDF-Commander-Setup-X.X.X.exe`
3. Execute o instalador e siga as instruções
4. O aplicativo será instalado automaticamente com ícones na área de trabalho e menu iniciar

### Opção 2: Compilação do Código Fonte

```bash
# Clone o repositório
git clone https://github.com/SEU_USERNAME/pdf-commander.git
cd pdf-commander

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev
```

## 📖 Como Usar

### Primeira Execução
1. Abra o PDF Commander
2. Configure as pastas de entrada e saída nas configurações
3. Adicione arquivos PDF na pasta `entrada/`
4. Use as abas para diferentes operações

### Funcionalidades Básicas

#### 🔄 Unir PDFs
1. Vá para a aba **"Unir PDFs"**
2. Clique em **"Processar PDFs"**
3. Os arquivos serão automaticamente:
   - Normalizados para 100x145mm
   - Organizados em grade (4 por página)
   - Salvos como `documento_unido.pdf`

#### 📏 Cortar PDFs
1. Vá para a aba **"Cortar PDF"**
2. Selecione o arquivo PDF
3. Escolha as páginas ou seções
4. Clique em **"Cortar"**

#### 🏷️ Gerar Etiquetas
1. Vá para a aba **"Etiquetas"**
2. Configure os produtos na aba **"Produtos"**
3. Ajuste o layout na aba **"Configuração"**
4. Clique em **"Gerar"** para criar as etiquetas

### Configurações Avançadas
- **Monitoramento**: Visualize estatísticas em tempo real
- **Logs**: Acompanhe todas as operações realizadas
- **Backup**: Arquivos originais são preservados automaticamente

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
pdf-commander/
├── main.js                 # Processo principal Electron
├── index.js                # Lógica de processamento de PDFs
├── update-service.js       # Sistema de atualização automática
├── config-manager.js       # Gerenciamento de configurações
├── monitoring-service.js   # Sistema de monitoramento
├── config-ui/              # Interface React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── contexts/       # Contextos React
│   │   └── index.js
│   └── package.json
├── entrada/                # Arquivos PDF de entrada
├── saida/                  # Arquivos processados
├── etiquetas/              # Etiquetas geradas
├── logs/                   # Arquivos de log
└── dist-release/           # Builds para distribuição
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Executa em modo desenvolvimento
npm start                # Executa a aplicação

# Build
npm run build:exe        # Cria instalador Windows
npm run build:pkg        # Cria executável standalone

# Utilitários
npm run config           # Abre interface de configuração
```

### Desenvolvimento da Interface
```bash
cd config-ui
npm install
npm start                 # Servidor de desenvolvimento React
```

## 📦 Build e Distribuição

### Criar Instalador Windows
```bash
npm run build:exe
```
O instalador será gerado em `dist-release/` com o nome `PDF Commander Setup X.X.X.exe`

### Criar Executável Standalone
```bash
npm run build:pkg
```
Executável será criado em `dist/monta-pdf.exe`

## 🔧 Configuração do Sistema de Atualização

Para configurar o sistema de atualização automática:

1. Edite `update-service.js`:
```javascript
this.config = {
    repoOwner: 'SEU_USERNAME_GITHUB',
    repoName: 'pdf-commander',
    currentVersion: '1.0.0'
};
```

2. Crie releases no GitHub com:
   - Tag: `vX.X.X`
   - Anexe o instalador `.exe`
   - Descrição das mudanças

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes de Contribuição
- Siga os padrões de código existentes
- Adicione testes para novas funcionalidades
- Atualize a documentação conforme necessário
- Use commits descritivos

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Edson Costa**
- GitHub: [@SEU_USERNAME](https://github.com/SEU_USERNAME)
- LinkedIn: [Seu LinkedIn](https://linkedin.com/in/SEU_LINKEDIN)

---

<div align="center">

**Feito com ❤️ para simplificar o trabalho com PDFs**

⭐ Se este projeto foi útil para você, considere dar uma estrela!

[📥 Download Latest Release](https://github.com/SEU_USERNAME/pdf-commander/releases/latest)

</div>

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
