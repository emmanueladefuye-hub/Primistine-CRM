import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

export default function Toast({ message, type = 'error', onClose, duration = 3000 }) {
    useEffect(() => {
        if (message && duration) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border outline-none"
                >
                    <div className={clsx(
                        "absolute inset-0 rounded-xl opacity-95",
                        type === 'error' && "bg-red-50 border-red-200",
                        type === 'success' && "bg-green-50 border-green-200",
                        type === 'info' && "bg-blue-50 border-blue-200"
                    )} />

                    <div className="relative z-10 flex items-center gap-3">
                        {type === 'error' && <AlertCircle className="text-red-500" size={20} />}
                        {type === 'success' && <CheckCircle2 className="text-green-500" size={20} />}
                        {type === 'info' && <Info className="text-blue-500" size={20} />}

                        <span className={clsx(
                            "font-medium text-sm",
                            type === 'error' && "text-red-700",
                            type === 'success' && "text-green-700",
                            type === 'info' && "text-blue-700"
                        )}>
                            {message}
                        </span>

                        <button
                            onClick={onClose}
                            className={clsx(
                                "ml-2 p-1 rounded-full hover:bg-black/5 transition-colors",
                                type === 'error' && "text-red-400 hover:text-red-600",
                                type === 'success' && "text-green-400 hover:text-green-600",
                                type === 'info' && "text-blue-400 hover:text-blue-600"
                            )}
                        >
                            <X size={14} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
