# 📦 Sistema de Atualização Automática via GitHub Releases

## 📋 Visão Geral

Este documento descreve a implementação completa de um sistema de atualização automática para aplicações Electron utilizando GitHub Releases. O sistema permite que os usuários sejam notificados sobre novas versões e instalem atualizações diretamente pela aplicação, sem precisar baixar manualmente do GitHub.

## 🎯 Arquitetura do Sistema

### Componentes Principais

1. **UpdateService** (`update-service.js`) - Backend Node.js
2. **UpdateNotification** (React Component) - Frontend UI
3. **IPC Handlers** (main.js) - Comunicação Electron
4. **GitHub API** - Fonte das atualizações
5. **Release Script** (`create-release-api.js`) - Automação de releases

## 🔧 Implementação Passo a Passo

### 1. Estrutura de Arquivos

```
seu-projeto/
├── main.js                          # Processo principal Electron
├── update-service.js                # Serviço de atualização
├── create-release-api.js            # Script de criação de releases
├── package.json                     # Versão do app
├── config-ui/
│   └── src/
│       ├── config.js               # Configuração do app
│       └── components/
│           ├── UpdateNotification.js  # Modal de update
│           └── HeaderMenu.js          # Botão de verificar updates
```

### 2. Backend - Update Service (update-service.js)

#### 2.1. Configuração Inicial

```javascript
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');

class UpdateService {
    constructor() {
        this.config = {
            repoOwner: 'seu-usuario',        // Seu usuário GitHub
            repoName: 'seu-repositorio',     // Nome do repositório
            currentVersion: this.getCurrentVersion(),
            checkInterval: 5 * 60 * 60 * 1000, // 5 horas em milissegundos
            githubApiUrl: 'https://api.github.com'
        };

        this.updateData = null;
        this.isChecking = false;
        this.updateFile = this.getUpdateFilePath();
    }

    getCurrentVersion() {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
        );
        return packageJson.version;
    }

    getUpdateFilePath() {
        try {
            if (app && app.getPath) {
                const userDataPath = app.getPath('userData');
                return path.join(userDataPath, 'update-check.json');
            }
        } catch (error) {
            console.error('Erro ao obter userData path:', error);
        }
        return path.join(__dirname, 'update-check.json');
    }
}
```

#### 2.2. Verificação de Atualizações

```javascript
async checkForUpdates(force = false) {
    if (this.isChecking) {
        console.log('Verificação já em andamento...');
        return null;
    }

    this.isChecking = true;

    try {
        // Verificar cache (só se não for forçado)
        if (!force && !this.shouldCheckForUpdates()) {
            console.log('Última verificação recente, pulando...');
            this.isChecking = false;
            return null;
        }

        // Buscar releases do GitHub
        const releases = await this.fetchReleases();
        
        if (!releases || releases.length === 0) {
            this.saveLastCheck();
            this.isChecking = false;
            return null;
        }

        // Encontrar versão mais recente
        const latestRelease = this.findLatestRelease(releases);

        if (!latestRelease) {
            this.saveLastCheck();
            this.isChecking = false;
            return null;
        }

        // Comparar versões
        const hasUpdate = this.compareVersions(
            latestRelease.tag_name, 
            this.config.currentVersion
        );

        if (hasUpdate) {
            console.log('Nova versão encontrada:', latestRelease.tag_name);
            this.updateData = {
                version: latestRelease.tag_name,
                releaseNotes: latestRelease.body,
                releaseUrl: latestRelease.html_url,
                publishedAt: latestRelease.published_at,
                assets: latestRelease.assets
            };

            this.saveLastCheck();
            this.isChecking = false;
            return this.updateData;
        }

        console.log('Aplicação já está atualizada');
        this.saveLastCheck();
        this.isChecking = false;
        return null;

    } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
        this.isChecking = false;
        throw error;
    }
}
```

#### 2.3. Buscar Releases do GitHub

```javascript
async fetchReleases() {
    try {
        const url = `${this.config.githubApiUrl}/repos/${this.config.repoOwner}/${this.config.repoName}/releases`;
        
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Electron-App-Updater'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Erro ao buscar releases:', error.message);
        return null;
    }
}
```

