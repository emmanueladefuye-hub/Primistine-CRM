import React, { createContext, useContext } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useScopedCollection } from '../hooks/useScopedCollection';
import { toast } from 'react-hot-toast';

const IssuesContext = createContext();

export function useIssues() {
    return useContext(IssuesContext);
}

export function IssuesProvider({ children }) {
    const issuesQuery = React.useMemo(() => [orderBy('createdAt', 'desc')], []);
    const { data: issues, loading, error } = useScopedCollection('project_issues', issuesQuery);

    const addIssue = async (issueData) => {
        try {
            const docRef = await addDoc(collection(db, 'project_issues'), {
                ...issueData,
                status: 'Open', // Default status
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            toast.success('Issue reported successfully');
            return { id: docRef.id, ...issueData };
        } catch (error) {
            console.error("Error adding issue:", error);
            toast.error('Failed to report issue');
            throw error;
        }
    };

    const updateIssue = async (id, updates) => {
        try {
            const docRef = doc(db, 'project_issues', id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            toast.success('Issue updated');
        } catch (error) {
            console.error("Error updating issue:", error);
            toast.error('Failed to update issue');
            throw error;
        }
    };

    const deleteIssue = async (id) => {
        try {
            await deleteDoc(doc(db, 'project_issues', id));
            toast.success('Issue deleted');
        } catch (error) {
            console.error("Error deleting issue:", error);
            toast.error('Failed to delete issue');
            throw error;
        }
    };

    const updateIssueStatus = async (id, newStatus) => {
        return updateIssue(id, { status: newStatus });
    };

    const value = {
        issues,
        loading,
        addIssue,
        updateIssue,
        deleteIssue,
        updateIssueStatus
    };

    return (
        <IssuesContext.Provider value={value}>
            {children}
        </IssuesContext.Provider>
    );
}
