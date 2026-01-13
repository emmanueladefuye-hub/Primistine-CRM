import React from 'react';
import { Package, Truck, RotateCcw, FileText } from 'lucide-react';
import { useCollection } from '../../../hooks/useFirestore';
import { where } from 'firebase/firestore';
import Skeleton from '../../ui/Skeleton';

export default function TabMaterials({ project }) {
    // Live Data: Fetch separate dispatch records
    const { data: dispatches, loading } = useCollection('material_dispatches', [
        where('projectId', '==', project.id)
    ]);

    // Flatten items from all dispatch records
    const allItems = dispatches?.flatMap(d => d.items.map(item => ({
        ...item,
        dispatchDate: d.dispatchDate?.toDate().toLocaleDateString() || '-',
        receivedBy: d.receivedBy?.name || 'Unknown',
        dispatchId: d.id
    }))) || [];

    if (loading) return <Skeleton count={4} className="h-12" />;

    return (
        <div className="space-y-8">
            {/* Section A: Dispatched */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Truck size={18} /> Materials Dispatched
                    </h3>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                            <FileText size={16} /> View Packing List
                        </button>
                        <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                            <Package size={16} /> Request Materials
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-bold text-slate-500 uppercase text-xs">Item</th>
                                <th className="px-6 py-3 font-bold text-slate-500 uppercase text-xs">Quantity</th>
                                <th className="px-6 py-3 font-bold text-slate-500 uppercase text-xs">Dispatched</th>
                                <th className="px-6 py-3 font-bold text-slate-500 uppercase text-xs">Received By</th>
                                <th className="px-6 py-3 font-bold text-slate-500 uppercase text-xs">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allItems.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                        No materials dispatched yet.
                                    </td>
                                </tr>
                            ) : (
                                allItems.map((item, idx) => (
                                    <MaterialRow
                                        key={`${item.dispatchId}-${idx}`}
                                        item={item.name}
                                        qty={item.quantity}
                                        date={item.dispatchDate}
                                        receiver={item.receivedBy}
                                        status={item.status}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section B: Returns */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <RotateCcw size={18} /> Material Returns
                    </h3>
                    <button className="text-amber-600 hover:text-amber-700 text-sm font-bold">
                        Process Return
                    </button>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                    <Package size={24} className="mx-auto mb-2 opacity-50" />
                    <p>No materials returned for this project yet.</p>
                </div>
            </div>
        </div>
    );
}

function MaterialRow({ item, qty, date, receiver, status }) {
    const statusColor = {
        'Installed': 'text-green-600 bg-green-50',
        'On Site': 'text-blue-600 bg-blue-50',
        'Pending': 'text-slate-500 bg-slate-100',
    }[status] || 'text-slate-500';

    return (
        <tr className="hover:bg-slate-50">
            <td className="px-6 py-3 font-medium text-slate-800">{item}</td>
            <td className="px-6 py-3 text-slate-600 font-mono">{qty}</td>
            <td className="px-6 py-3 text-slate-500">{date}</td>
            <td className="px-6 py-3 text-slate-500">{receiver}</td>
            <td className="px-6 py-3">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${statusColor}`}>
                    {status}
                </span>
            </td>
        </tr>
    );
}
