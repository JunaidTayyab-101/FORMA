import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Supabase env variables are missing. Copy .env.example to .env and fill them in.");
}

export const supabase = createClient(url || "http://invalid.local", key || "missing");
