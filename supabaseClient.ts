import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ybcvugqgtbsgvjfzhoas.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY3Z1Z3FndGJzZ3ZqZnpob2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMDM3MzIsImV4cCI6MjA4NDg3OTczMn0.QBnEx293amkDhqEwCM5t8Nt8BOWnSjhFKg7tZ65NX-g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
