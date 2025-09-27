const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');

/**
 * Serviço de verificação e instalação de atualizações
 */
class UpdateService {
    constructor() {
        this.config = {
            repoOwner: 'negotel', // Substitua pelo seu usuário do GitHub
            repoName: 'unir-pdfs', // Substitua pelo nome do repositório
            currentVersion: this.getCurrentVersion(),
            checkInterval: 24 * 60 * 60 * 1000, // 24 horas
            githubApiUrl: 'https://api.github.com'
        };

        this.updateData = null;
        this.isChecking = false;

        // Arquivo para armazenar dados da última verificação
        this.updateFile = this.getUpdateFilePath();

        console.log('🔄 UpdateService inicializado - Versão atual:', this.config.currentVersion);
    }

    /**
     * Obtém o caminho para o arquivo de atualização
     */
    getUpdateFilePath() {
        try {
            if (app && app.getPath) {
                const userDataPath = app.getPath('userData');
                return path.join(userDataPath, 'update-check.json');
            }
        } catch (error) {
            // Fallback para diretório atual
        }

        // Fallback para diretório atual
        return path.join(__dirname, 'update-check.json');
    }

    /**
     * Obtém o caminho temporário
     */
    getTempPath() {
        try {
            if (app && app.getPath) {
                return app.getPath('temp');
            }
        } catch (error) {
            // Fallback
        }

        return require('os').tmpdir();
    }

    /**
     * Obtém a versão atual da aplicação
     */
    getCurrentVersion() {
        try {
            // Tentar obter do Electron
            if (app && app.getVersion) {
                return app.getVersion();
            }
        } catch (error) {
            // Fallback para package.json
        }

        try {
            const packageJson = require('./package.json');
            return packageJson.version;
        } catch (error) {
            console.warn('Não foi possível obter versão da aplicação');
            return '1.0.0';
        }
    }

    /**
     * Verifica se há atualizações disponíveis
     */
    async checkForUpdates() {
        if (this.isChecking) {
            console.log('🔄 Verificação de atualização já em andamento...');
            return null;
        }

        this.isChecking = true;

        try {
            console.log('🔄 Verificando atualizações...');

            // Verificar se devemos fazer uma nova verificação
            if (!this.shouldCheckForUpdates()) {
                console.log('🔄 Última verificação recente, pulando...');
                this.isChecking = false;
                return null;
            }

            // Buscar releases do GitHub
            const releases = await this.fetchReleases();

            if (!releases || releases.length === 0) {
                console.log('🔄 Nenhum release encontrado');
                this.saveLastCheck();
                this.isChecking = false;
                return null;
            }

            // Encontrar a versão mais recente
            const latestRelease = this.findLatestRelease(releases);

            if (!latestRelease) {
                console.log('🔄 Nenhum release válido encontrado');
                this.saveLastCheck();
                this.isChecking = false;
                return null;
            }

            // Comparar versões
            const hasUpdate = this.compareVersions(latestRelease.tag_name, this.config.currentVersion);

            if (hasUpdate) {
                console.log('🎉 Nova versão encontrada:', latestRelease.tag_name);
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
            } else {
                console.log('✅ Aplicação está atualizada');
                this.saveLastCheck();
                this.isChecking = false;
                return null;
            }

        } catch (error) {
            console.error('❌ Erro ao verificar atualizações:', error);
            this.isChecking = false;
            return null;
        }
    }

