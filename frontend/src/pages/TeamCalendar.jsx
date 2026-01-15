import React, { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    User, Plus, Loader2, Eye, MapPin, Clock, Filter
} from 'lucide-react';
import clsx from 'clsx';
import { useTeams } from '../contexts/TeamsContext';
import { useDeployments } from '../contexts/DeploymentsContext';
import { toast } from 'react-hot-toast';
import DeploymentModal from '../components/DeploymentModal';

const STATUS_COLORS = {
    'Scheduled': 'bg-yellow-100 border-yellow-300 text-yellow-800',
    'In Progress': 'bg-blue-100 border-blue-300 text-blue-800',
    'Completed': 'bg-emerald-100 border-emerald-300 text-emerald-800',
    'Cancelled': 'bg-slate-100 border-slate-300 text-slate-500 line-through',
    'Rescheduled': 'bg-purple-100 border-purple-300 text-purple-800'
};

const PRIORITY_DOTS = {
    'Urgent': 'bg-red-500',
    'High': 'bg-orange-500',
    'Normal': 'bg-blue-500',
    'Low': 'bg-slate-400'
};

const TYPE_COLORS = {
    'Audit': 'bg-purple-500',
    'Installation': 'bg-blue-500',
    'Maintenance': 'bg-green-500',
    'Inspection': 'bg-yellow-500',
    'Follow-up': 'bg-slate-500'
};

