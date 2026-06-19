import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

const validUrl = url.startsWith("https://") || url.startsWith("http://");

export const supabaseConfigured = Boolean(url && key && validUrl);

export const supabase = supabaseConfigured
  ? (() => { try { return createClient(url, key); } catch { return null; } })()
  : null;
