import React, { useState, useEffect } from 'react';
import { WorkflowService } from '../lib/services/WorkflowService';
import {
    Zap,
    Activity,
    Settings,
    RefreshCw,
    Play,
    Layout,
    Clock,
    Search,
    Filter,
    ChevronRight,
    ArrowUpRight,
    Server,
    Cpu,
    ExternalLink,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

const CategoryBadge = ({ category }) => {
    const colors = {
        'Sales': 'bg-emerald-100 text-emerald-700',
        'Operations': 'bg-blue-100 text-blue-700',
        'Inventory': 'bg-amber-100 text-amber-700',
        'Finance': 'bg-purple-100 text-purple-700',
        'Executive': 'bg-indigo-100 text-indigo-700',
        'Marketing': 'bg-pink-100 text-pink-700',
        'Team': 'bg-slate-100 text-slate-700',
        'Support': 'bg-orange-100 text-orange-700'
    };
    return (
        <span className={clsx(
            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
            colors[category] || 'bg-slate-100 text-slate-600'
        )}>
            {category}
        </span>
    );
};

const WorkflowCard = ({ workflow }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="bg-white rounded-[32px] border border-slate-100 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex justify-between items-start mb-6">
                <div className={clsx(
                    "p-3 rounded-2xl transition-all duration-300",
                    workflow.status === 'active' ? "bg-premium-blue-900 group-hover:bg-premium-gold-500" : "bg-slate-100"
                )}>
                    <Zap size={20} className={clsx(
                        workflow.status === 'active' ? "text-white" : "text-slate-400"
                    )} />
                </div>
                <div className="flex flex-col items-end">
                    <CategoryBadge category={workflow.category} />
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            workflow.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                        )}></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {workflow.status}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-black text-premium-blue-900 tracking-tight mb-2 group-hover:text-premium-blue-700 transition-colors">
                    {workflow.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-6">
                    {workflow.description}
                </p>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex flex-wrap gap-1.5">
                    {workflow.nodes.map((node, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            {node}
                        </span>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Clock size={12} />
                    <span>Last event: Today</span>
                </div>
                <button className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-premium-blue-50 group-hover:text-premium-blue-600 transition-all">
                    <ArrowUpRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default function AIWorkflowsPage() {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadWorkflows = async () => {
            const data = await WorkflowService.getWorkflows();
            setWorkflows(data);
            setLoading(false);
        };
        loadWorkflows();
    }, []);

    const filteredWorkflows = workflows.filter(w => {
        const matchesFilter = filter === 'all' || w.category.toLowerCase() === filter.toLowerCase() || w.status === filter;
        const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const categories = ['All', 'Sales', 'Operations', 'Finance', 'active', 'inactive'];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-premium-blue-900 tracking-tight flex items-center gap-4">
                        <Cpu className="text-premium-gold-500" size={32} />
                        AI Workflows
                    </h1>
                    <p className="text-slate-500 font-bold mt-3 text-xs uppercase tracking-[0.2em] opacity-60">System Automations & Engine Status</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/logs')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Activity size={16} /> View Engine Logs
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-premium-blue-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:shadow-premium-blue-900/30">
                        <RefreshCw size={16} /> Sync Engine
                    </button>
                </div>
            </div>

            {/* Engine Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 bg-premium-blue-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                <Server size={20} className="text-premium-gold-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Control Engine</span>
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tight mb-4">Automation Hub 2.0</h2>
                        <p className="text-sm font-medium text-white/60 leading-relaxed max-w-sm mb-8">
                            Connected to n8n instance. 12 operational workflows currently monitoring CRM lifecycle events.
                        </p>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-xs font-black uppercase tracking-widest">Active</span>
                            </div>
                            <div className="text-white/20">|</div>
                            <div className="flex items-center gap-2 group-hover:text-premium-gold-500 transition-colors cursor-pointer">
                                <span className="text-xs font-black uppercase tracking-widest underline underline-offset-4 decoration-white/20 group-hover:decoration-premium-gold-500">Launch n8n Dashboard</span>
                                <ExternalLink size={12} />
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-20 -bottom-20 opacity-10 group-hover:opacity-20 transition-all duration-700 scale-150 rotate-12">
                        <Zap size={300} />
                    </div>
                </div>

                <div className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col justify-between group">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Efficiency Rate</h3>
                            <Activity size={16} className="text-slate-300" />
                        </div>
                        <div className="text-4xl font-black text-premium-blue-900">98.4%</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-emerald-600">+2.1% this week</span>
                            <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: '98%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Executions</h3>
                            <Clock size={16} className="text-slate-300" />
                        </div>
                        <div className="text-4xl font-black text-premium-blue-900">1,402</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500">All services operational</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                        <button
                            key={c}
                            onClick={() => setFilter(c.toLowerCase())}
                            className={clsx(
                                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === c.toLowerCase()
                                    ? "bg-premium-blue-900 text-white shadow-lg"
                                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                        >
                            {c}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search workflows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-premium-blue-100 transition-all"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-[32px] border border-slate-100 p-8 h-80 animate-pulse flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
                                <div className="w-20 h-4 bg-slate-100 rounded-full"></div>
                            </div>
                            <div className="space-y-4">
                                <div className="w-3/4 h-6 bg-slate-100 rounded-lg"></div>
                                <div className="w-full h-4 bg-slate-100 rounded-lg"></div>
                                <div className="w-full h-4 bg-slate-100 rounded-lg"></div>
                            </div>
                            <div className="w-full h-10 bg-slate-50 rounded-xl"></div>
                        </div>
                    ))
                ) : filteredWorkflows.length === 0 ? (
                    <div className="col-span-full py-20 bg-slate-50 rounded-[40px] text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Filter size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-premium-blue-900">No matching workflows</h3>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    filteredWorkflows.map((w) => (
                        <WorkflowCard key={w.id} workflow={w} />
                    ))
                )}
            </div>

            <div className="pt-8 text-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <AlertCircle size={14} className="text-premium-gold-500" />
                    n8n Instance running on: <span className="text-premium-blue-900">automation.primistine.com</span>
                </p>
            </div>
        </div>
    );
}
