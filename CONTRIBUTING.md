# 🤝 Guia de Contribuição - PDF Commander

Bem-vindo! Estamos felizes que você queira contribuir com o **PDF Commander**. Este documento contém diretrizes para ajudar você a contribuir de forma efetiva.

## 📋 Como Contribuir

### 1. Preparação do Ambiente

```bash
# Clone o repositório
git clone https://github.com/SEU_USERNAME/pdf-commander.git
cd pdf-commander

# Instale as dependências
npm install

# Instale dependências da interface
cd config-ui && npm install && cd ..
```

### 2. Desenvolvimento

```bash
# Execute em modo desenvolvimento
npm run dev

# Para desenvolvimento da interface React
cd config-ui && npm start
```

### 3. Fluxo de Trabalho

1. **Fork** o projeto
2. Crie uma **branch** para sua feature: `git checkout -b feature/NomeDaFeature`
3. Faça suas **modificações**
4. **Teste** suas mudanças
5. Faça **commit** das alterações: `git commit -m 'feat: adiciona nova funcionalidade'`
6. **Push** para sua branch: `git push origin feature/NomeDaFeature`
7. Abra um **Pull Request**

## 📝 Padrões de Commit

Usamos [Conventional Commits](https://conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige bug específico
docs: atualiza documentação
style: mudanças de formatação (espaços, etc.)
refactor: refatora código sem mudar funcionalidade
test: adiciona ou corrige testes
chore: mudanças em ferramentas/configurações
```

## 🐛 Relatando Bugs

Para reportar bugs, use o template de issue:

1. Vá para [Issues](https://github.com/SEU_USERNAME/pdf-commander/issues)
2. Clique em "New Issue"
3. Escolha "Bug Report"
4. Preencha todos os campos solicitados

### Informações Essenciais para Bug Reports:
- Versão do PDF Commander
- Sistema operacional e versão
- Passos para reproduzir o bug
- Comportamento esperado vs. atual
- Logs de erro (se aplicável)

## 💡 Sugerindo Funcionalidades

Para sugerir novas funcionalidades:

1. Verifique se já não existe uma [issue similar](https://github.com/SEU_USERNAME/pdf-commander/issues)
2. Abra uma nova issue com o template "Feature Request"
3. Descreva claramente:
   - O problema que resolve
   - Como funcionaria
   - Benefícios para os usuários

## 🛠️ Diretrizes de Código

### JavaScript/Node.js
- Use **ES6+** features
- **async/await** preferido sobre Promises
- Nomes de variáveis em **camelCase**
- Nomes de classes em **PascalCase**
- Use **const** e **let** em vez de **var**

### React
- Componentes funcionais com **hooks**
- Nomes de componentes em **PascalCase**
- Props destruturing
- Use **TailwindCSS** para estilização

### Estrutura de Arquivos
```
src/
├── components/     # Componentes React
├── contexts/       # Contextos React
├── utils/          # Funções utilitárias
└── hooks/          # Custom hooks
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes com coverage
npm run test:coverage
```

### Diretrizes de Teste:
- Teste funcionalidades críticas
- Use nomes descritivos para testes
- Mantenha cobertura de código > 80%

## 📚 Documentação

### Atualizando README
- Mantenha seções organizadas
- Use badges apropriados
- Inclua exemplos de uso
- Mantenha instruções atualizadas

### Código Comentado
- Funções complexas devem ter JSDoc
- Variáveis não-obvias devem ter comentários
- TODOs devem ser marcados

## 🎨 Design e UI

### Princípios
- **Simplicidade**: Interface intuitiva
- **Consistência**: Padrões visuais uniformes
- **Acessibilidade**: Suporte a leitores de tela
- **Responsividade**: Funciona em diferentes tamanhos

### Cores (TailwindCSS)
- Primary: `blue-500`
- Success: `green-500`
- Warning: `yellow-500`
- Error: `red-500`
- Background: `gray-50/gray-900`

## 🚀 Releases

### Versionamento Semântico
- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs

### Checklist de Release
- [ ] Atualizar `package.json` version
- [ ] Atualizar CHANGELOG.md
- [ ] Criar tag no Git
- [ ] Criar release no GitHub
- [ ] Anexar instalador
- [ ] Testar instalação

## 📞 Suporte

Para dúvidas ou discussões:
- [Discussions](https://github.com/SEU_USERNAME/pdf-commander/discussions)
- [Discord/Slack] (se aplicável)

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a **MIT License**.

---

**Obrigado por contribuir com o PDF Commander!** 🎉