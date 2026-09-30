import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// HashRouter (URLs like /#/top5) instead of BrowserRouter: GitHub Pages is a
// static file host with no server-side rewrite, so a direct link to /admin
// would 404 with a path-based router. Hash routing always resolves to
// index.html first, so deep links work everywhere this gets deployed.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
