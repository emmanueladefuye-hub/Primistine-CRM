import React, { useState } from 'react';
import { X, Package, Tag, DollarSign, List, BarChart } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';

export default function AddProductModal({ isOpen, onClose }) {
    const { addItem } = useInventory();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: 'Solar Panels',
        price: '',
        stock: 0,
        reorderPoint: 10
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addItem(formData);
            onClose();
            setFormData({
                name: '',
                sku: '',
                category: 'Solar Panels',
                price: '',
                stock: 0,
                reorderPoint: 10
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = [
        'Solar Panels',
        'Inverters',
        'Batteries',
        'Cables',
        'Mounting Rack',
        'Protection',
        'Accessories'
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-premium-blue-50 text-premium-blue-600 rounded-xl flex items-center justify-center">
                            <Package size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 tracking-tight">Add New Product</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catalog Entry</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Package size={12} /> Product Name
                            </label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Jinko 550W Mono Facial"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-premium-blue-500/20 focus:border-premium-blue-500 outline-none font-bold text-slate-700 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Tag size={12} /> SKU / Model
                            </label>
                            <input
                                required
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="JK-550M"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-premium-blue-500/20 focus:border-premium-blue-500 outline-none font-bold text-slate-700"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <List size={12} /> Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-premium-blue-500/20 focus:border-premium-blue-500 outline-none font-bold text-slate-700"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={12} /> Unit Price
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                                <input
                                    required
                                    type="text"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="150,000"
                                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-premium-blue-500/20 focus:border-premium-blue-500 outline-none font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BarChart size={12} /> Initial Stock
                            </label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-premium-blue-500/20 focus:border-premium-blue-500 outline-none font-bold text-slate-700"
                            />
                        </div>

                        <div className="col-span-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Reorder Point (Low Stock Threshold)</label>
                                <span className="text-sm font-black text-amber-900">{formData.reorderPoint} Units</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={formData.reorderPoint}
                                onChange={e => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 1 })}
                                className="w-full accent-amber-500 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-[9px] text-amber-600 mt-2 font-medium">System will flag this item when stock falls below this level.</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-premium-blue-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 transform hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Adding...' : 'Add to Inventory'}
                    </button>
                </form>
            </div>
        </div>
    );
}
