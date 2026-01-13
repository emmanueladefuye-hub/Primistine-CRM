import React, { useState } from 'react';
import { ClipboardList, CheckCircle, Clock, Plus, ChevronRight, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useCollection } from '../../../hooks/useFirestore';
import { where } from 'firebase/firestore';
import EmptyState from '../../ui/EmptyState';
import Skeleton from '../../ui/Skeleton';

export default function TabWorkOrders({ project }) {
    // Live Data
    const { data: workOrders, loading } = useCollection('work_orders', [
        where('projectId', '==', project.id)
    ]);

    if (loading) return <Skeleton count={3} variant="rectangular" className="h-16" />;

    if (workOrders.length === 0) {
        return (
            <EmptyState
                title="No Work Orders"
                description="There are no active work orders for this project yet."
                action={
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        <Plus size={16} /> Create Work Order
                    </button>
                }
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Project Tasks ({workOrders.length})</h3>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    <Plus size={16} /> Create Work Order
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Order #</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Task</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Assigned To</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Scheduled</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Status</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {workOrders.map((wo) => (
                            <tr key={wo.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                <td className="px-6 py-4 font-mono text-slate-500">{wo.id}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{wo.title}</td>
                                <td className="px-6 py-4 text-slate-600">{wo.assignedTo}</td>
                                <td className="px-6 py-4 text-slate-600">{wo.date}</td>
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                        wo.status === 'In Progress' ? "bg-blue-50 text-blue-700" :
                                            wo.status === 'Completed' ? "bg-green-50 text-green-700" :
                                                "bg-slate-100 text-slate-500"
                                    )}>
                                        {wo.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-xs font-bold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded bg-slate-100 hover:bg-blue-50 transition-colors">View</button>
                                        {wo.status === 'In Progress' ? (
                                            <button className="text-xs font-bold text-green-700 hover:text-green-800 px-3 py-1.5 rounded bg-green-100 hover:bg-green-200 transition-colors">Complete</button>
                                        ) : (
                                            <button className="text-xs font-bold text-blue-700 hover:text-blue-800 px-3 py-1.5 rounded bg-blue-100 hover:bg-blue-200 transition-colors">Start</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
