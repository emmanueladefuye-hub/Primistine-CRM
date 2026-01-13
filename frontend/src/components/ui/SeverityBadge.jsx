import React from 'react';
import clsx from 'clsx';

const SEVERITY_STYLES = {
    Critical: "bg-red-100 text-red-700 border-red-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Low: "bg-green-100 text-green-700 border-green-200",
};

const SEVERITY_ICONS = {
    Critical: "🔴",
    High: "🟠",
    Medium: "🟡",
    Low: "🟢",
};

export default function SeverityBadge({ severity, className }) {
    const styles = SEVERITY_STYLES[severity] || "bg-gray-100 text-gray-700 border-gray-200";
    const icon = SEVERITY_ICONS[severity] || "⚪";

    return (
        <span className={clsx(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
            styles,
            className
        )}>
            <span className="text-[10px]">{icon}</span>
            {severity}
        </span>
    );
}
