import React, { useState, useEffect } from 'react';
import { api } from '../db';
import { useApp } from '../store';
import { Users, ShieldCheck, Zap, AlertCircle, Search, Filter, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import { User, PlanType, SubscriptionStatus } from '../types';

const SuperAdminView: React.FC = () => {
    const { user: currentUser } = useApp();
    const [tenants, setTenants] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Apenas admins mestres podem acessar (definido pelo email aqui como exemplo)
    const MASTER_EMAIL = 'admin@jhgestor.com';

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        setLoading(true);
        try {
            // Buscamos todos os usuários que são donos (admins de sistemas)
            const allUsers = await api.getUsers();
            const owners = allUsers.filter(u => u.id === u.ownerId);
            setTenants(owners);
        } catch (error) {
            console.error("Erro ao carregar tenants:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (tenantId: string, plan: PlanType, status: SubscriptionStatus) => {
        if (confirm(`Deseja alterar o status para ${status} e plano ${plan}?`)) {
            await api.updateUserSubscription(tenantId, plan, status);
            loadTenants();
        }
    };

    if (currentUser?.email !== MASTER_EMAIL) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <ShieldCheck size={64} className="mx-auto text-red-500" />
                    <h1 className="text-2xl font-black">Acesso Restrito</h1>
                    <p className="text-gray-500">Apenas o administrador mestre do SaaS pode acessar esta área.</p>
                </div>
            </div>
        );
    }

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-8 rounded-3xl border shadow-sm">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-800">Painel Super Admin</h2>
                    <p className="text-gray-500 font-medium">Gestão Global da Plataforma JHGESTOR</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center min-w-[120px]">
                        <p className="text-[10px] font-black uppercase text-blue-400">Tenants Ativos</p>
                        <p className="text-2xl font-black text-blue-600">{tenants.filter(t => t.status === 'ACTIVE').length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-8 py-4">Empresa / Admin</th>
                                <th className="px-8 py-4">Plano</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Trial Até</th>
                                <th className="px-8 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredTenants.map(tenant => (
                                <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500">
                                                {tenant.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{tenant.name}</p>
                                                <p className="text-xs text-gray-500">{tenant.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-600">{tenant.plan}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-600' :
                                                tenant.status === 'BLOCKED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            {tenant.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                        {tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(tenant.id, 'PRO', 'ACTIVE')}
                                                className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors border tooltip"
                                                title="Ativar PRO"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(tenant.id, 'FREE', 'BLOCKED')}
                                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors border"
                                                title="Bloquear"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminView;
