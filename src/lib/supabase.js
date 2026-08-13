import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// True only when both keys are present — App shows a setup screen otherwise
// instead of crashing to a blank page.
export const configured = Boolean(url && anonKey)

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'public-anon-key-not-set',
  { auth: { persistSession: true, autoRefreshToken: true } },
)
