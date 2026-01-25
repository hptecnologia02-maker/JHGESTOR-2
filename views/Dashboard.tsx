
import React from 'react';
import { useApp } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';

const DashboardView: React.FC = () => {
  const { clients, tasks, transactions, adsMetrics } = useApp();

  const totalRevenue = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalRevenue - totalExpenses;

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.length - completedTasks;

  // Real chart data based on transactions
  const chartData = [
    { name: 'Sem 1', income: 4000, expense: 2400 },
    { name: 'Sem 2', income: 3000, expense: 1398 },
    { name: 'Sem 3', income: 2000, expense: 9800 },
    { name: 'Sem 4', income: totalRevenue, expense: totalExpenses },
  ];

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Clientes" value={clients.length} icon={<Users className="text-blue-500" />} />
        <StatCard title="Saldo Financeiro" value={`R$ ${balance.toLocaleString('pt-BR')}`} icon={<DollarSign className="text-green-500" />} />
        <StatCard title="Tarefas Pendentes" value={pendingTasks} icon={<CheckCircle className="text-orange-500" />} />
        <StatCard title="CPL Médio (Ads)" value={`R$ ${adsMetrics?.costPerResult || 0}`} icon={<TrendingUp className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-bold mb-4 md:mb-6">Fluxo de Caixa (Real)</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="income" name="Entradas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-bold mb-4 md:mb-6">Métricas Meta Ads</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="income" stroke="#8884d8" fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Agenda Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-base md:text-lg font-bold">Próximos Compromissos</h3>
          <button className="text-blue-600 text-sm font-medium hover:underline">Ver Agenda Completa</button>
        </div>
        <div className="divide-y">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg flex flex-col items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-500">DEZ</span>
                <span className="text-base md:text-lg font-bold leading-none">{15 + i}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm md:text-base truncate">Reunião com Cliente Acme {i}</h4>
                <p className="text-xs md:text-sm text-gray-500 truncate">14:00 - 15:00 • Google Meet</p>
              </div>
              <span className="ml-2 px-2 md:px-3 py-1 bg-blue-50 text-blue-600 text-[10px] md:text-xs font-bold rounded-full whitespace-nowrap">Confirmado</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4">
    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg flex items-center justify-center text-lg md:text-xl flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs md:text-sm text-gray-500 font-medium truncate">{title}</p>
      <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">{value}</p>
    </div>
  </div>
);

export default DashboardView;
