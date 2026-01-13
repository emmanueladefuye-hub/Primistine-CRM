import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, AlertCircle, DollarSign, Calendar, ChevronRight, X, Clock } from 'lucide-react';
import clsx from 'clsx';
import { db } from '../lib/firebase';
import { collection, query } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import TimeFilter from '../components/TimeFilter';

const MetricCard = ({ title, value, change, trendLabel, icon: Icon, isGold = false, path }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => path && navigate(path)}
            className={clsx(
                "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all active:scale-[0.98]",
                path ? "cursor-pointer hover:border-premium-blue-100" : "",
                isGold ? "hover:shadow-premium-gold-900/5" : "hover:shadow-premium-blue-900/5"
            )}
        >
            <div>
                <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none mb-3">{title}</p>
                <h3 className="text-2xl font-black text-premium-blue-900 tracking-tight">{value}</h3>
                {(change !== undefined && change !== null) && (
                    <div className={clsx("text-[10px] font-black uppercase tracking-wider mt-2 flex items-center gap-1.5", change >= 0 ? "text-emerald-600" : "text-red-500")}>
                        <TrendingUp size={12} className={change < 0 ? "rotate-180" : ""} />
                        <span>{change > 0 ? '+' : ''}{change}% {trendLabel}</span>
                    </div>
                )}
            </div>
            <div className={clsx("p-4 rounded-2xl group-hover:scale-110 transition-transform",
                isGold ? "bg-premium-gold-50 text-premium-gold-600" : "bg-premium-blue-50 text-premium-blue-600")}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
        </div>
    );
};

