#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { loadConfig, needsConfiguration, mmToPoints } = require('./config-manager');

/** Conversão: 1 mm = 72 / 25.4 pt */
const MM_TO_PT = 72 / 25.4;

// Variáveis globais que serão definidas pela configuração
let TARGET_W, TARGET_H, A4_W, A4_H, MARGIN_X, MARGIN_Y;
let DIR_IN, DIR_OUT, DIR_NORM, OUT_COMPOSTO, OUT_UNICO;
let CONFIG;

/** Inicializa variáveis baseadas na configuração */
function initializeFromConfig(config) {
    CONFIG = config;

    // Tamanhos em pontos
    TARGET_W = mmToPoints(config.pageSize.target.width);
    TARGET_H = mmToPoints(config.pageSize.target.height);
    A4_W = mmToPoints(config.pageSize.output.width);
    A4_H = mmToPoints(config.pageSize.output.height);

    // Margens para centralizar baseado no layout
    const itemsPerRow = Math.sqrt(config.output.formats.grid.itemsPerPage);
    MARGIN_X = (A4_W - itemsPerRow * TARGET_W) / 2;
    MARGIN_Y = (A4_H - itemsPerRow * TARGET_H) / 2;

    // Caminhos
    DIR_IN = path.resolve(config.paths.input);
    DIR_OUT = path.resolve(config.paths.output);
    DIR_NORM = path.join(DIR_OUT, 'normalizados');
    OUT_COMPOSTO = path.join(DIR_OUT, config.output.formats.grid.filename);
    OUT_UNICO = path.join(DIR_OUT, config.output.formats.single.filename);
}

/** Verifica e cria diretórios necessários */
async function verificarDiretorios() {
    await fs.ensureDir(DIR_OUT);
    await fs.ensureDir(DIR_NORM);
}

/** Lista PDFs recursivamente */
async function listarPdfs(dir) {
    const itens = await fs.readdir(dir);
    const arquivos = [];
    for (const nome of itens) {
        const full = path.join(dir, nome);
        const stat = await fs.stat(full);
        if (stat.isDirectory()) {
            arquivos.push(...await listarPdfs(full));
        } else if (nome.toLowerCase().endsWith('.pdf')) {
            arquivos.push(full);
        }
    }
    return arquivos;
}

/** Normaliza um único PDF:
 *  - Se tiver várias páginas, gera um arquivo por página.
 *  - Saída: 100x145 mm com a página original ajustada e centralizada.
 */
