import React, { createContext, useContext } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import { toast } from 'react-hot-toast';

const InvoicesContext = createContext();

export function useInvoices() {
    const context = useContext(InvoicesContext);
    if (!context) {
        throw new Error('useInvoices must be used within an InvoicesProvider');
    }
    return context;
}

export function InvoicesProvider({ children }) {
    const invoicesQuery = React.useMemo(() => [orderBy('date', 'desc')], []);
    const { data: invoices, loading, error } = useCollection('invoices', invoicesQuery);

    const addInvoice = async (invoiceData) => {
        try {
            // Generate a simple ID or let Firestore do it. 
            // For invoices, a readable ID is nice, but we can store it as a field 'invoiceNumber'
            const newInvoice = {
                ...invoiceData,
                status: invoiceData.status || 'Pending',
                createdAt: serverTimestamp(),
                date: invoiceData.date || new Date().toISOString().split('T')[0]
            };

            const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
            toast.success('Invoice created successfully');
            return docRef.id;
        } catch (err) {
            console.error("Error adding invoice:", err);
            toast.error("Failed to create invoice");
            throw err;
        }
    };

    const updateInvoice = async (id, updates) => {
        try {
            const docRef = doc(db, 'invoices', String(id));
            await updateDoc(docRef, updates);
            toast.success('Invoice updated');
        } catch (err) {
            console.error("Error updating invoice:", err);
            toast.error("Failed to update invoice");
            throw err;
        }
    };

    const deleteInvoice = async (id) => {
        try {
            const docRef = doc(db, 'invoices', String(id));
            await deleteDoc(docRef);
            toast.success('Invoice deleted');
        } catch (err) {
            console.error("Error deleting invoice:", err);
            toast.error("Failed to delete invoice");
        }
    };

    const markAsPaid = async (id) => {
        try {
            await updateInvoice(id, {
                status: 'Paid',
                paidDate: serverTimestamp()
            });
        } catch (err) {
            // Error handled in updateInvoice
        }
    };

    const getInvoiceById = (id) => {
        if (!invoices) return null;
        return invoices.find(inv => inv.id === id);
    };

    return (
        <InvoicesContext.Provider value={{
            invoices, loading, error,
            addInvoice, updateInvoice, deleteInvoice, markAsPaid, getInvoiceById
        }}>
            {children}
        </InvoicesContext.Provider>
    );
}
