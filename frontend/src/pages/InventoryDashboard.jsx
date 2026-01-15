import React, { useState } from 'react';
import { Search, AlertCircle, ShoppingCart, Package, ArrowUpRight, Filter, Plus, FileText } from 'lucide-react';
import clsx from 'clsx';
import StockMovementModal from '../components/StockMovementModal';
import ProductDetailModal from '../components/ProductDetailModal';
import AddProductModal from '../components/AddProductModal';

import { useInventory } from '../contexts/InventoryContext';
import TimeFilter from '../components/TimeFilter';

export default function InventoryDashboard() {
    const { inventory, updateStock, loading, totalInventoryDisplay } = useInventory();
    const [selectedMovementProduct, setSelectedMovementProduct] = useState(null); // For Stock Movement
    const [selectedDetailProduct, setSelectedDetailProduct] = useState(null); // For Product Detail
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [timeRange, setTimeRange] = useState('day');
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);

    // Valuation is handled by context now
    // Removed mock multipliers

    const handleStockUpdate = async ({ type, quantity, productId, reference, notes }) => {
        const adjustment = type === 'in' ? quantity : -quantity;
        await updateStock(productId, adjustment, { reference, notes });
        setSelectedMovementProduct(null); // Close modal only after update
    };

    const filteredInventory = inventory.filter(item => {
        const matchesTab = activeTab === 'all' || item.status !== 'In Stock';
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const ProductCard = ({ item, onMovement, onDetail }) => (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all active:scale-[0.99]">
            <div className="flex justify-between items-start">
                <div className="min-w-0 cursor-pointer" onClick={() => onDetail(item)}>
                    <h3 className="font-black text-premium-blue-900 text-lg truncate tracking-tight leading-tight">{item.name}</h3>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SKU: {item.sku}</div>
                </div>
                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200">
                    {item.category}
                </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Stock Level</span>
                    <div className="flex items-center gap-2">
                        <div className={clsx("w-2.5 h-2.5 rounded-full ring-4 ring-offset-2",
                            item.status === 'In Stock' ? 'bg-emerald-500 ring-emerald-50' :
                                item.status === 'Low Stock' ? 'bg-amber-500 ring-amber-50' : 'bg-red-500 ring-red-50'
                        )}></div>
                        <span className={clsx("text-sm font-black",
                            item.status === 'Out of Stock' ? 'text-red-700' : 'text-slate-800'
                        )}>
                            {item.stock} Units
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-1 items-end text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Unit Price</span>
                    <div className="text-sm font-black text-premium-blue-900">{item.price}</div>
                </div>
            </div>

            <div className="pt-2">
                <button
                    onClick={() => onMovement(item)}
                    className="w-full py-3 bg-premium-blue-50 text-premium-blue-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-premium-blue-100 border border-premium-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    Update Stock
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <StockMovementModal
                isOpen={!!selectedMovementProduct}
                onClose={() => setSelectedMovementProduct(null)}
                selectedProduct={selectedMovementProduct}
                onSave={handleStockUpdate}
            />
            <ProductDetailModal
                isOpen={!!selectedDetailProduct}
                onClose={() => setSelectedDetailProduct(null)}
                product={selectedDetailProduct}
            />
            <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            {/* Metrics Row: Executive High-Density */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-blue-900/5 transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none mb-3">Total Valuation</p>
                        <h3 className="text-2xl font-black text-premium-blue-900 tracking-tight">{totalInventoryDisplay}</h3>
                    </div>
                    <div className="p-4 bg-blue-50 text-premium-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><Package size={24} strokeWidth={2.5} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-red-900/5 transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none mb-3">Low Stock Alerts</p>
                        <h3 className="text-2xl font-black text-red-600 tracking-tight">{inventory.filter(i => i.status !== 'In Stock').length} Items</h3>
                    </div>
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform"><AlertCircle size={24} strokeWidth={2.5} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-amber-900/5 transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] leading-none mb-3">Pending Orders</p>
                        <h3 className="text-2xl font-black text-premium-gold-600 tracking-tight">0</h3>
                    </div>
                    <div className="p-4 bg-amber-50 text-premium-gold-600 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingCart size={24} strokeWidth={2.5} /></div>
                </div>
            </div>

            {/* Toolbar: High-Density & Intelligent Stacking */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-white p-2 sm:p-3 rounded-[24px] border border-slate-100 shadow-sm gap-3">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 items-stretch sm:items-center">
                    {/* Tabs: Executive Segmented Picker */}
                    <div className="flex bg-slate-100/60 p-1.5 rounded-2xl gap-1">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={clsx("flex-1 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'all' ? "bg-white shadow-xl text-premium-blue-900 ring-1 ring-black/5" : "text-slate-500 hover:text-slate-800")}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('low')}
                            className={clsx("flex-1 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'low' ? "bg-white shadow-xl text-red-600 ring-1 ring-black/5" : "text-slate-500 hover:text-slate-800")}
                        >
                            Shortage
                        </button>
                    </div>

                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-premium-gold-500 transition-all" size={18} />
                        <input
                            type="text"
                            placeholder="Search SKU or Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-premium-gold-400/30 text-sm font-bold placeholder:text-slate-400 transition-all"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <TimeFilter
                        activeRange={timeRange}
                        referenceDate={referenceDate}
                        onRangeChange={setTimeRange}
                        onDateChange={setReferenceDate}
                    />
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button className="flex-1 justify-center flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all">
                            <FileText size={16} /> Reports
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex-1 justify-center flex items-center gap-3 bg-premium-blue-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-premium-blue-900/20 active:scale-95 transition-all"
                        >
                            <Plus size={16} strokeWidth={4} /> Add Product
                        </button>
                    </div>
                </div>
            </div>

            {/* Content: Mobile Cards + Desktop Table */}
            <div className="bg-white md:rounded-[32px] border border-slate-100 md:shadow-xl md:shadow-slate-200/50 overflow-hidden">
                {loading && <div className="p-8 space-y-4"><div className="h-12 bg-slate-100 rounded-lg animate-pulse"></div><div className="h-12 bg-slate-100 rounded-lg animate-pulse"></div><div className="h-12 bg-slate-100 rounded-lg animate-pulse"></div></div>}

                {/* Mobile View: High-Density Cards */}
                <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                    {filteredInventory.map((item) => (
                        <ProductCard
                            key={item.id}
                            item={item}
                            onMovement={setSelectedMovementProduct}
                            onDetail={setSelectedDetailProduct}
                        />
                    ))}
                </div>

                {/* Desktop View: Executive Table */}
                <div className="hidden md:block">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence & Identity</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Catalog</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Inventory Health</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Valuation</th>
                                <th className="text-right py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Executive Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredInventory.map((item) => (
                                <tr key={item.id} className="group hover:bg-premium-blue-50/30 transition-all duration-200">
                                    <td className="py-5 px-8 cursor-pointer" onClick={() => setSelectedDetailProduct(item)}>
                                        <div className="font-black text-premium-blue-900 text-lg group-hover:text-premium-blue-700 transition-colors tracking-tight leading-tight">{item.name}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SKU: {item.sku}</div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200">{item.category}</span>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx("w-2.5 h-2.5 rounded-full ring-4 ring-offset-2",
                                                item.status === 'In Stock' ? 'bg-emerald-500 ring-emerald-50' :
                                                    item.status === 'Low Stock' ? 'bg-amber-500 ring-amber-50' : 'bg-red-500 ring-red-50'
                                            )}></div>
                                            <span className={clsx("text-sm font-black",
                                                item.status === 'Out of Stock' ? 'text-red-700' : 'text-slate-800'
                                            )}>
                                                {item.stock} Units
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 text-sm font-black text-premium-blue-900 italic tracking-tight">
                                        {item.price}
                                    </td>
                                    <td className="py-5 px-8 text-right">
                                        <button
                                            onClick={() => setSelectedMovementProduct(item)}
                                            className="text-[10px] font-black uppercase tracking-widest text-premium-blue-700 bg-premium-blue-50 px-5 py-2.5 rounded-xl hover:bg-premium-blue-100 border border-premium-blue-100 transition-all active:scale-95 shadow-sm"
                                        >
                                            Update Stock
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
