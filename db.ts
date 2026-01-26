
import { Client, Task, CalendarEvent, Transaction, Message, User, MetaAdsData, TaskComment, PlanType, SubscriptionStatus, Supplier, Attachment, ChatGroup } from './types';
import { supabase } from './supabaseClient';

/**
 * SQL SCHEMA FOR SUPABASE (Run this in Supabase SQL Editor):
 * 
 * -- Enable UUID extension
 * CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 * 
 * -- Users Table
 * CREATE TABLE users (
 *   id TEXT PRIMARY KEY,
 *   owner_id TEXT,
 *   name TEXT NOT NULL,
 *   email TEXT UNIQUE NOT NULL,
 *   role TEXT DEFAULT 'USER',
 *   status TEXT DEFAULT 'ACTIVE',
 *   plan TEXT DEFAULT 'FREE',
 *   password TEXT,
 *   google_calendar_connected BOOLEAN DEFAULT FALSE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- Clients Table
 * CREATE TABLE clients (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   owner_id TEXT REFERENCES users(id),
 *   name TEXT NOT NULL,
 *   email TEXT,
 *   phone TEXT,
 *   observations TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- Tasks Table
 * CREATE TABLE tasks (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   owner_id TEXT REFERENCES users(id),
 *   title TEXT NOT NULL,
 *   description TEXT,
 *   status TEXT DEFAULT 'PENDING',
 *   responsible_id TEXT REFERENCES users(id),
 *   deadline TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- Task Comments
 * CREATE TABLE task_comments (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
 *   user_id TEXT REFERENCES users(id),
 *   user_name TEXT,
 *   content TEXT NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- Transactions
 * CREATE TABLE transactions (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   owner_id TEXT REFERENCES users(id),
 *   description TEXT NOT NULL,
 *   amount DECIMAL(12,2) NOT NULL,
 *   type TEXT NOT NULL,
 *   date TEXT NOT NULL,
 *   category TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- Calendar Events
 * CREATE TABLE events (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   owner_id TEXT REFERENCES users(id),
 *   user_id TEXT REFERENCES users(id),
 *   title TEXT NOT NULL,
 *   start_time TEXT NOT NULL,
 *   end_time TEXT NOT NULL,
 *   description TEXT,
 *   is_google_event BOOLEAN DEFAULT FALSE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- Suppliers
 * CREATE TABLE suppliers (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   owner_id TEXT REFERENCES users(id),
 *   name TEXT NOT NULL,
 *   contact TEXT,
 *   email TEXT,
 *   category TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 */

const SESSION_KEY = 'JHGESTOR_SESSION';

export const getSessionUser = (): User | null => {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    const user = JSON.parse(data);
    // Normalize to camelCase if needed
    return {
      ...user,
      ownerId: user.ownerId || user.owner_id,
      googleCalendarConnected: user.googleCalendarConnected ?? user.google_calendar_connected
    } as User;
  } catch (e) {
    return null;
  }
};

