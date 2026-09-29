const fs = require('fs');
const path = require('path');

const imdbMovies = [
  {"title": "Cadena perpetua", "year": "1994", "rating": "9.3", "id": "tt0111161"},
  {"title": "El padrino", "year": "1972", "rating": "9.2", "id": "tt0068646"},
  {"title": "El caballero oscuro", "year": "2008", "rating": "9.1", "id": "tt0468569"},
  {"title": "El padrino parte II", "year": "1974", "rating": "9.0", "id": "tt0071562"},
  {"title": "12 hombres sin piedad", "year": "1957", "rating": "9.0", "id": "tt0050083"},
  {"title": "El señor de los anillos: El retorno del rey", "year": "2003", "rating": "9.0", "id": "tt0167260"},
  {"title": "La lista de Schindler", "year": "1993", "rating": "9.0", "id": "tt0108052"},
  {"title": "El señor de los anillos: La comunidad del anillo", "year": "2001", "rating": "8.9", "id": "tt0120737"},
  {"title": "Pulp Fiction", "year": "1994", "rating": "8.9", "id": "tt0110912"},
  {"title": "El bueno, el feo y el malo", "year": "1966", "rating": "8.8", "id": "tt0060196"},
  {"title": "El señor de los anillos: Las dos torres", "year": "2002", "rating": "8.8", "id": "tt0167261"},
  {"title": "Forrest Gump", "year": "1994", "rating": "8.8", "id": "tt0109830"},
  {"title": "El club de la lucha", "year": "1999", "rating": "8.8", "id": "tt0137523"},
  {"title": "Origen", "year": "2010", "rating": "8.8", "id": "tt1375666"},
  {"title": "El imperio contraataca", "year": "1980", "rating": "8.7", "id": "tt0080684"},
  {"title": "Matrix", "year": "1999", "rating": "8.7", "id": "tt0133093"},
  {"title": "Uno de los nuestros", "year": "1990", "rating": "8.7", "id": "tt0099685"},
  {"title": "Interstellar", "year": "2014", "rating": "8.7", "id": "tt0816692"},
  {"title": "Alguien voló sobre el nido del cuco", "year": "1975", "rating": "8.7", "id": "tt0073486"},
  {"title": "Seven", "year": "1995", "rating": "8.6", "id": "tt0114369"},
  {"title": "Qué bello es vivir", "year": "1946", "rating": "8.6", "id": "tt0038650"},
  {"title": "El silencio de los corderos", "year": "1991", "rating": "8.6", "id": "tt0102926"},
  {"title": "Los siete samuráis", "year": "1954", "rating": "8.6", "id": "tt0047478"},
  {"title": "Salvar al soldado Ryan", "year": "1998", "rating": "8.6", "id": "tt0120815"},
  {"title": "La milla verde", "year": "1999", "rating": "8.6", "id": "tt0120689"},
  {"title": "Ciudad de Dios", "year": "2002", "rating": "8.6", "id": "tt0317248"},
  {"title": "La vida es bella", "year": "1997", "rating": "8.6", "id": "tt0119698"},
  {"title": "Terminator 2: El juicio final", "year": "1991", "rating": "8.6", "id": "tt0103064"},
  {"title": "Regreso al futuro", "year": "1985", "rating": "8.5", "id": "tt0088763"},
  {"title": "La guerra de las galaxias", "year": "1977", "rating": "8.6", "id": "tt0076759"},
  {"title": "El viaje de Chihiro", "year": "2001", "rating": "8.6", "id": "tt0245429"},
  {"title": "El pianista", "year": "2002", "rating": "8.5", "id": "tt0253474"},
  {"title": "Gladiator (El gladiador)", "year": "2000", "rating": "8.5", "id": "tt0172495"},
  {"title": "Parásitos", "year": "2019", "rating": "8.5", "id": "tt6751668"},
  {"title": "La tumba de las luciérnagas", "year": "1988", "rating": "8.5", "id": "tt0095327"},
  {"title": "Kill Bill: The Whole Bloody Affair", "year": "2011", "rating": "8.8", "id": "tt6019206"},
  {"title": "Psicosis", "year": "1960", "rating": "8.5", "id": "tt0054215"},
  {"title": "El rey león", "year": "1994", "rating": "8.5", "id": "tt0110357"},
  {"title": "Harakiri", "year": "1962", "rating": "8.6", "id": "tt0056058"},
  {"title": "Infiltrados", "year": "2006", "rating": "8.5", "id": "tt0407887"},
  {"title": "Whiplash", "year": "2014", "rating": "8.5", "id": "tt2582802"},
  {"title": "El truco final (El prestigio)", "year": "2006", "rating": "8.5", "id": "tt0482571"},
  {"title": "American History X", "year": "1998", "rating": "8.5", "id": "tt0120586"},
  {"title": "El profesional (Léon)", "year": "1994", "rating": "8.5", "id": "tt0110413"},
  {"title": "Spider-Man: Cruzando el multiverso", "year": "2023", "rating": "8.6", "id": "tt13975146"},
  {"title": "Cinema Paradiso", "year": "1988", "rating": "8.5", "id": "tt0095765"},
  {"title": "Casablanca", "year": "1942", "rating": "8.5", "id": "tt0034583"},
  {"title": "Intocable", "year": "2011", "rating": "8.5", "id": "tt1675434"},
  {"title": "Sospechosos habituales", "year": "1995", "rating": "8.5", "id": "tt0114814"},
  {"title": "Django desencadenado", "year": "2012", "rating": "8.5", "id": "tt1853728"}
];

const formattedMovies = imdbMovies.map(m => ({
    id: m.id,
    title: m.title,
    year: parseInt(m.year),
    description: `Una de las 50 mejores películas de la historia según IMDb, con una puntuación de ${m.rating}/10.`,
    image: `https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg`, // Placeholder high quality poster
    type: 'movie',
    genre: 'Clásico',
    rating: m.rating,
    sources: []
}));

const scrapedPath = path.join(__dirname, 'src', 'scraped_data.json');
fs.writeFileSync(scrapedPath, JSON.stringify(formattedMovies, null, 2));

console.log(`✅ Guardadas ${formattedMovies.length} películas en src/scraped_data.json`);

// Also create the Firebase seed script
const seedCode = `
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

const movies = ${JSON.stringify(formattedMovies, null, 2)};

async function seed() {
  console.log("🚀 Subiendo 50 películas principales a Firebase...");
  for (const movie of movies) {
    await setDoc(doc(db, 'artifacts', appId, 'movies', movie.id), movie);
    console.log(\`✅ \${movie.title}\`);
  }
  console.log("✨ ¡Carga completada!");
  process.exit(0);
}

seed().catch(console.error);
`;

fs.writeFileSync(path.join(__dirname, 'seed_imdb_top.cjs'), seedCode);
process.exit(0);
