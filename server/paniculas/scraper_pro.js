import axios from 'axios';
import * as cheerio from 'cheerio';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

// --- CONFIGURACIÓN DE FIREBASE ---
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

// --- CONFIGURACIÓN DEL SCRAPER ---
const BASE_URL = 'https://www.pelisplushd.la';
const CATALOG_URL = `${BASE_URL}/peliculas?page=`;
const LOCAL_LINKS_PATH = './src/local_links.json';

async function scrapeMovies(pages = 1) {
    console.log(`🚀 Iniciando Gran Scrapeo de PANICULAS (${pages} páginas)...`);
    
    // Cargar enlaces locales existentes
    let localData = { movies: {}, series: {} };
    if (fs.existsSync(LOCAL_LINKS_PATH)) {
        localData = JSON.parse(fs.readFileSync(LOCAL_LINKS_PATH, 'utf8'));
    }

    let scrapedMetadata = [];

    for (let i = 1; i <= pages; i++) {
        console.log(`\n📄 Procesando página ${i}...`);
        try {
            const { data } = await axios.get(`${CATALOG_URL}${i}`);
            const $ = cheerio.load(data);
            
            const movieItems = $('a.Posters-link');
            
            for (const el of movieItems) {
                const title = $(el).find('p').text().trim();
                const detailPath = $(el).attr('href');
                const poster = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
                const id = detailPath.split('/').filter(Boolean).pop();

                if (!id) continue;

                console.log(`   🎬 Extrayendo: ${title}...`);

                try {
                    const { data: detailData } = await axios.get(`${BASE_URL}${detailPath}`);
                    const $d = cheerio.load(detailData);
                    
                    const description = $d('.text-large').text().trim() || "Sin descripción disponible.";
                    const year = parseInt($d('.date').first().text()) || 2024;
                    const genre = $d('.genres a').first().text().trim() || "Cine";

                    // --- EXTRACCIÓN PROFUNDA DEL REPRODUCTOR ---
                    // Buscamos enlaces que contengan patrones de servidores conocidos
                    const serverRegex = /(https:\/\/(?:waaw\.to|playnixes\.com|charlestoughrace\.com|streamwish\.to|netu\.to|voesx\.com)\/e\/[a-zA-Z0-9]+)/g;
                    const matches = detailData.match(serverRegex);
                    
                    const cleanLinks = matches ? [...new Set(matches)].map(url => ({
                        label: url.includes('waaw') ? 'Servidor 1 (Rápido)' : 
                               url.includes('playnixes') ? 'Servidor 2 (HD)' : 'Servidor Alternativo',
                        url: url
                    })) : [];

                    // Si no encontramos embed directo, guardamos el de la página pero marcamos para revisión
                    const finalSources = cleanLinks.length > 0 ? cleanLinks : [{ label: "Enlace Web", url: `${BASE_URL}${detailPath}` }];

                    // Guardar para el bloque de sincronización
                    scrapedMetadata.push({
                        id, title, year, description,
                        image: poster.startsWith('http') ? poster : `${BASE_URL}${poster}`,
                        type: 'movie', genre,
                        sources: finalSources
                    });

                    // Guardar enlace en Local
                    localData.movies[id] = finalSources;

                } catch (err) {
                    console.error(`      ❌ Error en detalles de ${title}`);
                }
            }
        } catch (err) {
            console.error(`   ❌ Error cargando página ${i}`);
        }
    }

    // Guardar archivos locales
    fs.writeFileSync(LOCAL_LINKS_PATH, JSON.stringify(localData, null, 2));
    fs.writeFileSync('./src/scraped_data.json', JSON.stringify(scrapedMetadata, null, 2));
    console.log("\n✅ ¡Scrapeo completado! Datos listos en src/scraped_data.json.");
    process.exit(0);
}

// Ejecutar para las primeras 2 páginas (unas 48 películas de golpe)
scrapeMovies(2).catch(console.error);
