import { useAuth } from '../contexts/AuthContext';

export function usePermission() {
    const { userProfile, hasPermission, hasRole } = useAuth();

    // Helper helper to get numeric level if needed
    const getRoleLevel = (role) => {
        const levels = {
            super_admin: 5,
            admin: 4,
            manager: 3,
            finance: 3,
            sales_rep: 2,
            engineer: 2,
            inventory: 2,
            auditor: 1,
            viewer: 0
        };
        return levels[role] || 0;
    };

    return {
        role: userProfile?.role,
        level: getRoleLevel(userProfile?.role),

        // Core check function
        can: (module, action) => hasPermission(module, action),

        // Alias for code readability
        canScope: (module, action) => hasPermission(module, action),

        // Boolean Role Checks
        isSuperAdmin: () => userProfile?.role === 'super_admin',
        isAdmin: () => ['super_admin', 'admin'].includes(userProfile?.role),
        isManager: () => ['super_admin', 'admin', 'manager'].includes(userProfile?.role),
        isEngineer: () => userProfile?.role === 'engineer',
        isSales: () => userProfile?.role === 'sales_rep',

        // Common Action Helpers
        canView: (module) => hasPermission(module, 'view'),
        canCreate: (module) => hasPermission(module, 'create'),
        canEdit: (module) => hasPermission(module, 'edit'),
        canDelete: (module) => hasPermission(module, 'delete'),
        canApprove: (module) => hasPermission(module, 'approve'),

        // Feature Flags (based on granular permissions)
        canSeeAllData: () => hasRole(['super_admin', 'admin']),
        canSeeCosts: () => hasPermission('costs', 'view') || userProfile?.permissions?.viewCosts === true,
        canExport: () => userProfile?.permissions?.exportData === true,

        // Data Filtering
        userProfile // Expose profile for component-level filtering logic
    };
}
