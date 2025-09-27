const fs = require("fs");
const fetch = require("node-fetch"); // v2
const PDFDocument = require("pdfkit");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function convertZplToPdf(zplFile, pdfFile) {
  const zplContent = fs.readFileSync(zplFile, "utf8");

  const etiquetas = zplContent.split("^XZ").filter(e => e.trim().length > 0);

  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = fs.createWriteStream(pdfFile);
  doc.pipe(stream);

  console.log(`📄 Iniciando processamento de ${etiquetas.length} etiquetas...`);

  let count = 0;
  for (const etiqueta of etiquetas) {
    count++;
    const zpl = "^XA\n" + etiqueta.trim() + "^XZ";

    const res = await fetch("http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: zpl,
    });

    if (!res.ok) {
      throw new Error(`Erro na API Labelary (etiqueta ${count}): ${res.status} ${res.statusText}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    doc.addPage({ size: [283, 425] });
    doc.image(buffer, 0, 0, { fit: [283, 425] });

    console.log(`✅ Etiqueta ${count}/${etiquetas.length} processada`);

    // Delay otimizado: 300ms entre requisições (mais rápido que 1s, mas ainda respeita limites)
    if (count < etiquetas.length) {
      await sleep(300);
    }
  }

  doc.end();
  console.log(`🎉 PDF gerado com sucesso: ${pdfFile} (${count} etiquetas)`);
}

convertZplToPdf("Envio-51867978-Etiquetas-do-volumes.txt", "etiquetas-10x15.pdf");
