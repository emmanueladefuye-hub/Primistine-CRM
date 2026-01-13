import React, { createContext, useContext } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import { toast } from 'react-hot-toast';

const ClientsContext = createContext();

export function useClients() {
    const context = useContext(ClientsContext);
    if (!context) {
        throw new Error('useClients must be used within a ClientsProvider');
    }
    return context;
}

export function ClientsProvider({ children }) {
    // Subscribe to clients collection
    const clientsQuery = React.useMemo(() => [orderBy('name')], []);
    const { data: clients, loading, error } = useCollection('clients', clientsQuery);

    const addClient = async (newClient) => {
        try {
            await addDoc(collection(db, 'clients'), newClient);
            toast.success('Client added successfully');
        } catch (err) {
            console.error('Error adding client:', err);
            toast.error('Failed to add client');
            throw err;
        }
    };

    const updateClient = async (id, updates) => {
        try {
            const docRef = doc(db, 'clients', String(id));
            await updateDoc(docRef, updates);
            toast.success('Client updated');
        } catch (err) {
            console.error('Error updating client:', err);
            toast.error('Failed to update client');
            throw err;
        }
    };

    const deleteClient = async (id) => {
        try {
            const docRef = doc(db, 'clients', String(id));
            await deleteDoc(docRef);
            toast.success('Client deleted');
        } catch (err) {
            console.error('Error deleting client:', err);
            toast.error('Failed to delete client');
            throw err;
        }
    };

    const getClientById = (id) => {
        if (!clients) return null;
        return clients.find(client => String(client.id) === String(id));
    };

    const resetClients = () => {
        toast.error("Cannot reset live database to mocks.");
    };

    return (
        <ClientsContext.Provider value={{ clients, loading, error, addClient, updateClient, getClientById, deleteClient, resetClients }}>
            {children}
        </ClientsContext.Provider>
    );
}
