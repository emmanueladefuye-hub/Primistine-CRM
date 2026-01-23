import React, { useState, useEffect, useMemo } from 'react';
import { MoreVertical, Calendar, Clock, CheckCircle2, AlertTriangle, MapPin, Trash2, Info, ClipboardCheck, FolderPlus } from 'lucide-react';
import clsx from 'clsx';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { db } from '../lib/firebase';
import { useProjects } from '../contexts/ProjectsContext';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import TimeFilter from '../components/TimeFilter';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import { filterByRange } from '../lib/constants';

const ProjectCard = React.memo(({ project }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setConfirmDelete(true);
    };

    const { deleteProject } = useProjects();

    const handleConfirmDelete = async (e) => {
        e.stopPropagation();
        setIsDeleting(true);
        try {
            await deleteProject(project.id);
        } catch (error) {
            console.error("Error removing project: ", error);
        } finally {
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-2xl hover:shadow-premium-blue-900/5 transition-all relative group active:scale-[0.99]">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner",
                        project.health === 'warning' ? "bg-amber-100 text-amber-700" :
                            project.health === 'critical' ? "bg-red-100 text-red-700" :
                                "bg-emerald-100 text-emerald-700"
                    )}>
                        {project.name?.charAt(0) || 'P'}
                    </div>
                    <div className="min-w-0">
                        <Link to={`/projects/${project.id}`} className="group/title">
                            <h3 className="font-black text-premium-blue-900 group-hover/title:text-premium-blue-700 line-clamp-1 tracking-tight leading-none text-lg">{project.name || 'Untitled Project'}</h3>
                        </Link>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">{project.clientInfo?.name || project.client || 'General Client'}</p>
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                            setConfirmDelete(false);
                        }}
                        className={clsx("p-2 rounded-xl transition-all border",
                            showMenu ? "bg-premium-blue-900 text-white border-premium-blue-900" : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                        )}
                    >
                        <MoreVertical size={18} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl z-20 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {!confirmDelete ? (
                                <button
                                    onClick={handleDeleteClick}
                                    className="w-full text-left px-4 py-3.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-3 font-black uppercase tracking-widest"
                                >
                                    <Trash2 size={16} /> Delete Project
                                </button>
                            ) : (
                                <div className="p-3 bg-red-50">
                                    <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mb-3 px-1 text-center">Permanent Removal?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleConfirmDelete}
                                            disabled={isDeleting}
                                            className="flex-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-600/20"
                                        >
                                            {isDeleting ? '...' : 'Confirm'}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDelete(false);
                                            }}
                                            className="flex-1 bg-white border border-red-200 text-red-600 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-red-50"
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.phase || project.currentPhase || 'Planning'}</span>
                    <span className="text-sm font-black text-premium-blue-900">{project.progress || 0}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-1.5 ring-1 ring-slate-100 overflow-hidden">
                    <div
                        className={clsx("h-full transition-all duration-1000",
                            project.health === 'warning' ? 'bg-amber-500' :
                                project.health === 'critical' ? 'bg-red-500' : 'bg-premium-blue-900'
                        )}
                        style={{ width: `${project.progress || 0}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Calendar size={14} className="text-slate-300" />
                    <span>{project.timeline?.expectedCompletion || project.dueDate || 'TBD'}</span>
                </div>
                <div className={clsx("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                    project.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-premium-blue-50 text-premium-blue-700 border-premium-blue-100"
                )}>
                    {project.status || 'Active'}
                </div>
            </div>
        </div>
    );
});

export default function ProjectsDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filterPhase, setFilterPhase] = useState(null);
    const [timeRange, setTimeRange] = useState('day');
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    // Live Projects Data - from Context (Single Source of Truth)
    const { projects: rawProjects, loading, deleteProject } = useProjects();

    // Client-side sort to ensure consistency even if Firestore fields are missing
    const projects = useMemo(() => {
        return [...rawProjects].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at.toDate ? a.created_at.toDate() : a.created_at) : new Date(0);
            const dateB = b.created_at ? new Date(b.created_at.toDate ? b.created_at.toDate() : b.created_at) : new Date(0);
            return dateB - dateA;
        });
    }, [rawProjects]);

    const filteredProjects = useMemo(() => {
        return filterByRange(projects || [], timeRange, referenceDate);
    }, [projects, timeRange, referenceDate]);

    // Initialize filter from navigation state
    useEffect(() => {
        if (location.state?.filterPhase) {
            setFilterPhase(location.state.filterPhase);
        } else {
            setFilterPhase(null); // Reset if no state
        }
    }, [location.state]);

    const clearFilter = () => {
        setFilterPhase(null);
        // Also clear the navigation state so a refresh doesn't bring it back
        navigate(location.pathname, { replace: true, state: {} });
    };

    const displayedProjects = filteredProjects.filter(p => {
        const matchesPhase = !filterPhase || p.phase === filterPhase;
        if (!searchTerm) return matchesPhase;
        const term = searchTerm.toLowerCase();
        return matchesPhase && (
            (p.name || '').toLowerCase().includes(term) ||
            (p.client || '').toLowerCase().includes(term) ||
            (p.clientInfo?.name || '').toLowerCase().includes(term) ||
            (p.id || '').includes(term)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header: Executive Space Management */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-premium-blue-900 tracking-tight leading-none">Project Portfolio</h1>
                    <p className="text-slate-500 font-bold mt-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] opacity-60">Site Execution Hub</p>
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
                    <Link
                        to="/audits"
                        className="flex-1 sm:flex-none justify-center flex items-center gap-3 bg-premium-blue-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-premium-blue-900/30 active:scale-95 transition-all shadow-xl shadow-premium-blue-900/10"
                    >
                        <ClipboardCheck size={16} strokeWidth={4} /> New Project
                    </Link>
                </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-premium-blue-500 transition-colors">
                        <FolderPlus size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search projects by name, client, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-100 focus:border-premium-blue-500 focus:ring-4 focus:ring-premium-blue-500/10 outline-none transition-all shadow-sm font-bold text-sm text-premium-blue-900 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Workflow Info Banner: Refined */}
            <div className="mb-8 bg-premium-blue-900 overflow-hidden relative group rounded-[24px] p-6 shadow-2xl shadow-premium-blue-900/20">
                <div className="absolute top-0 right-0 p-8 text-white/5 opacity-50 group-hover:scale-125 transition-transform duration-700">
                    <ClipboardCheck size={120} strokeWidth={1} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="p-4 bg-white/10 backdrop-blur-md text-premium-gold-400 rounded-2xl shrink-0"><Info size={28} strokeWidth={2.5} /></div>
                    <div className="flex-1">
                        <h4 className="text-lg font-black text-white tracking-tight uppercase">Audit-Driven Workflow</h4>
                        <p className="text-slate-300 text-sm font-medium mt-1 leading-relaxed max-w-2xl">
                            Projects are born from verified site audits. Complete an audit to unlock its conversion into a full-scale project implementation.
                        </p>
                    </div>
                    <Link to="/audits" className="px-6 py-2.5 bg-premium-gold-500 text-premium-blue-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold-400 transition-all active:scale-95">Go to Audits</Link>
                </div>
            </div>

            {filterPhase && (
                <div className="mb-6 flex items-center gap-2">
                    <span className="text-sm text-slate-500">Filtered by:</span>
                    <span className="bg-premium-blue-100 text-premium-blue-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                        {filterPhase}
                        <button onClick={clearFilter} className="hover:text-red-500">×</button>
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading && <Skeleton count={4} className="h-48 rounded-xl" />}

                {!loading && displayedProjects.length === 0 && (
                    <div className="col-span-full">
                        <EmptyState
                            title="No Projects Found"
                            description={filterPhase ? `No projects found in ${filterPhase} stage.` : "You haven't created any projects yet."}
                            icon={FolderPlus}
                            action={
                                <Link to="/audits" className="bg-premium-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-premium-blue-800 flex items-center gap-2">
                                    <ClipboardCheck size={18} /> Create from Audit
                                </Link>
                            }
                        />
                    </div>
                )}

                {!loading && displayedProjects.map(p => (
                    <ProjectCard key={p.id} project={p} />
                ))}
            </div>
        </div>
    );
}
