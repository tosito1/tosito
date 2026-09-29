import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDbnSZZgGJu_twtwTI0FRo-h2yfAdcPAY0",
  authDomain: "paniculas-de3de.firebaseapp.com",
  projectId: "paniculas-de3de",
  storageBucket: "paniculas-de3de.firebasestorage.app",
  messagingSenderId: "918643232192",
  appId: "1:918643232192:web:bea6b3a0233c914040cc25",
  measurementId: "G-ME208QVQN3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = 'paniculas-v3';

const newMovies = [
  {
    id: "torrente-presidente",
    title: "Torrente Presidente",
    year: 2026,
    description: "José Luis Torrente vuelve metido de lleno en la política española, arrastrando su habitual mezcla de vulgaridad, oportunismo e ineptitud.",
    image: "https://series.ly/storage/posters/torrente-presidente.jpg",
    type: "movie",
    genre: "Comedia"
  },
  {
    id: "noche-de-bodas-2",
    title: "Noche de bodas 2",
    year: 2026,
    description: "Grace descubre que ha alcanzado el siguiente nivel del juego tras sobrevivir al ataque de la familia Le Domas.",
    image: "https://series.ly/storage/posters/noche-de-bodas-2.jpg",
    type: "movie",
    genre: "Terror"
  },
  {
    id: "el-cataclismo",
    title: "El Cataclismo (Restart the Earth)",
    year: 2021,
    description: "Para combatir la desertificación, los humanos desarrollan fármacos para la reproducción acelerada de células vegetales.",
    image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7v66n3uD4m8L4zE8vO0vO4H8vO4.jpg",
    type: "movie",
    genre: "Ciencia Ficción"
  },
  {
    id: "creatures",
    title: "Creatures",
    year: 2021,
    description: "Un grupo de estudiantes de astronomía encuentran a un extraterrestre herido en el campo.",
    image: "https://series.ly/storage/posters/creatures.jpg",
    type: "movie",
    genre: "Terror"
  },
  {
    id: "gorilas-attenborough",
    title: "Gorilas por David Attenborough",
    year: 2026,
    description: "El naturalista David Attenborough narra la historia de un grupo de gorilas, desde su primer encuentro con ellos en los años setenta.",
    image: "https://series.ly/storage/posters/a-gorilla-story-told-by-david-attenborough.jpg",
    type: "movie",
    genre: "Documental"
  }
];

async function seed() {
  console.log("Iniciando carga de metadatos en Firebase...");
  for (const movie of newMovies) {
    await setDoc(doc(db, 'artifacts', appId, 'movies', movie.id), movie);
    console.log(`✅ Añadido: ${movie.title}`);
  }
  console.log("¡Proceso completado con éxito!");
  process.exit(0);
}

seed().catch(console.error);
