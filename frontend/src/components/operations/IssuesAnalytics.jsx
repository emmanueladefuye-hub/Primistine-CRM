import React from 'react';
import {
    BarChart3, TrendingUp, AlertTriangle, Clock, CheckCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useIssues } from '../../contexts/IssuesContext';
import { useAutoScroll } from '../../hooks/useAutoScroll';

export default function IssuesAnalytics() {
    const { issues, loading } = useIssues();
    const { containerRef, handleMouseMove, handleMouseLeave } = useAutoScroll();

    if (loading) return <div className="p-8 text-center text-slate-400">Loading analytics...</div>;

    // --- Statistics Calculations ---

    const totalStats = {
        total: issues.length,
        critical: issues.filter(i => i.severity === 'Critical').length,
        resolved: issues.filter(i => i.status === 'Resolved').length,
        open: issues.filter(i => i.status === 'Open').length
    };

    // Group by Category (Issue Title Keyword or separate type if exists. Using basic logic for now if type missing)
    // Assuming 'type' field might not exist on all, so grouping by Severity for Chart 1 or similar
    // Let's stick to Status for Bar Chart since Category might be missing
    const statusCounts = { Open: 0, 'In Progress': 0, Resolved: 0, 'Waiting for Review': 0 };
    issues.forEach(i => {
        const s = i.status || 'Open';
        if (statusCounts[s] !== undefined) statusCounts[s]++;
        else statusCounts['Open']++;
    });
    const byStatus = Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] }));

    // Group by Severity
    const sevs = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    issues.forEach(i => {
        const s = i.severity || 'Medium';
        if (sevs[s] !== undefined) sevs[s]++;
        else sevs['Medium']++; // Fallback
    });
    const bySeverity = Object.keys(sevs).map(k => ({ name: k, value: sevs[k] }));

    // Top Reporters
    const reporters = {};
    issues.forEach(i => {
        const name = i.reporter?.name || 'Unknown';
        reporters[name] = (reporters[name] || 0) + 1;
    });
    const topReporters = Object.entries(reporters)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));


    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    const SEV_COLORS = {
        Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#2563eb'
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="h-full bg-slate-50 overflow-y-auto p-6 no-scrollbar"
        >
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <div className="max-w-6xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Issues Analytics</h2>
                        <p className="text-slate-500">Track field performance and identify recurring problems.</p>
                    </div>
                </div>

                {/* HEADLINES */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard label="Total Issues" value={totalStats.total} icon={BarChart3} />
                    <StatCard label="Critical Incidents" value={totalStats.critical} color={totalStats.critical > 0 ? "red" : "slate"} icon={AlertTriangle} />
                    <StatCard label="Resolved" value={totalStats.resolved} color="green" icon={CheckCircle} />
                    <StatCard label="Open / Pending" value={totalStats.open} color="blue" icon={Clock} />
                </div>

                {/* CHARTS ROW 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Issues by Status */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Issues by Status</h3>
                        {totalStats.total === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-400">No data</div>
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={byStatus}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: '#f1f5f9' }}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                            {byStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Issues by Severity */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Severity Distribution</h3>
                        {totalStats.total === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-400">No data</div>
                        ) : (
                            <>
                                <div className="h-64 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={bySeverity}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {bySeverity.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={SEV_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                                    {bySeverity.filter(x => x.value > 0).map((entry) => (
                                        <span key={entry.name} className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEV_COLORS[entry.name] }}></span>
                                            {entry.name} ({entry.value})
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* TOP REPORTERS / ENGINEERS */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Top Reporters</h3>
                    </div>
                    {topReporters.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">No reporting activity yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {topReporters.map((reporter, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-xs text-blue-600 border border-blue-100">
                                            {reporter.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-700">{reporter.name}</h4>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-800">{reporter.count}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">Reports</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

function StatCard({ label, value, color, icon: Icon }) {
    const colorClasses = {
        red: "text-red-900 bg-red-100",
        orange: "text-orange-900 bg-orange-100",
        blue: "text-blue-900 bg-blue-100",
        green: "text-green-900 bg-green-100",
        slate: "text-slate-900 bg-slate-100",
    }[color] || "text-slate-900 bg-slate-100";

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between relative z-10 mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
                <span className={`p-1.5 rounded-lg ${colorClasses}`}><Icon size={16} /></span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-slate-800">{value}</span>
            </div>
        </div>
    );
}
