
import React, { useState } from 'react';
import { useApp } from '../store';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../db';
import { Mail, Lock, ShieldCheck } from 'lucide-react';

const LoginView: React.FC = () => {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@jhgestor.com');
  const [password, setPassword] = useState('123456'); // Senha padrão atualizada no db.ts também

  if (user && !isRegistering) return <Navigate to="/dashboard" />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const foundUser = await api.login(email, password);
      if (foundUser) {
        setUser(foundUser);
      } else {
        alert('Credenciais inválidas: O usuário não foi encontrado ou a senha está incorreta no novo sistema de segurança.');
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      alert('Erro ao realizar login: ' + (err.message || 'Erro desconhecido. Verifique se o "Confirm email" está desativado no Supabase.'));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await api.addUser({
        name,
        email,
        password,
        role: 'ADMIN'
      });

      setUser(newUser);
      navigate('/billing');
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar cadastro.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-10 text-center text-white">
          <h1 className="text-3xl font-bold tracking-tighter mb-2">JHGESTOR</h1>
          <p className="text-blue-100 opacity-80">Portal de Gestão Inteligente</p>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="p-10 space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setIsRegistering(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isRegistering ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all relative ${isRegistering ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              Cadastro
              {isRegistering && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full animate-bounce">
                  7 DIAS GRÁTIS
                </span>
              )}
            </button>
          </div>

          {isRegistering && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 uppercase">Nome Completo</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all"
                  placeholder="Seu nome"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 uppercase">E-mail Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all"
                placeholder="nome@empresa.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 uppercase">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            {isRegistering ? 'Criar Minha Conta' : 'Acessar Sistema'} <ShieldCheck size={20} />
          </button>
        </form>

        <div className="p-6 bg-gray-50 border-t text-center">
          <p className="text-sm text-gray-600">Problemas no acesso? <a href="#" className="text-blue-600 font-bold">Fale com o suporte</a></p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
