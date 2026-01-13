import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../lib/nav-links';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import primistineLogo from '../assets/primistine-logo.png';

export default function Sidebar({ isOpen, onClose }) {
    const { currentUser, hasPermission } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const scrollContainerRef = useRef(null);
    const scrollIntervalRef = useRef(null);
    const sidebarRef = useRef(null);

    // Auto-scroll logic
    const handleMouseMove = (e) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { top, bottom, height } = container.getBoundingClientRect();
        const clientY = e.clientY;
        const threshold = 50; // proximity to edge
        const scrollSpeed = 10;

        clearInterval(scrollIntervalRef.current);

        if (clientY < top + threshold) {
            // Scroll Up
            scrollIntervalRef.current = setInterval(() => {
                container.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
            }, 16);
        } else if (clientY > bottom - threshold) {
            // Scroll Down
            scrollIntervalRef.current = setInterval(() => {
                container.scrollBy({ top: scrollSpeed, behavior: 'auto' });
            }, 16);
        }
    };

    const handleMouseLeave = () => {
        clearInterval(scrollIntervalRef.current);
    };

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            <div
                className={clsx(
                    "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <div
                className={clsx(
                    "fixed inset-y-0 left-0 bg-premium-blue-900 text-white flex flex-col border-r border-premium-blue-800 transition-all duration-300 z-[70] lg:relative lg:translate-x-0 group",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Collapse Toggle Button - Desktop Only */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-10 w-6 h-6 bg-premium-gold-500 rounded-full hidden lg:flex items-center justify-center text-premium-blue-900 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:scale-110"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Branding */}
                <div className={clsx("p-6 flex items-center gap-3", isCollapsed && "lg:justify-center lg:px-2")}>
                    <img src={primistineLogo} alt="Primistine Electric" className="w-10 h-10 rounded-lg shrink-0" />
                    <div className={clsx(
                        "font-bold text-xl tracking-tight overflow-hidden whitespace-nowrap transition-all",
                        isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
                    )}>
                        PRIMISTINE
                        <span className="block text-xs text-premium-gold-400 font-normal tracking-widest uppercase">Electric Limited</span>
                    </div>
                </div>

                {/* Navigation with Auto-Scroll */}
                <div
                    ref={scrollContainerRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="flex-1 overflow-y-auto no-scrollbar py-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>

                    {NAV_LINKS.map((group, idx) => {
                        // Filter items based on permissions
                        const visibleItems = group.items.filter(item =>
                            !item.permission ||
                            (currentUser.role === 'super_admin') ||
                            hasPermission(item.permission.resource, item.permission.action)
                        );

                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={idx} className={clsx("mb-6", isCollapsed ? "lg:px-2" : "px-4")}>
                                {(!isCollapsed || isOpen) && (
                                    <h3 className="text-xs uppercase text-premium-blue-500 font-semibold mb-2 px-2 whitespace-nowrap">
                                        {group.category}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {visibleItems.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => window.innerWidth < 1024 && onClose()}
                                            title={isCollapsed ? item.name : ''}
                                            className={({ isActive }) => clsx(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-premium-blue-800 text-premium-gold-400 shadow-sm"
                                                    : "text-slate-400 hover:bg-premium-blue-800/50 hover:text-white",
                                                isCollapsed && "lg:justify-center lg:px-0"
                                            )}
                                        >
                                            <item.icon size={20} className="shrink-0" />
                                            <span className={clsx(
                                                "whitespace-nowrap transition-all duration-300",
                                                isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
                                            )}>
                                                {item.name}
                                            </span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* User Mini Profile */}
                <div className={clsx("p-4 bg-premium-blue-950 border-t border-premium-blue-800 mt-auto overflow-hidden", isCollapsed && "lg:justify-center")}>
                    <div className={clsx("flex items-center gap-3", isCollapsed && "lg:justify-center")}>
                        <div className="w-8 h-8 rounded-full bg-premium-gold-500/20 text-premium-gold-500 flex items-center justify-center font-bold border border-premium-gold-500/30 shrink-0">
                            {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <div className={clsx(
                            "overflow-hidden transition-all duration-300",
                            isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
                        )}>
                            <p className="text-sm font-medium text-white truncate w-40" title={currentUser?.displayName || 'User'}>
                                {currentUser?.displayName || currentUser?.email || 'User'}
                            </p>
                            <p className="text-xs text-slate-400">Online</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
