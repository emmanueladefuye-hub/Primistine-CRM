import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const formatDate = (dateVal) => {
    if (!dateVal) return 'Date Unknown';
    try {
        // Handle Firestore Timestamp
        if (dateVal?.seconds) return new Date(dateVal.seconds * 1000).toLocaleString();
        // Handle String/Date
        return new Date(dateVal).toLocaleString();
    } catch (e) {
        return 'Invalid Date';
    }
};

export default function SystemAuditTrail({ data, type = 'Record' }) {
    if (!data) return null;

    // Normalizing user data
    // Different entities might use different field names.
    // Try to find the "Actor" for Created and Updated actions.

    const createdBy = data.createdBy || data.author || {}; // Object or ID?
    const updatedBy = data.updatedBy || data.editor || {};

    // Explicit executedBy object (from AuditWizard) take precedence
    const executer = data.submittedBy || data.updatedBy || {};

    const executerName = executer.name || executer.displayName || data.engineer || data.manager || data.rep || 'Unknown User';
    const executerEmail = executer.email || 'No email recorded';
    const executerRole = executer.role || 'User';
    const executerInitial = executerName ? executerName[0].toUpperCase() : '?';

    // Determining Dates
    const createdDate = data.submittedAt || data.createdAt || data.dateCreated;
    const updatedDate = data.updatedAt || data.lastModified;

    return (
        <div className="mt-8 border-t border-slate-200 pt-8 animate-in fade-in duration-700">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">System Chain of Custody</h3>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">

                {/* Identity Column */}
                <div className="space-y-4">
                    <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase">{type} ID</span>
                        <span className="font-mono text-slate-600 select-all text-xs sm:text-sm break-all">{data.id || 'Pending ID'}</span>
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase">Current Status</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-sm">
                                <span className={data.status === 'Completed' || data.status === 'Active' ? "w-2 h-2 rounded-full bg-emerald-500" : "w-2 h-2 rounded-full bg-slate-400"}></span>
                                {data.status || 'Draft'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actor Column */}
                <div className="space-y-4">
                    <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase">Last Action By</span>
                        <div className="flex items-center gap-3 mt-2 p-2 bg-white border border-slate-200 rounded-xl max-w-sm">
                            <div className="w-8 h-8 rounded-full bg-premium-blue-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-md shadow-premium-blue-900/20">
                                {executerInitial}
                            </div>
                            <div className="min-w-0">
                                <span className="block font-bold text-slate-700 truncate">{executerName}</span>
                                <span className="block text-[10px] text-slate-400 truncate uppercase tracking-wider">{executerRole} • {executerEmail}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase">Created On</span>
                            <span className="font-medium text-slate-700 font-mono text-xs">{formatDate(createdDate)}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase">Last Modified</span>
                            <span className="font-medium text-slate-700 font-mono text-xs">{formatDate(updatedDate)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-2 text-center">
                <p className="text-[10px] text-slate-300 uppercase tracking-widest font-black flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    Secure Log Immutable
                </p>
            </div>
        </div>
    );
}
