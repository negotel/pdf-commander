const fs = require('fs-extra');
const path = require('path');

const CONFIG_FILE = path.resolve('config.json');

/** Configuração padrão */
const DEFAULT_CONFIG = {
    pageSize: {
        target: {
            width: 100,
            height: 145,
            unit: "mm"
        },
        output: {
            width: 210,
            height: 297,
            unit: "mm",
            name: "A4"
        }
    },
    output: {
        type: "both", // "single", "grid", "both"
        formats: {
            single: {
                enabled: true,
                filename: "unico_sequencial.pdf"
            },
            grid: {
                enabled: true,
                filename: "composto_4por_folha.pdf",
                itemsPerPage: 4,
                layout: "2x2"
            }
        }
    },
    printer: {
        enabled: false,
        name: "",
        autoSend: false,
        copies: 1
    },
    cleanup: {
        deleteNormalized: true,
        createBackup: true,
        deleteOriginals: true
    },
    paths: {
        input: "entrada",
        output: "saida",
        normalized: "saida/normalizados"
    }
};

/** Carrega configuração do arquivo ou cria com padrões */
async function loadConfig() {
    try {
        if (await fs.pathExists(CONFIG_FILE)) {
            const config = await fs.readJson(CONFIG_FILE);
            return { ...DEFAULT_CONFIG, ...config };
        } else {
            console.log('==> Arquivo de configuração não encontrado, criando com valores padrão...');
            await saveConfig(DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }
    } catch (error) {
        console.warn('Erro ao carregar configuração, usando padrões:', error.message);
        return DEFAULT_CONFIG;
    }
}

/** Salva configuração no arquivo */
async function saveConfig(config) {
    try {
        await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
        console.log('==> Configuração salva em config.json');
    } catch (error) {
        console.error('Erro ao salvar configuração:', error.message);
    }
}

/** Valida se a configuração precisa da interface de configuração */
function needsConfiguration(config) {
    // Se o arquivo não existe ou tem configurações básicas, precisa de configuração
    return !fs.pathExistsSync(CONFIG_FILE) ||
        !config.pageSize ||
        !config.output ||
        config.output.type === undefined;
}

/** Converte mm para pontos */
function mmToPoints(mm) {
    return mm * (72 / 25.4);
}

/** Converte pontos para mm */
function pointsToMm(points) {
    return points / (72 / 25.4);
}

module.exports = {
    loadConfig,
    saveConfig,
    needsConfiguration,
    mmToPoints,
    pointsToMm,
    DEFAULT_CONFIG,
    CONFIG_FILE
};
