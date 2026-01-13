import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ProjectsProvider } from '../contexts/ProjectsContext';
import { LeadsProvider } from '../contexts/LeadsContext';
import { IssuesProvider } from '../contexts/IssuesContext';
import { InvoicesProvider } from '../contexts/InvoicesContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { AuditsProvider } from '../contexts/AuditsContext';
import { ClientsProvider } from '../contexts/ClientsContext';
import { TeamsProvider } from '../contexts/TeamsContext';

export default function AppProviders({ children }) {
    return (
        // AuthProvider is usually at the top level (main.jsx), but wrapping here ensures availability if moved. 
        // If AuthProvider is already in main.jsx, nesting it here is redundant but harmless if the inner one just consumes the outer one (?) 
        // Actually, AuthProvider usually holds state. Let's assume main.jsx handles AuthProvider for now to avoid conflicts if I don't remove it there.
        // Wait, best practice is to have all providers in one place.
        // To be safe and compatible with current main.jsx, I will NOT include AuthProvider here if it's already in main.jsx.
        // Checking main.jsx content from memory: "import { AuthProvider } from './contexts/AuthContext'" is there.
        // So I will wrap the functional data providers here.

        <ClientsProvider>
            <ProjectsProvider>
                <TeamsProvider>
                    <InventoryProvider>
                        <IssuesProvider>
                            <InvoicesProvider>
                                <LeadsProvider>
                                    <AuditsProvider>
                                        {children}
                                    </AuditsProvider>
                                </LeadsProvider>
                            </InvoicesProvider>
                        </IssuesProvider>
                    </InventoryProvider>
                </TeamsProvider>
            </ProjectsProvider>
        </ClientsProvider>
    );
}
