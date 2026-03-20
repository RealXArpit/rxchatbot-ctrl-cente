import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Create a real client only when credentials are provided.
// Otherwise export a dummy that always returns empty results,
// allowing the app to fall back to mock data without crashing.
function createSafeClient(): SupabaseClient {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  // Minimal stub so .from().select() etc. resolve without throwing
  const emptyResponse = { data: [], error: null, count: null, status: 200, statusText: 'OK' };
  const singleResponse = { data: null, error: { message: 'Supabase not configured', details: '', hint: '', code: 'NOT_CONFIGURED' }, count: null, status: 500, statusText: 'Not Configured' };

  const chainable: any = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') return undefined; // not a thenable
      if (prop === 'single' || prop === 'maybeSingle') return () => Promise.resolve(singleResponse);
      return (..._args: any[]) => {
        // Terminal methods resolve, builder methods return the proxy
        if (['then'].includes(prop as string)) return undefined;
        return chainable;
      };
    },
  });

  // Make the proxy itself awaitable — resolves to emptyResponse
  const awaitableChainable: any = new Proxy(chainable, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: any) => resolve(emptyResponse);
      }
      if (prop === 'single' || prop === 'maybeSingle') return () => Promise.resolve(singleResponse);
      const val = Reflect.get(target, prop);
      if (typeof val === 'function') {
        return (...args: any[]) => awaitableChainable;
      }
      return awaitableChainable;
    },
  });

  return {
    from: () => awaitableChainable,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    functions: { invoke: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) },
    storage: { from: () => awaitableChainable },
    rpc: () => Promise.resolve(emptyResponse),
  } as unknown as SupabaseClient;
}

export const supabase = createSafeClient();
export default supabase;
