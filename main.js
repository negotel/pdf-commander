const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const fetch = require('node-fetch');
const PDFDocument = require('pdfkit');
const { loadConfig, saveConfig, needsConfiguration } = require('./config-manager');
const { exec, spawn } = require('child_process');
const { getMonitoringService } = require('./monitoring-service');
const UpdateService = require('./update-service');

let mainWindow;
let monitoring;
let updateService;

// Detecta se está empacotado e define caminhos corretos
const isDev = process.env.NODE_ENV === 'development';
const isPackaged = app ? app.isPackaged : false;
const appPath = isPackaged ? path.dirname(app.getPath('exe')) : __dirname;

function createWindow() {
    console.log('Criando janela principal...');
    console.log('App empacotado:', isPackaged);
    console.log('Caminho da aplicação:', appPath);

    // Inicializa o serviço de monitoramento
    monitoring = getMonitoringService();

    // Inicializa o serviço de atualizações
    updateService = new UpdateService();

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        title: 'Processador de PDFs',
        show: true,
        center: true,
        resizable: true,
        alwaysOnTop: false
    });

    // Carrega a interface React
    console.log('Carregando interface React...');

    // Em desenvolvimento, usar servidor React
    if (isDev) {
        mainWindow.loadURL('http://localhost:3001').then(() => {
            console.log('Interface React carregada com sucesso!');
            mainWindow.show();
            mainWindow.focus();
        }).catch(err => {
            console.error('Erro ao carregar interface React, usando HTML:', err);
            // Fallback para HTML da pasta config-ui/public
            const fallbackPath = isPackaged 
                ? path.join(process.resourcesPath, 'app', 'config-ui/public/index.html')
                : path.join(__dirname, 'config-ui/public/index.html');
            mainWindow.loadFile(fallbackPath);
        });
    } else {
        // Em produção, usar build React
        const buildPath = path.join(__dirname, 'config-ui/build/index.html');
        
        console.log('Modo produção - carregando build React');
        console.log('Build path:', buildPath);
        console.log('App empacotado:', isPackaged);
        console.log('Arquivo existe:', fs.existsSync(buildPath));
        
        // Forçar carregamento do build React
        mainWindow.loadFile(buildPath).then(() => {
            console.log('Interface React (build) carregada com sucesso!');
            mainWindow.show();
            mainWindow.focus();
        }).catch(err => {
            console.error('ERRO CRÍTICO - Não foi possível carregar a interface:', err);
            console.log('Listando conteúdo do diretório:', __dirname);
            try {
                const files = fs.readdirSync(__dirname);
                console.log('Arquivos encontrados:', files);
                
                const configUiPath = path.join(__dirname, 'config-ui');
                if (fs.existsSync(configUiPath)) {
                    const configUiFiles = fs.readdirSync(configUiPath);
                    console.log('Arquivos em config-ui:', configUiFiles);
                    
                    const buildPath = path.join(configUiPath, 'build');
                    if (fs.existsSync(buildPath)) {
                        const buildFiles = fs.readdirSync(buildPath);
                        console.log('Arquivos em build:', buildFiles);
                    }
                }
            } catch (listErr) {
                console.error('Erro ao listar arquivos:', listErr);
            }
            
            // Mostrar janela mesmo com erro para debug
            mainWindow.show();
        });
    }

    // Remove menu bar (opcional)
    mainWindow.setMenuBarVisibility(false);

    // Debug - mostrar quando a janela está pronta
    mainWindow.once('ready-to-show', () => {
        console.log('Janela pronta para exibir');
        mainWindow.show();
        
        // Relatar inicialização do sistema
        monitoring.reportSystemStart().catch(err => {
            console.error('Erro ao reportar inicialização:', err);
        });

        // Iniciar verificação automática de atualizações
        updateService.startAutoCheck();
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers
ipcMain.handle('load-config', async () => {
    try {
        const config = await loadConfig();
        return { success: true, config, needsConfig: needsConfiguration(config) };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-config', async (event, config) => {
    try {
        await saveConfig(config);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('process-pdfs', async (event, config) => {
    const startTime = Date.now();
    
    try {
        // Log início do processamento
        await monitoring.info('Iniciando processamento de PDFs', {
            inputPath: config.paths?.input,
            outputPath: config.paths?.output,
            config: config
        });

        // Salva configuração primeiro
        await saveConfig(config);

        // Captura logs do console para enviar para a interface
        const originalLog = console.log;
        const originalError = console.error;

        console.log = (...args) => {
            const message = args.join(' ');
            mainWindow.webContents.send('processing-log', message);
            originalLog(...args);
        };

        console.error = (...args) => {
            const message = args.join(' ');
            mainWindow.webContents.send('processing-error', message);
            
            // Log crítico para monitoramento
            monitoring.error(`Console Error: ${args.join(' ')}`, {
                timestamp: new Date().toISOString(),
                args: args
            }).catch(err => console.error('Erro ao logar monitoramento:', err));
            
            originalError(...args);
        };

        try {
            // Importa e executa o processamento diretamente
            const { processarPDFs } = require('./index.js');

            const resultado = await processarPDFs();

            // Restaura console original
            console.log = originalLog;
            console.error = originalError;

            const duration = Date.now() - startTime;
            const stats = {
                duration,
                filesProcessed: resultado.arquivos?.length || 0,
                success: resultado.success,
                inputPath: config.paths?.input,
                outputPath: config.paths?.output
            };

            if (resultado.success) {
                // Log sucesso
                await monitoring.reportProcessingComplete(stats);
                
                // Rastrear operação para estatísticas
                await monitoring.trackOperation('pdf_process', {
                    fileCount: stats.filesProcessed,
                    duration: stats.duration,
                    inputPath: stats.inputPath,
                    outputPath: stats.outputPath
                });
                
                return {
                    success: true,
                    message: 'Processamento concluído com sucesso!',
                    arquivos: resultado.arquivos || []
                };
            } else {
                // Log erro
                await monitoring.error('Processamento falhou', {
                    error: resultado.error,
                    stats: stats
                });
                
                return {
                    success: false,
                    error: resultado.error || 'Erro desconhecido no processamento'
                };
            }
        } catch (processError) {
            // Restaura console original em caso de erro
            console.log = originalLog;
            console.error = originalError;
            
            // Log erro crítico
            await monitoring.critical('Erro crítico no processamento', {
                error: processError.message,
                stack: processError.stack,
                config: config,
                duration: Date.now() - startTime
            });
            
            throw processError;
        }

    } catch (error) {
        console.error('Erro no processamento:', error);
        
        // Log erro crítico
        await monitoring.critical('Falha geral no processamento', {
            error: error.message,
            stack: error.stack,
            duration: Date.now() - startTime
        });
        
        return { success: false, error: error.message };
    }
});

ipcMain.handle('select-folder', async (event, title) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title,
        properties: ['openDirectory']
    });

    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('check-files', async (event, folder) => {
    try {
        if (!await fs.pathExists(folder)) {
            return { exists: false, files: [] };
        }

        const files = await fs.readdir(folder);
        const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

        return { exists: true, files: pdfFiles };
    } catch (error) {
        await monitoring.error('Erro ao verificar arquivos', {
            folder: folder,
            error: error.message
        });
        return { exists: false, files: [], error: error.message };
    }
});

// Handlers para monitoramento
ipcMain.handle('monitoring-test', async () => {
    try {
        const success = await monitoring.testConnection();
        return { success, message: success ? 'Teste realizado com sucesso!' : 'Falha no teste' };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

ipcMain.handle('monitoring-log', async (event, level, message, data) => {
    try {
        await monitoring[level](message, data);
        return { success: true };
    } catch (error) {
        console.error('Erro ao logar:', error);
        return { success: false, error: error.message };
    }
});

// Handler para obter estatísticas
ipcMain.handle('get-monitoring-stats', async () => {
    try {
        const stats = await monitoring.getStatistics();
        return { success: true, stats };
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        return { success: false, error: error.message };
    }
});

// Handler para verificar atualizações
ipcMain.handle('check-for-updates', async () => {
    try {
        const updateData = await updateService.checkForUpdates();
        return { success: true, updateData };
    } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
        return { success: false, error: error.message };
    }
});

// Handler para obter dados de atualização
ipcMain.handle('get-update-data', async () => {
    try {
        const updateData = updateService.getUpdateData();
        return { success: true, updateData };
    } catch (error) {
        console.error('Erro ao obter dados de atualização:', error);
        return { success: false, error: error.message };
    }
});

// Handler para baixar atualização
ipcMain.handle('download-update', async (event, updateData) => {
    try {
        let downloadedFile = null;

        const filePath = await updateService.downloadUpdate(updateData, (progress) => {
            // Enviar progresso para a interface
            mainWindow.webContents.send('update-download-progress', progress);
        });

        downloadedFile = filePath;

        return { success: true, filePath };
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

// Handler para conversão ZPL
ipcMain.handle('convert-zpl', async (event, data) => {
    const { zplContent, outputDir, fileName } = data;
    console.log('[ZPL] Handler convert-zpl chamado!');
    console.log('[ZPL] Conteúdo ZPL recebido, tamanho:', zplContent.length);
    console.log('[ZPL] Diretório de saída:', outputDir);
    console.log('[ZPL] Nome do arquivo:', fileName);

    const etiquetas = zplContent.split('^XZ').filter(e => e.trim().length > 0);
    console.log(`[ZPL] Encontradas ${etiquetas.length} etiquetas`);

    try {
        // Criar documento PDF
        const doc = new PDFDocument({ autoFirstPage: false });

        // Usar nome do arquivo original como base com data
        const baseFileName = path.parse(fileName).name;
        const currentDate = new Date().toISOString().slice(0, 10);
        const outputFileName = `${baseFileName}_${currentDate}.pdf`;
        const outputPath = path.join(outputDir, outputFileName);

        console.log('[ZPL] PDF será salvo em:', outputPath);

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Processar em lotes de até 50 etiquetas (limite da API)
        const batchSize = 50;
        let processedCount = 0;

        for (let i = 0; i < etiquetas.length; i += batchSize) {
            const batch = etiquetas.slice(i, i + batchSize);
            console.log(`[ZPL] Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(etiquetas.length / batchSize)} (${batch.length} etiquetas)`);

            // Criar ZPL combinado para o lote
            const combinedZpl = batch.map(etiqueta => '^XA\n' + etiqueta.trim() + '^XZ').join('\n');

            // Enviar progresso
            const progressPercent = Math.round(((i + batch.length) / etiquetas.length) * 100);
            mainWindow.webContents.send('zpl-progress', {
                current: Math.min(i + batch.length, etiquetas.length),
                total: etiquetas.length,
                percent: progressPercent,
                status: `Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(etiquetas.length / batchSize)} (${batch.length} etiquetas)...`
            });

            try {
                // Fazer requisição para a API Labelary com o lote
                const response = await fetch('http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: combinedZpl,
                });

                if (!response.ok) {
                    throw new Error(`Erro na API Labelary (lote ${Math.floor(i / batchSize) + 1}): ${response.status} ${response.statusText}`);
                }

                const buffer = await response.arrayBuffer();
                const imageBuffer = Buffer.from(buffer);

                // Quando múltiplas etiquetas são enviadas, a API retorna uma única imagem
                // com todas as etiquetas empilhadas verticalmente
                // Cada etiqueta tem altura de 4x6 polegadas = 1218 pontos (aprox.)
                const labelHeight = 1218; // Altura de cada etiqueta em pontos (6 polegadas * 203 DPI)
                const labelWidth = 812;   // Largura de cada etiqueta em pontos (4 polegadas * 203 DPI)

                // Dividir a imagem em etiquetas individuais usando canvas
                const { createCanvas, loadImage } = require('canvas');
                const img = await loadImage(imageBuffer);

                for (let j = 0; j < batch.length; j++) {
                    // Adicionar página ao PDF
                    doc.addPage({ size: [labelWidth, labelHeight] });

                    // Criar canvas para extrair esta etiqueta específica
                    const canvas = createCanvas(labelWidth, labelHeight);
                    const ctx = canvas.getContext('2d');

                    // Extrair a porção da imagem correspondente a esta etiqueta
                    ctx.drawImage(img, 0, j * labelHeight, labelWidth, labelHeight, 0, 0, labelWidth, labelHeight);

                    // Converter canvas para buffer PNG e adicionar ao PDF
                    const etiquetaBuffer = canvas.toBuffer('image/png');
                    doc.image(etiquetaBuffer, 0, 0, { fit: [labelWidth, labelHeight] });

                    processedCount++;
                    console.log(`[ZPL] Etiqueta ${processedCount}/${etiquetas.length} processada`);
                }

                // Delay reduzido entre lotes (150ms conforme solicitado)
                if (i + batchSize < etiquetas.length) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                }

            } catch (error) {
                console.error(`Erro no lote ${Math.floor(i / batchSize) + 1}:`, error);
                throw new Error(`Erro no lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
            }
        }

        doc.end();

        // Aguardar o stream terminar
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        console.log('[ZPL] PDF gerado:', outputPath);

        // Rastrear operação para estatísticas
        await monitoring.trackOperation('zpl_convert', {
            fileCount: etiquetas.length,
            outputPath: outputPath,
            fileName: fileName
        });

        return {
            success: true,
            outputPath,
            filename: outputFileName,
            totalEtiquetas: etiquetas.length
        };

    } catch (error) {
        console.error('[ZPL] Erro na conversão ZPL:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// Handler para cortar PDF
ipcMain.handle('cortar-pdf', async (event, data) => {
    console.log('🎯 Handler cortar-pdf chamado!');
    console.log('📄 Dados recebidos:', {
        hasFileData: !!data?.fileData,
        fileDataType: typeof data?.fileData,
        fileDataLength: data?.fileData?.length,
        fileName: data?.fileName,
        dataKeys: Object.keys(data || {})
    });

    try {
        // Importar o módulo de corte
        const { splitLabels } = await import('./cortar-pdf.mjs');

        // Criar arquivo temporário
        const tempDir = path.join(app.getPath('temp'), 'pdf-cutter');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const tempPdfPath = path.join(tempDir, `temp-${Date.now()}.pdf`);
        // Converter array de volta para Uint8Array se necessário
        const uint8Array = Array.isArray(data.fileData) ? new Uint8Array(data.fileData) : data.fileData;
        fs.writeFileSync(tempPdfPath, Buffer.from(uint8Array));

        // Enviar progresso inicial
        mainWindow.webContents.send('cortar-pdf-progress', {
            percent: 10,
            status: 'Iniciando processamento...'
        });

        // Definir diretório de saída (usar o fornecido pelo usuário ou o padrão)
        const outputDir = data.outputDir || path.join(appPath, 'etiquetas');

        // Executar o corte
        await splitLabels(tempPdfPath, outputDir);

        // Se deve unir as etiquetas, fazer isso agora
        if (data.unirEtiquetas) {
            console.log('Unindo etiquetas em um único PDF...');
            
            // Enviar progresso de união
            mainWindow.webContents.send('cortar-pdf-progress', {
                percent: 80,
                status: 'Unindo etiquetas em um único PDF...'
            });

            // Listar arquivos de etiquetas gerados
            const etiquetaFiles = fs.readdirSync(outputDir)
                .filter(file => file.startsWith('etiqueta_') && file.endsWith('.pdf'))
                .map(file => path.join(outputDir, file))
                .sort(); // Ordenar para manter sequência

            if (etiquetaFiles.length > 0) {
                // Criar PDF unido
                const { PDFDocument } = await import('pdf-lib');
                const doc = await PDFDocument.create();

                for (const etiquetaFile of etiquetaFiles) {
                    const fileBytes = fs.readFileSync(etiquetaFile);
                    const srcDoc = await PDFDocument.load(fileBytes);
                    
                    const pageIndices = Array.from({ length: srcDoc.getPageCount() }, (_, i) => i);
                    const copiedPages = await doc.copyPages(srcDoc, pageIndices);
                    copiedPages.forEach(page => doc.addPage(page));
                }

                // Usar nome do arquivo original como base
                const baseFileName = path.parse(data.fileName).name;
                const outputFileName = `${baseFileName}_etiquetas.pdf`;
                const outputPath = path.join(outputDir, outputFileName);
                const bytes = await doc.save();
                fs.writeFileSync(outputPath, bytes);

                console.log(`PDF unido salvo em: ${outputPath}`);

                // Remover arquivos individuais de etiquetas
                for (const etiquetaFile of etiquetaFiles) {
                    try {
                        fs.unlinkSync(etiquetaFile);
                        console.log(`Arquivo individual removido: ${etiquetaFile}`);
                    } catch (removeError) {
                        console.warn(`Não foi possível remover arquivo individual: ${etiquetaFile}`, removeError.message);
                    }
                }
            }
        }

        // Limpar arquivo temporário
        fs.unlinkSync(tempPdfPath);

        // Enviar progresso final
        mainWindow.webContents.send('cortar-pdf-progress', {
            percent: 100,
            status: data.unirEtiquetas ? 'Etiquetas cortadas e unidas com sucesso!' : 'Processamento concluído!'
        });

        // Rastrear operação para estatísticas
        await monitoring.trackOperation('etiquetas_generate', {
            fileName: data.fileName,
            outputDir: outputDir,
            unido: data.unirEtiquetas
        });

        return {
            success: true,
            message: data.unirEtiquetas ? 'Etiquetas cortadas e unidas com sucesso!' : 'PDF cortado com sucesso!',
            outputDir,
            unido: data.unirEtiquetas
        };

    } catch (error) {
        console.error('Erro ao cortar PDF:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// Handler para seleção de diretório
ipcMain.handle('select-directory', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: 'Selecionar diretório para salvar as etiquetas'
        });

        if (!result.canceled && result.filePaths.length > 0) {
            return {
                success: true,
                directory: result.filePaths[0]
            };
        }

        return {
            success: false,
            error: 'Nenhum diretório selecionado'
        };
    } catch (error) {
        console.error('Erro ao selecionar diretório:', error);
        return {
            success: false,
            error: error.message
        };
    }
});
