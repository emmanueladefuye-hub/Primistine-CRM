import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [], requiredPermission = null }) {
    const { currentUser, userProfile, loading, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-premium-blue-900 animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Verifying Access...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role Check
    if (allowedRoles.length > 0) {
        if (!userProfile || !allowedRoles.includes(userProfile.role)) {
            return (
                <AccessDenied
                    title="Role Restriction"
                    message={`This page requires one of the following roles: ${allowedRoles.join(', ')}`}
                />
            );
        }
    }

    // Permission Check
    if (requiredPermission) {
        let module, action;

        if (typeof requiredPermission === 'string') {
            [module, action] = requiredPermission.split('.');
        } else {
            module = requiredPermission.resource;
            action = requiredPermission.action;
        }

        if (!hasPermission(module, action)) {
            return (
                <AccessDenied
                    title="Missing Permissions"
                    message={`You do not have permission to ${action} ${module}.`}
                />
            );
        }
    }

    return children ? children : <Outlet />;
}

function AccessDenied({ title, message }) {
    return (
        <div className="h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{title}</h2>
                <p className="text-slate-500 mb-8">{message}</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        Go Back
                    </button>
                    <a
                        href="/"
                        className="px-6 py-2.5 rounded-xl bg-premium-blue-900 text-white font-bold hover:bg-premium-blue-800 transition-all"
                    >
                        Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
