import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Plus } from 'lucide-react';
import clsx from 'clsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const ENGINEERS = [
    { id: 1, name: 'Engr. Tobi', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 2, name: 'Engr. David', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 3, name: 'Tech. Sarah', color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

const SCHEDULE = [
    { id: 1, engineerId: 1, day: 0, title: 'Lekki Gardens Audit', time: '10:00 AM' },
    { id: 2, engineerId: 1, day: 2, title: 'Inverter Install', time: '09:00 AM' },
    { id: 3, engineerId: 2, day: 1, title: 'Maintenance Visit', time: '11:00 AM' },
    { id: 4, engineerId: 3, day: 3, title: 'Site Survey', time: '02:00 PM' },
    { id: 5, engineerId: 3, day: 4, title: 'Training', time: '10:00 AM' },
];

export default function TeamCalendar() {
    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-premium-blue-900">Team Schedule</h1>
                    <p className="text-slate-500">Manage field assignments and availability.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                        <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={20} className="text-slate-500" /></button>
                        <span className="px-4 font-bold text-slate-700">Feb 10 - Feb 14, 2026</span>
                        <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={20} className="text-slate-500" /></button>
                    </div>
                    <button className="bg-premium-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 flex items-center gap-2">
                        <Plus size={18} /> New Assignment
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Header Row */}
                <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50">
                    <div className="p-4 border-r border-slate-200 font-bold text-slate-400 text-xs uppercase text-center flex items-center justify-center">
                        Engineer
                    </div>
                    {DAYS.map((day, i) => (
                        <div key={day} className="p-4 border-r border-slate-200 last:border-r-0 text-center">
                            <div className="font-bold text-slate-700">{day}</div>
                            <div className="text-xs text-slate-400">Feb {10 + i}</div>
                        </div>
                    ))}
                </div>

                {/* Rows */}
                <div className="flex-1 overflow-y-auto">
                    {ENGINEERS.map(eng => (
                        <div key={eng.id} className="grid grid-cols-6 border-b border-slate-100 min-h-[120px]">
                            <div className="p-4 border-r border-slate-100 flex flex-col items-center justify-center bg-slate-50/30">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 mb-2">
                                    {eng.name.split(' ')[1].charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-slate-700 text-center">{eng.name}</span>
                            </div>

                            {DAYS.map((_, dayIndex) => {
                                const task = SCHEDULE.find(s => s.engineerId === eng.id && s.day === dayIndex);
                                return (
                                    <div key={dayIndex} className="p-2 border-r border-slate-100 last:border-r-0 relative group">
                                        <div className="w-full h-full rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border-2 border-transparent hover:border-dashed hover:border-slate-200 flex items-center justify-center">
                                            {!task && <Plus className="text-slate-300 opacity-0 group-hover:opacity-100" />}
                                            {task && (
                                                <div className={clsx("w-full mx-1 p-3 rounded-lg border text-left shadow-sm cursor-pointer hover:shadow-md transition-all", eng.color)}>
                                                    <div className="text-xs font-bold opacity-75 mb-1">{task.time}</div>
                                                    <div className="font-bold text-sm leading-tight line-clamp-2">{task.title}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
