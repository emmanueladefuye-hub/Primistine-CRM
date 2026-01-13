import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

const IssuesContext = createContext();

export function useIssues() {
    return useContext(IssuesContext);
}

export function IssuesProvider({ children }) {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'project_issues'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const issueData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setIssues(issueData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching issues:", error);
            toast.error("Failed to load operational issues.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
