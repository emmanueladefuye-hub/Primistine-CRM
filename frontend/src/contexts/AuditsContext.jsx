import React, { createContext, useContext } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useScopedCollection } from '../hooks/useScopedCollection';
import { toast } from 'react-hot-toast';


const AuditsContext = createContext();

export function useAudits() {
    const context = useContext(AuditsContext);
    if (!context) {
        throw new Error('useAudits must be used within an AuditsProvider');
    }
    return context;
}

export function AuditsProvider({ children }) {
    // Subscribe to site_audits collection
    const auditsQuery = React.useMemo(() => [orderBy('createdAt', 'desc')], []);
    const { data: audits, loading, error } = useScopedCollection('site_audits', auditsQuery);

    const addAudit = async (auditData) => {
        try {
            const docRef = await addDoc(collection(db, 'site_audits'), {
                ...auditData,
                createdAt: new Date().toISOString(),
                status: 'Draft'
            });
            toast.success('Audit created successfully');
            return docRef.id;
        } catch (err) {
            console.error('Error adding audit:', err);
            toast.error('Failed to create audit');
            throw err;
        }
    };

    const updateAudit = async (id, updates) => {
        try {
            const docRef = doc(db, 'site_audits', String(id));
            await updateDoc(docRef, updates);
            toast.success('Audit updated');
        } catch (err) {
            console.error('Error updating audit:', err);
            toast.error('Failed to update audit');
            throw err;
        }
    };

    const deleteAudit = async (id) => {
        try {
            const docRef = doc(db, 'site_audits', String(id));
            await deleteDoc(docRef);
            toast.success('Audit deleted');
        } catch (err) {
            console.error('Error deleting audit:', err);
            toast.error('Failed to delete audit');
            throw err;
        }
    };

    const completeAudit = async (id) => {
        try {
            await updateAudit(id, {
                status: 'Completed',
                completedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error completing audit:', err);
            // Toast handled in updateAudit
        }
    };

    const getAuditById = (id) => {
        if (!audits) return null;
        return audits.find(a => String(a.id) === String(id));
    };

    const resetAudits = () => {
        toast.error("Cannot reset live database to mocks.");
    };

    return (
        <AuditsContext.Provider value={{
            audits, loading, error,
            addAudit, updateAudit, deleteAudit,
            completeAudit, getAuditById, resetAudits
        }}>
            {children}
        </AuditsContext.Provider>
    );
}
