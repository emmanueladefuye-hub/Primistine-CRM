import React from 'react';
import clsx from 'clsx';

/**
 * PremiumButton - A standardized premium button with glassmorphism and animations.
 */
export const PremiumButton = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    className,
    disabled = false,
    icon: Icon,
    loading = false,
    ...props
}) => {
    const variants = {
        primary: "bg-premium-blue-900 text-premium-gold-400 hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 active:scale-95",
        secondary: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 active:scale-95",
        gold: "bg-gradient-to-tr from-premium-gold-600 to-premium-gold-400 text-premium-blue-900 font-bold hover:shadow-premium-gold-500/40 shadow-xl active:scale-95",
        ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
        danger: "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white active:scale-95"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-8 py-4 text-base font-semibold"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={clsx(
                "relative inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {/* Subtle light reflection sheen on hover */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                Icon && <Icon size={size === 'sm' ? 14 : 18} className="shrink-0 transition-transform group-hover:scale-110" />
            )}

            <span className="relative z-10">{children}</span>
        </button>
    );
};
