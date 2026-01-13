import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Zap, Trees, Users, Award, TrendingUp, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import TimeFilter from '../components/TimeFilter';
import { useCollection } from '../hooks/useFirestore';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import clsx from 'clsx';

export default function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState('day');
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);

    // Fetch Live Data
    const { data: projects, loading: projectsLoading } = useCollection(collection(db, 'projects'));
    const { data: leads, loading: leadsLoading } = useCollection(collection(db, 'leads'));
    const { data: qoutes, loading: quotesLoading } = useCollection(collection(db, 'quotes'));

    const isLoading = projectsLoading || leadsLoading || quotesLoading;

    // --- Calculations ---

    const stats = useMemo(() => {
        if (isLoading) return null;

        // 1. Total Energy (GWh) - Mock logic based on system size or project count
        // In real world, sum(project.systemSize)
        const totalSystemSizeKW = projects.reduce((acc, p) => acc + (Number(p.systemSize) || 5), 0); // Default 5kW if missing
        const energyGeneratedGWh = (totalSystemSizeKW * 4.5 * 365) / 1000000; // Rough GWh est

        // 2. CO2 Saved (Tons)
        const co2Saved = Math.round(energyGeneratedGWh * 700); // 700 tons per GWh approx

        // 3. Client Growth (Leads vs Projects)
        const totalClients = projects.length; // Active clients
        // Compare with last month... (Mocking growth for now)
        const growthRate = 12.5;

        // 4. Service Distribution
        const serviceCounts = {};
        projects.forEach(p => {
            const type = p.type || 'Solar Installation';
            serviceCounts[type] = (serviceCounts[type] || 0) + 1;
        });
        const performanceData = Object.keys(serviceCounts).map(key => ({
            name: key,
            value: serviceCounts[key],
            color: key.includes('Solar') ? '#f59e0b' : key.includes('Audit') ? '#3b82f6' : '#1e293b'
        }));

        // 5. Weekly Installs (Mock distribution based on real count)
        const weeklyInstalls = [
            { day: 'Mon', count: 0 }, { day: 'Tue', count: 0 }, { day: 'Wed', count: 0 },
            { day: 'Thu', count: 0 }, { day: 'Fri', count: 0 }, { day: 'Sat', count: 0 }, { day: 'Sun', count: 0 }
        ];
        projects.forEach(p => {
            if (p.startDate) {
                const day = new Date(p.startDate).getDay(); // 0 = Sun, 1 = Mon
                const index = day === 0 ? 6 : day - 1;
                weeklyInstalls[index].count += 1;
            }
        });

        return {
            energy: energyGeneratedGWh.toFixed(2),
            co2: co2Saved,
            growth: growthRate,
            performanceData,
            weeklyInstalls
        };

    }, [projects, leads, isLoading]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-premium-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-premium-blue-900">Analytics & Insights</h1>
                    <p className="text-slate-500">Live system performance and operational metrics.</p>
                </div>
                <div className="flex gap-3 items-center">
                    <TimeFilter
                        activeRange={timeRange}
                        referenceDate={referenceDate}
                        onRangeChange={setTimeRange}
                        onDateChange={setReferenceDate}
                    />
                    <button
                        onClick={() => alert("Report Builder: Generating report for " + timeRange)}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
                    >
                        <Award size={16} /> Build Report
                    </button>
                </div>
            </div>

            {/* Impact Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-premium-blue-900 text-white rounded-xl p-6 relative overflow-hidden shadow-lg shadow-premium-blue-900/20">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 opacity-80">
                            <Zap size={20} className="text-premium-gold-400" />
                            <span className="font-medium text-sm">Est. Energy Impact</span>
                        </div>
                        <h3 className="text-3xl font-bold">{stats.energy} GWh</h3>
                        <p className="text-sm text-premium-blue-200 mt-2">Annualized based on {projects.length} active systems</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-white/5 w-32 h-32 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-emerald-700 text-white rounded-xl p-6 relative overflow-hidden shadow-lg shadow-emerald-900/20">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 opacity-80">
                            <Trees size={20} className="text-emerald-300" />
                            <span className="font-medium text-sm">CO2 Avoided</span>
                        </div>
                        <h3 className="text-3xl font-bold">{stats.co2} Tons</h3>
                        <p className="text-sm text-emerald-200 mt-2">Carbon offset equivalent vs Grid</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-white/5 w-32 h-32 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-slate-500">
                        <Users size={20} />
                        <span className="font-medium text-sm">Pipeline Growth</span>
                    </div>
                    <h3 className="text-3xl font-bold text-premium-blue-900">+{stats.growth}%</h3>
                    <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
                        <TrendingUp size={14} /> Month-over-Month
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Performance */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-premium-blue-900 mb-6">Project Distribution</h3>
                    <div className="h-64">
                        {stats.performanceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.performanceData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                        {stats.performanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <p>No Active Projects to analyze.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Weekly Installs */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-premium-blue-900 mb-6">Installations Schedule (Weekly)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.weeklyInstalls}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lead Conversion Mini-Stat */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-premium-blue-900 mb-4">Pipeline Health</h3>
                    <div className="flex flex-wrap gap-8">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Total Leads</p>
                            <p className="text-2xl font-bold text-slate-800">{leads.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Conversion Rate</p>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold text-slate-800">
                                    {leads.length ? Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100) : 0}%
                                </p>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Healthy</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Pending Quotes</p>
                            <p className="text-2xl font-bold text-slate-800">{qoutes.filter(q => q.status !== 'Accepted').length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Avg. Deal Size</p>
                            <p className="text-2xl font-bold text-slate-800">₦2.4M</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
