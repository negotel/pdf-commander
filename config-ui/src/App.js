import React, { useState, useEffect } from 'react';
import './App.css';
import HomePage from './components/HomePage';
import UnirPDFs from './components/UnirPDFs';
import Etiquetas from './components/Etiquetas';
import ZPLTab from './components/etiquetas/ZPLTab';
import CortarPDFTab from './components/CortarPDFTab';
import MonitoringAdmin from './components/MonitoringAdmin';
import StatisticsPage from './components/StatisticsPage';
import UpdateNotification from './components/UpdateNotification';
import HeaderMenu from './components/HeaderMenu';
import { Logo } from './components/Logo';
import { useTheme } from './contexts/ThemeContext';

function App() {
    const { isDarkMode, toggleTheme } = useTheme();
    const [currentPage, setCurrentPage] = useState('home');
    const [adminMode, setAdminMode] = useState(false); // Modo admin secreto
    const [keySequence, setKeySequence] = useState([]); // Sequência de teclas
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);
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

    // Estado para etiquetas
    const [etiquetasConfig, setEtiquetasConfig] = useState({
        tamanhoPagina: 'A4',
        margemX: 0,
        margemY: 0,
        larguraEtiqueta: 62.5,
        alturaEtiqueta: 45.5,
        espacoHorizontal: 0,
        espacoVertical: 0
    });

    const [produtos, setProdutos] = useState([]);

    // Carregar dados do localStorage
    useEffect(() => {
        const savedProdutos = localStorage.getItem('etiquetas_produtos');
        if (savedProdutos) {
            setProdutos(JSON.parse(savedProdutos));
        }

        const savedConfig = localStorage.getItem('etiquetas_config');
        if (savedConfig) {
            setEtiquetasConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
        }
    }, []);

    // Sequência secreta para acessar admin: Ctrl+Shift+A+D+M
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Detecta Ctrl+Shift+A+D+M+I+N
            if (event.ctrlKey && event.shiftKey && event.code === 'KeyA') {
                setKeySequence(['a']);
            } else if (keySequence.length === 1 && keySequence[0] === 'a' && event.code === 'KeyD') {
                setKeySequence(['a', 'd']);
            } else if (keySequence.length === 2 && keySequence[1] === 'd' && event.code === 'KeyM') {
                setKeySequence(['a', 'd', 'm']);
            } else if (keySequence.length === 3 && keySequence[2] === 'm' && event.code === 'KeyI') {
                setKeySequence(['a', 'd', 'm', 'i']);
            } else if (keySequence.length === 4 && keySequence[3] === 'i' && event.code === 'KeyN') {
                setAdminMode(true);
                setKeySequence([]);
                console.log('🔐 Modo administrador ativado');
            } else {
                setKeySequence([]);
            }
        };

        const handleKeyUp = () => {
            // Reset sequence after 2 seconds of inactivity
            setTimeout(() => setKeySequence([]), 2000);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [keySequence]);

    // Funções de navegação
    const showPage = (page) => {
        // Só permite acesso ao monitoring se estiver em modo admin
        if (page === 'monitoring' && !adminMode) {
            console.warn('🚫 Acesso negado ao painel de monitoramento');
            return;
        }
        setCurrentPage(page);
    };

    const exitAdminMode = () => {
        setAdminMode(false);
        if (currentPage === 'monitoring') {
            setCurrentPage('home');
        }
        console.log('🔒 Modo administrador desativado');
    };

    const onCheckUpdates = () => {
        setShowUpdateNotification(true);
    };

    // Salvar configurações de etiquetas
    const saveEtiquetasConfig = (newConfig) => {
        setEtiquetasConfig(newConfig);
        localStorage.setItem('etiquetas_config', JSON.stringify(newConfig));
    };

    // Gerenciar produtos
    const addProduto = (produto) => {
        const newProduto = {
            id: Date.now().toString(),
            ...produto,
            criadoEm: new Date().toISOString()
        };
        const newProdutos = [...produtos, newProduto];
        setProdutos(newProdutos);
        localStorage.setItem('etiquetas_produtos', JSON.stringify(newProdutos));
    };

    const updateProduto = (id, updatedProduto) => {
        const newProdutos = produtos.map(p =>
            p.id === id ? { ...p, ...updatedProduto } : p
        );
        setProdutos(newProdutos);
        localStorage.setItem('etiquetas_produtos', JSON.stringify(newProdutos));
    };

    const deleteProduto = (id) => {
        const newProdutos = produtos.filter(p => p.id !== id);
        setProdutos(newProdutos);
        localStorage.setItem('etiquetas_produtos', JSON.stringify(newProdutos));
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}>
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <Logo />
                            </h1>
                            {adminMode && (
                                <span className={`text-xs px-2 py-1 rounded border ${
                                    isDarkMode
                                        ? 'text-red-300 bg-red-900 border-red-700'
                                        : 'text-red-600 bg-red-50 border-red-200'
                                }`}>
                                    🔐 Admin
                                </span>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Botão de Estatísticas */}
                            <button
                                onClick={() => showPage('statistics')}
                                className={`p-2 rounded-lg transition-colors ${
                                    isDarkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-green-400'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                                title="Ver Estatísticas"
                            >
                                📊
                            </button>

                            {/* Menu Header */}
                            <HeaderMenu
                                isDarkMode={isDarkMode}
                                toggleTheme={toggleTheme}
                                onCheckUpdates={onCheckUpdates}
                            />

                            {adminMode && (
                                <>
                                    <button
                                        onClick={() => showPage('monitoring')}
                                        className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                                            isDarkMode
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                        }`}
                                        title="Painel de Monitoramento"
                                    >
                                        📱 Monitor
                                    </button>
                                    <button
                                        onClick={exitAdminMode}
                                        className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                                            isDarkMode
                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : 'bg-red-100 hover:bg-red-200 text-red-800'
                                        }`}
                                        title="Sair do modo admin"
                                    >
                                        🔒 Sair
                                    </button>
                                </>
                            )}
                            {currentPage !== 'home' && (
                                <button
                                    onClick={() => showPage('home')}
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                        isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                    }`}
                                >
                                    ← Voltar ao Início
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Conteúdo Principal */}
                <main className="fade-in">
                    {currentPage === 'home' && (
                        <HomePage onNavigate={showPage} isDarkMode={isDarkMode} />
                    )}

                    {currentPage === 'unir' && (
                        <UnirPDFs
                            config={config}
                            setConfig={setConfig}
                            isDarkMode={isDarkMode}
                        />
                    )}

                    {currentPage === 'etiquetas' && (
                        <Etiquetas
                            produtos={produtos}
                            etiquetasConfig={etiquetasConfig}
                            onAddProduto={addProduto}
                            onUpdateProduto={updateProduto}
                            onDeleteProduto={deleteProduto}
                            onSaveConfig={saveEtiquetasConfig}
                            isDarkMode={isDarkMode}
                        />
                    )}

                    {currentPage === 'monitoring' && (
                        <MonitoringAdmin isDarkMode={isDarkMode} />
                    )}

                    {currentPage === 'zpl' && (
                        <ZPLTab isDarkMode={isDarkMode} />
                    )}

                    {currentPage === 'cortar' && (
                        <CortarPDFTab isDarkMode={isDarkMode} />
                    )}

                    {currentPage === 'statistics' && (
                        <StatisticsPage isDarkMode={isDarkMode} />
                    )}
                </main>

                {/* Notificação de atualização */}
                <UpdateNotification
                    isDarkMode={isDarkMode}
                    show={showUpdateNotification}
                    onClose={() => setShowUpdateNotification(false)}
                />
            </div>
        </div>
    );
}

export default App;
