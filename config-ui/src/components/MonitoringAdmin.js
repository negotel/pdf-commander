import React, { useState } from 'react';

const MonitoringAdmin = ({ isDarkMode }) => {
    const [testResult, setTestResult] = useState(null);
    const [loading, setLoading] = useState(false);

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

    const testWhatsAppConnection = async () => {
        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) {
            setTestResult({ success: false, message: 'Disponível apenas no Electron' });
            return;
        }

        setLoading(true);
        try {
            const result = await ipcRenderer.invoke('monitoring-test');
            setTestResult(result);
        } catch (error) {
            setTestResult({ success: false, message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const sendTestLog = async (level, message) => {
        const ipcRenderer = getIpcRenderer();
        if (!ipcRenderer) return;

        try {
            await ipcRenderer.invoke('monitoring-log', level, message, {
                testFrom: 'React Admin',
                timestamp: new Date().toISOString()
            });
            alert(`Log ${level} enviado com sucesso!`);
        } catch (error) {
            alert(`Erro ao enviar log: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card">
                <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    🔍 Administração do Monitoramento
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Status do Sistema */}
                    <div className={`rounded-lg p-6 transition-colors ${
                        isDarkMode 
                            ? 'bg-blue-900/20 border border-blue-700/30' 
                            : 'bg-blue-50'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-900'
                        }`}>
                            📊 Status do Sistema
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className={isDarkMode ? 'text-blue-400' : 'text-blue-700'}>Sistema:</span>
                                <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>Ativo</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={isDarkMode ? 'text-blue-400' : 'text-blue-700'}>Logs Locais:</span>
                                <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>Habilitado</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={isDarkMode ? 'text-blue-400' : 'text-blue-700'}>WhatsApp:</span>
                                <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>Configurado</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={isDarkMode ? 'text-blue-400' : 'text-blue-700'}>Admin:</span>
                                <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>5511940277034</span>
                            </div>
                        </div>
                    </div>

                    {/* Teste de Conectividade */}
                    <div className={`rounded-lg p-6 transition-colors ${
                        isDarkMode 
                            ? 'bg-green-900/20 border border-green-700/30' 
                            : 'bg-green-50'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                            isDarkMode ? 'text-green-300' : 'text-green-900'
                        }`}>
                            🧪 Teste de Conectividade
                        </h3>

                        <button
                            onClick={testWhatsAppConnection}
                            disabled={loading}
                            className={`w-full mb-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                                isDarkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
                            }`}
                        >
                            {loading ? '⏳ Testando...' : '📱 Testar WhatsApp'}
                        </button>

                        {testResult && (
                            <div className={`p-3 rounded-lg text-sm ${testResult.success
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                <div className="font-medium mb-1">
                                    {testResult.success ? '✅ Sucesso!' : '❌ Falhou!'}
                                </div>
                                <div>{testResult.message}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Logs de Teste */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        📝 Teste de Logs
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                            onClick={() => sendTestLog('info', 'Teste de log informativo')}
                            className="btn-secondary text-blue-600"
                        >
                            ℹ️ Info
                        </button>
                        <button
                            onClick={() => sendTestLog('warning', 'Teste de warning')}
                            className="btn-secondary text-yellow-600"
                        >
                            ⚠️ Warning
                        </button>
                        <button
                            onClick={() => sendTestLog('error', 'Teste de erro')}
                            className="btn-secondary text-red-600"
                        >
                            ❌ Error
                        </button>
                        <button
                            onClick={() => sendTestLog('critical', 'Teste crítico - será enviado via WhatsApp')}
                            className="btn-secondary text-red-800"
                        >
                            🚨 Critical
                        </button>
                    </div>
                </div>

                {/* Informações dos Logs */}
                <div className="mt-6 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        📋 Critérios de Envio
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">🚨 Sempre via WhatsApp:</h4>
                            <ul className="space-y-1 text-gray-700">
                                <li>• Logs críticos (critical)</li>
                                <li>• Erros com TypeError/ReferenceError</li>
                                <li>• Falhas no processamento de PDFs</li>
                                <li>• Primeira execução do dia</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">💾 Apenas Log Local:</h4>
                            <ul className="space-y-1 text-gray-700">
                                <li>• Logs informativos (info)</li>
                                <li>• Avisos (warning)</li>
                                <li>• Sucessos pequenos</li>
                                <li>• Debug geral</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Informações de Segurança */}
                <div className="mt-6 bg-yellow-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                        🔒 Segurança
                    </h3>

                    <div className="text-sm text-yellow-800 space-y-2">
                        <p>
                            <strong>✅ Credenciais Protegidas:</strong> Token e URL da API ficam apenas no backend (Electron).
                        </p>
                        <p>
                            <strong>✅ Logs Locais:</strong> Backup de todos os logs em <code>logs/monitoring.log</code>.
                        </p>
                        <p>
                            <strong>✅ Controle de Frequência:</strong> Sistema evita spam com lógica de primeira execução do dia.
                        </p>
                        <p>
                            <strong>✅ Dados Sensíveis:</strong> Informações do sistema são anonimizadas (apenas hostname e OS).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitoringAdmin;
