import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Base client for auth verification only
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates a Supabase client authenticated as the requesting user.
 * This ensures RLS policies (auth.uid() = user_id) work correctly.
 */
export function createUserClient(accessToken) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
