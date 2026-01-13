import React, { createContext, useContext } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import { toast } from 'react-hot-toast';

const InventoryContext = createContext();

export function useInventory() {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventory must be used within a InventoryProvider');
    }
    return context;
}

export function InventoryProvider({ children }) {
    // Subscribe to inventory collection
    const inventoryQuery = React.useMemo(() => [orderBy('name')], []);
    const { data: inventory, loading, error } = useCollection('inventory', inventoryQuery);

    const addItem = async (newItem) => {
        try {
            await addDoc(collection(db, 'inventory'), newItem);
            toast.success('Product added to inventory');
        } catch (err) {
            console.error('Error adding item:', err);
            toast.error('Failed to add item');
            throw err;
        }
    };

    const updateItem = async (id, updates) => {
        try {
            const docRef = doc(db, 'inventory', String(id));
            await updateDoc(docRef, updates);
            toast.success('Inventory updated');
        } catch (err) {
            console.error('Error updating item:', err);
            toast.error('Failed to update item');
            throw err;
        }
    };

    const updateStock = async (id, adjustment) => {
        try {
            const item = inventory.find(i => String(i.id) === String(id));
            if (!item) throw new Error('Item not found');

            const newStock = (item.stock || 0) + adjustment;
            const status = newStock <= 0 ? 'Out of Stock' : newStock < 10 ? 'Low Stock' : 'In Stock';

            const docRef = doc(db, 'inventory', String(id));
            await updateDoc(docRef, { stock: newStock, status });
            toast.success('Stock level updated');
        } catch (err) {
            console.error('Error updating stock:', err);
            toast.error('Failed to update stock');
        }
    };

    const deleteItem = async (id) => {
        try {
            const docRef = doc(db, 'inventory', String(id));
            await deleteDoc(docRef);
            toast.success('Item removed from inventory');
        } catch (err) {
            console.error('Error deleting item:', err);
            toast.error('Failed to delete item');
            throw err;
        }
    };

    const getItemById = (id) => {
        if (!inventory) return null;
        return inventory.find(item => String(item.id) === String(id));
    };

    const resetInventory = () => {
        toast.error("Cannot reset live database to mocks.");
    };

    return (
        <InventoryContext.Provider value={{ inventory, loading, error, addItem, updateItem, updateStock, getItemById, deleteItem, resetInventory }}>
            {children}
        </InventoryContext.Provider>
    );
}
