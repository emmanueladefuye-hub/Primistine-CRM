import React, { createContext, useContext } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, orderBy, runTransaction, serverTimestamp } from 'firebase/firestore';
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
            const docData = {
                ...newItem,
                stock: Number(newItem.stock) || 0,
                reorderPoint: Number(newItem.reorderPoint) || 10,
                status: (Number(newItem.stock) || 0) <= 0 ? 'Out of Stock' : (Number(newItem.stock) || 0) < (Number(newItem.reorderPoint) || 10) ? 'Low Stock' : 'In Stock',
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'inventory'), docData);
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

    const updateStock = async (id, adjustment, metadata = {}) => {
        try {
            const docRef = doc(db, 'inventory', String(id));

            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) {
                    throw new Error("Product does not exist!");
                }

                const data = docSnap.data();
                const currentStock = Number(data.stock) || 0;
                const newStock = currentStock + adjustment;
                const reorderPoint = Number(data.reorderPoint) || 10;

                let status = 'In Stock';
                if (newStock <= 0) status = 'Out of Stock';
                else if (newStock < reorderPoint) status = 'Low Stock';

                transaction.update(docRef, {
                    stock: newStock,
                    status,
                    updatedAt: serverTimestamp()
                });

                // Log movement in a sub-collection
                const movementRef = doc(collection(docRef, 'movements'));
                transaction.set(movementRef, {
                    type: adjustment > 0 ? 'in' : 'out',
                    quantity: Math.abs(adjustment),
                    previousStock: currentStock,
                    newStock: newStock,
                    timestamp: serverTimestamp(),
                    ...metadata
                });
            });

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

    /**
     * Deduct material from inventory for a project.
     * This is called when a material is marked as "Installed" in a project.
     * @param {string} inventoryId - The ID of the inventory item
     * @param {number} quantity - The quantity to deduct
     * @param {string} projectId - The project ID for tracking
     * @param {string} projectName - The project name for logging
     */
    const deductForProject = async (inventoryId, quantity, projectId, projectName) => {
        if (!inventoryId || !quantity) return;

        try {
            await updateStock(inventoryId, -Math.abs(quantity), {
                reason: 'Project Material Usage',
                projectId,
                projectName,
                user: 'System'
            });
            return true;
        } catch (err) {
            console.error('Failed to deduct from inventory:', err);
            return false;
        }
    };

    /**
     * Restore material to inventory (for returns or cancelled usage).
     */
    const restoreFromProject = async (inventoryId, quantity, projectId, projectName) => {
        if (!inventoryId || !quantity) return;

        try {
            await updateStock(inventoryId, Math.abs(quantity), {
                reason: 'Project Material Return',
                projectId,
                projectName,
                user: 'System'
            });
            return true;
        } catch (err) {
            console.error('Failed to restore inventory:', err);
            return false;
        }
    };

    // 4. Inventory Valuation (Sum of price * stock)
    const totalInventoryValue = inventory ? inventory.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.stock || 0)), 0) : 0;
    const totalInventoryDisplay = `₦${(totalInventoryValue / 1000000).toFixed(2)}M`;

    const getItemById = (id) => {
        if (!inventory) return null;
        return inventory.find(item => String(item.id) === String(id));
    };

    const resetInventory = () => {
        toast.error("Cannot reset live database to mocks.");
    };

    return (
        <InventoryContext.Provider value={{
            inventory, loading, error,
            addItem, updateItem, updateStock,
            getItemById, deleteItem, resetInventory,
            deductForProject, restoreFromProject,
            totalInventoryValue, totalInventoryDisplay
        }}>
            {children}
        </InventoryContext.Provider>
    );
}
