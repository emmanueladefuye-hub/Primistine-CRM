import React from 'react';
import { Package, Truck, RotateCcw, FileText } from 'lucide-react';
import { useCollection } from '../../../hooks/useFirestore';
import { where, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useInventory } from '../../../contexts/InventoryContext';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Skeleton from '../../ui/Skeleton';
import { useState } from 'react';
import { X, Search, Check } from 'lucide-react';

export default function TabMaterials({ project }) {
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const { userProfile } = useAuth();

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
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
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

function RequestMaterialsModal({ isOpen, onClose, project, currentUser }) {
    const { inventory, deductForProject } = useInventory();
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    // Filter items based on search
    const filteredInventory = inventory?.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleAddItem = (item) => {
        if (selectedItems.find(i => i.id === item.id)) return;
        setSelectedItems([...selectedItems, { ...item, requestQty: 1 }]);
    };

    const handleRemoveItem = (id) => {
        setSelectedItems(selectedItems.filter(i => i.id !== id));
    };

    const handleQtyChange = (id, qty) => {
        setSelectedItems(selectedItems.map(i =>
            i.id === id ? { ...i, requestQty: parseInt(qty) || 1 } : i
        ));
    };

    const handleSubmit = async () => {
        if (selectedItems.length === 0) return;
        setSubmitting(true);
        const toastId = toast.loading('Processing dispatch...');

        try {
            // 1. Deduct from Inventory
            const deductionPromises = selectedItems.map(item =>
                deductForProject(item.id, item.requestQty, project.id, project.name)
            );

            const results = await Promise.all(deductionPromises);
            const failedItems = results.filter(r => !r);

            if (failedItems.length > 0) {
                toast.error('Some items could not be deducted from stock.', { id: toastId });
                // In a real app, we might want to rollback or handle partials
            }

            // 2. Create Dispatch Record
            await addDoc(collection(db, 'material_dispatches'), {
                projectId: project.id,
                projectName: project.name,
                requestedBy: {
                    uid: currentUser?.uid || 'unknown',
                    name: currentUser?.name || 'Unknown User'
                },
                receivedBy: {
                    name: "Site Foreman" // Default for now
                },
                dispatchDate: serverTimestamp(),
                status: 'On Site',
                items: selectedItems.map(i => ({
                    id: i.id,
                    name: i.name,
                    quantity: i.requestQty,
                    sku: i.sku || '-',
                    status: 'On Site'
                }))
            });

            toast.success('Materials dispatched successfully!', { id: toastId });
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Failed to dispatch materials', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Dispatch Materials</h2>
                        <p className="text-sm font-medium text-slate-400">Select items from inventory to send to {project.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Inventory Picker */}
                    <div className="flex-1 p-6 border-r border-slate-100 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <div className="relative mb-4">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {filteredInventory.map(item => {
                                const isSelected = selectedItems.find(i => i.id === item.id);
                                const isOutOfStock = (Number(item.stock) || 0) <= 0;
                                return (
                                    <button
                                        key={item.id}
                                        disabled={isSelected || isOutOfStock}
                                        onClick={() => handleAddItem(item)}
                                        className={`text-left p-3 rounded-xl border transition-all flex justify-between items-center group ${isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500/20' :
                                                isOutOfStock ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' :
                                                    'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                                            }`}
                                    >
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm group-hover:text-blue-700">{item.name}</p>
                                            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Stock: {item.stock || 0} • {item.sku}</p>
                                        </div>
                                        {isSelected ? <Check size={16} className="text-blue-600" /> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Selected Cart */}
                    <div className="w-full md:w-[400px] p-6 flex flex-col bg-white">
                        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                            <Package size={18} className="text-blue-600" />
                            Manifest ({selectedItems.length})
                        </h3>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4">
                            {selectedItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 border-2 border-dashed border-slate-100 rounded-xl">
                                    <Package size={32} />
                                    <p className="text-xs font-bold uppercase tracking-widest">Cart Empty</p>
                                </div>
                            ) : (
                                selectedItems.map(item => (
                                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available: {item.stock}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.stock}
                                                value={item.requestQty}
                                                onChange={e => handleQtyChange(item.id, e.target.value)}
                                                className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            />
                                            <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-500 rounded-lg transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                <p className="text-xs font-medium text-amber-800 leading-snug">
                                    ⚠️ Confirming this dispatch will immediately deduct these items from the main inventory.
                                </p>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || selectedItems.length === 0}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {submitting ? 'Processing...' : 'Confirm Dispatch'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

