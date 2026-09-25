// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// Update these config values with your Firebase project configuration
firebase.initializeApp({
  apiKey: "AIzaSyDPbjxSXDwu3nCGP3rQebXyibFLKfFeWZw",
  authDomain: "outletmangement.firebaseapp.com",
  projectId: "outletmangement",
  storageBucket: "outletmangement.firebasestorage.app",
  messagingSenderId: "541834788565",
  appId: "1:541834788565:web:a1b2a77febd139f9aa6c5c"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