    /**
     * Busca releases do GitHub
     */
    async fetchReleases() {
        try {
            const url = `${this.config.githubApiUrl}/repos/${this.config.repoOwner}/${this.config.repoName}/releases`;
            console.log('🔄 Fazendo requisição para:', url);

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Unir-PDFs-App',
                    'Accept': 'application/vnd.github.v3+json'
                },
                timeout: 10000
            });

            return response.data;
        } catch (error) {
            console.error('❌ Erro ao buscar releases:', error.message);
            return null;
        }
    }

    /**
     * Encontra o release mais recente (excluindo pre-releases se não estiver em beta)
     */
    findLatestRelease(releases) {
        // Filtrar apenas releases publicados (não drafts)
        const publishedReleases = releases.filter(release => !release.draft);

        if (publishedReleases.length === 0) {
            return null;
        }

        // Retornar o primeiro (mais recente)
        return publishedReleases[0];
    }

    /**
     * Compara duas versões semânticas
     */
    compareVersions(latestVersion, currentVersion) {
        try {
            // Remover 'v' do início se existir
            const cleanLatest = latestVersion.replace(/^v/, '');
            const cleanCurrent = currentVersion.replace(/^v/, '');

            // Dividir em partes
            const latestParts = cleanLatest.split('.').map(Number);
            const currentParts = cleanCurrent.split('.').map(Number);

            // Comparar cada parte
            for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
                const latestPart = latestParts[i] || 0;
                const currentPart = currentParts[i] || 0;

                if (latestPart > currentPart) {
                    return true;
                } else if (latestPart < currentPart) {
                    return false;
                }
            }

            return false; // Versões iguais
        } catch (error) {
            console.error('❌ Erro ao comparar versões:', error);
            return false;
        }
    }

    /**
     * Verifica se deve fazer uma nova verificação
     */
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
            console.error('❌ Erro ao verificar última verificação:', error);
            return true;
        }
    }

    /**
     * Salva dados da última verificação
     */
    saveLastCheck() {
        try {
            const data = {
                lastCheck: new Date().toISOString(),
                currentVersion: this.config.currentVersion,
                updateAvailable: !!this.updateData
            };

            fs.writeJsonSync(this.updateFile, data, { spaces: 2 });
            console.log('💾 Dados de verificação salvos');
        } catch (error) {
            console.error('❌ Erro ao salvar dados de verificação:', error);
        }
    }

    /**
     * Obtém dados da atualização disponível
     */
    getUpdateData() {
        return this.updateData;
    }

    /**
     * Faz download da atualização
     */
    async downloadUpdate(updateData, progressCallback) {
        try {
            console.log('📥 Iniciando download da atualização...');

            // Encontrar asset do Windows (exe)
            const windowsAsset = updateData.assets.find(asset =>
                asset.name.endsWith('.exe') && !asset.name.includes('blockmap')
            );

            if (!windowsAsset) {
                throw new Error('Arquivo de instalação para Windows não encontrado');
            }

            console.log('📥 Baixando:', windowsAsset.browser_download_url);

            const response = await axios.get(windowsAsset.browser_download_url, {
                responseType: 'stream',
                timeout: 300000, // 5 minutos
                onDownloadProgress: (progress) => {
                    if (progressCallback) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        progressCallback(percent);
                    }
                }
            });

            // Salvar arquivo temporário
            const tempDir = this.getTempPath();
            const fileName = `Unir-PDFs-${updateData.version}.exe`;
            const filePath = path.join(tempDir, fileName);

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log('📥 Download concluído:', filePath);
                    resolve(filePath);
                });
                writer.on('error', reject);
            });

        } catch (error) {
            console.error('❌ Erro no download:', error);
            throw error;
        }
    }

    /**
     * Instala a atualização
     */
    async installUpdate(filePath) {
        try {
            console.log('🔧 Instalando atualização...');

            const { spawn } = require('child_process');

            // Executar instalador
            const installer = spawn(filePath, ['/S'], {
                detached: true,
                stdio: 'ignore'
            });

            installer.on('error', (error) => {
                console.error('❌ Erro ao executar instalador:', error);
            });

            // Fechar aplicação atual
            setTimeout(() => {
                app.quit();
            }, 1000);

        } catch (error) {
            console.error('❌ Erro na instalação:', error);
            throw error;
        }
    }

    /**
     * Configura verificação automática
     */
    startAutoCheck() {
        // Verificar imediatamente
        setTimeout(() => {
            this.checkForUpdates();
        }, 5000); // 5 segundos após inicialização

        // Verificar periodicamente
        setInterval(() => {
            this.checkForUpdates();
        }, this.config.checkInterval);
    }
}

module.exports = UpdateService;