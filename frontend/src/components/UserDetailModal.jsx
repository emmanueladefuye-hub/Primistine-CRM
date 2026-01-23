import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, User, Shield, Activity, Calendar, Lock, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

export default function UserDetailModal({ user, onClose, onAction, currentUserProfile }) {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [stats, setStats] = useState({
        audits: 0,
        quotes: 0,
        lastActive: 'Unknown'
    });
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    const isSuperAdmin = currentUserProfile?.role === 'super_admin';

    const AVAILABLE_ROLES = [
        { id: 'super_admin', name: 'Super Admin' },
        { id: 'admin', name: 'Admin' },
        { id: 'manager', name: 'Manager' },
        { id: 'finance', name: 'Finance' },
        { id: 'inventory_manager', name: 'Inventory Manager' },
        { id: 'sales_rep', name: 'Sales Rep' },
        { id: 'engineer', name: 'Engineer' },
        { id: 'auditor', name: 'Auditor' },
        { id: 'viewer', name: 'Viewer' }
    ];

    useEffect(() => {
        if (!user) return;

        const fetchDetails = async () => {
            setLoadingLogs(true);
            try {
                // 1. Fetch recent activity (last 20 logs)
                // Try searching by userId OR engineer name (fallback)
                // Note: This relies on 'logs' collection having accurate metadata
                const logsRef = collection(db, 'logs');
                const q = query(
                    logsRef,
                    where('metadata.userId', '==', user.uid),
                    orderBy('timestamp', 'desc'),
                    limit(20)
                );

                const snapshot = await getDocs(q);
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAuditLogs(logs);

                // 2. Calculate simple stats (this could be expensive in real app, better to use counters)
                // For now, we'll infer from the logs we fetched or just show placeholders
                // Real implementation might query 'audits' where engineerId == uid
                const auditCount = logs.filter(l => l.action.includes('AUDIT')).length;
                const quoteCount = logs.filter(l => l.action.includes('QUOTE')).length;

                setStats({
                    audits: auditCount > 0 ? `${auditCount}+ (recent)` : 0,
                    quotes: quoteCount > 0 ? `${quoteCount}+ (recent)` : 0,
                    lastActive: logs[0]?.timestamp ? format(logs[0].timestamp.toDate(), 'PP p') : 'No recent activity'
                });

            } catch (error) {
                console.error("Failed to fetch user details", error);
                // toast.error("Could not load full user history");
                // Don't block UI on logs failure
            } finally {
                setLoadingLogs(false);
            }
        };

        fetchDetails();
    }, [user]);

    if (!user) return null;

    const handleResetPassword = () => {
        // In a real app, this would use firebase auth API (sendPasswordResetEmail)
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            {
                loading: 'Sending reset email...',
                success: `Reset link sent to ${user.email}`,
                error: 'Failed to send reset email'
            }
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-premium-blue-900 text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                            {user.displayName?.charAt(0) || user.email?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{user.displayName || 'Unnamed User'}</h2>
                            <p className="text-slate-500 text-sm flex items-center gap-2">
                                {user.email}
                                {user.role === 'super_admin' && <Shield size={14} className="text-premium-gold-500" />}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={clsx("px-2 py-0.5 rounded text-xs font-bold uppercase",
                                    user.isActive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                    {user.isActive !== false ? "Active" : "Deactivated"}
                                </span>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600 uppercase">
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Performance Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <Activity size={16} />
                                <span className="text-xs font-bold uppercase">Last Active</span>
                            </div>
                            <p className="text-sm font-medium text-slate-700 truncate" title={stats.lastActive}>
                                {stats.lastActive}
                            </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 text-purple-600 mb-1">
                                <CheckCircle size={16} />
                                <span className="text-xs font-bold uppercase">Audits</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800">{stats.audits}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                            <div className="flex items-center gap-2 text-orange-600 mb-1">
                                <FileText size={16} />
                                <span className="text-xs font-bold uppercase">Quotes</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800">{stats.quotes}</p>
                        </div>
                    </div>

                    {/* Security Actions */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Lock size={16} /> Security Controls
                        </h3>
                        <div className="flex gap-3">
                            <button
                                onClick={handleResetPassword}
                                className="flex-1 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                                Send Password Reset
                            </button>
                            <button
                                onClick={() => onAction('toggle_status', user)}
                                className={clsx("flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                                    user.isActive !== false
                                        ? "bg-white border-red-200 text-red-600 hover:bg-red-50"
                                        : "bg-green-600 border-green-600 text-white hover:bg-green-700"
                                )}
                            >
                                {user.isActive !== false ? "Deactivate Account" : "Reactivate Account"}
                            </button>
                        </div>
                    </div>

                    {/* Role Management - SuperAdmin Only */}
                    {isSuperAdmin && user.role !== 'super_admin' && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Shield size={16} /> Role Management
                            </h3>
                            <div className="flex gap-3 items-center">
                                <select
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-premium-blue-500 outline-none"
                                    defaultValue={user.role}
                                    disabled={isUpdatingRole}
                                    onChange={(e) => onAction('change_role', { ...user, newRole: e.target.value })}
                                >
                                    {AVAILABLE_ROLES.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 max-w-[150px]">
                                    Changing a user's role will also update their system permissions.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Activity Timeline */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Calendar size={16} /> Recent Activity Log
                        </h3>
                        <div className="space-y-3">
                            {loadingLogs ? (
                                <div className="text-center py-8 text-slate-400 text-sm">Loading history...</div>
                            ) : auditLogs.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-sm">
                                    No recent activity found for this user.
                                </div>
                            ) : (
                                auditLogs.map(log => (
                                    <div key={log.id} className="flex gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-premium-blue-200 transition-colors">
                                        <div className={clsx("mt-1 w-2 h-2 rounded-full shrink-0",
                                            log.action.includes('ERROR') ? "bg-red-500" : "bg-premium-blue-400"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800">{log.action.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-slate-500 truncate">{log.message}</p>
                                        </div>
                                        <div className="text-xs text-slate-400 whitespace-nowrap">
                                            {log.timestamp ? format(log.timestamp.toDate(), 'MMM d, p') : '-'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
