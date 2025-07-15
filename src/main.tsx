import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
mixpanel.init('468d63ce8c7bdc7b2936c5ae2db19788', {
  debug: true, // Set to false in production
  track_pageview: true,
  persistence: 'localStorage',
  ignore_dnt: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
