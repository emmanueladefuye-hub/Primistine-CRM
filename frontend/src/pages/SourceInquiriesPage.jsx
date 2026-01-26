import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { where, orderBy } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import { InquiryService } from '../lib/services/InquiryService';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import {
    ArrowLeft,
    Search,
    Download,
    Trash2,
    ChevronDown,
    ChevronUp,
    Users,
    Globe,
    Phone,
    MapPin,
    MessageSquare,
    Calendar,
    Filter,
    CheckSquare,
    Square,
    ArrowRight,
    Facebook,
    MessageCircle
} from 'lucide-react';

// Source configuration mapping
const SOURCE_CONFIG = {
    'meta': { name: 'Meta Ads', icon: Facebook, color: 'bg-blue-600', match: ['meta', 'facebook', 'instagram'] },
    'google': { name: 'Google Ads', icon: Search, color: 'bg-red-500', match: ['google', 'cpc', 'adwords'] },
    'website': { name: 'Website', icon: Globe, color: 'bg-emerald-500', match: ['website', 'direct', 'organic'] },
    'referral': { name: 'Referral', icon: Users, color: 'bg-amber-500', match: ['referral', 'friend'] }
};

// Expandable Inquiry Card Component
const InquiryCard = ({ inquiry, isSelected, onToggleSelect, onPromote }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={clsx(
            "bg-white rounded-2xl border transition-all duration-200",
            isSelected ? "border-premium-blue-500 ring-2 ring-premium-blue-100" : "border-slate-100 hover:border-slate-200"
        )}>
            {/* Card Header */}
            <div
                className="p-5 flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect(inquiry.id);
                        }}
                        className="text-slate-300 hover:text-premium-blue-600 transition-colors"
                    >
                        {isSelected ? <CheckSquare size={20} className="text-premium-blue-600" /> : <Square size={20} />}
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <Users size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-premium-blue-900">{inquiry.name || inquiry.email || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{inquiry.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        inquiry.status === 'promoted' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    )}>
                        {inquiry.status || 'raw'}
                    </span>
                    <span className="text-xs text-slate-400">
                        {inquiry.timestamp?.toDate ? inquiry.timestamp.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-50 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Phone size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Direct Line</span>
                            </div>
                            <p className="text-sm font-bold text-premium-blue-900">{inquiry.phone || inquiry.phoneNumber || inquiry.direct_line || 'Not Provided'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <MessageCircle size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Preference</span>
                            </div>
                            <span className={clsx(
                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                                inquiry.contactPreference === 'WhatsApp' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                            )}>
                                {inquiry.contactPreference || 'Call'}
                            </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <MapPin size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Location</span>
                            </div>
                            <p className="text-sm font-bold text-premium-blue-900">{inquiry.location || 'Not Specified'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Calendar size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Date</span>
                            </div>
                            <p className="text-sm font-bold text-premium-blue-900">
                                {inquiry.timestamp?.toDate ? inquiry.timestamp.toDate().toLocaleString() : 'Just now'}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-premium-blue-900 rounded-xl text-white">
                        <div className="flex items-center gap-2 opacity-50 mb-2">
                            <MessageSquare size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Message</span>
                        </div>
                        <p className="text-sm font-medium italic">"{inquiry.message || 'No message provided.'}"</p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-slate-400">
                            <span className="font-bold">Service Interest:</span> {Array.isArray(inquiry.serviceInterest) ? inquiry.serviceInterest.join(', ') : inquiry.projectType || 'General'}
                        </div>
                        {inquiry.status !== 'promoted' && (
                            <button
                                onClick={() => onPromote(inquiry)}
                                className="px-4 py-2 bg-premium-gold-500 text-premium-blue-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                Promote to Lead <ArrowRight size={12} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function SourceInquiriesPage() {
    const { sourceType } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'raw' | 'promoted'

    // Get source configuration
    const sourceConfig = SOURCE_CONFIG[sourceType?.toLowerCase()] || {
        name: sourceType || 'All Sources',
        icon: Globe,
        color: 'bg-slate-500',
        match: [sourceType?.toLowerCase() || '']
    };

    // Fetch all raw inquiries (we'll filter client-side for flexibility)
    const inquiryQuery = useMemo(() => [
        orderBy('timestamp', 'desc')
    ], []);

    const { data: allInquiries, loading } = useCollection('inquiries', inquiryQuery);

    // Filter inquiries by source
    const filteredInquiries = useMemo(() => {
        if (!allInquiries) return [];

        return allInquiries.filter(inquiry => {
            const src = (inquiry.attribution?.source || 'direct').toLowerCase();
            const matchesSource = sourceConfig.match.some(m => src.includes(m));
            const matchesSearch = searchQuery === '' ||
                (String(inquiry.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    String(inquiry.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    String(inquiry.phone || '').includes(searchQuery));
            const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;

            return matchesSource && matchesSearch && matchesStatus;
        });
    }, [allInquiries, sourceConfig, searchQuery, statusFilter]);

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectAll = () => {
        if (selectedIds.size === filteredInquiries.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredInquiries.map(i => i.id)));
        }
    };

    const handlePromote = async (inquiry) => {
        try {
            const loadingToast = toast.loading("Promoting to lead...");
            await InquiryService.promoteToLead(inquiry.id, inquiry);
            toast.success("Inquiry Promoted!", { id: loadingToast });
        } catch (error) {
            toast.error("Failed to promote inquiry");
        }
    };

    const handleExport = () => {
        const dataToExport = selectedIds.size > 0
            ? filteredInquiries.filter(i => selectedIds.has(i.id))
            : filteredInquiries;

        if (dataToExport.length === 0) return toast.error("No data to export");

        const headers = ["Name", "Email", "Phone", "Location", "Preference", "Service", "Status", "Date"];
        const rows = dataToExport.map(i => [
            i.name || '',
            i.email || '',
            i.phone || '',
            i.location || '',
            i.contactPreference || 'Call',
            Array.isArray(i.serviceInterest) ? i.serviceInterest.join('; ') : i.projectType || '',
            i.status || 'raw',
            i.timestamp?.toDate ? i.timestamp.toDate().toLocaleDateString() : ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.map(v => `"${v}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${sourceConfig.name.replace(/\s+/g, '_')}_inquiries_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${dataToExport.length} inquiries`);
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return toast.error("No inquiries selected");

        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} inquiries? This cannot be undone.`)) {
            return;
        }

        const loadingToast = toast.loading(`Deleting ${selectedIds.size} inquiries...`);
        try {
            await Promise.all(
                Array.from(selectedIds).map(id => InquiryService.deleteInquiry(id))
            );
            toast.success(`Deleted ${selectedIds.size} inquiries`, { id: loadingToast });
            setSelectedIds(new Set());
        } catch (error) {
            toast.error("Failed to delete some inquiries", { id: loadingToast });
        }
    };

    const Icon = sourceConfig.icon;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200 pb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/acquisition')}
                        className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-premium-blue-600 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className={clsx("p-3 rounded-2xl", sourceConfig.color)}>
                        <Icon size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-premium-blue-900 tracking-tight">{sourceConfig.name}</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                            {filteredInquiries.length} Inquiries • Source Detail View
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleExport}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        <Download size={14} /> Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'}
                    </button>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                        >
                            <Trash2 size={14} /> Delete ({selectedIds.size})
                        </button>
                    )}
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-premium-blue-100 focus:border-premium-blue-500 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={selectAll}
                        className={clsx(
                            "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            selectedIds.size === filteredInquiries.length && filteredInquiries.length > 0
                                ? "bg-premium-blue-100 text-premium-blue-700 border border-premium-blue-200"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        {selectedIds.size === filteredInquiries.length && filteredInquiries.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
                        Select All
                    </button>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-premium-blue-100 cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="raw">Raw Only</option>
                        <option value="promoted">Promoted Only</option>
                    </select>
                </div>
            </div>

            {/* Inquiry Cards */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-20 text-slate-400 italic">Loading inquiries...</div>
                ) : filteredInquiries.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Users size={32} />
                        </div>
                        <p className="text-slate-500 font-bold">No inquiries found</p>
                        <p className="text-slate-400 text-sm mt-1">
                            {searchQuery ? 'Try adjusting your search query' : 'No leads from this source yet'}
                        </p>
                    </div>
                ) : (
                    filteredInquiries.map(inquiry => (
                        <InquiryCard
                            key={inquiry.id}
                            inquiry={inquiry}
                            isSelected={selectedIds.has(inquiry.id)}
                            onToggleSelect={toggleSelect}
                            onPromote={handlePromote}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
