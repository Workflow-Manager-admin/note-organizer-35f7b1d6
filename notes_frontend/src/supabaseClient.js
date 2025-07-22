import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// PUBLIC_INTERFACE
export const supabase = createClient(supabaseUrl, supabaseKey);
/** This is the single shared Supabase client for use in API requests. */
