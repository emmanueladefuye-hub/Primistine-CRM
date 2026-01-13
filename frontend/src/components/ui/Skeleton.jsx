import React from 'react';
import clsx from 'clsx';

export default function Skeleton({ className, variant = 'text', count = 1 }) {
    const baseClasses = "animate-pulse bg-slate-200 rounded";

    const variants = {
        text: "h-4 w-3/4",
        circular: "rounded-full",
        rectangular: "h-full w-full",
        card: "h-64 w-full rounded-xl"
    };

    const elements = Array(count).fill(0).map((_, index) => (
        <div
            key={index}
            className={clsx(
                baseClasses,
                variants[variant],
                className,
                count > 1 && "mb-2" // Add margin between multiple skeletons
            )}
        />
    ));

    return <>{elements}</>;
}
