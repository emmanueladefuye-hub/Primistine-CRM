import React, { createContext, useContext } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import { toast } from 'react-hot-toast';

const TeamsContext = createContext();

export function useTeams() {
    const context = useContext(TeamsContext);
    if (!context) {
        throw new Error('useTeams must be used within a TeamsProvider');
    }
    return context;
}

export function TeamsProvider({ children }) {
    const teamQuery = React.useMemo(() => [orderBy('name', 'asc')], []);
    const { data: teamMembers, loading, error } = useCollection('team_members', teamQuery);

    const addMember = async (memberData) => {
        try {
            const newMember = {
                ...memberData,
                status: memberData.status || 'Active',
                createdAt: serverTimestamp(),
                role: memberData.role || 'Staff'
            };

            await addDoc(collection(db, 'team_members'), newMember);
            toast.success('Team member added successfully');
        } catch (err) {
            console.error("Error adding team member:", err);
            toast.error("Failed to add team member");
            throw err;
        }
    };

    const updateMember = async (id, updates) => {
        try {
            const docRef = doc(db, 'team_members', String(id));
            await updateDoc(docRef, updates);
            toast.success('Team member updated');
        } catch (err) {
            console.error("Error updating team member:", err);
            toast.error("Failed to update team member");
        }
    };

    const removeMember = async (id) => {
        try {
            const docRef = doc(db, 'team_members', String(id));
            await deleteDoc(docRef);
            toast.success('Team member removed');
        } catch (err) {
            console.error("Error removing team member:", err);
            toast.error("Failed to remove team member");
        }
    };

    const getMemberById = (id) => {
        if (!teamMembers) return null;
        return teamMembers.find(m => m.id === id);
    };

    return (
        <TeamsContext.Provider value={{
            teamMembers, loading, error,
            addMember, updateMember, removeMember, getMemberById
        }}>
            {children}
        </TeamsContext.Provider>
    );
}
