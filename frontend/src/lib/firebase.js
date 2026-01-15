import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, clearIndexedDbPersistence, terminate } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyA00JTJ733VGW69zZVMp4zyxylNEG2-wJQ",
    authDomain: "primistine-electric-crm.firebaseapp.com",
    projectId: "primistine-electric-crm",
    storageBucket: "primistine-electric-crm.firebasestorage.app",
    messagingSenderId: "312402796800",
    appId: "1:312402796800:web:ed8c51ec8ebb9dec2c93e5",
    measurementId: "G-26R1SLVG8W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Auto-clear corrupted IndexedDB cache on first load (prevents b815/ca9 errors)
const CACHE_CLEARED_KEY = 'firestore_cache_cleared_v1';
if (!sessionStorage.getItem(CACHE_CLEARED_KEY)) {
    terminate(db).then(() => {
        clearIndexedDbPersistence(db).then(() => {
            console.log('Firestore cache cleared successfully');
            sessionStorage.setItem(CACHE_CLEARED_KEY, 'true');
            window.location.reload();
        }).catch(err => {
            console.warn('Could not clear Firestore cache:', err.message);
            sessionStorage.setItem(CACHE_CLEARED_KEY, 'true');
        });
    }).catch(err => {
        console.warn('Could not terminate Firestore:', err.message);
        sessionStorage.setItem(CACHE_CLEARED_KEY, 'true');
    });
}

// Messaging (FCM)
let messaging;
try {
    messaging = getMessaging(app);
} catch (err) {
    console.warn("Firebase Messaging not supported (likely due to http/local env or missing config)");
}

export const requestForToken = async () => {
    if (!messaging) return null;
    try {
        const currentToken = await getToken(messaging, {
            vapidKey: 'BDFBy4MerQ6vLptv8E6R8nVGed2L2l0a-bWEWRnt-aHJooV55JC_3DoDOp8WndAlXqCihJY0Lh4qGXUQMCBvr40'
        });
        if (currentToken) {
            console.log('FCM Token:', currentToken);
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return;
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });

export { auth, db, storage, messaging };
