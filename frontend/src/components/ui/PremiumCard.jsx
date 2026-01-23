import React from 'react';
import clsx from 'clsx';

/**
 * PremiumCard - A standardized premium card with glassmorphism and subtle elevation.
 */
export const PremiumCard = ({
    children,
    className,
    hoverable = false,
    variant = 'glass',
    padding = 'md',
    ...props
}) => {
    const variants = {
        glass: "bg-white/70 backdrop-blur-md border border-white/20 shadow-xl shadow-slate-200/40",
        solid: "bg-white border border-slate-200 shadow-sm",
        dark: "bg-premium-blue-900 border border-premium-blue-800 text-white shadow-2xl",
    };

    const paddings = {
        none: "p-0",
        sm: "p-3",
        md: "p-6",
        lg: "p-10"
    };

    return (
        <div
            className={clsx(
                "rounded-2xl transition-all duration-300",
                variants[variant],
                paddings[padding],
                hoverable && "hover:-translate-y-1 hover:shadow-2xl hover:shadow-premium-blue-500/10 cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
