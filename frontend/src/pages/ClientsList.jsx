import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, MapPin, Phone, Mail, Building, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import { useClients } from '../contexts/ClientsContext';

import CreateClientModal from '../components/CreateClientModal';

export default function ClientsList() {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { clients, loading } = useClients();

    const filteredClients = (clients || []).filter(c => {
        const matchesType = filter === 'all' || c.type.toLowerCase() === filter.toLowerCase();

        if (!searchTerm) return matchesType;

        const term = searchTerm.toLowerCase();
        const matchesSearch =
            (c.name || '').toLowerCase().includes(term) ||
            (c.email || '').toLowerCase().includes(term) ||
            (c.phone || '').includes(term) ||
            (c.contact || '').toLowerCase().includes(term) ||
            (c.location || '').toLowerCase().includes(term);

        return matchesType && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <CreateClientModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-premium-blue-900 tracking-tight">Client Directory</h1>
                    <p className="text-slate-500 font-medium">Manage your customer relationships and profiles.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full sm:w-auto bg-premium-blue-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                >
                    + Add New Client
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100 lg:pl-4 gap-4">
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 pr-2">
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-premium-gold-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients, email, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-premium-gold-400/50 text-sm font-medium transition-all"
                        />
                    </div>
                </div>

                <div className="flex bg-slate-100/50 p-1.5 rounded-xl gap-1 overflow-x-auto no-scrollbar">
                    {['all', 'corporate', 'individual'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={clsx(
                                "flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-bold capitalize transition-all min-w-max",
                                filter === type ? "bg-white text-premium-blue-900 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && (
                    <>
                        <div className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
                        <div className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
                        <div className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
                    </>
                )}

                {!loading && filteredClients.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <User size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-bold">No clients found.</p>
                        <p className="text-sm">Add a new client to get started.</p>
                    </div>
                )}

                {!loading && filteredClients.map((client) => (
                    <Link to={`/clients/${client.id}`} key={client.id} className="block group">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-premium-blue-200 h-full flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className={clsx("w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold",
                                    client.type === 'Corporate' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                                )}>
                                    {client.type === 'Corporate' ? <Building size={24} /> : <User size={24} />}
                                </div>
                                <div className={clsx("px-2 py-1 rounded-md text-xs font-bold",
                                    client.status === 'Active' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                                )}>
                                    {client.status}
                                </div>
                            </div>

                            <div className="mb-4 flex-1">
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-premium-blue-700 transition-colors mb-1">{client.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <MapPin size={12} /> {client.location}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-slate-400" />
                                    <span>{client.contact}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-slate-400" />
                                    <span>{client.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-slate-400" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
