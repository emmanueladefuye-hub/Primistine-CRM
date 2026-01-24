import React, { useState, useEffect, useMemo } from 'react';
import { where, orderBy, limit } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import {
    Activity,
    ArrowUpRight,
    Facebook,
    Globe,
    TrendingUp,
    Users,
    MousePointer2,
    Filter,
    ArrowRight,
    Search,
    DollarSign,
    Eye,
    X,
    Calendar,
    MessageSquare,
    MessageCircle,
    ClipboardList,
    MapPin
} from 'lucide-react';
import clsx from 'clsx';
import { InquiryService } from '../lib/services/InquiryService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
        <div className="flex items-start justify-between">
            <div className={clsx("p-3 rounded-2xl", color)}>
                <Icon size={24} className="text-white" />
            </div>
            {change && (
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <TrendingUp size={12} /> {change}%
                </div>
            )}
        </div>
        <div className="mt-4">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</h3>
            <p className="text-3xl font-black text-premium-blue-900 mt-1">{value}</p>
        </div>
    </div>
);

const SourcePerformanceTable = ({ sources }) => (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-black text-premium-blue-900 tracking-tight">Source Performance</h3>
                <p className="text-xs text-slate-400 font-medium">Top performing acquisition channels</p>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><Filter size={20} /></button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                        <th className="py-4 px-8">Channel</th>
                        <th className="py-4 px-6">Inquiries</th>
                        <th className="py-4 px-6">Conversions</th>
                        <th className="py-4 px-6">Rate</th>
                        <th className="py-4 px-8 text-right">Trend</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {sources.map((source, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-8 flex items-center gap-3">
                                <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", source.color)}>
                                    <source.icon size={16} className="text-white" />
                                </div>
                                <span className="font-bold text-premium-blue-900">{source.name}</span>
                            </td>
                            <td className="py-4 px-6 font-black text-slate-600">{source.count}</td>
                            <td className="py-4 px-6 font-black text-premium-blue-900">{source.conversions}</td>
                            <td className="py-4 px-6">
                                <span className="px-2 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-600">
                                    {((source.conversions / source.count) * 100).toFixed(1)}%
                                </span>
                            </td>
                            <td className="py-4 px-8 text-right">
                                <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden ml-auto">
                                    <div
                                        className={clsx("h-full", source.color.replace('bg-', 'bg-'))}
                                        style={{ width: `${(source.conversions / source.count) * 100}%` }}
                                    ></div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default function AcquisitionDashboard() {
    const navigate = useNavigate();
    const [isUTMModalOpen, setIsUTMModalOpen] = useState(false);
    const [utmConfig, setUtmConfig] = useState({ source: '', medium: '', campaign: '' });

    const [metrics, setMetrics] = useState({ totalInquiries: 0, conversions: 0, roi: 0, rate: 0 });
    const [selectedInquiry, setSelectedInquiry] = useState(null);

    // Live Inquiry Feed (CRM-wide hooked fix)
    const inquiryQuery = React.useMemo(() => [
        where('status', '==', 'raw'),
        orderBy('timestamp', 'desc'),
        limit(50)
    ], []);

    const { data: rawInquiries, loading: feedLoading } = useCollection('inquiries', inquiryQuery);

    const inquiries = React.useMemo(() => {
        return (rawInquiries || []).map(i => ({
            ...i,
            dateString: i.timestamp?.toDate ? i.timestamp.toDate().toLocaleString() : 'Just now'
        }));
    }, [rawInquiries]);

    const loading = feedLoading;

    useEffect(() => {
        const fetchMetrics = async () => {
            const data = await InquiryService.getMetrics();
            setMetrics(data);
        };
        fetchMetrics();
    }, []);

    const handlePromote = async (inquiry) => {
        try {
            const loadingToast = toast.loading("Promoting to lead...");
            const leadId = await InquiryService.promoteToLead(inquiry.id, inquiry);
            toast.success("Inquiry Promoted! Check Sales Pipeline.", { id: loadingToast });
        } catch (error) {
            toast.error("Failed to promote inquiry");
        }
    };

    const generateUTM = () => {
        const baseUrl = `${window.location.origin}/inquiry`;
        const params = new URLSearchParams();
        if (utmConfig.source) params.append('utm_source', utmConfig.source);
        if (utmConfig.medium) params.append('utm_medium', utmConfig.medium);
        if (utmConfig.campaign) params.append('utm_campaign', utmConfig.campaign);

        const fullUrl = `${baseUrl}?${params.toString()}`;
        navigator.clipboard.writeText(fullUrl);
        toast.success("Tracking URL copied to clipboard!");
        setIsUTMModalOpen(false);
    };

    const handleExport = () => {
        if (inquiries.length === 0) return toast.error("No data to export");

        const headers = ["ID", "Name", "Email", "Phone", "Source", "Campaign", "Date"];
        const rows = inquiries.map(i => [
            i.id,
            i.name,
            i.email,
            i.phone,
            i.attribution?.source || 'direct',
            i.attribution?.campaign || 'none',
            i.dateString
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `acquisition_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 3. Dynamic Source Performance (CRM-wide fixed)
    const sources = React.useMemo(() => {
        // Source Config for branding
        const config = {
            'Meta Ads': { icon: Facebook, color: 'bg-blue-600', match: ['meta', 'facebook', 'instagram'] },
            'Google Ads': { icon: Search, color: 'bg-red-500', match: ['google', 'cpc', 'adwords'] },
            'Website': { icon: Globe, color: 'bg-emerald-500', match: ['website', 'direct', 'organic'] },
            'Referral': { icon: Users, color: 'bg-premium-gold-500', match: ['referral', 'friend'] }
        };

        const stats = {
            'Meta Ads': { count: 0, conversions: 0 },
            'Google Ads': { count: 0, conversions: 0 },
            'Website': { count: 0, conversions: 0 },
            'Referral': { count: 0, conversions: 0 }
        };

        // Process actual inquiries (including ones not in the 'recent' 50 if we had them, 
        // but here we use the feed's raw data for the table)
        (rawInquiries || []).forEach(inquiry => {
            const src = (inquiry.attribution?.source || 'direct').toLowerCase();
            let matchedCategory = 'Website';

            if (config['Meta Ads'].match.some(m => src.includes(m))) matchedCategory = 'Meta Ads';
            else if (config['Google Ads'].match.some(m => src.includes(m))) matchedCategory = 'Google Ads';
            else if (config['Referral'].match.some(m => src.includes(m))) matchedCategory = 'Referral';

            stats[matchedCategory].count++;
            if (inquiry.status === 'promoted') stats[matchedCategory].conversions++;
        });

        return Object.entries(config).map(([name, meta]) => ({
            name,
            ...meta,
            count: stats[name].count,
            conversions: stats[name].conversions
        }));
    }, [rawInquiries]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200 pb-8 text-white">
                <div>
                    <h1 className="text-4xl font-black text-premium-blue-900 tracking-tight leading-none group flex items-center gap-3">
                        <Activity className="text-premium-gold-500" size={32} />
                        Acquisition DB
                    </h1>
                    <p className="text-slate-500 font-bold mt-3 text-xs uppercase tracking-[0.2em] opacity-60">Source Performance & Pre-Lead Tracking</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleExport}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Export Report
                    </button>
                    <button
                        onClick={() => setIsUTMModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-premium-blue-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-premium-blue-900/30 transition-all shadow-xl"
                    >
                        Add Source
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Inquiries" value={metrics.totalInquiries} icon={MousePointer2} color="bg-premium-blue-600" />
                <StatCard title="Total Conversions" value={metrics.conversions} icon={Activity} color="bg-premium-gold-500" />
                <StatCard title="Overall Conv. Rate" value={`${metrics.rate}%`} icon={TrendingUp} color="bg-emerald-500" />
                <StatCard title="Attributed ROI" value={`₦${metrics.roi.toLocaleString()}`} icon={DollarSign} color="bg-slate-900" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Table */}
                <div className="lg:col-span-2">
                    <SourcePerformanceTable sources={sources} />
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-black text-premium-blue-900 tracking-tight">Recent Inquiries</h3>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Real-time Attribution</p>
                        </div>
                    </div>

                    <div className="space-y-6 flex-1">
                        {loading ? (
                            <div className="text-center py-12 text-slate-400 italic">Syncing raw inquiry feed...</div>
                        ) : inquiries.length === 0 ? (
                            <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-500 italic">
                                No raw inquiries found. Integration pending.
                            </div>
                        ) : (
                            inquiries.map((inquiry, i) => (
                                <div key={i} className="flex items-center justify-between group underline-offset-4 decoration-dotted">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-premium-blue-50 group-hover:text-premium-blue-600 transition-all">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-premium-blue-900 truncate max-w-[140px]">{inquiry.name || inquiry.email || inquiry.phone}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" title={inquiry.dateString}>
                                                {inquiry.attribution?.source} • {inquiry.dateString.includes(',') ? inquiry.dateString.split(',')[1] : inquiry.dateString}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedInquiry(inquiry)}
                                            title="View Details"
                                            className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-premium-blue-100 hover:text-premium-blue-600"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            onClick={() => handlePromote(inquiry)}
                                            title="Promote to Lead"
                                            className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-premium-gold-500 hover:text-white"
                                        >
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Inquiry Detail Modal */}
                    {selectedInquiry && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedInquiry(null)}></div>
                            <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-10 overflow-hidden animate-in fade-in zoom-in duration-300">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-premium-blue-50 flex items-center justify-center text-premium-blue-600">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-premium-blue-900 tracking-tight">Inquiry Details</h3>
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Acquisition DB Record</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedInquiry(null)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                <Users size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Full Name</span>
                                            </div>
                                            <p className="font-bold text-premium-blue-900">{selectedInquiry.name || 'Not Provided'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                <Globe size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Email Address</span>
                                            </div>
                                            <p className="font-bold text-premium-blue-900 leading-none truncate" title={selectedInquiry.email}>{selectedInquiry.email || 'Not Provided'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                <Phone size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Direct Line</span>
                                            </div>
                                            <p className="font-bold text-premium-blue-900">{selectedInquiry.phone || 'Not Provided'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                <MessageCircle size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Preference</span>
                                            </div>
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                selectedInquiry.contactPreference === 'WhatsApp' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {selectedInquiry.contactPreference || 'Call'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <MapPin size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Deployment Location</span>
                                        </div>
                                        <p className="font-bold text-premium-blue-900">{selectedInquiry.location || 'Not Specified'}</p>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <ClipboardList size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Project Type / Service Interest</span>
                                        </div>
                                        <p className="font-bold text-premium-blue-900">
                                            {Array.isArray(selectedInquiry.serviceInterest)
                                                ? selectedInquiry.serviceInterest.join(', ')
                                                : selectedInquiry.projectType || 'General Inquiry'}
                                        </p>
                                    </div>

                                    <div className="p-6 bg-premium-blue-900 rounded-3xl text-white">
                                        <div className="flex items-center gap-2 opacity-50 mb-3">
                                            <MessageSquare size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Client Message</span>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed italic">
                                            "{selectedInquiry.message || 'No message provided.'}"
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source</p>
                                                <span className="px-3 py-1 bg-premium-gold-100 text-premium-gold-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    {selectedInquiry.attribution?.source || 'Website'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Logged</p>
                                                <div className="flex items-center gap-2 text-xs font-bold text-premium-blue-900">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    {selectedInquiry.dateString}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                handlePromote(selectedInquiry);
                                                setSelectedInquiry(null);
                                            }}
                                            className="px-6 py-3 bg-premium-blue-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                        >
                                            Promote to Lead <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <button className="mt-8 w-full py-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-premium-blue-900/40 hover:bg-slate-100 hover:text-premium-blue-900 transition-all">
                        View All Activity
                    </button>
                </div>
            </div>

            {/* UTM Generator Modal */}
            {isUTMModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUTMModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-12 overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => setIsUTMModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                                <Activity size={24} className="rotate-45" />
                            </button>
                        </div>

                        <h2 className="text-3xl font-black text-premium-blue-900 tracking-tight italic mb-8">UTM Generator</h2>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source (e.g. instagram, newsletter)</label>
                                <input
                                    value={utmConfig.source}
                                    onChange={e => setUtmConfig({ ...utmConfig, source: e.target.value })}
                                    type="text"
                                    placeholder="Enter source..."
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold-500/30 font-bold text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medium (e.g. social, cpc, email)</label>
                                <input
                                    value={utmConfig.medium}
                                    onChange={e => setUtmConfig({ ...utmConfig, medium: e.target.value })}
                                    type="text"
                                    placeholder="Enter medium..."
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold-500/30 font-bold text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Name</label>
                                <input
                                    value={utmConfig.campaign}
                                    onChange={e => setUtmConfig({ ...utmConfig, campaign: e.target.value })}
                                    type="text"
                                    placeholder="e.g. summer_promo_2026"
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-premium-gold-500/30 font-bold text-sm"
                                />
                            </div>

                            <button
                                onClick={generateUTM}
                                className="w-full py-5 bg-premium-blue-900 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-premium-blue-900/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                            >
                                Generate & Copy Link <ArrowUpRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comparison Visual Placeholder */}
            <div className="bg-premium-blue-900 rounded-[40px] p-12 overflow-hidden relative group">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-md text-center md:text-left">
                        <h2 className="text-3xl font-black text-white leading-tight italic">Predictive Attribution</h2>
                        <p className="text-premium-blue-200 mt-4 font-medium">Use AI to analyze which campaigns are likely to yield high-value leads based on historical conversion data from your Site Audits.</p>
                        <button className="mt-8 px-8 py-4 bg-premium-gold-500 text-premium-blue-900 rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-premium-gold-500/20">
                            Connect Meta Marketing API
                        </button>
                    </div>
                </div>
                <div className="absolute top-1/2 -right-20 -translate-y-1/2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={400} />
                </div>
            </div>
        </div>
    );
}
