import React, { useState } from 'react';

const CortarPDFTab = ({ isDarkMode }) => {
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
            };
            ipcRenderer.on('cortar-pdf-progress', progressHandler);

            const result = await ipcRenderer.invoke('cortar-pdf', {
                fileData: fileDataArray,
                fileName: fileItem.file.name,
                outputDir: outputDir,
                unirEtiquetas: unirEtiquetas
            });

            // Remover listener
            ipcRenderer.removeListener('cortar-pdf-progress', progressHandler);

            if (result.success) {
                addProcessingLog(`✅ ${fileItem.file.name}: Processamento concluído!`);
                // Remover arquivo da lista
                setSelectedFiles(prev => prev.filter(f => f.id !== fileItem.id));
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
                                onClick={() => setSelectedFiles([])}
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
                                        >
                                            Processar
                                        </button>
                                    )}
                                    
                                    {fileItem.status !== 'processing' && (
                                        <button
                                            onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== fileItem.id))}
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
                            setSelectedFiles([]);
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
                        disabled={selectedFiles.length === 0 || isProcessing || !outputDir}
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