// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
    apiKey: "AIzaSyA00JTJ733VGW69zZVMp4zyxylNEG2-wJQ",
    authDomain: "primistine-electric-crm.firebaseapp.com",
    projectId: "primistine-electric-crm",
    storageBucket: "primistine-electric-crm.firebasestorage.app",
    messagingSenderId: "312402796800",
    appId: "1:312402796800:web:ed8c51ec8ebb9dec2c93e5"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png' // Ensure this exists or use distinct icon
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
