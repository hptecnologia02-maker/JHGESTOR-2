
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
    price: 149.90,
    features: ['Clientes Ilimitados', 'Agenda Google Sync', 'Meta Ads Insights', 'Relatórios PDF'],
    color: 'bg-blue-600'
  },
  {
    id: 'ENTERPRISE',
    name: 'Corporativo',
    price: 499.00,
    features: ['Tudo do PRO', 'Suporte VIP 24h', 'Backup em Tempo Real', 'Acesso API'],
    color: 'bg-slate-900'
  }
];

const BillingView: React.FC = () => {
  const { user, refreshData } = useApp();
  const [showCheckout, setShowCheckout] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulatedPayment = async () => {
    if (!showCheckout || !user) return;
    setIsProcessing(true);

    // Simula delay de gateway (Stripe)
    await new Promise(r => setTimeout(r, 2000));

    await api.processPayment(user.id, showCheckout.price, showCheckout.id);
    await refreshData();

    setIsProcessing(false);
    setShowCheckout(null);
    alert('Pagamento processado com sucesso! Sua assinatura foi atualizada.');
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    if (confirm('Deseja realmente suspender sua assinatura? Você perderá acesso aos módulos PRO.')) {
      await api.updateUserSubscription(user.id, 'FREE', 'BLOCKED');
      await refreshData();
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
            onClick={handleCancelSubscription}
            className="px-6 py-3 border rounded-xl text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
          >
            Suspender Acesso
          </button>
          <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2">
            <CreditCard size={18} /> Histórico de Faturas
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
              disabled={user?.plan === plan.id}
              onClick={() => setShowCheckout(plan)}
              className={`w-full py-4 rounded-2xl font-black transition-all ${user?.plan === plan.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'}`}
            >
              {user?.plan === plan.id ? 'Plano Atual' : 'Fazer Upgrade'}
            </button>
          </div>
        ))}
      </div>

      {/* Checkout Modal (Simulando Stripe) */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
            {/* Esquerda: Resumo */}
            <div className="w-full md:w-5/12 bg-slate-900 p-10 text-white flex flex-col">
              <button onClick={() => setShowCheckout(null)} className="mb-10 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm">
                <X size={20} /> Voltar
              </button>
              <div className="flex-1">
                <p className="text-slate-400 font-black uppercase tracking-[3px] text-xs mb-4">Assinando JHGESTOR</p>
                <h2 className="text-4xl font-black mb-10 tracking-tighter">Plano {showCheckout.name}</h2>
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-xl">
                    <span className="font-bold opacity-70">Total Hoje</span>
                    <span className="font-black">R$ {showCheckout.price.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <p className="text-sm opacity-60 leading-relaxed">
                    A cobrança é mensal e recorrente. Você pode cancelar a qualquer momento diretamente no painel.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-10">
                <ShieldCheck size={16} className="text-blue-500" /> Checkout Seguro SSL
              </div>
            </div>

            {/* Direita: Formulário de Cartão */}
            <div className="flex-1 p-10 bg-white">
              <h3 className="text-xl font-black mb-8">Informações de Pagamento</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Número do Cartão</label>
                  <div className="relative">
                    <input disabled={isProcessing} className="w-full px-4 py-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-mono" placeholder="4444 4444 4444 4444" />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Validade</label>
                    <input disabled={isProcessing} className="w-full px-4 py-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-mono" placeholder="MM/AA" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">CVC</label>
                    <input disabled={isProcessing} className="w-full px-4 py-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-mono" placeholder="123" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Nome no Cartão</label>
                  <input disabled={isProcessing} className="w-full px-4 py-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all uppercase" placeholder="NOME COMO NO CARTÃO" />
                </div>
              </div>

              <div className="mt-10">
                <button
                  onClick={handleSimulatedPayment}
                  disabled={isProcessing}
                  className="w-full bg-[#635BFF] text-white py-5 rounded-3xl font-black text-xl hover:bg-[#5851e0] transition-all shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <><Loader2 className="animate-spin" /> Processando...</>
                  ) : (
                    <><Lock size={20} /> Assinar com Stripe</>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 mt-6">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                    Powered by
                  </p>
                  <span className="text-[#635BFF] font-black text-xs">Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingView;
