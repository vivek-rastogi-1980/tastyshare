import { createClient } from '@supabase/supabase-js';

const supabaseUrl = https://hbupdjyrblcvyswblacz.supabase.co;
const supabaseAnonKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidXBkanlyYmxjdnlzd2JsYWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzc3MzIsImV4cCI6MjA2ODk1MzczMn0.4p-FrgpOMd0IcSPZBHuJN52EC7z_jzDoXjo2920Al8s;

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
