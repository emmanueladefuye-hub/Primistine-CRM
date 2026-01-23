import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import {
    Activity, ShieldAlert, Database, Terminal, AlertCircle, CheckCircle2,
    Users, FolderOpen, Trash2, RefreshCw, Settings, Zap, ToggleLeft, ToggleRight,
    HardDrive, AlertTriangle, Play, Pause, Download, Wrench, Briefcase, FileText,
    MessageSquare, Package, Calendar, ChevronRight
} from 'lucide-react';
import { PremiumCard, PremiumButton } from '../components/ui';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { initializeRoles } from '../lib/systemInit';
import { useLeads } from '../contexts/LeadsContext';
import { useProjects } from '../contexts/ProjectsContext';
import { useAudits } from '../contexts/AuditsContext';
import { useIssues } from '../contexts/IssuesContext';
import { useTeams } from '../contexts/TeamsContext';
import clsx from 'clsx';

// Stat card component with navigation
const StatCard = ({ label, value, icon: Icon, color = 'blue', path, onClick }) => {
    const navigate = useNavigate();
    const handleClick = () => {
        if (onClick) onClick();
        else if (path) navigate(path);
    };

    const colorStyles = {
        blue: 'bg-premium-blue-500/10 text-premium-blue-500',
        green: 'bg-green-500/10 text-green-500',
        amber: 'bg-amber-500/10 text-amber-500',
        purple: 'bg-purple-500/10 text-purple-500',
        red: 'bg-red-500/10 text-red-500',
        gold: 'bg-premium-gold-500/10 text-premium-gold-500'
    };

    return (
        <button
            onClick={handleClick}
            disabled={!path && !onClick}
            className={clsx(
                "bg-white p-4 text-left hover:bg-slate-50 transition-all rounded-xl border border-slate-100 group",
                (path || onClick) && "hover:border-premium-blue-200 hover:shadow-md cursor-pointer"
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", colorStyles[color])}>
                    <Icon size={16} />
                </div>
                {(path || onClick) && <ChevronRight size={14} className="text-slate-300 group-hover:text-premium-blue-500 transition-colors" />}
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">{label}</p>
        </button>
    );
};

export default function DiagnosticsDashboard() {
    const navigate = useNavigate();

    // Use existing contexts for live data
    const { leads } = useLeads();
    const { projects } = useProjects();
    const { audits } = useAudits();
    const { issues } = useIssues();
    const { teamMembers } = useTeams();

    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({
        latency: 'Measuring...',
        authStatus: 'Checking...',
        dbConnected: false
    });
    const [userStats, setUserStats] = useState({ total: 0, activeToday: 0, admins: 0 });
    const [messageCount, setMessageCount] = useState(0);
    const [inventoryCount, setInventoryCount] = useState(0);
    const [deploymentCount, setDeploymentCount] = useState(0);
    const [logCount, setLogCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isLiveStream, setIsLiveStream] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [featureFlags, setFeatureFlags] = useState({});
    const [errorSummary, setErrorSummary] = useState({ total: 0, byType: {} });

    // Fetch supplementary counts (collections not in contexts)
    const fetchSupplementaryCounts = useCallback(async () => {
        try {
            const [messagesSnap, inventorySnap, deploymentsSnap, usersSnap] = await Promise.all([
                getDocs(query(collection(db, 'messages'), limit(500))),
                getDocs(query(collection(db, 'inventory'), limit(500))),
                getDocs(query(collection(db, 'deployments'), limit(500))),
                getDocs(collection(db, 'users'))
            ]);

            setMessageCount(messagesSnap.size);
            setInventoryCount(inventorySnap.size);
            setDeploymentCount(deploymentsSnap.size);

            // User stats
            const users = usersSnap.docs.map(d => d.data());
            const today = new Date().toDateString();
            setUserStats({
                total: users.length,
                activeToday: users.filter(u => {
                    if (!u.lastLogin) return false;
                    try { return new Date(u.lastLogin).toDateString() === today; }
                    catch { return false; }
                }).length,
                admins: users.filter(u => ['super_admin', 'admin'].includes(u.role)).length
            });
        } catch (e) {
            console.error('Supplementary fetch error:', e);
        }
    }, []);

    // Fetch feature flags
    const fetchFeatureFlags = useCallback(async () => {
        try {
            const flagsDoc = await getDoc(doc(db, 'settings', 'feature_flags'));
            if (flagsDoc.exists()) {
                setFeatureFlags(flagsDoc.data());
            } else {
                const defaults = {
                    maintenance_mode: false,
                    new_lead_notifications: true,
                    auto_audit_reminders: true,
                    v2_lead_detail: true,
                    debug_mode: false
                };
                await setDoc(doc(db, 'settings', 'feature_flags'), defaults);
                setFeatureFlags(defaults);
            }
        } catch (e) {
            console.error('Failed to fetch feature flags', e);
        }
    }, []);

    useEffect(() => {
        // 1. Measure Latency & Subscribe to Logs
        const start = Date.now();
        const logsRef = collection(db, 'logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));

        let unsubscribe = () => { };
        if (isLiveStream) {
            unsubscribe = onSnapshot(q, (snapshot) => {
                const end = Date.now();
                setStats(prev => ({
                    ...prev,
                    latency: `${end - start}ms`,
                    dbConnected: true
                }));

                const logData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLogs(logData);
                setLogCount(logData.length);

                // Calculate error summary
                const errors = logData.filter(l => l.level === 'error');
                const byType = errors.reduce((acc, err) => {
                    const type = err.errorType || err.message?.slice(0, 30) || 'Unknown';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                }, {});
                setErrorSummary({ total: errors.length, byType });

                setLoading(false);
            }, (err) => {
                console.error("Diagnostics: Firestore error", err);
                setStats(prev => ({ ...prev, dbConnected: false }));
                setLoading(false);
            });
        }

        // 2. Auth Check
        const user = auth.currentUser;
        if (user) {
            user.getIdTokenResult().then(result => {
                setStats(prev => ({
                    ...prev,
                    authStatus: `Authenticated (${result.claims.role || 'no_role'})`
                }));
            });
        } else {
            setStats(prev => ({ ...prev, authStatus: 'Disconnected' }));
        }

        // 3. Initial Data Fetches
        fetchSupplementaryCounts();
        fetchFeatureFlags();

        return () => unsubscribe();
    }, [isLiveStream, fetchSupplementaryCounts, fetchFeatureFlags]);

    const getLevelStyles = (level) => {
        switch (level) {
            case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'warning': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    // Admin Actions
    const handleInitializeRoles = async () => {
        if (!window.confirm("This will reset all role templates to defaults. Continue?")) return;
        setActionLoading(prev => ({ ...prev, roles: true }));
        try {
            await initializeRoles();
            toast.success("Role templates initialized successfully");
        } catch (e) {
            toast.error("Failed to initialize roles");
        } finally {
            setActionLoading(prev => ({ ...prev, roles: false }));
        }
    };

    const handleClearOldLogs = async () => {
        if (!window.confirm("Delete logs older than 7 days? This action cannot be undone.")) return;
        setActionLoading(prev => ({ ...prev, logs: true }));
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 7);

            const logsSnap = await getDocs(collection(db, 'logs'));
            const batch = writeBatch(db);
            let count = 0;

            logsSnap.docs.forEach(docSnap => {
                const data = docSnap.data();
                if (data.timestamp?.seconds && new Date(data.timestamp.seconds * 1000) < cutoff) {
                    batch.delete(docSnap.ref);
                    count++;
                }
            });

            if (count > 0) {
                await batch.commit();
                toast.success(`Deleted ${count} old log entries`);
            } else {
                toast.success("No old logs to delete");
            }
        } catch (e) {
            toast.error("Failed to clear old logs");
            console.error(e);
        } finally {
            setActionLoading(prev => ({ ...prev, logs: false }));
        }
    };

    const handleToggleFlag = async (flag) => {
        setActionLoading(prev => ({ ...prev, [flag]: true }));
        try {
            const newValue = !featureFlags[flag];
            await setDoc(doc(db, 'settings', 'feature_flags'), { [flag]: newValue }, { merge: true });
            setFeatureFlags(prev => ({ ...prev, [flag]: newValue }));
            toast.success(`${flag.replace(/_/g, ' ')} ${newValue ? 'enabled' : 'disabled'}`);
        } catch (e) {
            toast.error("Failed to update feature flag");
        } finally {
            setActionLoading(prev => ({ ...prev, [flag]: false }));
        }
    };

    const handleExportLogs = () => {
        const dataStr = JSON.stringify(logs, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Logs exported successfully");
    };

    // Calculate totals from contexts (live data)
    const totalDocs = (leads?.length || 0) + (projects?.length || 0) + (audits?.length || 0) +
        (issues?.length || 0) + (teamMembers?.length || 0) + messageCount +
        inventoryCount + deploymentCount + logCount + userStats.total;

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Terminal className="text-premium-blue-500" />
                        System Diagnostics
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Admin control center • Click any card to navigate</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <PremiumButton variant="secondary" size="sm" onClick={handleExportLogs} icon={Download}>
                        Export Logs
                    </PremiumButton>
                    <PremiumButton variant="secondary" size="sm" onClick={() => { fetchSupplementaryCounts(); toast.success('Refreshed'); }} icon={RefreshCw}>
                        Refresh
                    </PremiumButton>
                </div>
            </header>

            {/* System Vitals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <PremiumCard padding="sm" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-premium-blue-500/10 text-premium-blue-500 flex items-center justify-center shrink-0">
                        <Database size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Latency</p>
                        <p className="text-lg font-bold text-slate-900 truncate">{stats.latency}</p>
                    </div>
                </PremiumCard>

                <PremiumCard padding="sm" className="flex items-center gap-3">
                    <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        stats.dbConnected ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                        {stats.dbConnected ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Cloud</p>
                        <p className="text-lg font-bold text-slate-900">{stats.dbConnected ? 'Online' : 'Offline'}</p>
                    </div>
                </PremiumCard>

                <PremiumCard padding="sm" className="flex items-center gap-3 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/settings')}>
                    <div className="w-10 h-10 rounded-xl bg-premium-gold-500/10 text-premium-gold-500 flex items-center justify-center shrink-0">
                        <Users size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Users</p>
                        <p className="text-lg font-bold text-slate-900">{userStats.total} <span className="text-xs text-slate-400">({userStats.activeToday} today)</span></p>
                    </div>
                </PremiumCard>

                <PremiumCard padding="sm" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                        <HardDrive size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Docs</p>
                        <p className="text-lg font-bold text-slate-900">{totalDocs.toLocaleString()}</p>
                    </div>
                </PremiumCard>
            </div>

            {/* Main Grid: Collection Stats (Live Data) + Error Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Collection Stats with Navigation */}
                <PremiumCard padding="none" className="lg:col-span-2">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <FolderOpen size={18} className="text-premium-blue-500" />
                            Live Collection Stats
                        </h2>
                        <span className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Real-time
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-slate-100 p-px">
                        <StatCard label="Leads" value={leads?.length || 0} icon={Users} color="blue" path="/sales" />
                        <StatCard label="Projects" value={projects?.length || 0} icon={Briefcase} color="green" path="/projects" />
                        <StatCard label="Audits" value={audits?.length || 0} icon={FileText} color="amber" path="/audits" />
                        <StatCard label="Issues" value={issues?.length || 0} icon={AlertCircle} color="red" path="/operations/issues" />
                        <StatCard label="Team" value={teamMembers?.length || 0} icon={Users} color="purple" path="/teams" />
                        <StatCard label="Messages" value={messageCount} icon={MessageSquare} color="blue" path="/inbox" />
                        <StatCard label="Inventory" value={inventoryCount} icon={Package} color="gold" path="/inventory" />
                        <StatCard label="Deployments" value={deploymentCount} icon={Calendar} color="green" path="/teams/calendar" />
                        <StatCard label="Users" value={userStats.total} icon={Users} color="purple" path="/settings" />
                        <StatCard label="Logs" value={logCount} icon={Activity} color="blue" />
                    </div>
                </PremiumCard>

                {/* Error Summary */}
                <PremiumCard padding="none">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            Error Summary
                        </h2>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Total Errors (Last 100 Logs)</span>
                            <span className={clsx(
                                "text-xl font-black",
                                errorSummary.total > 10 ? "text-red-500" : errorSummary.total > 0 ? "text-amber-500" : "text-green-500"
                            )}>{errorSummary.total}</span>
                        </div>
                        {Object.entries(errorSummary.byType).length > 0 ? (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                {Object.entries(errorSummary.byType).slice(0, 5).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 truncate max-w-[150px]" title={type}>{type}</span>
                                        <span className="font-bold text-slate-700">{count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                                <CheckCircle2 size={16} /> No errors detected
                            </p>
                        )}
                    </div>
                </PremiumCard>
            </div>

            {/* Admin Actions + Feature Flags */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Admin Actions */}
                <PremiumCard padding="none">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <Wrench size={18} className="text-premium-blue-500" />
                            Admin Actions
                        </h2>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={handleInitializeRoles}
                            disabled={actionLoading.roles}
                            className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-premium-blue-300 hover:bg-premium-blue-50 transition-all text-left group disabled:opacity-50"
                        >
                            <div className="w-10 h-10 rounded-lg bg-premium-blue-500/10 text-premium-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Settings size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Initialize Roles</p>
                                <p className="text-xs text-slate-500">Reset role templates to defaults</p>
                            </div>
                        </button>

                        <button
                            onClick={handleClearOldLogs}
                            disabled={actionLoading.logs}
                            className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all text-left group disabled:opacity-50"
                        >
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Clear Old Logs</p>
                                <p className="text-xs text-slate-500">Delete logs older than 7 days</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/settings')}
                            className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all text-left group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Manage Users</p>
                                <p className="text-xs text-slate-500">View and edit user accounts</p>
                            </div>
                        </button>

                        <button
                            onClick={() => { fetchSupplementaryCounts(); toast.success('Stats refreshed'); }}
                            className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <RefreshCw size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Refresh All Stats</p>
                                <p className="text-xs text-slate-500">Reload all collection counts</p>
                            </div>
                        </button>
                    </div>
                </PremiumCard>

                {/* Feature Flags */}
                <PremiumCard padding="none">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <Zap size={18} className="text-premium-gold-500" />
                            Feature Flags
                        </h2>
                    </div>
                    <div className="p-5 space-y-3">
                        {Object.entries(featureFlags).map(([flag, value]) => (
                            <div key={flag} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{flag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                    <p className="text-xs text-slate-400">{flag}</p>
                                </div>
                                <button
                                    onClick={() => handleToggleFlag(flag)}
                                    disabled={actionLoading[flag]}
                                    className={clsx(
                                        "p-1 rounded-full transition-colors disabled:opacity-50",
                                        value ? "text-green-500 hover:bg-green-50" : "text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    {value ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                </button>
                            </div>
                        ))}
                        {Object.keys(featureFlags).length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-4">Loading feature flags...</p>
                        )}
                    </div>
                </PremiumCard>
            </div>

            {/* Event Log */}
            <PremiumCard padding="none" className="overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                        <Activity size={18} className="text-premium-blue-500" />
                        Application Event Log
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsLiveStream(!isLiveStream)}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                isLiveStream
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            )}
                        >
                            {isLiveStream ? <Play size={12} /> : <Pause size={12} />}
                            {isLiveStream ? 'Live' : 'Paused'}
                        </button>
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                            {logs.length} entries
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-slate-400 sticky top-0">
                            <tr>
                                <th className="px-5 py-3">Time</th>
                                <th className="px-5 py-3">Level</th>
                                <th className="px-5 py-3">Message</th>
                                <th className="px-5 py-3">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-5 py-12 text-center text-slate-400 font-medium">
                                        Connecting to log stream...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-5 py-12 text-center text-slate-400 font-medium">
                                        No recent logs found.
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500 font-mono">
                                        {log.timestamp?.seconds ? format(new Date(log.timestamp.seconds * 1000), 'HH:mm:ss') : '...'}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={clsx(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border",
                                            getLevelStyles(log.level)
                                        )}>
                                            {log.level === 'error' && <AlertCircle size={10} />}
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-sm font-medium text-slate-900 truncate max-w-md">{log.message}</p>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-slate-500 truncate max-w-[100px]">
                                        {log.userId?.slice(0, 8) || 'System'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </PremiumCard>
        </div>
    );
}
