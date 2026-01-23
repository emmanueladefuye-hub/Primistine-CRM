import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { ref, onValue, set, onDisconnect, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, rtdb } from '../lib/firebase';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

// ⚠️ BOOTSTRAP MODE: Set to TRUE to allow the first admin to be created based on email
const BOOTSTRAP_MODE = false;
// ADD NEW FOUNDER EMAILS HERE
const FOUNDER_EMAILS = [
    'emmanueladefuye@gmail.com',
    'admin@primistine.com',
    'primistine.electric@gmail.com'
];

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [originalProfile, setOriginalProfile] = useState(null); // specific for simulation
    const [loading, setLoading] = useState(true);

    // ... getUserProfile ... 

    const simulateRole = async (roleId) => {
        if (!userProfile) return;

        if (!roleId) {
            // Restore original
            if (originalProfile) {
                setUserProfile(originalProfile);
                setOriginalProfile(null);
                toast.success("Exited simulation mode");
            }
            return;
        }

        // Check if allow (Must be super_admin OR already simulating and want to switch)
        // Note: If simulating 'sales_rep', userProfile.role is 'sales_rep', so hasRole('super_admin') fails.
        // We must check originalProfile?.role === 'super_admin' or (userProfile.role === 'super_admin' && !originalProfile)

        const canSimulate = (userProfile.role === 'super_admin') || (originalProfile?.role === 'super_admin');
        if (!canSimulate) {
            toast.error("Only Super Admins can simulate roles");
            return;
        }

        try {
            // Fetch generic role template first to ensure it exists before we commit to simulation
            const roleDoc = await getDoc(doc(db, 'roles', roleId));

            if (!roleDoc.exists()) {
                toast.error(`Role definition for "${roleId}" not found. Please click "Initialize Roles" in System Setup.`);
                return;
            }

            const newPermissions = roleDoc.data().permissions;

            // backup original if not already done
            if (!originalProfile) setOriginalProfile(userProfile);

            // Apply simulation
            setUserProfile(prev => ({
                ...prev,
                role: roleId,
                permissions: newPermissions,
                displayName: `[Sim] ${prev.displayName || 'User'}`,
                isSimulated: true
            }));

            toast.success(`Now simulating: ${roleId}`);
        } catch (e) {
            console.error("Simulation Error:", e);
            toast.error("Failed to switch role: " + e.message);
        }
    };

    // ... hasPermission logic ...
    // ensure hasPermission uses userProfile (which we are mutating via state), so it should just work.

    // (value definition moved to bottom)

    async function getUserProfile(firebaseUser) {
        if (!firebaseUser) return null;

        try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const data = userDoc.data();

                // MIGRATION / BOOTSTRAP FIX
                // Force upgrade for founder email even if they have a role
                if (FOUNDER_EMAILS.includes(firebaseUser.email) && data.role !== 'super_admin') {
                    console.log("Bootstrap: Force-upgrading founder to super_admin...");
                    const updateData = {
                        role: 'super_admin',
                        permissions: { "*": { view: "all", create: true, edit: "all", delete: true } },
                        lastLogin: new Date().toISOString()
                    };
                    await updateDoc(userRef, updateData);
                    return { ...data, ...updateData };
                }

                // Update last login
                await updateDoc(userRef, { lastLogin: new Date().toISOString() }).catch(err => console.warn("Failed to update lastLogin", err));
                return data;
            } else {
                // First-time user - Auto-create profile
                return await createUserProfile(firebaseUser);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            // Retry once after 1s if it was a transient error
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const retryDoc = await getDoc(userRef);
                if (retryDoc.exists()) return retryDoc.data();
            } catch (retryErr) {
                console.error("Profile fetch retry failed:", retryErr);
            }
            // Fallback for safety to prevent white screen, return basic profile
            return { uid: firebaseUser.uid, role: 'guest', permissions: {} };
        }
    }

    async function createUserProfile(firebaseUser) {
        console.log("Creating new user profile for:", firebaseUser.email);

        // BOOTSTRAP CHECK
        const isSuperAdmin = FOUNDER_EMAILS.includes(firebaseUser.email);
        const defaultRole = isSuperAdmin ? 'super_admin' : 'sales_rep';

        console.log(`Assigning role: ${defaultRole} (Bootstrap: ${isSuperAdmin})`);

        // Fetch role template if available
        let rolePermissions = {};
        try {
            // Updated to use root 'roles' collection
            const roleDoc = await getDoc(doc(db, 'roles', defaultRole));
            if (roleDoc.exists()) {
                rolePermissions = roleDoc.data().permissions;
            } else {
                console.warn(`Role template '${defaultRole}' not found. Using empty permissions.`);
                // Fallback hardcoded permissions for bootstrap super_admin so it actually works even if DB is empty
                if (defaultRole === 'super_admin') {
                    rolePermissions = { "*": { view: "all", create: true, edit: "all", delete: true } };
                }
            }
        } catch (e) {
            console.warn("Could not fetch role template", e);
        }

        const newProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            role: defaultRole,
            permissions: rolePermissions,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: isSuperAdmin ? 'system_bootstrap' : 'unknown'
        };

        try {
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            return newProfile;
        } catch (error) {
            console.error("Error creating user profile:", error);
            return newProfile; // Return partially formed profile to allow app to load
        }
    }

    function signup(email, password, displayName) {
        return createUserWithEmailAndPassword(auth, email, password)
            .then((result) => {
                // Update profile with display name immediately after signup
                return updateProfile(result.user, {
                    displayName: displayName
                });
            });
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    const hasRole = (roles) => {
        if (!userProfile) return false;
        // Allow string (single role) or array
        const allowed = Array.isArray(roles) ? roles : [roles];
        return allowed.includes(userProfile.role);
    };

    const hasPermission = (module, action) => checkPermission(userProfile, module, action);

    // Permission Checking Logic
    const checkPermission = (profile, module, action) => {
        if (!profile) return false;

        // Super admin bypass
        if (profile.role === 'super_admin') return true;

        // Check temp permissions first
        if (profile.tempPermissions && new Date(profile.tempPermissions.expiresAt) > new Date()) {
            const tempPerm = profile.tempPermissions.permissions?.[module]?.[action];
            if (tempPerm) return true;
        }

        // Handle specific "all" permission for super_admin fallback style
        if (profile.permissions?.["*"]?.view === "all") return true;

        // Check regular permissions
        // Optional Chaining is key here to avoid crashes
        const modulePerms = profile.permissions?.[module];
        if (!modulePerms) return false;

        const perm = modulePerms[action];

        if (typeof perm === 'boolean') return perm;
        if (perm === 'all') return true;

        // Scopes
        if (perm === 'own') return 'own';
        if (perm === 'assigned') return 'assigned';
        if (perm === 'team') return 'team';
        if (perm === 'read_only') return 'read_only';

        return false;
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            if (user) {
                setCurrentUser(user);
                try {
                    const profile = await getUserProfile(user);
                    setUserProfile(profile);
                } catch (err) {
                    console.error("AuthContext: Profile sync error", err);
                }

                // Presence Logic (RTDB)
                const userStatusRef = ref(rtdb, `/status/${user.uid}`);
                const isOfflineForDatabase = {
                    state: 'offline',
                    last_changed: rtdbTimestamp(),
                    email: user.email
                };
                const isOnlineForDatabase = {
                    state: 'online',
                    last_changed: rtdbTimestamp(),
                    email: user.email
                };

                const connectedRef = ref(rtdb, '.info/connected');
                onValue(connectedRef, (snapshot) => {
                    if (snapshot.val() === false) return;
                    onDisconnect(userStatusRef).set(isOfflineForDatabase).then(() => {
                        set(userStatusRef, isOnlineForDatabase);
                    });
                });
            } else {
                setCurrentUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn("AuthContext: Firebase auth listener timed out.");
                setLoading(false);
            }
        }, 5000);

        return () => {
            unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const value = {
        currentUser,
        userProfile,
        loading,
        hasRole,
        hasPermission,
        simulateRole,
        isSimulated: !!originalProfile,
        login,
        signup,
        logout
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-premium-blue-900 animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Initializing User Profile...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
