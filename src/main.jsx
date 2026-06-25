import React from 'react'
import ReactDOM from 'react-dom/client'
// Self-hosted variable fonts (off Google CDN); CJK is unicode-range subsetted on demand.
import '@fontsource-variable/space-grotesk/wght.css'
import '@fontsource-variable/noto-sans-sc/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
