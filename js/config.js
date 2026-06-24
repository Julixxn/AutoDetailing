// AUTOFREAK – Supabase Konfiguration
// 1. Gehe zu https://supabase.com → kostenloses Konto erstellen
// 2. Neues Projekt erstellen
// 3. Settings > API → URL und anon key kopieren und hier eintragen

const SUPABASE_URL = 'DEINE_SUPABASE_URL_HIER';
const SUPABASE_ANON_KEY = 'DEIN_SUPABASE_ANON_KEY_HIER';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);