#### 2.4. Comparação de Versões

```javascript
compareVersions(remoteVersion, localVersion) {
    // Remove 'v' se existir
    const remote = remoteVersion.replace(/^v/, '');
    const local = localVersion.replace(/^v/, '');

    const remoteParts = remote.split('.').map(Number);
    const localParts = local.split('.').map(Number);

    for (let i = 0; i < Math.max(remoteParts.length, localParts.length); i++) {
        const remotePart = remoteParts[i] || 0;
        const localPart = localParts[i] || 0;

        if (remotePart > localPart) return true;
        if (remotePart < localPart) return false;
    }

    return false; // Versões são iguais
}
```

#### 2.5. Sistema de Cache

```javascript
shouldCheckForUpdates() {
    try {
        if (!fs.existsSync(this.updateFile)) {
            return true;
        }

        const data = fs.readJsonSync(this.updateFile);
        const lastCheck = new Date(data.lastCheck);
        const now = new Date();

        const timeDiff = now.getTime() - lastCheck.getTime();
        return timeDiff > this.config.checkInterval;
    } catch (error) {
        console.error('Erro ao verificar última verificação:', error);
        return true;
    }
}

saveLastCheck() {
    try {
        const data = {
            lastCheck: new Date().toISOString(),
            currentVersion: this.config.currentVersion,
            updateAvailable: !!this.updateData
        };

        fs.ensureDirSync(path.dirname(this.updateFile));
        fs.writeJsonSync(this.updateFile, data, { spaces: 2 });
    } catch (error) {
        console.error('Erro ao salvar última verificação:', error);
    }
}
```

### 3. Integração com Electron (main.js)

#### 3.1. Inicialização do Serviço

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const UpdateService = require('./update-service');

let mainWindow;
let updateService;

function createWindow() {
    // Inicializar serviço de atualizações
    updateService = new UpdateService();

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);
```

#### 3.2. IPC Handlers

```javascript
// Handler para verificar atualizações
ipcMain.handle('check-for-updates', async (event, force = false) => {
    try {
        const updateData = await updateService.checkForUpdates(force);
        return { success: true, updateData };
    } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
        return { success: false, error: error.message };
    }
});

