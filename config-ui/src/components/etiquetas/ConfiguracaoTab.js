import React, { useState, useEffect } from 'react';
import { ConfiguracaoEtiqueta } from './ConfiguracaoEtitqueta';

const ConfiguracaoTab = ({ config, onSave, isDarkMode }) => {
    const [localConfig, setLocalConfig] = useState(config);
    const [previewLayout, setPreviewLayout] = useState(null);

    // Atualizar config local quando config externa mudar
    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    // Calcular layout sempre que a config mudar
    useEffect(() => {
        calculateLayout();
    }, [localConfig]); // eslint-disable-line react-hooks/exhaustive-deps

    const calculateLayout = () => {
        const paginaDimensoes = {
            'A4': { largura: 210, altura: 297 },
            'A5': { largura: 148, altura: 210 },
            'Carta': { largura: 216, altura: 279 }
        };

        const pagina = paginaDimensoes[localConfig.tamanhoPagina] || paginaDimensoes['A4'];

        // Área útil (removendo as margens)
        const areaUtil = {
            largura: pagina.largura - (localConfig.margemX * 2),
            altura: pagina.altura - (localConfig.margemY * 2)
        };

        // Cálculo correto: quando não há espaçamento, usar 0 no cálculo
        const espacoH = localConfig.espacoHorizontal || 0;
        const espacoV = localConfig.espacoVertical || 0;

        // Calcular quantas etiquetas cabem por linha
        let etiquetasPorLinha;
        if (espacoH === 0) {
            etiquetasPorLinha = Math.floor(areaUtil.largura / localConfig.larguraEtiqueta);
        } else {
            etiquetasPorLinha = Math.floor((areaUtil.largura + espacoH) / (localConfig.larguraEtiqueta + espacoH));
        }

        // Calcular quantas linhas cabem por página
        let linhasPorPagina;
        if (espacoV === 0) {
            linhasPorPagina = Math.floor(areaUtil.altura / localConfig.alturaEtiqueta);
        } else {
            linhasPorPagina = Math.floor((areaUtil.altura + espacoV) / (localConfig.alturaEtiqueta + espacoV));
        }

        const etiquetasPorPagina = etiquetasPorLinha * linhasPorPagina;

        setPreviewLayout({
            etiquetasPorLinha,
            linhasPorPagina,
            etiquetasPorPagina,
            areaUtil
        });
    };

    const handleChange = (field, value) => {
        setLocalConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        onSave(localConfig);
        alert('Configurações salvas com sucesso!');
    };

    const resetToDefault = () => {
        const defaultConfig = {
            tamanhoPagina: 'A4',
            margemX: 0,
            margemY: 0,
            larguraEtiqueta: 62.5,
            alturaEtiqueta: 45.5,
            espacoHorizontal: 0,
            espacoVertical: 0,
            // Configurações de fonte
            tamanhoFonteDescricao: 12,
            pesoFonteDescricao: 'normal',
            tamanhoFonteCodigo: 10,
            pesoFonteCodigo: 'bold',
            // Tipo de código
            tipoCodigo: 'code128'
        };
        setLocalConfig(defaultConfig);
        
        // Limpar localStorage para forçar recálculo
        localStorage.removeItem('etiquetas_config');
        
        // Recalcular layout imediatamente
        setTimeout(() => {
            calculateLayout();
        }, 100);
    };

    return (
        <div className="grid lg:grid-cols-12 gap-3">
            {/* LADO ESQUERDO - Configurações */}
            <ConfiguracaoEtiqueta
                handleChange={handleChange}
                localConfig={localConfig}
                handleSave={handleSave}
                resetToDefault={resetToDefault}
            />

            {/* LADO DIREITO - Preview */}
            <div className="col-span-12 lg:col-span-8">
                {/* Preview do Layout */}
                <div className="card">
                    <h4 className="font-medium text-gray-900 mb-4">
                        👁️ Preview em Tempo Real
                    </h4>

                    {previewLayout && (
                        <>
                            {/* Preview visual realista */}
                            <div className="mt-6 flex flex-col items-center">
                                <div className="bg-white border-2 border-gray-300 p-4 rounded-lg overflow-hidden" style={{
                                    aspectRatio: '210/297',
                                    width: '100%',
                                    maxWidth: '600px',
                                    margin: '0 auto'
                                }}>
                                    <div
                                        className="grid gap-1 h-full w-full"
                                        style={{
                                            gridTemplateColumns: `repeat(${previewLayout.etiquetasPorLinha}, 1fr)`,
                                            gridTemplateRows: `repeat(${previewLayout.linhasPorPagina}, 1fr)`,
                                            padding: `${(localConfig.margemY / 297) * 100}% ${(localConfig.margemX / 210) * 100}%`
                                        }}
                                    >
                                        {Array(Math.min(previewLayout.etiquetasPorPagina, 20)).fill(0).map((_, i) => (
                                            <div
                                                key={i}
                                                className="border border-gray-500 bg-white rounded-sm flex flex-col justify-between p-2 relative overflow-hidden shadow-sm"
                                                style={{
                                                    fontSize: `${Math.max(8, 14 - previewLayout.etiquetasPorLinha)}px`,
                                                    lineHeight: '1.2',
                                                    minHeight: '40px'
                                                }}
                                            >
                                                {/* Descrição do produto */}
                                                <div className="text-gray-800 text-center truncate" style={{
                                                    fontSize: `${Math.max(8, (localConfig.tamanhoFonteDescricao || 12))}px`,
                                                    fontWeight: localConfig.pesoFonteDescricao || 'normal'
                                                }}>
                                                    <span>
                                                        PRODUTO {i + 1}
                                                    </span>
                                                </div>

                                                {/* Área do código */}
                                                <div className="flex-1 flex flex-col justify-end mt-1">
                                                    {/* Simulação baseada no tipo de código */}
                                                    {(localConfig.tipoCodigo || 'code128') === 'qrcode' ? (
                                                        /* QR Code simulado */
                                                        <div 
                                                            className="bg-black mb-1 mx-auto"
                                                            style={{
                                                                background: 'repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px), repeating-linear-gradient(0deg, black 0px, black 2px, white 2px, white 4px)',
                                                                width: `${Math.min(30, Math.floor(30 / previewLayout.linhasPorPagina))}px`,
                                                                height: `${Math.min(30, Math.floor(30 / previewLayout.linhasPorPagina))}px`,
                                                                minWidth: '15px',
                                                                minHeight: '15px'
                                                            }}
                                                        ></div>
                                                    ) : (
                                                        /* Código de barras tradicional */
                                                        <div className="bg-black mb-1" style={{
                                                            background: 'repeating-linear-gradient(90deg, black 0px, black 1px, white 1px, white 2px)',
                                                            height: `${Math.max(20, Math.floor(20 / previewLayout.linhasPorPagina))}px`,
                                                            minHeight: '10px'
                                                        }}></div>
                                                    )}

                                                    {/* Código numérico */}
                                                    <div className="text-center text-slate-900" style={{
                                                        fontSize: `${Math.max(6, (localConfig.tamanhoFonteCodigo || 10))}px`,
                                                        fontWeight: localConfig.pesoFonteCodigo || 'bold',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        <span>789{String(i).padStart(3, '0')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Indicar se há mais etiquetas */}
                                        {previewLayout.etiquetasPorPagina > 20 && (
                                            <div className="col-span-full text-center text-gray-500 text-sm pt-2">
                                                ... e mais {previewLayout.etiquetasPorPagina - 20} etiquetas
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Legenda do preview */}
                                <div className={`mt-3 text-xs p-3 rounded ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-100'}`}>
                                    <div className="flex items-center space-x-4 flex-wrap">
                                        <div className="flex items-center">
                                            <div className={`w-3 h-3 border rounded-sm mr-2 ${isDarkMode ? 'bg-gray-600 border-gray-400' : 'bg-gray-50 border-gray-400'}`}></div>
                                            <span>Etiqueta ({localConfig.larguraEtiqueta}×{localConfig.alturaEtiqueta}mm)</span>
                                        </div>
                                        <div className="flex items-center">
                                            {(localConfig.tipoCodigo || 'code128') === 'qrcode' ? (
                                                <>
                                                    <div className="w-3 h-3 bg-black mr-2" style={{
                                                        background: 'repeating-linear-gradient(90deg, black 0px, black 1px, white 1px, white 2px), repeating-linear-gradient(0deg, black 0px, black 1px, white 1px, white 2px)',
                                                        backgroundSize: '2px 2px'
                                                    }}></div>
                                                    <span>QR Code</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-3 h-1 bg-black mr-2"></div>
                                                    <span>Código de barras Code 128</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`font-mono px-1 rounded mr-2 ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}`}>123</span>
                                            <span>Código numérico</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Informações calculadas */}
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-3">📊 Layout Calculado</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Etiquetas por linha:</span>
                                                <span className="font-semibold">{previewLayout.etiquetasPorLinha}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Linhas por página:</span>
                                                <span className="font-semibold">{previewLayout.linhasPorPagina}</span>
                                            </div>
                                            <div className="flex justify-between text-primary">
                                                <span>Total por página:</span>
                                                <span className="font-bold text-lg">{previewLayout.etiquetasPorPagina}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dimensões */}
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-3">📐 Área Útil</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Largura útil:</span>
                                                <span className="font-semibold">{previewLayout.areaUtil.largura.toFixed(1)} mm</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Altura útil:</span>
                                                <span className="font-semibold">{previewLayout.areaUtil.altura.toFixed(1)} mm</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Página:</span>
                                                <span className="font-semibold">{localConfig.tamanhoPagina}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfiguracaoTab;
