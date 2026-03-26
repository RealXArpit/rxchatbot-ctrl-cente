import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktrebirmqmckvnibhnsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cmViaXJtcW1ja3ZuaWJobnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTU2NzMsImV4cCI6MjA4ODI5MTY3M30.WLFVw6kCPSv1d9ZxtswU6zqmNMU_HoC3k6Z8_qPRmXg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'rxchatbot-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
