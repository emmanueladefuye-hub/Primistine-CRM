import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyAme8Gn_2HXfAT14vTSfX4WcU_N-lIzUNs",
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

// Set Persistence to LOCAL (survives browser close)
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Auth persistence error:", error);
    });

// Initialize Firestore with robust settings (CRM-wide Fix)
const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
});

const rtdb = getDatabase(app);
const storage = getStorage(app);

// Note: Cache clearing logic removed as it terminated the Firestore instance
// and caused blank screens. If IndexedDB issues occur, users should manually
// clear browser storage or use DevTools Application > Clear Storage.

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

export { auth, db, rtdb, storage, messaging };
