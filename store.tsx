import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Client, Task, CalendarEvent, Transaction, Message, MetaAdsData, ChatGroup } from './types';
import { getSessionUser, setSessionUser, api } from './db';

interface AppContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  clients: Client[];
  tasks: Task[];
  transactions: Transaction[];
  events: CalendarEvent[];
  messages: Message[];
  chatGroups: ChatGroup[];
  adsMetrics: MetaAdsData | null;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getSessionUser());
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [adsMetrics, setAdsMetrics] = useState<MetaAdsData | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    console.log("refreshData: Triggered at", new Date().toLocaleTimeString());

    if (isRefreshing) {
      console.warn("refreshData: Already refreshing, skipping...");
      return;
    }

    if (!user) {
      console.log("refreshData: Aborted - No active user session.");
      return;
    }

    setIsRefreshing(true);
    try {
      const currentUserId = user.id;
      const currentOwnerId = user.ownerId;
      console.log("refreshData: Fetching for OwnerID", currentOwnerId);

      const [c, t, tx, ev, m, g, ads, profile] = await Promise.all([
        api.getClients(currentOwnerId),
        api.getTasks(currentOwnerId),
        api.getTransactions(currentOwnerId),
        api.getEvents(currentOwnerId, currentUserId),
        api.getMessages(currentOwnerId),
        api.getChatGroups(currentOwnerId),
        api.getAdsMetrics(currentOwnerId),
        api.getProfile(currentUserId)
      ]);

      console.log("refreshData: Results", { clients: c?.length, tasks: t?.length });

      setClients(c || []);
      setTasks(t || []);
      setTransactions(tx || []);
      setEvents(ev || []);
      setMessages(m || []);
      setChatGroups(g || []);
      setAdsMetrics(ads || null);
      if (profile) setUser(profile);

    } catch (err) {
      console.error("refreshData: FAILED", err);
    } finally {
      setIsRefreshing(false);
      console.log("refreshData: Finished");
    }
  };

  useEffect(() => {
    refreshData();
  }, [user?.id]);

  useEffect(() => {
    setSessionUser(user);
  }, [user]);

  return (
    <AppContext.Provider value={{
      user, setUser, clients, tasks, transactions, events, messages, chatGroups, adsMetrics, refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
