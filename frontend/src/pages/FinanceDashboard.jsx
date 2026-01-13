import { DollarSign, TrendingUp, TrendingDown, FileText, Download, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import clsx from 'clsx';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import TimeFilter from '../components/TimeFilter';
import { useCollection } from '../hooks/useFirestore';
import { useInvoices } from '../contexts/InvoicesContext';
import { orderBy } from 'firebase/firestore';
import Skeleton from '../components/ui/Skeleton';

export default function FinanceDashboard() {
    const [timeRange, setTimeRange] = useState('day');
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);

    // Live Data
    const { invoices, loading } = useInvoices();

    // Derived Metrics
    // 1. Total Revenue (Sum of PAID invoices)
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalRevenueValue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.subtotal || inv.total || 0)), 0);
    const totalRevenue = `₦${(totalRevenueValue / 1000000).toFixed(2)}M`;

    // 2. Outstanding (Sum of PENDING/OVERDUE)
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue');
    const totalOutstandingValue = pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.subtotal || inv.total || 0)), 0);
    const totalOutstanding = `₦${(totalOutstandingValue / 1000000).toFixed(2)}M`;

    // 3. Fake Expenses (for now, 60% of revenue to show realistic data)
    const totalExpensesValue = totalRevenueValue * 0.6;
    const totalExpenses = `₦${(totalExpensesValue / 1000000).toFixed(2)}M`;

    // 4. Net Profit
    const netProfitValue = totalRevenueValue - totalExpensesValue;
    const netProfit = `₦${(netProfitValue / 1000000).toFixed(2)}M`;

    // Chart Data Construction
    // Group invoices by month for the chart
    const chartDataMap = {};
    invoices.forEach(inv => {
        const date = new Date(inv.date);
        const month = date.toLocaleString('default', { month: 'short' });
        if (!chartDataMap[month]) chartDataMap[month] = { month, revenue: 0, expenses: 0 };
        if (inv.status === 'Paid') {
            const amount = parseFloat(inv.subtotal || inv.total || 0);
            chartDataMap[month].revenue += amount;
            chartDataMap[month].expenses += (amount * 0.6); // Simulated
        }
    });
    // Convert map to array and sorting can be tricky with just month names, 
    // so we'll use a fixed list of months to order them or just use what we have found.
    // For simplicity, let's just use the current data map values.
    const chartData = Object.values(chartDataMap);
    if (chartData.length === 0) {
        // Fallback if no data
        chartData.push({ month: 'No Data', revenue: 0, expenses: 0 });
    }

    // 5. Active Projects Count
    const { data: projects } = useCollection('projects');
    const activeProjectsCount = projects.filter(p => p.status !== 'Completed').length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-8">
            {/* Header: Executive Space Management */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-premium-blue-900 tracking-tight leading-none">Financial Intelligence</h1>
                    <p className="text-slate-500 font-bold mt-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] opacity-60">Capital & Revenue Management</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none">
                        <TimeFilter
                            activeRange={timeRange}
                            referenceDate={referenceDate}
                            onRangeChange={setTimeRange}
                            onDateChange={setReferenceDate}
                        />
                    </div>
                    <button className="flex-1 sm:flex-none justify-center flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-premium-blue-900 transition-all active:scale-95 shadow-sm">
                        <Download size={16} strokeWidth={3} /> Export
                    </button>
                </div>
            </div>

            {/* Metrics Row: Executive High-Density */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-emerald-900/5 transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none mb-3">Total Revenue</p>
                        <h3 className="text-2xl font-black text-premium-blue-900 tracking-tight">{totalRevenue}</h3>
                    </div>
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={24} strokeWidth={2.5} /></div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-amber-900/5 transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none mb-3">Outstanding</p>
                        <h3 className="text-2xl font-black text-premium-blue-900 tracking-tight">{totalOutstanding}</h3>
                    </div>
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform"><FileText size={24} strokeWidth={2.5} /></div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-premium-gold-900/5 transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none mb-3">Net Profit</p>
                        <h3 className="text-2xl font-black text-premium-gold-600 italic tracking-tight">{netProfit}</h3>
                    </div>
                    <div className="p-4 bg-premium-gold-50 text-premium-gold-600 rounded-2xl group-hover:scale-110 transition-transform"><DollarSign size={24} strokeWidth={2.5} /></div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-blue-900/5 transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none mb-3">Active Projects</p>
                        <h3 className="text-2xl font-black text-premium-blue-900 tracking-tight">{activeProjectsCount} Units</h3>
                    </div>
                    <div className="p-4 bg-blue-50 text-premium-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={24} strokeWidth={2.5} /></div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black text-premium-blue-900 uppercase tracking-tight">Revenue Flux</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cash Inflow vs Simulated Expenditure</p>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#1e3a8a" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} name="Revenue" />
                                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} name="Expenses" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black text-premium-blue-900 uppercase tracking-tight">Active Accounts</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Invoice Intelligence</p>
                        </div>
                        <Link to="/project" className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-premium-blue-900 hover:bg-slate-50 transition-all"><Filter size={14} /></Link>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {loading && <Skeleton count={4} className="h-20 rounded-2xl mb-4" />}
                        {!loading && invoices.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <FileText size={48} className="opacity-20 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Activity Recorded</p>
                            </div>
                        )}

                        {!loading && invoices.slice(0, 6).map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-premium-blue-600 group-hover:shadow-inner transition-all shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-premium-blue-900 truncate tracking-tight leading-tight">{inv.projectTitle || 'Project Settlement'}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{inv.date}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-slate-700 tracking-tighter">₦{(inv.total || inv.subtotal || 0).toLocaleString()}</p>
                                    <span className={clsx("text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border mt-1 inline-block",
                                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            inv.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-red-50 text-red-700 border-red-100'
                                    )}>
                                        {inv.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/project" className="mt-8 w-full py-3 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest text-center rounded-2xl hover:bg-slate-100 hover:text-premium-blue-900 transition-all border border-slate-100">Executive Ledger Overview</Link>
                </div>
            </div>
        </div>
    );
}