async function normalizarPdf(caminho, destinoDir) {
    const bytes = await fs.readFile(caminho);
    const src = await PDFDocument.load(bytes);
    const base = path.parse(caminho).name;

    const gerados = [];

    for (let i = 0; i < src.getPageCount(); i++) {
        const pageSrc = src.getPage(i);

        // Largura/altura da página de origem
        let srcW, srcH;
        if (typeof pageSrc.getSize === 'function') {
            const { width, height } = pageSrc.getSize();
            srcW = width;
            srcH = height;
        } else {
            srcW = pageSrc.getWidth();
            srcH = pageSrc.getHeight();
        }

        const docOut = await PDFDocument.create();

        // Copia a página do documento de origem para este doc
        const [copiedPage] = await docOut.copyPages(src, [i]);

        // Redimensiona a página copiada para o tamanho alvo
        copiedPage.setSize(TARGET_W, TARGET_H);

        // Escala proporcional para caber em 100x145 mm
        const scale = Math.min(TARGET_W / srcW, TARGET_H / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;

        // Centraliza o conteúdo na página
        const dx = (TARGET_W - drawW) / 2;
        const dy = (TARGET_H - drawH) / 2;

        // Aplica transformação de escala e posição
        copiedPage.scaleContent(scale, scale);
        copiedPage.translateContent(dx / scale, dy / scale);

        // Adiciona a página modificada ao documento
        docOut.addPage(copiedPage);

        const outBytes = await docOut.save();
        const idx = src.getPageCount() > 1 ? `_p${String(i + 1).padStart(2, '0')}` : '';
        const outPath = path.join(destinoDir, `${base}${idx}_norm.pdf`);
        await fs.writeFile(outPath, outBytes);
        gerados.push(outPath);
    }

    return gerados;
}

/** Normaliza todos PDFs de entrada para DIR_NORM */
async function etapaNormalizar() {
    await fs.ensureDir(DIR_IN);
    await fs.ensureDir(DIR_OUT);
    await fs.emptyDir(DIR_NORM);

    const lista = await listarPdfs(DIR_IN);
    if (lista.length === 0) {
        console.error('Nenhum PDF encontrado em ./entrada');
        process.exitCode = 2;
        return [];
    }

    const saidas = [];
    for (const pdf of lista) {
        const g = await normalizarPdf(pdf, DIR_NORM);
        saidas.push(...g);
    }

    // Ordena por nome para agrupamento previsível
    saidas.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return saidas;
}

/** Monta 4 PDFs normalizados por página A4 em OUT_COMPOSTO */
async function etapaMontarCompilado(arquivosNorm) {
    if (arquivosNorm.length === 0) {
        console.error('Nada para compor.');
        return;
    }

    const doc = await PDFDocument.create();

    // Agrupa de 4 em 4
    for (let i = 0; i < arquivosNorm.length; i += 4) {
        const grupo = arquivosNorm.slice(i, i + 4);

        const page = doc.addPage([A4_W, A4_H]);

        // Posições (origem no canto inferior-esquerdo)
        const posicoes = [
            { x: MARGIN_X, y: A4_H - MARGIN_Y - TARGET_H },                    // topo-esquerda
            { x: A4_W - MARGIN_X - TARGET_W, y: A4_H - MARGIN_Y - TARGET_H },  // topo-direita
            { x: MARGIN_X, y: MARGIN_Y },                                      // base-esquerda
            { x: A4_W - MARGIN_X - TARGET_W, y: MARGIN_Y }                     // base-direita
        ];

        for (let j = 0; j < grupo.length; j++) {
            const fileBytes = await fs.readFile(grupo[j]);
            const srcNorm = await PDFDocument.load(fileBytes);

            // Embebera a primeira página do PDF
            const [embeddedPage] = await doc.embedPages([srcNorm.getPage(0)]);

            // Desenha a página incorporada na posição correspondente (100x145 mm)
            const { x, y } = posicoes[j];
            page.drawPage(embeddedPage, { x, y, width: TARGET_W, height: TARGET_H });
        }
    }

    await fs.ensureDir(path.dirname(OUT_COMPOSTO));
    const bytes = await doc.save();
    await fs.writeFile(OUT_COMPOSTO, bytes);
}

/** Monta todos os PDFs normalizados em um único arquivo sequencial */
async function etapaMontarUnico(arquivosNorm) {
    if (arquivosNorm.length === 0) {
        console.error('Nada para unir.');
        return;
    }

    const doc = await PDFDocument.create();

    // Adiciona cada PDF normalizado como páginas sequenciais
    for (const arquivo of arquivosNorm) {
        const fileBytes = await fs.readFile(arquivo);
        const srcNorm = await PDFDocument.load(fileBytes);

        // Copia todas as páginas do PDF normalizado
        const pageIndices = Array.from({ length: srcNorm.getPageCount() }, (_, i) => i);
        const copiedPages = await doc.copyPages(srcNorm, pageIndices);

        // Adiciona as páginas copiadas ao documento final
        copiedPages.forEach(page => doc.addPage(page));
    }

    await fs.ensureDir(path.dirname(OUT_UNICO));
    const bytes = await doc.save();
    await fs.writeFile(OUT_UNICO, bytes);
}

/** Cria backup dos arquivos de entrada sem usar archiver */
async function criarBackupEntrada(arquivosEntrada) {
    if (arquivosEntrada.length === 0) {
        console.log('Nenhum arquivo para fazer backup.');
        return;
    }

    // Gera nome da pasta de backup com data
    const agora = new Date();
    const dataFormatada = agora.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const horaFormatada = agora.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
    const nomePasta = `backup_entrada_${dataFormatada}_${horaFormatada}_${arquivosEntrada.length}arquivos`;
    const caminhoBackup = path.join(DIR_OUT, nomePasta);

    try {
        // Cria diretório de backup
        await fs.ensureDir(caminhoBackup);
        
        let totalBytes = 0;
        
        // Copia cada arquivo para o backup
        for (const arquivo of arquivosEntrada) {
            const nomeArquivo = path.basename(arquivo);
            const destino = path.join(caminhoBackup, nomeArquivo);
            await fs.copy(arquivo, destino);
            
            const stats = await fs.stat(destino);
            totalBytes += stats.size;
        }

        console.log(`==> Backup criado: ${nomePasta} (${totalBytes} bytes)`);

        // Deleta os arquivos originais após backup se configurado
        if (CONFIG.cleanup.deleteOriginals) {
            console.log('==> Deletando arquivos de entrada originais...');
            for (const arquivo of arquivosEntrada) {
                await fs.unlink(arquivo);
            }
            console.log(`==> ${arquivosEntrada.length} arquivo(s) de entrada deletado(s)`);
        }

        return caminhoBackup;
        
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        throw error;
    }
}

/** Deleta os arquivos normalizados após criar o composto */
async function deletarNormalizados() {
    if (CONFIG.cleanup.deleteNormalized) {
        console.log('==> Deletando arquivos normalizados...');
        await fs.emptyDir(DIR_NORM);
        console.log('==> Arquivos normalizados deletados');
    }
}

/** Envia arquivos para impressora */
async function enviarParaImpressora(arquivos) {
    if (!CONFIG.printer.enabled || arquivos.length === 0) {
        return;
    }

    console.log('==> Enviando para impressora...');

    for (const arquivo of arquivos) {
        try {
            // No Windows, usa o comando print
            const { exec } = require('child_process');
            const comando = CONFIG.printer.name
                ? `print /D:"${CONFIG.printer.name}" "${arquivo}"`
                : `start "" "${arquivo}"`;

            exec(comando, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro ao imprimir ${path.basename(arquivo)}:`, error.message);
                } else {
                    console.log(`==> ${path.basename(arquivo)} enviado para impressora`);
                }
            });

            // Se múltiplas cópias
            for (let i = 1; i < CONFIG.printer.copies; i++) {
                exec(comando);
            }

        } catch (error) {
            console.error(`Erro ao imprimir ${path.basename(arquivo)}:`, error.message);
        }
    }
}

/** Função principal de processamento para export */
async function processarPDFs() {
  const isElectron = process.versions.electron !== undefined;
  
  try {
    // Carrega configuração
    const config = await loadConfig();
    
    // Se não é Electron e precisa de configuração, exibe erro
    if (!isElectron && needsConfiguration(config)) {
      console.log('\n==> Configuração incompleta detectada. Use a interface Electron para configurar.');
      return { success: false, needsConfig: true };
    }

    console.log('==> Processando PDFs com configurações carregadas...');
    
    // Configurar variáveis globais
    initializeFromConfig(config);
    
    // Verificar diretórios
    await verificarDiretorios();
    
    // Executar processamento
    const arquivosGerados = [];
    
    // Lista PDFs de entrada
    const arquivosEntrada = await listarPdfs(DIR_IN);
    if (arquivosEntrada.length === 0) {
      throw new Error(`Nenhum arquivo PDF encontrado em: ${DIR_IN}`);
    }

    console.log(`Target: ${config.pageSize.target.width}x${config.pageSize.target.height}${config.pageSize.target.unit} Output: ${config.pageSize.output.format} (${config.pageSize.output.width}x${config.pageSize.output.height}${config.pageSize.output.unit})`);

    // Etapa 1: Normalizar
    const normalizados = await etapaNormalizar();
    if (normalizados.length === 0) {
      throw new Error('Nenhum arquivo foi normalizado com sucesso');
    }
    
    // Gera PDF único se habilitado
    if (config.output.type === 'both' || config.output.type === 'single') {
      if (config.output.formats.single.enabled) {
        console.log('==> Montando PDF único sequencial...');
        await etapaMontarUnico(normalizados);
        arquivosGerados.push(OUT_UNICO);
      }
    }
    
    // Gera PDF grade se habilitado
    if (config.output.type === 'both' || config.output.type === 'grid') {
      if (config.output.formats.grid.enabled) {
        console.log(`==> Montando ${config.output.formats.grid.itemsPerPage} por página...`);
        await etapaMontarCompilado(normalizados);
        arquivosGerados.push(OUT_COMPOSTO);
      }
    }

    // Deleta os arquivos normalizados
    await deletarNormalizados();

    // Cria backup e deleta originais se configurado
    if (config.cleanup.createBackup) {
      const arquivosEntrada = await listarPdfs(DIR_IN);
      if (arquivosEntrada.length > 0) {
        console.log('==> Criando backup dos arquivos de entrada...');
        await criarBackupEntrada(arquivosEntrada);
      }
    }
    
    // Envia para impressora se configurado
    await enviarParaImpressora(arquivosGerados);

    console.log('==> Concluído.');
    console.log('Saídas:');
    arquivosGerados.forEach(arquivo => {
      console.log(` - ${path.basename(arquivo)}: ${arquivo}`);
    });
    
    // Se não é Electron, pausa para mostrar resultado
    if (!isElectron) {
      console.log('\n==> Pressione Enter para fechar...');
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', () => process.exit(0));
      }
    }
    
    return { success: true, arquivos: arquivosGerados };
    
  } catch (err) {
    console.error('Falha na execução:', err);
    
    // Se não é Electron, pausa para mostrar erro
    if (!isElectron) {
      console.log('\n==> Pressione Enter para fechar...');
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', () => process.exit(1));
      }
    }
    
    if (isElectron) {
      throw err; // Re-throw para o Electron capturar
    }
    
    process.exitCode = 1;
    return { success: false, error: err.message };
  }
}

// Execução principal quando chamado diretamente
if (require.main === module) {
  processarPDFs();
}

// Exporta função para uso em outros módulos
module.exports = { 
  processarPDFs
};
