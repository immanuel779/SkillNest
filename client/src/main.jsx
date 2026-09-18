// ============================================================
// TEMP DEBUG — remove this whole block once the warnings are gone
// ============================================================
const _error = console.error
console.error = (...args) => {
  const first = args[0]
  if (typeof first === 'string') {
    if (first.includes('`value` prop on `input`')) {
      console.trace('🐛 NULL VALUE WARNING — real stack below:')
    }
    if (first.includes('changing an uncontrolled input to be controlled')) {
      console.trace('🐛 UNCONTROLLED → CONTROLLED WARNING — real stack below:')
    }
  }
  _error(...args)
}
// ============================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)