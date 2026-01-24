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
    } else if (scope === 'own' && userProfile.uid) {
        const field = FIELD_MAP[collectionName]?.own || 'createdBy';
        scopeConstraints.push(where(field, '==', userProfile.uid));
    } else if (scope === 'team' && userProfile.teamId) {
        const field = FIELD_MAP[collectionName]?.team || 'teamId';
        scopeConstraints.push(where(field, '==', userProfile.teamId));
    } else if (scope === 'assigned' && userProfile.uid) {
        const field = FIELD_MAP[collectionName]?.assigned || 'assignedTo';

        if ((collectionName === 'projects' && field === 'team') || (collectionName === 'messages' && field === 'participants')) {
            scopeConstraints.push(where(field, 'array-contains', userProfile.uid));
        } else {
            scopeConstraints.push(where(field, '==', userProfile.uid));
        }
    } else if (scope !== 'all' && scope !== true) {
        // If we expected a specific scope but don't have the ID, defer or return no access
        return { data: [], loading: false, error: "Missing required profile ID for scope", accessDenied: true };
    }

    // 3. Call Hook
    return useCollection(collectionName, [...baseConstraints, ...scopeConstraints]);
}
