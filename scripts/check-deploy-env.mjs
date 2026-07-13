const isDemoMode = process.env.VITE_DEMO_MODE === 'true';

if (isDemoMode) {
  console.log('[predeploy] Demo mode enabled; Supabase variables are not required.');
  process.exit(0);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
const missingVariables = [
  !supabaseUrl && 'VITE_SUPABASE_URL',
  !supabaseKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean);

if (missingVariables.length > 0) {
  console.error(`[predeploy] Missing required variables: ${missingVariables.join(', ')}`);
  process.exit(1);
}

try {
  const parsedUrl = new URL(supabaseUrl);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('unsupported protocol');
} catch {
  console.error('[predeploy] VITE_SUPABASE_URL must be a valid HTTP(S) URL.');
  process.exit(1);
}

if (supabaseKey.length < 20) {
  console.error('[predeploy] VITE_SUPABASE_ANON_KEY is not a plausible public API key.');
  process.exit(1);
}

console.log('[predeploy] Supabase deployment variables are present.');
