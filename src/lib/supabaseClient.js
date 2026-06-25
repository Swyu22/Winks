const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_MISSING_ENV_ERROR =
  '缺少 Supabase 环境变量，请检查 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。';

const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClientPromise = null;

export const getSupabaseInitError = (useDemoMode) => {
  if (useDemoMode) {
    return '';
  }

  return hasSupabaseEnv ? '' : SUPABASE_MISSING_ENV_ERROR;
};

export const getSupabaseClient = async ({ useDemoMode }) => {
  if (useDemoMode) {
    return null;
  }

  if (!hasSupabaseEnv) {
    return null;
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }),
      )
      .catch((error) => {
        supabaseClientPromise = null;
        throw error;
      });
  }

  return supabaseClientPromise;
};

// Warm DNS/TLS to the database origin and kick off the SDK chunk download as soon as
// this module loads (in parallel with React mounting), so the first query isn't
// serialized behind a cold dynamic import + connection setup. Best-effort; a no-op in
// demo mode or when env is missing.
const warmSupabase = () => {
  if (!hasSupabaseEnv || import.meta.env?.VITE_DEMO_MODE === 'true') return;

  if (typeof document !== 'undefined') {
    try {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = new URL(supabaseUrl).origin;
      preconnect.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect);
    } catch {
      // malformed URL — skip the hint, the query path still works
    }
  }

  void getSupabaseClient({ useDemoMode: false }).catch(() => {});
};

warmSupabase();
