import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 1. Load env file based on `mode` (useful for local development .env)
  // Fix: Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');

  // 2. Create a specific map of process.env variables.
  // We prioritize the system variable (process.env.KEY) which Vercel uses,
  // and fallback to the loaded .env file (env.KEY) for local dev.
  const processEnvValues = {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
    'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(process.env.REACT_APP_SUPABASE_URL || env.REACT_APP_SUPABASE_URL),
    'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(process.env.REACT_APP_SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY),
    'process.env.REACT_APP_STRIPE_PAYMENT_LINK': JSON.stringify(process.env.REACT_APP_STRIPE_PAYMENT_LINK || env.REACT_APP_STRIPE_PAYMENT_LINK),
  };

  return {
    plugins: [react()],
    define: processEnvValues
  };
});