import React, { useState } from 'react';
import { Search, Plus, X, Package, Tag } from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';
import clsx from 'clsx';

export default function AddQuoteItemModal({ isOpen, onClose, onAddItem }) {
    const { inventory, loading } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);

    if (!isOpen) return null;

    // Filter inventory based on search
    const filteredInventory = (inventory || []).filter(item => {
        const term = searchTerm.toLowerCase();
        return (
            (item.name || '').toLowerCase().includes(term) ||
            (item.sku || '').toLowerCase().includes(term) ||
            (item.category || '').toLowerCase().includes(term)
        );
    });

    const handleSelect = (item) => {
        let price = item.price;
        // Handle "₦15,000" strings if present
        if (typeof price === 'string') {
            price = parseFloat(price.replace(/[^0-9.]/g, ''));
        }

        setSelectedItem(item);
        setUnitPrice(price || 0);
        setQuantity(1);
    };

    const handleAdd = () => {
        if (!selectedItem) return;

        onAddItem({
            ...selectedItem,
            price: unitPrice,
            qty: quantity
        });

        // Reset and close
        setSelectedItem(null);
        setSearchTerm('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-premium-blue-900">Add Item to Quote</h2>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Select from Inventory</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Inventory List */}
                    <div className="flex-1 flex flex-col border-r border-slate-100 min-h-[300px]">
                        <div className="p-4 border-b border-slate-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name, SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-premium-blue-500/20 focus:border-premium-blue-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400 text-sm">Loading inventory...</div>
                            ) : filteredInventory.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">No items found matching "{searchTerm}"</div>
                            ) : (
                                filteredInventory.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className={clsx(
                                            "w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center group",
                                            selectedItem?.id === item.id
                                                ? "bg-premium-blue-50 border-premium-blue-200 ring-1 ring-premium-blue-200"
                                                : "bg-white border-slate-100 hover:border-premium-blue-100 hover:bg-slate-50"
                                        )}
                                    >
                                        <div>
                                            <div className={clsx("font-bold text-sm mb-0.5", selectedItem?.id === item.id ? "text-premium-blue-900" : "text-slate-700")}>
                                                {item.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                <span className="flex items-center gap-1"><Tag size={10} /> {item.sku || 'No SKU'}</span>
                                                <span>•</span>
                                                <span className={clsx("px-1.5 py-0.5 rounded", item.stockLevel > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                                                    {item.stockLevel || 0} in stock
                                                </span>
                                            </div>
                                        </div>
                                        <div className="font-bold text-premium-gold-600 text-sm">
                                            ₦{Number(item.price || 0).toLocaleString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Configuration */}
                    <div className="w-full md:w-[280px] bg-slate-50 p-5 flex flex-col justify-between">
                        {selectedItem ? (
                            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                                <div>
                                    <h3 className="font-black text-premium-blue-900 leading-tight mb-4">{selectedItem.name}</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quantity</label>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 font-bold text-slate-600 transition-colors"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-16 text-center bg-transparent font-bold text-xl text-slate-800 outline-none"
                                                />
                                                <button
                                                    onClick={() => setQuantity(quantity + 1)}
                                                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 font-bold text-slate-600 transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unit Price (₦)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={unitPrice}
                                                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-premium-blue-500/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
                                        <span className="text-xl font-black text-premium-blue-900">₦{(unitPrice * quantity).toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={handleAdd}
                                        className="w-full py-3 bg-premium-blue-900 text-white rounded-xl font-bold hover:bg-premium-blue-800 shadow-xl shadow-premium-blue-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} strokeWidth={3} /> Add to Quote
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 opacity-60">
                                <Package size={48} strokeWidth={1} />
                                <p className="text-sm font-medium text-center max-w-[150px]">Select an item from the list to configure</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
