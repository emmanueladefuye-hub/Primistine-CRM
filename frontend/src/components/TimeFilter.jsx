import React, { useRef } from 'react';
import clsx from 'clsx';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const TimeFilter = ({ activeRange, referenceDate, onRangeChange, onDateChange }) => {
    const dateInputRef = useRef(null);
    const ranges = [
        { id: 'day', label: 'Day' },
        { id: 'week', label: 'Week' },
        { id: 'month', label: 'Month' },
        { id: 'year', label: 'Year' }
    ];

    const anchor = new Date(referenceDate);

    // Format label based on range
    const getLabel = () => {
        try {
            if (activeRange === 'day') return anchor.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
            if (activeRange === 'week') {
                const start = new Date(anchor);
                start.setDate(anchor.getDate() - anchor.getDay());
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                return `${start.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            }
            if (activeRange === 'month') return anchor.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
            if (activeRange === 'year') return anchor.getFullYear().toString();
        } catch (e) {
            return referenceDate;
        }
        return '';
    };

    const navigate = (direction) => {
        const newDate = new Date(anchor);
        if (activeRange === 'day') newDate.setDate(anchor.getDate() + direction);
        if (activeRange === 'week') newDate.setDate(anchor.getDate() + direction * 7);
        if (activeRange === 'month') newDate.setMonth(anchor.getMonth() + direction);
        if (activeRange === 'year') newDate.setFullYear(anchor.getFullYear() + direction);
        onDateChange(newDate.toISOString().split('T')[0]);
    };

    return (
        <div className="flex flex-col lg:flex-row items-center gap-3">
            <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1.5 text-slate-400 hover:text-premium-blue-700 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Previous Period"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1 px-1">
                    {ranges.map((range) => (
                        <button
                            key={range.id}
                            onClick={() => onRangeChange(range.id)}
                            className={clsx(
                                "px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all",
                                activeRange === range.id
                                    ? "bg-premium-blue-900 text-white shadow-md shadow-premium-blue-900/20"
                                    : "text-slate-500 hover:text-premium-blue-700 hover:bg-slate-50"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => navigate(1)}
                    className="p-1.5 text-slate-400 hover:text-premium-blue-700 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Next Period"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 pl-3 pr-1 py-1 rounded-xl shadow-sm">
                    <span className="text-[11px] font-bold text-premium-blue-900 whitespace-nowrap">
                        {getLabel()}
                    </span>

                    <div className="relative h-8 w-8">
                        <button
                            onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current.click()}
                            className="w-full h-full flex items-center justify-center text-slate-400 hover:text-premium-blue-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
                            title="Jump to date"
                        >
                            <Calendar size={14} />
                        </button>
                        <input
                            ref={dateInputRef}
                            type="date"
                            className="absolute inset-0 opacity-0 pointer-events-none"
                            value={referenceDate}
                            onChange={(e) => onDateChange(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeFilter;
