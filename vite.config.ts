
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // We explicitly define these to ensure they are available globally
  // even if they don't start with VITE_
  const processEnvValues = {
    'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY),
    'process.env.GOOGLE_SEARCH_KEY': JSON.stringify(env.GOOGLE_SEARCH_KEY || env.VITE_GOOGLE_SEARCH_KEY),
    'process.env.GOOGLE_SEARCH_CX': JSON.stringify(env.GOOGLE_SEARCH_CX || env.VITE_GOOGLE_SEARCH_CX),
    'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL || env.VITE_SUPABASE_URL),
    'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(env.REACT_APP_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
    'process.env.REACT_APP_STRIPE_PAYMENT_LINK': JSON.stringify(env.REACT_APP_STRIPE_PAYMENT_LINK || env.VITE_STRIPE_PAYMENT_LINK),
    'process.env.REACT_APP_STRIPE_PORTAL_LINK': JSON.stringify(env.REACT_APP_STRIPE_PORTAL_LINK || env.VITE_STRIPE_PORTAL_LINK),
    'process.env.AGENT_PASSWORD': JSON.stringify(env.AGENT_PASSWORD || env.VITE_AGENT_PASSWORD),
    // Also map to import.meta.env for standard Vite usage if needed manually
    'import.meta.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY),
  };

  return {
    plugins: [react()],
    define: processEnvValues
  };
});
