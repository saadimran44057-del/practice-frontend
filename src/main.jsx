import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'

// console.log('Google client id:', JSON.stringify(import.meta.env.VITE_GOOGLE_CLIENT_ID));
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Gives the "Continue with Google" button your Google client ID */}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)