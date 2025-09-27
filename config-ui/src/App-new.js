import React, { useState, useEffect } from 'react';
import './index.css';
import HomePage from './components/HomePage';
import UnirPDFs from './components/UnirPDFs';
import Etiquetas from './components/Etiquetas';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
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
    margemX: 10,
    margemY: 10,
    larguraEtiqueta: 50,
    alturaEtiqueta: 30,
    espacoHorizontal: 5,
    espacoVertical: 5
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

  // Funções de navegação
  const showPage = (page) => {
    setCurrentPage(page);
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
    <div className="app-container">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900">
                📄 Processador de PDFs
              </h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                PRIMESLOGS
              </span>
            </div>
            
            {currentPage !== 'home' && (
              <button
                onClick={() => showPage('home')}
                className="btn-secondary"
              >
                ← Voltar ao Início
              </button>
            )}
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="fade-in">
          {currentPage === 'home' && (
            <HomePage onNavigate={showPage} />
          )}
          
          {currentPage === 'unir' && (
            <UnirPDFs 
              config={config}
              setConfig={setConfig}
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
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
