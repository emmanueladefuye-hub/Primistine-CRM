import { useAuth } from '../contexts/AuthContext';
import { usePaginatedCollection } from './usePaginatedCollection';
import { where, orderBy } from 'firebase/firestore';

// Mapping of collections to their ownership/assignment fields (Same as useScopedCollection)
const FIELD_MAP = {
    leads: {
        own: 'createdBy',
        assigned: 'assignedTo',
        team: 'teamId'
    },
    projects: {
        own: 'managerId',
        assigned: 'team', // Array of UIDs
        team: 'teamId'
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
    messages: {
        own: 'senderId',
        assigned: 'participants',
        team: 'teamId'
    }
};

/**
 * Wrapper around usePaginatedCollection that applies RBAC scopes automatically.
 * @param {string} collectionName 
 * @param {Array} baseConstraints 
 * @param {number} pageSize
 */
export function useScopedPagination(collectionName, baseConstraints = [], pageSize = 20) {
    const { userProfile, loading } = useAuth();

    // 1. Loading State
    if (loading) {
        return { data: [], loading: true, error: null, hasMore: false, loadMore: () => { } };
    }

    // 2. Auth Check
    if (!userProfile) {
        return { data: [], loading: false, error: "Authentication required", hasMore: false, loadMore: () => { } };
    }

    // 3. Get Permission Scope
    const permissions = userProfile.permissions || {};
    const resourcePerms = permissions[collectionName] || permissions['*'];

    // Access Denied
    if (!resourcePerms || resourcePerms.view === false) {
        return { data: [], loading: false, error: "Access Denied", hasMore: false, loadMore: () => { } };
    }

    const scope = resourcePerms.view;
    let scopeConstraints = [];

    // 4. Build Scoped Constraints
    if (scope === 'all' || scope === true) {
        // No filter
    } else if (scope === 'own') {
        const field = FIELD_MAP[collectionName]?.own || 'createdBy';
        scopeConstraints.push(where(field, '==', userProfile.uid));
    } else if (scope === 'team') {
        const field = FIELD_MAP[collectionName]?.team || 'teamId';
        const userTeamId = userProfile.teamId || 'no_team_assigned';
        scopeConstraints.push(where(field, '==', userTeamId));
    } else if (scope === 'assigned') {
        const field = FIELD_MAP[collectionName]?.assigned || 'assignedTo';
        if (collectionName === 'projects' || collectionName === 'messages') {
            scopeConstraints.push(where(field, 'array-contains', userProfile.uid));
        } else {
            scopeConstraints.push(where(field, '==', userProfile.uid));
        }
    } else {
        return { data: [], loading: false, error: "Invalid Scope", hasMore: false, loadMore: () => { } };
    }

    // 5. Combine Constraints
    // Important: Firestore requires order-by fields to be in the filter or specifically indexed.
    // If baseConstraints has an 'orderBy', we must ensure it's compatible with 'where' clauses.
    // userPaginatedCollection handles the actual query construction.
    const allConstraints = [...scopeConstraints, ...baseConstraints];

    return usePaginatedCollection(collectionName, allConstraints, pageSize);
}