export const setSessionUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const api = {
  // Auth
  getProfile: async (userId: string): Promise<User | null> => {
    console.log("API: Fetching profile for", userId);
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile) return null;

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      plan: profile.plan,
      ownerId: profile.owner_id || profile.id, // Fallback to itself if owner_id missing
      googleCalendarConnected: profile.google_calendar_connected,
      googleAccessToken: profile.google_access_token,
      googleTokenExpiry: profile.google_token_expiry
    } as User;
  },

  login: async (email: string, password: string): Promise<User | null> => {
    console.log("API: Login attempt via Supabase Auth for", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.warn("API: Login failed", error);
      return null;
    }

    const authUser = data.user;

    // Auto-Register/Sync public.users record
    const { data: upsertedProfile, error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata.name || 'Usuário',
        role: authUser.user_metadata.role || 'ADMIN',
        owner_id: authUser.user_metadata.owner_id || authUser.id,
        status: authUser.user_metadata.status || 'ACTIVE',
        plan: authUser.user_metadata.plan || 'FREE'
      })
      .select()
      .single();

    if (upsertError) console.error("API: Failed to sync public user record:", upsertError);

    const profile = upsertedProfile;

    const user = {
      id: authUser.id,
      name: profile?.name || authUser.user_metadata.name || 'Usuário',
      email: authUser.email || '',
      role: profile?.role || authUser.user_metadata.role || 'USER',
      status: profile?.status || authUser.user_metadata.status || 'ACTIVE',
      plan: profile?.plan || authUser.user_metadata.plan || 'FREE',
      ownerId: profile?.owner_id || authUser.user_metadata.owner_id || authUser.id,
      googleCalendarConnected: profile?.google_calendar_connected || false,
      googleAccessToken: profile?.google_access_token || null,
      googleTokenExpiry: profile?.google_token_expiry || null
    } as User;

    console.log("API: Login success, unified user established:", user.email);
    return user;
  },

  getUsers: async (ownerId?: string) => {
    console.log("Fetching users for owner:", ownerId);
    let query = supabase.from('users').select('*');
    if (ownerId) query = query.eq('owner_id', ownerId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(u => ({
      ...u,
      ownerId: u.owner_id,
      googleCalendarConnected: u.google_calendar_connected
    })) as User[];
  },

  addUser: async (user: Omit<User, 'id' | 'status' | 'plan' | 'ownerId'> & { ownerId?: string }) => {
    if (user.ownerId) {
      const id = 'U_' + Date.now().toString();
      const { data, error } = await supabase.from('users').insert([{
        id,
        name: user.name,
        email: user.email,
        password: (user as any).password,
        role: user.role || 'USER',
        owner_id: user.ownerId,
        status: 'ACTIVE',
        plan: 'FREE'
      }]).select().single();
      if (error) throw error;
      return { ...data, ownerId: data.owner_id } as User;
    }

    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: (user as any).password,
      options: { data: { name: user.name, role: 'ADMIN', status: 'ACTIVE', plan: 'FREE' } }
    });

    if (error || !data.user) throw error;
    const newOwnerId = data.user.id;
    await supabase.auth.updateUser({ data: { owner_id: newOwnerId } });
    const mapped = { id: newOwnerId, name: user.name, email: user.email, role: 'ADMIN', ownerId: newOwnerId, status: 'ACTIVE', plan: 'FREE' } as User;
    await supabase.from('users').upsert({ id: mapped.id, name: mapped.name, email: mapped.email, role: mapped.role, owner_id: mapped.ownerId, status: mapped.status, plan: mapped.plan });
    return mapped;
  },

  deleteUser: async (id: string) => {
    await supabase.from('users').delete().eq('id', id);
  },

  updateUserSubscription: async (userId: string, plan: PlanType, status: SubscriptionStatus) => {
    await supabase.from('users').update({ plan, status }).eq('id', userId);
  },

  processPayment: async (userId: string, amount: number, plan: PlanType) => {
    await supabase.from('users').update({ plan, status: 'ACTIVE' }).eq('id', userId);
  },

  getClients: async (ownerId?: string) => {
    let query = supabase.from('clients').select('*');
    if (ownerId) query = query.eq('owner_id', ownerId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(c => ({ ...c, ownerId: c.owner_id, createdAt: c.created_at })) as Client[];
  },

  addClient: async (client: Omit<Client, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('clients').insert([{
      owner_id: client.ownerId, name: client.name, email: client.email, phone: client.phone, observations: client.observations
    }]).select().single();
    if (error) throw error;
    return { ...data, ownerId: data.owner_id, createdAt: data.created_at } as Client;
  },

  updateClient: async (id: string, updates: Partial<Client>) => {
    await supabase.from('clients').update({ name: updates.name, email: updates.email, phone: updates.phone, observations: updates.observations }).eq('id', id);
  },

  deleteClient: async (id: string) => {
    await supabase.from('clients').delete().eq('id', id);
  },

  getTasks: async (ownerId?: string) => {
    let query = supabase.from('tasks').select('*, task_comments(*)');
    if (ownerId) query = query.eq('owner_id', ownerId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(t => ({
      ...t, ownerId: t.owner_id, responsibleId: t.responsible_id, createdAt: t.created_at,
      comments: (t.task_comments || []).map((tc: any) => ({ ...tc, taskId: tc.task_id, userId: tc.user_id, userName: tc.user_name, createdAt: tc.created_at }))
    })) as Task[];
  },

  addTask: async (task: Omit<Task, 'id' | 'comments'>) => {
    const { data, error } = await supabase.from('tasks').insert([{
      owner_id: task.ownerId, title: task.title, description: task.description, status: task.status, responsible_id: task.responsibleId, deadline: task.deadline
    }]).select().single();
    if (error) throw error;
    return { ...data, ownerId: data.owner_id, responsibleId: data.responsible_id, createdAt: data.created_at, comments: [] } as Task;
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    const fields: any = {};
    if (updates.title) fields.title = updates.title;
    if (updates.description) fields.description = updates.description;
    if (updates.status) fields.status = updates.status;
    if (updates.responsibleId) fields.responsible_id = updates.responsibleId;
    if (updates.deadline) fields.deadline = updates.deadline;
    await supabase.from('tasks').update(fields).eq('id', id);
  },

  addTaskComment: async (taskId: string, comment: Omit<TaskComment, 'id' | 'createdAt'>) => {
    await supabase.from('task_comments').insert([{ task_id: taskId, user_id: comment.userId, user_name: comment.userName, content: comment.content }]);
  },

  deleteTask: async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
  },

  getTransactions: async (ownerId?: string) => {
    let query = supabase.from('transactions').select('*');
    if (ownerId) query = query.eq('owner_id', ownerId);
    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(t => ({ ...t, ownerId: t.owner_id })) as Transaction[];
  },

  addTransaction: async (tx: Omit<Transaction, 'id'>) => {
    const { data, error } = await supabase.from('transactions').insert([{
      owner_id: tx.ownerId, description: tx.description, amount: tx.amount, type: tx.type, date: tx.date, category: tx.category
    }]).select().single();
    if (error) throw error;
    return data as Transaction;
  },

  getEvents: async (ownerId?: string, userId?: string) => {
    let query = supabase.from('events').select('*');
    if (ownerId) query = query.eq('owner_id', ownerId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(e => ({ ...e, ownerId: e.owner_id, userId: e.user_id, start: e.start_time, end: e.end_time, isGoogleEvent: e.is_google_event })) as CalendarEvent[];
  },

  addEvent: async (event: Omit<CalendarEvent, 'id'>) => {
    const { data, error } = await supabase.from('events').insert([{
      owner_id: event.ownerId, user_id: event.userId, title: event.title, start_time: event.start, end_time: event.end, description: event.description, is_google_event: event.isGoogleEvent
    }]).select().single();
    if (error) throw error;
    return { ...data, start: data.start_time, end: data.end_time, isGoogleEvent: data.is_google_event, ownerId: data.owner_id, userId: data.user_id } as CalendarEvent;
  },

  mergeGoogleEvents: async (userId: string, events: any[], token: string, timeMin?: string) => {
    // 1. Fetch correct owner_id to satisfy RLS
    const { data: uData } = await supabase.from('users').select('owner_id').eq('id', userId).single();

    // CORRECTION: If owner_id is missing in DB, self-assign it immediately to allow RLS to pass
    let validOwnerId = uData?.owner_id;
    if (!validOwnerId) {
      console.warn("API: User missing owner_id, self-correcting...");
      await supabase.from('users').update({ owner_id: userId }).eq('id', userId);
      validOwnerId = userId;
    }

    const expiry = Date.now() + (3600 * 1000); // 1h
    await supabase.auth.updateUser({ data: { google_calendar_connected: true, google_access_token: token, google_token_expiry: expiry } });
    await supabase.from('users').update({ google_calendar_connected: true, google_access_token: token, google_token_expiry: expiry }).eq('id', userId);

    if (events.length > 0) {
      console.log(`API: Syncing ${events.length} events for user ${userId} (Owner: ${validOwnerId})`);
      const formatted = events.map(e => ({
        owner_id: validOwnerId,
        user_id: userId,
        title: e.title,
        start_time: e.start,
        end_time: e.end,
        description: e.description,
        is_google_event: true,
        google_event_id: e.googleEventId || e.id
      }));

      const { error: upsertError } = await supabase.from('events').upsert(formatted, { onConflict: 'google_event_id' });
      if (upsertError) throw upsertError;

      // DELETION SYNC
      const incomingIds = events.map(e => e.googleEventId || e.id);
      let deleteQuery = supabase.from('events').delete().eq('user_id', userId).eq('is_google_event', true).not('google_event_id', 'in', `(${incomingIds.join(',')})`);
      if (timeMin) deleteQuery = deleteQuery.gte('start_time', timeMin);
      await deleteQuery;
    }
  },

  disconnectGoogle: async (userId: string) => {
    await supabase.auth.updateUser({ data: { google_calendar_connected: false, google_access_token: null, google_token_expiry: null } });
    await supabase.from('users').update({ google_calendar_connected: false, google_access_token: null, google_token_expiry: null }).eq('id', userId);
    await supabase.from('events').delete().eq('user_id', userId).eq('is_google_event', true);
  },

  getSuppliers: async (ownerId?: string) => {
    let query = supabase.from('suppliers').select('*');
    if (ownerId) query = query.eq('owner_id', ownerId);
    const { data, error } = await query.order('name');
    if (error) throw error;
    return (data || []).map(s => ({ ...s, ownerId: s.owner_id, createdAt: s.created_at })) as Supplier[];
  },

  addSupplier: async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('suppliers').insert([{
      owner_id: supplier.ownerId, name: supplier.name, contact: supplier.contact, email: supplier.email, category: supplier.category
    }]).select().single();
    if (error) throw error;
    return { ...data, ownerId: data.owner_id, createdAt: data.created_at } as Supplier;
  },

  deleteSupplier: async (id: string) => {
    await supabase.from('suppliers').delete().eq('id', id);
  },

  getMessages: async (ownerId?: string): Promise<Message[]> => {
    let query = supabase.from('messages').select('*');
    if (ownerId) query = query.eq('owner_id', ownerId);
    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(m => ({ ...m, ownerId: m.owner_id, senderId: m.sender_id, senderName: m.sender_name, receiverId: m.receiver_id, timestamp: m.created_at, readBy: m.read_by })) as Message[];
  },

  sendMessage: async (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase.from('messages').insert([{
      owner_id: msg.ownerId, sender_id: msg.senderId, sender_name: msg.senderName, receiver_id: msg.receiverId, content: msg.content, attachments: msg.attachments, read_by: [msg.senderId]
    }]).select().single();
    if (error) throw error;
    return { ...data, ownerId: data.owner_id, senderId: data.sender_id, senderName: data.sender_name, receiverId: data.receiver_id, timestamp: data.created_at, readBy: data.read_by } as Message;
  },

  markMessagesAsRead: async (receiverId: string, userId: string) => {
    const { data: unread } = await supabase.from('messages').select('*').eq('receiver_id', receiverId);
    if (unread) {
      const updates = unread.filter(m => !m.read_by.includes(userId)).map(m => ({ ...m, read_by: [...m.read_by, userId] }));
      if (updates.length > 0) await supabase.from('messages').upsert(updates);
    }
  },

  getChatGroups: async (ownerId?: string): Promise<ChatGroup[]> => {
    let query = supabase.from('chat_groups').select('*');
    if (ownerId) query = query.eq('owner_id', ownerId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(g => ({ ...g, ownerId: g.owner_id, createdBy: g.created_by, createdAt: g.created_at })) as ChatGroup[];
  },

  createChatGroup: async (group: Omit<ChatGroup, 'id' | 'createdAt'>) => {
    const id = 'group_' + Date.now().toString();
    const { data, error } = await supabase.from('chat_groups').insert([{
      id, owner_id: group.ownerId, name: group.name, description: group.description, created_by: group.createdBy, members: group.members
    }]).select().single();
    if (error) throw error;
    return { ...data, ownerId: data.owner_id, createdBy: data.created_by, createdAt: data.created_at } as ChatGroup;
  },

  deleteChatGroup: async (id: string) => {
    await supabase.from('chat_groups').delete().eq('id', id);
    await supabase.from('messages').delete().eq('receiver_id', id);
  },

  getAdsMetrics: async (ownerId?: string): Promise<MetaAdsData> => {
    return { ownerId: ownerId || '1', leads: 154, reach: 42000, impressions: 98000, costPerResult: 1.85, period: 'Dez 2024' };
  },

  getMetaConfig: async (ownerId: string) => {
    const { data, error } = await supabase.from('meta_configs').select('*').eq('owner_id', ownerId).maybeSingle();
    if (error) return {};
    return data ? { accessToken: data.access_token, adAccountId: data.ad_account_id, adAccountName: data.ad_account_name } : {};
  },

  saveMetaConfig: async (ownerId: string, token: string, accountId: string, accountName: string) => {
    await supabase.from('meta_configs').upsert({ owner_id: ownerId, access_token: token, ad_account_id: accountId, ad_account_name: accountName, updated_at: new Date().toISOString() });
  },

  clearMetaConfig: async (ownerId: string) => {
    await supabase.from('meta_configs').delete().eq('owner_id', ownerId);
  }
};
