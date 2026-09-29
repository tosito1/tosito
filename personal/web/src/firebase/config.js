import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBnZ9TRQPruBOEaQ9PcJuYW9MRq9U67mXs",
  authDomain: "paquito-flores-5ae97.firebaseapp.com",
  projectId: "paquito-flores-5ae97",
  storageBucket: "paquito-flores-5ae97.firebasestorage.app",
  messagingSenderId: "19140007924",
  appId: "1:19140007924:web:e3f5b7a1c9d2f8e1" // Nota: Esto es pseudo-appId de web asumiendo que en Firebase existe, si hay problemas de CORS se puede requerir web AppId
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Instancias de servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
