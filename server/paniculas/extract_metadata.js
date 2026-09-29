const fs = require('fs');
const path = require('path');

async function extractMovies() {
    const filePath = path.join(__dirname, 'pagina peliculas');
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract the JSON object from window.postsListInitialData
    const regex = /window\.postsListInitialData\s*=\s*({[\s\S]*?});/;
    const match = content.match(regex);

    if (!match) {
        console.error("No se encontró window.postsListInitialData en el archivo.");
        return;
    }

    try {
        const data = JSON.parse(match[1]);
        const movies = data.posts.map(post => ({
            id: post.slug,
            title: post.title,
            year: parseInt(post.item_date.split('-')[0]) || 2024,
            description: post.description,
            image: post.poster,
            type: post.type,
            genre: post.genres && post.genres.length > 0 ? post.genres[0].name : "Cine",
            sources: [] // Links will be added manually by the user
        }));

        console.log(`Extraídas ${movies.length} películas.`);

        // Read existing scraped_data.json
        const scrapedPath = path.join(__dirname, 'src', 'scraped_data.json');
        let existingData = [];
        if (fs.existsSync(scrapedPath)) {
            existingData = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
        }

        // Merge data, avoiding duplicates by id
        const mergedData = [...existingData];
        movies.forEach(movie => {
            if (!mergedData.find(m => m.id === movie.id)) {
                mergedData.push(movie);
            }
        });

        fs.writeFileSync(scrapedPath, JSON.stringify(mergedData, null, 2));
        console.log(`Actualizado src/scraped_data.json con un total de ${mergedData.length} películas.`);

        // Also update seed_metadata.js or create a new one
        const seedCode = `
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = ${JSON.stringify({
            apiKey: "AIzaSyDbnSZZgGJu_twtwTI0FRo-h2yfAdcPAY0",
            authDomain: "paniculas-de3de.firebaseapp.com",
            projectId: "paniculas-de3de",
            storageBucket: "paniculas-de3de.firebasestorage.app",
            messagingSenderId: "918643232192",
            appId: "1:918643232192:web:bea6b3a0233c914040cc25",
            measurementId: "G-ME208QVQN3"
        }, null, 2)};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = 'paniculas-v3';

const movies = ${JSON.stringify(movies, null, 2)};

async function seed() {
  console.log("Cargando ${movies.length} nuevas películas en Firebase...");
  for (const movie of movies) {
    await setDoc(doc(db, 'artifacts', appId, 'movies', movie.id), movie, { merge: true });
    console.log(\`✅ \${movie.title}\`);
  }
  console.log("¡Carga completada!");
  process.exit(0);
}

seed().catch(console.error);
`;
        fs.writeFileSync(path.join(__dirname, 'seed_batch.js'), seedCode);
        console.log("Creado seed_batch.js para subir a Firebase.");

    } catch (e) {
        console.error("Error al procesar el JSON:", e);
    }
}

extractMovies();
