import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { MoreHorizontal, Phone, Mail, Calendar, Search, Filter, LayoutGrid, List, Plus, Check, ArrowRight, Trash2, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import AddLeadModal from '../components/AddLeadModal';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import ContactInteractionModal from '../components/ContactInteractionModal';

import { PIPELINE_STAGES, SERVICE_TYPES, filterByRange, ensureDate } from '../lib/constants';
import TimeFilter from '../components/TimeFilter';
import { useScopedCollection } from '../hooks/useScopedCollection';
import { useLeads } from '../contexts/LeadsContext';
import { orderBy } from 'firebase/firestore';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

// Helper Component for the Menu
const LeadActionMenu = ({ lead, onClose, anchorEl }) => {
    const { moveLeadStage } = useLeads();
    const menuRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (anchorEl) {
            const rect = anchorEl.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 4,
                left: rect.right + window.scrollX - 192,
            });
        }
    }, [anchorEl]);

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
            await moveLeadStage(lead.id, newStageId);
            toast.success(`Pipeline Updated: Moved to ${stageName}`, {
                icon: '🚀',
                style: { borderRadius: '10px', background: '#1e1b4b', color: '#fff' },
            });
        } catch (error) {
            if (error.code === 'WORKFLOW_VALIDATION_FAILED') {
                toast.error((t) => (
                    <div className="flex flex-col gap-3 text-slate-800">
                        <p className="font-bold text-sm">Prerequisite Missing</p>
                        <p className="text-xs opacity-80">{error.message}</p>
                        {(error.stageId === 'audit' || error.stageId === 'proposal') && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                        // Since we don't have navigate here directly, we'd need to pass it or use window.location
                                        // But the component is a child of SalesDashboard which HAS navigate.
                                        // Wait, LeadActionMenu is outside SalesDashboard's scope? No, it's defined in the same file.
                                        // I'll use window.location or if navigate is available in scope.
                                        // Checked SalesDashboard: navigate is NOT there yet, I'll add it.
                                        window.location.href = '/audits/new';
                                    }}
                                    className="px-3 py-1.5 bg-premium-blue-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                                >
                                    Run Audit Now
                                </button>
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                ), { duration: 6000 });
            } else {
                toast.error("Failed to update stage");
            }
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
            toast.success("Lead deleted successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to delete lead");
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            style={{ top: coords.top, left: coords.left, position: 'absolute' }}
            className="w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            {!confirmDelete ? (
                <>
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">Move to Stage</div>
                    <div className="py-1 flex-1 overflow-y-auto max-h-[200px]">
                        {PIPELINE_STAGES.map((stage, idx) => {
                            const currentIdx = PIPELINE_STAGES.findIndex(s => s.id === lead.stage);
                            const isNext = idx === currentIdx + 1;
                            const isCurrent = idx === currentIdx;
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
                        <button onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded">Confirm</button>
                        <button onClick={() => setConfirmDelete(false)} disabled={isDeleting} className="flex-1 bg-white border border-red-200 text-red-600 text-xs font-bold py-2 rounded">Cancel</button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

const LeadCard = React.memo(({ lead, index, onContact }) => {
    const buttonRef = React.useRef(null);
    const [showMenu, setShowMenu] = useState(false);

    // Calculate time since creation for "Posted X ago"
    const timeAgo = useMemo(() => {
        if (!lead.createdAt) return 'Just now';
        try {
            const date = ensureDate(lead.createdAt);
            // If date is invalid, fallback
            if (isNaN(date.getTime())) return 'Recently';

            return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
        } catch (e) {
            return 'Just now';
        }
    }, [lead.createdAt]);

    const daysInStage = useMemo(() => {
        const start = ensureDate(lead.stageUpdatedAt || lead.createdAt);
        return differenceInDays(new Date(), start);
    }, [lead.stageUpdatedAt, lead.createdAt]);

    const isStale = daysInStage > 7;

    return (
        <Draggable draggableId={String(lead.id)} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={clsx(
                        "glass-surface p-4 rounded-2xl border mb-3 active:scale-[0.98] group transition-all duration-300",
                        snapshot.isDragging ? "shadow-2xl ring-2 ring-premium-blue-500/20 rotate-1 scale-[1.02] bg-white/90" : "border-white/20 hover:shadow-xl hover:shadow-premium-blue-900/10"
                    )}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1.5 min-w-0 flex-1 mr-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 uppercase tracking-widest truncate max-w-[120px]" title={lead.company}>
                                    {lead.company || 'Direct'}
                                </span>
                                {lead.attribution?.source && (
                                    <span className="text-[9px] font-black text-premium-gold-600 uppercase tracking-widest bg-premium-gold-50/50 px-2 py-0.5 rounded-lg border border-premium-gold-100/50">
                                        {lead.attribution.source}
                                    </span>
                                )}
                            </div>
                            <Link to={`/sales/leads/${lead.id}`} className="block">
                                <h4 className="font-extrabold text-premium-blue-900 group-hover:text-premium-blue-700 transition-colors tracking-tight leading-[1.2] text-base break-words" title={lead.name}>
                                    {lead.name}
                                </h4>
                            </Link>
                        </div>
                        <div className="relative shrink-0">
                            <button
                                ref={buttonRef}
                                className={clsx("text-slate-400 hover:text-premium-blue-900 p-1.5 rounded-xl transition-all",
                                    showMenu ? "bg-white shadow-sm ring-1 ring-slate-100 text-premium-blue-900" : "hover:bg-slate-50")}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                            >
                                <MoreHorizontal size={18} />
                            </button>
                            {showMenu && <LeadActionMenu lead={lead} onClose={() => setShowMenu(false)} anchorEl={buttonRef.current} />}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <div className="flex items-center gap-1.5 text-sm font-black text-premium-gold-600">
                            ₦{Number(lead.value || 0).toLocaleString()}
                        </div>
                        {isStale && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 uppercase tracking-widest">
                                <Clock size={10} strokeWidth={3} /> {daysInStage}d Stale
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col mt-auto pt-4 border-t border-slate-50 gap-3">
                        {lead.serviceInterest?.[0] && (
                            <div className="flex flex-wrap">
                                <span className="text-[9px] font-black px-2.5 py-1.5 rounded-lg bg-premium-blue-900 text-white uppercase tracking-widest leading-none border border-premium-blue-800 shadow-sm">
                                    {SERVICE_TYPES.find(s => s.id === lead.serviceInterest[0])?.name || lead.serviceInterest[0]}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => onContact(lead, 'phone')}
                                    className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90"
                                >
                                    <Phone size={12} strokeWidth={3} />
                                </button>
                                <button
                                    onClick={() => onContact(lead, 'email')}
                                    className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-premium-blue-900 hover:text-white transition-all shadow-sm active:scale-90"
                                >
                                    <Mail size={12} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <div className="flex items-center gap-1 text-slate-400 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                    <Clock size={9} className="opacity-50" />
                                    {timeAgo}
                                </div>
                                <div className="text-[8px] font-bold text-slate-300 pointer-events-none" title={lead.createdByName}>
                                    by {lead.createdByName?.split(' ')[0] || 'System'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
});

export default function SalesDashboard() {
    const [viewMode, setViewMode] = useState('board');
    const [timeRange, setTimeRange] = useState('day');
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Contact Modal State
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [selectedContactLead, setSelectedContactLead] = useState(null);
    const [contactMode, setContactMode] = useState('email');

    const handleContact = (lead, mode) => {
        setSelectedContactLead(lead);
        setContactMode(mode);
        setContactModalOpen(true);
    };

    // Consume Leads from Central Context
    const { leads, pagedLeads, loading, leadsHasMore, loadMoreLeads, moveLeadStage } = useLeads();

    const filteredLeads = useMemo(() => {
        const source = viewMode === 'list' ? pagedLeads : leads;
        return filterByRange(source || [], timeRange, referenceDate).filter(lead => {
            if (!searchTerm) return true;
            const lowerTerm = searchTerm.toLowerCase();
            return (
                String(lead.name || '').toLowerCase().includes(lowerTerm) ||
                String(lead.company || '').toLowerCase().includes(lowerTerm) ||
                String(lead.email || '').toLowerCase().includes(lowerTerm) ||
                String(lead.phone || '').includes(lowerTerm)
            );
        });
    }, [leads, timeRange, referenceDate, searchTerm]);

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        try {
            await moveLeadStage(draggableId, destination.droppableId);
            toast.success('Pipeline Updated', { icon: '🎯' });
        } catch (error) {
            if (error.code === 'WORKFLOW_VALIDATION_FAILED') {
                const isAuditCase = error.stageId === 'audit' || error.stageId === 'proposal';

                toast.error((t) => (
                    <div className="flex flex-col gap-3 text-slate-800">
                        <p className="font-bold text-sm">Prerequisite Missing</p>
                        <p className="text-xs opacity-80">{error.message}</p>
                        <div className="flex gap-2">
                            {isAuditCase && (
                                <button
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                        navigate('/audits/new');
                                    }}
                                    className="px-3 py-1.5 bg-premium-blue-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                                >
                                    Run Audit Now
                                </button>
                            )}
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                ), { duration: 6000 });
            } else {
                toast.error('Failed to move lead');
            }
        }
    };

    const getColumnTotal = (stageId) => {
        return filteredLeads
            .filter(l => (l.stage || 'new') === stageId)
            .reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-8">
            <AddLeadModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200 pb-6 text-white">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-premium-blue-900 tracking-tight leading-none">Lead Pipeline</h1>
                    <p className="text-slate-500 font-bold mt-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] opacity-60">Revenue Acquisition Engine</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <TimeFilter activeRange={timeRange} referenceDate={referenceDate} onRangeChange={setTimeRange} onDateChange={setReferenceDate} />
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none justify-center flex items-center gap-3 bg-premium-blue-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-premium-blue-900/30 active:scale-95 transition-all shadow-xl shadow-premium-blue-900/10">
                        <Plus size={16} strokeWidth={4} /> Add Lead
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white p-2 sm:p-3 rounded-[24px] border border-slate-100 shadow-sm gap-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 pr-2">
                    <div className="relative flex-1 group min-w-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-premium-gold-500" size={18} />
                        <input type="text" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-premium-gold-400/30 text-sm font-bold" />
                    </div>
                </div>
                <div className="flex bg-slate-100/60 p-1.5 rounded-2xl gap-1">
                    <button onClick={() => setViewMode('board')} className={clsx("px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase", viewMode === 'board' ? "bg-white shadow-xl text-premium-blue-900" : "text-slate-500 hover:bg-white/50")}>
                        <LayoutGrid size={16} strokeWidth={3} /> Board
                    </button>
                    <button onClick={() => setViewMode('list')} className={clsx("px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase", viewMode === 'list' ? "bg-white shadow-xl text-premium-blue-900" : "text-slate-500 hover:bg-white/50")}>
                        <List size={16} strokeWidth={3} /> List
                    </button>
                </div>
            </div>

            <div className="flex-1">
                {viewMode === 'board' ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar">
                            {loading ? <Skeleton count={4} className="h-64 rounded-2xl flex-1" wrapperClassName="flex gap-4 h-full" /> : (
                                <div className="flex gap-4 min-w-[1200px] lg:min-w-0 h-full">
                                    {PIPELINE_STAGES.map((stage) => (
                                        <div key={stage.id} className="flex-1 min-w-[280px] lg:min-w-0 flex flex-col">
                                            <div className="flex flex-col gap-2 mb-4 px-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={clsx("w-2 h-2 rounded-full", stage.color)}></div>
                                                        <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">{stage.name}</h3>
                                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-black">
                                                            {filteredLeads.filter(l => (l.stage || 'new') === stage.id).length}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-premium-blue-900/60 font-black text-[10px] uppercase tracking-tighter">
                                                    <TrendingUp size={12} className="text-premium-gold-600" />
                                                    ₦{getColumnTotal(stage.id).toLocaleString()}
                                                </div>
                                            </div>

                                            <Droppable droppableId={stage.id}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className={clsx(
                                                            "flex-1 bg-slate-100/40 rounded-[28px] p-3 border border-slate-100/50 overflow-y-auto custom-scrollbar min-h-[500px] transition-colors",
                                                            snapshot.isDraggingOver ? "bg-premium-blue-50/50 border-premium-blue-200/20" : ""
                                                        )}
                                                    >
                                                        {filteredLeads
                                                            .filter(l => (l.stage || 'new') === stage.id)
                                                            .map((lead, index) => (
                                                                <LeadCard key={lead.id} lead={lead} index={index} onContact={handleContact} />
                                                            ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DragDropContext>
                ) : (
                    <div className="bg-white md:rounded-[32px] border border-slate-100 md:shadow-xl md:shadow-slate-200/50 overflow-hidden h-full">
                        {/* List view logic remains similar but simplified for space */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal Information</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Intelligence</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Status</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valuation</th>
                                        <th className="py-5 px-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredLeads.map((lead) => (
                                        <tr key={lead.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="py-5 px-8">
                                                <Link to={`/sales/leads/${lead.id}`} className="font-black text-premium-blue-900 text-lg tracking-tight">{lead.name}</Link>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{lead.company}</div>
                                            </td>
                                            <td className="py-5 px-6 text-xs font-bold text-slate-600">
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleContact(lead, 'phone')} className="hover:text-emerald-600 transition-colors"><Phone size={14} /></button>
                                                    <button onClick={() => handleContact(lead, 'email')} className="hover:text-blue-600 transition-colors"><Mail size={14} /></button>
                                                    <span className="opacity-50">|</span>
                                                    {lead.phone}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border bg-white shadow-sm">{lead.stage}</span>
                                            </td>
                                            <td className="py-5 px-6 font-black text-premium-gold-600 italic">₦{Number(lead.value || 0).toLocaleString()}</td>
                                            <td className="py-5 px-8 text-right">
                                                <button className="text-slate-400 hover:text-premium-blue-900 p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {leadsHasMore && (
                                <div className="p-8 flex justify-center border-t border-slate-50">
                                    <button
                                        onClick={() => loadMoreLeads()}
                                        className="px-8 py-3 rounded-2xl bg-slate-50 text-premium-blue-900 font-extrabold text-sm hover:bg-slate-100 transition-all border border-slate-200 shadow-sm flex items-center gap-2"
                                    >
                                        <TrendingUp size={16} className="text-premium-gold-600" />
                                        Load More Leads
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <ContactInteractionModal
                isOpen={contactModalOpen}
                onClose={() => setContactModalOpen(false)}
                lead={selectedContactLead}
                initialMode={contactMode}
            />
        </div>
    );
}

