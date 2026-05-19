import React, { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_CUT_CONFIG = {
    cutTop: 25,
    cutBottom: 140,
    cutLeft: 0,
    cutRight: 150,
    pageWidth: 969.61,
    pageHeight: 841.89,
    labels: [
        { x: 25, y: 0, w: 264.16, h: 676.89 },
        { x: 289.16, y: 0, w: 266.29, h: 676.89 },
        { x: 555.45, y: 0, w: 264.16, h: 676.89 },
    ],
};

const A4_2X2_CUT_CONFIG = {
    cutTop: 0,
    cutBottom: 0,
    cutLeft: 0,
    cutRight: 0,
    pageWidth: 595.28,
    pageHeight: 841.89,
    labels: [
        { x: 0, y: 0, w: 297.64, h: 420.95 },
        { x: 297.64, y: 0, w: 297.64, h: 420.95 },
        { x: 0, y: 420.95, w: 297.64, h: 420.94 },
        { x: 297.64, y: 420.95, w: 297.64, h: 420.94 },
    ],
};

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const CUT_CONFIG_STORAGE_KEY = 'pdfCommander.cortarPdf.cutConfig';

const loadSavedCutConfig = () => {
    try {
        const savedConfig = localStorage.getItem(CUT_CONFIG_STORAGE_KEY);
        return savedConfig ? JSON.parse(savedConfig) : DEFAULT_CUT_CONFIG;
    } catch (error) {
        console.warn('Não foi possível carregar o modelo de corte salvo:', error);
        return DEFAULT_CUT_CONFIG;
    }
};

const CortarPDFTab = ({ isDarkMode }) => {
    const fileInputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [outputDir, setOutputDir] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [unirEtiquetas, setUnirEtiquetas] = useState(false);
    const [processingLogs, setProcessingLogs] = useState([]);
    const [processMode, setProcessMode] = useState('single'); // 'single' ou 'all'
    const [currentProcessingFile, setCurrentProcessingFile] = useState(null);
    const [showErrorConfirm, setShowErrorConfirm] = useState(false);
    const [errorFileName, setErrorFileName] = useState('');
    const [pendingFilesQueue, setPendingFilesQueue] = useState([]); // eslint-disable-line no-unused-vars
    const [cutConfig, setCutConfig] = useState(loadSavedCutConfig);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
    const [pdfInfo, setPdfInfo] = useState(null);
    const firstPreviewFile = selectedFiles[0]?.file || null;

    const preview = useMemo(() => {
        const pageWidth = toNumber(cutConfig.pageWidth, DEFAULT_CUT_CONFIG.pageWidth);
        const pageHeight = toNumber(cutConfig.pageHeight, DEFAULT_CUT_CONFIG.pageHeight);
        const cutTop = toNumber(cutConfig.cutTop, DEFAULT_CUT_CONFIG.cutTop);
        const cutBottom = toNumber(cutConfig.cutBottom, DEFAULT_CUT_CONFIG.cutBottom);
        const cutLeft = toNumber(cutConfig.cutLeft, DEFAULT_CUT_CONFIG.cutLeft);
        const cutRight = toNumber(cutConfig.cutRight, DEFAULT_CUT_CONFIG.cutRight);
        const usableWidth = Math.max(0, pageWidth - cutLeft - cutRight);
        const usableHeight = Math.max(0, pageHeight - cutTop - cutBottom);

        return {
            pageWidth,
            pageHeight,
            cutTop,
            cutBottom,
            cutLeft,
            cutRight,
            usableWidth,
            usableHeight,
            isValid: usableWidth > 0 && usableHeight > 0 && cutConfig.labels.every(label => {
                const x = toNumber(label.x);
                const y = toNumber(label.y);
                const w = toNumber(label.w);
                const h = toNumber(label.h, usableHeight);
                return x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= usableWidth && y + h <= usableHeight;
            }),
        };
    }, [cutConfig]);

    const updateCutConfig = (field, value) => {
        setCutConfig(prev => ({ ...prev, [field]: value }));
    };

    const updateLabelConfig = (index, field, value) => {
        setCutConfig(prev => ({
            ...prev,
            labels: prev.labels.map((label, labelIndex) => (
                labelIndex === index ? { ...label, [field]: value } : label
            )),
        }));
    };

    const resetCutConfig = () => {
        setCutConfig(DEFAULT_CUT_CONFIG);
    };

    const saveCutConfigModel = () => {
        try {
            localStorage.setItem(CUT_CONFIG_STORAGE_KEY, JSON.stringify(cutConfig));
            addProcessingLog('Modelo de corte salvo para os próximos usos.');
        } catch (error) {
            alert('Não foi possível salvar o modelo: ' + error.message);
        }
    };

    const loadCutConfigModel = () => {
        setCutConfig(loadSavedCutConfig());
        addProcessingLog('Modelo de corte salvo carregado.');
    };

    const applyA4Preset = () => {
        const pageWidth = preview.pageWidth || A4_2X2_CUT_CONFIG.pageWidth;
        const pageHeight = preview.pageHeight || A4_2X2_CUT_CONFIG.pageHeight;
        const halfWidth = Number((pageWidth / 2).toFixed(2));
        const halfHeight = Number((pageHeight / 2).toFixed(2));

        setCutConfig({
            cutTop: 0,
            cutBottom: 0,
            cutLeft: 0,
            cutRight: 0,
            pageWidth,
            pageHeight,
            labels: [
                { x: 0, y: 0, w: halfWidth, h: halfHeight },
                { x: halfWidth, y: 0, w: Number((pageWidth - halfWidth).toFixed(2)), h: halfHeight },
                { x: 0, y: halfHeight, w: halfWidth, h: Number((pageHeight - halfHeight).toFixed(2)) },
                { x: halfWidth, y: halfHeight, w: Number((pageWidth - halfWidth).toFixed(2)), h: Number((pageHeight - halfHeight).toFixed(2)) },
            ],
        });
    };

    const getProcessingCutConfig = () => ({
        pageWidth: preview.pageWidth,
        pageHeight: preview.pageHeight,
        cutTop: preview.cutTop,
        cutBottom: preview.cutBottom,
        cutLeft: preview.cutLeft,
        cutRight: preview.cutRight,
        labels: cutConfig.labels.map(label => ({
            x: toNumber(label.x),
            y: toNumber(label.y),
            w: toNumber(label.w),
            h: toNumber(label.h, preview.usableHeight),
        })),
    });

    useEffect(() => {
        if (!firstPreviewFile) {
            setPdfPreviewUrl('');
            setPdfInfo(null);
            return undefined;
        }

        const firstFile = firstPreviewFile;
        const objectUrl = URL.createObjectURL(firstFile);
        setPdfPreviewUrl(objectUrl);

        let isActive = true;
        const loadPdfInfo = async () => {
            const ipcRenderer = getIpcRenderer();
            if (!ipcRenderer) return;

            try {
                const arrayBuffer = await firstFile.arrayBuffer();
                const result = await ipcRenderer.invoke('get-pdf-info', {
                    fileData: Array.from(new Uint8Array(arrayBuffer)),
                    fileName: firstFile.name,
                });

                if (isActive && result.success) {
                    setPdfInfo(result);
                    setCutConfig(prev => ({
                        ...prev,
                        pageWidth: Number(result.firstPage.width.toFixed(2)),
                        pageHeight: Number(result.firstPage.height.toFixed(2)),
                    }));
                }
            } catch (error) {
                if (isActive) {
                    const message = error.message?.includes("No handler registered for 'get-pdf-info'")
                        ? 'Reinicie o aplicativo para ativar a leitura automática do tamanho do PDF.'
                        : error.message;
                    setPdfInfo({ success: false, error: message });
                }
            }
        };

        loadPdfInfo();

        return () => {
            isActive = false;
            URL.revokeObjectURL(objectUrl);
        };
    }, [firstPreviewFile]);

    const getIpcRenderer = () => {
        try {
            return window.require('electron').ipcRenderer;
        } catch (error) {
            console.error('Erro ao obter ipcRenderer:', error);
            return null;
        }
    };

    const addProcessingLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setProcessingLogs(prev => [...prev, { message, type, timestamp }]);
    };

    const resetFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const clearSelectedFiles = () => {
        setSelectedFiles([]);
        setPdfPreviewUrl('');
        setPdfInfo(null);
        resetFileInput();
    };

    const selectOutputDir = async () => {
        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) {
            alert('Funcionalidade disponível apenas no Electron');
            return;
        }

        try {
            const folder = await ipcRenderer.invoke('select-folder', 'Selecionar Pasta de Saída');
            if (folder) {
                setOutputDir(folder);
            }
        } catch (error) {
            alert('Erro ao selecionar pasta: ' + error.message);
        }
    };

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        const pdfFiles = files.filter(file => 
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );
        
        if (pdfFiles.length > 0) {
            const newFiles = pdfFiles.map(file => ({
                file,
                id: Date.now() + Math.random(),
                status: 'pending', // 'pending', 'processing', 'completed', 'error'
                progress: 0
            }));
            setSelectedFiles(prev => [...prev, ...newFiles]);
            setProcessingStatus('');
            setProcessingLogs([]);
        }

        event.target.value = '';
    };

    const processSingleFile = async (fileItem) => {
        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) return false;

        // Atualizar status do arquivo
        setSelectedFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, status: 'processing' } : f
        ));
        setCurrentProcessingFile(fileItem.id);

        addProcessingLog(`Iniciando processamento de: ${fileItem.file.name}`);

        try {
            // Ler o conteúdo do arquivo como ArrayBuffer
            const arrayBuffer = await fileItem.file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const fileDataArray = Array.from(uint8Array);

            // Registrar listener para progresso específico deste arquivo
            const progressHandler = (event, progressData) => {
                setSelectedFiles(prev => prev.map(f => 
                    f.id === fileItem.id ? { ...f, progress: progressData.percent } : f
                ));
                setProcessingStatus(progressData.status);
                addProcessingLog(`${fileItem.file.name}: ${progressData.status}`);
                if (progressData.detail) {
                    addProcessingLog(`${fileItem.file.name}: ${progressData.detail}`);
                }
            };
            ipcRenderer.on('cortar-pdf-progress', progressHandler);

            const result = await ipcRenderer.invoke('cortar-pdf', {
                fileData: fileDataArray,
                fileName: fileItem.file.name,
                outputDir: outputDir,
                unirEtiquetas: unirEtiquetas,
                cutConfig: getProcessingCutConfig()
            });

            // Remover listener
            ipcRenderer.removeListener('cortar-pdf-progress', progressHandler);

            if (result.success) {
                addProcessingLog(`✅ ${fileItem.file.name}: Processamento concluído!`);
                // Remover arquivo da lista
                setSelectedFiles(prev => prev.filter(f => f.id !== fileItem.id));
                resetFileInput();
                return true;
            } else {
                addProcessingLog(`❌ ${fileItem.file.name}: ${result.error}`, 'error');
                setSelectedFiles(prev => prev.map(f => 
                    f.id === fileItem.id ? { ...f, status: 'error' } : f
                ));
                return false;
            }
        } catch (error) {
            addProcessingLog(`❌ ${fileItem.file.name}: ${error.message}`, 'error');
            setSelectedFiles(prev => prev.map(f => 
                f.id === fileItem.id ? { ...f, status: 'error' } : f
            ));
            return false;
        } finally {
            setCurrentProcessingFile(null);
        }
    };

    const processQueue = async () => {
        if (selectedFiles.length === 0) {
            alert('Por favor, selecione pelo menos um arquivo PDF.');
            return;
        }

        if (!outputDir) {
            alert('Por favor, selecione um diretório de saída.');
            return;
        }

        setIsProcessing(true);
        setProcessingStatus('Iniciando processamento da fila...');

        try {
            if (processMode === 'single') {
                // Processar apenas o primeiro arquivo da fila
                const fileToProcess = selectedFiles.find(f => f.status === 'pending');
                if (fileToProcess) {
                    await processSingleFile(fileToProcess);
                }
            } else {
                // Processar todos os arquivos sequencialmente
                await processAllFiles();
            }

            setProcessingStatus('Fila de processamento concluída!');
            addProcessingLog('🎉 Fila de processamento concluída!');
        } catch (error) {
            addProcessingLog(`❌ Erro geral: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const processAllFiles = async () => {
        const pendingFiles = selectedFiles.filter(f => f.status === 'pending');
        setPendingFilesQueue(pendingFiles);

        for (let i = 0; i < pendingFiles.length; i++) {
            const fileItem = pendingFiles[i];
            const success = await processSingleFile(fileItem);

            if (!success) {
                // Se falhou, mostrar modal de confirmação
                setErrorFileName(fileItem.file.name);
                setShowErrorConfirm(true);

                // Aguardar resposta do usuário
                return new Promise((resolve) => {
                    const handleContinue = () => {
                        setShowErrorConfirm(false);
                        setErrorFileName('');
                        // Continuar processando os próximos arquivos
                        processRemainingFiles(i + 1, pendingFiles);
                        resolve();
                    };

                    const handleStop = () => {
                        setShowErrorConfirm(false);
                        setErrorFileName('');
                        setPendingFilesQueue([]);
                        resolve();
                    };

                    // Armazenar as funções para serem chamadas pelos botões do modal
                    window.errorConfirmContinue = handleContinue;
                    window.errorConfirmStop = handleStop;
                });
            }
        }

        setPendingFilesQueue([]);
    };

    const processRemainingFiles = async (startIndex, allFiles) => {
        for (let i = startIndex; i < allFiles.length; i++) {
            const fileItem = allFiles[i];
            const success = await processSingleFile(fileItem);
            if (!success) {
                setErrorFileName(fileItem.file.name);
                setShowErrorConfirm(true);
                break; // Parar novamente se houver outro erro
            }
        }
        setPendingFilesQueue([]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        const pdfFiles = files.filter(file => 
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );

        if (pdfFiles.length > 0) {
            const newFiles = pdfFiles.map(file => ({
                file,
                id: Date.now() + Math.random(),
                status: 'pending',
                progress: 0
            }));
            setSelectedFiles(prev => [...prev, ...newFiles]);
            setProcessingStatus('');
            setProcessingLogs([]);
            resetFileInput();
        } else {
            alert('Por favor, selecione apenas arquivos PDF.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="card">
                <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ✂️ Cortar PDF em Etiquetas
                </h2>

                {/* Área de Upload */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
                        isDarkMode
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className="space-y-4">
                        <div className="text-6xl">📄</div>
                        <div>
                            <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Arraste e solte um arquivo PDF aqui
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                ou clique para selecionar
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="pdf-file-input"
                        />
                        <label
                            htmlFor="pdf-file-input"
                            className={`inline-block px-6 py-3 rounded-lg cursor-pointer transition-colors ${
                                isDarkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        >
                            Selecionar Arquivos
                        </label>
                    </div>
                </div>

                {/* Arquivos Selecionados */}
                {selectedFiles.length > 0 && (
                    <div className={`p-4 rounded-lg border mb-6 ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Arquivos Selecionados ({selectedFiles.length})
                            </h3>
                            <button
                                onClick={clearSelectedFiles}
                                className="text-red-500 hover:text-red-700 text-sm"
                                disabled={isProcessing}
                            >
                                🗑️ Limpar Todos
                            </button>
                        </div>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedFiles.map((fileItem) => (
                                <div 
                                    key={fileItem.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                        fileItem.status === 'processing' 
                                            ? 'bg-blue-100 border-blue-300' 
                                            : fileItem.status === 'error'
                                            ? 'bg-red-100 border-red-300'
                                            : fileItem.status === 'completed'
                                            ? 'bg-green-100 border-green-300'
                                            : isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                                    } ${currentProcessingFile === fileItem.id ? 'ring-2 ring-blue-500' : ''}`}
                                >
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className="text-2xl">
                                            {fileItem.status === 'processing' ? '⏳' : 
                                             fileItem.status === 'error' ? '❌' : 
                                             fileItem.status === 'completed' ? '✅' : '📄'}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {fileItem.file.name}
                                            </p>
                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                            {fileItem.status === 'processing' && (
                                                <div className="mt-1">
                                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                                        <div 
                                                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                                            style={{ width: `${fileItem.progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {fileItem.status === 'pending' && !isProcessing && (
                                        <button
                                            onClick={() => processSingleFile(fileItem)}
                                            className="btn-secondary text-xs px-3 py-1"
                                            disabled={!preview.isValid}
                                        >
                                            Processar
                                        </button>
                                    )}
                                    
                                    {fileItem.status !== 'processing' && (
                                        <button
                                            onClick={() => {
                                                setSelectedFiles(prev => prev.filter(f => f.id !== fileItem.id));
                                                resetFileInput();
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm ml-2"
                                            disabled={isProcessing}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Configurações */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pasta de Destino
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={outputDir}
                                readOnly
                                placeholder="Clique em 'Selecionar Pasta' para escolher..."
                                className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900'
                                }`}
                            />
                            <button
                                onClick={selectOutputDir}
                                className="btn-secondary"
                            >
                                📁
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Modo de Processamento
                        </label>
                        <div className="flex items-center space-x-4 mt-3">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="processMode"
                                    value="single"
                                    checked={processMode === 'single'}
                                    onChange={(e) => setProcessMode(e.target.value)}
                                    className="mr-2"
                                />
                                <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Processar um por vez
                                </span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="processMode"
                                    value="all"
                                    checked={processMode === 'all'}
                                    onChange={(e) => setProcessMode(e.target.value)}
                                    className="mr-2"
                                />
                                <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Processar todos
                                </span>
                            </label>
                        </div>
                        <div className="flex items-center space-x-3 mt-3">
                            <input
                                type="checkbox"
                                id="unir-etiquetas"
                                checked={unirEtiquetas}
                                onChange={(e) => setUnirEtiquetas(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label
                                htmlFor="unir-etiquetas"
                                className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                Unir todas as etiquetas em um único PDF
                            </label>
                        </div>
                    </div>
                </div>

                {/* Configuração de Corte */}
                <div className={`p-4 rounded-lg border mb-6 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Configuração do corte
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Valores em pontos (pt). O padrão abaixo é o mesmo que estava fixo no código.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                onClick={saveCutConfigModel}
                                className="btn-primary text-sm"
                                disabled={isProcessing}
                            >
                                Salvar modelo
                            </button>
                            <button
                                type="button"
                                onClick={loadCutConfigModel}
                                className="btn-secondary text-sm"
                                disabled={isProcessing}
                            >
                                Carregar modelo
                            </button>
                            <button
                                type="button"
                                onClick={resetCutConfig}
                                className="btn-secondary text-sm"
                                disabled={isProcessing}
                            >
                                Restaurar padrão
                            </button>
                            <button
                                type="button"
                                onClick={applyA4Preset}
                                className="btn-secondary text-sm"
                                disabled={isProcessing}
                            >
                                A4 2x2
                            </button>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    ['cutTop', 'Superior'],
                                    ['cutBottom', 'Inferior'],
                                    ['cutLeft', 'Esquerda'],
                                    ['cutRight', 'Direita'],
                                ].map(([field, label]) => (
                                    <label key={field} className="block">
                                        <span className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {label}
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={cutConfig[field]}
                                            onChange={(event) => updateCutConfig(field, event.target.value)}
                                            disabled={isProcessing}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                                            }`}
                                        />
                                    </label>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Largura da página para prévia
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={cutConfig.pageWidth}
                                        onChange={(event) => updateCutConfig('pageWidth', event.target.value)}
                                        disabled={isProcessing}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                                        }`}
                                    />
                                </label>
                                <label className="block">
                                    <span className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Altura da página para prévia
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={cutConfig.pageHeight}
                                        onChange={(event) => updateCutConfig('pageHeight', event.target.value)}
                                        disabled={isProcessing}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                                        }`}
                                    />
                                </label>
                            </div>

                            <div className="space-y-2">
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    Etiquetas dentro da área útil
                                </div>
                                {cutConfig.labels.map((label, index) => (
                                    <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <label className="block">
                                            <span className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Etiqueta {index + 1} - X
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={label.x}
                                                onChange={(event) => updateLabelConfig(index, 'x', event.target.value)}
                                                disabled={isProcessing}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                                                }`}
                                            />
                                        </label>
                                        <label className="block">
                                            <span className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Etiqueta {index + 1} - Y
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={label.y}
                                                onChange={(event) => updateLabelConfig(index, 'y', event.target.value)}
                                                disabled={isProcessing}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                                                }`}
                                            />
                                        </label>
                                        <label className="block">
                                            <span className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Etiqueta {index + 1} - Largura
                                            </span>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={label.w}
                                                onChange={(event) => updateLabelConfig(index, 'w', event.target.value)}
                                                disabled={isProcessing}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                                                }`}
                                            />
                                        </label>
                                        <label className="block">
                                            <span className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Etiqueta {index + 1} - Altura
                                            </span>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={label.h}
                                                onChange={(event) => updateLabelConfig(index, 'h', event.target.value)}
                                                disabled={isProcessing}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                                                }`}
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            {pdfPreviewUrl && (
                                <div className={`rounded-lg border p-3 mb-4 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className={`flex items-center justify-between gap-3 mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <span>PDF selecionado</span>
                                        {pdfInfo?.success && (
                                            <span>
                                                Página 1: {pdfInfo.firstPage.width.toFixed(2)} x {pdfInfo.firstPage.height.toFixed(2)} pt
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-80 overflow-hidden rounded border border-gray-300 bg-white">
                                        <object
                                            data={`${pdfPreviewUrl}#page=1&zoom=page-fit`}
                                            type="application/pdf"
                                            className="w-full h-full"
                                            aria-label="Primeira página do PDF selecionado"
                                        >
                                            <div className="p-4 text-sm text-gray-700">
                                                Não foi possível exibir o PDF embutido nesta tela.
                                            </div>
                                        </object>
                                    </div>
                                    {pdfInfo && !pdfInfo.success && (
                                        <div className="mt-2 text-sm text-red-500">
                                            Não foi possível ler o tamanho da primeira página: {pdfInfo.error}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={`rounded-lg border p-3 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <div className={`mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Mapa do corte aplicado
                                </div>
                                <div className="aspect-[1.35/1] w-full">
                                    <svg
                                        viewBox={`0 0 ${preview.pageWidth || 1} ${preview.pageHeight || 1}`}
                                        className="w-full h-full"
                                        role="img"
                                        aria-label="Prévia do corte"
                                    >
                                        <rect x="0" y="0" width={preview.pageWidth} height={preview.pageHeight} fill={isDarkMode ? '#111827' : '#ffffff'} stroke="#94a3b8" strokeWidth="3" />
                                        <rect
                                            x={preview.cutLeft}
                                            y={preview.cutTop}
                                            width={preview.usableWidth}
                                            height={preview.usableHeight}
                                            fill={isDarkMode ? '#1f2937' : '#dbeafe'}
                                            stroke="#2563eb"
                                            strokeWidth="3"
                                        />
                                        {cutConfig.labels.map((label, index) => {
                                            const x = preview.cutLeft + toNumber(label.x);
                                            const y = preview.cutTop + toNumber(label.y);
                                            const width = toNumber(label.w);
                                            const height = toNumber(label.h, preview.usableHeight);
                                            const isLabelValid = x >= preview.cutLeft && y >= preview.cutTop && width > 0 && height > 0 && x + width <= preview.cutLeft + preview.usableWidth && y + height <= preview.cutTop + preview.usableHeight;
                                            return (
                                                <g key={index}>
                                                    <rect
                                                        x={x}
                                                        y={y}
                                                        width={Math.max(0, width)}
                                                        height={Math.max(0, height)}
                                                        fill={isLabelValid ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.45)'}
                                                        stroke={isLabelValid ? '#16a34a' : '#dc2626'}
                                                        strokeWidth="3"
                                                    />
                                                    <text
                                                        x={x + Math.max(16, width / 2)}
                                                        y={y + 36}
                                                        textAnchor="middle"
                                                        fontSize="24"
                                                        fill={isDarkMode ? '#ffffff' : '#111827'}
                                                    >
                                                        {index + 1}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>
                                <div className={`mt-3 text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <div>Área útil: {preview.usableWidth.toFixed(2)} x {preview.usableHeight.toFixed(2)} pt</div>
                                    <div>Saída: {cutConfig.labels.length} etiqueta(s) por página</div>
                                    {!preview.isValid && (
                                        <div className="text-red-500 font-medium">
                                            Ajuste os valores: há corte ou etiqueta fora da área útil.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumo dos arquivos que serão gerados */}
                {selectedFiles.length > 0 && (
                    <div className={`p-4 rounded-lg mb-6 ${
                        isDarkMode ? 'bg-gray-800' : 'bg-blue-50'
                    }`}>
                        <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                            📝 Arquivos que serão gerados:
                        </h4>
                        <div className={`text-sm space-y-2 ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                            <div>
                                <strong>Modo de processamento:</strong> {processMode === 'single' ? 'Um arquivo por vez' : 'Todos os arquivos sequencialmente'}
                            </div>
                            <div>
                                <strong>Formato de saída:</strong> {unirEtiquetas ? 'PDF único por arquivo processado' : 'Etiquetas individuais por arquivo processado'}
                            </div>
                            <div className="mt-3">
                                <strong>Arquivos de saída esperados:</strong>
                                <div className="ml-4 mt-2 space-y-1">
                                    {selectedFiles.map((fileItem, index) => {
                                        const baseFileName = fileItem.file.name.replace(/\.pdf$/i, '');
                                        return (
                                            <div key={fileItem.id} className="flex items-center space-x-2">
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {index + 1}
                                                </span>
                                                <span>
                                                    {unirEtiquetas ? (
                                                        `${baseFileName}_etiquetas.pdf`
                                                    ) : (
                                                        `etiqueta_1.pdf, etiqueta_2.pdf, ... (de ${fileItem.file.name})`
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botões de ação */}
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => {
                            clearSelectedFiles();
                            setOutputDir('');
                            setProcessingLogs([]);
                            setProcessingStatus('');
                        }}
                        className="btn-secondary"
                        disabled={isProcessing}
                    >
                        🔄 Limpar Tudo
                    </button>
                    <button
                        onClick={processQueue}
                        className="btn-primary"
                        disabled={selectedFiles.length === 0 || isProcessing || !outputDir || !preview.isValid}
                    >
                        {isProcessing ? '⏳ Processando...' : 
                         processMode === 'single' ? '✂️ Processar Próximo' : '✂️ Processar Todos'}
                    </button>
                </div>
            </div>

            {/* Painel de Progresso */}
            {(isProcessing || processingLogs.length > 0) && (
                <div className="card">
                    <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        📊 Progresso do Processamento
                    </h3>

                    <div className={`bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto ${
                        isDarkMode ? 'bg-gray-800' : ''
                    }`}>
                        {processingLogs.length === 0 ? (
                            <p className={`text-gray-500 text-sm ${isDarkMode ? 'text-gray-400' : ''}`}>
                                Aguardando logs...
                            </p>
                        ) : (
                            processingLogs.map((log, index) => (
                                <div key={index} className={`text-sm mb-1 ${
                                    log.type === 'error' ? 'text-red-600' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                                }`}>
                                    <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                                </div>
                            ))
                        )}
                    </div>

                    {isProcessing && (
                        <div className="mt-4">
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {processingStatus}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Confirmação de Erro */}
            {showErrorConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
                        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}>
                        <div className="flex items-center mb-4">
                            <div className="text-2xl mr-3">⚠️</div>
                            <h3 className="text-lg font-semibold">Erro no Processamento</h3>
                        </div>

                        <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Ocorreu um erro ao processar o arquivo <strong>{errorFileName}</strong>.
                            Deseja continuar processando os próximos arquivos da fila?
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => window.errorConfirmStop && window.errorConfirmStop()}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    isDarkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                Parar Processamento
                            </button>
                            <button
                                onClick={() => window.errorConfirmContinue && window.errorConfirmContinue()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CortarPDFTab;
