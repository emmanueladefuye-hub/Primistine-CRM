import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
    icon: Icon = Inbox,
    title = "No data found",
    description = "There are no items to display at the moment.",
    action,
    className
}) {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
            <div className="w-20 h-20 bg-slate-100/50 text-slate-300 rounded-[24px] flex items-center justify-center mb-6 ring-4 ring-slate-50">
                <Icon size={36} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-premium-blue-900 tracking-tight mb-2">{title}</h3>
            <p className="text-slate-500 text-sm max-w-[280px] leading-relaxed mb-8">{description}</p>
            {action && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                    {action}
                </div>
            )}
        </div>
    );
}
