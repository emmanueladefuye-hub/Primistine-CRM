import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, UserPlus, MessageSquarePlus, FilePlus, Zap, LayoutDashboard, Database, Briefcase, Settings } from 'lucide-react';
import { NAV_LINKS } from '../../lib/nav-links';
import clsx from 'clsx';

/**
 * Global Command Palette
 * Triggered by Cmd/Ctrl + K
 */
export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Flatten Nav Links for searching
    const navActions = NAV_LINKS.flatMap(group =>
        group.items.map(item => ({
            id: `nav-${item.path}`,
            name: item.name,
            icon: item.icon,
            category: group.category,
            action: () => navigate(item.path)
        }))
    );

    const quickActions = [
        { id: 'action-lead', name: 'Create New Lead', icon: UserPlus, category: 'Quick Actions', action: () => navigate('/sales?openAddModal=true') },
        { id: 'action-msg', name: 'Send System Message', icon: MessageSquarePlus, category: 'Quick Actions', action: () => navigate('/inbox?newChat=true') },
        { id: 'action-audit', name: 'Initiate Site Audit', icon: FilePlus, category: 'Quick Actions', action: () => navigate('/audits') },
    ];

    const allItems = [...navActions, ...quickActions];

    const filteredItems = search === ''
        ? allItems.slice(0, 8) // Show recent/common when empty
        : allItems.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.category.toLowerCase().includes(search.toLowerCase())
        );

    const togglePalette = useCallback(() => setIsOpen(prev => !prev), []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                togglePalette();
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePalette]);

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isOpen]);

    const handleSelect = (item) => {
        item.action();
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        } else if (e.key === 'Enter') {
            if (filteredItems[selectedIndex]) {
                handleSelect(filteredItems[selectedIndex]);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: -20 }}
                        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
                        onKeyDown={handleKeyDown}
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-4 py-4 border-b border-slate-100">
                            <Search className="text-slate-400 mr-3" size={20} />
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search leads, projects, or apps... (try 'sales')"
                                className="flex-1 bg-transparent border-none outline-none text-slate-900 text-lg placeholder:text-slate-400"
                            />
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                                <span className="text-[12px]">⎋</span> Esc
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto p-2 scroll-smooth">
                            {filteredItems.length === 0 ? (
                                <div className="py-12 px-4 text-center">
                                    <Zap className="mx-auto text-slate-300 mb-3" size={40} />
                                    <p className="text-slate-500 font-medium">No results found for "{search}"</p>
                                    <p className="text-slate-400 text-sm mt-1">Try searching for 'projects' or 'inbox'</p>
                                </div>
                            ) : (
                                filteredItems.map((item, index) => {
                                    const Icon = item.icon || Command;
                                    const isSelected = index === selectedIndex;

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={clsx(
                                                "group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200",
                                                isSelected ? "bg-premium-blue-50 text-premium-blue-900 shadow-sm" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={clsx(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                                    isSelected ? "bg-premium-blue-900 text-premium-gold-400" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{item.name}</p>
                                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{item.category}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ x: -10, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    className="flex items-center gap-2 text-xs font-bold text-premium-blue-500"
                                                >
                                                    <span>Open</span>
                                                    <ArrowRight size={14} />
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                    <span className="p-1 bg-white border border-slate-200 rounded text-[10px]">↑↓</span>
                                    <span>Navigate</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                    <span className="p-1 bg-white border border-slate-200 rounded text-[10px]">↵</span>
                                    <span>Select</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                <Command size={12} />
                                <span>Powered by Primistine Intelligence</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
