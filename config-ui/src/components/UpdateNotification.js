import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw, AlertCircle } from 'lucide-react';

const UpdateNotification = ({ isDarkMode }) => {
    const [updateData, setUpdateData] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isInstalling, setIsInstalling] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [error, setError] = useState(null);

    // Verificar se está rodando no Electron
    const isElectron = () => {
        return typeof window !== 'undefined' && window.require;
    };

    const getIpcRenderer = () => {
        if (!isElectron()) return null;
        try {
            return window.require('electron').ipcRenderer;
        } catch (error) {
            return null;
        }
    };

    useEffect(() => {
        if (!isElectron()) {
            console.log('🔄 UpdateNotification: Não está no contexto Electron, pulando verificação');
            return;
        }

        checkForUpdates();

        // Escutar eventos de progresso do download
        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) return;

        const handleDownloadProgress = (event, progress) => {
            setDownloadProgress(progress);
        };

        ipcRenderer.on('update-download-progress', handleDownloadProgress);

        return () => {
            ipcRenderer.removeListener('update-download-progress', handleDownloadProgress);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const checkForUpdates = async () => {
        if (!isElectron()) return;

        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) return;

        try {
            const result = await ipcRenderer.invoke('check-for-updates');

            if (result.success && result.updateData) {
                setUpdateData(result.updateData);
                setShowNotification(true);
                setError(null);
            }
        } catch (err) {
            console.error('Erro ao verificar atualizações:', err);
            setError('Erro ao verificar atualizações');
        }
    };

    const handleDownloadUpdate = async () => {
        if (!isElectron() || !updateData) return;

        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) return;

        setIsDownloading(true);
        setError(null);

        try {
            const result = await ipcRenderer.invoke('download-update', updateData);

            if (result.success) {
                // Download concluído, agora instalar
                await handleInstallUpdate(result.filePath);
            } else {
                setError('Erro no download: ' + result.error);
                setIsDownloading(false);
            }
        } catch (err) {
            console.error('Erro no download:', err);
            setError('Erro no download da atualização');
            setIsDownloading(false);
        }
    };

    const handleInstallUpdate = async (filePath) => {
        if (!isElectron()) return;

        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) return;

        setIsInstalling(true);
        setIsDownloading(false);

        try {
            await ipcRenderer.invoke('install-update', filePath);

            // A aplicação será fechada automaticamente após a instalação
        } catch (err) {
            console.error('Erro na instalação:', err);
            setError('Erro na instalação da atualização');
            setIsInstalling(false);
        }
    };

    const handleDismiss = () => {
        setShowNotification(false);
    };

    const handleRemindLater = () => {
        // Esconder por 24 horas
        setShowNotification(false);
        setTimeout(() => {
            setShowNotification(true);
        }, 24 * 60 * 60 * 1000); // 24 horas
    };

    if (!showNotification || !updateData) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md">
            <div className={`rounded-lg shadow-lg border p-4 ${
                isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
            }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold text-lg">Atualização Disponível</h3>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="mb-4">
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Nova versão disponível: <strong>{updateData.version}</strong>
                    </p>

                    {updateData.releaseNotes && (
                        <div className={`text-sm mb-3 p-2 rounded border max-h-32 overflow-y-auto ${
                            isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-300'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}>
                            <div dangerouslySetInnerHTML={{
                                __html: updateData.releaseNotes.replace(/\n/g, '<br>')
                            }} />
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-500 mb-3 flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar (quando baixando) */}
                {isDownloading && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span>Baixando atualização...</span>
                            <span>{downloadProgress}%</span>
                        </div>
                        <div className={`w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700`}>
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${downloadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Botões */}
                <div className="flex space-x-2">
                    {isInstalling ? (
                        <div className="flex items-center space-x-2 text-sm text-blue-500">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Instalando...</span>
                        </div>
                    ) : isDownloading ? (
                        <div className="flex items-center space-x-2 text-sm text-blue-500">
                            <Download className="w-4 h-4 animate-pulse" />
                            <span>Baixando... {downloadProgress}%</span>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={handleDownloadUpdate}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Atualizar Agora</span>
                            </button>

                            <button
                                onClick={handleRemindLater}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    isDarkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                Lembrar Depois
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className={`text-xs mt-3 pt-3 border-t ${
                    isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
                }`}>
                    A aplicação será reiniciada automaticamente após a instalação.
                </div>
            </div>
        </div>
    );
};

export default UpdateNotification;