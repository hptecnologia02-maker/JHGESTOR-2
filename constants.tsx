
import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  DollarSign,
  Settings,
  MessageSquare,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'USER'] },
  { id: 'tasks', label: 'Tarefas', icon: <CheckSquare size={20} />, roles: ['ADMIN', 'USER'] },
  { id: 'calendar', label: 'Agenda', icon: <Calendar size={20} />, roles: ['ADMIN', 'USER'] },

  { id: 'clients', label: 'Clientes', icon: <Users size={20} />, roles: ['ADMIN'] },
  { id: 'financial', label: 'Financeiro', icon: <DollarSign size={20} />, roles: ['ADMIN'] },
  { id: 'ads', label: 'Meta Ads', icon: <TrendingUp size={20} />, roles: ['ADMIN', 'USER'] },
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={20} />, roles: ['ADMIN', 'USER'] },
  { id: 'billing', label: 'Assinatura', icon: <CreditCard size={20} />, roles: ['ADMIN'] },
  { id: 'settings', label: 'Configurações', icon: <Settings size={20} />, roles: ['ADMIN', 'USER'] },
];

export const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};

// Configurações do Sistema
export const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '748657001200436'; // Use VITE_FACEBOOK_APP_ID in .env
