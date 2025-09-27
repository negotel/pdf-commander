// Script para criar PDFs de teste
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

async function criarPdfTeste(nome, texto) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 300]);
  
  page.drawText(texto, {
    x: 50,
    y: 250,
    size: 20,
    color: rgb(0, 0, 0),
  });
  
  const bytes = await doc.save();
  await fs.writeFile(path.join('entrada', `${nome}.pdf`), bytes);
  console.log(`Criado: ${nome}.pdf`);
}

async function main() {
  await fs.ensureDir('entrada');
  
  for (let i = 1; i <= 5; i++) {
    await criarPdfTeste(`teste${i}`, `Teste ${i}\nPágina de exemplo`);
  }
  
  console.log('PDFs de teste criados!');
}

main().catch(console.error);
