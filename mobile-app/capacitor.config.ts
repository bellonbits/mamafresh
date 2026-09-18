import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mamafresh.app',
  appName: 'MamaFresh',
  webDir: 'dist',
  // By default iOS serves the app from the custom "capacitor://localhost"
  // scheme, which can trip up CORS handling for external APIs (Supabase
  // included) — some responses that satisfy a normal https:// origin fail
  // for this non-standard one, surfacing as a generic "TypeError: Load
  // failed" with no further detail. Presenting as a plain https origin
  // avoids the whole class of problem.
  server: {
    iosScheme: 'https',
    androidScheme: 'https',
    hostname: 'localhost',
  },
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
