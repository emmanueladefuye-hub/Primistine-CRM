import React, { useState, useEffect } from 'react';
import { orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCollection } from '../hooks/useFirestore';
import { Loader2, ShieldAlert, Clock, User, FileText } from 'lucide-react';

export default function SystemAuditTrail() {
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    };

    // Fetch Logs (CRM-wide hooked fix)
    const logQuery = React.useMemo(() => [orderBy('timestamp', 'desc'), limit(50)], []);
    const { data: logs, loading } = useCollection('logs', logQuery);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 text-slate-400">
                <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading Audit Trail...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <ShieldAlert size={18} className="text-premium-blue-600" />
                    System Chain of Custody
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                    Last 50 Events
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-medium">Timestamp</th>
                            <th className="px-6 py-3 font-medium">Action</th>
                            <th className="px-6 py-3 font-medium">User</th>
                            <th className="px-6 py-3 font-medium">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                                    No system logs found.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-3 whitespace-nowrap text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} />
                                            {log.timestamp ? (
                                                <span title={log.timestamp.toDate().toLocaleString()}>
                                                    {timeAgo(log.timestamp.toDate())}
                                                </span>
                                            ) : (
                                                <span>Just now</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-slate-700">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.action.includes('ERROR') ? 'bg-red-50 text-red-700 border border-red-100' :
                                            log.action.includes('CREATED') ? 'bg-green-50 text-green-700 border border-green-100' :
                                                log.action.includes('SUBMITTED') ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-400" />
                                            {log.metadata?.engineer || log.metadata?.userId || 'System'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-600 max-w-xs truncate" title={log.message}>
                                        {log.message}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
