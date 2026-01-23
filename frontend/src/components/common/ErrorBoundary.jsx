import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service here
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload(); // Hard reload to clear potential bad state
    };

    render() {
        if (this.state.hasError) {
            // Check if a custom fallback is provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] h-full flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 m-4">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <AlertTriangle size={40} strokeWidth={1.5} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
                            <p className="text-sm text-slate-500">
                                We've encountered an unexpected error. The application has been paused to prevent data loss.
                            </p>
                        </div>

                        {/* Developer Details (Hidden in Prod usually, but helpful for this user) */}
                        <div className="text-left bg-slate-900 text-slate-300 p-4 rounded-lg text-xs font-mono overflow-auto max-h-32">
                            <p className="text-red-400 font-bold mb-1">Error: {this.state.error?.toString()}</p>
                            <p className="opacity-50">{this.state.errorInfo?.componentStack}</p>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                                <Home size={18} /> Go Home
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="px-5 py-2.5 bg-premium-blue-900 text-white font-bold rounded-xl hover:bg-premium-blue-800 transition-colors flex items-center gap-2 shadow-lg shadow-premium-blue-900/20"
                            >
                                <RefreshCw size={18} /> Reload Page
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
