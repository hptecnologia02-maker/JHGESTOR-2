import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { api } from '../db';
import { User, UserRole } from '../types'; // Import UserRole
import { User as UserIcon, Shield, Mail, Trash2, Plus, X, Lock } from 'lucide-react';

const SettingsView: React.FC = () => {
    const { user: currentUser, refreshData } = useApp();
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER' as UserRole }); // Use UserRole

    useEffect(() => {
        if (currentUser?.role === 'ADMIN') {
            loadUsers();
        }
    }, [currentUser]);

    const loadUsers = async () => {
        try {
            if (!currentUser?.ownerId) {
                console.warn("Settings: Skipping loadUsers, no ownerId found in currentUser", currentUser);
                return;
            }
            console.log("Settings: Loading users for owner", currentUser.ownerId);
            const data = await api.getUsers(currentUser.ownerId);
            setUsers(data);
        } catch (err: any) {
            console.error("Settings: Failed to load users", err);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        try {
            console.log("Settings: Attempting to add user", newUser);
            await api.addUser({
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
                ownerId: currentUser?.ownerId,
                avatar: undefined
            });

            setNewUser({ name: '', email: '', password: '', role: 'USER' });
            setIsModalOpen(false);
            loadUsers();
            alert('Usuário adicionado com sucesso!');
        } catch (err: any) {
            console.error("Settings: Error in handleAddUser", err);
            alert("Erro ao adicionar usuário: " + (err.message || "Verifique o console para mais detalhes"));
        }
    };

    const handleDeleteUser = async (id: string, role: string) => {
        if (id === currentUser?.id) {
            alert('Você não pode excluir a si mesmo.');
            return;
        }
        if (confirm('Tem certeza que deseja remover este usuário? Ele perderá o acesso imediatamente.')) {
            await api.deleteUser(id);
            loadUsers();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">

            {/* Perfil do Usuário */}
            <section className="bg-white p-8 rounded-3xl border shadow-sm">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Meu Perfil</h2>
                        <p className="text-sm text-gray-500 font-medium">Suas informações pessoais</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-blue-100">
                        PLANO {currentUser?.plan}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-4xl border-4 border-blue-50">
                        {currentUser?.name.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome</label>
                                <div className="font-bold text-slate-700 flex items-center gap-2">
                                    <UserIcon size={18} className="text-blue-500" /> {currentUser?.name}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Email</label>
                                <div className="font-bold text-slate-700 flex items-center gap-2">
                                    <Mail size={18} className="text-blue-500" /> {currentUser?.email}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                            <Shield size={18} className="text-blue-500" />
                            <span className="font-bold text-slate-700">Função:</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-black ${currentUser?.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                {currentUser?.role === 'ADMIN' ? 'ADMINISTRADOR' : 'USUÁRIO'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gestão de Equipe (Apenas Admin) */}
            {currentUser?.role === 'ADMIN' && (
                <section className="bg-white p-8 rounded-3xl border shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Equipe</h2>
                            <p className="text-sm text-gray-500 font-medium">Gerencie o acesso ao sistema</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            <Plus size={18} /> Adicionar Usuário
                        </button>
                    </div>

                    <div className="space-y-3">
                        {users.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {u.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{u.name} {u.id === currentUser.id && <span className="text-xs text-gray-400">(Você)</span>}</h4>
                                        <p className="text-xs text-gray-500">{u.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-200 text-purple-700' : 'bg-green-200 text-green-700'}`}>
                                        {u.role === 'ADMIN' ? 'ADMINISTRADOR' : 'USUÁRIO'}
                                    </span>

                                    {u.id !== currentUser.id && (
                                        <button
                                            onClick={() => handleDeleteUser(u.id, u.role)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                            title="Remover acesso"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Modal Adicionar Usuário */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
                        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Novo Usuário</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Adicionar membro à equipe</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nome Completo</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all placeholder:font-medium"
                                    placeholder="Ex: Maria Silva"
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email de Acesso</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all placeholder:font-medium"
                                    placeholder="maria@empresa.com"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Senha de Acesso</label>
                                <input
                                    required
                                    type="password"
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all placeholder:font-medium"
                                    placeholder="Mínimo 6 caracteres"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nível de Permissão</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        onClick={() => setNewUser({ ...newUser, role: 'USER' })}
                                        className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${newUser.role === 'USER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-300'}`}
                                    >
                                        <UserIcon size={24} />
                                        <span className="font-bold text-sm">Usuário</span>
                                    </div>
                                    <div
                                        onClick={() => setNewUser({ ...newUser, role: 'ADMIN' })}
                                        className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${newUser.role === 'ADMIN' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 hover:border-gray-300'}`}
                                    >
                                        <Lock size={24} />
                                        <span className="font-bold text-sm">Admin</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 text-center font-medium">
                                    {newUser.role === 'ADMIN' ? 'Acesso total a todo o sistema.' : 'Acesso restrito (Sem Financeiro e Clientes).'}
                                </p>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2">
                                    <Plus size={20} /> Cadastrar Membro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;
