import React from 'react';
import clsx from 'clsx';

/**
 * PremiumInput - A standardized premium input with high-end focus states.
 */
export const PremiumInput = ({
    label,
    error,
    icon: Icon,
    className,
    type = 'text',
    ...props
}) => {
    return (
        <div className={clsx("w-full space-y-1.5", className)}>
            {label && (
                <label className="block text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-premium-blue-500 transition-colors pointer-events-none">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    type={type}
                    className={clsx(
                        "w-full bg-white/50 backdrop-blur-sm border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 transition-all outline-none",
                        "hover:border-slate-300 focus:border-premium-blue-500 focus:bg-white focus:shadow-lg focus:shadow-premium-blue-500/10",
                        Icon && "pl-11",
                        error && "border-red-500 focus:border-red-500 focus:shadow-red-500/10"
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 ml-1 font-medium animate-pop">{error}</p>
            )}
        </div>
    );
};
