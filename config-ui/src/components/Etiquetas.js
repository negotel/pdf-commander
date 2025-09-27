import React, { useState } from 'react';
import ProdutosTab from './etiquetas/ProdutosTab';
import ConfiguracaoTab from './etiquetas/ConfiguracaoTab';
import GerarTab from './etiquetas/GerarTab';

const Etiquetas = ({ 
  produtos, 
  etiquetasConfig, 
  onAddProduto, 
  onUpdateProduto, 
  onDeleteProduto, 
  onSaveConfig,
  isDarkMode 
}) => {
  const [activeTab, setActiveTab] = useState('produtos');

  const tabs = [
    { id: 'produtos', name: 'Produtos', icon: '📦' },
    { id: 'configuracao', name: 'Configuração', icon: '⚙️' },
    { id: 'gerar', name: 'Gerar', icon: '🖨️' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🏷️ Sistema de Etiquetas
            </h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              Gerencie produtos e crie etiquetas com códigos de barras Code 128
            </p>
          </div>
          <div className="text-right">
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado{produtos.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : `border-transparent ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-gray-200 hover:border-gray-500' 
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="fade-in">
        {activeTab === 'produtos' && (
          <ProdutosTab
            produtos={produtos}
            onAdd={onAddProduto}
            onUpdate={onUpdateProduto}
            onDelete={onDeleteProduto}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'configuracao' && (
          <ConfiguracaoTab
            config={etiquetasConfig}
            onSave={onSaveConfig}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'gerar' && (
          <GerarTab
            produtos={produtos}
            config={etiquetasConfig}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
};

export default Etiquetas;
