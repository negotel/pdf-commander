import React, { useState } from 'react';

const ProdutosTab = ({ produtos, onAdd, onUpdate, onDelete, isDarkMode }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({ 
        descricao: '', 
        codigo: '', 
        tipoCodigo: 'code128',
        informacaoAdicional: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.descricao.trim() || !formData.codigo.trim()) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        // Verificar se o código já existe (apenas para novos produtos)
        if (!editingProduct && produtos.some(p => p.codigo === formData.codigo)) {
            alert('Já existe um produto com este código');
            return;
        }

        if (editingProduct) {
            onUpdate(editingProduct.id, formData);
        } else {
            onAdd(formData);
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData({ 
            descricao: '', 
            codigo: '', 
            tipoCodigo: 'code128',
            informacaoAdicional: ''
        });
        setShowForm(false);
        setEditingProduct(null);
    };

    const handleEdit = (produto) => {
        setFormData({ 
            descricao: produto.descricao, 
            codigo: produto.codigo,
            tipoCodigo: produto.tipoCodigo || 'code128',
            informacaoAdicional: produto.informacaoAdicional || ''
        });
        setEditingProduct(produto);
        setShowForm(true);
    };

    const handleDelete = (produto) => {
        if (window.confirm(`Tem certeza que deseja remover o produto "${produto.descricao}"?`)) {
            onDelete(produto.id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header e Botão Novo */}
            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            📦 Gerenciar Produtos
                        </h3>
                        <p className="text-sm text-gray-600">
                            Cadastre produtos para gerar etiquetas personalizadas
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary"
                    >
                        {showForm ? '✕ Cancelar' : '+ Novo Produto'}
                    </button>
                </div>

                {/* Formulário */}
                {showForm && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">
                            {editingProduct ? '✏️ Editar Produto' : '➕ Novo Produto'}
                        </h4>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descrição do Produto *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.descricao}
                                        onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Ex: Parafuso Phillips M6x40"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Código do Produto *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.codigo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Ex: PAR-PHI-M6-40"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        📱 Tipo de Código
                                    </label>
                                    <select
                                        value={formData.tipoCodigo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tipoCodigo: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        <option value="code128">📊 Código de Barras (Code 128)</option>
                                        <option value="qrcode">📱 QR Code</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ℹ️ Informação Adicional (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.informacaoAdicional}
                                        onChange={(e) => setFormData(prev => ({ ...prev, informacaoAdicional: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Ex: Lote, Validade, etc."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Será exibido abaixo do código na etiqueta com tom mais claro
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    {editingProduct ? '💾 Atualizar' : '💾 Salvar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="btn-secondary"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Lista de Produtos */}
            <div className="card">
                <h4 className="font-medium text-gray-900 mb-4">
                    📋 Produtos Cadastrados
                </h4>

                {produtos.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nenhum produto cadastrado
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Clique em "Novo Produto" para começar
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {produtos.map((produto) => (
                            <div
                                key={produto.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div>
                                    <h5 className="font-medium text-gray-900">
                                        {produto.descricao}
                                    </h5>
                                    <p className="text-sm text-gray-600">
                                        Código: <span className="font-mono bg-white px-2 py-1 rounded">{produto.codigo}</span>
                                        {produto.tipoCodigo && (
                                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {produto.tipoCodigo === 'qrcode' ? '📱 QR Code' : '📊 Code 128'}
                                            </span>
                                        )}
                                    </p>
                                    {produto.informacaoAdicional && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            ℹ️ {produto.informacaoAdicional}
                                        </p>
                                    )}
                                    {produto.criadoEm && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Criado em {new Date(produto.criadoEm).toLocaleDateString('pt-BR')}
                                        </p>
                                    )}
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(produto)}
                                        className="p-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                                        title="Editar produto"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(produto)}
                                        className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                                        title="Remover produto"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProdutosTab;
