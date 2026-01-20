import React, { useState } from 'react';
import { X, Package, Truck, Search, Plus, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useInventory } from '../../contexts/InventoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export default function DispatchMaterialModal({ isOpen, onClose, project }) {
    const { inventory, updateStock } = useInventory();
    const { userProfile } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const filteredInventory = searchTerm
        ? inventory.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : inventory.slice(0, 5);

    const addItem = (product) => {
        if (selectedItems.find(i => i.id === product.id)) {
            toast.error("Item already in dispatch list");
            return;
        }
        setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
        setSearchTerm('');
    };

    const updateQty = (id, qty) => {
        setSelectedItems(selectedItems.map(item =>
            item.id === id ? { ...item, quantity: Math.max(1, parseInt(qty) || 1) } : item
        ));
    };

    const removeItem = (id) => {
        setSelectedItems(selectedItems.filter(item => item.id !== id));
    };

    const handleDispatch = async () => {
        if (selectedItems.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Synchronizing dispatch to cloud...');

        try {
            // 1. Create Dispatch Record
            const dispatchData = {
                projectId: project.id,
                projectName: project.name,
                items: selectedItems.map(i => ({
                    id: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    category: i.category || 'General',
                    status: 'Pending'
                })),
                dispatchedBy: {
                    id: userProfile.uid,
                    name: userProfile.displayName || userProfile.email
                },
                dispatchDate: serverTimestamp(),
                status: 'In Transit'
            };

            await addDoc(collection(db, 'material_dispatches'), dispatchData);

            // 2. Update Inventory Stock (Deduct)
            for (const item of selectedItems) {
                await updateStock(item.id, -item.quantity, {
                    projectId: project.id,
                    action: 'Dispatch',
                    reason: `Project Install: ${project.name}`
                });
            }

            // 3. Log to Project Timeline
            await addDoc(collection(db, 'project_timeline'), {
                projectId: project.id,
                type: 'success',
                title: 'Materials Dispatched',
                description: `${selectedItems.length} items sent to site.`,
                author: userProfile.displayName || 'System',
                createdAt: serverTimestamp()
            });

            toast.success('Materials dispatched & inventory updated!', { id: toastId });
            onClose();
        } catch (err) {
            console.error("Dispatch Error:", err);
            toast.error("Failed to process dispatch: " + err.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div onClick={(e) => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Material Dispatch</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Project: {project.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Item Search */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">Catalog Search</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search inventory by name (e.g. Inverter, Battery)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500/20 focus:bg-white focus:ring-[12px] focus:ring-blue-500/5 transition-all outline-none"
                            />
                        </div>

                        {searchTerm && (
                            <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200 overflow-y-auto max-h-[200px]">
                                {filteredInventory.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 text-sm italic">No items found</div>
                                ) : (
                                    filteredInventory.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => addItem(p)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100 last:border-0 group/item transition-colors"
                                        >
                                            <div className="text-left">
                                                <div className="font-black text-slate-700 group-hover/item:text-blue-600 transition-colors">{p.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.05em]">{p.category} • In Stock: {p.stock}</div>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all">
                                                <Plus size={18} />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Selected Items Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dispatch Manifest</label>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedItems.length} Items</span>
                        </div>

                        {selectedItems.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-100 rounded-3xl p-12 text-center text-slate-300">
                                <Package size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="font-bold text-sm">Add items from the catalog above to build the manifest</p>
                            </div>
                        ) : (
                            <div className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest">Item</th>
                                            <th className="px-6 py-4 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest">In Stock</th>
                                            <th className="px-6 py-4 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest">Qty to Send</th>
                                            <th className="px-1 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{item.name}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase">{item.category}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-black text-slate-400 font-mono italic">{item.stock}</td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.stock}
                                                        value={item.quantity}
                                                        onChange={(e) => updateQty(item.id, e.target.value)}
                                                        className="w-20 mx-auto block p-2 text-center rounded-xl bg-white border border-slate-200 font-black text-blue-600 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                                    />
                                                </td>
                                                <td className="px-2 py-4">
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 text-sm font-black text-slate-500 hover:bg-white hover:text-slate-700 rounded-2xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDispatch}
                        disabled={isSubmitting || selectedItems.length === 0}
                        className={clsx(
                            "px-10 py-4 text-sm font-black text-white rounded-2xl shadow-xl transition-all flex items-center gap-3 active:scale-[0.98]",
                            isSubmitting || selectedItems.length === 0
                                ? "bg-slate-300 shadow-none cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-blue-500/30 hover:-translate-y-0.5"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Truck size={20} />
                                <span>Commit Dispatch</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
