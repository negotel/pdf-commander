import React, { useState, useEffect } from 'react';

const UnirPDFs = ({ config, setConfig, isDarkMode }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState([]);
  const [inputFolder, setInputFolder] = useState('entrada');
  const [outputFolder, setOutputFolder] = useState('saida');
  const [fileName, setFileName] = useState('documento_unido.pdf');
  const [createBackup, setCreateBackup] = useState(true);
  const [optimize, setOptimize] = useState(false);
  const [inputStatus, setInputStatus] = useState('');
  const [processingLogs, setProcessingLogs] = useState([]);

  // Verificar se está no Electron
  const isElectron = () => {
    return window && window.require;
  };

  const getIpcRenderer = () => {
    if (isElectron()) {
      return window.require('electron').ipcRenderer;
    }
    return null;
  };

  useEffect(() => {
    checkInputFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputFolder]);

  useEffect(() => {
    const ipcRenderer = getIpcRenderer();
    if (!ipcRenderer) return;

    // Setup dos listeners IPC para logs de processamento
    const handleProcessingLog = (event, message) => {
      addProcessingLog(message, 'info');
    };

    const handleProcessingError = (event, message) => {
      addProcessingLog(message, 'error');
    };

    ipcRenderer.on('processing-log', handleProcessingLog);
    ipcRenderer.on('processing-error', handleProcessingError);

    return () => {
      ipcRenderer.removeListener('processing-log', handleProcessingLog);
      ipcRenderer.removeListener('processing-error', handleProcessingError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addProcessingLog = (message, type = 'info') => {
    setProcessingLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const checkInputFiles = async () => {
    const ipcRenderer = getIpcRenderer();
    if (!ipcRenderer) {
      setInputStatus('Disponível apenas no Electron');
      return;
    }

    try {
      const result = await ipcRenderer.invoke('check-files', inputFolder);
      if (result.exists && result.files.length > 0) {
        setInputStatus(`${result.files.length} arquivo(s) PDF encontrado(s)`);
        setFiles(result.files);
      } else {
        setInputStatus('Nenhum PDF encontrado');
        setFiles([]);
      }
    } catch (error) {
      setInputStatus('Erro ao verificar arquivos');
      console.error('Erro ao verificar arquivos:', error);
    }
  };

  const selectInputFolder = async () => {
    const ipcRenderer = getIpcRenderer();
    if (!ipcRenderer) {
      alert('Funcionalidade disponível apenas no Electron');
      return;
    }

    try {
      const folder = await ipcRenderer.invoke('select-folder', 'Selecionar Pasta de Entrada');
      if (folder) {
        setInputFolder(folder);
      }
    } catch (error) {
      alert('Erro ao selecionar pasta: ' + error.message);
    }
  };

  const selectOutputFolder = async () => {
    const ipcRenderer = getIpcRenderer();
    if (!ipcRenderer) {
      alert('Funcionalidade disponível apenas no Electron');
      return;
    }

    try {
      const folder = await ipcRenderer.invoke('select-folder', 'Selecionar Pasta de Saída');
      if (folder) {
        setOutputFolder(folder);
      }
    } catch (error) {
      alert('Erro ao selecionar pasta: ' + error.message);
    }
  };

  const processFiles = async () => {
    const ipcRenderer = getIpcRenderer();
    if (!ipcRenderer) {
      alert('Funcionalidade de processamento disponível apenas no Electron');
      return;
    }

    if (isProcessing || files.length === 0) return;

    try {
      setIsProcessing(true);
      setProcessingLogs([]);
      addProcessingLog('Iniciando processamento...');

      // Configuração para o processamento
      const processConfig = {
        pageSize: {
          target: {
            width: 100,
            height: 145,
            unit: "mm"
          },
          output: {
            width: 210,
            height: 297,
            unit: "mm",
            name: "A4"
          }
        },
        output: {
          type: "both",
          formats: {
            single: { 
              enabled: true, 
              filename: fileName 
            },
            grid: { 
              enabled: true, 
              filename: "composto_4por_folha.pdf", 
              itemsPerPage: 4, 
              layout: "2x2" 
            }
          }
        },
        printer: { 
          enabled: false, 
          name: "", 
          autoSend: false, 
          copies: 1 
        },
        cleanup: { 
          deleteNormalized: true, 
          createBackup: createBackup, 
          deleteOriginals: false 
        },
        paths: { 
          input: inputFolder, 
          output: outputFolder, 
          normalized: `${outputFolder}/normalizados` 
        }
      };

      const result = await ipcRenderer.invoke('process-pdfs', processConfig);
      
      if (result.success) {
        addProcessingLog('✅ Processamento concluído com sucesso!');
        alert(`PDFs unidos com sucesso!\nArquivos gerados na pasta: ${outputFolder}`);
      } else {
        addProcessingLog(`❌ Erro: ${result.error}`, 'error');
        alert('Erro no processamento: ' + result.error);
      }
    } catch (error) {
      addProcessingLog(`❌ Erro: ${error.message}`, 'error');
      alert('Erro no processamento: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          📄 Unir Arquivos PDF
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pasta de Entrada
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputFolder}
                onChange={(e) => setInputFolder(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="entrada"
              />
              <button
                onClick={selectInputFolder}
                className="btn-secondary"
              >
                📁
              </button>
            </div>
            <p className={`text-sm mt-1 ${files.length > 0 ? 'text-green-500' : 'text-orange-500'}`}>
              {inputStatus}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pasta de Destino
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={outputFolder}
                onChange={(e) => setOutputFolder(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="saida"
              />
              <button
                onClick={selectOutputFolder}
                className="btn-secondary"
              >
                📁
              </button>
            </div>
          </div>
        </div>

        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg mb-6">
          <div className="text-4xl mb-3">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {files.length > 0 ? `${files.length} arquivos encontrados` : 'Nenhum arquivo encontrado'}
          </h3>
          <p className="text-gray-600 mb-4">
            Coloque arquivos PDF na pasta de entrada ou selecione uma pasta diferente
          </p>
          <button 
            onClick={checkInputFiles} 
            className="btn-secondary"
          >
            🔄 Verificar Novamente
          </button>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Arquivos Encontrados ({files.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {files.map((file, index) => (
                <div key={index} className="flex items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="text-gray-700">📄 {file}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button 
            onClick={checkInputFiles}
            className="btn-secondary"
          >
            🔄 Verificar Novamente
          </button>
          <button 
            onClick={processFiles}
            className="btn-primary"
            disabled={files.length === 0 || isProcessing}
          >
            {isProcessing ? '⏳ Processando...' : '🔄 Unir PDFs'}
          </button>
        </div>
      </div>

      {/* Configurações */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚙️ Configurações de Saída
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do arquivo principal
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="documento_unido.pdf"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pasta de destino
            </label>
            <input
              type="text"
              value={outputFolder}
              onChange={(e) => setOutputFolder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="saida/"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-6">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={createBackup}
              onChange={(e) => setCreateBackup(e.target.checked)}
              className="rounded text-primary mr-2" 
            />
            <span className="text-sm text-gray-700">Criar backup dos originais</span>
          </label>
          
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={optimize}
              onChange={(e) => setOptimize(e.target.checked)}
              className="rounded text-primary mr-2" 
            />
            <span className="text-sm text-gray-700">Gerar também versão 4 por folha</span>
          </label>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📝 Arquivos que serão gerados:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>{fileName}</strong> - PDF único com todas as páginas</li>
            <li>• <strong>composto_4por_folha.pdf</strong> - PDF com 4 páginas por folha A4</li>
            {createBackup && (
              <li>• <strong>entrada_[DATA]_[N]arquivos.zip</strong> - Backup dos originais</li>
            )}
          </ul>
        </div>
      </div>

      {/* Painel de Progresso */}
      {(isProcessing || processingLogs.length > 0) && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Progresso do Processamento
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            {processingLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">Aguardando logs...</p>
            ) : (
              processingLogs.map((log, index) => (
                <div key={index} className={`text-sm mb-1 ${log.type === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
                  <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>

          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                <span className="text-sm text-gray-600">Processando arquivos...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnirPDFs;
