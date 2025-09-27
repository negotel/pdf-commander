import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../config';

const UpdateNotification = ({ isDarkMode, show, onClose }) => {
    const [updateData, setUpdateData] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isInstalling, setIsInstalling] = useState(false);
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

        // Escutar evento de força verificação
        const handleForceCheck = () => {
            console.log('🔄 Forçando verificação de updates...');
            checkForUpdates(true);
        };

        ipcRenderer.on('update-download-progress', handleDownloadProgress);
        window.addEventListener('force-update-check', handleForceCheck);

        return () => {
            ipcRenderer.removeListener('update-download-progress', handleDownloadProgress);
            window.removeEventListener('force-update-check', handleForceCheck);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const checkForUpdates = async (force = false) => {
        if (!isElectron()) return;

        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) return;

        try {
            const result = await ipcRenderer.invoke('check-for-updates', force);

            if (result.success && result.updateData) {
                setUpdateData(result.updateData);
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
        onClose();
    };

    const handleRemindLater = () => {
        // Esconder por 24 horas
        onClose();
        setTimeout(() => {
            // Reabrir após 24 horas se ainda houver update disponível
            if (updateData) {
                // Aqui poderíamos reabrir o modal, mas por simplicidade vamos apenas limpar o estado
            }
        }, 24 * 60 * 60 * 1000); // 24 horas
    };

    if (!show || !updateData) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg shadow-xl border max-w-md w-full p-6 ${
                isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
            }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <AlertCircle className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Atualização Disponível</h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Uma nova versão está pronta para instalação
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                            isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                        }`}
                        title="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Informações da Versão */}
                <div className={`p-4 rounded-lg mb-4 ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'
                }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Versão Atual:
                        </span>
                        <span className={`text-sm px-2 py-1 rounded ${
                            isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                            {APP_CONFIG.version}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Nova Versão:
                        </span>
                        <span className={`text-sm px-2 py-1 rounded bg-blue-500 text-white font-medium`}>
                            {updateData.version}
                        </span>
                    </div>
                </div>

                {/* Release Notes */}
                {updateData.releaseNotes && (
                    <div className={`text-sm mb-4 p-3 rounded-lg border max-h-32 overflow-y-auto ${
                        isDarkMode
                            ? 'bg-gray-700/30 border-gray-600 text-gray-300'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}>
                        <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            Novidades desta versão:
                        </h4>
                        <div dangerouslySetInnerHTML={{
                            __html: updateData.releaseNotes.replace(/\n/g, '<br>')
                        }} />
                    </div>
                )}

                {/* Mensagem de erro */}
                {error && (
                    <div className={`p-3 rounded-lg mb-4 border ${
                        isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    </div>
                )}

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