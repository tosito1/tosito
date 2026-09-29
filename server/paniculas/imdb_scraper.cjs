const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeIMDb() {
    console.log('🚀 Iniciando scraper de IMDb...');
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // User agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    const urls = [
        'https://www.imdb.com/chart/top/',
        'https://www.imdb.com/chart/moviemeter/'
    ];

    let allMovies = [];

    for (const url of urls) {
        console.log(`🌐 Navegando a ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Scrape the movies
        const movies = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.ipc-metadata-list-summary-item'));
            return items.map(item => {
                try {
                    const titleEl = item.querySelector('.ipc-title__text');
                    const title = titleEl ? titleEl.innerText.replace(/^\d+\.\s+/, '') : '';
                    
                    const metadataItems = Array.from(item.querySelectorAll('.cli-title-metadata li'));
                    const yearText = metadataItems.length > 0 ? metadataItems[0].innerText : '2024';
                    const year = parseInt(yearText.match(/\d{4}/) ? yearText.match(/\d{4}/)[0] : '2024');
                    
                    const ratingEl = item.querySelector('.ipc-rating-star--rating') || item.querySelector('.ipc-rating-star--imdb');
                    const rating = ratingEl ? ratingEl.innerText.split(' ')[0] : 'N/A';
                    
                    const imageEl = item.querySelector('.ipc-image');
                    const image = imageEl ? imageEl.src : '';
                    
                    const linkEl = item.querySelector('.ipc-title-link-wrapper') || item.querySelector('a.ipc-title-link-wrapper');
                    let id = '';
                    if (linkEl && linkEl.href.includes('/title/')) {
                        id = linkEl.href.split('/title/')[1].split('/')[0];
                    }
                    
                    if (!title || !id) return null;

                    return {
                        id: id,
                        title: title,
                        year: year,
                        description: `Película de IMDb con una puntuación de ${rating}.`,
                        image: image,
                        type: 'movie',
                        genre: 'Cine',
                        rating: rating,
                        sources: []
                    };
                } catch (e) {
                    return null;
                }
            }).filter(m => m !== null);
        });
        
        if (!movies || movies.length === 0) {
            console.error(`⚠️ No se encontraron películas en ${url}. Es posible que los selectores hayan cambiado.`);
        }

        console.log(`✅ Se encontraron ${movies.length} películas en ${url}`);
        allMovies = [...allMovies, ...movies];
    }

    // Remove duplicates by id
    const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());
    console.log(`📊 Total de películas únicas recolectadas: ${uniqueMovies.length}`);

    // Update scraped_data.json
    const scrapedPath = path.join(__dirname, 'src', 'scraped_data.json');
    fs.writeFileSync(scrapedPath, JSON.stringify(uniqueMovies, null, 2));
    console.log(`💾 src/scraped_data.json actualizado.`);

    // Create a new seed script for Firebase
    const seedCode = `
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

const movies = ${JSON.stringify(uniqueMovies.slice(0, 100), null, 2)}; // Limit to 100 for now to avoid long wait

async function seed() {
  console.log("🔥 Cargando 100 películas principales en Firebase...");
  for (const movie of movies) {
    try {
        await setDoc(doc(db, 'artifacts', appId, 'movies', movie.id), movie, { merge: true });
        console.log(\`✅ \${movie.title}\`);
    } catch (e) {
        console.error(\`❌ Error en \${movie.title}: \`, e.message);
    }
  }
  console.log("✨ Proceso completado.");
  process.exit(0);
}

seed().catch(console.error);
`;
    fs.writeFileSync(path.join(__dirname, 'seed_imdb.cjs'), seedCode);
    console.log("📝 Creado seed_imdb.cjs para subir a Firebase.");

    await browser.close();
}

scrapeIMDb().catch(e => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
});
