import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, AlertCircle, DollarSign, Calendar, ChevronRight, X, Clock } from 'lucide-react';
import clsx from 'clsx';
import { db } from '../lib/firebase';
import { useLeads } from '../contexts/LeadsContext';
import { useProjects } from '../contexts/ProjectsContext';
import { useIssues } from '../contexts/IssuesContext';
import TimeFilter from '../components/TimeFilter';
import WeatherAlertBanner from '../components/dashboard/WeatherAlertBanner';
import { filterByRange, ensureDate } from '../lib/constants';
import ErrorBoundary from '../components/ErrorBoundary';

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
            <div className="min-w-0 flex-1 pr-4">
                <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none mb-3 truncate">{title}</p>
                <h3 className="text-2xl font-black text-premium-blue-900 tracking-tight truncate" title={value}>{value}</h3>
                {(change !== undefined && change !== null) && (
                    <div className={clsx("text-[10px] font-black uppercase tracking-wider mt-2 flex items-center gap-1.5 truncate", change >= 0 ? "text-emerald-600" : "text-red-500")}>
                        <TrendingUp size={12} className={change < 0 ? "rotate-180" : ""} />
                        <span className="truncate">{change > 0 ? '+' : ''}{change}% {trendLabel}</span>
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
    const [selectedStage, setSelectedStage] = useState(null);
    const [timeRange, setTimeRange] = useState('day');
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);
    const navigate = useNavigate();

    // Consume data from Central Contexts
    const { projects, loading: pLoading } = useProjects();
    const { leads, loading: lLoading } = useLeads();
    const { issues, loading: iLoading } = useIssues();

    const loading = pLoading || lLoading || iLoading;

    // Local helper removed in favor of global filterByRange from constants.js

    // Helper: Get Previous Reference Date
    const getPreviousDate = (refDate, range) => {
        const date = ensureDate(refDate);
        if (range === 'day') date.setDate(date.getDate() - 1);
        if (range === 'week') date.setDate(date.getDate() - 7);
        if (range === 'month') date.setMonth(date.getMonth() - 1);
        if (range === 'year') date.setFullYear(date.getFullYear() - 1);
        try {
            return date.toISOString().split('T')[0];
        } catch (e) {
            return new Date().toISOString().split('T')[0];
        }
    };

    // Current Range Calculation (Memoized)
    const filteredProjects = useMemo(() => filterByRange(projects || [], timeRange, referenceDate), [projects, timeRange, referenceDate]);
    const filteredLeads = useMemo(() => filterByRange(leads || [], timeRange, referenceDate), [leads, timeRange, referenceDate]);
    const filteredIssues = useMemo(() => filterByRange(issues || [], timeRange, referenceDate), [issues, timeRange, referenceDate]);

    // Previous Range Calculation
    const previousDate = useMemo(() => getPreviousDate(referenceDate, timeRange), [referenceDate, timeRange]);
    const previousFilteredLeads = useMemo(() => filterByRange(leads || [], timeRange, previousDate), [leads, timeRange, previousDate]);

    // Metrics Calculation (Memoized)
    const metrics = useMemo(() => {
        const parseValue = (val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
            return 0;
        };

        // 1. Revenue
        const revenueValue = filteredLeads
            .filter(l => l.stage === 'won')
            .reduce((sum, lead) => sum + parseValue(lead.value || lead.rawValue), 0);

        const previousRevenueValue = previousFilteredLeads
            .filter(l => l.stage === 'won')
            .reduce((sum, lead) => sum + parseValue(lead.value || lead.rawValue), 0);

        let revenueChange = 0;
        if (previousRevenueValue > 0) {
            revenueChange = Math.round(((revenueValue - previousRevenueValue) / previousRevenueValue) * 100);
        } else if (revenueValue > 0) {
            revenueChange = 100;
        }

        // 2. Active Projects
        const activeProjectsCount = (projects || []).filter(p => p.status !== 'Completed').length;

        // 3. New Leads
        const newLeadsCount = filteredLeads.filter(l => l.stage === 'new').length;
        const previousNewLeadsCount = previousFilteredLeads.filter(l => l.stage === 'new').length;

        const leadsChange = previousNewLeadsCount === 0
            ? (newLeadsCount > 0 ? 100 : 0)
            : Math.round(((newLeadsCount - previousNewLeadsCount) / previousNewLeadsCount) * 100);

        // 4. Issues
        const operationalIssuesCount = (projects || []).filter(p => p.health === 'risk' || p.health === 'warning').length;

        // 5. Conversion Stats
        const wonLeads = filteredLeads.filter(l => l.stage === 'won').length;
        const totalLeadsCount = filteredLeads.length;
        const conversionRate = totalLeadsCount > 0 ? Math.round((wonLeads / totalLeadsCount) * 100) : 0;
        const totalValueInPeriod = filteredLeads.reduce((sum, l) => sum + parseValue(l.value || l.rawValue), 0);
        const avgDealValueRaw = totalLeadsCount > 0 ? (totalValueInPeriod / totalLeadsCount) : 0;

        const sources = {};
        filteredLeads.forEach(l => sources[l.source] = (sources[l.source] || 0) + 1);
        const topSource = Object.keys(sources).sort((a, b) => sources[b] - sources[a])[0] || 'N/A';

        // 6. Stages Distribution
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
            count: (projects || []).filter(p => p.phase === stage.name).length
        }));

        return {
            totalRevenue: `₦${revenueValue.toLocaleString()}`,
            revenueChange,
            activeProjectsCount,
            newLeadsCount,
            leadsChange,
            operationalIssuesCount,
            conversionStats: {
                distribution: [
                    { name: 'Won', value: wonLeads, color: '#10b981' },
                    { name: 'Active', value: totalLeadsCount - wonLeads, color: '#3b82f6' }
                ],
                conversionRate,
                avgValue: `₦${avgDealValueRaw.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                topSource
            },
            stagesDistribution
        };
    }, [filteredLeads, previousFilteredLeads, projects]);

    // Trend Label (Memoized)
    const trendLabel = useMemo(() => {
        if (timeRange === 'day') return 'from yesterday';
        if (timeRange === 'week') return 'from last week';
        if (timeRange === 'month') return 'from last month';
        if (timeRange === 'year') return 'from last year';
        return '';
    }, [timeRange]);

    const filteredProjectsForStage = useCallback((stage) => {
        return (projects || []).filter(p => {
            const itemDate = new Date(p.date || p.created_at);
            const anchor = new Date(referenceDate);
            // This is actually redundant if we just want to show WHAT IS CURRENTLY IN THAT STAGE regardless of filter, 
            // but the original code seems to have mixed intent. 
            // Usually "Active Projects" in a stage is a CURRENT state (stock).
            // Let's stick to phase filtering on the full projects list for the stage breakdown.
            return p.phase === stage;
        });
    }, [projects]);

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

            {/* Weather Alert Banner */}
            <WeatherAlertBanner projects={projects} />

            {/* Metrics Grid */}
            <ErrorBoundary minimal>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <MetricCard title="Total Revenue" value={metrics.totalRevenue} change={metrics.revenueChange} trendLabel={trendLabel} icon={DollarSign} isGold path="/finance" />
                    <MetricCard title="Active Projects" value={metrics.activeProjectsCount} icon={Calendar} path="/projects" />
                    <MetricCard title="New Leads" value={metrics.newLeadsCount} change={metrics.leadsChange} trendLabel={trendLabel} icon={Users} path="/sales" />
                    <MetricCard title="Operational Issues" value={metrics.operationalIssuesCount} icon={AlertCircle} path="/operations/issues" />
                </div>
            </ErrorBoundary>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Conversion Insights */}
                <ErrorBoundary minimal>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-premium-blue-900 mb-6">Lead Conversion Insights</h3>
                        <div className="flex flex-col gap-6">
                            <div className="h-32 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={metrics.conversionStats.distribution}
                                            innerRadius={35}
                                            outerRadius={50}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {metrics.conversionStats.distribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-xl font-bold text-premium-blue-900">{metrics.conversionStats.conversionRate}%</span>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Conv. Rate</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Avg. Deal Value</span>
                                    <span className="text-premium-blue-900 font-bold">{metrics.conversionStats.avgValue}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Top Source</span>
                                    <span className="text-premium-blue-600 font-bold">{metrics.conversionStats.topSource}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-100 flex gap-2">
                                    {metrics.conversionStats.distribution.map(d => (
                                        <div key={d.name} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                            <span className="text-[10px] text-slate-500 font-medium uppercase">{d.name} ({d.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>

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
                            {metrics.stagesDistribution.map((stage, i) => (
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
