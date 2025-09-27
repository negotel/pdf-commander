# Sistema de Atualizações Automáticas

## Como Funciona

O sistema verifica automaticamente por novas versões no GitHub Releases e permite atualização com um clique.

## Configuração

### 1. Configurar Repositório GitHub

No arquivo `update-service.js`, atualize:

```javascript
this.config = {
    repoOwner: 'SEU_USUARIO_GITHUB', // Seu usuário do GitHub
    repoName: 'NOME_DO_REPOSITORIO', // Nome do repositório
    // ... outros configs
};
```

### 2. Criar Releases no GitHub

1. Vá para seu repositório no GitHub
2. Clique em "Releases" > "Create a new release"
3. Crie uma tag de versão (ex: `v1.1.0`)
4. Adicione título e descrição das mudanças
5. **Importante**: Anexe o arquivo `.exe` do instalador

### 3. Formato das Versões

Use [Semantic Versioning](https://semver.org/):
- `1.0.0` - Versão principal.menor.patch
- `v1.0.0` - Funciona com ou sem 'v'

## Funcionalidades

### ✅ Verificação Automática
- Verifica a cada 24 horas
- Mostra notificação quando há atualização
- Não incomoda o usuário desnecessariamente

### ✅ Download e Instalação
- Download com barra de progresso
- Instalação automática
- Reinício automático da aplicação

### ✅ Interface Intuitiva
- Notificação discreta no canto superior direito
- Botões "Atualizar Agora" e "Lembrar Depois"
- Feedback visual durante o processo

## Como Usar

### Para o Desenvolvedor

1. **Criar novo release** no GitHub com arquivo `.exe`
2. **Aguardar** até 24 horas ou forçar verificação
3. **Testar** a notificação no aplicativo

### Para o Usuário Final

1. **Abrir o aplicativo**
2. **Ver notificação** quando houver atualização
3. **Clicar "Atualizar Agora"** ou "Lembrar Depois"

## Arquivos de Configuração

### `update-service.js`
- Configurações do GitHub
- Lógica de verificação e download
- Comparação de versões

### `UpdateNotification.js`
- Componente React da notificação
- Interface de usuário
- Controle de estado

### `main.js`
- Handlers IPC para comunicação
- Inicialização do serviço

## Estrutura dos Dados

### Arquivo `update-check.json` (dados locais)
```json
{
  "lastCheck": "2025-09-27T00:35:48.690Z",
  "currentVersion": "1.0.0",
  "updateAvailable": false
}
```

### Dados do Release (GitHub API)
```json
{
  "tag_name": "v1.1.0",
  "name": "Versão 1.1.0",
  "body": "Novas funcionalidades...",
  "published_at": "2025-09-27T00:00:00Z",
  "assets": [
    {
      "name": "Unir-PDFs-Setup-1.1.0.exe",
      "browser_download_url": "https://github.com/...",
      "size": 12345678
    }
  ]
}
```

## Troubleshooting

### Erro 404 no GitHub
- Verifique se o repositório existe e é público
- Confirme o `repoOwner` e `repoName`

### Download falha
- Verifique se o release tem arquivo `.exe`
- Confirme permissões de escrita na pasta temp

### Notificação não aparece
- Verifique console do DevTools (F12)
- Arquivo `update-check.json` pode estar corrompido

## Próximas Melhorias

- [ ] Suporte para outros sistemas operacionais
- [ ] Verificação de integridade dos downloads
- [ ] Rollback automático em caso de falha
- [ ] Notificações push (WhatsApp/Email)
- [ ] Controle de versão beta/alpha