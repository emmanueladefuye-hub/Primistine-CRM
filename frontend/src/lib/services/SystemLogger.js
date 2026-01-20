import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const LOG_ACTIONS = {
    AUDIT_SUBMITTED: 'AUDIT_SUBMITTED',
    AUDIT_UPDATED: 'AUDIT_UPDATED',
    PROJECT_CREATED: 'PROJECT_CREATED',
    PROJECT_UPDATED: 'PROJECT_UPDATED',
    LEAD_CREATED: 'LEAD_CREATED',
    LEAD_UPDATED: 'LEAD_UPDATED',
    LEAD_CONVERTED: 'LEAD_CONVERTED',
    CLIENT_CREATED: 'CLIENT_CREATED',
    CLIENT_UPDATED: 'CLIENT_UPDATED',
    SYSTEM_ERROR: 'SYSTEM_ERROR'
};

export const SystemLogger = {
    /**
     * Log a system action
     * @param {string} action - One of LOG_ACTIONS
     * @param {string} message - Human readable description
     * @param {object} metadata - { userId, userName, resourceId, resourceType, etc. }
     */
    log: async (action, message, metadata = {}) => {
        try {
            await addDoc(collection(db, 'logs'), {
                action,
                message,
                metadata,
                timestamp: serverTimestamp(),
                level: action === 'SYSTEM_ERROR' ? 'error' : 'info'
            });
            console.log(`[SystemLog] ${action}: ${message}`);
        } catch (error) {
            console.error("Failed to write system log:", error);
            // Non-blocking: don't throw, just warn
        }
    }
};
