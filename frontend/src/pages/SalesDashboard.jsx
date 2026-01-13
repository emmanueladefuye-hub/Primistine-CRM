import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MoreHorizontal, Phone, Mail, Calendar, Search, Filter, LayoutGrid, List, Plus, Check, ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import AddLeadModal from '../components/AddLeadModal';
import { toast } from 'react-hot-toast';

import { PIPELINE_STAGES, filterByRange } from '../lib/constants';
import TimeFilter from '../components/TimeFilter';
import { useScopedCollection } from '../hooks/useScopedCollection'; // Added this import
import { updateLead } from '../services/firestore';
import { orderBy } from 'firebase/firestore';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

// Helper Component for the Menu - Uses Portal to break out of overflow
const LeadActionMenu = ({ lead, onClose, anchorEl }) => {
    const menuRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Calculate position on mount
    useEffect(() => {
        if (anchorEl) {
            const rect = anchorEl.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 4,
                left: rect.right + window.scrollX - 192,
            });
        }
    }, [anchorEl]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && anchorEl && !anchorEl.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, anchorEl]);

    const handleStageChange = async (newStageId, stageName) => {
        try {
            const oldStageId = lead.stage; // Capture old stage before update
            await updateLead(lead.id, { stage: newStageId });

            // Import Firestore functions dynamically
            const {
                addDoc,
                collection,
                serverTimestamp,
                query,
                where,
                getDocs,
                deleteDoc
            } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');

            // 1. Handle "Move TO Won"
            if (newStageId === 'won') {
                toast.success('Lead Won! 🚀 Site Audit is now unlocked.', {
                    style: {
                        borderRadius: '10px',
                        background: '#1e1b4b',
                        color: '#fff',
                        fontWeight: 'bold'
                    },
                });
            } else {
                toast.success(`Pipeline Updated: Moved to ${stageName}`, {
                    icon: '🚀',
                    style: {
                        borderRadius: '10px',
                        background: '#1e1b4b',
                        color: '#fff',
                    },
                });
            }

        } catch (err) {
            toast.error("Failed to update stage");
            console.error(err);
        }
        onClose();
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        setIsDeleting(true);
        try {
            const { deleteDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            await deleteDoc(doc(db, 'leads', lead.id));
            toast.success("Lead delete successfully");
            onClose();
        } catch (error) {
            console.error("Error removing lead: ", error);
            toast.error("Failed to delete lead");
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    // Render into body using Portal to avoid clipping
    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            style={{
                top: coords.top,
                left: coords.left,
                position: 'absolute'
            }}
            className="w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            {!confirmDelete ? (
                <>
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                        Move to Stage
                    </div>
                    <div className="py-1 flex-1 overflow-y-auto max-h-[200px]">
                        {PIPELINE_STAGES.map((stage, idx) => {
                            const currentIdx = PIPELINE_STAGES.findIndex(s => s.id === lead.stage);
                            const isNext = idx === currentIdx + 1;
                            const isCurrent = idx === currentIdx;
                            const isAllowed = isNext || isCurrent; // Always allow current (already disabled) and next. 
                            // Optionally allow previous steps if needed, but user said "strictly New -> Contacted -> ..."
                            // To be "strict", we disable anything that isn't current or next.
                            const isDisabled = lead.stage === stage.id || !isNext;

                            return (
                                <button
                                    key={stage.id}
                                    onClick={() => handleStageChange(stage.id, stage.name)}
                                    disabled={isDisabled}
                                    className={clsx(
                                        "w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors",
                                        isDisabled ? "opacity-30 cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-700 font-medium hover:bg-slate-50"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <div className={clsx("w-2 h-2 rounded-full", stage.color)}></div>
                                        {stage.name}
                                    </span>
                                    {lead.stage === stage.id && <Check size={14} />}
                                    {isNext && <ArrowRight size={14} className="text-premium-gold-500 animate-pulse" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="border-t border-slate-100 p-1">
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium rounded"
                        >
                            <Trash2 size={14} /> Delete Lead
                        </button>
                    </div>
                </>
            ) : (
                <div className="p-3 bg-red-50">
                    <p className="text-xs text-red-600 font-bold mb-3">Delete this lead permanently?</p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            {isDeleting ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            disabled={isDeleting}
                            className="flex-1 bg-white border border-red-200 text-red-600 text-xs font-bold py-2 rounded hover:bg-red-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

const LeadCard = ({ lead }) => {
    const [showMenu, setShowMenu] = useState(false);
    const buttonRef = useRef(null);

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-premium-blue-900/5 transition-all mb-3 active:scale-[0.98] group">
            <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 uppercase tracking-widest truncate max-w-[120px]">
                    {lead.company}
                </span>
                <div className="relative">
                    <button
                        ref={buttonRef}
                        className={clsx("text-slate-400 hover:text-premium-blue-900 p-1.5 rounded-xl transition-all",
                            showMenu ? "bg-slate-100 text-premium-blue-900" : "hover:bg-slate-50")}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                    >
                        <MoreHorizontal size={16} />
                    </button>
                    {showMenu && <LeadActionMenu lead={lead} onClose={() => setShowMenu(false)} anchorEl={buttonRef.current} />}
                </div>
            </div>

            <Link to={`/sales/leads/${lead.id}`} className="block">
                <h4 className="font-black text-premium-blue-900 group-hover:text-premium-blue-700 transition-colors tracking-tight leading-tight">{lead.name}</h4>
                <div className="text-sm font-black text-premium-gold-600 mt-1">{lead.value}</div>
            </Link>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                <div className="flex gap-1.5">
                    <a href={`tel:${lead.phone}`} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-premium-blue-50 hover:text-premium-blue-600 transition-all border border-transparent hover:border-premium-blue-100">
                        <Phone size={14} />
                    </a>
                    <a href={`mailto:${lead.email}`} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-premium-blue-50 hover:text-premium-blue-600 transition-all border border-transparent hover:border-premium-blue-100">
                        <Mail size={14} />
                    </a>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <Calendar size={12} className="opacity-50" />
                    {lead.lastContact}
                </div>
            </div>
        </div>
    );
};
const MobileLeadRow = ({ lead, onAction }) => {
    const stage = PIPELINE_STAGES.find(s => s.id === lead.stage);
    const [showMenu, setShowMenu] = useState(false);
    const buttonRef = useRef(null);

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all active:scale-[0.99]">
            <div className="flex justify-between items-start">
                <div className="min-w-0">
                    <Link to={`/sales/leads/${lead.id}`} className="block group">
                        <h3 className="font-black text-premium-blue-900 text-lg group-hover:text-premium-blue-700 truncate tracking-tight leading-tight">{lead.name}</h3>
                    </Link>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{lead.company}</div>
                </div>
                <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={() => setShowMenu(!showMenu)}
                        className={clsx("p-2.5 rounded-xl transition-all border",
                            showMenu ? "bg-premium-blue-900 text-white border-premium-blue-900" : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                        )}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    {showMenu && <LeadActionMenu lead={lead} onClose={() => setShowMenu(false)} anchorEl={buttonRef.current} />}
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Deal Value</span>
                    <div className="text-sm font-black text-premium-gold-600 tracking-tight">{lead.value}</div>
                </div>
                <div className="flex flex-col gap-1 items-end text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pipeline Status</span>
                    <span className={clsx("text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border",
                        stage?.id === 'won' ? 'bg-green-50 text-green-700 border-green-200' :
                            stage?.id === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-slate-50 text-slate-500 border-slate-200'
                    )}>
                        {stage?.name || lead.stage}
                    </span>
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <a href={`tel:${lead.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 active:scale-95 transition-all">
                    <Phone size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Call</span>
                </a>
                <a href={`mailto:${lead.email}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 active:scale-95 transition-all">
                    <Mail size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Email</span>
                </a>
            </div>
        </div>
    );
};

export default function SalesDashboard() {
    const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'
    const [timeRange, setTimeRange] = useState('day');
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Live Leads Data
    const { data: leads, loading, error } = useScopedCollection('leads', [
        orderBy('createdAt', 'desc')
    ]);

    const filteredLeads = filterByRange(leads || [], timeRange, referenceDate).filter(lead => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            (lead.name || '').toLowerCase().includes(lowerTerm) ||
            (lead.company || '').toLowerCase().includes(lowerTerm) ||
            (lead.email || '').toLowerCase().includes(lowerTerm) ||
            (lead.phone || '').includes(lowerTerm)
        );
    });

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-8">
            <AddLeadModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            {/* Header: Executive Space Management */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-premium-blue-900 tracking-tight leading-none">Lead Pipeline</h1>
                    <p className="text-slate-500 font-bold mt-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] opacity-60">Revenue Acquisition Engine</p>
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
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex-1 sm:flex-none justify-center flex items-center gap-3 bg-premium-blue-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-premium-blue-900/30 active:scale-95 transition-all shadow-xl shadow-premium-blue-900/10"
                    >
                        <Plus size={16} strokeWidth={4} /> Add Lead
                    </button>
                </div>
            </div>

            {/* Filters & Controls: Intelligent & High-Density */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white p-2 sm:p-3 rounded-[24px] border border-slate-100 shadow-sm gap-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 pr-2">
                    <div className="relative flex-1 group min-w-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-premium-gold-500 transition-all" size={18} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-premium-gold-400/30 text-sm font-bold placeholder:text-slate-400 transition-all"
                        />
                    </div>
                    <div className="hidden sm:block h-8 w-px bg-slate-100"></div>
                    <button className="flex items-center justify-center gap-3 px-6 py-3 bg-white rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-premium-blue-900 transition-all border border-slate-100 active:scale-95">
                        <Filter size={14} strokeWidth={3} /> Filter
                    </button>
                </div>

                <div className="flex bg-slate-100/60 p-1.5 rounded-2xl gap-1">
                    <button
                        onClick={() => setViewMode('board')}
                        className={clsx("flex-1 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-tighter min-w-max",
                            viewMode === 'board'
                                ? "bg-white shadow-xl text-premium-blue-900 ring-1 ring-black/5"
                                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                        )}
                    >
                        <LayoutGrid size={16} strokeWidth={3} /> Board
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx("flex-1 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-tighter min-w-max",
                            viewMode === 'list'
                                ? "bg-white shadow-xl text-premium-blue-900 ring-1 ring-black/5"
                                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                        )}
                    >
                        <List size={16} strokeWidth={3} /> List
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                {viewMode === 'board' ? (
                    // Kanban Board: Refined for Space
                    <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar">
                        {loading ? <Skeleton count={4} className="h-64 rounded-2xl flex-1" wrapperClassName="flex gap-4 h-full" /> : (
                            <div className="flex gap-4 min-w-[1200px] lg:min-w-0 h-full">
                                {PIPELINE_STAGES.map((stage) => (
                                    <div key={stage.id} className="flex-1 min-w-[260px] lg:min-w-0 flex flex-col">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("w-3 h-3 rounded-full ring-4 ring-offset-2", stage.color.replace('bg-', 'ring-').replace('-500', '-50'), stage.color)}></div>
                                                <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">{stage.name}</h3>
                                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-black border border-slate-200">
                                                    {filteredLeads.filter(l => (l.stage || 'new') === stage.id).length}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-slate-100/40 rounded-[24px] p-3 border border-slate-100/50 overflow-y-auto custom-scrollbar min-h-[500px]">
                                            {filteredLeads.filter(l => (l.stage || 'new') === stage.id).map(lead => (
                                                <LeadCard key={lead.id} lead={lead} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // List View: Mobile Cards + Desktop Executive Table
                    <div className="bg-white md:rounded-[32px] border border-slate-100 md:shadow-xl md:shadow-slate-200/50 overflow-hidden h-full">
                        {/* Mobile View */}
                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                            {filteredLeads.map((lead) => (
                                <MobileLeadRow key={lead.id} lead={lead} />
                            ))}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Deal Information</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pipeline Status</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Valuation</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Last Encounter</th>
                                        <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredLeads.map((lead) => {
                                        const stage = PIPELINE_STAGES.find(s => s.id === lead.stage);
                                        return (
                                            <tr key={lead.id} className="group hover:bg-premium-blue-50/30 transition-all duration-200">
                                                <td className="py-5 px-8">
                                                    <Link to={`/sales/leads/${lead.id}`} className="font-black text-premium-blue-900 text-lg group-hover:text-premium-blue-700 transition-colors tracking-tight leading-tight">{lead.name}</Link>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{lead.company}</div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                                                        <span className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /> {lead.phone}</span>
                                                        <span className="flex items-center gap-2"><Mail size={12} className="text-slate-400" /> {lead.email}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <span className={clsx("text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full border shadow-sm",
                                                        stage?.id === 'won' ? 'bg-green-50 text-green-700 border-green-200 shadow-green-900/5' :
                                                            stage?.id === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-900/5' :
                                                                'bg-white text-slate-600 border-slate-200'
                                                    )}>
                                                        {stage?.name || lead.stage}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6 font-black text-premium-gold-600 italic tracking-tight">{lead.value}</td>
                                                <td className="py-5 px-6 text-xs font-bold text-slate-500">{lead.lastContact}</td>
                                                <td className="py-5 px-8 text-right">
                                                    <div className="relative inline-block">
                                                        <button
                                                            className="text-slate-400 hover:text-premium-blue-900 p-2.5 hover:bg-white border hover:border-slate-200 rounded-xl transition-all shadow-sm"
                                                        // Logic for showing menu in LeadActionMenu should be wired or used here if applicable
                                                        >
                                                            <MoreHorizontal size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

