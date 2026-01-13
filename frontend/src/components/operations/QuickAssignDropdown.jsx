import React, { useState, useRef, useEffect } from 'react';
import { User, Check, Smartphone, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useTeams } from '../../contexts/TeamsContext';

export default function QuickAssignDropdown({ issue, onAssign, onClose }) {
    const { teamMembers, loading } = useTeams();
    const [selectedEngineer, setSelectedEngineer] = useState(issue?.assignee || null);
    const [notify, setNotify] = useState(true);
    const [isUrgent, setIsUrgent] = useState(false);
    const containerRef = useRef(null);

    // Helpers
    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';
    const activeMembers = teamMembers?.filter(m => m.status === 'Active') || [];

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleAssign = () => {
        if (!selectedEngineer) return;

        onAssign({
            engineer: selectedEngineer,
            notify,
            urgent: isUrgent
        });

        toast.success(`Assigned to ${selectedEngineer.name}`);
        onClose();
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-100" ref={containerRef}>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Assign Engineer</h4>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Loading Team...</span>
                    </div>
                ) : activeMembers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 italic text-sm">
                        No active members found.
                    </div>
                ) : (
                    activeMembers.map(eng => (
                        <button
                            key={eng.id}
                            onClick={() => setSelectedEngineer(eng)}
                            className={clsx(
                                "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-sm",
                                selectedEngineer?.id === eng.id ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "hover:bg-slate-50 text-slate-700"
                            )}
                        >
                            <div className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                selectedEngineer?.id === eng.id ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                            )}>
                                {getInitials(eng.name)}
                            </div>
                            <div className="flex-1 text-left">
                                <span className="font-bold block leading-none">{eng.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium uppercase mt-1">{eng.role}</span>
                            </div>
                            {selectedEngineer?.id === eng.id && <Check size={16} />}
                        </button>
                    ))
                )}
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={notify}
                        onChange={(e) => setNotify(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Smartphone size={14} className="text-slate-400" />
                    Notify via SMS
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                    <div
                        className={clsx(
                            "w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer",
                            isUrgent ? "bg-red-500" : "bg-slate-200"
                        )}
                        onClick={() => setIsUrgent(!isUrgent)}
                    >
                        <div className={clsx(
                            "w-3 h-3 bg-white rounded-full shadow-sm transform transition duration-200 ease-in-out",
                            isUrgent ? "translate-x-4" : "translate-x-0"
                        )} />
                    </div>
                    <span className={isUrgent ? "text-red-600 font-bold" : ""}>Mark as Urgent</span>
                </label>

                <button
                    onClick={handleAssign}
                    disabled={!selectedEngineer}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Assign Ticket
                </button>
            </div>
        </div>
    );
}
