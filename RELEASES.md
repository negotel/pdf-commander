# 🚀 Sistema de Releases Automáticos

O PDF Commander possui um sistema automatizado de criação de releases usando GitHub Actions.

## 📋 Como Criar um Novo Release

### Método 1: Via Git (Recomendado)

```bash
# 1. Atualizar versão no package.json
# Edite a versão de "1.0.0" para "1.0.1" por exemplo

# 2. Fazer commit das mudanças
git add package.json
git commit -m "feat: adicionar nova funcionalidade incrível"

# 3. Criar tag anotada
git tag -a v1.0.1 -m "Release v1.0.1 - Nova funcionalidade incrível"

# 4. Enviar tag para GitHub
git push origin main
git push origin v1.0.1
```

### Método 2: Via Interface do GitHub

1. Vá para [Releases](https://github.com/negotel/pdf-commander/releases)
2. Clique em "Create a new release"
3. Digite a tag (ex: `v1.0.1`)
4. Preencha título e descrição
5. Clique em "Publish release"

## ⚙️ O que o Workflow Faz Automaticamente

Quando você cria uma tag `v*.*.*`, o GitHub Actions executa:

1. **📥 Checkout** - Baixa o código
2. **🟢 Node.js** - Configura Node.js 18
3. **📦 Dependências** - Instala dependências do projeto
4. **🏗️ Build React** - Compila a interface React
5. **📦 Build Executável** - Gera o instalador Windows
6. **🎯 Criar Release** - Publica release automaticamente
7. **📎 Anexar Arquivos**:
   - `PDF Commander Setup X.X.X.exe` - Instalador
   - `PDF Commander Setup X.X.X.exe.blockmap` - Para atualizações
   - `latest.yml` - Metadados para auto-updater

## 📊 Status do Workflow

Para ver o status dos workflows:
1. Vá para aba **"Actions"** no GitHub
2. Clique no workflow **"🚀 Release PDF Commander"**
3. Veja os logs detalhados de cada step

## 🏷️ Convenção de Versionamento

Usamos [Versionamento Semântico](https://semver.org/):

- **MAJOR** (`v2.0.0`): Mudanças incompatíveis
- **MINOR** (`v1.1.0`): Novas funcionalidades compatíveis
- **PATCH** (`v1.0.1`): Correções de bugs

### Exemplos de Tags:
- `v1.0.0` - Primeiro release
- `v1.0.1` - Correção de bug
- `v1.1.0` - Nova funcionalidade
- `v2.0.0` - Mudança significativa

## 📝 Conteúdo do Release

O workflow gera automaticamente:

### Título
`PDF Commander vX.X.X`

### Descrição
Inclui funcionalidades principais, instruções de instalação e menção ao desenvolvimento com IA.

### Assets Anexados
- **Instalador**: `PDF Commander Setup X.X.X.exe`
- **Blockmap**: Para atualizações incrementais
- **Latest.yml**: Metadados para o sistema de auto-update

## 🔧 Personalização

Para modificar o workflow, edite `.github/workflows/release.yml`:

```yaml
# Alterar versão do Node.js
node-version: '20'

# Adicionar mais arquivos
- name: 📎 Anexar documentação
  uses: actions/upload-release-asset@v1
  with:
    asset_path: ./docs/manual.pdf
    asset_name: Manual_do_Usuario.pdf
```

## 🚨 Solução de Problemas

### Workflow não executa:
- Verifique se a tag segue o padrão `v*.*.*`
- Certifique-se de que fez push da tag: `git push origin v1.0.1`

### Build falha:
- Verifique os logs na aba "Actions"
- Teste localmente: `npm run build:exe`

### Release não é criado:
- Verifique permissões do repositório
- Certifique-se de que não há releases duplicados

## 📞 Suporte

Para dúvidas sobre releases:
- Verifique os [logs do workflow](https://github.com/negotel/pdf-commander/actions)
- Abra uma [issue](https://github.com/negotel/pdf-commander/issues) se necessário