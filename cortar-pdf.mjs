import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export async function splitLabels(inputPath, outputDir) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const srcBytes = fs.readFileSync(inputPath);
    const src = await PDFDocument.load(srcBytes);

    const pages = src.getPages();
    console.log(`Total de páginas: ${pages.length}`);

    // ===== Cortes da página inteira =====
    const CUT_TOP = 25;     // em pt
    const CUT_BOTTOM = 140; // em pt
    const CUT_LEFT = 0;    // em pt
    const CUT_RIGHT = 150;    // em pt
    // ====================================

    // Etiquetas dentro da área útil (sem cut)
    const etiquetas = [
        { x: 25, w: 264.16 }, // etiqueta 1
        { x: 289.16, w: 266.29 }, // etiqueta 2
        { x: 555.45, w: 264.16 }, // etiqueta 3
    ];

    let counter = 1;

    for (let p = 0; p < pages.length; p++) {
        const page = pages[p];
        const { width: pageW, height: pageH } = page.getSize();

        // Dimensões da área útil depois de cortar a página inteira
        const usableLeft = CUT_LEFT;
        const usableBottom = CUT_BOTTOM;
        const usableRight = pageW - CUT_RIGHT;
        const usableTop = pageH - CUT_TOP;
        const usableWidth = usableRight - usableLeft;
        const usableHeight = usableTop - usableBottom;

        for (const lab of etiquetas) {
            const newDoc = await PDFDocument.create();

            const embedded = await newDoc.embedPage(page, {
                left: usableLeft + lab.x,
                bottom: usableBottom,
                right: usableLeft + lab.x + lab.w,
                top: usableBottom + usableHeight,
            });

            const outPage = newDoc.addPage([lab.w, usableHeight]);
            outPage.drawPage(embedded, {
                x: 0,
                y: 0,
                width: lab.w,
                height: usableHeight,
            });

            const outBytes = await newDoc.save();
            fs.writeFileSync(`${outputDir}/etiqueta_${counter}.pdf`, outBytes);
            console.log(`Etiqueta ${counter} gerada (página ${p + 1})`);
            counter++;
        }
    }

    console.log(`Processamento concluído! ${counter - 1} etiquetas geradas.`);
}
