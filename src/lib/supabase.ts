import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  ?? 'https://ktrebirmqmckvnibhnsl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cmViaXJtcW1ja3ZuaWJobnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTU2NzMsImV4cCI6MjA4ODI5MTY3M30.WLFVw6kCPSv1d9ZxtswU6zqmNMU_HoC3k6Z8_qPRmXg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
