#!/usr/bin/env node

/**
 * Script de teste do sistema de atualização
 */

const axios = require('axios');

async function testUpdateAPI() {
    console.log('🧪 Testando API de atualização...\n');

    try {
        const repoOwner = 'negotel';
        const repoName = 'pdf-commander';
        const currentVersion = require('./package.json').version;

        console.log('📋 Configuração:');
        console.log(`   Repositório: ${repoOwner}/${repoName}`);
        console.log(`   Versão atual: ${currentVersion}`);
        console.log('');

        // Verificar releases
        console.log('🔍 Buscando releases...');
        const response = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/releases`);

        const releases = response.data;
        console.log(`📦 Encontrados ${releases.length} releases\n`);

        // Filtrar releases mais recentes que a versão atual
        const newerReleases = releases.filter(release => {
            const version = release.tag_name.replace('v', '');
            return version > currentVersion && !release.draft && !release.prerelease;
        });

        if (newerReleases.length > 0) {
            const latestRelease = newerReleases[0];
            console.log('✅ Atualização encontrada!');
            console.log(`   Tag: ${latestRelease.tag_name}`);
            console.log(`   Nome: ${latestRelease.name}`);
            console.log(`   Data: ${latestRelease.published_at}`);
            console.log(`   URL: ${latestRelease.html_url}`);
            console.log('');

            // Verificar assets
            console.log('� Assets disponíveis:');
            latestRelease.assets.forEach(asset => {
                console.log(`   - ${asset.name} (${(asset.size / 1024 / 1024).toFixed(2)} MB)`);
            });
            console.log('');

            // Verificar se tem latest.yml
            const latestYml = latestRelease.assets.find(asset => asset.name === 'latest.yml');
            if (latestYml) {
                console.log('📋 Baixando latest.yml...');
                const ymlResponse = await axios.get(latestYml.browser_download_url);
                console.log('✅ latest.yml obtido:');
                console.log(ymlResponse.data);
            } else {
                console.log('⚠️  latest.yml não encontrado');
            }

        } else {
            console.log('ℹ️  Nenhuma atualização disponível');
        }

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', error.response.data);
        }
    }
}

// Executar teste
testUpdateAPI();