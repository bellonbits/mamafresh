import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mamafresh.app',
  appName: 'MamaFresh',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#073729',
    },
    // Capacitor's native HTTP bridge intercepts fetch()/XHR and routes them
    // through native code (to sidestep CORS) — but it doesn't reliably support
    // how supabase-js builds requests, and fails with a generic
    // "TypeError: Load failed" even though the underlying connection succeeds.
    // Disable it so the WebView uses real browser fetch instead.
    CapacitorHttp: {
      enabled: false,
    },
  },
};

export default config;
