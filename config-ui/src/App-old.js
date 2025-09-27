import React, { useState, useEffect } from 'react';
import './App.css';

const PRESET_SIZES = {
    'A4': { width: 210, height: 297 },
    'A3': { width: 297, height: 420 },
    'A5': { width: 148, height: 210 },
    'Letter': { width: 215.9, height: 279.4 },
    'Legal': { width: 215.9, height: 355.6 }
};

const TARGET_PRESETS = {
    'Cartão': { width: 100, height: 145 },
    'Business Card': { width: 85, height: 55 },
    'Postal': { width: 148, height: 105 },
    'Custom': { width: 100, height: 145 }
};

function App() {
    const [config, setConfig] = useState({
        pageSize: {
            target: { width: 100, height: 145, unit: "mm" },
            output: { width: 210, height: 297, unit: "mm", name: "A4" }
        },
        output: {
            type: "both",
            formats: {
                single: { enabled: true, filename: "unico_sequencial.pdf" },
                grid: { enabled: true, filename: "composto_4por_folha.pdf", itemsPerPage: 4, layout: "2x2" }
            }
        },
        printer: { enabled: false, name: "", autoSend: false, copies: 1 },
        cleanup: { deleteNormalized: true, createZip: true, deleteOriginals: true },
        paths: { input: "entrada", output: "saida", normalized: "saida/normalizados" }
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [completedFiles, setCompletedFiles] = useState([]); const handleInputChange = (path, value) => {
        setConfig(prev => {
            const newConfig = { ...prev };
            const keys = path.split('.');
            let current = newConfig;

            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newConfig;
        });
    };

    const handleOutputSizeChange = (sizeName) => {
        const size = PRESET_SIZES[sizeName];
        if (size) {
            setConfig(prev => ({
                ...prev,
                pageSize: {
                    ...prev.pageSize,
                    output: { ...size, unit: "mm", name: sizeName }
                }
            }));
        }
    };

    const handleTargetSizeChange = (sizeName) => {
        const size = TARGET_PRESETS[sizeName];
        if (size) {
            setConfig(prev => ({
                ...prev,
                pageSize: {
                    ...prev.pageSize,
                    target: { ...size, unit: "mm" }
                }
            }));
        }
    };

    const saveConfig = async () => {
        try {
            setIsProcessing(true);
            setProcessingStatus('Salvando configuração...');

            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                const result = await response.json();

                if (result.processing) {
                    setProcessingStatus('Configuração salva! Processando PDFs...');

                    // Monitora o progresso do processamento
                    const checkStatus = async () => {
                        try {
                            const statusResponse = await fetch('/api/status');
                            const status = await statusResponse.json();

                            if (status.completed && status.files.length > 0) {
                                setCompletedFiles(status.files);
                                setProcessingStatus(`Processamento concluído! ${status.files.length} arquivo(s) gerado(s).`);

                                // Fecha a janela após 3 segundos
                                setTimeout(() => {
                                    alert('Processamento concluído com sucesso!\nA janela será fechada.');
                                    window.close();
                                }, 3000);

                                setIsProcessing(false);
                            } else {
                                // Continua monitorando
                                setTimeout(checkStatus, 2000);
                            }
                        } catch (error) {
                            console.error('Erro ao verificar status:', error);
                            setTimeout(checkStatus, 2000);
                        }
                    };

                    // Inicia monitoramento após 2 segundos
                    setTimeout(checkStatus, 2000);
                } else {
                    setProcessingStatus('Configuração salva com sucesso!');
                    setIsProcessing(false);
                }
            } else {
                alert('Erro ao salvar configuração');
                setIsProcessing(false);
            }
        } catch (error) {
            // Fallback para desenvolvimento - salva via download
            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'config.json';
            a.click();
            URL.revokeObjectURL(url);
            alert('Configuração baixada! Substitua o arquivo config.json na pasta do aplicativo.');
            setIsProcessing(false);
        }
    };
    return (
        <div className="App">
            <header className="App-header">
                <h1>Configuração do Processador de PDFs</h1>
            </header>

            <main className="config-form">
                <section className="config-section">
                    <h2>📄 Tamanhos de Página EDSON</h2>

                    <div className="form-group">
                        <label>Tamanho da Entrada (Target):</label>
                        <select
                            value={Object.keys(TARGET_PRESETS).find(key =>
                                TARGET_PRESETS[key].width === config.pageSize.target.width &&
                                TARGET_PRESETS[key].height === config.pageSize.target.height
                            ) || 'Custom'}
                            onChange={(e) => handleTargetSizeChange(e.target.value)}
                        >
                            {Object.keys(TARGET_PRESETS).map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Largura (mm):</label>
                            <input
                                type="number"
                                value={config.pageSize.target.width}
                                onChange={(e) => handleInputChange('pageSize.target.width', parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Altura (mm):</label>
                            <input
                                type="number"
                                value={config.pageSize.target.height}
                                onChange={(e) => handleInputChange('pageSize.target.height', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tamanho da Saída:</label>
                        <select
                            value={config.pageSize.output.name}
                            onChange={(e) => handleOutputSizeChange(e.target.value)}
                        >
                            {Object.keys(PRESET_SIZES).map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                </section>

                <section className="config-section">
                    <h2>📤 Formatos de Saída</h2>

                    <div className="form-group">
                        <label>Tipo de Saída:</label>
                        <select
                            value={config.output.type}
                            onChange={(e) => handleInputChange('output.type', e.target.value)}
                        >
                            <option value="both">Ambos (Único + Grade)</option>
                            <option value="single">Apenas Único</option>
                            <option value="grid">Apenas Grade</option>
                        </select>
                    </div>

                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.output.formats.single.enabled}
                                onChange={(e) => handleInputChange('output.formats.single.enabled', e.target.checked)}
                            />
                            PDF Único Sequencial
                        </label>
                        <input
                            type="text"
                            value={config.output.formats.single.filename}
                            onChange={(e) => handleInputChange('output.formats.single.filename', e.target.value)}
                            placeholder="Nome do arquivo"
                        />
                    </div>

                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.output.formats.grid.enabled}
                                onChange={(e) => handleInputChange('output.formats.grid.enabled', e.target.checked)}
                            />
                            PDF Grade (4 por página)
                        </label>
                        <input
                            type="text"
                            value={config.output.formats.grid.filename}
                            onChange={(e) => handleInputChange('output.formats.grid.filename', e.target.value)}
                            placeholder="Nome do arquivo"
                        />
                    </div>
                </section>

                <section className="config-section">
                    <h2>🖨️ Impressora</h2>

                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.printer.enabled}
                                onChange={(e) => handleInputChange('printer.enabled', e.target.checked)}
                            />
                            Enviar para impressora automaticamente
                        </label>
                    </div>

                    {config.printer.enabled && (
                        <>
                            <div className="form-group">
                                <label>Nome da Impressora:</label>
                                <input
                                    type="text"
                                    value={config.printer.name}
                                    onChange={(e) => handleInputChange('printer.name', e.target.value)}
                                    placeholder="Nome da impressora padrão"
                                />
                            </div>

                            <div className="form-group">
                                <label>Número de Cópias:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={config.printer.copies}
                                    onChange={(e) => handleInputChange('printer.copies', parseInt(e.target.value))}
                                />
                            </div>

                            <div className="checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={config.printer.autoSend}
                                        onChange={(e) => handleInputChange('printer.autoSend', e.target.checked)}
                                    />
                                    Enviar automaticamente (sem confirmação)
                                </label>
                            </div>
                        </>
                    )}
                </section>

                <section className="config-section">
                    <h2>🧹 Limpeza</h2>

                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.cleanup.deleteNormalized}
                                onChange={(e) => handleInputChange('cleanup.deleteNormalized', e.target.checked)}
                            />
                            Deletar arquivos normalizados após processar
                        </label>
                    </div>

                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.cleanup.createZip}
                                onChange={(e) => handleInputChange('cleanup.createZip', e.target.checked)}
                            />
                            Criar ZIP dos arquivos originais
                        </label>
                    </div>

                    <div className="checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.cleanup.deleteOriginals}
                                onChange={(e) => handleInputChange('cleanup.deleteOriginals', e.target.checked)}
                            />
                            Deletar arquivos originais após zipar
                        </label>
                    </div>
                </section>

                <section className="config-section">
                    <h2>📁 Caminhos</h2>

                    <div className="form-group">
                        <label>Pasta de Entrada:</label>
                        <input
                            type="text"
                            value={config.paths.input}
                            onChange={(e) => handleInputChange('paths.input', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Pasta de Saída:</label>
                        <input
                            type="text"
                            value={config.paths.output}
                            onChange={(e) => handleInputChange('paths.output', e.target.value)}
                        />
                    </div>
                </section>

                <div className="save-section">
                    {isProcessing && (
                        <div className="processing-status">
                            <div className="spinner"></div>
                            <p>{processingStatus}</p>
                            {completedFiles.length > 0 && (
                                <div className="completed-files">
                                    <h4>Arquivos gerados:</h4>
                                    <ul>
                                        {completedFiles.map(file => (
                                            <li key={file}>✅ {file}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        className="save-button"
                        onClick={saveConfig}
                        disabled={isProcessing}
                    >
                        {isProcessing ? '⏳ Processando...' : '💾 Salvar e Processar'}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default App;
