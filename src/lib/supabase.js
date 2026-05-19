import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bdmdperizxiursedgnqh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GtBYVNYmdiY_nwLmMoN19A_sVcqyQTF';

// Set to true to persist data to Supabase (visible to all users).
// When false, the app runs entirely on localStorage as before.
export const USE_CLOUD = true;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
