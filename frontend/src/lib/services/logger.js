import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Premium Logging Service
 * Captures application info and errors for diagnostic purposes.
 */
class Logger {
    constructor() {
        this.collectionRef = collection(db, 'logs');
    }

    /**
     * Log an informative event
     */
    async info(message, context = {}) {
        console.info(`[LOG:INFO] ${message}`, context);
        return this._persist('info', message, context);
    }

    /**
     * Log a warning
     */
    async warn(message, context = {}) {
        console.warn(`[LOG:WARN] ${message}`, context);
        return this._persist('warning', message, context);
    }

    /**
     * Log a critical error
     */
    async error(message, error = null, context = {}) {
        console.error(`[LOG:ERROR] ${message}`, error, context);

        const errorDetails = error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code // Firebase specific
        } : null;

        return this._persist('error', message, { ...context, error: errorDetails });
    }

    /**
     * Internal persistence to Firestore
     */
    async _persist(level, message, context) {
        try {
            // We use a try-catch here to prevent logging failures from crashing the app
            await addDoc(this.collectionRef, {
                level,
                message,
                context,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        } catch (err) {
            // Silently fail if Firestore logging fails to avoid recursive error loops
            console.warn("Logger: Failed to persist log to Firestore", err);
        }
    }
}

export const logger = new Logger();
