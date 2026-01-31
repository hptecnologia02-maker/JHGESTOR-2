
export type UserRole = 'ADMIN' | 'USER';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'BLOCKED';
export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  status: SubscriptionStatus;
  plan: PlanType;
  trialEndsAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  googleCalendarConnected?: boolean;
  googleAccessToken?: string;
  googleTokenExpiry?: number;
  ownerId: string; // ID do Admin dono do sistema
}

export interface Client {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  phone: string;
  observations: string;
  createdAt: string;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
}

export interface TaskComment {
  id: string;
  ownerId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface Task {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  status: TaskStatus;
  responsibleId: string;
  deadline: string;
  comments: TaskComment[];
  attachments?: Attachment[];
}

export interface CalendarEvent {
  id: string;
  ownerId: string;
  userId: string;
  title: string;
  start: string;
  end: string;
  description: string;
  isGoogleEvent?: boolean;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  ownerId: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  category: string;
}


export interface ChatGroup {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  createdBy: string;
  members: string[]; // User IDs
  createdAt: string;
}

export interface Message {
  id: string;
  ownerId: string;
  senderId: string;
  senderName: string;
  receiverId: string; // Can be user ID or group ID (prefixed with 'group_')
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  readBy?: string[]; // Array of User IDs
}

export interface MetaAdsData {
  ownerId: string;
  leads: number;
  reach: number;
  impressions: number;
  costPerResult: number;
  period: string;
}

export interface Supplier {
  id: string;
  ownerId: string;
  name: string;
  contact: string;
  email: string;
  category: string;
  createdAt: string;
}
