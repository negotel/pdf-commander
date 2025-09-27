import React, { useState } from 'react';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';

const GerarTab = ({ produtos, config, isDarkMode }) => {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(18);
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'table'
    const [showLayoutModal, setShowLayoutModal] = useState(false);
    const [quantities, setQuantities] = useState({}); // Para armazenar quantidades individuais

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

    const generateBarcodeDataURL = (code) => {
        try {
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, code, {
                format: "CODE128",
                width: 2,
                height: 40,
                displayValue: false, // Não mostrar o valor, vamos renderizar separadamente
                margin: 0
            });
            return canvas.toDataURL();
        } catch (error) {
            console.error('Erro ao gerar barcode:', error);
            return null;
        }
    };

    // Inicializar quantidades para cada produto
    React.useEffect(() => {
        const initialQuantities = {};
        produtos.forEach(produto => {
            initialQuantities[produto.id] = quantities[produto.id] || 18;
        });
        setQuantities(initialQuantities);
    }, [produtos]);

    const updateQuantity = (productId, newQuantity) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(1, parseInt(newQuantity) || 1)
        }));
    };

    const generatePDFForProduct = async (produto, qty = null) => {
        const quantityToUse = qty || quantities[produto.id] || 18;
        setIsGenerating(true);
        try {
            const pdf = new jsPDF('p', 'mm', config.tamanhoPagina.toLowerCase() || 'a4');
            const layout = calculateLayout();

            let etiquetasColocadas = 0;
            let paginaAtual = 0;

            for (let i = 0; i < quantityToUse; i++) {
                const posicaoNaGrade = etiquetasColocadas % layout.etiquetasPorPagina;
                const linha = Math.floor(posicaoNaGrade / layout.etiquetasPorLinha);
                const coluna = posicaoNaGrade % layout.etiquetasPorLinha;

                if (posicaoNaGrade === 0 && etiquetasColocadas > 0) {
                    pdf.addPage();
                    paginaAtual++;
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
        if (!selectedProduct) {
            alert('Por favor, selecione um produto');
            return;
        }

        const produto = produtos.find(p => p.id === selectedProduct);
        if (!produto) {
            alert('Produto não encontrado');
            return;
        }

        setIsGenerating(true);

        try {
            const pdf = new jsPDF('p', 'mm', config.tamanhoPagina.toLowerCase() || 'a4'); // Definir unidade em mm
            const layout = calculateLayout();

            // Configurações baseadas no tamanho da página
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            let etiquetasColocadas = 0;
            let paginaAtual = 0;

            for (let i = 0; i < quantity; i++) {
                // Calcular posição na grade
                const posicaoNaGrade = etiquetasColocadas % layout.etiquetasPorPagina;
                const linha = Math.floor(posicaoNaGrade / layout.etiquetasPorLinha);
                const coluna = posicaoNaGrade % layout.etiquetasPorLinha;

                // Nova página se necessário
                if (posicaoNaGrade === 0 && etiquetasColocadas > 0) {
                    pdf.addPage();
                    paginaAtual++;
                }

                // Calcular posição X,Y da etiqueta usando margens finais e espaçamentos configurados
                const x = layout.margemXFinal + (coluna * (config.larguraEtiqueta + layout.espacoHorizontal));
                const y = layout.margemYFinal + (linha * (config.alturaEtiqueta + layout.espacoVertical));

                // Desenhar etiqueta
                await drawLabel(pdf, produto, x, y, config.larguraEtiqueta, config.alturaEtiqueta);

                etiquetasColocadas++;
            }

            // Salvar PDF
            const nomeArquivo = `etiquetas_${produto.codigo}_${quantity}unid_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(nomeArquivo);

            alert(`PDF gerado com sucesso!\n${quantity} etiquetas de "${produto.descricao}"\nArquivo: ${nomeArquivo}`);

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const drawLabel = async (pdf, produto, x, y, width, height) => {
        // Desenhar borda da etiqueta (opcional, para debug)
        // pdf.rect(x, y, width, height);

        // Configurar fonte para descrição
        const tamanhoFonteDescricao = Math.max(6, Math.min(30, config.tamanhoFonteDescricao || 12));
        const pesoFonteDescricao = config.pesoFonteDescricao || 'normal';
        const tamanhoFonteCodigo = Math.max(4, Math.min(24, config.tamanhoFonteCodigo || 10));
        const pesoFonteCodigo = config.pesoFonteCodigo || 'bold';

        pdf.setFontSize(tamanhoFonteDescricao);
        pdf.setFont('helvetica', pesoFonteDescricao);

        // Desenhar descrição do produto
        const maxWidth = width - 4; // margem interna
        const textLines = pdf.splitTextToSize(produto.descricao, maxWidth);
        let currentY = y + 5;

        // Calcular altura da linha baseada no tamanho da fonte (ajuste para jsPDF)
        const lineHeight = tamanhoFonteDescricao * 0.4;

        textLines.forEach(line => {
            if (currentY < y + height - 20) { // deixar espaço para o barcode
                // Centralizar texto horizontalmente
                const textWidth = pdf.getTextWidth(line);
                const textX = x + (width - textWidth) / 2;
                pdf.text(line, textX, currentY);
                currentY += lineHeight;
            }
        });

        // Gerar e inserir barcode
        try {
            const barcodeDataURL = generateBarcodeDataURL(produto.codigo);

            if (barcodeDataURL) {
                const barcodeWidth = width - 4;
                const barcodeHeight = 12; // Reduzido para dar espaço ao código
                const barcodeX = x + 2;
                const barcodeY = y + height - barcodeHeight - 8; // Menos espaço, mais próximo do código

                pdf.addImage(barcodeDataURL, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
            }
        } catch (error) {
            console.error('Erro ao inserir barcode:', error);
            // Continuamos mesmo sem barcode - o código será renderizado
        }

        // SEMPRE renderizar o código numérico com nossas configurações
        pdf.setFontSize(tamanhoFonteCodigo);
        pdf.setFont('helvetica', pesoFonteCodigo);
        const codeTextWidth = pdf.getTextWidth(produto.codigo);
        const codeX = x + (width - codeTextWidth) / 2;
        const codeY = y + height - 4; // Mais próximo da parte inferior, logo abaixo do barcode
        pdf.text(produto.codigo, codeX, codeY);
    };

    const selectedProductData = produtos.find(p => p.id === selectedProduct);
    const layout = calculateLayout();

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
                {/* LADO ESQUERDO - Configurações */}
                <div className="space-y-6">
                    {/* Seleção e Configuração */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                            🖨️ Gerar Etiquetas PDF
                        </h3>

                        <div className="space-y-4">
                            {/* Seleção do Produto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Produto *
                                </label>
                                <select
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">Selecione um produto</option>
                                    {produtos.map((produto) => (
                                        <option key={produto.id} value={produto.id}>
                                            {produto.descricao}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Quantidade de Etiquetas
                                </label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    min="1"
                                    max="1000"
                                />
                            </div>

                            {/* Botão de Gerar */}
                            <button
                                onClick={generatePDF}
                                disabled={!selectedProduct || quantity < 1 || isGenerating}
                                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${!selectedProduct || quantity < 1 || isGenerating
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-primary hover:bg-primary-dark'
                                    }`}
                            >
                                {isGenerating ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Gerando PDF...
                                    </span>
                                ) : (
                                    '🖨️ Gerar PDF de Etiquetas'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* LADO DIREITO - Preview e Informações */}
                <div className="space-y-6">
                    {/* Preview do Produto */}
                    {selectedProductData ? (
                        <div className="card">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">👁️ Preview do Produto</h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">Descrição:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedProductData.descricao}</p>
                                </div>
                                <div className="text-center">
                                    <span className="font-medium">Código:</span>
                                    <p className="font-mono font-bold bg-white dark:bg-gray-700 px-2 py-1 rounded inline-block">
                                        {selectedProductData.codigo}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium">Layout:</span>
                                    <p className="text-primary font-semibold">
                                        {layout.etiquetasPorPagina} etiquetas por página
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center text-gray-500 dark:text-gray-400">
                                Selecione um produto para ver o preview
                            </div>
                        </div>
                    )}

                    {/* Informações de Layout */}
                    <div className="card">
                        <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">📊 Informações do Layout</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                                <span className="text-blue-700 dark:text-blue-400">Por linha:</span>
                                <span className="font-semibold ml-2">{layout.etiquetasPorLinha}</span>
                            </div>
                            <div>
                                <span className="text-blue-700 dark:text-blue-400">Linhas:</span>
                                <span className="font-semibold ml-2">{layout.linhasPorPagina}</span>
                            </div>
                            <div>
                                <span className="text-blue-700 dark:text-blue-400">Por página:</span>
                                <span className="font-semibold ml-2">{layout.etiquetasPorPagina}</span>
                            </div>
                        </div>
                        
                        {/* Informações de margens e espaçamentos */}
                        <div className="grid grid-cols-2 gap-4 text-sm border-t border-blue-200 dark:border-blue-600 pt-3">
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
                        {quantity > 0 && (
                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                                <span>Total de páginas necessárias: </span>
                                <span className="font-semibold">
                                    {Math.ceil(quantity / layout.etiquetasPorPagina)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lista de Produtos Disponíveis */}
            <div className="card">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                    📦 Produtos Disponíveis para Etiquetas
                </h4>

                {produtos.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">📦</div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhum produto cadastrado</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            Vá para a aba "Produtos" para cadastrar produtos
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {produtos.map((produto) => (
                            <div
                                key={produto.id}
                                onClick={() => setSelectedProduct(produto.id)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedProduct === produto.id
                                        ? 'border-primary bg-primary bg-opacity-10'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                            >
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 text-center">
                                    {produto.descricao}
                                </h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono font-bold text-center">
                                    {produto.codigo}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GerarTab;
