import { useAuth } from '../contexts/AuthContext';
import { useCollection } from './useFirestore';
import { where } from 'firebase/firestore';

// Mapping of collections to their ownership/assignment fields
const FIELD_MAP = {
    leads: {
        own: 'createdBy',
        assigned: 'assignedTo', // or teamId
        team: 'teamId'
    },
    projects: {
        own: 'managerId',
        assigned: 'team', // Array of UIDs
        team: 'teamId' // If projects belong to a team unit
    },
    audits: {
        own: 'auditorId',
        assigned: 'auditorId',
        team: 'teamId'
    },
    quotes: {
        own: 'createdBy',
        team: 'teamId'
    },
    issues: {
        own: 'reportedBy',
        assigned: 'assignedTo',
        team: 'teamId'
    },
    project_issues: {
        own: 'reportedBy',
        assigned: 'assignedTo',
        team: 'teamId'
    },
    messages: {
        own: 'senderId',
        assigned: 'participants',
        team: 'teamId'
    }
};

/**
 * Wrapper around useCollection that applies RBAC scopes automatically.
 * @param {string} collectionName 
 * @param {Array} baseConstraints 
 */
export function useScopedCollection(collectionName, baseConstraints = []) {
    const { userProfile, loading } = useAuth();

    // If auth is loading, we can't determine scope yet, so return loading state or defer
    // Ideally useCollection handles empty query graciously?
    // We'll return a "loading" state shim if auth is loading.

    if (loading) {
        return { data: [], loading: true, error: null };
    }

    if (!userProfile) {
        return { data: [], loading: false, error: "Authentication required" };
    }

    // 1. Get Permission Scope
    const permissions = userProfile.permissions || {};
    // Check for exact resource match first, then fall back to wildcard
    const resourcePerms = permissions[collectionName] || permissions['*'];

    // If explicit boolean false (or missing), access denied
    if (!resourcePerms || resourcePerms.view === false) {
        // Return empty result strictly
        // We simulate a query that returns nothing
        // Or we could just return empty [] immediately without hitting Firestore
        // Returning empty array directly saves reads.
        return { data: [], loading: false, error: null, accessDenied: true };
    }

    const scope = resourcePerms.view; // "all", "own", "team", "assigned", or true (treat as all)

    // 2. Build Constraints
    let scopeConstraints = [];

    if (scope === 'all' || scope === true) {
        // No extra filters needed
    } else if (scope === 'own') {
        const field = FIELD_MAP[collectionName]?.own || 'createdBy';
        scopeConstraints.push(where(field, '==', userProfile.uid));
    } else if (scope === 'team') {
        const field = FIELD_MAP[collectionName]?.team || 'teamId';
        // If user has no team, they see nothing (or maybe 'unassigned'?)
        // Safer to show nothing.
        const userTeamId = userProfile.teamId || 'no_team_assigned';
        scopeConstraints.push(where(field, '==', userTeamId));
    } else if (scope === 'assigned') {
        const field = FIELD_MAP[collectionName]?.assigned || 'assignedTo';

        // Check if the field is array type in schema (Projects used 'team' array)
        if ((collectionName === 'projects' && field === 'team') || (collectionName === 'messages' && field === 'participants')) {
            scopeConstraints.push(where(field, 'array-contains', userProfile.uid));
        } else {
            // Default assumes single value match, unless we know it's array
            // Ideally we need schema knowledge. 
            // For now, let's assume 'assignedTo' is single UID for Audits, array for others?
            // User plan: "Audits: Assigned". Usually assigned to 1 auditor.
            scopeConstraints.push(where(field, '==', userProfile.uid));
        }
    } else {
        // Unknown scope string? Block access.
        return { data: [], loading: false, error: "Invalid permission scope", accessDenied: true };
    }

    // 3. Call Hook
    return useCollection(collectionName, [...baseConstraints, ...scopeConstraints]);
}
