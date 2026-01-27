import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lizqksnnzwmnqvmtkgnt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpenFrc25uendtbnF2bXRrZ250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDM3MzgsImV4cCI6MjA4NTExOTczOH0.r-NMXcqIBxmFK6XrOJo7k13UgzO-iV3bpTzUAe5WJwo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