export default function ExecutiveDashboard() {
    // Data handling moved to useCollection hooks below

    const [selectedStage, setSelectedStage] = useState(null);
    const [timeRange, setTimeRange] = useState('day');
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);
    const navigate = useNavigate();

    // Fetch Data on Mount
    const { data: projects, loading: pLoading } = useCollection('projects');
    const { data: leads, loading: lLoading } = useCollection('leads');
    const { data: issues, loading: iLoading } = useCollection('project_issues');

    // Explicitly using dummy variable to avoid unused warning if we want; 
    // or just relying on standard loading overlay.
    // However, the original code used a single loading state. 
    const loading = pLoading || lLoading || iLoading;

    // Remove old useEffect for subscriptions since useCollection handles it.

    // Helper: Filter by Range
    const filterByRange = (data, range, refDate) => {
        const anchor = new Date(refDate);
        return data.filter(item => {
            if (!item.date && !item.created_at) return true;
            // Handle both string date and Firestore timestamp (if needed, but mock data uses strings for dates primarily, or we accept created_at)
            // For simplify, we assume 'date' field exists as string YYYY-MM-DD or similar from seeder
            const itemDate = new Date(item.date || item.created_at);

            if (range === 'day') return itemDate.toDateString() === anchor.toDateString();
            if (range === 'week') {
                const weekStart = new Date(anchor);
                weekStart.setDate(anchor.getDate() - anchor.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return itemDate >= weekStart && itemDate <= weekEnd;
            }
            if (range === 'month') return itemDate.getMonth() === anchor.getMonth() && itemDate.getFullYear() === anchor.getFullYear();
            if (range === 'year') return itemDate.getFullYear() === anchor.getFullYear();
            return true;
        });
    };

    // Helper: Get Previous Reference Date
    const getPreviousDate = (refDate, range) => {
        const date = new Date(refDate);
        if (range === 'day') date.setDate(date.getDate() - 1);
        if (range === 'week') date.setDate(date.getDate() - 7);
        if (range === 'month') date.setMonth(date.getMonth() - 1);
        if (range === 'year') date.setFullYear(date.getFullYear() - 1);
        return date.toISOString().split('T')[0];
    };

    // Current Range Calculation
    const filteredProjects = filterByRange(projects, timeRange, referenceDate);
    const filteredLeads = filterByRange(leads, timeRange, referenceDate);
    const filteredIssues = filterByRange(issues, timeRange, referenceDate);

    // Previous Range Calculation
    const previousDate = getPreviousDate(referenceDate, timeRange);
    const previousFilteredLeads = filterByRange(leads, timeRange, previousDate);

    // 1. Revenue
    const revenueValue = filteredLeads
        .filter(l => l.stage === 'won')
        .reduce((sum, lead) => sum + (lead.rawValue || 0), 0);
    const totalRevenue = `₦${revenueValue.toLocaleString()}`;

    // Previous Revenue
    const previousRevenueValue = previousFilteredLeads
        .filter(l => l.stage === 'won')
        .reduce((sum, lead) => sum + (lead.rawValue || 0), 0);

    // Revenue Trend
    const revenueChange = previousRevenueValue === 0
        ? (revenueValue > 0 ? 100 : 0)
        : Math.round(((revenueValue - previousRevenueValue) / previousRevenueValue) * 100);

    // 2. Active Projects (Stock: Current state, ignore time filter)
    const activeProjectsCount = projects.filter(p => p.status !== 'Completed').length;

    // 3. New Leads
    const newLeadsCount = filteredLeads.filter(l => l.stage === 'new').length;

    // Previous New Leads
    const previousNewLeadsCount = previousFilteredLeads.filter(l => l.stage === 'new').length;

    // Leads Trend
    const leadsChange = previousNewLeadsCount === 0
        ? (newLeadsCount > 0 ? 100 : 0)
        : Math.round(((newLeadsCount - previousNewLeadsCount) / previousNewLeadsCount) * 100);

    // 4. Issues (Stock: Current risk state, ignore time filter)
    const operationalIssuesCount = projects.filter(p => p.health === 'risk' || p.health === 'warning').length;

    // Dynamic Trend Label
    const getTrendLabel = () => {
        if (timeRange === 'day') return 'from yesterday';
        if (timeRange === 'week') return 'from last week';
        if (timeRange === 'month') return 'from last month';
        if (timeRange === 'year') return 'from last year';
        return '';
    };
    const trendLabel = getTrendLabel();

    // 5. Stages Distribution (Stock: Current distribution, ignore time filter)
    const stages = [
        { name: 'Planning', desc: 'Drafting technical blueprints' },
        { name: 'Procurement', desc: 'Coordinating equipment logistics' },
        { name: 'Installation', desc: 'Deploying onsite teams' },
        { name: 'Testing', desc: 'Validating performance' },
        { name: 'Handover', desc: 'Official commissioning' }
    ];
    const stagesDistribution = stages.map(stage => ({
        name: stage.name,
        description: stage.desc,
        count: projects.filter(p => p.phase === stage.name).length
    }));

    // 6. Conversion Stats (Time-bound analysis of leads in this period)
    const wonLeads = filteredLeads.filter(l => l.stage === 'won').length;
    const totalLeadsCount = filteredLeads.length;
    const conversionRate = totalLeadsCount > 0 ? Math.round((wonLeads / totalLeadsCount) * 100) : 0;
    const avgDealValueRaw = totalLeadsCount > 0 ? (filteredLeads.reduce((sum, l) => sum + (l.rawValue || 0), 0) / totalLeadsCount) : 0;
    const avgValue = `₦${avgDealValueRaw.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    // Top Source
    const sources = {};
    filteredLeads.forEach(l => sources[l.source] = (sources[l.source] || 0) + 1);
    const topSource = Object.keys(sources).sort((a, b) => sources[b] - sources[a])[0] || 'N/A';

    const conversionStats = {
        distribution: [
            { name: 'Won', value: wonLeads, color: '#10b981' },
            { name: 'Active', value: totalLeadsCount - wonLeads, color: '#3b82f6' }
        ],
        conversionRate,
        avgValue,
        topSource
    };

    const filteredProjectsForStage = (stage) => {
        return projects.filter(p => { // Use 'projects' (all) then filter, or use filteredProjects? 
            // The original code re-filtered MOCK_PROJECTS for stage AND date.
            // Let's use filteredProjects which is already date filtered.
            // BUT we need to check if 'p' is inside filteredProjects.
            // Efficient way:
            const itemDate = new Date(p.date || p.created_at);
            const anchor = new Date(referenceDate);
            // ... (Duplicate date logic or trust filteredProjects)
            // Let's just filter 'filteredProjects' by phase.
            return filteredProjects.some(fp => fp.id === p.id);
        }).filter(p => p.phase === stage);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-8">
            {/* Header: Executive Space Management */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-premium-blue-900 tracking-tight leading-none">Management Control</h1>
                    <p className="text-slate-500 font-bold mt-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] opacity-60">Enterprise Intelligence Center</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <TimeFilter
                        activeRange={timeRange}
                        referenceDate={referenceDate}
                        onRangeChange={setTimeRange}
                        onDateChange={setReferenceDate}
                    />
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <MetricCard title="Total Revenue" value={totalRevenue} change={revenueChange} trendLabel={trendLabel} icon={DollarSign} isGold path="/finance" />
                <MetricCard title="Active Projects" value={activeProjectsCount} icon={Calendar} path="/projects" />
                <MetricCard title="New Leads" value={newLeadsCount} change={leadsChange} trendLabel={trendLabel} icon={Users} path="/sales" />
                <MetricCard title="Operational Issues" value={operationalIssuesCount} icon={AlertCircle} path="/operations/issues" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Conversion Insights */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-premium-blue-900 mb-6">Lead Conversion Insights</h3>
                    <div className="flex flex-col gap-6">
                        <div className="h-32 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={conversionStats.distribution}
                                        innerRadius={35}
                                        outerRadius={50}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {conversionStats.distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                <span className="text-xl font-bold text-premium-blue-900">{conversionStats.conversionRate}%</span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Conv. Rate</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Avg. Deal Value</span>
                                <span className="text-premium-blue-900 font-bold">{conversionStats.avgValue}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Top Source</span>
                                <span className="text-premium-blue-600 font-bold">{conversionStats.topSource}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-100 flex gap-2">
                                {conversionStats.distribution.map(d => (
                                    <div key={d.name} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                        <span className="text-[10px] text-slate-500 font-medium uppercase">{d.name} ({d.value})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Distribution (Now Bigger - col-span-2) */}
                {/* Project Distribution: Intelligence Tiles */}
                <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 lg:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black text-premium-blue-900 uppercase tracking-tight">Project Momentum</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cross-Stage Execution Logistics</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col xl:flex-row gap-8">
                        {/* Stages List */}
                        <div className="flex-1 space-y-3">
                            {stagesDistribution.map((stage, i) => (
                                <div
                                    key={stage.name}
                                    onClick={() => setSelectedStage(stage.name)}
                                    className={clsx(
                                        "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border",
                                        selectedStage === stage.name
                                            ? "bg-premium-blue-900 border-premium-blue-900 shadow-xl shadow-premium-blue-900/20 text-white"
                                            : "bg-slate-50 border-transparent hover:border-slate-200 text-slate-700"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full",
                                            selectedStage === stage.name ? "bg-premium-gold-400" : "bg-premium-blue-300"
                                        )}></div>
                                        <div>
                                            <span className="text-sm font-black uppercase tracking-tight leading-none block">{stage.name}</span>
                                            <span className={clsx("text-[10px] font-bold mt-1 block", selectedStage === stage.name ? "text-blue-200" : "text-slate-400")}>{stage.description}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-xl tracking-tighter">{stage.count}</span>
                                        <ChevronRight size={16} className={clsx("transition-transform", selectedStage === stage.name ? "text-premium-gold-400 rotate-90" : "text-slate-300")} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Expanded Detail View */}
                        {selectedStage && (
                            <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                                    <div>
                                        <h4 className="font-bold text-premium-blue-900">{selectedStage} Projects</h4>
                                        <p className="text-xs text-slate-500">
                                            {filteredProjectsForStage(selectedStage).length} Active Projects in this stage
                                        </p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedStage(null); }} className="text-slate-400 hover:text-red-500">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-3 shadow-inner max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                                    {filteredProjectsForStage(selectedStage).map((project) => (
                                        <div key={project.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-bold text-sm text-slate-800">{project.name}</h5>
                                                <span className="text-xs font-bold text-premium-blue-600 bg-premium-blue-50 px-2 py-0.5 rounded">{project.value}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span>{project.client}</span>
                                                {project.health === 'risk' && (
                                                    <span className="flex items-center gap-1 text-red-500 font-medium">
                                                        <Clock size={12} /> At Risk
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredProjectsForStage(selectedStage).length === 0 && (
                                        <div className="text-center py-6 text-slate-400 text-xs italic">
                                            No projects in this stage currently.
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => navigate('/projects', { state: { filterPhase: selectedStage } })}
                                    className="w-full mt-4 py-2 text-xs font-bold text-premium-blue-700 hover:bg-premium-blue-100 rounded-lg transition-colors"
                                >
                                    View All {selectedStage} Projects
                                </button>
                            </div>
                        )}

                        {!selectedStage && (
                            <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 flex-col gap-2">
                                <Users size={32} className="opacity-20" />
                                <p className="text-sm">Select a stage to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
