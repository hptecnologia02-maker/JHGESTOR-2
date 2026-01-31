
import React, { useState } from 'react';
import { useApp } from '../store';
import { api } from '../db';
import { Plus, Download, TrendingUp, TrendingDown, Filter, Calendar, X } from 'lucide-react';
import { Transaction } from '../types';

const FinancialView: React.FC = () => {
  const { transactions, refreshData, user } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));

  const filteredTransactions = transactions.filter(t => t.date.startsWith(filterMonth));

  const totalIncome = filteredTransactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!user?.ownerId) {
      alert('Erro: ID do proprietário não encontrado.');
      return;
    }
    await api.addTransaction({
      ownerId: user.ownerId,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      type: formData.get('type') as 'INCOME' | 'EXPENSE',
      date: formData.get('date') as string,
      category: formData.get('category') as string,
    });
    setIsModalOpen(false);
    refreshData();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex flex-wrap justify-between items-center gap-4 print:hidden">
        <div>
          <h3 className="text-xl font-bold">Gestão Financeira</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <Calendar size={14} /> Período selecionado: {filterMonth}
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handlePrint}
            className="bg-white border text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Download size={18} /> Imprimir Relatório
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border-l-4 border-l-green-500 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><TrendingUp /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Entradas</p>
            <p className="text-xl font-black text-green-600">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border-l-4 border-l-red-500 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center"><TrendingDown /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saídas</p>
            <p className="text-xl font-black text-red-600">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl text-white shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"><Filter /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saldo Mensal</p>
            <p className={`text-xl font-black ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center print:hidden">
          <span className="text-xs font-bold uppercase text-gray-500">Detalhamento de Movimentações</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-500 tracking-widest">Descrição</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-500 tracking-widest">Categoria</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-500 tracking-widest text-center">Data</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-500 tracking-widest text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-400 text-sm">Nenhum lançamento no período filtrado.</td>
              </tr>
            ) : (
              filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${tx.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-semibold text-gray-800">{tx.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">{tx.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                  <td className={`px-6 py-4 text-right font-black ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">Lançamento Financeiro</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <label className="flex-1 text-center py-2 rounded-lg cursor-pointer transition-all has-[:checked]:bg-white has-[:checked]:shadow-sm">
                  <input required name="type" type="radio" value="INCOME" defaultChecked className="hidden" />
                  <span className="text-sm font-bold text-green-600">Entrada</span>
                </label>
                <label className="flex-1 text-center py-2 rounded-lg cursor-pointer transition-all has-[:checked]:bg-white has-[:checked]:shadow-sm">
                  <input required name="type" type="radio" value="EXPENSE" className="hidden" />
                  <span className="text-sm font-bold text-red-600">Saída</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                <input required name="description" autoFocus className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Venda de Licença SaaS" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Valor (R$)</label>
                  <input required name="amount" type="number" step="0.01" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                  <input required name="category" list="categories" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Vendas, Marketing..." />
                  <datalist id="categories">
                    <option value="Vendas" /><option value="Infra" /><option value="Marketing" /><option value="Operacional" />
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Data do Movimento</label>
                <input required name="date" type="date" defaultValue={new Date().toISOString().substring(0, 10)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg">Confirmar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default FinancialView;
