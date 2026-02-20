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
