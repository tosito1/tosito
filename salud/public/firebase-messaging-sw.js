importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCLAB3IW4U6CcXiE_r9t_gkMPVpdFY16g4",
  authDomain: "tosito-7f923.firebaseapp.com",
  projectId: "tosito-7f923",
  storageBucket: "tosito-7f923.firebasestorage.app",
  messagingSenderId: "944852070557",
  appId: "1:944852070557:web:d289d5044471319377a474",
  measurementId: "G-QVVNR83HHT"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.jpg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
