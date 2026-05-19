import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

const DEFAULT_CUT_CONFIG = {
    cutTop: 25,
    cutBottom: 140,
    cutLeft: 0,
    cutRight: 150,
    pageWidth: null,
    pageHeight: null,
    labels: [
        { x: 25, y: 0, w: 264.16 },
        { x: 289.16, y: 0, w: 266.29 },
        { x: 555.45, y: 0, w: 264.16 },
    ],
};

function numberOrDefault(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCutConfig(config = {}) {
    const labelsSource = Array.isArray(config.labels) && config.labels.length > 0
        ? config.labels
        : DEFAULT_CUT_CONFIG.labels;

    return {
        cutTop: numberOrDefault(config.cutTop, DEFAULT_CUT_CONFIG.cutTop),
        cutBottom: numberOrDefault(config.cutBottom, DEFAULT_CUT_CONFIG.cutBottom),
        cutLeft: numberOrDefault(config.cutLeft, DEFAULT_CUT_CONFIG.cutLeft),
        cutRight: numberOrDefault(config.cutRight, DEFAULT_CUT_CONFIG.cutRight),
        pageWidth: Number.isFinite(Number(config.pageWidth)) ? Number(config.pageWidth) : null,
        pageHeight: Number.isFinite(Number(config.pageHeight)) ? Number(config.pageHeight) : null,
        labels: labelsSource.map((label, index) => {
            const fallback = DEFAULT_CUT_CONFIG.labels[index] || DEFAULT_CUT_CONFIG.labels[0];
            return {
                x: numberOrDefault(label.x, fallback.x),
                y: numberOrDefault(label.y, fallback.y || 0),
                w: numberOrDefault(label.w, fallback.w),
                h: Number.isFinite(Number(label.h)) ? Number(label.h) : null,
            };
        }),
    };
}

function normalizeFileName(value) {
    return String(value || 'arquivo')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase() || 'arquivo';
}

function buildPagePlan(page, pageIndex, config) {
    const { width: pageW, height: pageH } = page.getSize();
    const xScale = config.pageWidth && config.pageWidth > 0 ? pageW / config.pageWidth : 1;
    const yScale = config.pageHeight && config.pageHeight > 0 ? pageH / config.pageHeight : 1;

    const cutTop = config.cutTop * yScale;
    const cutBottom = config.cutBottom * yScale;
    const cutLeft = config.cutLeft * xScale;
    const cutRight = config.cutRight * xScale;
    const usableLeft = cutLeft;
    const usableBottom = cutBottom;
    const usableRight = pageW - cutRight;
    const usableTop = pageH - cutTop;
    const usableWidth = usableRight - usableLeft;
    const usableHeight = usableTop - usableBottom;

    if (usableWidth <= 0 || usableHeight <= 0) {
        throw new Error(`Configuração de corte inválida para a página ${pageIndex + 1}. Página ${pageW.toFixed(2)} x ${pageH.toFixed(2)} pt, área útil ${usableWidth.toFixed(2)} x ${usableHeight.toFixed(2)} pt. Verifique as margens.`);
    }

    const labels = config.labels.map((lab, labelIndex) => {
        const label = {
            x: lab.x * xScale,
            y: lab.y * yScale,
            w: lab.w * xScale,
            h: (lab.h || usableHeight / yScale) * yScale,
        };

        const epsilon = 0.5;
        if (
            label.w <= 0 ||
            label.h <= 0 ||
            label.x < -epsilon ||
            label.y < -epsilon ||
            label.x + label.w > usableWidth + epsilon ||
            label.y + label.h > usableHeight + epsilon
        ) {
            throw new Error(`Configuração da etiqueta ${labelIndex + 1} inválida na página ${pageIndex + 1}. Página real ${pageW.toFixed(2)} x ${pageH.toFixed(2)} pt, configuração base ${config.pageWidth || 'auto'} x ${config.pageHeight || 'auto'} pt, área útil ${usableWidth.toFixed(2)} x ${usableHeight.toFixed(2)} pt, etiqueta x=${lab.x}, y=${lab.y}, largura=${lab.w}, altura=${lab.h || 'auto'}.`);
        }

        label.x = Math.max(0, label.x);
        label.y = Math.max(0, label.y);
        label.w = Math.min(label.w, usableWidth - label.x);
        label.h = Math.min(label.h, usableHeight - label.y);

        return label;
    });

    return {
        pageW,
        pageH,
        usableLeft,
        usableTop,
        usableWidth,
        usableHeight,
        labels,
    };
}

export async function splitLabels(inputPath, outputDir, cutConfig = {}, onProgress = null, outputBaseName = null) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const srcBytes = fs.readFileSync(inputPath);
    const src = await PDFDocument.load(srcBytes);

    const pages = src.getPages();
    console.log(`Total de páginas: ${pages.length}`);

    const config = normalizeCutConfig(cutConfig);
    const totalLabels = pages.length * config.labels.length;
    const pagePlans = pages.map((page, pageIndex) => buildPagePlan(page, pageIndex, config));
    const normalizedBaseName = normalizeFileName(outputBaseName || path.parse(inputPath).name);
    const generatedFiles = [];

    let counter = 1;

    for (let p = 0; p < pages.length; p++) {
        const page = pages[p];
        const plan = pagePlans[p];

        for (let labelIndex = 0; labelIndex < plan.labels.length; labelIndex++) {
            const lab = plan.labels[labelIndex];

            const newDoc = await PDFDocument.create();
            const labelLeft = plan.usableLeft + lab.x;
            const labelTop = plan.usableTop - lab.y;
            const labelBottom = labelTop - lab.h;

            const embedded = await newDoc.embedPage(page, {
                left: labelLeft,
                bottom: labelBottom,
                right: labelLeft + lab.w,
                top: labelTop,
            });

            const outPage = newDoc.addPage([lab.w, lab.h]);
            outPage.drawPage(embedded, {
                x: 0,
                y: 0,
                width: lab.w,
                height: lab.h,
            });

            const outBytes = await newDoc.save();
            const outputName = `${normalizedBaseName}_etiqueta_${counter}.pdf`;
            const outputPath = path.join(outputDir, outputName);
            fs.writeFileSync(outputPath, outBytes);
            generatedFiles.push(outputPath);
            const progress = {
                current: counter,
                total: totalLabels,
                page: p + 1,
                label: labelIndex + 1,
                outputName,
                crop: {
                    x: lab.x,
                    y: lab.y,
                    width: lab.w,
                    height: lab.h,
                },
                pageSize: {
                    width: plan.pageW,
                    height: plan.pageH,
                },
            };
            console.log(`Etiqueta ${counter}/${totalLabels} gerada (página ${p + 1}, etiqueta ${labelIndex + 1}) - x=${lab.x}, y=${lab.y}, w=${lab.w}, h=${lab.h}`);
            if (onProgress) onProgress(progress);
            counter++;
        }
    }

    console.log(`Processamento concluído! ${counter - 1} etiquetas geradas.`);
    return {
        generatedFiles,
        outputBaseName: normalizedBaseName,
        totalLabels: counter - 1,
    };
}
