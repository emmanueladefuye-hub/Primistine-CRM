import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { enableIndexedDbPersistence } from 'firebase/firestore';
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

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence not supported');
    }
});

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
