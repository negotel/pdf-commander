const axios = require('axios');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const { app } = require('electron');

/**
 * Serviço de monitoramento e envio de logs via WhatsApp
 * Não expõe credenciais no frontend
 */
class MonitoringService {
    constructor() {
        // Configurações seguras (não expostas no frontend)
        this.config = {
            token: "FAD1F5E87191-428F-B120-70AF5AE5DC0A",
            url: "http://chat-assistente.shop:8080/message/sendText/gmail-whastapp",
            adminNumber: "5511940277034"
        };
        
        this.systemInfo = this.getSystemInfo();
        this.sessionId = this.generateSessionId();
        this.isEnabled = true;
        
        // Log local para backup - usar diretório apropriado quando empacotado
        const isPackaged = app && app.isPackaged;
        const logDir = isPackaged 
            ? path.join(os.homedir(), 'ProcessadorPDFs', 'logs')
            : path.join(__dirname, 'logs');
            
        this.logFile = path.join(logDir, 'monitoring.log');
        this.logDir = logDir;
        this.ensureLogDirectory();
    }

    /**
     * Gera ID único da sessão
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Coleta informações do sistema
     */
    getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            version: os.release(),
            memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
            cpus: os.cpus().length,
            user: os.userInfo().username
        };
    }

    /**
     * Garante que o diretório de logs existe
     */
    async ensureLogDirectory() {
        try {
            await fs.ensureDir(this.logDir);
            console.log('📁 Diretório de logs criado:', this.logDir);
        } catch (error) {
            console.error('❌ Erro ao criar diretório de logs:', error);
        }
    }

    /**
     * Log local para backup/debug
     */
    async logLocal(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            sessionId: this.sessionId,
            level,
            message,
            data,
            system: this.systemInfo
        };

        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(this.logFile, logLine);
        } catch (error) {
            console.error('Erro ao salvar log local:', error.message);
        }
    }

    /**
     * Formata mensagem para WhatsApp
     */
    formatMessage(level, message, data = null) {
        const emoji = {
            'CRITICAL': '🚨',
            'ERROR': '❌',
            'WARNING': '⚠️',
            'INFO': 'ℹ️',
            'SUCCESS': '✅'
        };

        let msg = `${emoji[level] || '📋'} *PDF Processor - ${level}*\n\n`;
        msg += `📅 *Data:* ${new Date().toLocaleString('pt-BR')}\n`;
        msg += `🆔 *Sessão:* ${this.sessionId.substr(-8)}\n`;
        msg += `💻 *Sistema:* ${this.systemInfo.platform} ${this.systemInfo.arch}\n`;
        msg += `👤 *Usuário:* ${this.systemInfo.user}\n`;
        msg += `🖥️ *Host:* ${this.systemInfo.hostname}\n\n`;
        msg += `📝 *Mensagem:*\n${message}\n`;
        
        if (data) {
            msg += `\n📊 *Dados adicionais:*\n`;
            if (typeof data === 'object') {
                msg += JSON.stringify(data, null, 2);
            } else {
                msg += data;
            }
        }

        return msg;
    }

    /**
     * Envia mensagem via WhatsApp
     */
    async sendWhatsAppMessage(message) {
        if (!this.isEnabled) {
            console.log('Monitoramento desabilitado');
            return false;
        }

        try {
            const payload = {
                number: this.config.adminNumber,
                text: message
            };

            const response = await axios.post(this.config.url, payload, {
                headers: {
                    'apikey': `${this.config.token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 segundos timeout
            });

            if (response.status === 200) {
                console.log('✅ Mensagem WhatsApp enviada com sucesso');
                return true;
            } else {
                console.error('❌ Erro ao enviar WhatsApp:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro na API WhatsApp:', error.message);
            return false;
        }
    }

    /**
     * Log crítico - sempre envia WhatsApp
     */
    async critical(message, data = null) {
        await this.logLocal('CRITICAL', message, data);
        const whatsappMessage = this.formatMessage('CRITICAL', message, data);
        await this.sendWhatsAppMessage(whatsappMessage);
    }

    /**
     * Log de erro - envia WhatsApp para erros importantes
     */
    async error(message, data = null) {
        await this.logLocal('ERROR', message, data);
        
        // Critérios para enviar por WhatsApp
        const isCriticalError = (
            message.includes('Cannot read properties') ||
            message.includes('TypeError') ||
            message.includes('ReferenceError') ||
            message.includes('PDF processing failed') ||
            message.includes('File system error')
        );

        if (isCriticalError) {
            const whatsappMessage = this.formatMessage('ERROR', message, data);
            await this.sendWhatsAppMessage(whatsappMessage);
        }
    }

    /**
     * Log de aviso - apenas log local
     */
    async warning(message, data = null) {
        await this.logLocal('WARNING', message, data);
    }

    /**
     * Log de informação - apenas log local
     */
    async info(message, data = null) {
        await this.logLocal('INFO', message, data);
    }

    /**
     * Log de sucesso - apenas log local
     */
    async success(message, data = null) {
        await this.logLocal('SUCCESS', message, data);
    }

    /**
     * Relatório de abertura do sistema
     */
    async reportSystemStart() {
        const message = `Sistema iniciado com sucesso!\n\n📊 Estatísticas:\n- CPU: ${this.systemInfo.cpus} cores\n- RAM: ${this.systemInfo.memory}\n- OS: ${this.systemInfo.platform} ${this.systemInfo.version}`;
        
        await this.info('Sistema iniciado', this.systemInfo);
        
        // Envia por WhatsApp apenas na primeira execução do dia
        if (await this.isFirstRunToday()) {
            const whatsappMessage = this.formatMessage('INFO', message, {
                version: require('./package.json').version,
                features: ['Unir PDFs', 'Gerar Etiquetas', 'Interface React', 'Zpl']
            });
            await this.sendWhatsAppMessage(whatsappMessage);
        }
    }

    /**
     * Relatório de processamento concluído
     */
    async reportProcessingComplete(stats) {
        const message = `Processamento de PDFs concluído!\n\n📈 Estatísticas:\n- Arquivos processados: ${stats.filesProcessed || 0}\n- Tempo: ${stats.duration || 'N/A'}\n- Tamanho total: ${stats.totalSize || 'N/A'}`;
        
        await this.success('Processamento concluído', stats);
        
        // Envia por WhatsApp se processou muitos arquivos ou demorou muito
        if (stats.filesProcessed > 10 || (stats.duration && stats.duration > 60000)) {
            const whatsappMessage = this.formatMessage('SUCCESS', message, stats);
            await this.sendWhatsAppMessage(whatsappMessage);
        }
    }

    /**
     * Verifica se é a primeira execução do dia
     */
    async isFirstRunToday() {
        const today = new Date().toDateString();
        const flagFile = path.join(this.logDir, 'last_run.txt');
        
        try {
            const lastRun = await fs.readFile(flagFile, 'utf8');
            if (lastRun.trim() === today) {
                return false;
            }
        } catch (error) {
            // Arquivo não existe, é primeira execução
        }
        
        try {
            await fs.writeFile(flagFile, today);
            return true;
        } catch (error) {
            console.error('Erro ao salvar flag de primeira execução:', error);
            return true; // Assume primeira execução se não conseguir salvar
        }
    }

    /**
     * Habilita/desabilita monitoramento
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`Monitoramento ${enabled ? 'habilitado' : 'desabilitado'}`);
    }

    /**
     * Teste de conectividade
     */
    async testConnection() {
        try {
            const testMessage = `🧪 *Teste de Conectividade*\n\nSistema de monitoramento funcionando corretamente!\n\n📅 ${new Date().toLocaleString('pt-BR')}`;
            const success = await this.sendWhatsAppMessage(testMessage);
            
            if (success) {
                await this.success('Teste de conectividade bem-sucedido');
                return true;
            } else {
                await this.error('Falha no teste de conectividade');
                return false;
            }
        } catch (error) {
            await this.error('Erro no teste de conectividade', { error: error.message });
            return false;
        }
    }

    /**
     * Rastreia operação de processamento
     */
    async trackOperation(operationType, details = {}) {
        const operation = {
            type: operationType,
            timestamp: new Date().toISOString(),
            ...details
        };

        try {
            // Salvar no arquivo de estatísticas
            const statsFile = path.join(this.logDir, 'statistics.json');
            let stats = { operations: [], summary: { pdfs: 0, zpl: 0, etiquetas: 0, total: 0 } };

            try {
                const existingStats = await fs.readFile(statsFile, 'utf8');
                stats = JSON.parse(existingStats);
            } catch (error) {
                // Arquivo não existe, usar dados iniciais
            }

            // Adicionar operação
            stats.operations.unshift(operation);

            // Manter apenas últimas 1000 operações
            if (stats.operations.length > 1000) {
                stats.operations = stats.operations.slice(0, 1000);
            }

            // Atualizar resumo
            stats.summary.total++;
            if (operationType === 'pdf_process') {
                stats.summary.pdfs++;
            } else if (operationType === 'zpl_convert') {
                stats.summary.zpl++;
            } else if (operationType === 'etiquetas_generate') {
                stats.summary.etiquetas++;
            }

            console.log('📊 Salvando estatísticas:', statsFile, stats.summary);
            await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));
            console.log('📊 Estatísticas salvas com sucesso');
        } catch (error) {
            console.error('Erro ao rastrear operação:', error);
        }
    }

    /**
     * Obtém estatísticas de uso
     */
    async getStatistics() {
        try {
            const statsFile = path.join(this.logDir, 'statistics.json');
            const existingStats = await fs.readFile(statsFile, 'utf8');
            const stats = JSON.parse(existingStats);

            // Calcular estatísticas adicionais
            const recentActivity = stats.operations.slice(0, 10).map(op => ({
                type: op.type.replace('_process', '').replace('_convert', '').replace('_generate', ''),
                count: op.fileCount || 1,
                date: new Date(op.timestamp).toISOString().split('T')[0],
                time: new Date(op.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }));

            // Calcular tempo médio (simulado por enquanto)
            const processingTime = {
                average: 2450, // ms - será calculado baseado nos dados reais futuramente
                total: stats.operations.length * 2450
            };

            return {
                totalProcessed: stats.summary.total,
                byCategory: stats.summary,
                recentActivity,
                processingTime
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            // Retornar dados padrão se não conseguir ler
            return {
                totalProcessed: 0,
                byCategory: { pdfs: 0, zpl: 0, etiquetas: 0 },
                recentActivity: [],
                processingTime: { average: 0, total: 0 }
            };
        }
    }

    /**
     * Limpa estatísticas antigas (manter apenas últimos 30 dias)
     */
    async cleanupOldStats() {
        try {
            const statsFile = path.join(this.logDir, 'statistics.json');
            const existingStats = await fs.readFile(statsFile, 'utf8');
            const stats = JSON.parse(existingStats);

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Filtrar operações dos últimos 30 dias
            stats.operations = stats.operations.filter(op => 
                new Date(op.timestamp) > thirtyDaysAgo
            );

            // Recalcular resumo
            stats.summary = { pdfs: 0, zpl: 0, etiquetas: 0, total: 0 };
            stats.operations.forEach(op => {
                stats.summary.total++;
                if (op.type === 'pdf_process') stats.summary.pdfs++;
                else if (op.type === 'zpl_convert') stats.summary.zpl++;
                else if (op.type === 'etiquetas_generate') stats.summary.etiquetas++;
            });

            await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));
        } catch (error) {
            console.error('Erro ao limpar estatísticas antigas:', error);
        }
    }
}

// Instância singleton
let monitoringInstance = null;

/**
 * Obtém instância do serviço de monitoramento
 */
function getMonitoringService() {
    if (!monitoringInstance) {
        monitoringInstance = new MonitoringService();
    }
    return monitoringInstance;
}

module.exports = {
    MonitoringService,
    getMonitoringService
};
