export const PAGINA_DIMENSOES = {
    'A4': { largura: 210, altura: 297 },
    'A5': { largura: 148, altura: 210 },
    'Carta': { largura: 216, altura: 279 },
    'Etiqueta': { largura: 100, altura: 150 }
};

export const DEFAULT_CAMPOS_ETIQUETA = [
    { id: 'barcode', label: 'Código de Barras', visivel: true },
    { id: 'codigo', label: 'Número do Código', visivel: true },
    { id: 'descricao', label: 'Descrição', visivel: true },
    { id: 'info', label: 'Info Adicional', visivel: true },
];
