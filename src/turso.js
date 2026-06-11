import { createClient } from '@libsql/client/web';

const tursoUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TURSO_URL) 
  || (typeof process !== 'undefined' && process.env && process.env.VITE_TURSO_URL) 
  || '';

const tursoAuthToken = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TURSO_AUTH_TOKEN) 
  || (typeof process !== 'undefined' && process.env && process.env.VITE_TURSO_AUTH_TOKEN) 
  || '';

export const turso = tursoUrl ? createClient({
  url: tursoUrl,
  authToken: tursoAuthToken
}) : null;
