import React, { createContext, useContext, useMemo } from 'react';
import { db } from '../lib/firebase';
import {
    collection, addDoc, updateDoc, deleteDoc, doc,
    orderBy, query, where, serverTimestamp
} from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const DeploymentsContext = createContext();

export function useDeployments() {
    const context = useContext(DeploymentsContext);
    if (!context) {
        throw new Error('useDeployments must be used within a DeploymentsProvider');
    }
    return context;
}

export function DeploymentsProvider({ children }) {
    const { currentUser, userProfile, loading: authLoading } = useAuth();

    // Subscribe to deployments collection, ordered by scheduled date
    const deploymentsQuery = useMemo(() => [orderBy('scheduledDate', 'asc')], []);
    const { data: deployments, loading, error } = useCollection('deployments', deploymentsQuery);

    // Check if user has write permissions (admin or super_admin only)
    const canWrite = useMemo(() => {
        if (authLoading || !userProfile) return false;
        const role = userProfile?.role;
        return role === 'admin' || role === 'super_admin';
    }, [userProfile?.role, authLoading]);

    /**
     * Create a new deployment
     */
    const createDeployment = async (deploymentData) => {
        if (!canWrite) {
            toast.error('You do not have permission to create deployments');
            return null;
        }

        try {
            const newDeployment = {
                ...deploymentData,
                status: deploymentData.status || 'Scheduled',
                priority: deploymentData.priority || 'Normal',
                createdBy: currentUser?.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'deployments'), newDeployment);
            toast.success('Deployment scheduled successfully');
            return docRef.id;
        } catch (err) {
            console.error('Error creating deployment:', err);
            toast.error('Failed to create deployment');
            throw err;
        }
    };

    /**
     * Update an existing deployment
     */
    const updateDeployment = async (id, updates) => {
        if (!canWrite) {
            toast.error('You do not have permission to edit deployments');
            return;
        }

        try {
            const docRef = doc(db, 'deployments', String(id));
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            toast.success('Deployment updated');
        } catch (err) {
            console.error('Error updating deployment:', err);
            toast.error('Failed to update deployment');
            throw err;
        }
    };

    /**
     * Cancel a deployment with reason
     */
    const cancelDeployment = async (id, reason = '') => {
        if (!canWrite) {
            toast.error('You do not have permission to cancel deployments');
            return;
        }

        try {
            const docRef = doc(db, 'deployments', String(id));
            await updateDoc(docRef, {
                status: 'Cancelled',
                cancellationReason: reason,
                updatedAt: serverTimestamp()
            });
            toast.success('Deployment cancelled');
        } catch (err) {
            console.error('Error cancelling deployment:', err);
            toast.error('Failed to cancel deployment');
            throw err;
        }
    };

    /**
     * Delete a deployment permanently
     */
    const deleteDeployment = async (id) => {
        if (!canWrite) {
            toast.error('You do not have permission to delete deployments');
            return;
        }

        try {
            const docRef = doc(db, 'deployments', String(id));
            await deleteDoc(docRef);
            toast.success('Deployment deleted');
        } catch (err) {
            console.error('Error deleting deployment:', err);
            toast.error('Failed to delete deployment');
            throw err;
        }
    };

    /**
     * Get deployments for a specific date
     */
    const getDeploymentsForDate = (date) => {
        if (!deployments) return [];
        const targetDate = new Date(date).toISOString().split('T')[0];
        return deployments.filter(d => {
            const deploymentDate = d.scheduledDate?.toDate?.()
                ? d.scheduledDate.toDate().toISOString().split('T')[0]
                : new Date(d.scheduledDate).toISOString().split('T')[0];
            return deploymentDate === targetDate;
        });
    };

    /**
     * Get deployments for a specific engineer
     */
    const getDeploymentsForEngineer = (engineerId) => {
        if (!deployments) return [];
        return deployments.filter(d =>
            d.leadEngineerId === engineerId ||
            d.assignedEngineers?.some(e => e.id === engineerId)
        );
    };

    /**
     * Get deployments for a specific project
     */
    const getDeploymentsForProject = (projectId) => {
        if (!deployments) return [];
        return deployments.filter(d => d.projectId === projectId);
    };

    /**
     * Check for scheduling conflicts
     */
    const checkConflicts = (engineerIds, date, excludeDeploymentId = null) => {
        const dateDeployments = getDeploymentsForDate(date);
        const conflicts = [];

        engineerIds.forEach(engineerId => {
            const existing = dateDeployments.find(d =>
                d.id !== excludeDeploymentId &&
                d.status !== 'Cancelled' &&
                (d.leadEngineerId === engineerId ||
                    d.assignedEngineers?.some(e => e.id === engineerId))
            );
            if (existing) {
                conflicts.push({ engineerId, existingDeployment: existing });
            }
        });

        return conflicts;
    };

    /**
     * Get deployment by ID
     */
    const getDeploymentById = (id) => {
        if (!deployments) return null;
        return deployments.find(d => d.id === id);
    };

    /**
     * Get deployments within a date range
     */
    const getDeploymentsInRange = (startDate, endDate) => {
        if (!deployments) return [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        return deployments.filter(d => {
            const deploymentDate = d.scheduledDate?.toDate?.()
                ? d.scheduledDate.toDate()
                : new Date(d.scheduledDate);
            return deploymentDate >= start && deploymentDate <= end;
        });
    };

    return (
        <DeploymentsContext.Provider value={{
            deployments,
            loading,
            error,
            canWrite,
            createDeployment,
            updateDeployment,
            cancelDeployment,
            deleteDeployment,
            getDeploymentsForDate,
            getDeploymentsForEngineer,
            getDeploymentsForProject,
            checkConflicts,
            getDeploymentById,
            getDeploymentsInRange
        }}>
            {children}
        </DeploymentsContext.Provider>
    );
}
