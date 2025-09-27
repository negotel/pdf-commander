import React, { useState } from 'react';
import { APP_CONFIG } from '../config';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const HomePage = ({ onNavigate, isDarkMode }) => {
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState(null); // null, 'checking', 'available', 'up-to-date', 'error'

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

    const handleCheckForUpdates = async () => {
        if (!isElectron()) {
            setUpdateStatus('error');
            return;
        }

        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) {
            setUpdateStatus('error');
            return;
        }

        setIsCheckingUpdate(true);
        setUpdateStatus('checking');

        try {
            const result = await ipcRenderer.invoke('check-for-updates');

            if (result.success && result.updateData) {
                setUpdateStatus('available');
            } else {
                setUpdateStatus('up-to-date');
            }
        } catch (err) {
            console.error('Erro ao verificar atualizações:', err);
            setUpdateStatus('error');
        } finally {
            setIsCheckingUpdate(false);
        }
    };
    const processes = [
        {
            id: 'unir',
            title: 'Unir PDFs',
            description: 'Junte múltiplos arquivos PDF em um só documento',
            icon: '📄',
            color: 'from-blue-500 to-blue-600',
            features: ['Organização automática', 'Múltiplos formatos', 'Processamento em lote']
        },
        {
            id: 'etiquetas',
            title: 'Gerar Etiquetas',
            description: 'Crie etiquetas personalizadas com códigos de barras',
            icon: '🏷️',
            color: 'from-green-500 to-green-600',
            features: ['Barcode Code 128', 'Layout configurável', 'PDF automático']
        },
        {
            id: 'zpl',
            title: 'Converter ZPL',
            description: 'Converta arquivos ZPL para PDF automaticamente',
            icon: '🔄',
            color: 'from-purple-500 to-purple-600',
            features: ['Upload de arquivos ZPL', 'Conversão automática', 'Download PDF']
        },
        {
            id: 'cortar',
            title: 'Cortar PDF',
            description: 'Corte etiquetas individuais de um arquivo PDF',
            icon: '✂️',
            color: 'from-orange-500 to-orange-600',
            features: ['Separação automática', 'Etiquetas individuais', 'Processamento rápido']
        }
    ];

    return (
        <div className="space-y-8">
            {/* Seção de Boas-vindas */}
            <div className="text-center">
                <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                   Processador de PDFs
                </h2>
                <p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Uma ferramenta para processar documentos PDF e gerar etiquetas personalizadas
                    com códigos de barras.
                </p>
            </div>

            {/* Cards de Processos por padrao as cols sera 4 mas se tive somente dois ou 3 sera 2 ou 3 */}

            <div className={`grid gap-6 ${processes.length === 2 ? 
                'md:grid-cols-2' : processes.length === 4 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                {processes.map((process) => (
                    <div
                        key={process.id}
                        onClick={() => onNavigate(process.id)}
                        className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                    >
                        <div className="card h-full">
                            {/* Header do Card */}
                            <div className="text-center mb-6">
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${process.color} text-white text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                                    {process.icon}
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {process.title}
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {process.description}
                                </p>
                            </div>

                            {/* Features */}
                            <div className="space-y-2 mb-6">
                                {process.features.map((feature, index) => (
                                    <div key={index} className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <span className="w-2 h-2 bg-primary rounded-full mr-2 flex-shrink-0"></span>
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            {/* Botão de Ação */}
                            <div className="text-center">
                                <button className={`w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r ${process.color} hover:shadow-lg transition-all duration-300`}>
                                    Acessar {process.title}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Section */}
            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Status do Sistema
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Todos os serviços estão funcionando normalmente
                        </p>
                        {updateStatus && (
                            <div className="flex items-center mt-2 text-sm">
                                {updateStatus === 'checking' && (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                                        <span className="text-blue-600">Verificando atualizações...</span>
                                    </>
                                )}
                                {updateStatus === 'available' && (
                                    <>
                                        <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                                        <span className="text-orange-600">Nova versão disponível!</span>
                                    </>
                                )}
                                {updateStatus === 'up-to-date' && (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                        <span className="text-green-600">Sistema atualizado</span>
                                    </>
                                )}
                                {updateStatus === 'error' && (
                                    <>
                                        <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                                        <span className="text-red-600">Erro na verificação</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleCheckForUpdates}
                            disabled={isCheckingUpdate}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                isCheckingUpdate
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : isDarkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Verificar se há atualizações disponíveis"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                            {isCheckingUpdate ? 'Verificando...' : 'Verificar Updates'}
                        </button>
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-green-600 font-medium">Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>
                    Desenvolvido para <strong>PRIMESLOGS</strong> •
                    Versão {APP_CONFIG.version} •
                    {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
};

export default HomePage;