export default function TeamCalendar() {
    const { engineers, loading: teamsLoading, canWrite } = useTeams();
    const { deployments, loading: deploymentsLoading, updateDeployment } = useDeployments();

    const [viewMode, setViewMode] = useState('week'); // 'day' | 'week' | 'month'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEngineerId, setSelectedEngineerId] = useState(null);
    const [selectedDeployment, setSelectedDeployment] = useState(null);
    const [filterEngineer, setFilterEngineer] = useState('all');
    const [filterType, setFilterType] = useState('all');

    const loading = teamsLoading || deploymentsLoading;

    // Deduplicate engineers just in case of data inconsistencies
    const uniqueEngineers = useMemo(() => {
        if (!engineers) return [];
        const seen = new Set();
        return engineers.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        });
    }, [engineers]);

    // Generate days based on current date and view mode
    const calendarDays = useMemo(() => {
        if (viewMode === 'day') {
            return [new Date(currentDate)];
        }

        if (viewMode === 'month') {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const startOffset = (firstDay.getDay() + 6) % 7; // Monday start

            const days = [];
            const start = new Date(year, month, 1 - startOffset);

            for (let i = 0; i < 42; i++) { // 6 weeks
                const day = new Date(start);
                day.setDate(start.getDate() + i);
                days.push(day);
            }
            return days;
        }

        const days = [];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7)); // Monday

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    }, [currentDate, viewMode]);

    // Get deployments for the visible range
    const visibleDeployments = useMemo(() => {
        if (!deployments) return [];

        const start = calendarDays[0];
        const end = calendarDays[calendarDays.length - 1];

        return deployments.filter(d => {
            const deploymentDate = d.scheduledDate?.toDate?.()
                ? d.scheduledDate.toDate()
                : new Date(d.scheduledDate);

            // Filter by date range
            if (deploymentDate < start || deploymentDate > end) return false;

            // Filter by engineer
            if (filterEngineer !== 'all') {
                const isAssigned = d.leadEngineerId === filterEngineer ||
                    d.assignedEngineers?.some(e => e.id === filterEngineer);
                if (!isAssigned) return false;
            }

            // Filter by type
            if (filterType !== 'all' && d.type !== filterType) return false;

            return true;
        });
    }, [deployments, calendarDays, filterEngineer, filterType]);

    // Get deployments for a specific day
    const getDeploymentsForDay = (day) => {
        const dayStr = day.toDateString();
        return visibleDeployments.filter(d => {
            const dDate = d.scheduledDate?.toDate?.() ? d.scheduledDate.toDate() : new Date(d.scheduledDate);
            return dDate.toDateString() === dayStr;
        });
    };

    // Get deployment for a specific day and engineer (for Grid/Week view)
    const getDeploymentForCell = (day, engineerId) => {
        const dayStr = day.toDateString();

        return visibleDeployments.find(d => {
            const deploymentDate = d.scheduledDate?.toDate?.()
                ? d.scheduledDate.toDate()
                : new Date(d.scheduledDate);

            const isAssigned = d.leadEngineerId === engineerId ||
                d.assignedEngineers?.some(e => e.id === engineerId);

            return deploymentDate.toDateString() === dayStr && isAssigned;
        });
    };

    // Navigation
    const navigateWeek = (direction) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') {
            newDate.setDate(currentDate.getDate() + direction);
        } else if (viewMode === 'month') {
            newDate.setMonth(currentDate.getMonth() + direction);
        } else {
            newDate.setDate(currentDate.getDate() + (direction * 7));
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Handle cell click
    const handleCellClick = (day, engineerId) => {
        const existing = getDeploymentForCell(day, engineerId);
        if (existing) {
            setSelectedDeployment(existing);
            setIsDeployModalOpen(true);
        } else if (canWrite) {
            setSelectedDate(day.toISOString().split('T')[0]);
            setSelectedEngineerId(engineerId);
            setSelectedDeployment(null);
            setIsDeployModalOpen(true);
        }
    };

    // Drag & Drop Handlers
    const handleDragStart = (e, deployment) => {
        if (!canWrite) return;
        e.dataTransfer.setData('deploymentId', deployment.id);
        e.dataTransfer.effectAllowed = 'move';

        // Add a visual class to the dragged element
        e.target.classList.add('opacity-50');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-50');
    };

    const handleDrop = async (e, day, engineerId) => {
        e.preventDefault();
        if (!canWrite) return;

        const deploymentId = e.dataTransfer.getData('deploymentId');
        if (!deploymentId) return;

        const dateStr = day.toISOString().split('T')[0];

        try {
            await updateDeployment(deploymentId, {
                scheduledDate: new Date(dateStr),
                leadEngineerId: engineerId,
                updatedAt: new Date()
            });
            toast.success('Deployment rescheduled');
        } catch (err) {
            console.error('Failed to reschedule:', err);
            toast.error('Failed to reschedule deployment');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const weekLabel = useMemo(() => {
        if (viewMode === 'month') {
            return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        const start = calendarDays[0];
        const end = calendarDays[calendarDays.length - 1];
        const options = { month: 'short', day: 'numeric' };

        if (viewMode === 'day') {
            return start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        if (start.getMonth() === end.getMonth()) {
            return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
        }
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${start.getFullYear()}`;
    }, [calendarDays, viewMode, currentDate]);

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-premium-blue-900">Deployment Scheduler</h1>
                    <p className="text-slate-500 mt-1">Manage field engineer schedules and on-site work assignments.</p>
                </div>
                {canWrite && (
                    <button
                        onClick={() => {
                            setSelectedDate(new Date().toISOString().split('T')[0]);
                            setSelectedDeployment(null);
                            setIsDeployModalOpen(true);
                        }}
                        className="bg-premium-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 flex items-center gap-2"
                    >
                        <Plus size={18} /> New Deployment
                    </button>
                )}
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Navigation */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigateWeek(-1)}
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <ChevronLeft size={20} className="text-slate-600" />
                            </button>
                            <button
                                onClick={() => navigateWeek(1)}
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <ChevronRight size={20} className="text-slate-600" />
                            </button>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 min-w-[250px]">
                            {weekLabel}
                        </h2>
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm font-medium text-premium-blue-600 hover:bg-premium-blue-50 rounded-lg transition-colors"
                        >
                            Today
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        <select
                            value={filterEngineer}
                            onChange={(e) => setFilterEngineer(e.target.value)}
                            className="px-4 py-2 rounded-lg bg-slate-50 border-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-premium-gold-400"
                        >
                            <option value="all">All Engineers</option>
                            {uniqueEngineers?.map(eng => (
                                <option key={eng.id} value={eng.id}>{eng.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 rounded-lg bg-slate-50 border-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-premium-gold-400"
                        >
                            <option value="all">All Types</option>
                            <option value="Audit">Audit</option>
                            <option value="Installation">Installation</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Inspection">Inspection</option>
                            <option value="Follow-up">Follow-up</option>
                        </select>
                    </div>

                    {/* View Mode */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {['day', 'week', 'month'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={clsx(
                                    'px-4 py-2 rounded-md text-sm font-medium capitalize transition-all',
                                    viewMode === mode
                                        ? 'bg-white text-premium-blue-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-500">Type:</span>
                    {Object.entries(TYPE_COLORS).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-1">
                            <span className={clsx('w-3 h-3 rounded-full', color)} />
                            <span className="text-slate-600">{type}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-500">Priority:</span>
                    {Object.entries(PRIORITY_DOTS).map(([priority, color]) => (
                        <div key={priority} className="flex items-center gap-1">
                            <span className={clsx('w-2 h-2 rounded-full', color)} />
                            <span className="text-slate-600">{priority}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-96 bg-white rounded-xl border border-slate-200">
                    <Loader2 size={32} className="animate-spin text-premium-blue-500" />
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {viewMode === 'month' ? (
                        /* Month Grid */
                        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                <div key={d} className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest border-l first:border-l-0 border-slate-200">
                                    {d}
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Day/Week Header Row */
                        <div
                            className="grid bg-slate-50 border-b border-slate-200"
                            style={{ gridTemplateColumns: `180px repeat(${calendarDays.length}, 1fr)` }}
                        >
                            <div className="p-4 font-semibold text-slate-600 text-sm">Engineer</div>
                            {calendarDays.map(day => (
                                <div
                                    key={day.toDateString()}
                                    className={clsx(
                                        'p-4 text-center border-l border-slate-200',
                                        isToday(day) && 'bg-premium-blue-50'
                                    )}
                                >
                                    <div className="text-xs text-slate-500 uppercase">
                                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className={clsx(
                                        'text-lg font-bold mt-1',
                                        isToday(day) ? 'text-premium-blue-600' : 'text-slate-900'
                                    )}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    {viewMode === 'month' ? (
                        /* Month Cells Row-based Grid */
                        <div className="grid grid-cols-7 border-collapse">
                            {calendarDays.map((day, idx) => {
                                const dayDeployments = getDeploymentsForDay(day);
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                                return (
                                    <div
                                        key={day.toISOString()}
                                        onClick={() => handleCellClick(day, null)}
                                        className={clsx(
                                            'min-h-[140px] p-2 border-r border-b border-slate-100 transition-colors cursor-pointer group hover:bg-slate-50 relative',
                                            !isCurrentMonth && 'bg-slate-50/50',
                                            isToday(day) && 'bg-premium-blue-50/30'
                                        )}
                                    >
                                        <div className={clsx(
                                            "flex items-center justify-between mb-2",
                                            !isCurrentMonth && 'opacity-30'
                                        )}>
                                            <span className={clsx(
                                                "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                                                isToday(day) ? "bg-premium-blue-600 text-white shadow-sm" : "text-slate-700"
                                            )}>
                                                {day.getDate()}
                                            </span>
                                            {canWrite && (
                                                <Plus size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>

                                        <div className="space-y-1.5 overflow-y-auto max-h-[100px] no-scrollbar">
                                            {dayDeployments.map(d => {
                                                const lead = uniqueEngineers.find(e => e.id === d.leadEngineerId);
                                                return (
                                                    <div
                                                        key={d.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedDeployment(d);
                                                            setIsDeployModalOpen(true);
                                                        }}
                                                        draggable={canWrite}
                                                        onDragStart={(ev) => handleDragStart(ev, d)}
                                                        className={clsx(
                                                            "p-1.5 rounded-lg border text-[10px] shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
                                                            STATUS_COLORS[d.status] || STATUS_COLORS['Scheduled']
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-1 mb-0.5">
                                                            <div className={clsx("w-1.5 h-1.5 rounded-full", TYPE_COLORS[d.type])} />
                                                            <span className="font-bold truncate" title={d.title}>{d.title}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-1 text-slate-500 font-medium">
                                                            <div className="flex items-center gap-1 truncate max-w-[70px]">
                                                                <User size={10} className="shrink-0" />
                                                                <span className="truncate">{lead?.name || 'Unassigned'}</span>
                                                            </div>
                                                            <span className="shrink-0">{d.scheduledTimeStart}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Day/Week Engineer Rows */
                        uniqueEngineers?.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <User size={48} className="mx-auto mb-4 opacity-30" />
                                <p>No engineers found. Add team members to start scheduling.</p>
                            </div>
                        ) : (
                            uniqueEngineers?.map(engineer => (
                                <div
                                    key={engineer.id}
                                    className="grid border-b border-slate-100 last:border-b-0"
                                    style={{ gridTemplateColumns: `180px repeat(${calendarDays.length}, 1fr)` }}
                                >
                                    {/* Engineer Info */}
                                    <div className="p-4 flex items-center gap-3 bg-slate-50/50">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-premium-blue-500 to-premium-blue-700 text-white flex items-center justify-center text-sm font-bold">
                                            {engineer.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-slate-900 text-sm truncate">
                                                {engineer.name}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">
                                                {engineer.role || 'Engineer'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Day Cells */}
                                    {calendarDays.map(day => {
                                        const deployment = getDeploymentForCell(day, engineer.id);

                                        return (
                                            <div
                                                key={day.toISOString()}
                                                onClick={() => handleCellClick(day, engineer.id)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, day, engineer.id)}
                                                className={clsx(
                                                    'min-h-[100px] p-2 border-l border-slate-100 transition-colors cursor-pointer relative group',
                                                    isToday(day) && 'bg-premium-blue-50/30',
                                                    !deployment && canWrite && 'hover:bg-slate-50'
                                                )}
                                            >
                                                {!deployment && canWrite && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Plus size={20} className="text-slate-300" />
                                                    </div>
                                                )}

                                                {deployment && (
                                                    <div
                                                        draggable={canWrite}
                                                        onDragStart={(e) => handleDragStart(e, deployment)}
                                                        onDragEnd={handleDragEnd}
                                                        className={clsx(
                                                            'p-2 rounded-lg border text-xs transition-all hover:shadow-md cursor-grab active:cursor-grabbing',
                                                            STATUS_COLORS[deployment.status] || STATUS_COLORS['Scheduled']
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className={clsx(
                                                                'w-2 h-2 rounded-full shrink-0',
                                                                TYPE_COLORS[deployment.type] || TYPE_COLORS['Installation']
                                                            )} />
                                                            <span className="font-semibold truncate">
                                                                {deployment.title}
                                                            </span>
                                                            {deployment.priority !== 'Normal' && (
                                                                <span className={clsx(
                                                                    'w-1.5 h-1.5 rounded-full shrink-0 ml-auto',
                                                                    PRIORITY_DOTS[deployment.priority]
                                                                )} />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] opacity-75">
                                                            <Clock size={10} />
                                                            {deployment.scheduledTimeStart}
                                                        </div>
                                                        {deployment.clientInfo?.address && (
                                                            <div className="flex items-center gap-1 text-[10px] opacity-75 mt-0.5 truncate">
                                                                <MapPin size={10} className="shrink-0" />
                                                                {deployment.clientInfo.address}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )
                    )}
                </div>
            )}

            {/* Deployment Modal */}
            <DeploymentModal
                isOpen={isDeployModalOpen}
                onClose={() => {
                    setIsDeployModalOpen(false);
                    setSelectedDeployment(null);
                    setSelectedDate(null);
                    setSelectedEngineerId(null);
                }}
                initialDate={selectedDate}
                initialLeadId={selectedEngineerId}
                editingDeployment={selectedDeployment}
            />
        </div>
    );
}
