import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// Fail fast and log clear error in development if env vars are missing
if (!supabaseUrl || !supabaseKey) {
  // PUBLIC_INTERFACE
  // Describe the error for devs in console and with thrown Error
  throw new Error(
    `[Supabase Config Error] Missing environment variable(s):\n` +
    `  REACT_APP_SUPABASE_URL: ${supabaseUrl ? '[present]' : '[MISSING]'}\n` +
    `  REACT_APP_SUPABASE_KEY: ${supabaseKey ? '[present]' : '[MISSING]'}\n` +
    'Check that your .env file is set up at project root for Create React App, the server is restarted after editing .env, and that you use the "REACT_APP_" prefix.'
  );
}

// PUBLIC_INTERFACE
export const supabase = createClient(supabaseUrl, supabaseKey);
/** This is the single shared Supabase client for use in API requests. */
