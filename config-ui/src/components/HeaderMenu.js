import React, { useState } from 'react';
import { RefreshCw, Info, Moon, Sun, MoreVertical } from 'lucide-react';
import { APP_CONFIG } from '../config';

const HeaderMenu = ({ isDarkMode, toggleTheme, onCheckUpdates }) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

    const handleCheckUpdates = async () => {
        setIsCheckingUpdates(true);
        try {
            await onCheckUpdates();
        } finally {
            setIsCheckingUpdates(false);
        }
    };

    return (
        <>
            <div className="flex items-center space-x-2">
                {/* Botão Verificar Updates */}
                <button
                    onClick={handleCheckUpdates}
                    disabled={isCheckingUpdates}
                    className={`p-2 rounded-lg transition-colors ${
                        isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-blue-400 disabled:opacity-50'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50'
                    }`}
                    title="Verificar atualizações"
                >
                    <RefreshCw className={`w-5 h-5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                </button>

                {/* Menu Popover */}
                <div className="relative">
                    <button
                        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                        className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                        title="Menu"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {isPopoverOpen && (
                        <>
                            {/* Overlay para fechar popover */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsPopoverOpen(false)}
                            />

                            {/* Popover */}
                            <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-20 ${
                                isDarkMode
                                    ? 'bg-gray-800 border-gray-700'
                                    : 'bg-white border-gray-200'
                            }`}>
                                <div className="py-1">
                                    {/* About */}
                                    <button
                                        onClick={() => {
                                            setShowAboutModal(true);
                                            setIsPopoverOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        <Info className="w-4 h-4" />
                                        <span>Sobre</span>
                                    </button>

                                    {/* Dark Mode Toggle */}
                                    <button
                                        onClick={() => {
                                            toggleTheme();
                                            setIsPopoverOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        {isDarkMode ? (
                                            <Sun className="w-4 h-4" />
                                        ) : (
                                            <Moon className="w-4 h-4" />
                                        )}
                                        <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal About */}
            {showAboutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`rounded-lg shadow-xl max-w-md w-full mx-4 ${
                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                        <div className={`px-6 py-4 border-b ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <h3 className={`text-lg font-semibold ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                    Sobre o PDF Commander
                                </h3>
                                <button
                                    onClick={() => setShowAboutModal(false)}
                                    className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                                    }`}>
                                        <span className="text-white text-xl">📄</span>
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {APP_CONFIG.name}
                                        </h4>
                                        <p className={`text-sm ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                            Versão {APP_CONFIG.version}
                                        </p>
                                    </div>
                                </div>

                                <p className={`text-sm ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                    {APP_CONFIG.description}
                                </p>

                                <div className={`border-t pt-4 ${
                                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                }`}>
                                    <h5 className={`font-medium mb-2 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Funcionalidades
                                    </h5>
                                    <ul className={`text-sm space-y-1 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        <li>• União automática de PDFs</li>
                                        <li>• Normalização para tamanhos padrão</li>
                                        <li>• Layout em grade (4 PDFs por página)</li>
                                        <li>• Sistema completo de etiquetas</li>
                                        <li>• Geração de códigos de barras</li>
                                        <li>• Atualização automática</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className={`px-6 py-4 border-t ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowAboutModal(false)}
                                    className={`px-4 py-2 rounded-lg font-medium ${
                                        isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                    }`}
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HeaderMenu;