import React from 'react';
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Error404() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={40} />
                </div>
                <h1 className="text-4xl font-bold text-premium-blue-900 mb-2">Page Not Found</h1>
                <p className="text-slate-500 mb-8">
                    Oops! The page you are looking for seems to have gone off-grid. It might have been moved or deleted.
                </p>

                <div className="space-y-3">
                    <Link to="/" className="flex items-center justify-center gap-2 w-full bg-premium-blue-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 transition-all">
                        <Home size={18} /> Back to Dashboard
                    </Link>
                    <button onClick={() => window.history.back()} className="flex items-center justify-center gap-2 w-full bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-lg font-medium hover:bg-slate-50 transition-all">
                        <ArrowLeft size={18} /> Go Back
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200">
                    <p className="text-xs text-slate-400">Error Code: 404</p>
                </div>
            </div>
        </div>
    );
}
