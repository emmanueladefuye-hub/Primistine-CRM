import React from 'react';
import clsx from 'clsx';
import { Camera } from 'lucide-react';

/**
 * Reusable Section Container for Audit Reviews
 */
export const ReviewSection = ({ title, children, className }) => (
    <div className={clsx("bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-6", className)}>
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-premium-blue-900">{title}</h3>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

/**
 * Display a key-value pair row
 */
export const ReviewField = ({ label, value, className }) => (
    <div className={clsx("flex justify-between border-b border-slate-50 pb-2 mb-2 last:border-0", className)}>
        <span className="text-slate-500 text-sm font-medium">{label}:</span>
        <span className="text-slate-900 font-medium text-right">{value || <span className="text-slate-300 italic">Not provided</span>}</span>
    </div>
);

/**
 * Display a simple data table
 */
export const ReviewTable = ({ data, columns, emptyMessage = "No items added." }) => (
    <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                    {columns.map((col, idx) => (
                        <th key={idx} className="px-4 py-3 border-b border-slate-100">{col}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {data && data.length > 0 ? (
                    data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                            {Object.values(row).map((cell, cellIdx) => (
                                <td key={cellIdx} className="px-4 py-3 text-slate-700">{cell}</td>
                            ))}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400 italic">
                            {emptyMessage}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

/**
 * Display a grid of photos
 */
export const ReviewPhotos = ({ photos, title }) => (
    <div className="mt-4">
        {title && <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Camera size={16} /> {title}</h4>}

        {photos && photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {photos.map((photo, idx) => (
                    <div key={idx} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        {/* Handle both string URLs and object objects if needed */}
                        <img
                            src={typeof photo === 'string' ? photo : photo.url}
                            alt={photo.description || `Photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {(photo.description) && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                                {photo.description}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        ) : (
            <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400 text-sm">
                No photos uploaded for this section.
            </div>
        )}
    </div>
);
