import React from 'react';
import { AlertTriangle, RefreshCw, Home, Hammer } from 'lucide-react';
import { logger } from '../lib/services/logger';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to our custom persistence service
        logger.error("ErrorBoundary caught an exception", error, {
            componentStack: errorInfo?.componentStack,
            isFragment: this.props.isFragment // Hint if it's a small section or page-level
        });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.minimal) {
                return (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2">
                        <AlertTriangle className="text-amber-500" size={24} />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Widget Error</p>
                        <button
                            onClick={this.handleReload}
                            className="text-[10px] font-black text-premium-blue-600 hover:text-premium-blue-800 underline uppercase"
                        >
                            Retry
                        </button>
                    </div>
                );
            }

            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center border border-slate-100">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} />
                        </div>

                        <h1 className="text-2xl font-black text-premium-blue-900 mb-2">Something went wrong</h1>
                        <p className="text-slate-500 mb-8">
                            The application encountered an unexpected error. Our engineers have been notified.
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-100 rounded-lg p-4 mb-8 text-left overflow-auto max-h-40">
                                <code className="text-xs text-slate-600 font-mono block">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-3 bg-premium-blue-900 text-white rounded-xl font-bold hover:bg-premium-blue-800 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} /> Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Home size={18} /> Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
