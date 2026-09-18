// The AI assistant, Cloudinary upload signing, and geocoding all need a
// server with secret API keys — this app is a static Capacitor bundle with
// no backend of its own, so those three features call out to the deployed
// MamaFresh web app's API routes instead. Set VITE_API_BASE_URL to that
// deployment's origin (e.g. https://mamafresh.vercel.app).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
