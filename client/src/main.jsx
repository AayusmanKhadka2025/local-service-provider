import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Remove BrowserRouter from here
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)