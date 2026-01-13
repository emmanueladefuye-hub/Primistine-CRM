import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Bell, Search, Menu, X, Eye } from 'lucide-react';
import clsx from 'clsx';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const isAuditWizard = location.pathname === '/audits/new' || location.pathname.match(/\/audits\/[^/]+\/edit/);
    const { containerRef, handleMouseMove, handleMouseLeave } = useAutoScroll();
    const { isSimulated, userProfile, simulateRole } = useAuth(); // Auth

    // Global focus management: Enter -> Next field or primary button
    const handleGlobalKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            const target = e.target;
            const isInput = target.tagName === 'INPUT' && !['checkbox', 'radio', 'submit'].includes(target.type);
            const isSelect = target.tagName === 'SELECT';

            if (isInput || isSelect) {
                e.preventDefault();

                // Find all potential focusable elements in the current page/form context
                const focusableSelector = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled]), button.bg-blue-600:not([disabled]), button.bg-premium-blue-900:not([disabled])';
                const focusables = Array.from(document.querySelectorAll(focusableSelector));
                const index = focusables.indexOf(target);

                if (index > -1) {
                    // Look for the next empty field or the submission button
                    let next = null;
                    for (let i = index + 1; i < focusables.length; i++) {
                        const el = focusables[i];
                        // If it's a button or an empty input/select, focus it
                        if (el.tagName === 'BUTTON' || (el.tagName === 'INPUT' && !el.value) || (el.tagName === 'SELECT' && !el.value)) {
                            next = el;
                            break;
                        }
                    }

                    if (next) {
                        next.focus();
                        if (next.tagName === 'INPUT') next.select();
                    } else if (index < focusables.length - 1) {
                        // Fallback: just go to the very next focusable if no "empty" ones found
                        focusables[index + 1].focus();
                    }
                }
            }
        }
    }, []);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsSidebarOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 relative">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-50 shrink-0">
                    <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <div id="app-header-portal" className="flex items-center gap-4 min-w-0"></div>
                    </div>

                    {/* Right Section: Search & Notifs */}
                    {!isAuditWizard && (
                        <div className="flex items-center gap-2 lg:gap-6">
                            <div className="hidden lg:flex items-center gap-4 w-64 xl:w-96">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100 border-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 lg:gap-4 lg:px-4 lg:border-l lg:border-slate-100">
                                <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                    <Bell size={20} />
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                </button>

                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-sm shrink-0">
                                    <img
                                        src="https://ui-avatars.com/api/?name=Admin+User&background=eff6ff&color=2563eb"
                                        alt="User"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* Simulation Banner */}
                {isSimulated && (
                    <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-between shadow-inner shrink-0 z-40">
                        <div className="flex items-center gap-2 text-amber-800 text-sm font-bold">
                            <Eye size={16} />
                            <span>Simulating Role: <span className="uppercase">{userProfile?.role}</span></span>
                        </div>
                        <button
                            onClick={() => simulateRole(null)}
                            className="px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded hover:bg-amber-50 text-xs font-bold transition-colors shadow-sm"
                        >
                            Exit Simulation
                        </button>
                    </div>
                )}

                {/* Main Content */}
                <main
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className={clsx(
                        "flex-1 overflow-auto no-scrollbar",
                        isAuditWizard ? "p-0" : "p-4 md:p-6 lg:p-8"
                    )}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
