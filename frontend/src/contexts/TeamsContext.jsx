import React, { createContext, useContext, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const TeamsContext = createContext();

export function useTeams() {
    const context = useContext(TeamsContext);
    if (!context) {
        throw new Error('useTeams must be used within a TeamsProvider');
    }
    return context;
}

export function TeamsProvider({ children }) {
    const { userProfile, loading: authLoading } = useAuth();
    const teamQuery = useMemo(() => [orderBy('name', 'asc')], []);
    const { data: rawMembers, loading, error } = useCollection('team_members', teamQuery);

    const teamMembers = useMemo(() => {
        if (!rawMembers) return [];
        const seenIds = new Set();
        const seenNames = new Set();
        return rawMembers.filter(m => {
            if (seenIds.has(m.id)) return false;
            // Also deduplicate by name + role for UI safety
            const nameKey = `${m.name?.toLowerCase()}-${m.role?.toLowerCase()}`;
            if (seenNames.has(nameKey)) return false;

            seenIds.add(m.id);
            seenNames.add(nameKey);
            return true;
        });
    }, [rawMembers]);

    // Check if user has write permissions (admin or super_admin only)
    const canWrite = useMemo(() => {
        if (authLoading || !userProfile) return false;
        const role = userProfile?.role;
        return role === 'admin' || role === 'super_admin';
    }, [userProfile?.role, authLoading]);

    // Get engineers only (for deployment scheduling)
    const engineers = useMemo(() => {
        if (!teamMembers) return [];
        return teamMembers.filter(m =>
            m.dept === 'Engineering' ||
            m.role?.toLowerCase().includes('engineer') ||
            m.role?.toLowerCase().includes('technician') ||
            m.role?.toLowerCase().includes('installer') ||
            m.role?.toLowerCase().includes('surveyor') ||
            m.role?.toLowerCase().includes('electrician')
        );
    }, [teamMembers]);

    // Get available engineers (not on assignment or leave)
    const getAvailableEngineers = (date = null) => {
        if (!engineers) return [];
        return engineers.filter(e =>
            e.availability === 'Available' ||
            !e.availability // Default to available if not set
        );
    };

    // Get engineers by skill
    const getEngineersBySkill = (skill) => {
        if (!engineers) return [];
        return engineers.filter(e =>
            e.skills?.includes(skill)
        );
    };

    const addMember = async (memberData) => {
        if (!canWrite) {
            console.error('Permission denied:', { authLoading, userProfile });
            toast.error('You do not have permission to add team members');
            return;
        }

        try {
            const newMember = {
                ...memberData,
                status: memberData.status || 'Active',
                availability: memberData.availability || 'Available',
                skills: memberData.skills || [],
                completedDeployments: 0,
                rating: 0,
                createdAt: serverTimestamp(),
                role: memberData.role || 'Staff'
            };

            console.log('Attempting to add member:', newMember);
            await addDoc(collection(db, 'team_members'), newMember);
            toast.success('Team member added successfully');
        } catch (err) {
            console.error("Error adding team member:", err);
            console.error("Error details:", {
                code: err.code,
                message: err.message,
                stack: err.stack
            });
            toast.error(`Failed to add team member: ${err.message || 'Unknown error'}`);
            throw err;
        }
    };

    const updateMember = async (id, updates) => {
        if (!canWrite) {
            toast.error('You do not have permission to update team members');
            return;
        }

        try {
            const docRef = doc(db, 'team_members', String(id));
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            toast.success('Team member updated');
        } catch (err) {
            console.error("Error updating team member:", err);
            toast.error("Failed to update team member");
        }
    };

    const removeMember = async (id) => {
        if (!canWrite) {
            toast.error('You do not have permission to remove team members');
            return;
        }

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

    // Update engineer availability
    const updateAvailability = async (engineerId, availability, deploymentId = null) => {
        if (!canWrite) {
            toast.error('You do not have permission to update availability');
            return;
        }

        try {
            const docRef = doc(db, 'team_members', String(engineerId));
            await updateDoc(docRef, {
                availability,
                currentDeploymentId: deploymentId,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error updating availability:", err);
        }
    };

    // Assign engineer to deployment
    const assignToDeployment = async (engineerId, deploymentId) => {
        await updateAvailability(engineerId, 'On Assignment', deploymentId);
    };

    // Release engineer from deployment
    const releaseFromDeployment = async (engineerId) => {
        await updateAvailability(engineerId, 'Available', null);
    };

    // Increment completed deployments count
    const incrementCompletedDeployments = async (engineerId) => {
        const member = getMemberById(engineerId);
        if (!member) return;

        try {
            const docRef = doc(db, 'team_members', String(engineerId));
            await updateDoc(docRef, {
                completedDeployments: (member.completedDeployments || 0) + 1,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error updating completed deployments:", err);
        }
    };

    // Stats for dashboard
    const stats = useMemo(() => {
        if (!engineers) return { available: 0, onAssignment: 0, onLeave: 0, total: 0 };

        return {
            total: engineers.length,
            available: engineers.filter(e => e.availability === 'Available' || !e.availability).length,
            onAssignment: engineers.filter(e => e.availability === 'On Assignment').length,
            onLeave: engineers.filter(e => e.availability === 'On Leave').length
        };
    }, [engineers]);

    return (
        <TeamsContext.Provider value={{
            teamMembers,
            engineers,
            loading,
            error,
            canWrite,
            stats,
            addMember,
            updateMember,
            removeMember,
            getMemberById,
            getAvailableEngineers,
            getEngineersBySkill,
            updateAvailability,
            assignToDeployment,
            releaseFromDeployment,
            incrementCompletedDeployments
        }}>
            {children}
        </TeamsContext.Provider>
    );
}
