import React, { createContext, useContext, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useScopedCollection } from '../hooks/useScopedCollection';
import { toast } from 'react-hot-toast';

const ProjectsContext = createContext();

export function useProjects() {
    const context = useContext(ProjectsContext);
    if (!context) {
        throw new Error('useProjects must be used within a ProjectsProvider');
    }
    return context;
}

export function ProjectsProvider({ children }) {
    // Subscribe to projects collection, ordered by creation time
    const projectsQuery = React.useMemo(() => [orderBy('createdAt', 'desc')], []);
    const { data: projects, loading, error } = useScopedCollection('projects', projectsQuery);

    const addProject = async (newProject) => {
        try {
            await addDoc(collection(db, 'projects'), newProject);
            toast.success('Project created successfully');
        } catch (err) {
            console.error('Error adding project:', err);
            toast.error('Failed to create project');
            throw err;
        }
    };

    const updateProject = async (id, updates) => {
        try {
            const docRef = doc(db, 'projects', String(id));
            await updateDoc(docRef, updates);
            toast.success('Project updated');
        } catch (err) {
            console.error('Error updating project:', err);
            toast.error('Failed to update project');
            throw err;
        }
    };

    const deleteProject = async (id) => {
        try {
            const docRef = doc(db, 'projects', String(id));
            await deleteDoc(docRef);
            toast.success('Project deleted');
        } catch (err) {
            console.error('Error deleting project:', err);
            toast.error('Failed to delete project');
            throw err;
        }
    };

    // Helper to find a project in the currently loaded list
    const getProjectById = (id) => {
        if (!projects) return null;
        return projects.find(project => String(project.id) === String(id));
    };

    // Mock reset not needed for Firestore in this context, but keeping function signature to avoid breaking callers immediately
    const resetProjects = () => {
        toast.error("Cannot reset live database to mocks.");
    };

    const refreshProjects = () => {
        // useCollection handles live updates, so this is mostly no-op or re-trigger if needed
        // For now, we leave it empty as Firestore is real-time
    };

    const value = {
        projects,
        loading,
        error,
        addProject,
        updateProject,
        deleteProject,
        getProjectById,
        resetProjects,
        refreshProjects
    };

    return (
        <ProjectsContext.Provider value={value}>
            {children}
        </ProjectsContext.Provider>
    );
}
