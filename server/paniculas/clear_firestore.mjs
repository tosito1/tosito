import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDbnSZZgGJu_twtwTI0FRo-h2yfAdcPAY0",
  authDomain: "paniculas-de3de.firebaseapp.com",
  projectId: "paniculas-de3de",
  storageBucket: "paniculas-de3de.firebasestorage.app",
  messagingSenderId: "918643232192",
  appId: "1:918643232192:web:bea6b3a0233c914040cc25"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = 'paniculas-v3';

async function clearMovies() {
  console.log("Iniciando borrado de la colección movies...");
  const moviesRef = collection(db, 'artifacts', appId, 'movies');
  const snap = await getDocs(moviesRef);
  
  if (snap.empty) {
    console.log("No hay películas para borrar.");
    process.exit(0);
  }

  let count = 0;
  for (const document of snap.docs) {
    await deleteDoc(doc(db, 'artifacts', appId, 'movies', document.id));
    count++;
  }
  
  console.log(`✅ ${count} películas borradas correctamente.`);
  process.exit(0);
}

clearMovies().catch(console.error);
