
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

const movies = [
  {
    "id": "tt0111161",
    "title": "Cadena perpetua",
    "year": 1994,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 9.3/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "9.3",
    "sources": []
  },
  {
    "id": "tt0068646",
    "title": "El padrino",
    "year": 1972,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 9.2/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "9.2",
    "sources": []
  },
  {
    "id": "tt0468569",
    "title": "El caballero oscuro",
    "year": 2008,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 9.1/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "9.1",
    "sources": []
  },
  {
    "id": "tt0071562",
    "title": "El padrino parte II",
    "year": 1974,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 9.0/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "9.0",
    "sources": []
  },
  {
    "id": "tt0050083",
    "title": "12 hombres sin piedad",
    "year": 1957,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 9.0/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "9.0",
    "sources": []
  },
  {
    "id": "tt0167260",
    "title": "El señor de los anillos: El retorno del rey",
    "year": 2003,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 9.0/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "9.0",
    "sources": []
  },
  {
    "id": "tt0108052",
    "title": "La lista de Schindler",
    "year": 1993,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 9.0/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "9.0",
    "sources": []
  },
  {
    "id": "tt0120737",
    "title": "El señor de los anillos: La comunidad del anillo",
    "year": 2001,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.9/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.9",
    "sources": []
  },
  {
    "id": "tt0110912",
    "title": "Pulp Fiction",
    "year": 1994,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.9/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.9",
    "sources": []
  },
  {
    "id": "tt0060196",
    "title": "El bueno, el feo y el malo",
    "year": 1966,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.8/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.8",
    "sources": []
  },
  {
    "id": "tt0167261",
    "title": "El señor de los anillos: Las dos torres",
    "year": 2002,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.8/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.8",
    "sources": []
  },
  {
    "id": "tt0109830",
    "title": "Forrest Gump",
    "year": 1994,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.8/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.8",
    "sources": []
  },
  {
    "id": "tt0137523",
    "title": "El club de la lucha",
    "year": 1999,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.8/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.8",
    "sources": []
  },
  {
    "id": "tt1375666",
    "title": "Origen",
    "year": 2010,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.8/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.8",
    "sources": []
  },
  {
    "id": "tt0080684",
    "title": "El imperio contraataca",
    "year": 1980,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.7/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.7",
    "sources": []
  },
  {
    "id": "tt0133093",
    "title": "Matrix",
    "year": 1999,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.7/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.7",
    "sources": []
  },
  {
    "id": "tt0099685",
    "title": "Uno de los nuestros",
    "year": 1990,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.7/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.7",
    "sources": []
  },
  {
    "id": "tt0816692",
    "title": "Interstellar",
    "year": 2014,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.7/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.7",
    "sources": []
  },
  {
    "id": "tt0073486",
    "title": "Alguien voló sobre el nido del cuco",
    "year": 1975,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.7/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.7",
    "sources": []
  },
  {
    "id": "tt0114369",
    "title": "Seven",
    "year": 1995,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0038650",
    "title": "Qué bello es vivir",
    "year": 1946,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0102926",
    "title": "El silencio de los corderos",
    "year": 1991,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0047478",
    "title": "Los siete samuráis",
    "year": 1954,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0120815",
    "title": "Salvar al soldado Ryan",
    "year": 1998,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0120689",
    "title": "La milla verde",
    "year": 1999,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0317248",
    "title": "Ciudad de Dios",
    "year": 2002,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0119698",
    "title": "La vida es bella",
    "year": 1997,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0103064",
    "title": "Terminator 2: El juicio final",
    "year": 1991,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0088763",
    "title": "Regreso al futuro",
    "year": 1985,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt0076759",
    "title": "La guerra de las galaxias",
    "year": 1977,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0245429",
    "title": "El viaje de Chihiro",
    "year": 2001,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0253474",
    "title": "El pianista",
    "year": 2002,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt0172495",
    "title": "Gladiator (El gladiador)",
    "year": 2000,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt6751668",
    "title": "Parásitos",
    "year": 2019,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt0095327",
    "title": "La tumba de las luciérnagas",
    "year": 1988,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt6019206",
    "title": "Kill Bill: The Whole Bloody Affair",
    "year": 2011,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.8/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.8",
    "sources": []
  },
  {
    "id": "tt0054215",
    "title": "Psicosis",
    "year": 1960,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt0110357",
    "title": "El rey león",
    "year": 1994,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt0056058",
    "title": "Harakiri",
    "year": 1962,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0407887",
    "title": "Infiltrados",
    "year": 2006,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt2582802",
    "title": "Whiplash",
    "year": 2014,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt0482571",
    "title": "El truco final (El prestigio)",
    "year": 2006,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt0120586",
    "title": "American History X",
    "year": 1998,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt0110413",
    "title": "El profesional (Léon)",
    "year": 1994,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt13975146",
    "title": "Spider-Man: Cruzando el multiverso",
    "year": 2023,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.6/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.6",
    "sources": []
  },
  {
    "id": "tt0095765",
    "title": "Cinema Paradiso",
    "year": 1988,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt0034583",
    "title": "Casablanca",
    "year": 1942,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt1675434",
    "title": "Intocable",
    "year": 2011,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt0114814",
    "title": "Sospechosos habituales",
    "year": 1995,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  },
  {
    "id": "tt1853728",
    "title": "Django desencadenado",
    "year": 2012,
    "description": "Una de las 50 mejores películas de la historia según IMDb, con una puntuación de 8.5/10.",
    "image": "https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_QL75_UX500_CR0,47,500,740_.jpg",
    "type": "movie",
    "genre": "Clásico",
    "rating": "8.5",
    "sources": []
  }
];

async function seed() {
  console.log("🚀 Subiendo 50 películas principales a Firebase...");
  for (const movie of movies) {
    await setDoc(doc(db, 'artifacts', appId, 'movies', movie.id), movie);
    console.log(`✅ ${movie.title}`);
  }
  console.log("✨ ¡Carga completada!");
  process.exit(0);
}

seed().catch(console.error);
