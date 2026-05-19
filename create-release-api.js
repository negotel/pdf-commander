const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

class GitHubReleaseManager {
    constructor() {
        this.token = process.env.GITHUB_TOKEN;
        this.repo = 'negotel/pdf-commander';
        this.apiBase = 'https://api.github.com';

        if (!this.token) {
            throw new Error('GITHUB_TOKEN não definido. Configure a variável de ambiente.');
        }
    }

    /**
     * Obtém a versão atual do package.json
     */
    getCurrentVersion() {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.version;
    }

    /**
     * Obtém a tag atual do git
     */
    getCurrentTag() {
        try {
            return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
        } catch (error) {
            throw new Error('Não foi possível obter a tag atual');
        }
    }

    /**
     * Faz build do projeto
     */
    async buildProject() {
        console.log('🏗️  Fazendo build do projeto...');

        try {
            // Build da interface React
            console.log('📦 Build da interface React...');
            execSync('cd config-ui && npm install && npm run build', { stdio: 'inherit' });

            // Build do executável
            console.log('📦 Build do executável...');
            execSync('npm run build:exe', { stdio: 'inherit' });

            console.log('✅ Build concluído!');
        } catch (error) {
            throw new Error(`Erro no build: ${error.message}`);
        }
    }

    /**
     * Cria release no GitHub
     */
    async createRelease(tag, version) {
        console.log(`🎯 Criando release ${tag}...`);

        const releaseData = {
            tag_name: tag,
            name: `PDF Commander ${tag}`,
            body: this.getReleaseNotes(version),
            draft: false,
            prerelease: false
        };

        try {
            const response = await axios.post(
                `${this.apiBase}/repos/${this.repo}/releases`,
                releaseData,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            console.log('✅ Release criada com sucesso!');
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao criar release: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Gera notas da release
     */
    getReleaseNotes(version) {
        return `🎉 **PDF Commander ${version}**

⚡ Uma ferramenta desktop profissional para manipulação avançada de PDFs!

## ✨ Funcionalidades
- 🔄 União automática de múltiplos PDFs
- 📏 Normalização para tamanhos padrão (100x145mm)
- 📑 Layout em grade (4 PDFs por página A4)
- 🏷️ Sistema completo de geração de etiquetas
- 📊 Dashboard de monitoramento em tempo real
- 🔄 Atualização automática via GitHub
- 💾 Backup automático de arquivos

## 📥 Instalação
1. Baixe o arquivo \`PDF Commander Setup ${version}.exe\`
2. Execute o instalador
3. Siga as instruções na tela

## 🤖 Desenvolvido com IA
Este projeto foi criado utilizando tecnologias de IA para acelerar o desenvolvimento e otimizar a experiência do usuário.

---
**⭐ Se este projeto foi útil para você, considere dar uma estrela!**`;
    }

    /**
     * Faz upload de um asset para a release
     */
    async uploadAsset(uploadUrl, filePath, assetName) {
        console.log(`📎 Fazendo upload de ${assetName}...`);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }

        const fileData = fs.readFileSync(filePath);
        const uploadUrlClean = uploadUrl.replace('{?name,label}', `?name=${encodeURIComponent(assetName)}`);

        try {
            await axios.post(uploadUrlClean, fileData, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/octet-stream'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            console.log(`✅ ${assetName} enviado com sucesso!`);
        } catch (error) {
            throw new Error(`Erro ao fazer upload de ${assetName}: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Lista arquivos gerados no dist-release
     */
    listGeneratedFiles() {
        const distDir = 'dist-release';
        if (!fs.existsSync(distDir)) {
            throw new Error('Diretório dist-release não encontrado');
        }

        const files = fs.readdirSync(distDir);
        console.log('📋 Arquivos gerados:');
        files.forEach(file => {
            const filePath = path.join(distDir, file);
            const stats = fs.statSync(filePath);
            console.log(`  - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        });

        return files;
    }

    /**
     * Gera o latest.yml correto para o auto-updater
     */
    generateLatestYml(version, tag) {
        const exeName = `PDF Commander Setup ${version}.exe`;
        const exePath = path.join('dist-release', exeName);

        if (!fs.existsSync(exePath)) {
            throw new Error(`Arquivo ${exePath} não encontrado`);
        }

        const stats = fs.statSync(exePath);
        const crypto = require('crypto');

        // Calcular SHA512 do arquivo
        const fileBuffer = fs.readFileSync(exePath);
        const sha512 = crypto.createHash('sha512').update(fileBuffer).digest('base64');

        const latestYml = `version: ${version}
files:
  - url: ${exeName}
    sha512: ${sha512}
    size: ${stats.size}
path: ${exeName}
sha512: ${sha512}
releaseDate: '${new Date().toISOString()}'
`;

        const ymlPath = path.join('dist-release', 'latest.yml');
        fs.writeFileSync(ymlPath, latestYml, 'utf8');

        console.log('✅ latest.yml gerado corretamente');
        return ymlPath;
    }

    /**
     * Executa o processo completo de release
     */
    async runRelease(tagOverride = null) {
        try {
            console.log('🚀 Iniciando processo de release automático...\n');

            // Usar tag do parâmetro ou obter automaticamente
            const currentTag = tagOverride || this.getCurrentTag();
            const currentVersion = this.getCurrentVersion();

            console.log(`📋 Tag atual: ${currentTag}`);
            console.log(`📋 Versão: ${currentVersion}\n`);

            // Fazer build
            await this.buildProject();

            // Listar arquivos gerados
            this.listGeneratedFiles();

            // Gerar latest.yml correto
            this.generateLatestYml(currentVersion, currentTag);

            // Criar release
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
            console.log(`🔗 URL da release: ${release.html_url}`);

        } catch (error) {
            console.log(error);
            
            console.error('❌ Erro durante o release:', error.message);
            process.exit(1);
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const tagArg = process.argv[2]; // Pegar tag do argumento da linha de comando
    const releaseManager = new GitHubReleaseManager();
    releaseManager.runRelease(tagArg);
}

module.exports = GitHubReleaseManager;