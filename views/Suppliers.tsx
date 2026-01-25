import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { api } from '../db';
import { Supplier } from '../types';
import { Plus, Search, Trash2, Phone, Mail, Tag, X, User } from 'lucide-react';

const SuppliersView: React.FC = () => {
    const { refreshData, user } = useApp();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSuppliers();
    }, [user?.ownerId]);

    const loadSuppliers = async () => {
        if (!user?.ownerId) return;
        const data = await api.getSuppliers(user.ownerId);
        setSuppliers(data);
    };

    const handleAddSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        await api.addSupplier({
            ownerId: user?.ownerId || '1',
            name: formData.get('name') as string,
            contact: formData.get('contact') as string,
            email: formData.get('email') as string,
            category: formData.get('category') as string,
        });

        setIsModalOpen(false);
        loadSuppliers();
        refreshData();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
            await api.deleteSupplier(id);
            loadSuppliers();
            refreshData();
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Fornecedores</h2>
                    <p className="text-sm text-gray-500 font-medium">Gestão de parceiros e serviços</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus size={20} /> Novo Fornecedor
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border shadow-sm sticky top-0 z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar fornecedores por nome ou categoria..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map(supplier => (
                    <div key={supplier.id} className="bg-white p-6 rounded-2xl border hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-black text-xl">
                                {supplier.name.charAt(0)}
                            </div>
                            <button
                                onClick={() => handleDelete(supplier.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors bg-gray-50 dark:bg-transparent p-2 rounded-lg"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <h3 className="font-bold text-lg text-slate-800 mb-1">{supplier.name}</h3>
                        <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg mb-4 border border-purple-100">
                            {supplier.category}
                        </span>

                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-gray-400" />
                                {supplier.contact}
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-gray-400" />
                                {supplier.email}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-slate-800">Novo Fornecedor</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Empresa</label>
                                <input required name="name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Ex: Papelaria Silva" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Contato</label>
                                <input required name="contact" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Ex: João" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input required name="email" type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="contato@empresa.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                                <select name="category" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                    <option>Serviços</option>
                                    <option>Produtos</option>
                                    <option>Transporte</option>
                                    <option>Tecnologia</option>
                                    <option>Outros</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersView;
