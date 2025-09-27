import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Scissors, File, TrendingUp, Clock } from 'lucide-react';

const StatisticsPage = ({ isDarkMode }) => {
    const [stats, setStats] = useState({
        totalProcessed: 0,
        byCategory: {
            pdfs: 0,
            zpl: 0,
            etiquetas: 0
        },
        recentActivity: [],
        processingTime: {
            average: 0,
            total: 0
        }
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            const ipcRenderer = window.require('electron').ipcRenderer;

            // Carregar estatísticas do monitoramento
            const response = await ipcRenderer.invoke('get-monitoring-stats');

            // Usar dados reais se disponíveis, senão usar dados mock
            const stats = response.success ? response.stats : {
                totalProcessed: 0,
                byCategory: { pdfs: 0, zpl: 0, etiquetas: 0 },
                recentActivity: [],
                processingTime: { average: 0, total: 0 }
            };

            setStats(stats);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            // Usar dados mock em caso de erro
            setStats({
                totalProcessed: 0,
                byCategory: { pdfs: 0, zpl: 0, etiquetas: 0 },
                recentActivity: [],
                processingTime: { average: 0, total: 0 }
            });
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (ms) => {
        if (ms < 1000) return `${ms}ms`;
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };

    const getCategoryIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText className="w-4 h-4" />;
            case 'zpl': return <Scissors className="w-4 h-4" />;
            case 'etiquetas': return <File className="w-4 h-4" />;
            default: return <File className="w-4 h-4" />;
        }
    };

    const getCategoryName = (type) => {
        switch (type) {
            case 'pdf': return 'PDFs Processados';
            case 'zpl': return 'ZPL Convertido';
            case 'etiquetas': return 'Etiquetas Geradas';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Carregando estatísticas...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className={`text-3xl font-bold mb-2 flex items-center justify-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <BarChart3 className="w-8 h-8" />
                    Estatísticas de Uso
                </h1>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Acompanhe o desempenho e uso do software
                </p>
            </div>

            {/* Cards de Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Processado */}
                <div className={`card p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Total Processado
                            </p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {stats.totalProcessed}
                            </p>
                        </div>
                        <TrendingUp className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                </div>

                {/* PDFs Processados */}
                <div className={`card p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                PDFs Processados
                            </p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {stats.byCategory.pdfs}
                            </p>
                        </div>
                        <FileText className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                </div>

                {/* ZPL Convertido */}
                <div className={`card p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                ZPL Convertido
                            </p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {stats.byCategory.zpl}
                            </p>
                        </div>
                        <Scissors className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                </div>

                {/* Etiquetas Geradas */}
                <div className={`card p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Etiquetas Geradas
                            </p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {stats.byCategory.etiquetas}
                            </p>
                        </div>
                        <File className={`w-8 h-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                    </div>
                </div>
            </div>

            {/* Tempo Médio de Processamento */}
            <div className={`card p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Tempo Médio de Processamento
                        </h3>
                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatTime(stats.processingTime.average)}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Tempo total: {formatTime(stats.processingTime.total)}
                        </p>
                    </div>
                    <Clock className={`w-12 h-12 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>
            </div>

            {/* Atividade Recente */}
            <div className={`card p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Atividade Recente
                </h3>

                {stats.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                        {stats.recentActivity.map((activity, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    {getCategoryIcon(activity.type)}
                                    <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {getCategoryName(activity.type)}
                                        </p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {activity.count} arquivo{activity.count !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {formatDate(activity.date)}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {activity.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Nenhuma atividade recente encontrada
                    </p>
                )}
            </div>

            {/* Botão de Atualizar */}
            <div className="text-center">
                <button
                    onClick={loadStatistics}
                    className={`px-6 py-3 rounded-lg transition-colors ${
                        isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                    Atualizar Estatísticas
                </button>
            </div>
        </div>
    );
};

export default StatisticsPage;