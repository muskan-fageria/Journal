import { supabase } from './supabase';

/**
 * Authenticated fetch wrapper.
 * Automatically attaches the Supabase JWT access_token
 * as a Bearer token in the Authorization header.
 */
export const authFetch = async (url, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};
