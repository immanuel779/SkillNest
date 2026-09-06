importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBrZFw0drXzLEMoGHrgFVkfxrkjTYE6PPQ",
  projectId: "skillnest-da917",
  messagingSenderId: "951615766032",
  appId: "1:951615766032:web:9d07730fe8de50a1ce5495"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/skillnest-icon.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});