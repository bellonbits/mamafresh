import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import './index.css'
import App from './App.tsx'

// Reserve the native status bar's own space instead of letting the WebView
// render underneath it — without this, content (and text) collides with the
// clock/battery/signal icons at the top of the screen.
//
// Android 15+ (API 35 with the opt-out flag unset) and Android 16+ (API 36,
// no opt-out at all) force edge-to-edge and silently ignore
// `overlay: false` — see @capacitor/status-bar's StatusBar.java
// shouldSetStatusBarColor(). So on Android we embrace the overlay instead
// and reserve space with `env(safe-area-inset-top)` in CSS (see the banner
// components), the same mechanism iOS already relies on for notches.
if (Capacitor.isNativePlatform()) {
  void StatusBar.setOverlaysWebView({ overlay: Capacitor.getPlatform() === 'android' })
  void StatusBar.setBackgroundColor({ color: '#073729' })
  void StatusBar.setStyle({ style: Style.Light })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
