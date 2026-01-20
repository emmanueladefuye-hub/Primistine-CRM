import React, { useState } from 'react';
import { X, ArrowRight, Package, Truck, MinusCircle, PlusCircle } from 'lucide-react';
import clsx from 'clsx';

export default function StockMovementModal({ isOpen, onClose, selectedProduct, onSave }) {
    if (!isOpen) return null;

    const [type, setType] = useState('in'); // 'in' or 'out'
    const [quantity, setQuantity] = useState(1);
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            type,
            quantity: Number(quantity),
            reference,
            notes,
            productId: selectedProduct?.id
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-bold text-slate-800">
                        {selectedProduct ? `Update Stock: ${selectedProduct.name}` : 'Stock Movement'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Movement Type Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('in')}
                            className={clsx("flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                type === 'in' ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <PlusCircle size={16} /> Receive Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('out')}
                            className={clsx("flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                type === 'out' ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <MinusCircle size={16} /> Issue Stock
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Quantity {type === 'in' ? '(Received)' : '(Used)'}</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900 text-lg font-bold"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">
                                {type === 'in' ? 'Supplier / PO Number' : 'Project / Ticket ID'}
                            </label>
                            <input
                                type="text"
                                required
                                placeholder={type === 'in' ? "e.g., Jinko Solar Ltd / PO-2026-001" : "e.g., Project #105 - Lekki Mall"}
                                value={reference}
                                onChange={e => setReference(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Notes (Optional)</label>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-premium-blue-900/20 focus:border-premium-blue-900"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={clsx("w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95",
                            type === 'in' ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                        )}
                    >
                        {type === 'in' ? 'Confirm Receipt' : 'Confirm Issue'} <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
