import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PanelProvider } from './contexts/PanelContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PanelProvider>
      <App />
    </PanelProvider>
  </StrictMode>,
)
