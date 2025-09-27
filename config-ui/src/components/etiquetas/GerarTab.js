import React, { useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

const GerarTab = ({ produtos, config, isDarkMode }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'table'
    const [showLayoutModal, setShowLayoutModal] = useState(false);
    const [quantities, setQuantities] = useState({}); // Para armazenar quantidades individuais

    // Inicializar quantidades para cada produto
    React.useEffect(() => {
        const initialQuantities = {};
        produtos.forEach(produto => {
            initialQuantities[produto.id] = quantities[produto.id] || 18;
        });
        setQuantities(initialQuantities);
    }, [produtos, quantities]);

    const updateQuantity = (productId, newQuantity) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(1, parseInt(newQuantity) || 1)
        }));
    };

    const calculateLayout = () => {
        const paginaDimensoes = {
            'A4': { largura: 210, altura: 297 },
            'A5': { largura: 148, altura: 210 },
            'Carta': { largura: 216, altura: 279 }
        };

        const pagina = paginaDimensoes[config.tamanhoPagina] || paginaDimensoes['A4'];

        // Usar as margens configuradas pelo usuário
        const margemX = config.margemX || 0;
        const margemY = config.margemY || 0;
        const espacoH = config.espacoHorizontal || 0;
        const espacoV = config.espacoVertical || 0;

        const areaUtil = {
            largura: pagina.largura - (margemX * 2),
            altura: pagina.altura - (margemY * 2)
        };

        // Cálculo correto: quando não há espaçamento, usar 0 no cálculo
        let etiquetasPorLinha;
        if (espacoH === 0) {
            etiquetasPorLinha = Math.floor(areaUtil.largura / config.larguraEtiqueta);
        } else {
            etiquetasPorLinha = Math.floor((areaUtil.largura + espacoH) / (config.larguraEtiqueta + espacoH));
        }

        let linhasPorPagina;
        if (espacoV === 0) {
            linhasPorPagina = Math.floor(areaUtil.altura / config.alturaEtiqueta);
        } else {
            linhasPorPagina = Math.floor((areaUtil.altura + espacoV) / (config.alturaEtiqueta + espacoV));
        }

        const etiquetasPorPagina = etiquetasPorLinha * linhasPorPagina;

        // Calcular área real ocupada pelas etiquetas (com espaçamentos configurados)
        const larguraOcupada = (etiquetasPorLinha * config.larguraEtiqueta) + ((etiquetasPorLinha - 1) * espacoH);
        const alturaOcupada = (linhasPorPagina * config.alturaEtiqueta) + ((linhasPorPagina - 1) * espacoV);

        // Calcular espaço livre dentro da área útil
        const espacoLivreX = areaUtil.largura - larguraOcupada;
        const espacoLivreY = areaUtil.altura - alturaOcupada;

        // Margens finais: margem configurada + centralização do espaço restante
        const margemXFinal = margemX + (espacoLivreX / 2);
        const margemYFinal = margemY + (espacoLivreY / 2);

        return {
            etiquetasPorLinha,
            linhasPorPagina,
            etiquetasPorPagina,
            margemXFinal,
            margemYFinal,
            larguraOcupada,
            alturaOcupada,
            espacoHorizontal: espacoH,
            espacoVertical: espacoV,
            margemXConfigurada: margemX,
            margemYConfigurada: margemY
        };
    };

    const generateBarcodeDataURL = async (code, tipoCodigo = null) => {
        try {
            const tipoCodigoFinal = tipoCodigo || config.tipoCodigo || 'code128';
            
            if (tipoCodigoFinal === 'qrcode') {
                // Gerar QR Code
                const qrDataURL = await QRCode.toDataURL(code, {
                    width: 200,
                    height: 200,
                    margin: 0,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                return qrDataURL;
            } else {
                // Gerar Code 128 (padrão)
                const canvas = document.createElement('canvas');
                JsBarcode(canvas, code, {
                    format: "CODE128",
                    width: 2,
                    height: 40,
                    displayValue: false, // Não mostrar o valor, vamos renderizar separadamente
                    margin: 0
                });
                return canvas.toDataURL();
            }
        } catch (error) {
            console.error('Erro ao gerar código:', error);
            return null;
        }
    };

    const generatePDFForProduct = async (produto, qty = null) => {
        const quantityToUse = qty || quantities[produto.id] || 18;
        setIsGenerating(true);
        try {
            const pdf = new jsPDF('p', 'mm', config.tamanhoPagina.toLowerCase() || 'a4');
            const layout = calculateLayout();

            let etiquetasColocadas = 0;

            for (let i = 0; i < quantityToUse; i++) {
                const posicaoNaGrade = etiquetasColocadas % layout.etiquetasPorPagina;
                const linha = Math.floor(posicaoNaGrade / layout.etiquetasPorLinha);
                const coluna = posicaoNaGrade % layout.etiquetasPorLinha;

                if (posicaoNaGrade === 0 && etiquetasColocadas > 0) {
                    pdf.addPage();
                }

                const x = layout.margemXFinal + (coluna * (config.larguraEtiqueta + layout.espacoHorizontal));
                const y = layout.margemYFinal + (linha * (config.alturaEtiqueta + layout.espacoVertical));

                await drawLabel(pdf, produto, x, y, config.larguraEtiqueta, config.alturaEtiqueta);
                etiquetasColocadas++;
            }

            const nomeArquivo = `etiquetas_${produto.codigo}_${quantityToUse}unid_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(nomeArquivo);

            alert(`PDF gerado com sucesso!\n${quantityToUse} etiquetas de "${produto.descricao}"\nArquivo: ${nomeArquivo}`);

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const drawLabel = async (pdf, produto, x, y, width, height) => {
        // Configurar fonte para descrição
        const tamanhoFonteDescricao = Math.max(6, Math.min(30, config.tamanhoFonteDescricao || 12));
        const pesoFonteDescricao = config.pesoFonteDescricao || 'normal';
        const tamanhoFonteCodigo = Math.max(4, Math.min(24, config.tamanhoFonteCodigo || 10));
        const pesoFonteCodigo = config.pesoFonteCodigo || 'bold';

        pdf.setFontSize(tamanhoFonteDescricao);
        pdf.setFont('helvetica', pesoFonteDescricao);

        // Gerar e adicionar código primeiro
        const tipoCodigo = produto.tipoCodigo || config.tipoCodigo || 'code128';
        const barcodeDataURL = await generateBarcodeDataURL(produto.codigo, tipoCodigo);
        let barcodeY;
        
        if (barcodeDataURL) {
            let barcodeWidth, barcodeHeight;
            
            if (tipoCodigo === 'qrcode') {
                // QR Code é quadrado
                const qrSize = Math.min(width * 0.6, height * 0.4); // Limitar tamanho
                barcodeWidth = qrSize;
                barcodeHeight = qrSize;
            } else {
                // Code 128 é retangular
                barcodeWidth = width * 0.6;
                barcodeHeight = 12;
            }
            
            const barcodeX = x + (width - barcodeWidth) / 2; // centralizar
            
            // Ajustar posição Y baseado no tipo de código
            if (tipoCodigo === 'qrcode') {
                // Para QR Code, subir mais para dar espaço ao texto abaixo
                barcodeY = y + height - barcodeHeight - 12; // Mais espaço para texto
            } else {
                // Para Code 128, manter posição original
                barcodeY = y + height - barcodeHeight - 8;
            }

            pdf.addImage(barcodeDataURL, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
        }

        // Desenhar descrição do produto próxima ao código
        const maxWidth = width - 1; // margem interna reduzida
        const descricaoLines = pdf.splitTextToSize(produto.descricao, maxWidth);

        // Posicionar descrição logo acima do código de barras
        const espacoEntreDescricaoEBarcode = 4; // espaço entre descrição e barcode
        const alturaDescricao = descricaoLines.length * (tamanhoFonteDescricao * 0.35);
        const startY = barcodeY - espacoEntreDescricaoEBarcode - alturaDescricao + (tamanhoFonteDescricao * 0.35);
        
        descricaoLines.forEach((line, index) => {
            const textWidth = pdf.getTextWidth(line);
            const centeredX = x + (width - textWidth) / 2;
            pdf.text(line, centeredX, startY + (index * (tamanhoFonteDescricao * 0.35)));
        });

        // Renderizar código numérico separadamente
        pdf.setFontSize(tamanhoFonteCodigo);
        pdf.setFont('helvetica', pesoFonteCodigo);

        // Ajustar tamanho da fonte para QR Code (menor)
        if (tipoCodigo === 'qrcode') {
            const tamanhoFonteQR = Math.max(6, tamanhoFonteCodigo - 2); // Fonte menor para QR Code
            pdf.setFontSize(tamanhoFonteQR);
        }

        const codeWidth = pdf.getTextWidth(produto.codigo);
        const codeX = x + (width - codeWidth) / 2; // centralizar
        
        // Ajustar posição baseado no tipo de código
        let codeY;
        if (tipoCodigo === 'qrcode') {
            // Para QR Code, manter próximo da borda inferior
            codeY = produto.informacaoAdicional ? y + height - 7 : y + height - 4;
        } else {
            // Para Code 128, manter posição original
            codeY = produto.informacaoAdicional ? y + height - 7 : y + height - 4;
        }

        pdf.text(produto.codigo, codeX, codeY);

        // Renderizar informação adicional se existir
        if (produto.informacaoAdicional) {
            const tamanhoFonteInfo = Math.max(6, tamanhoFonteCodigo - 2); // Fonte um pouco menor
            pdf.setFontSize(tamanhoFonteInfo);
            pdf.setFont('helvetica', 'normal'); // Peso normal para tom mais leve
            pdf.setTextColor(100, 100, 100); // Cor cinza mais clara

            const infoWidth = pdf.getTextWidth(produto.informacaoAdicional);
            const infoX = x + (width - infoWidth) / 2; // centralizar
            
            // Ajustar posição da informação adicional baseado no tipo de código
            const infoY = y + height - 2; // Manter na borda inferior para ambos os tipos

            pdf.text(produto.informacaoAdicional, infoX, infoY);

            // Restaurar cor do texto para preto
            pdf.setTextColor(0, 0, 0);
        }
    };

    const LayoutModal = ({ isOpen, onClose }) => {
        if (!isOpen) return null;

        const layout = calculateLayout();

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">📊 Informações do Layout</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded">
                            <div className="text-blue-700 dark:text-blue-400 font-medium">Por linha</div>
                            <div className="text-xl font-bold">{layout.etiquetasPorLinha}</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded">
                            <div className="text-blue-700 dark:text-blue-400 font-medium">Linhas</div>
                            <div className="text-xl font-bold">{layout.linhasPorPagina}</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded">
                            <div className="text-blue-700 dark:text-blue-400 font-medium">Por página</div>
                            <div className="text-xl font-bold">{layout.etiquetasPorPagina}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-blue-700 dark:text-blue-400">Margem X:</span>
                            <span className="font-semibold ml-2">{layout.margemXConfigurada}mm + {(layout.margemXFinal - layout.margemXConfigurada).toFixed(1)}mm = {layout.margemXFinal?.toFixed(1)}mm</span>
                        </div>
                        <div>
                            <span className="text-blue-700 dark:text-blue-400">Margem Y:</span>
                            <span className="font-semibold ml-2">{layout.margemYConfigurada}mm + {(layout.margemYFinal - layout.margemYConfigurada).toFixed(1)}mm = {layout.margemYFinal?.toFixed(1)}mm</span>
                        </div>
                        <div>
                            <span className="text-blue-700 dark:text-blue-400">Espaço Horizontal:</span>
                            <span className="font-semibold ml-2">{layout.espacoHorizontal}mm</span>
                        </div>
                        <div>
                            <span className="text-blue-700 dark:text-blue-400">Espaço Vertical:</span>
                            <span className="font-semibold ml-2">{layout.espacoVertical}mm</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const layout = calculateLayout(); // eslint-disable-line no-unused-vars

    return (
        <div className="space-y-6">
            {/* Header com controles */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    🖨️ Gerar Etiquetas PDF
                </h3>

                {/* Botões de visualização */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'cards'
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        🗃️ Cards
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'table'
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        📋 Tabela
                    </button>
                </div>
            </div>

            {produtos.length === 0 ? (
                <div className="card">
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">📦</div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhum produto cadastrado</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            Vá para a aba "Produtos" para cadastrar produtos
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Visualização em Cards */}
                    {viewMode === 'cards' && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {produtos.map((produto) => (
                                <div key={produto.id} className="card relative">
                                    {/* Botão de informações do layout */}
                                    <button
                                        onClick={() => setShowLayoutModal(true)}
                                        className="absolute top-4 right-4 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors"
                                        title="Informações do Layout"
                                    >
                                        ?
                                    </button>

                                    {/* Preview da etiqueta */}
                                    <div className="mb-4 mx-auto" style={{ width: '200px', aspectRatio: `${config.larguraEtiqueta}/${config.alturaEtiqueta}` }}>
                                        <div className="border-2 border-gray-300 bg-white rounded-lg p-3 h-full flex flex-col justify-between shadow-sm">
                                            {/* Descrição */}
                                            <div className="text-center text-gray-800 font-medium text-sm truncate">
                                                {produto.descricao}
                                            </div>

                                            {/* Área do código */}
                                            <div className="flex-1 flex flex-col justify-end">
                                                {/* Renderizar baseado no tipo de código do produto */}
                                                {(produto.tipoCodigo || config.tipoCodigo || 'code128') === 'qrcode' ? (
                                                    // Preview de QR Code
                                                    <div className="mb-2 mx-auto" style={{ width: '30px', height: '30px' }}>
                                                        <div 
                                                            className="w-full h-full bg-gray-800"
                                                            style={{
                                                                background: `
                                                                    repeating-conic-gradient(from 0deg, black 0deg 2deg, white 2deg 4deg),
                                                                    repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px),
                                                                    repeating-linear-gradient(0deg, black 0px, black 2px, white 2px, white 4px)
                                                                `,
                                                                backgroundSize: '6px 6px, 6px 6px, 6px 6px'
                                                            }}
                                                            title="QR Code Preview"
                                                        ></div>
                                                    </div>
                                                ) : (
                                                    // Preview de Code 128 (barras)
                                                    <div
                                                        className="mb-2"
                                                        style={{
                                                            background: 'repeating-linear-gradient(90deg, black 0px, black 1px, white 1px, white 2px)',
                                                            height: '20px'
                                                        }}
                                                        title="Code 128 Preview"
                                                    ></div>
                                                )}

                                                {/* Código numérico */}
                                                <div className="text-center font-mono font-bold text-xs text-gray-800">
                                                    {produto.codigo}
                                                </div>

                                                {/* Informação adicional */}
                                                {produto.informacaoAdicional && (
                                                    <div className="text-center text-xs text-gray-500 mt-1">
                                                        {produto.informacaoAdicional}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informações do produto */}
                                    <div className="text-center mb-4">
                                        <h4 className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                                            {produto.descricao}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                            {produto.codigo}
                                        </p>
                                    </div>

                                    {/* Footer com controles */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-2 flex-1">
                                            
                                            <input
                                                type="number"
                                                value={quantities[produto.id] || 18}
                                                onChange={(e) => updateQuantity(produto.id, e.target.value)}
                                                className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded text-sm"
                                                min="1"
                                                max="1000"
                                            />
                                        </div>
                                        <button
                                            onClick={() => generatePDFForProduct(produto)}
                                            disabled={isGenerating}
                                            className={`px-4 py-2 rounded font-medium text-white transition-colors flex-shrink-0 ${isGenerating
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-primary hover:bg-primary-dark'
                                                }`}
                                        >
                                            {isGenerating ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Gerando...
                                                </span>
                                            ) : (
                                                '🖨️ Gerar PDF'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Visualização em Tabela */}
                    {viewMode === 'table' && (
                        <div className="card">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-600">
                                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Produto</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Código</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Quantidade</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Layout</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {produtos.map((produto, index) => (
                                            <tr key={produto.id} className={`border-b border-gray-100 dark:border-gray-700 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                                        {produto.descricao}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-mono text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                        {produto.codigo}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="number"
                                                        value={quantities[produto.id] || 18}
                                                        onChange={(e) => updateQuantity(produto.id, e.target.value)}
                                                        className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded text-center"
                                                        min="1"
                                                        max="1000"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={() => setShowLayoutModal(true)}
                                                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                                        title="Ver informações do layout"
                                                    >
                                                        📊 Layout
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={() => generatePDFForProduct(produto)}
                                                        disabled={isGenerating}
                                                        className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${isGenerating
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : 'bg-primary hover:bg-primary-dark'
                                                            }`}
                                                    >
                                                        {isGenerating ? (
                                                            <span className="flex items-center">
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Gerando...
                                                            </span>
                                                        ) : (
                                                            '🖨️ Gerar'
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de informações do layout */}
            <LayoutModal isOpen={showLayoutModal} onClose={() => setShowLayoutModal(false)} />
        </div>
    );
};

export default GerarTab;