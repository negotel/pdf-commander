export const ConfiguracaoEtiqueta = ({ handleChange, localConfig, handleSave, resetToDefault }) => {
    return (
        <div className="space-y-6 col-span-12 lg:col-span-4">
            {/* Configurações */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    ⚙️ Configuração de Layout das Etiquetas
                </h3>

                <div className="space-y-6">
                    {/* Configurações da Página */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">📄 Configurações da Página</h4>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tamanho da Página
                            </label>
                            <select
                                value={localConfig.tamanhoPagina}
                                onChange={(e) => handleChange('tamanhoPagina', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="A4">A4 (210 × 297 mm)</option>
                                <option value="A5">A5 (148 × 210 mm)</option>
                                <option value="Carta">Carta (216 × 279 mm)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Margem X (mm)
                                </label>
                                <input
                                    type="number"
                                    value={localConfig.margemX}
                                    onChange={(e) => handleChange('margemX', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    min="0"
                                    step="0.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Margem Y (mm)
                                </label>
                                <input
                                    type="number"
                                    value={localConfig.margemY}
                                    onChange={(e) => handleChange('margemY', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    min="0"
                                    step="0.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Configurações das Etiquetas */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">🏷️ Configurações das Etiquetas</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Largura (mm)
                                </label>
                                <input
                                    type="number"
                                    value={localConfig.larguraEtiqueta}
                                    onChange={(e) => handleChange('larguraEtiqueta', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    min="10"
                                    step="0.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Altura (mm)
                                </label>
                                <input
                                    type="number"
                                    value={localConfig.alturaEtiqueta}
                                    onChange={(e) => handleChange('alturaEtiqueta', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    min="10"
                                    step="0.5"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Espaço Horizontal (mm)
                                </label>
                                <input
                                    type="number"
                                    value={localConfig.espacoHorizontal}
                                    onChange={(e) => handleChange('espacoHorizontal', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    min="0"
                                    step="0.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Espaço Vertical (mm)
                                </label>
                                <input
                                    type="number"
                                    value={localConfig.espacoVertical}
                                    onChange={(e) => handleChange('espacoVertical', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    min="0"
                                    step="0.5"
                                />
                            </div>
                        </div>

                        {/* Configuração do Tipo de Código */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📱 Tipo de Código
                            </label>
                            <select
                                value={localConfig.tipoCodigo || 'code128'}
                                onChange={(e) => handleChange('tipoCodigo', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="code128">📊 Código de Barras (Code 128)</option>
                                <option value="qrcode">📱 QR Code</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Code 128: Ideal para códigos numéricos • QR Code: Suporta mais informações
                            </p>
                        </div>

                        {/* Configurações de Fonte */}
                        <div className="space-y-4 mt-6">
                            <h4 className="font-medium text-gray-900">🔤 Configurações de Fonte</h4>

                            {/* Fonte da Descrição */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tam. Descrição (px)
                                    </label>
                                    <input
                                        type="number"
                                        value={localConfig.tamanhoFonteDescricao || 12}
                                        onChange={(e) => handleChange('tamanhoFonteDescricao', parseInt(e.target.value) || 12)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        min="6"
                                        max="30"
                                        step="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Peso Fonte
                                    </label>
                                    <select
                                        value={localConfig.pesoFonteDescricao || 'normal'}
                                        onChange={(e) => handleChange('pesoFonteDescricao', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="bold">Negrito</option>
                                        <option value="lighter">Mais Fino</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fonte do Código */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tam. Fonte Cód. (px)
                                    </label>
                                    <input
                                        type="number"
                                        value={localConfig.tamanhoFonteCodigo || 10}
                                        onChange={(e) => handleChange('tamanhoFonteCodigo', parseInt(e.target.value) || 10)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        min="4"
                                        max="24"
                                        step="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Peso Fonte
                                    </label>
                                    <select
                                        value={localConfig.pesoFonteCodigo || 'bold'}
                                        onChange={(e) => handleChange('pesoFonteCodigo', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="bold">Negrito</option>
                                        <option value="lighter">Mais Fino</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botões */}
                <div className="flex justify-between mt-6 gap-3">
                    <button
                        onClick={resetToDefault}
                        className="btn-secondary"
                    >
                        🔄 Restaurar Padrão
                    </button>

                    <button
                        onClick={handleSave}
                        className="btn-primary"
                    >
                        💾 Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    )
}