// Handler para obter dados de atualização
ipcMain.handle('get-update-data', async () => {
    try {
        const data = updateService.getUpdateData();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Handler para download de atualização
ipcMain.handle('download-update', async (event, updateData) => {
    try {
        const result = await updateService.downloadUpdate(updateData);
        return { success: true, filePath: result.filePath };
    } catch (error) {
        console.error('Erro ao baixar atualização:', error);
        return { success: false, error: error.message };
    }
});

// Handler para instalar atualização
ipcMain.handle('install-update', async (event, filePath) => {
    try {
        await updateService.installUpdate(filePath);
        return { success: true };
    } catch (error) {
        console.error('Erro ao instalar atualização:', error);
        return { success: false, error: error.message };
    }
});
```

### 4. Frontend - React Components

#### 4.1. Arquivo de Configuração (config.js)

```javascript
export const APP_CONFIG = {
    version: '2.1.0',
    name: 'PDF Commander',
    description: 'Processador completo de PDFs'
};
```

#### 4.2. Component UpdateNotification.js

```javascript
import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../config';

const UpdateNotification = ({ isDarkMode, show, onClose }) => {
    const [updateData, setUpdateData] = useState(null);
    const [error, setError] = useState(null);

    // Verificar se está rodando no Electron
    const isElectron = () => {
        return typeof window !== 'undefined' && window.require;
    };

    const getIpcRenderer = () => {
        if (!isElectron()) return null;
        try {
            return window.require('electron').ipcRenderer;
        } catch (error) {
            return null;
        }
    };

    useEffect(() => {
        if (!isElectron()) {
            console.log('Não está no contexto Electron');
            return;
        }

        checkForUpdates();

        // Escutar evento de verificação forçada
        const handleForceCheck = () => {
            console.log('Forçando verificação de updates...');
            checkForUpdates(true);
        };

        window.addEventListener('force-update-check', handleForceCheck);

        return () => {
            window.removeEventListener('force-update-check', handleForceCheck);
        };
    }, []);

    const checkForUpdates = async (force = false) => {
        if (!isElectron()) return;

        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) return;

        try {
            const result = await ipcRenderer.invoke('check-for-updates', force);

            if (result.success && result.updateData) {
                setUpdateData(result.updateData);
                setError(null);
            }
        } catch (err) {
            console.error('Erro ao verificar atualizações:', err);
            setError('Erro ao verificar atualizações');
        }
    };

    const handleDismiss = () => {
        onClose();
    };

    if (!show || !updateData) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="w-6 h-6 text-blue-500" />
                        <div>
                            <h3 className="font-semibold text-lg">Atualização Disponível</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Uma nova versão está pronta para instalação
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Informações da Versão */}
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-gray-700/50 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Versão Atual:</span>
                        <span className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-600">
                            {APP_CONFIG.version}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Nova Versão:</span>
                        <span className="text-sm px-2 py-1 rounded bg-blue-500 text-white font-medium">
                            {updateData.version}
                        </span>
                    </div>
                </div>

                {/* Release Notes */}
                {updateData.releaseNotes && (
                    <div className="text-sm mb-4 p-3 rounded-lg border max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700/30">
                        <h4 className="font-medium mb-2">Novidades desta versão:</h4>
                        <div dangerouslySetInnerHTML={{
                            __html: updateData.releaseNotes.replace(/\n/g, '<br>')
                        }} />
                    </div>
                )}

                {/* Mensagem de erro */}
                {error && (
                    <div className="p-3 rounded-lg mb-4 border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-300" />
                            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-xs mt-4 pt-3 border-t text-center text-gray-500 dark:text-gray-400">
                    A atualização será instalada automaticamente em breve.
                </div>
            </div>
        </div>
    );
};

export default UpdateNotification;
```

#### 4.3. Component HeaderMenu.js (Botão de Verificar)

```javascript
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

const HeaderMenu = ({ isDarkMode, onCheckUpdates }) => {
    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

    const handleCheckUpdates = async () => {
        setIsCheckingUpdates(true);
        try {
            await onCheckUpdates(true); // Force = true
        } finally {
            setIsCheckingUpdates(false);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <button
                onClick={handleCheckUpdates}
                disabled={isCheckingUpdates}
                className="p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                title="Verificar atualizações"
            >
                <RefreshCw className={`w-5 h-5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );
};

export default HeaderMenu;
```

### 5. Script de Release (create-release-api.js)

#### 5.1. Estrutura do Script

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

class GitHubReleaseManager {
    constructor() {
        this.token = process.env.GITHUB_TOKEN;
        this.repo = 'seu-usuario/seu-repositorio';
        this.apiBase = 'https://api.github.com';

        if (!this.token) {
            throw new Error('GITHUB_TOKEN não definido');
        }
    }

    getCurrentVersion() {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.version;
    }

    async createRelease(tagName, version) {
        const url = `${this.apiBase}/repos/${this.repo}/releases`;

        const releaseData = {
            tag_name: tagName,
            name: `PDF Commander ${tagName}`,
            body: this.generateReleaseNotes(version),
            draft: false,
            prerelease: false
        };

        try {
            const response = await axios.post(url, releaseData, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            throw new Error(`Erro ao criar release: ${error.response?.data?.message || error.message}`);
        }
    }

    generateReleaseNotes(version) {
        return `🎉 **PDF Commander ${version}**

⚡ Uma ferramenta desktop profissional para manipulação avançada de PDFs!

## ✨ Funcionalidades
- 🔄 União automática de múltiplos PDFs
- 📏 Normalização para tamanhos padrão
- 📑 Layout em grade (4 PDFs por página A4)
- 🏷️ Sistema completo de geração de etiquetas
- 📊 Dashboard de monitoramento
- 🔄 Atualização automática via GitHub

## 📥 Instalação
1. Baixe o arquivo \`PDF Commander Setup ${version}.exe\`
2. Execute o instalador
3. Siga as instruções na tela`;
    }

    async uploadAsset(uploadUrl, assetPath, assetName) {
        const fileBuffer = fs.readFileSync(assetPath);
        const uploadEndpoint = uploadUrl.replace('{?name,label}', `?name=${assetName}`);

        try {
            await axios.post(uploadEndpoint, fileBuffer, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': fileBuffer.length
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            console.log(`✅ ${assetName} enviado com sucesso!`);
        } catch (error) {
            throw new Error(`Erro ao fazer upload de ${assetName}: ${error.message}`);
        }
    }

    async buildProject() {
        console.log('🏗️  Fazendo build do projeto...');
        
        // Build da interface React
        execSync('cd config-ui && npm run build', { stdio: 'inherit' });
        
        // Build do executável
        execSync('npm run build:exe', { stdio: 'inherit' });
    }

    async runRelease(tagOverride = null) {
        try {
            const currentTag = tagOverride || this.getCurrentTag();
            const currentVersion = this.getCurrentVersion();

            console.log(`📋 Tag: ${currentTag}`);
            console.log(`📋 Versão: ${currentVersion}\n`);

            // Build do projeto
            await this.buildProject();

            // Criar release
            console.log('🎯 Criando release...');
            const release = await this.createRelease(currentTag, currentVersion);

            // Upload dos assets
            const assets = [
                {
                    path: `dist-release/PDF Commander Setup ${currentVersion}.exe`,
                    name: `PDF Commander Setup ${currentTag}.exe`
                },
                {
                    path: `dist-release/PDF Commander Setup ${currentVersion}.exe.blockmap`,
                    name: `PDF Commander Setup ${currentTag}.exe.blockmap`
                },
                {
                    path: 'dist-release/latest.yml',
                    name: 'latest.yml'
                }
            ];

            for (const asset of assets) {
                await this.uploadAsset(release.upload_url, asset.path, asset.name);
            }

            console.log('\n🎉 Release completada com sucesso!');
            console.log(`🔗 URL: ${release.html_url}`);

        } catch (error) {
            console.error('❌ Erro durante o release:', error.message);
            process.exit(1);
        }
    }
}

// Execução
if (require.main === module) {
    const tagArg = process.argv[2];
    const releaseManager = new GitHubReleaseManager();
    releaseManager.runRelease(tagArg);
}

module.exports = GitHubReleaseManager;
```

### 6. Configuração do package.json

```json
{
  "name": "seu-app",
  "version": "2.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build:exe": "electron-builder",
    "dev": "electron . --dev"
  },
  "build": {
    "appId": "com.seuapp.desktop",
    "productName": "Seu App",
    "files": [
      "**/*",
      "!node_modules/**/*",
      "config-ui/build/**/*"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "publish": {
      "provider": "github",
      "owner": "seu-usuario",
      "repo": "seu-repositorio"
    }
  },
  "dependencies": {
    "axios": "^1.12.1",
    "electron": "^33.0.0",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "electron-builder": "^25.0.0"
  }
}
```

## 🚀 Como Usar

### 1. Configuração Inicial

```bash
# 1. Clone seu repositório
git clone https://github.com/seu-usuario/seu-app.git
cd seu-app

# 2. Instale as dependências
npm install
cd config-ui && npm install && cd ..

# 3. Configure as variáveis de ambiente
export GITHUB_TOKEN=seu_token_github
```

### 2. Desenvolvimento

```bash
# Rodar em modo desenvolvimento
npm run dev
```

### 3. Criar Nova Release

```bash
# 1. Atualizar versão no package.json e config.js
# Exemplo: 2.1.0 -> 2.1.1

# 2. Commit e push das mudanças
git add .
git commit -m "feat: Nova versão 2.1.1"
git push origin main

# 3. Criar tag
git tag v2.1.1
git push origin v2.1.1

# 4. Criar release
GITHUB_TOKEN=seu_token node create-release-api.js v2.1.1
```

### 4. Usuários Verificam Updates

Os usuários podem verificar atualizações de duas formas:

1. **Automático**: Ao iniciar o app (respeitando cache de 5 horas)
2. **Manual**: Clicando no botão "Verificar Atualizações"

## 🔐 Segurança

### GitHub Token

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Permissões necessárias:
   - `repo` (acesso completo aos repositórios)
   - `write:packages` (publicar pacotes)
4. Copie o token gerado
5. Configure como variável de ambiente:
   ```bash
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

### Arquivo .gitignore

```gitignore
# Tokens e arquivos sensíveis
token
.env
update-check.json

# Build
dist-release/
node_modules/
```

## 📊 Fluxo Completo

```
┌─────────────────┐
│  Desenvolvedor  │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│ 1. Atualiza versão      │
│    (package.json)       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ 2. Commit + Tag         │
│    git tag v2.1.1       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ 3. Executa script       │
│    create-release-api   │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ 4. Build automático     │
│    - React build        │
│    - Electron builder   │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│ 5. GitHub Release       │
│    - Cria release       │
│    - Upload assets      │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  GitHub API disponível  │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  Usuário Final          │
│                         │
│  App verifica updates   │
│  ↓                      │
│  Mostra modal           │
│  ↓                      │
│  Download automático    │
│  ↓                      │
│  Instalação             │
└─────────────────────────┘
```

## 🎨 Personalização

### Alterar Intervalo de Verificação

```javascript
// update-service.js
this.config = {
    // ...
    checkInterval: 24 * 60 * 60 * 1000, // 24 horas
};
```

### Customizar Modal de Update

Edite o componente `UpdateNotification.js` para ajustar:
- Cores
- Textos
- Layout
- Animações

### Adicionar Download Progress

```javascript
// update-service.js
async downloadUpdate(updateData) {
    const asset = updateData.assets.find(a => a.name.endsWith('.exe'));
    
    const response = await axios.get(asset.browser_download_url, {
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
            );
            // Emitir evento de progresso
            mainWindow.webContents.send('update-download-progress', percentCompleted);
        }
    });

    // Salvar arquivo...
}
```

## 🐛 Troubleshooting

### Erro: "GITHUB_TOKEN não definido"

**Solução**: Configure a variável de ambiente antes de executar o script:
```bash
export GITHUB_TOKEN=seu_token
```

### Erro: "Validation Failed"

**Causa**: Tag já existe no GitHub

**Solução**: Use uma tag diferente:
```bash
git tag v2.1.2
git push origin v2.1.2
node create-release-api.js v2.1.2
```

### Update não aparece para usuários

**Possíveis causas**:
1. Cache ainda ativo (espere 5 horas ou force verificação)
2. Versão no `package.json` não foi atualizada
3. Release não foi criada corretamente no GitHub

**Solução**: 
- Verificar se a release existe: https://github.com/seu-usuario/seu-repo/releases
- Forçar verificação clicando no botão de update
- Deletar arquivo `update-check.json` na pasta userData

### Arquivo update-check.json

Localização:
- **Windows**: `C:\Users\Usuario\AppData\Roaming\seu-app\update-check.json`
- **macOS**: `~/Library/Application Support/seu-app/update-check.json`
- **Linux**: `~/.config/seu-app/update-check.json`

## 📚 Referências

- [GitHub API - Releases](https://docs.github.com/en/rest/releases/releases)
- [Electron Builder](https://www.electron.build/)
- [Electron IPC](https://www.electronjs.org/docs/latest/api/ipc-main)
- [Axios Documentation](https://axios-http.com/docs/intro)

## 🎯 Próximos Passos

1. **Auto-Update Nativo**: Implementar `electron-updater` para instalação silenciosa
2. **Delta Updates**: Baixar apenas as diferenças entre versões
3. **Rollback**: Sistema para reverter atualizações problemáticas
4. **Telemetria**: Monitorar taxa de adoção de atualizações
5. **Beta Channel**: Canal separado para versões beta

## 📝 Licença

Este sistema é open-source e pode ser usado em qualquer projeto.

---

**Desenvolvido com ❤️ para a comunidade**

Se este guia foi útil, considere dar uma ⭐ no repositório!
