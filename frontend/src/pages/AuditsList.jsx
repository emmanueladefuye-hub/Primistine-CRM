import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, MapPin, User, CheckCircle2, AlertCircle, Clock, ChevronRight, Smartphone } from 'lucide-react';
import { useAudits } from '../contexts/AuditsContext';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export default function AuditsList() {
    const { audits, loading } = useAudits();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredAudits = (audits || []).filter(audit => {
        // Robust Client Name Check
        const clientName = typeof audit.client === 'string' ? audit.client : (audit.client?.clientName || audit.client?.name || '');
        const address = audit.address || audit.site?.address || '';
        const engineer = audit.engineer || '';
        const id = audit.id || '';

        const matchesSearch =
            clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            engineer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || audit.status === statusFilter;

        return matchesSearch && matchesStatus;
    }) || [];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'In Progress': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'Draft': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-premium-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-premium-blue-900 tracking-tight">Site Audits</h1>
                    <p className="text-slate-500 font-medium">Manage technical surveys and site assessments</p>
                </div>
                <Link to="/audits/new" className="flex items-center gap-2 px-6 py-3 bg-premium-blue-900 text-white rounded-xl font-bold hover:bg-premium-blue-800 transition-all shadow-lg hover:shadow-premium-blue-900/20 active:scale-95">
                    <Plus size={20} />
                    New Audit
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by client, address or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-premium-blue-500 focus:ring-2 focus:ring-premium-blue-100 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {['All', 'Completed', 'In Progress', 'Draft'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border",
                                statusFilter === status
                                    ? "bg-premium-blue-900 text-white border-premium-blue-900"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Audits List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAudits.length > 0 ? (
                    filteredAudits.map((audit) => (
                        <Link
                            key={audit.id}
                            to={`/audits/${audit.id}`}
                            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-premium-blue-100 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5", getStatusColor(audit.status))}>
                                    {audit.status === 'Completed' ? <CheckCircle2 size={12} /> : audit.status === 'Draft' ? <FileText size={12} /> : <Clock size={12} />}
                                    {audit.status}
                                </span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{audit.id}</span>
                            </div>

                            <h3 className="text-lg font-bold text-premium-blue-900 mb-1 group-hover:text-premium-blue-600 transition-colors">
                                {audit.client?.clientName || 'Unknown Client'}
                            </h3>

                            <div className="space-y-2 mt-4">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <MapPin size={16} className="shrink-0 text-slate-400" />
                                    <span className="truncate">{audit.site?.address || audit.client?.address || 'No address'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Calendar size={16} className="shrink-0 text-slate-400" />
                                    <span>{new Date(audit.createdAt || audit.submittedAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <User size={16} className="shrink-0 text-slate-400" />
                                    <span>{audit.engineer || 'Unassigned'}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {(audit.services || []).length} Services
                                </span>
                                <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-premium-blue-50 group-hover:text-premium-blue-600 transition-colors">
                                    <ChevronRight size={18} />
                                </span>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                            <Search size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No audits found</h3>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search term.</p>
                        {searchTerm && (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                                className="mt-4 text-premium-blue-600 font-bold text-sm hover:underline"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper icon
function FileText({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    );
}
