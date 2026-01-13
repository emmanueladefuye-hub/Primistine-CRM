import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[32px] shadow-2xl shadow-red-100 border border-red-50 p-8 md:p-12 max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Encountered a Blocker</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            The application experienced an unexpected error. Don't worry, your data is safe in the cloud.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Details</div>
          <p className="text-xs font-mono text-red-600 break-all">{error.message}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => window.location.href = '/support'}
            className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Get Support
          </button>
          <button
            onClick={resetErrorBoundary}
            className="flex-1 px-6 py-4 bg-premium-blue-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-xl hover:shadow-blue-900/20 active:scale-95 transition-all"
          >
            Restart App
          </button>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
