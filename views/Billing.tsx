
import React, { useState } from 'react';
import { useApp } from '../store';
import { api } from '../db';
import { CreditCard, CheckCircle, Zap, ShieldCheck, AlertCircle, X, Loader2, Lock } from 'lucide-react';
import { PlanType } from '../types';

interface Plan {
  id: PlanType;
  name: string;
  price: number;
  features: string[];
  color: string;
}

const PLANS: Plan[] = [
  {
    id: 'FREE',
    name: 'Essencial',
    price: 0,
    features: ['Até 10 clientes', 'Kanban Básico', 'Chat Geral'],
    color: 'bg-gray-100'
  },
  {
    id: 'PRO',
    name: 'Profissional',
    price: 149.99,
    features: ['Clientes Ilimitados', 'Agenda Google Sync', 'Meta Ads Insights', 'Relatórios PDF'],
    color: 'bg-blue-600'
  },
  {
    id: 'ENTERPRISE',
    name: 'Corporativo (Anual)',
    price: 1559.88,
    features: ['Tudo do PRO', 'Suporte VIP 24h', 'Backup em Tempo Real', 'Acesso API'],
    color: 'bg-slate-900'
  }
];

const BillingView: React.FC = () => {
  const { user, refreshData } = useApp();
  const [showCheckout, setShowCheckout] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStripeCheckout = async (plan: Plan) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const url = await api.createCheckoutSession(user.id, plan.id);
      window.location.href = url;
    } catch (err: any) {
      console.error('Erro ao iniciar checkout:', err);
      // Tenta pegar a mensagem de erro que eu coloquei no Response da Function
      const msg = err.context?.json?.error || err.message || 'Falha na conexão';
      alert(`Erro ao iniciar checkout: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const url = await api.createPortalSession(user.id);
      window.location.href = url;
    } catch (err: any) {
      console.error('Erro ao abrir portal:', err);
      alert('Erro ao abrir portal: ' + (err.message || 'Falha na conexão'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    if (confirm('Deseja realmente suspender sua assinatura? Você perderá acesso aos módulos PRO.')) {
      // No Stripe real, geralmente redirecionamos para o Portal do Cliente para cancelamento
      handleManageSubscription();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header Assinatura */}
      <div className="bg-white rounded-3xl border shadow-sm p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white ${user?.plan === 'FREE' ? 'bg-gray-400' : 'bg-blue-600'}`}>
            <Zap size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Plano {user?.plan}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user?.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {user?.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Assinatura renova em: 15/01/2025</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleManageSubscription}
            className="px-6 py-3 border rounded-xl text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
          >
            Sincronizar Assinatura
          </button>
          <button
            onClick={handleManageSubscription}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <CreditCard size={18} /> Gerenciar no Stripe
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map(plan => (
          <div key={plan.id} className={`bg-white rounded-3xl border p-8 flex flex-col shadow-sm relative transition-all hover:shadow-xl ${user?.plan === plan.id ? 'ring-2 ring-blue-500' : ''}`}>
            {user?.plan === plan.id && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">Seu Plano</span>
            )}
            <h3 className="text-xl font-black text-slate-800 mb-2">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-black text-slate-900">R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-gray-400 text-sm font-bold"> /mês</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <CheckCircle size={16} className="text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled={user?.plan === plan.id || isProcessing}
              onClick={() => handleStripeCheckout(plan)}
              className={`w-full py-4 rounded-2xl font-black transition-all ${user?.plan === plan.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'}`}
            >
              {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : (user?.plan === plan.id ? 'Plano Atual' : 'Fazer Upgrade')}
            </button>
          </div>
        ))}
      </div>

      {/* Modal Checkout Removido - Redirecionamento Direto para o Stripe */}
    </div>
  );
};

export default BillingView;
