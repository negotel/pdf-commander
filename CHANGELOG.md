# 📋 Changelog - PDF Commander

Todos as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-26

### ✨ Adicionado
- **Sistema de atualização automática**: Verificação e instalação automática de novas versões via GitHub Releases
- **Interface React moderna**: UI completamente redesenhada com TailwindCSS e componentes responsivos
- **Processamento avançado de PDFs**:
  - União de múltiplos PDFs
  - Normalização para tamanhos padrão (100x145mm)
  - Layout em grade (4 PDFs por página A4)
  - Corte de PDFs em páginas individuais
- **Sistema completo de etiquetas**:
  - Geração automática com códigos de barras
  - Suporte a impressoras Zebra (ZPL)
  - Templates customizáveis
  - Múltiplos formatos de código (EAN-13, Code 128, QR Code)
- **Dashboard de monitoramento**: Estatísticas em tempo real e logs detalhados
- **Backup automático**: Preservação de arquivos originais
- **Instalador Windows**: Setup profissional com atalhos na área de trabalho
- **Configurações avançadas**: Interface para personalizar parâmetros

### 🔧 Alterado
- Migração completa para Electron + React
- Estrutura de projeto reorganizada
- Sistema de build otimizado com electron-builder

### 🐛 Corrigido
- Problemas de compatibilidade com diferentes versões de PDFs
- Erros de processamento em lote
- Problemas de interface em diferentes resoluções

### 📚 Documentação
- README detalhado com instruções completas
- Guia de contribuição para desenvolvedores
- Documentação do sistema de atualização
- Licença MIT adicionada

## [0.1.0] - 2025-09-XX (Versão Inicial)

### ✨ Adicionado
- Funcionalidades básicas de processamento de PDFs
- Interface de linha de comando
- Estrutura inicial do projeto

---

## 📝 Tipos de Mudanças

- `✨ Adicionado` - para novos recursos
- `🔧 Alterado` - para mudanças em recursos existentes
- `🐛 Corrigido` - para correções de bugs
- `🗑️ Removido` - para recursos removidos
- `📚 Documentação` - para mudanças na documentação
- `🎨 Estilo` - para mudanças de formatação/código
- `♻️ Refatorado` - para refatoração de código
- `⚡ Performance` - para melhorias de performance
- `🧪 Testes` - para adição ou correção de testes
- `🔧 Build` - para mudanças no sistema de build
- `📦 Dependências` - para atualização de dependências

## 🤝 Como Contribuir

Para contribuir com mudanças, siga o [Guia de Contribuição](CONTRIBUTING.md).

---

**Legenda:**
- 🔄 = Mudança significativa
- ⚠️ = Possível quebra de compatibilidade
- 🆕 = Novo recurso
- 🐛 = Correção de bug