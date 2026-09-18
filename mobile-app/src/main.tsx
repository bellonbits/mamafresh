import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import './index.css'
import App from './App.tsx'

// Reserve the native status bar's own space instead of letting the WebView
// render underneath it — without this, content (and text) collides with the
// clock/battery/signal icons at the top of the screen.
if (Capacitor.isNativePlatform()) {
  void StatusBar.setOverlaysWebView({ overlay: false })
  void StatusBar.setBackgroundColor({ color: '#073729' })
  void StatusBar.setStyle({ style: Style.Light })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
