#!/usr/bin/env node

/**
 * Teste do UpdateService no contexto do Electron
 */

// Mock do Electron
const mockApp = {
    getPath: (name) => {
        if (name === 'userData') {
            return __dirname; // Usar diretório atual para teste
        }
        return __dirname;
    }
};

// Simular o módulo electron
const mockElectron = {
    app: mockApp
};

// Sobrescrever require para electron
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
    if (id === 'electron') {
        return mockElectron;
    }
    return originalRequire.apply(this, arguments);
};

async function testUpdateService() {
    console.log('🧪 Testando UpdateService...\n');

    try {
        // Importar o serviço
        const UpdateService = require('./update-service');
        const updateService = new UpdateService();

        console.log('📋 Configuração:');
        console.log(`   Repositório: ${updateService.config.repoOwner}/${updateService.config.repoName}`);
        console.log(`   Versão atual: ${updateService.config.currentVersion}`);
        console.log('');

        // Verificar atualizações
        console.log('🔍 Verificando atualizações...');
        const updateInfo = await updateService.checkForUpdates();

        if (updateInfo) {
            console.log('✅ Atualização encontrada!');
            console.log(`   Versão: ${updateInfo.version}`);
            console.log(`   URL: ${updateInfo.downloadUrl}`);
            console.log(`   Tamanho: ${updateInfo.size} bytes`);
            console.log(`   SHA512: ${updateInfo.sha512}`);
            console.log('');

            console.log('🎉 Sistema de atualização funcionando perfeitamente!');
            console.log('📱 O aplicativo deve mostrar notificação de atualização disponível.');

        } else {
            console.log('ℹ️  Nenhuma atualização disponível');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

testUpdateService();