
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import { MENU_ITEMS } from './constants';
import { LogOut, Menu, X, Bell, User as UserIcon, ShieldAlert, CreditCard } from 'lucide-react';

// Views
import DashboardView from './views/Dashboard';
import ClientsView from './views/Clients';
import TasksView from './views/Tasks';
import CalendarView from './views/Calendar';
import FinancialView from './views/Financial';
import AdsView from './views/Ads';
import ChatView from './views/Chat';
import LoginView from './views/Login';
import BillingView from './views/Billing';

import SettingsView from './views/Settings';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (!user) return <Navigate to="/login" />;

  const activePath = location.pathname.substring(1) || 'dashboard';

  // Bloqueio de Acesso
  if (user.status === 'BLOCKED' && activePath !== 'billing') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 p-4 text-center">
        <div className="p-8 md:p-12 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-red-100 max-w-lg w-full">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 animate-pulse">
            <ShieldAlert size={window.innerWidth > 768 ? 48 : 32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tighter">Acesso Suspenso</h1>
          <p className="text-sm md:text-base text-gray-500 mb-8 md:mb-10 font-medium leading-relaxed">
            Detectamos uma pendência na sua assinatura ou o plano foi suspenso manualmente.
            Para continuar, regularize seu pagamento.
          </p>
          <div className="space-y-3">
            <Link
              to="/billing"
              className="block w-full bg-blue-600 text-white px-6 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3"
            >
              <CreditCard size={24} /> Regularizar Agora
            </Link>
            <button
              onClick={() => setUser(null)}
              className="block w-full py-4 text-gray-400 font-bold hover:text-red-500 transition-colors"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Overlay para Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[70] lg:static lg:flex
        bg-slate-900 text-white transition-all duration-300 
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'} 
        ${!isSidebarOpen && !isMobileMenuOpen ? 'lg:w-20' : 'lg:w-64'}
        flex flex-col shadow-2xl
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {(isSidebarOpen || isMobileMenuOpen) && <span className="text-xl font-black tracking-tighter">JH<span className="text-blue-500">GESTOR</span></span>}
          <button
            onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsSidebarOpen(!isSidebarOpen)}
            className="hover:text-blue-400 lg:block hidden"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="hover:text-blue-400 lg:hidden block"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
          {MENU_ITEMS.filter(item => item.roles.includes(user.role)).map(item => (
            <Link
              key={item.id}
              to={`/${item.id}`}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center p-3 rounded-xl transition-all ${activePath === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              {item.icon}
              {(isSidebarOpen || isMobileMenuOpen) && <span className="ml-3 font-bold text-sm whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setUser(null)} className="flex items-center w-full p-3 text-slate-400 hover:text-red-400 transition-colors font-bold text-sm">
            <LogOut size={20} />
            {(isSidebarOpen || isMobileMenuOpen) && <span className="ml-3">Sair da Conta</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 shadow-sm z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest truncate max-w-[120px] md:max-w-none">
              {activePath}
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button className="relative text-gray-400 hover:text-blue-600 transition-colors p-2">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-6 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate max-w-[100px]">{user.name}</p>
                <p className="text-[10px] text-blue-500 font-bold uppercase">{user.role}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black border-2 border-blue-200 text-sm md:text-base">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC]">
          {children}
        </section>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/" element={<Layout><DashboardView /></Layout>} />
          <Route path="/dashboard" element={<Layout><DashboardView /></Layout>} />
          <Route path="/clients" element={<Layout><ClientsView /></Layout>} />
          <Route path="/tasks" element={<Layout><TasksView /></Layout>} />
          <Route path="/calendar" element={<Layout><CalendarView /></Layout>} />
          <Route path="/financial" element={<Layout><FinancialView /></Layout>} />
          <Route path="/ads" element={<Layout><AdsView /></Layout>} />
          <Route path="/chat" element={<Layout><ChatView /></Layout>} />
          <Route path="/billing" element={<Layout><BillingView /></Layout>} />

          <Route path="/settings" element={<Layout><SettingsView /></Layout>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
