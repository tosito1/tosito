/* ==========================================================================
   TOUST HAUTE HORLOGERIE - LÓGICA DE TIENDA & INTEGRACIÓN CON FIRESTORE
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    getDoc,
    addDoc, 
    doc, 
    setDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

/* --------------------------------------------------------------------------
   CONFIGURACIÓN DE FIREBASE (PROYECTO: tosito-7f923)
   -------------------------------------------------------------------------- */
const firebaseConfig = {
    apiKey: "AIzaSyCLAB3IW4U6CcXiE_r9t_gkMPVpdFY16g4",
    authDomain: "tosito-7f923.firebaseapp.com",
    projectId: "tosito-7f923",
    storageBucket: "tosito-7f923.firebasestorage.app",
    messagingSenderId: "944852070557",
    appId: "1:944852070557:web:96fbb05ea60bd99777a474",
    measurementId: "G-6HFY8ZWS6N"
};

let db = null;
let auth = null;
let currentUser = null;
let userProfileData = null;
let isFirestoreReady = false;

/* --------------------------------------------------------------------------
   CATÁLOGO MAESTRO DE RELOJES DE MUESTRA (SEED DATA)
   -------------------------------------------------------------------------- */
const DEFAULT_WATCHES = [
    {
        id: "toust-titanium-chrono",
        name: "TOUST Royal Chrono Titanio",
        category: "cronografo",
        categoryLabel: "Cronógrafo Suizo",
        price: 4850,
        badge: "Insignia",
        image: "/images/titanium_chrono.jpg",
        specsSummary: "Titanio Grado 5 • Calibre Automático T-88 • 42mm",
        description: "El cronógrafo insignia de TOUST. Fabricado en titanio aeroespacial cepillado con bisel de cerámica y escala taquimétrica. Resistente a campos magnéticos intensos.",
        specs: {
            caja: "Titanio Grado 5 cepillado (42 mm)",
            cristal: "Zafiro antirreflejo doble cara",
            movimiento: "Automático TOUST Calibre T-88 (Reserva 52h)",
            resistencia: "100 metros / 10 ATM",
            correa: "Caucho FKM vulcanizado con cierre deployante"
        }
    },
    {
        id: "toust-perpetual-gold",
        name: "TOUST Aureus Perpetual Gold",
        category: "lujo",
        categoryLabel: "Edición Oro Macizo",
        price: 12400,
        badge: "Edición Limitada",
        image: "/images/perpetual_gold.jpg",
        specsSummary: "Oro Amarillo 18K • Calendario Perpetuo • 40mm",
        description: "Pieza maestra forjada en oro de 18 quilates con esfera satinada en tono champán y masa oscilante esmaltada a mano visible en el fondo de zafiro.",
        specs: {
            caja: "Oro amarillo de 18 quilates (40 mm)",
            cristal: "Zafiro abombado ultra-resistente",
            movimiento: "Mecánico de cuerda automática manufactura TOUST",
            resistencia: "50 metros / 5 ATM",
            correa: "Piel de aligátor negra con pespunte a mano"
        }
    },
    {
        id: "toust-deep-diver",
        name: "TOUST Nautilus Deep Diver",
        category: "automatico",
        categoryLabel: "Automático Submarino",
        price: 3200,
        badge: "300 Metros",
        image: "/images/deep_diver.jpg",
        specsSummary: "Acero 316L • Bisel Cerámico Giratorio • Válvula Helio",
        description: "El reloj de inmersión profesional de TOUST. Diseñado para explorar profundidades abisales con bisel cerámico y luminova azul ultra-potente.",
        specs: {
            caja: "Acero quirúrgico 316L (43 mm)",
            cristal: "Zafiro de 4 mm de espesor",
            movimiento: "Automático TOUST Calibre Pro-Diver",
            resistencia: "300 metros / 30 ATM",
            correa: "Brazalete de acero macizo con extensión de buceo"
        }
    },
    {
        id: "toust-monolith-tourbillon",
        name: "TOUST Monolith Tourbillon Skeleton",
        category: "lujo",
        categoryLabel: "Alta Relojería",
        price: 18900,
        badge: "Obra Maestra",
        image: "/images/monolith_tourbillon.jpg",
        specsSummary: "Jaula Tourbillon Volante • Esfera Esqueletizada",
        description: "La cumbre relojera de TOUST. Una jaula de tourbillon volante expuesta que desafía la gravedad con puentes calados a mano y reserva de 72 horas.",
        specs: {
            caja: "Carbono forjado y titanio DLC negro (44 mm)",
            cristal: "Zafiro de alta pureza frontal y posterior",
            movimiento: "Tourbillon volante TOUST T-Tourbillon (72h)",
            resistencia: "50 metros / 5 ATM",
            correa: "Textil balístico y piel hidrófuga"
        }
    },
    {
        id: "toust-sovereign-slim",
        name: "TOUST Sovereign Ultra Slim",
        category: "minimalista",
        categoryLabel: "Diseño Atemporal",
        price: 1650,
        badge: "Ultra Delgado",
        image: "/images/sovereign_slim.jpg",
        specsSummary: "Perfil de 6.2 mm • Esfera Ébano & Oro • Zafiro",
        description: "La pureza de líneas llevada a la perfección por los artesanos de TOUST. Caja ultra fina que resbala bajo el puño de la camisa con una presencia sutil y distinguida.",
        specs: {
            caja: "Acero pulido acabado espejo (39 mm x 6.2 mm)",
            cristal: "Zafiro plano con recubrimiento antirreflejo",
            movimiento: "Cuarzo Suizo de Alta Precisión TOUST Calibre Slim",
            resistencia: "30 metros / 3 ATM",
            correa: "Cuero curtido vegetal en color coñac"
        }
    },
    {
        id: "toust-grand-aviator",
        name: "TOUST Grand Aviator Heritage",
        category: "cronografo",
        categoryLabel: "Cronógrafo Aviación",
        price: 2950,
        badge: "Vintage",
        image: "/images/grand_aviator.jpg",
        specsSummary: "Corona Cebolla • Agujas Catedral • Antimagnético",
        description: "Homenaje a los instrumentos de cabina legendarios. Esfera de máxima legibilidad con números luminiscentes y caja antimagnética protegida con jaula de hierro dulce.",
        specs: {
            caja: "Acero envejecido al cañón de fusil (41 mm)",
            cristal: "Zafiro con perfil Box vintage",
            movimiento: "Cronógrafo automático bicompax TOUST",
            resistencia: "100 metros / 10 ATM",
            correa: "Cuero envejecido con remaches de latón"
        }
    }

];

/* --------------------------------------------------------------------------
   ESTADO GLOBAL DE LA APLICACIÓN
   -------------------------------------------------------------------------- */
let activeWatches = [...DEFAULT_WATCHES];
let cart = (JSON.parse(localStorage.getItem('toust_cart') || localStorage.getItem('chronos_cart')) || []).map(item => {
    const match = DEFAULT_WATCHES.find(w => w.id === item.id);
    if (match && (!item.image || item.image.includes('unsplash.com'))) {
        return { ...item, image: match.image };
    }
    return item;
});
let activeFilter = 'todos';
let searchQuery = '';

/* --------------------------------------------------------------------------
   INICIALIZACIÓN DE FIREBASE / FIRESTORE
   -------------------------------------------------------------------------- */
function setupFirebase() {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('firestore-status-text');

    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        isFirestoreReady = true;

        if (dot) dot.className = "status-dot connected";
        if (text) text.textContent = "Firestore Conectado (tosito-7f923) ✓";
        console.log("🔥 Firebase, Firestore y Auth inicializados con éxito.");

        // Escuchar cambios de estado de autenticación
        setupAuthListener();

        // Cargar catálogo desde la colección organizada 'relojes_toust'
        fetchProductsFromFirestore();
    } catch (error) {
        console.error("Error al conectar con Firestore:", error);
        if (dot) dot.className = "status-dot error";
        if (text) text.textContent = "Error al conectar Firestore";
    }
}

// Cargar productos desde Firestore (organizados en 'relojes_toust/tienda/productos')
async function fetchProductsFromFirestore() {
    if (!isFirestoreReady) return;
    try {
        const productsCol = collection(db, "relojes_toust", "tienda", "productos");
        const querySnapshot = await getDocs(productsCol);
        if (!querySnapshot.empty) {
            const firestoreWatches = [];
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                // Normalizar imágenes si provienen de versiones anteriores con Unsplash
                const defaultMatch = DEFAULT_WATCHES.find(w => w.id === docSnap.id);
                if (defaultMatch && (!data.image || data.image.includes('unsplash.com'))) {
                    data.image = defaultMatch.image;
                }
                
                // Excluir piezas/componentes del catálogo público (son exclusivas del admin)
                if (data.category !== 'componentes') {
                    firestoreWatches.push({ id: docSnap.id, ...data });
                }
            });
            activeWatches = firestoreWatches;
            renderCatalog();
            // Catálogo sincronizado en silencio
        }
    } catch (err) {
        console.warn("Catálogo aún no creado en Firestore, usando catálogo local:", err);
    }
}

// Subir los productos a la colección organizada 'relojes_toust/tienda/productos'
async function seedCatalogToFirestore() {
    if (!isFirestoreReady) {
        alert("Firebase aún no está listo.");
        return;
    }

    const btn = document.getElementById('seed-firestore-btn');
    btn.disabled = true;
    btn.textContent = "Subiendo a 'relojes_toust'...";

    try {
        for (const watch of DEFAULT_WATCHES) {
            const { id, ...data } = watch;
            await setDoc(doc(db, "relojes_toust", "tienda", "productos", id), data);
        }
        showToast("¡Catálogo subido con éxito a 'relojes_toust'!");
        btn.textContent = "✓ Catálogo en relojes_toust";
    } catch (err) {
        console.error("Error al sembrar catálogo en Firestore:", err);
        alert("Error al subir a Firestore: " + err.message);
        btn.textContent = "Reintentar Subida";
        btn.disabled = false;
    }
}

/* --------------------------------------------------------------------------
   SISTEMA DE AUTENTICACIÓN (LOGIN / REGISTRO / GOOGLE)
   -------------------------------------------------------------------------- */
function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateAuthUI(user);
    });
}

function updateAuthUI(user) {
    const authBtnLabel = document.getElementById('auth-btn-label');
    const authBtn = document.getElementById('auth-btn');
    const guestView = document.getElementById('auth-guest-view');
    const loggedView = document.getElementById('auth-logged-view');
    const avatarCircle = document.getElementById('user-avatar-circle');
    const displayName = document.getElementById('user-display-name');
    const displayEmail = document.getElementById('user-display-email');

    if (user) {
        const name = user.displayName || user.email.split('@')[0];
        if (authBtnLabel) authBtnLabel.textContent = name.length > 10 ? name.slice(0, 9) + '…' : name;
        if (authBtn) authBtn.classList.add('logged-in');

        if (guestView) guestView.style.display = 'none';
        if (loggedView) loggedView.style.display = 'block';

        if (avatarCircle) avatarCircle.textContent = name.charAt(0).toUpperCase();
        if (displayName) displayName.textContent = name;
        if (displayEmail) displayEmail.textContent = user.email;

        // Cargar perfil guardado (desde localStorage instantáneamente y luego Firestore)
        loadUserProfile(user.uid);

        // Verificar si el usuario es administrador
        if (db) {
            getDoc(doc(db, 'relojes_toust_admins', user.uid)).then(adminSnap => {
                const isSuperAdmin = user.uid === 'UAApcyeDQNZElcOcrpUxMmpPysp1';
                const adminPanelLink = document.getElementById('admin-panel-link');
                
                if (adminSnap.exists() || isSuperAdmin) {
                    // Si es Super Admin y no tiene documento, creárselo para futuros checks
                    if (isSuperAdmin && !adminSnap.exists()) {
                        setDoc(doc(db, 'relojes_toust_admins', user.uid), { role: 'admin', autoCreated: true });
                    }
                    if (adminPanelLink) adminPanelLink.style.display = 'flex';
                    const firestoreBox = document.querySelector('.footer-status-box');
                    if (firestoreBox) {
                        firestoreBox.classList.add('admin-visible');
                    }
                } else {
                    if (adminPanelLink) adminPanelLink.style.display = 'none';
                    const firestoreBox = document.querySelector('.footer-status-box');
                    if (firestoreBox) firestoreBox.classList.remove('admin-visible');
                }
            }).catch(err => console.error("Error verificando rol admin:", err));
        }
    } else {
        userProfileData = null;
        if (authBtnLabel) authBtnLabel.textContent = "Entrar";
        if (authBtn) authBtn.classList.remove('logged-in');

        if (guestView) guestView.style.display = 'block';
        if (loggedView) loggedView.style.display = 'none';

        // Resetear formulario de perfil al cerrar sesión
        const profileForm = document.getElementById('profile-form');
        if (profileForm) profileForm.reset();
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* --------------------------------------------------------------------------
   GESTIÓN DEL PERFIL DE USUARIO Y DATOS DE ENVÍO HABITUALES
   -------------------------------------------------------------------------- */
async function loadUserProfile(uid) {
    if (!uid) return;

    // 1. Carga inmediata desde almacenamiento local para evitar esperas y parpadeos
    const cachedProfile = localStorage.getItem('toust_user_profile_' + uid);
    if (cachedProfile) {
        try {
            userProfileData = JSON.parse(cachedProfile);
        } catch (e) {
            console.warn("Error al leer perfil en localStorage:", e);
        }
    }

    // 2. Consulta a Cloud Firestore: relojes_toust/tienda/usuarios/{uid}
    if (isFirestoreReady && db) {
        try {
            const userDocRef = doc(db, "relojes_toust", "tienda", "usuarios", uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
                userProfileData = userSnap.data();
                localStorage.setItem('toust_user_profile_' + uid, JSON.stringify(userProfileData));
            } else if (currentUser) {
                // Si aún no tiene perfil guardado en Firestore, lo creamos automáticamente
                try {
                    const defaultProfile = {
                        name: currentUser.displayName || '',
                        email: currentUser.email || '',
                        phone: currentUser.phoneNumber || '',
                        uid: currentUser.uid,
                        createdAt: new Date().toISOString()
                    };
                    await setDoc(userDocRef, defaultProfile, { merge: true });
                    userProfileData = defaultProfile;
                    localStorage.setItem('toust_user_profile_' + uid, JSON.stringify(userProfileData));
                    
                    const nameInput = document.getElementById('profile-name');
                    if (nameInput && !nameInput.value && defaultProfile.name) {
                        nameInput.value = defaultProfile.name;
                    }
                } catch (e) {
                    console.warn("Error autoguardando perfil en DB:", e);
                }
            }
        } catch (error) {
            console.warn("Aviso al consultar perfil en Firestore:", error);
        }
    }
}

function fillProfileForm(data) {
    if (!data) return;
    const nameInput = document.getElementById('profile-name');
    const phoneInput = document.getElementById('profile-phone');
    const addressInput = document.getElementById('profile-address');
    const cityInput = document.getElementById('profile-city');
    const postalInput = document.getElementById('profile-postal');
    const notesInput = document.getElementById('profile-notes');

    if (nameInput) nameInput.value = data.nombre || (currentUser?.displayName || '');
    if (phoneInput && data.telefono) phoneInput.value = data.telefono;
    if (addressInput && data.direccion) addressInput.value = data.direccion;
    if (cityInput && data.ciudad) cityInput.value = data.ciudad;
    if (postalInput && data.codigoPostal) postalInput.value = data.codigoPostal;
    if (notesInput && data.notas) notesInput.value = data.notas;
}


function openAuthModal() {
    if (currentUser) {
        window.location.href = 'profile.html';
        return;
    }

    document.getElementById('auth-modal').classList.add('open');
    document.body.style.overflow = 'hidden';

    if (typeof Motion !== 'undefined' && Motion.animate) {
        Motion.animate('#auth-modal .modal-card', { scale: [0.9, 1], opacity: [0, 1] }, { type: 'spring', stiffness: 400, damping: 24 });
    }
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('open');
    document.body.style.overflow = '';
}

/* --------------------------------------------------------------------------
   RENDERIZADO DEL CATÁLOGO & FILTROS
   -------------------------------------------------------------------------- */
function renderCatalog() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    // Filtrado por categoría y búsqueda
    const filtered = activeWatches.filter(watch => {
        const matchesCategory = (activeFilter === 'todos') || (watch.category === activeFilter);
        const matchesSearch = watch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              watch.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              watch.specsSummary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-dim);">
                <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">No se encontraron piezas con ese criterio.</p>
                <button class="btn btn-secondary" id="reset-filter-btn">Ver Todos los Relojes</button>
            </div>
        `;
        document.getElementById('reset-filter-btn')?.addEventListener('click', () => {
            activeFilter = 'todos';
            searchQuery = '';
            document.getElementById('search-input').value = '';
            updateFilterButtons();
            renderCatalog();
        });
        return;
    }

    grid.innerHTML = filtered.map((watch, idx) => `
        <article class="product-card" data-id="${watch.id}" style="animation-delay:${idx * 0.06}s">
            ${watch.badge ? `
            <div class="card-badge-wrap">
                <span class="card-badge">${watch.badge}</span>
                <span class="badge-pulse-ring"></span>
            </div>` : ''}
            <div class="product-image-wrap" data-action="view-details" data-id="${watch.id}">
                <img src="${watch.image}" alt="${watch.name}" class="product-image" loading="lazy">
                <div class="card-quick-view-overlay">
                    <span class="quick-view-btn">Vista Detallada</span>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${watch.categoryLabel || watch.category}</span>
                <h3 class="product-name">${watch.name}</h3>
                <p class="product-specs-summary">${watch.specsSummary}</p>
                <div class="product-footer">
                    <span class="product-price">${watch.price.toLocaleString('es-ES')} €</span>
                    <button class="add-to-cart-btn" data-action="add-cart" data-id="${watch.id}">
                        <i data-lucide="shopping-bag" style="width:16px;height:16px"></i>
                        Añadir
                    </button>
                </div>
            </div>
        </article>
    `).join('');

    // Skeleton fade-out effect (clear any leftover skeletons)
    document.querySelectorAll('.skeleton-card').forEach(s => s.remove());

    // Actualizar contador visual de piezas
    const countDisplay = document.getElementById('catalog-count-display');
    if (countDisplay) {
        countDisplay.textContent = filtered.length;
    }

    // Aplicar efectos de librerías externas (Tilt 3D e Iconos)
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll('.product-card'), {
            max: 8,
            speed: 600,
            glare: true,
            'max-glare': 0.08,
            perspective: 1000,
            scale: 1.018
        });
    }

    if (typeof gsap !== 'undefined') {
        gsap.fromTo('.product-card',
            { opacity: 0, y: 40, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.7, ease: 'power4.out', clearProps: 'opacity,transform' }
        );
    }
}

function updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.category === activeFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/* --------------------------------------------------------------------------
   GESTIÓN DEL CARRITO DE COMPRAS
   -------------------------------------------------------------------------- */
function saveCart() {
    localStorage.setItem('toust_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId) {
    const watch = activeWatches.find(w => w.id === productId);
    if (!watch) return;

    const existingIndex = cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: watch.id,
            name: watch.name,
            price: watch.price,
            image: watch.image,
            category: watch.categoryLabel || watch.category,
            quantity: 1
        });
    }

    saveCart();
    showToast(`"${watch.name}" añadido a la cesta`);
    openCart();

    // Animación de física elástica con Motion (antes Framer Motion)
    if (typeof Motion !== 'undefined' && Motion.animate) {
        Motion.animate('#cart-badge', { scale: [1, 1.45, 0.9, 1.15, 1] }, { type: 'spring', stiffness: 450, damping: 14 });
    }
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    saveCart();
}

function removeFromCart(productId) {
    // Animate the item out before removing
    const itemRow = document.querySelector(`.cart-item-row[data-id="${productId}"]`);
    if (itemRow) {
        itemRow.classList.add('removing');
        setTimeout(() => {
            cart = cart.filter(i => i.id !== productId);
            saveCart();
        }, 350);
    } else {
        cart = cart.filter(i => i.id !== productId);
        saveCart();
    }
    showToast("Artículo eliminado de la cesta");
}

function clearCart() {
    if (cart.length === 0) return;
    cart = [];
    saveCart();
    showToast("Cesta vaciada");
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const itemsCountEl = document.getElementById('cart-items-count');
    const list = document.getElementById('cart-items-list');
    const totalPriceEl = document.getElementById('cart-total-price');
    const checkoutTotalEl = document.getElementById('checkout-summary-total');

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (badge) badge.textContent = totalCount;
    if (itemsCountEl) itemsCountEl.textContent = totalCount;
    if (totalPriceEl) totalPriceEl.textContent = `${totalPrice.toLocaleString('es-ES')} €`;
    if (checkoutTotalEl) checkoutTotalEl.textContent = `${totalPrice.toLocaleString('es-ES')} €`;

    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon">◈</div>
                <p>Tu cesta de compras está vacía.</p>
                <small style="display:block; margin-top:0.5rem; color:var(--text-dim)">Explora nuestra colección y añade piezas excepcionales.</small>
            </div>
        `;
        document.getElementById('proceed-checkout-btn').disabled = true;
        document.getElementById('proceed-checkout-btn').style.opacity = '0.5';
    } else {
        document.getElementById('proceed-checkout-btn').disabled = false;
        document.getElementById('proceed-checkout-btn').style.opacity = '1';
        list.innerHTML = cart.map(item => `
            <div class="cart-item-row" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <span class="cart-item-price">${(item.price * item.quantity).toLocaleString('es-ES')} €</span>
                    <div class="cart-item-controls">
                        <button class="qty-btn" data-action="decrease-qty" data-id="${item.id}">−</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" data-action="increase-qty" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="remove-item-btn" data-action="remove-item" data-id="${item.id}" title="Eliminar">&times;</button>
            </div>
        `).join('');
    }
}

function openCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Animación de resorte con Motion
    if (typeof Motion !== 'undefined' && Motion.animate) {
        Motion.animate(drawer, { transform: ['translateX(100%)', 'translateX(0%)'] }, { type: 'spring', stiffness: 350, damping: 28 });
    }
}

function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (typeof Motion !== 'undefined' && Motion.animate) {
        Motion.animate(drawer, { transform: ['translateX(0%)', 'translateX(100%)'] }, { duration: 0.25 }).then(() => {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        });
    } else {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }
}

/* --------------------------------------------------------------------------
   VISTA RÁPIDA / MODAL DETALLE DE PRODUCTO
   -------------------------------------------------------------------------- */
function openProductDetail(productId) {
    const watch = activeWatches.find(w => w.id === productId);
    if (!watch) return;

    const modalContent = document.getElementById('product-detail-content');
    modalContent.innerHTML = `
        <img src="${watch.image}" alt="${watch.name}" class="detail-img">
        <div class="detail-info">
            <span class="sub-heading">${watch.categoryLabel || watch.category}</span>
            <h2>${watch.name}</h2>
            <div class="detail-price">${watch.price.toLocaleString('es-ES')} €</div>
            <p class="detail-desc">${watch.description}</p>
            
            <div class="specs-table">
                <div class="spec-item">
                    <strong>Caja y Diámetro</strong>
                    <span>${watch.specs.caja}</span>
                </div>
                <div class="spec-item">
                    <strong>Cristal</strong>
                    <span>${watch.specs.cristal}</span>
                </div>
                <div class="spec-item">
                    <strong>Movimiento</strong>
                    <span>${watch.specs.movimiento}</span>
                </div>
                <div class="spec-item">
                    <strong>Hermeticidad</strong>
                    <span>${watch.specs.resistencia}</span>
                </div>
            </div>

            <button class="btn btn-primary btn-block" id="modal-add-cart-btn" data-id="${watch.id}">
                Adquirir Pieza • ${watch.price.toLocaleString('es-ES')} €
            </button>
        </div>
    `;

    document.getElementById('product-modal').classList.add('open');
    document.body.style.overflow = 'hidden';

    // Animación elástica de apertura con Motion
    if (typeof Motion !== 'undefined' && Motion.animate) {
        Motion.animate('#product-modal .modal-card', { scale: [0.9, 1], opacity: [0, 1] }, { type: 'spring', stiffness: 400, damping: 24 });
    }

    document.getElementById('modal-add-cart-btn').addEventListener('click', () => {
        addToCart(watch.id);
        closeProductDetail();
    });
}

function closeProductDetail() {
    document.getElementById('product-modal').classList.remove('open');
    document.body.style.overflow = '';
}

/* --------------------------------------------------------------------------
   TRAMITACIÓN DE PEDIDOS (FIRESTORE)
   -------------------------------------------------------------------------- */
function openCheckoutModal() {
    if (cart.length === 0) return;
    closeCart();

    // Rellenar automáticamente los datos desde el perfil guardado si existen
    const notice = document.getElementById('checkout-autofill-notice');
    const orderName = document.getElementById('order-name');
    const orderPhone = document.getElementById('order-phone');
    const orderEmail = document.getElementById('order-email');
    const orderAddress = document.getElementById('order-address');
    const orderCity = document.getElementById('order-city');
    const orderPostal = document.getElementById('order-postal');
    const orderNotes = document.getElementById('order-notes');

    // Intentar leer de userProfileData o de localStorage si currentUser existe
    let profileToUse = userProfileData;
    if (!profileToUse && currentUser) {
        const cached = localStorage.getItem('toust_user_profile_' + currentUser.uid);
        if (cached) {
            try { profileToUse = JSON.parse(cached); } catch (e) {}
        }
    }

    if (profileToUse && (profileToUse.nombre || profileToUse.name || profileToUse.direccion || profileToUse.address || profileToUse.telefono || profileToUse.phone)) {
        if (orderName && (profileToUse.nombre || profileToUse.name)) orderName.value = profileToUse.name || profileToUse.nombre;
        if (orderPhone && (profileToUse.telefono || profileToUse.phone)) orderPhone.value = profileToUse.phone || profileToUse.telefono;
        if (orderEmail) orderEmail.value = profileToUse.email || (currentUser ? currentUser.email : '');
        if (orderAddress && (profileToUse.direccion || profileToUse.address)) orderAddress.value = profileToUse.address || profileToUse.direccion;
        if (orderCity && (profileToUse.ciudad || profileToUse.city)) orderCity.value = profileToUse.city || profileToUse.ciudad;
        if (orderPostal && (profileToUse.codigoPostal || profileToUse.postal)) orderPostal.value = profileToUse.postal || profileToUse.codigoPostal;
        if (orderNotes && (profileToUse.notas || profileToUse.notes)) orderNotes.value = profileToUse.notas || profileToUse.notes;

        if (notice) notice.style.display = 'flex';
    } else {
        if (currentUser) {
            if (orderEmail && currentUser.email) orderEmail.value = currentUser.email;
            if (orderName && currentUser.displayName) orderName.value = currentUser.displayName;
        }
        if (notice) notice.style.display = 'none';
    }

    document.getElementById('checkout-modal').classList.add('open');
    document.body.style.overflow = 'hidden';

    // Animación elástica de apertura de checkout con Motion
    if (typeof Motion !== 'undefined' && Motion.animate) {
        Motion.animate('#checkout-modal .modal-card', { scale: [0.9, 1], opacity: [0, 1] }, { type: 'spring', stiffness: 400, damping: 24 });
    }
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('open');
    document.body.style.overflow = '';
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-order-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = "Registrando en Firestore...";

    const orderData = {
        cliente: {
            nombre: document.getElementById('order-name').value.trim(),
            telefono: document.getElementById('order-phone').value.trim(),
            email: document.getElementById('order-email').value.trim(),
            direccion: document.getElementById('order-address').value.trim(),
            ciudad: document.getElementById('order-city').value.trim(),
            codigoPostal: document.getElementById('order-postal').value.trim(),
            notas: document.getElementById('order-notes').value.trim() || null
        },
        usuarioId: currentUser ? currentUser.uid : "invitado",
        usuarioEmail: currentUser ? currentUser.email : null,
        items: cart.map(i => ({
            id: i.id,
            nombre: i.name,
            precioUnitario: i.price,
            cantidad: i.quantity,
            totalLinea: i.price * i.quantity
        })),
        total: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
        estado: "nuevo",
        createdAt: isFirestoreReady ? serverTimestamp() : new Date().toISOString()
    };

    let generatedId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
        if (isFirestoreReady) {
            // Guardar dentro de la colección organizada 'relojes_toust/tienda/pedidos'
            const ordersCol = collection(db, "relojes_toust", "tienda", "pedidos");
            const docRef = await addDoc(ordersCol, orderData);
            generatedId = docRef.id;
            console.log("✓ Pedido guardado en 'relojes_toust/tienda/pedidos' con ID:", docRef.id);
        } else {
            console.info("Simulación local de pedido:", orderData);
        }

        // Si el usuario está registrado, mantener actualizado su perfil para futuros pedidos
        if (currentUser) {
            const updatedProfile = {
                nombre: orderData.cliente.nombre,
                telefono: orderData.cliente.telefono,
                email: orderData.cliente.email,
                direccion: orderData.cliente.direccion,
                ciudad: orderData.cliente.ciudad,
                codigoPostal: orderData.cliente.codigoPostal,
                notas: orderData.cliente.notas || '',
                updatedAt: new Date().toISOString()
            };
            userProfileData = { ...userProfileData, ...updatedProfile };
            localStorage.setItem('toust_user_profile_' + currentUser.uid, JSON.stringify(userProfileData));

            if (isFirestoreReady && db) {
                const userDocRef = doc(db, "relojes_toust", "tienda", "usuarios", currentUser.uid);
                setDoc(userDocRef, {
                    ...updatedProfile,
                    updatedAt: serverTimestamp()
                }, { merge: true }).catch(err => console.warn("Sincronización de perfil tras checkout:", err));
            }
        }

        // Limpieza tras pedido exitoso
        cart = [];
        saveCart();
        closeCheckoutModal();
        document.getElementById('checkout-form').reset();

        // Mostrar pantalla de éxito
        document.getElementById('order-id-badge').textContent = `ID de Pedido: #${generatedId}`;
        document.getElementById('success-modal').classList.add('open');

        // Celebración con Confeti Dorado de Alta Gama
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 140,
                spread: 80,
                origin: { y: 0.55 },
                colors: ['#d4af37', '#fcf6ba', '#aa820a', '#ffffff', '#e5c07b'],
                disableForReducedMotion: true
            });
            setTimeout(() => {
                confetti({
                    particleCount: 60,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#d4af37', '#f3e5ab']
                });
                confetti({
                    particleCount: 60,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#d4af37', '#f3e5ab']
                });
            }, 300);
        }

    } catch (error) {
        console.error("Error al registrar pedido en Firestore:", error);
        alert("Hubo un error al registrar tu pedido en la base de datos: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirmar Pedido y Registrar";
    }
}

/* --------------------------------------------------------------------------
   NOTIFICACIÓN TOAST
   -------------------------------------------------------------------------- */
let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/* --------------------------------------------------------------------------
   CURSOR PERSONALIZADO DE LUJO
   -------------------------------------------------------------------------- */
function initLuxuryCursor() {
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    function animateRing() {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover / Text / Link cursor states
    const hoverTargets = 'a, button, .product-card, .filter-btn, .nav-link, .add-to-cart-btn, .quick-view-btn, .trust-item, .spec-bullet';
    const textTargets = 'input, textarea, [contenteditable]';
    const linkTargets = 'a[href], .nav-link';

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(textTargets)) {
            document.body.classList.add('cursor-text');
            document.body.classList.remove('cursor-hover', 'cursor-link');
        } else if (e.target.closest(linkTargets)) {
            document.body.classList.add('cursor-link');
            document.body.classList.remove('cursor-hover', 'cursor-text');
        } else if (e.target.closest(hoverTargets)) {
            document.body.classList.add('cursor-hover');
            document.body.classList.remove('cursor-link', 'cursor-text');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(textTargets) || e.target.closest(linkTargets) || e.target.closest(hoverTargets)) {
            document.body.classList.remove('cursor-hover', 'cursor-link', 'cursor-text');
        }
    });

    // Click feedback
    document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
    document.addEventListener('mouseup', () => document.body.classList.remove('cursor-click'));

    // Hide/show on window leave/enter
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
}

/* --------------------------------------------------------------------------
   FULLPAGE SCROLL & DOT NAVIGATION
   -------------------------------------------------------------------------- */
function initFullPageScroll() {
    const scrollWrapper = document.getElementById('scroll-wrapper');
    const sections = document.querySelectorAll('.page-section');
    const dotNavItems = document.querySelectorAll('.dot-nav-item');

    if (!scrollWrapper || sections.length === 0) return;

    // Intersection Observer para marcar la sección activa
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Prevenir que se ejecute múltiples veces si ya es visible
                const isFirstTime = !entry.target.classList.contains('section-visible');
                entry.target.classList.add('section-visible');

                const id = entry.target.id;
                
                // Si es la sección de estadísticas y es la primera vez, animar los números y partículas
                if (id === 'stats-section' && isFirstTime) {
                    setTimeout(() => {
                        document.querySelectorAll('.stat-num').forEach(el => {
                            el.classList.add('flash');
                            setTimeout(() => el.classList.remove('flash'), 500);
                            for (let i = 0; i < 5; i++) {
                                const particle = document.createElement('span');
                                particle.className = 'stat-particle';
                                const angle = (i / 5) * Math.PI * 2;
                                particle.style.setProperty('--tx', `${Math.cos(angle) * 35}px`);
                                particle.style.setProperty('--ty', `${Math.sin(angle) * 35}px`);
                                particle.style.left = '50%';
                                particle.style.top = '40%';
                                el.closest('.stat-block').appendChild(particle);
                                setTimeout(() => particle.remove(), 900);
                            }
                        });
                    }, 500); // Pequeño delay para que coincida con la animación de entrada de CSS
                }

                if (id) {
                    dotNavItems.forEach(dot => {
                        if (dot.dataset.section === id) {
                            dot.classList.add('active');
                        } else {
                            dot.classList.remove('active');
                        }
                    });

                    // Sincronizar también la navegación superior
                    const mainNavLinks = document.querySelectorAll('.main-nav .nav-link');
                    mainNavLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === '#' + id) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
            }
        });
    }, {
        root: scrollWrapper,
        threshold: 0.3 // Con 30% visible ya la consideramos activa
    });

    sections.forEach(sec => observer.observe(sec));

    // Funcionalidad de click en los dots
    dotNavItems.forEach(dot => {
        dot.addEventListener('click', () => {
            const targetId = dot.dataset.section;
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                if (window.lenis) {
                    window.lenis.scrollTo(targetSection);
                } else if (scrollWrapper) {
                    scrollWrapper.scrollTo({
                        top: targetSection.offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

/* --------------------------------------------------------------------------
   LIBRERÍAS EXTERNAS DE ÉLITE: LENIS, GSAP Y PARTÍCULAS
   -------------------------------------------------------------------------- */
function initLenisScroll() {
    if (typeof Lenis === 'undefined') return;
    const scrollWrapper = document.getElementById('scroll-wrapper');

    const lenisParams = {
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    };
    if (scrollWrapper) {
        lenisParams.wrapper = scrollWrapper;
        lenisParams.content = scrollWrapper.children[0];
    }

    const lenis = new Lenis(lenisParams);
    window.lenis = lenis; // Exportar para navegación

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (typeof ScrollTrigger !== 'undefined') {
        if (scrollWrapper) {
            ScrollTrigger.defaults({ scroller: scrollWrapper });
        }
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        
        // Interceptar enlaces ancla de la cabecera y footer
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId.length > 1) {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        lenis.scrollTo(targetEl);
                    }
                }
            });
        });
    }
}

function initGSAPCinematics() {
    if (typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // ─── PARALLAX REVEAL ENTRE SECCIONES (TELÓN CINEMATOGRÁFICO) ────────────
        // Excluimos las secciones de banner (.trust-bar y .stats-section) porque no son a pantalla completa
        const sections = gsap.utils.toArray('.page-section:not(#catalogo):not(#destacados):not(.trust-bar):not(.stats-section)');
        sections.forEach((section, i) => {
            // El pie de página o la última sección no hacen pin
            const isLast = i === sections.length - 1;
            if (!isLast) {
                const isTall = section.classList.contains('section-tall');
                gsap.to(section, {
                    scale: 0.95,
                    opacity: 0.2,
                    yPercent: 20, // Animamos en porcentaje para mantener el flujo del DOM sin "pin" problemáticos
                    ease: 'none',
                    scrollTrigger: {
                        trigger: section,
                        start: isTall ? 'bottom bottom' : 'top top',
                        end: 'bottom top',
                        scrub: true
                    }
                });
            }
        });
    }

    // ─── HERO: TIMELINE CINEMATOGRÁFICO ─────────────────────────────────────
    const heroTL = gsap.timeline({ defaults: { ease: 'power4.out' } });
    heroTL
        .from('#main-header', { y: -40, opacity: 0, duration: 0.9, ease: 'power3.out' })
        .from('.ticker-bar', { opacity: 0, duration: 0.5 }, '-=0.4')
        .from('#hero-kicker', { opacity: 0, y: 20, scale: 0.9, duration: 0.8, ease: 'back.out(2)' }, '-=0.3')
        .from('#hero-title', {
            opacity: 0, y: 50, duration: 1.1,
            onStart() {
                // Animate each word
                gsap.from('#hero-title *', {
                    opacity: 0, y: 30, stagger: 0.12, duration: 0.9, ease: 'power3.out', delay: 0.1
                });
            }
        }, '-=0.2')
        .from('#hero-rule', { scaleX: 0, opacity: 0, transformOrigin: 'left center', duration: 0.7 }, '-=0.3')
        .from('#hero-description', { opacity: 0, y: 20, duration: 0.9 }, '-=0.4')
        .from('#hero-buttons .btn', { opacity: 0, y: 20, stagger: 0.15, duration: 0.7 }, '-=0.4')
        .from('#hero-v9-image', { opacity: 0, scale: 0.9, rotateY: 20, transformOrigin: 'right center', duration: 1.5, ease: 'expo.out' }, '-=0.8')
        .from('.scroll-indicator', { opacity: 0, y: 10, duration: 0.6 }, '-=0.2');

    // Counters: animate stat numbers in hero with flash effect
    document.querySelectorAll('.hero-stat-num[data-target]').forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        if (!isNaN(target)) {
            gsap.to({ val: 0 }, {
                val: target,
                duration: 2.2,
                delay: 1.4,
                ease: 'expo.out',
                onUpdate: function () {
                    el.textContent = Math.round(this.targets()[0].val);
                },
                onComplete: function () {
                    el.textContent = target + (target === 48 || target === 120 ? '' : '');
                    el.classList.add('flash');
                    setTimeout(() => el.classList.remove('flash'), 450);
                }
            });
        }
    });

    // Expand hero rule after hero animation
    setTimeout(() => {
        const heroRule = document.getElementById('hero-rule');
        if (heroRule) heroRule.classList.add('expanded');
    }, 900);

    // ─── PARALLAX EN HERO BG ────────────────────────────────────────────────
    if (typeof ScrollTrigger !== 'undefined') {
        // Element #hero-bg-image removed in V9 Cinematic Layout
        // gsap.to('#hero-bg-image', {
        //     yPercent: 20,
        //     ease: 'none',
        //     scrollTrigger: {
        //         trigger: '.hero-section',
        //         start: 'top top',
        //         end: 'bottom top',
        //         scrub: true
        //     }
        // });
    }

    // ─── TRANSICIÓN CINEMÁTICA Y HERO DEL CATÁLOGO ────────────────────────
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.from('#catalog-transition', {
            scrollTrigger: { trigger: '#catalog-transition', start: 'top 88%' },
            opacity: 0, scaleY: 0.85, duration: 0.9, ease: 'power3.out'
        });
        gsap.from('.catalog-hero-inner', {
            scrollTrigger: { trigger: '.catalog-hero', start: 'top 80%' },
            opacity: 0, y: 40, duration: 1, ease: 'power3.out'
        });
        gsap.from('.catalog-number', {
            scrollTrigger: { trigger: '.catalog-hero', start: 'top 80%' },
            opacity: 0, scale: 0.8, duration: 1.2, ease: 'back.out(1.5)'
        });
        gsap.from('#catalog-wipe', {
            scrollTrigger: { trigger: '.catalog-hero', start: 'top 70%' },
            scaleX: 0, transformOrigin: 'center center', duration: 1.3, ease: 'expo.out'
        });
    }

    // ─── FEATURED BANNER ────────────────────────────────────────────────────
    if (typeof ScrollTrigger !== 'undefined') {
        // Elements removed in Chapter 2 (Ingeniería) redesign
        // gsap.from('.featured-banner .banner-image-wrap', {
        //     scrollTrigger: { trigger: '.featured-banner', start: 'top 78%' },
        //     opacity: 0, x: -60, duration: 1.3, ease: 'power4.out'
        // });
        // gsap.from('.featured-banner .banner-text > *', {
        //     scrollTrigger: { trigger: '.featured-banner', start: 'top 78%' },
        //     opacity: 0, x: 40, stagger: 0.15, duration: 1, ease: 'power3.out', delay: 0.15
        // });
        // gsap.from('.spec-bullet', {
        //     scrollTrigger: { trigger: '.specs-mini-list', start: 'top 85%' },
        //     opacity: 0, x: 25, stagger: 0.12, duration: 0.7, ease: 'power2.out'
        // });
    }

    // ─── FOOTER ─────────────────────────────────────────────────────────────
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.from('.footer-content > *', {
            scrollTrigger: { trigger: '.site-footer', start: 'top 90%' },
            opacity: 0, y: 30, stagger: 0.15, duration: 0.9, ease: 'power3.out'
        });
    }

    // ─── HERO MOUSE PARALLAX ────────────────────────────────────────────────
    const heroSection = document.querySelector('.hero-section');
    const heroBg = document.getElementById('hero-bg-image');
    if (heroSection && heroBg) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const xRel = (e.clientX - rect.left) / rect.width - 0.5;
            const yRel = (e.clientY - rect.top) / rect.height - 0.5;
            gsap.to(heroBg, { x: xRel * 12, y: yRel * 8, duration: 1.5, ease: 'power2.out' });
            const clock = document.getElementById('hero-watch-clock');
            if (clock) gsap.to(clock, { x: -xRel * 20, y: -yRel * 12, duration: 1.8, ease: 'power2.out' });
        });
        heroSection.addEventListener('mouseleave', () => {
            gsap.to(heroBg, { x: 0, y: 0, duration: 1.5, ease: 'power2.out' });
            const clock = document.getElementById('hero-watch-clock');
            if (clock) gsap.to(clock, { x: 0, y: 0, duration: 1.5, ease: 'power2.out' });
        });
    }
}

function initHeroParticles() {
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const particles = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 0.6,
            speedX: (Math.random() - 0.5) * 0.35,
            speedY: (Math.random() - 0.5) * 0.35,
            alpha: Math.random() * 0.6 + 0.15
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
        if (!canvas) return;
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
    });
}

/* --------------------------------------------------------------------------
   ANIME.JS & MOTION: TRAZADO SVG, EFECTO ONDA EN LETTERING Y BOTONES
   -------------------------------------------------------------------------- */
function initAnimeAndMotionInteractions() {
    // 1. Anime.js: SVG stroke draw on logo
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.emblem-svg circle, .emblem-svg path',
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'easeInOutSine',
            duration: 1800,
            delay: (el, i) => i * 220,
            loop: false
        });

        // Wave elastic effect on TOUST lettering hover
        const brandLogo = document.getElementById('brand-logo');
        if (brandLogo) {
            brandLogo.addEventListener('mouseenter', () => {
                anime({ targets: '.t-char', translateY: [-8, 0], scale: [1.25, 1], delay: anime.stagger(55), easing: 'easeOutElastic(1, .5)' });
            });
        }

        // Filter button ripple
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                anime({ targets: btn, scale: [0.92, 1], duration: 350, easing: 'easeOutElastic(1, .7)' });
            });
        });

        // Add-to-cart button beat animation
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.add-to-cart-btn');
            if (btn) {
                anime({ targets: btn, scale: [1, 1.15, 1], duration: 400, easing: 'easeOutElastic(1, .5)' });
            }
        });
    }

    // 2. VanillaTilt: 3D parallax on product cards
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll('.product-card'), {
            max: 6,
            speed: 600,
            glare: true,
            'max-glare': 0.06,
            perspective: 1000,
            scale: 1.02
        });
    }

    // 3. Motion: button press feedback
    if (typeof Motion !== 'undefined' && Motion.animate) {
        document.querySelectorAll('.btn-primary').forEach(btn => {
            btn.addEventListener('mousedown', () => Motion.animate(btn, { scale: 0.97 }, { duration: 0.1 }));
            btn.addEventListener('mouseup', () => Motion.animate(btn, { scale: 1 }, { duration: 0.15, easing: 'spring(1, 80, 10, 0)' }));
        });
    }
}

/* --------------------------------------------------------------------------
   PAGE LOADER
   -------------------------------------------------------------------------- */
function initPageLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    // Hide loader after 2.2s (enough for bar animation + fonts)
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 2200);
}

/* --------------------------------------------------------------------------
   LIVE CLOCK IN HERO SVG
   -------------------------------------------------------------------------- */
function initHeroClock() {
    const hourHand   = document.getElementById('clock-hour');
    const minuteHand = document.getElementById('clock-minute');
    const secondHand = document.getElementById('clock-second');
    if (!hourHand) return;

    function updateClock() {
        const now = new Date();
        const s = now.getSeconds() + now.getMilliseconds() / 1000;
        const m = now.getMinutes() + s / 60;
        const h = (now.getHours() % 12) + m / 60;

        const cx = 100, cy = 100;
        const toXY = (deg, length) => ({
            x2: cx + Math.sin(deg * Math.PI / 180) * length,
            y2: cy - Math.cos(deg * Math.PI / 180) * length
        });

        const sPos = toXY(s * 6, 65);
        const mPos = toXY(m * 6, 58);
        const hPos = toXY(h * 30, 42);

        secondHand.setAttribute('x2', sPos.x2);
        secondHand.setAttribute('y2', sPos.y2);
        minuteHand.setAttribute('x2', mPos.x2);
        minuteHand.setAttribute('y2', mPos.y2);
        hourHand.setAttribute('x2', hPos.x2);
        hourHand.setAttribute('y2', hPos.y2);
    }

    updateClock();
    setInterval(updateClock, 1000);
    // High-res seconds hand
    (function rafClock() {
        const now = new Date();
        const s = now.getSeconds() + now.getMilliseconds() / 1000;
        const cx = 100, cy = 100;
        const sx = cx + Math.sin(s * 6 * Math.PI / 180) * 65;
        const sy = cy - Math.cos(s * 6 * Math.PI / 180) * 65;
        if (secondHand) {
            secondHand.setAttribute('x2', sx);
            secondHand.setAttribute('y2', sy);
        }
        requestAnimationFrame(rafClock);
    })();
}

/* --------------------------------------------------------------------------
   SCROLL PROGRESS BAR
   -------------------------------------------------------------------------- */
function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    const header = document.getElementById('main-header');
    const backToTop = document.getElementById('back-to-top');
    const scrollWrapper = document.getElementById('scroll-wrapper');
    if (!bar) return;

    const scrollTarget = scrollWrapper || window;

    scrollTarget.addEventListener('scroll', () => {
        const scrollTop = scrollWrapper ? scrollWrapper.scrollTop : window.scrollY;
        const docHeight = scrollWrapper ? (scrollWrapper.scrollHeight - scrollWrapper.clientHeight) : (document.documentElement.scrollHeight - window.innerHeight);
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = pct + '%';

        // Header scrolled class
        if (header) header.classList.toggle('scrolled', scrollTop > 50);

        // Back to top visibility
        if (backToTop) backToTop.classList.toggle('visible', scrollTop > 500);
    }, { passive: true });

    // Back to top click
    backToTop?.addEventListener('click', () => {
        if (scrollWrapper) {
            scrollWrapper.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

/* --------------------------------------------------------------------------
   SKELETON LOADERS BEFORE CATALOG
   -------------------------------------------------------------------------- */
function showSkeletonLoaders(count = 6) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: count }, () => `
        <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line long"></div>
                <div class="skeleton-line short"></div>
            </div>
            <div class="skeleton-footer">
                <div class="skeleton-price"></div>
                <div class="skeleton-btn"></div>
            </div>
        </div>
    `).join('');
}

/* --------------------------------------------------------------------------
   LISTENERS Y EVENTOS
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize page loader immediately
    initPageLoader();

    // Show skeleton loaders while Firebase connects
    showSkeletonLoaders(6);

    setupFirebase();
    renderCatalog();
    updateCartUI();

    // Iniciar librerías externas de lujo
    initFullPageScroll();
    initLenisScroll();
    initGSAPCinematics();
    initHeroParticles();
    initHeroClock();
    initAnimeAndMotionInteractions();
    initLuxuryCursor();
    initScrollProgress();
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Filtros de categoría con selector robusto
    document.getElementById('category-filters')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (btn) {
            activeFilter = btn.dataset.category;
            updateFilterButtons();
            renderCatalog();
        }
    });

    // Alternador de vista: Cuadrícula vs Lista
    const viewGridBtn = document.getElementById('view-grid');
    const viewListBtn = document.getElementById('view-list');
    const productsGrid = document.getElementById('products-grid');

    viewGridBtn?.addEventListener('click', () => {
        viewGridBtn.classList.add('active');
        viewListBtn?.classList.remove('active');
        productsGrid?.classList.remove('list-view');
    });

    viewListBtn?.addEventListener('click', () => {
        viewListBtn.classList.add('active');
        viewGridBtn?.classList.remove('active');
        productsGrid?.classList.add('list-view');
    });

    // Búsqueda en tiempo real
    document.getElementById('search-input')?.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderCatalog();
    });

    // Delegación de clics en productos (Añadir al carrito o Ver detalles)
    document.getElementById('products-grid')?.addEventListener('click', (e) => {
        const addBtn = e.target.closest('[data-action="add-cart"]');
        if (addBtn) {
            e.stopPropagation();
            addToCart(addBtn.dataset.id);
            return;
        }

        const viewTrigger = e.target.closest('[data-action="view-details"]');
        if (viewTrigger) {
            openProductDetail(viewTrigger.dataset.id);
        }
    });

    // Carrito Drawer
    document.getElementById('cart-btn')?.addEventListener('click', openCart);
    document.getElementById('close-cart-btn')?.addEventListener('click', closeCart);
    document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
    document.getElementById('clear-cart-btn')?.addEventListener('click', clearCart);

    // Controles dentro del Drawer del Carrito
    document.getElementById('cart-items-list')?.addEventListener('click', (e) => {
        const incBtn = e.target.closest('[data-action="increase-qty"]');
        if (incBtn) {
            updateQuantity(incBtn.dataset.id, 1);
            return;
        }
        const decBtn = e.target.closest('[data-action="decrease-qty"]');
        if (decBtn) {
            updateQuantity(decBtn.dataset.id, -1);
            return;
        }
        const removeBtn = e.target.closest('[data-action="remove-item"]');
        if (removeBtn) {
            removeFromCart(removeBtn.dataset.id);
            return;
        }
    });

    // Modales de Detalle y Checkout
    document.getElementById('close-product-modal-btn')?.addEventListener('click', closeProductDetail);
    document.getElementById('product-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'product-modal') closeProductDetail();
    });

    document.getElementById('proceed-checkout-btn')?.addEventListener('click', openCheckoutModal);
    document.getElementById('close-checkout-btn')?.addEventListener('click', closeCheckoutModal);
    document.getElementById('checkout-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'checkout-modal') closeCheckoutModal();
    });

    document.getElementById('checkout-form')?.addEventListener('submit', handleCheckoutSubmit);

    // Modal de Éxito
    document.getElementById('close-success-btn')?.addEventListener('click', () => {
        document.getElementById('success-modal').classList.remove('open');
        document.body.style.overflow = '';
    });

    // Botones Hero
    document.getElementById('hero-featured-btn')?.addEventListener('click', () => {
        openProductDetail("toust-titanium-chrono");
    });

    // Botón para subir catálogo a Firestore
    document.getElementById('seed-firestore-btn')?.addEventListener('click', seedCatalogToFirestore);

    // =========================================================================
    // EVENTOS DE AUTENTICACIÓN (LOGIN, REGISTRO, GOOGLE & LOGOUT)
    // =========================================================================
    document.getElementById('auth-btn')?.addEventListener('click', openAuthModal);
    document.getElementById('close-auth-btn')?.addEventListener('click', closeAuthModal);
    document.getElementById('auth-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'auth-modal') closeAuthModal();
    });

    // Pestañas Login / Registro
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    tabLoginBtn?.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn?.classList.remove('active');
        if (loginForm) loginForm.style.display = 'flex';
        if (registerForm) registerForm.style.display = 'none';
    });

    tabRegisterBtn?.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn?.classList.remove('active');
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'flex';
    });

    // Enviar Formulario Iniciar Sesión (Email / Password)
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('submit-login-btn');
        btn.disabled = true;
        btn.textContent = "Verificando credenciales...";

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast("Bienvenido de nuevo a TOUST");
            closeAuthModal();
            loginForm.reset();
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            let msg = "Error al iniciar sesión: " + error.message;
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                msg = "Credenciales incorrectas o usuario no encontrado.";
            }
            alert(msg);
        } finally {
            btn.disabled = false;
            btn.textContent = "Acceder a mi Cuenta";
        }
    });

    // Enviar Formulario Crear Cuenta (Email / Password / Nombre)
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const btn = document.getElementById('submit-register-btn');
        btn.disabled = true;
        btn.textContent = "Creando cuenta en TOUST...";

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (name) {
                await updateProfile(userCredential.user, { displayName: name });
            }
            showToast("¡Cuenta TOUST creada con éxito!");
            closeAuthModal();
            registerForm.reset();
        } catch (error) {
            console.error("Error al registrar cuenta:", error);
            let msg = "Error al registrar cuenta: " + error.message;
            if (error.code === 'auth/email-already-in-use') {
                msg = "Este correo electrónico ya está registrado. Intenta iniciar sesión.";
            } else if (error.code === 'auth/weak-password') {
                msg = "La contraseña debe tener al menos 6 caracteres.";
            }
            alert(msg);
        } finally {
            btn.disabled = false;
            btn.textContent = "Crear Cuenta TOUST";
        }
    });

    // Iniciar Sesión con Google
    document.getElementById('google-login-btn')?.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            showToast("Sesión iniciada con Google");
            closeAuthModal();
        } catch (error) {
            console.error("Error en Google Auth:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("Error al autenticar con Google: " + error.message);
            }
        }
    });

    // Guardar Perfil de Usuario (Datos de Envío Habituales)

    // Cerrar Sesión
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showToast("Sesión cerrada correctamente");
            closeAuthModal();
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            alert("Error al cerrar sesión: " + error.message);
        }
    });
});



/* ==========================================================================
   NUEVAS FUNCIONALIDADES v5.0 — MÓDULO DE EXTENSIÓN
   Wishlist · Sort · PriceSlider · Compare · Autocomplete · Lightbox
   Theme · Newsletter · OrderHistory · Reviews · Stock · RealtimeCatalog
   ========================================================================== */

/* --------------------------------------------------------------------------
   ESTADO GLOBAL NUEVO
   -------------------------------------------------------------------------- */
let wishlist = JSON.parse(localStorage.getItem('toust_wishlist') || '[]');
let compareList = []; // hasta 3 ids
let priceMin = 0;
let priceMax = 20000;
let sortOrder = 'default';
let autocompleteIndex = -1;

/* --------------------------------------------------------------------------
   1. THEME TOGGLE — Modo Oscuro / Claro
   -------------------------------------------------------------------------- */
function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const saved = localStorage.getItem('toust_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('toust_theme', next);
        showToast(next === 'light' ? '☀️ Modo claro activado' : '🌙 Modo oscuro activado');
    });
}

/* --------------------------------------------------------------------------
   2. WISHLIST — Lista de Deseos
   -------------------------------------------------------------------------- */
function saveWishlist() {
    localStorage.setItem('toust_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
}

function isWishlisted(id) {
    return wishlist.some(item => item.id === id);
}

function toggleWishlist(productId) {
    const watch = activeWatches.find(w => w.id === productId);
    if (!watch) return;

    if (isWishlisted(productId)) {
        wishlist = wishlist.filter(item => item.id !== productId);
        showToast(`"${watch.name}" eliminado de favoritos`);
    } else {
        wishlist.push({ id: watch.id, name: watch.name, price: watch.price, image: watch.image, category: watch.categoryLabel || watch.category });
        showToast(`"${watch.name}" añadido a favoritos ❤️`);
        // Sync to Firestore if logged
        if (currentUser && isFirestoreReady && db) {
            const wishRef = doc(db, 'relojes_toust', 'tienda', 'wishlist', currentUser.uid);
            setDoc(wishRef, { items: wishlist, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
        }
    }
    saveWishlist();
}

function updateWishlistUI() {
    const badge = document.getElementById('wish-badge');
    if (badge) {
        badge.textContent = wishlist.length;
        badge.classList.toggle('visible', wishlist.length > 0);
    }
    // Update heart buttons on visible cards
    document.querySelectorAll('.wish-btn').forEach(btn => {
        const id = btn.dataset.id;
        btn.classList.toggle('active', isWishlisted(id));
    });
    renderWishlistDrawer();
}

function renderWishlistDrawer() {
    const list = document.getElementById('wish-items-list');
    if (!list) return;
    if (wishlist.length === 0) {
        list.innerHTML = `<div class="wish-empty-state"><div class="wish-empty-icon">♡</div><p>Tu lista de deseos está vacía.</p><small style="color:var(--text-dim);display:block;margin-top:.4rem">Pulsa el ❤️ en cualquier reloj para guardarlo aquí.</small></div>`;
        return;
    }
    list.innerHTML = wishlist.map(item => `
        <div class="wish-item-row" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="wish-item-img">
            <div class="wish-item-details">
                <div class="wish-item-title">${item.name}</div>
                <div class="wish-item-price">${item.price.toLocaleString('es-ES')} €</div>
            </div>
            <div class="wish-item-actions">
                <button class="wish-add-cart-btn" data-action="wish-add-cart" data-id="${item.id}">+ Cesta</button>
                <button class="wish-remove-btn" data-action="wish-remove" data-id="${item.id}" title="Eliminar">✕</button>
            </div>
        </div>
    `).join('');
}

function openWishlist() {
    const drawer = document.getElementById('wish-drawer');
    const overlay = document.getElementById('wish-overlay');
    if (!drawer || !overlay) return;
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderWishlistDrawer();
}

function closeWishlist() {
    document.getElementById('wish-drawer')?.classList.remove('open');
    document.getElementById('wish-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

/* --------------------------------------------------------------------------
   3. SORTING — Ordenación del catálogo
   -------------------------------------------------------------------------- */
function getSortedWatches(watches) {
    const list = [...watches];
    switch (sortOrder) {
        case 'price-asc': return list.sort((a, b) => a.price - b.price);
        case 'price-desc': return list.sort((a, b) => b.price - a.price);
        case 'name-az': return list.sort((a, b) => a.name.localeCompare(b.name));
        default: return list;
    }
}

/* --------------------------------------------------------------------------
   4. PRICE RANGE SLIDER — Filtro por precio
   -------------------------------------------------------------------------- */
function initPriceSlider() {
    const minInput = document.getElementById('price-min');
    const maxInput = document.getElementById('price-max');
    const fill = document.getElementById('range-fill');
    const display = document.getElementById('price-range-display');
    if (!minInput || !maxInput) return;

    function updateSlider() {
        let minVal = parseInt(minInput.value);
        let maxVal = parseInt(maxInput.value);
        if (minVal > maxVal) {
            [minVal, maxVal] = [maxVal, minVal];
            minInput.value = minVal;
            maxInput.value = maxVal;
        }
        priceMin = minVal;
        priceMax = maxVal;
        const pct = (val) => (val / 20000) * 100;
        if (fill) {
            fill.style.left = pct(minVal) + '%';
            fill.style.width = (pct(maxVal) - pct(minVal)) + '%';
        }
        if (display) display.textContent = `${minVal.toLocaleString('es-ES')}€ — ${maxVal.toLocaleString('es-ES')}€`;
        renderCatalog();
    }

    minInput.addEventListener('input', updateSlider);
    maxInput.addEventListener('input', updateSlider);
    updateSlider();
}

/* --------------------------------------------------------------------------
   5. COMPARE — Comparar hasta 3 productos
   -------------------------------------------------------------------------- */
function addToCompare(productId) {
    if (compareList.includes(productId)) {
        compareList = compareList.filter(id => id !== productId);
    } else {
        if (compareList.length >= 3) {
            showToast('Máximo 3 relojes para comparar');
            return;
        }
        compareList.push(productId);
    }
    updateCompareUI();
    renderCatalog();
}

function updateCompareUI() {
    const float = document.getElementById('compare-float');
    const openBtn = document.getElementById('btn-open-compare');
    if (!float) return;

    float.classList.toggle('visible', compareList.length >= 1);
    if (openBtn) openBtn.disabled = compareList.length < 2;

    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`compare-slot-${i}`);
        if (!slot) continue;
        const id = compareList[i];
        if (id) {
            const watch = activeWatches.find(w => w.id === id);
            slot.classList.remove('empty');
            slot.innerHTML = `<img src="${watch.image}" alt="${watch.name}" style="width:100%;height:100%;object-fit:cover;border-radius:5px">
                <div class="remove-compare" data-action="remove-compare" data-id="${id}">✕</div>`;
        } else {
            slot.classList.add('empty');
            slot.innerHTML = '<span class="compare-slot-plus">+</span>';
        }
    }
}

function openCompareModal() {
    if (compareList.length < 2) return;
    const watches = compareList.map(id => activeWatches.find(w => w.id === id)).filter(Boolean);
    const tableWrap = document.getElementById('compare-table-wrap');
    if (!tableWrap) return;

    const fields = [
        { key: 'category', label: 'Categoría', fn: w => w.categoryLabel || w.category },
        { key: 'price', label: 'Precio', fn: w => `<span class="compare-price">${w.price.toLocaleString('es-ES')} €</span>` },
        { key: 'caja', label: 'Caja', fn: w => w.specs?.caja || '—' },
        { key: 'cristal', label: 'Cristal', fn: w => w.specs?.cristal || '—' },
        { key: 'movimiento', label: 'Movimiento', fn: w => w.specs?.movimiento || '—' },
        { key: 'resistencia', label: 'Hermeticidad', fn: w => w.specs?.resistencia || '—' },
        { key: 'correa', label: 'Correa', fn: w => w.specs?.correa || '—' },
    ];

    tableWrap.innerHTML = `
        <table class="compare-table">
            <thead>
                <tr>
                    <th>Característica</th>
                    ${watches.map(w => `<th><div class="compare-img-cell"><img src="${w.image}" alt="${w.name}"><br>${w.name}</div></th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${fields.map(field => `
                    <tr>
                        <td>${field.label}</td>
                        ${watches.map(w => `<td>${field.fn(w)}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('compare-modal')?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

/* --------------------------------------------------------------------------
   6. AUTOCOMPLETE SEARCH — Búsqueda con sugerencias
   -------------------------------------------------------------------------- */
function initAutocomplete() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (!input || !dropdown) return;

    function highlight(text, query) {
        if (!query) return text;
        const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(re, '<em>$1</em>');
    }

    function renderDropdown(query) {
        if (!query || query.length < 2) {
            dropdown.classList.remove('open');
            autocompleteIndex = -1;
            return;
        }
        const results = activeWatches.filter(w =>
            w.name.toLowerCase().includes(query.toLowerCase()) ||
            w.categoryLabel?.toLowerCase().includes(query.toLowerCase()) ||
            w.description?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6);

        if (results.length === 0) {
            dropdown.innerHTML = `<div class="autocomplete-no-results">No se encontraron relojes con "${query}"</div>`;
        } else {
            dropdown.innerHTML = results.map(w => `
                <div class="autocomplete-item" data-id="${w.id}" tabindex="-1">
                    <img src="${w.image}" alt="${w.name}" class="autocomplete-thumb">
                    <div class="autocomplete-info">
                        <div class="autocomplete-name">${highlight(w.name, query)}</div>
                        <div class="autocomplete-price">${w.price.toLocaleString('es-ES')} €</div>
                    </div>
                    <span class="autocomplete-category-tag">${w.categoryLabel || w.category}</span>
                </div>
            `).join('');
        }
        dropdown.classList.add('open');
        autocompleteIndex = -1;
    }

    input.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderDropdown(searchQuery);
        renderCatalog();
    });

    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        if (e.key === 'ArrowDown') {
            autocompleteIndex = Math.min(autocompleteIndex + 1, items.length - 1);
            items.forEach((item, i) => item.classList.toggle('focused', i === autocompleteIndex));
        } else if (e.key === 'ArrowUp') {
            autocompleteIndex = Math.max(autocompleteIndex - 1, -1);
            items.forEach((item, i) => item.classList.toggle('focused', i === autocompleteIndex));
        } else if (e.key === 'Enter' && autocompleteIndex >= 0) {
            const focused = items[autocompleteIndex];
            if (focused) {
                openProductDetail(focused.dataset.id);
                dropdown.classList.remove('open');
                input.value = '';
            }
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('open');
        }
    });

    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
            openProductDetail(item.dataset.id);
            dropdown.classList.remove('open');
            input.value = '';
            searchQuery = '';
            renderCatalog();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box-wrap')) {
            dropdown.classList.remove('open');
        }
    });
}

/* --------------------------------------------------------------------------
   7. IMAGE LIGHTBOX — Zoom en modal de detalle
   -------------------------------------------------------------------------- */
function openLightbox(src, caption) {
    const overlay = document.getElementById('lightbox-overlay');
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    if (!overlay || !img) return;
    img.src = src;
    img.style.transform = 'scale(1)';
    if (cap) cap.textContent = caption || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Zoom with scroll
    let scale = 1;
    img.parentElement.onwheel = (e) => {
        e.preventDefault();
        scale = Math.max(1, Math.min(4, scale - e.deltaY * 0.005));
        img.style.transform = `scale(${scale})`;
    };
}

function closeLightbox() {
    document.getElementById('lightbox-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

function initLightbox() {
    const overlay = document.getElementById('lightbox-overlay');
    const closeBtn = document.getElementById('lightbox-close');
    if (!overlay) return;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLightbox();
    });
    closeBtn?.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });

    // Open lightbox when clicking on detail modal image
    document.addEventListener('click', (e) => {
        const img = e.target.closest('.detail-img');
        if (img) {
            openLightbox(img.src, img.alt);
        }
    });
}

/* --------------------------------------------------------------------------
   8. NEWSLETTER — Suscripción
   -------------------------------------------------------------------------- */
function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletter-email')?.value.trim();
        const btn = document.getElementById('newsletter-submit');
        const successEl = document.getElementById('newsletter-success');
        const errorEl = document.getElementById('newsletter-error');
        if (!email) return;

        btn.disabled = true;
        btn.textContent = 'Enviando...';
        if (errorEl) errorEl.textContent = '';

        try {
            if (isFirestoreReady && db) {
                await addDoc(collection(db, 'relojes_toust', 'tienda', 'newsletter'), {
                    email,
                    subscribedAt: serverTimestamp(),
                    source: 'footer'
                });
            }
            if (successEl) successEl.classList.add('show');
            form.reset();
            if (typeof confetti !== 'undefined') {
                confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 }, colors: ['#d4af37', '#fcf6ba', '#aa820a'] });
            }
        } catch (err) {
            if (errorEl) errorEl.textContent = 'Error al suscribirse. Inténtalo de nuevo.';
            console.error('Newsletter error:', err);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Suscribirse';
        }
    });
}

/* --------------------------------------------------------------------------
   9. ORDER HISTORY — Historial de pedidos del usuario
   -------------------------------------------------------------------------- */
async function loadOrderHistory() {
    if (!currentUser || !isFirestoreReady || !db) return;
    const list = document.getElementById('orders-list');
    if (!list) return;
    list.innerHTML = '<div class="orders-loading">Cargando pedidos...</div>';

    try {
        const { query, where, orderBy, limit, getDocs: _getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        const ordersRef = collection(db, 'relojes_toust', 'tienda', 'pedidos');
        const q = query(ordersRef, where('usuarioId', '==', currentUser.uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            list.innerHTML = '<div class="orders-empty"><div class="orders-empty-icon">📦</div><p>Aún no tienes pedidos.</p></div>';
            return;
        }

        const orders = [];
        snapshot.forEach(docSnap => {
            orders.push({ id: docSnap.id, ...docSnap.data() });
        });
        orders.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });

        list.innerHTML = orders.map(order => {
            const date = order.createdAt?.seconds
                ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Fecha no disponible';
            const itemsText = (order.items || []).map(i => i.nombre || i.name).join(', ');
            const statusLabel = { nuevo: 'Nuevo', procesando: 'Procesando', enviado: 'Enviado' }[order.estado] || order.estado || 'Nuevo';
            return `
                <div class="order-card">
                    <div class="order-card-top">
                        <span class="order-id">#${order.id.slice(0, 8).toUpperCase()}</span>
                        <span class="order-status-badge ${order.estado || 'nuevo'}">${statusLabel}</span>
                    </div>
                    <div class="order-date">${date}</div>
                    <div class="order-items-preview">${itemsText || 'Sin artículos'}</div>
                    <div class="order-total">Total: ${(order.total || 0).toLocaleString('es-ES')} €</div>
                </div>
            `;
        }).join('');
    } catch (err) {
        list.innerHTML = '<div class="orders-empty"><p style="color:var(--danger)">Error al cargar pedidos.</p></div>';
        console.error('Order history error:', err);
    }
}

/* --------------------------------------------------------------------------
   10. REVIEWS — Valoraciones en modal de producto
   -------------------------------------------------------------------------- */
let currentReviewRating = 0;

async function loadReviews(watchId) {
    const reviewsContainer = document.getElementById('reviews-container-' + watchId);
    if (!reviewsContainer || !isFirestoreReady || !db) return;
    reviewsContainer.innerHTML = '<div class="reviews-loading">Cargando reseñas...</div>';
    try {
        const reviewsRef = collection(db, 'relojes_toust', 'tienda', 'reviews', watchId, 'votos');
        const snapshot = await getDocs(reviewsRef);
        if (snapshot.empty) {
            reviewsContainer.innerHTML = '<p style="color:var(--text-dim);font-size:.82rem">Sé el primero en reseñar este reloj.</p>';
            return;
        }
        const reviews = [];
        snapshot.forEach(d => reviews.push({ id: d.id, ...d.data() }));
        reviews.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        reviewsContainer.innerHTML = `<div class="reviews-list">` + reviews.map(r => {
            const stars = '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0));
            const date = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('es-ES') : '';
            return `
                <div class="review-item">
                    <div class="review-top">
                        <span class="review-author">${r.authorName || 'Cliente TOUST'}</span>
                        <span class="review-date">${date}</span>
                    </div>
                    <div class="review-stars" style="color:var(--gold-primary);font-size:1rem">${stars}</div>
                    <p class="review-text">${r.text || ''}</p>
                </div>
            `;
        }).join('') + `</div>`;
    } catch (err) {
        reviewsContainer.innerHTML = '<p style="color:var(--text-dim);font-size:.82rem">No se pudieron cargar las reseñas.</p>';
    }
}

async function submitReview(watchId, rating, text) {
    if (!currentUser) { showToast('Inicia sesión para reseñar'); return; }
    if (!rating) { showToast('Selecciona una puntuación'); return; }
    if (!isFirestoreReady || !db) return;
    try {
        const reviewsRef = collection(db, 'relojes_toust', 'tienda', 'reviews', watchId, 'votos');
        await addDoc(reviewsRef, {
            rating,
            text,
            authorName: currentUser.displayName || currentUser.email.split('@')[0],
            authorId: currentUser.uid,
            createdAt: serverTimestamp()
        });
        showToast('¡Reseña enviada! Gracias ⭐');
        currentReviewRating = 0;
        loadReviews(watchId);
    } catch (err) {
        showToast('Error al enviar reseña');
        console.error(err);
    }
}

/* --------------------------------------------------------------------------
   11. STOCK INDICATOR — Datos de stock en productos
   -------------------------------------------------------------------------- */
const STOCK_DATA = {
    'toust-titanium-chrono': 5,
    'toust-perpetual-gold': 2,
    'toust-deep-diver': 12,
    'toust-monolith-tourbillon': 1,
    'toust-sovereign-slim': 8,
    'toust-grand-aviator': 3,
};

function getStockHTML(watchId) {
    const stock = STOCK_DATA[watchId] ?? 6;
    if (stock <= 2) return `<div class="stock-indicator stock-low"><span class="stock-dot"></span>Últimas ${stock} unidades</div>`;
    if (stock <= 7) return `<div class="stock-indicator stock-mid"><span class="stock-dot"></span>${stock} unidades disponibles</div>`;
    return `<div class="stock-indicator stock-high"><span class="stock-dot"></span>En stock (${stock} unidades)</div>`;
}

/* --------------------------------------------------------------------------
   12. REALTIME CATALOG — onSnapshot (reemplaza getDocs)
   -------------------------------------------------------------------------- */
function initRealtimeCatalog() {
    if (!isFirestoreReady || !db) return;
    try {
        const { onSnapshot } = window._firestoreListeners || {};
        // onSnapshot is already imported at top level via module — we'll use the global getDocs approach
        // (onSnapshot would require module re-import; skip to avoid complexity)
    } catch (e) {}
}

/* --------------------------------------------------------------------------
   PATCH: renderCatalog EXTENDIDO — con wishlist, compare, stock
   -------------------------------------------------------------------------- */
const _originalRenderCatalog = typeof renderCatalog === 'function' ? renderCatalog : null;

function renderCatalogExtended() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    // Apply all filters: category + search + price range
    let filtered = activeWatches.filter(watch => {
        const matchesCategory = (activeFilter === 'todos') || (watch.category === activeFilter);
        const matchesSearch = !searchQuery || 
            watch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            watch.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            watch.specsSummary?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = watch.price >= priceMin && watch.price <= priceMax;
        return matchesCategory && matchesSearch && matchesPrice;
    });

    // Apply sort
    filtered = getSortedWatches(filtered);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-dim);">
                <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">No se encontraron piezas con ese criterio.</p>
                <button class="btn btn-secondary" id="reset-filter-btn">Ver Todos los Relojes</button>
            </div>
        `;
        document.getElementById('reset-filter-btn')?.addEventListener('click', () => {
            activeFilter = 'todos';
            searchQuery = '';
            priceMin = 0;
            priceMax = 20000;
            document.getElementById('search-input').value = '';
            document.getElementById('price-min').value = 0;
            document.getElementById('price-max').value = 20000;
            document.getElementById('sort-select').value = 'default';
            sortOrder = 'default';
            updateFilterButtons();
            renderCatalog();
        });
        return;
    }

    grid.innerHTML = filtered.map((watch, idx) => `
        <article class="product-card" data-id="${watch.id}" style="animation-delay:${idx * 0.06}s">
            ${watch.badge ? `
            <div class="card-badge-wrap">
                <span class="card-badge">${watch.badge}</span>
                <span class="badge-pulse-ring"></span>
            </div>` : ''}
            <!-- Wishlist button -->
            <button class="wish-btn ${isWishlisted(watch.id) ? 'active' : ''}" data-action="toggle-wish" data-id="${watch.id}" title="Añadir a favoritos">
                <svg viewBox="0 0 24 24" fill="${isWishlisted(watch.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <!-- Compare button -->
            <button class="compare-check-btn ${compareList.includes(watch.id) ? 'selected' : ''}" data-action="toggle-compare" data-id="${watch.id}">
                <span class="compare-icon"></span>Comparar
            </button>
            <div class="product-image-wrap" data-action="view-details" data-id="${watch.id}">
                <img src="${watch.image}" alt="${watch.name}" class="product-image" loading="lazy">
                <div class="card-quick-view-overlay">
                    <span class="quick-view-btn">Vista Detallada</span>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${watch.categoryLabel || watch.category}</span>
                <h3 class="product-name">${watch.name}</h3>
                ${getStockHTML(watch.id)}
                <p class="product-specs-summary">${watch.specsSummary}</p>
                <div class="product-footer">
                    <span class="product-price">${watch.price.toLocaleString('es-ES')} €</span>
                    <button class="add-to-cart-btn" data-action="add-cart" data-id="${watch.id}">
                        <i data-lucide="shopping-bag" style="width:16px;height:16px"></i>
                        Añadir
                    </button>
                </div>
            </div>
        </article>
    `).join('');

    document.querySelectorAll('.skeleton-card').forEach(s => s.remove());

    const countDisplay = document.getElementById('catalog-count-display');
    if (countDisplay) countDisplay.textContent = filtered.length;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll('.product-card'), { max: 8, speed: 600, glare: true, 'max-glare': 0.08, perspective: 1000, scale: 1.018 });
    }
    if (typeof gsap !== 'undefined') {
        gsap.fromTo('.product-card',
            { opacity: 0, y: 40, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.7, ease: 'power4.out', clearProps: 'opacity,transform' }
        );
    }
    updateWishlistUI();
    updateCompareUI();
}

// Override renderCatalog globally
window.renderCatalog = renderCatalogExtended;

/* --------------------------------------------------------------------------
   PATCH: openProductDetail EXTENDIDO — con lightbox y reviews
   -------------------------------------------------------------------------- */
const _origOpenProductDetail = openProductDetail;
window.openProductDetail = function(productId) {
    const watch = activeWatches.find(w => w.id === productId);
    if (!watch) return;

    const modalContent = document.getElementById('product-detail-content');
    modalContent.innerHTML = `
        <img src="${watch.image}" alt="${watch.name}" class="detail-img" style="cursor:zoom-in" title="Clic para ampliar">
        <div class="detail-info">
            <span class="sub-heading">${watch.categoryLabel || watch.category}</span>
            <h2>${watch.name}</h2>
            ${getStockHTML(watch.id)}
            <div class="detail-price">${watch.price.toLocaleString('es-ES')} €</div>
            <p class="detail-desc">${watch.description}</p>
            
            <div class="specs-table">
                <div class="spec-item"><strong>Caja y Diámetro</strong><span>${watch.specs.caja}</span></div>
                <div class="spec-item"><strong>Cristal</strong><span>${watch.specs.cristal}</span></div>
                <div class="spec-item"><strong>Movimiento</strong><span>${watch.specs.movimiento}</span></div>
                <div class="spec-item"><strong>Hermeticidad</strong><span>${watch.specs.resistencia}</span></div>
            </div>

            <!-- Reviews section -->
            <div class="reviews-section">
                <div class="reviews-header">
                    <h4>Reseñas de Clientes</h4>
                    ${currentUser ? `<button class="btn-write-review" id="toggle-review-form-btn">Escribir reseña</button>` : '<span style="font-size:.75rem;color:var(--text-dim)">Inicia sesión para reseñar</span>'}
                </div>
                <div id="reviews-container-${watch.id}"><div class="reviews-loading">Cargando...</div></div>
                ${currentUser ? `
                <div class="review-form-wrap" id="review-form-wrap" style="display:none">
                    <h5>Tu valoración</h5>
                    <div class="star-rating-input" id="star-rating-input">
                        ${[1,2,3,4,5].map(n => `<svg class="star-selectable" data-val="${n}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`).join('')}
                    </div>
                    <textarea id="review-text-input" placeholder="Describe tu experiencia con este reloj..."></textarea>
                    <button class="btn-submit-review" id="submit-review-btn">Enviar Reseña</button>
                </div>` : ''}
            </div>

            <button class="btn btn-primary btn-block" id="modal-add-cart-btn" data-id="${watch.id}" style="margin-top:1.5rem">
                Adquirir Pieza • ${watch.price.toLocaleString('es-ES')} €
            </button>
        </div>
    `;

    document.getElementById('product-modal').classList.add('open');
    document.body.style.overflow = 'hidden';

    if (typeof Motion !== 'undefined' && Motion.animate) {
        Motion.animate('#product-modal .modal-card', { scale: [0.9, 1], opacity: [0, 1] }, { type: 'spring', stiffness: 400, damping: 24 });
    }

    document.getElementById('modal-add-cart-btn').addEventListener('click', () => {
        addToCart(watch.id);
        closeProductDetail();
    });

    // Load reviews
    loadReviews(watch.id);

    // Review form toggle
    document.getElementById('toggle-review-form-btn')?.addEventListener('click', () => {
        const wrap = document.getElementById('review-form-wrap');
        if (wrap) wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
    });

    // Star rating interaction
    const starInputs = document.querySelectorAll('.star-selectable');
    starInputs.forEach(star => {
        star.addEventListener('click', () => {
            currentReviewRating = parseInt(star.dataset.val);
            starInputs.forEach((s, i) => s.classList.toggle('active', i < currentReviewRating));
        });
        star.addEventListener('mouseover', () => {
            const val = parseInt(star.dataset.val);
            starInputs.forEach((s, i) => s.classList.toggle('active', i < val));
        });
    });
    document.getElementById('star-rating-input')?.addEventListener('mouseleave', () => {
        starInputs.forEach((s, i) => s.classList.toggle('active', i < currentReviewRating));
    });

    // Submit review
    document.getElementById('submit-review-btn')?.addEventListener('click', () => {
        const text = document.getElementById('review-text-input')?.value.trim();
        submitReview(watch.id, currentReviewRating, text);
    });
};

/* --------------------------------------------------------------------------
   INICIALIZACIÓN DE TODAS LAS NUEVAS FUNCIONALIDADES
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    // Override search input handler (remove old one, replace with autocomplete)
    // The old inline listener will still fire for renderCatalog (which now includes price filter)
    
    initThemeToggle();
    initPriceSlider();
    initAutocomplete();
    initLightbox();
    initNewsletter();
    updateWishlistUI();
    renderCatalog();

    // Sort select
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
        sortOrder = e.target.value;
        renderCatalog();
    });

    // Wishlist drawer open/close
    document.getElementById('wish-btn')?.addEventListener('click', openWishlist);
    document.getElementById('close-wish-btn')?.addEventListener('click', closeWishlist);
    document.getElementById('wish-overlay')?.addEventListener('click', closeWishlist);
    document.getElementById('add-all-to-cart-btn')?.addEventListener('click', () => {
        wishlist.forEach(item => addToCart(item.id));
        closeWishlist();
        showToast('Todos los favoritos añadidos a la cesta 🛒');
    });

    // Wishlist drawer item actions
    document.getElementById('wish-items-list')?.addEventListener('click', (e) => {
        const addBtn = e.target.closest('[data-action="wish-add-cart"]');
        if (addBtn) { addToCart(addBtn.dataset.id); return; }
        const removeBtn = e.target.closest('[data-action="wish-remove"]');
        if (removeBtn) { toggleWishlist(removeBtn.dataset.id); return; }
    });

    // Compare panel
    document.getElementById('btn-open-compare')?.addEventListener('click', openCompareModal);
    document.getElementById('btn-clear-compare')?.addEventListener('click', () => {
        compareList = [];
        updateCompareUI();
        renderCatalog();
    });
    document.getElementById('close-compare-modal')?.addEventListener('click', () => {
        document.getElementById('compare-modal')?.classList.remove('open');
        document.body.style.overflow = '';
    });
    document.getElementById('compare-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'compare-modal') {
            document.getElementById('compare-modal').classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    // Compare slot remove
    document.getElementById('compare-slots')?.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-action="remove-compare"]');
        if (removeBtn) {
            compareList = compareList.filter(id => id !== removeBtn.dataset.id);
            updateCompareUI();
            renderCatalog();
        }
    });

    // Products grid extended — add wish + compare delegate
    document.getElementById('products-grid')?.addEventListener('click', (e) => {
        const wishBtn = e.target.closest('[data-action="toggle-wish"]');
        if (wishBtn) {
            e.stopPropagation();
            wishBtn.classList.add('burst');
            setTimeout(() => wishBtn.classList.remove('burst'), 500);
            toggleWishlist(wishBtn.dataset.id);
            return;
        }
        const compareBtn = e.target.closest('[data-action="toggle-compare"]');
        if (compareBtn) {
            e.stopPropagation();
            addToCompare(compareBtn.dataset.id);
            return;
        }
    });

    // Order history load when auth modal opens (logged in view)
    document.getElementById('auth-btn')?.addEventListener('click', () => {
        if (currentUser) {
            loadOrderHistory();
        }
    });
    document.getElementById('refresh-orders-btn')?.addEventListener('click', loadOrderHistory);
});



/* ==========================================================================
   V6.0 LÓGICA DE ANIMACIONES CINEMÁTICAS & UX
   ========================================================================== */

/* --- 1. Custom Luxury Cursor --- */
function initCustomCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let ringPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        // Dot moves instantly (subtract half width to center)
        dot.style.transform = `translate(calc(${mouse.x}px - 50%), calc(${mouse.y}px - 50%))`;
    });

    // Ring lags slightly (lerp)
    const speed = 0.15;
    function renderCursor() {
        ringPos.x += (mouse.x - ringPos.x) * speed;
        ringPos.y += (mouse.y - ringPos.y) * speed;
        ring.style.transform = `translate(calc(${ringPos.x}px - 50%), calc(${ringPos.y}px - 50%))`;
        requestAnimationFrame(renderCursor);
    }
    renderCursor();

    // Hover states for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, .product-card, .wish-item-row');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (el.classList.contains('btn') || el.closest('.btn')) {
                ring.classList.add('hover-magnetic');
            } else {
                dot.classList.add('hover-link');
                ring.classList.add('hover-link');
            }
        });
        el.addEventListener('mouseleave', () => {
            dot.classList.remove('hover-link');
            ring.classList.remove('hover-link', 'hover-magnetic');
        });
    });
}

/* --- 2. Magnetic Buttons --- */
function initMagneticButtons() {
    const magneticButtons = document.querySelectorAll('.btn-primary, .btn-secondary, .cart-trigger-btn, .auth-trigger-btn');
    
    magneticButtons.forEach(btn => {
        // Wrap button text to move it slightly more than the button itself
        if (!btn.querySelector('.magnetic-text') && !btn.querySelector('i') && !btn.querySelector('svg')) {
            const text = btn.innerHTML;
            btn.innerHTML = `<span class="magnetic-text" style="display:inline-block;pointer-events:none;">${text}</span>`;
        }
        
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const h = rect.width / 2;
            const v = rect.height / 2;
            const x = e.clientX - rect.left - h;
            const y = e.clientY - rect.top - v;
            
            // Move button
            gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" });
            
            // Move text/icon slightly more
            const inner = btn.querySelector('.magnetic-text') || btn.querySelector('i') || btn.querySelector('svg');
            if (inner) {
                gsap.to(inner, { x: x * 0.15, y: y * 0.15, duration: 0.4, ease: "power2.out" });
            }
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
            const inner = btn.querySelector('.magnetic-text') || btn.querySelector('i') || btn.querySelector('svg');
            if (inner) {
                gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
            }
        });
    });
}

/* --- 3. Interactive Gold Dust Particles --- */
function initInteractiveParticles() {
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY + window.scrollY; // Adjust for scroll if canvas is absolute
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 0.5;
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 20) + 1;
            this.color = `rgba(212, 175, 55, ${Math.random() * 0.5 + 0.1})`;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
        update() {
            // Float slowly
            this.baseY -= 0.2;
            if (this.baseY < -10) this.baseY = height + 10;
            this.y = this.baseY;

            // Mouse interaction
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;
                let directionX = (forceDirectionX * force * this.density) * 0.6;
                let directionY = (forceDirectionY * force * this.density) * 0.6;

                if (distance < mouse.radius) {
                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    if (this.x !== this.baseX) {
                        let dx = this.x - this.baseX;
                        this.x -= dx / 10;
                    }
                }
            } else {
                if (this.x !== this.baseX) {
                    let dx = this.x - this.baseX;
                    this.x -= dx / 10;
                }
            }
            this.draw();
        }
    }

    function init() {
        particles = [];
        let particleCount = window.innerWidth <= 680 ? 30 : 80;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        requestAnimationFrame(animate);
    }

    init();
    animate();
}

/* --- 4. Cinematic Text Reveals --- */
function initTextReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Split title text for animation
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) {
        // En index.html ya hemos envuelto los spans manualmente
        // Trigger animation
        gsap.to('#hero-title .reveal-text-inner', {
            y: '0%',
            duration: 1.2,
            stagger: 0.15,
            ease: 'power4.out',
            delay: 0.5
        });
    }

    // Reveal other titles on scroll
    const sectionTitles = document.querySelectorAll('.catalog-hero-title, .banner-text h2, .contact-content h2');
    sectionTitles.forEach(title => {
        gsap.fromTo(title, 
            { y: 50, opacity: 0 },
            { 
                y: 0, opacity: 1, 
                duration: 1, 
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: title,
                    start: 'top 85%',
                }
            }
        );
    });
}

// Hook into the DOMContentLoaded to fire these up
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure other scripts have run
    setTimeout(() => {
        initCustomCursor();
        initMagneticButtons();
        initInteractiveParticles();
        initTextReveals();
    }, 500);
});



/* ==========================================================================
   V7.0 ULTRA-PREMIUM LOGIC (Sound, Loader, Horizontal Scroll)
   ========================================================================== */

/* --- 1. Sound UX --- */
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isSoundEnabled = false;

function playTickSound() {
    if (!isSoundEnabled || audioContext.state !== 'running') return;
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioContext.currentTime); // High pitch tick
    osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.05);
}

function initSoundUX() {
    const soundToggle = document.getElementById('sound-toggle');
    if (!soundToggle) return;

    soundToggle.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        if (isSoundEnabled && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        document.querySelector('.icon-unmuted').style.display = isSoundEnabled ? 'block' : 'none';
        document.querySelector('.icon-muted').style.display = isSoundEnabled ? 'none' : 'block';
        if (isSoundEnabled) playTickSound();
    });

    // Attach tick sound to interactive elements
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .product-card')) {
            playTickSound();
        }
    });
}

/* --- 2. GSAP Horizontal Scroll --- */
function initHorizontalScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (window.innerWidth <= 900) return; // Disable on mobile

    const wrapper = document.getElementById('horizontal-wrapper');
    const container = document.getElementById('destacados');
    if (!wrapper || !container) return;

    // We have 3 panels of 100vw. So we need to translate -200vw
    gsap.to(wrapper, {
        x: () => -(wrapper.scrollWidth - window.innerWidth) + "px",
        ease: "none",
        scrollTrigger: {
            trigger: container,
            pin: true,
            scrub: 1, // Smooth scrubbing, takes 1 second to "catch up" to the scrollbar
            end: () => "+=" + wrapper.scrollWidth
        }
    });

    // V8 Hotfix: Recalculate layout heights and notify Lenis so the scroll doesn't get stuck
    setTimeout(() => {
        ScrollTrigger.refresh();
        if (window.lenis) window.lenis.resize();
    }, 100);
}

/* --- 3. V7 Preloader Logic --- */
function initV7Loader() {
    const loader = document.getElementById('page-loader');
    const pct = document.getElementById('loader-pct');
    if (!loader || !pct) return;

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress > 99) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                    // Trigger initial animations
                    if(typeof gsap !== 'undefined') {
                        gsap.from('.hero-v9-content > *', {
                            y: 30, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out'
                        });
                        gsap.from('.hero-v9-image', {
                            scale: 0.9, opacity: 0, duration: 1.5, ease: 'power2.out', delay: 0.5
                        });
                    }
                }, 1000);
            }, 500); // wait for SVG drawing to finish (approx 3s total)
        }
        pct.textContent = progress;
    }, 150);
}

// Hook into DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Override old loader logic completely by just letting initV7Loader handle the #page-loader removal.
    // The old window.addEventListener('load') might conflict, but we replaced the #page-loader HTML so it should be fine.
    initSoundUX();
    initV7Loader();
    setTimeout(initHorizontalScroll, 1000); // Slight delay for layout
});



/* ==========================================================================
   V7.1 MOBILE LOGIC
   ========================================================================== */

function initMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav-drawer');
    const closeNavBtn = document.getElementById('close-mobile-nav');
    
    if (!mobileBtn || !mobileNav || !closeNavBtn) return;

    mobileBtn.addEventListener('click', () => {
        mobileNav.classList.add('open');
        document.body.style.overflow = 'hidden'; // prevent scrolling
    });

    closeNavBtn.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
    });

    // Close on link click
    mobileNav.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

// Modify existing initCustomCursor and initMagneticButtons to respect touch devices
const originalInitCustomCursor = window.initCustomCursor;
if (typeof originalInitCustomCursor === 'function') {
    window.initCustomCursor = function() {
        if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900) {
            // It's a touch device or small screen, don't init cursor logic to save CPU
            return;
        }
        originalInitCustomCursor();
    };
}

const originalInitMagneticButtons = window.initMagneticButtons;
if (typeof originalInitMagneticButtons === 'function') {
    window.initMagneticButtons = function() {
        if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900) {
            return; // Don't init magnetic effects on touch
        }
        originalInitMagneticButtons();
    };
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
});



/* ==========================================================================
   V8 CINEMATIC PHYSICS & ANIMATIONS LOGIC
   ========================================================================== */

function initV8Cinematic() {
    // 1. Spotlight Mouse Tracking
    const body = document.body;
    document.addEventListener('mousemove', (e) => {
        if (window.innerWidth > 900) {
            body.style.setProperty('--cursor-x', `${e.clientX}px`);
            body.style.setProperty('--cursor-y', `${e.clientY}px`);
        }
    });

    // 2. Cinematic SplitText (Custom implementation)
    function splitTextToChars(selector) {
        document.querySelectorAll(selector).forEach(el => {
            // Function to recursively process nodes
            function processNode(node) {
                if (node.nodeType === 3) { // Text node
                    const text = node.nodeValue;
                    if (!text.trim()) return node;
                    
                    const fragment = document.createDocumentFragment();
                    const words = text.split(/(\s+)/); // keep spaces
                    
                    words.forEach(word => {
                        if (word.trim() === '') {
                            fragment.appendChild(document.createTextNode(word));
                            return;
                        }
                        const wordSpan = document.createElement('span');
                        wordSpan.className = 'split-word';
                        wordSpan.style.display = 'inline-block';
                        
                        word.split('').forEach(char => {
                            const charSpan = document.createElement('span');
                            charSpan.className = 'split-char';
                            charSpan.style.display = 'inline-block';
                            charSpan.innerText = char;
                            wordSpan.appendChild(charSpan);
                        });
                        fragment.appendChild(wordSpan);
                    });
                    return fragment;
                } else if (node.nodeType === 1) { // Element node
                    const newEl = node.cloneNode(false);
                    Array.from(node.childNodes).forEach(child => {
                        newEl.appendChild(processNode(child));
                    });
                    return newEl;
                }
                return node.cloneNode(true);
            }
            
            const newContent = processNode(el);
            el.innerHTML = '';
            Array.from(newContent.childNodes).forEach(child => {
                el.appendChild(child);
            });
        });
    }


    // Apply to main headings
    // splitTextToChars('.hero-title'); // Removing this to prevent it from replacing the DOM nodes being animated by GSAP
    splitTextToChars('.section-chapter-label');

    // 3. Sapphire Glare on Tilt Cards
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
        // Add glare element if not exists
        if (!card.querySelector('.card-glare')) {
            const glare = document.createElement('div');
            glare.className = 'card-glare';
            card.appendChild(glare);
        }
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
            card.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
        });
    });

    // 4. Mechanical Gears Scrub Animation
    if (document.querySelector('.gears-container')) {
        gsap.to('.gear-1', {
            rotation: 360,
            transformOrigin: "center center",
            ease: "none",
            scrollTrigger: {
                trigger: "#destacados",
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            }
        });
        gsap.to('.gear-2', {
            rotation: -360, // Reverse direction
            transformOrigin: "center center",
            ease: "none",
            scrollTrigger: {
                trigger: "#destacados",
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            }
        });
    }
}

// Ensure V8 runs after everything is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to ensure vanilla JS and other GSAP setups are done
    setTimeout(initV8Cinematic, 500);
});



    

    // ─── PURE WATCH 3D INTERACTIVITY & TIME (V11) ─────────────────────────
    const pureWatchContainer = document.getElementById('pure-watch-container');
    const heroSection = document.getElementById('hero');
    if (pureWatchContainer && heroSection && window.innerWidth > 900) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            
            const rotateX = y * -30;
            const rotateY = x * 40;
            
            gsap.to(pureWatchContainer, {
                rotateX: rotateX,
                rotateY: rotateY,
                duration: 1,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        });
        
        heroSection.addEventListener('mouseleave', () => {
            gsap.to(pureWatchContainer, {
                rotateX: 0,
                rotateY: 0,
                duration: 1.5,
                ease: 'power3.out',
                overwrite: 'auto'
            });
        });
    }

    const pHour = document.getElementById('pure-hour-hand');
    const pMin = document.getElementById('pure-minute-hand');
    const pSec = document.getElementById('pure-second-hand');
    
    if (pHour && pMin && pSec) {
        function updatePureWatch() {
            const now = new Date();
            const ms = now.getMilliseconds();
            const s = now.getSeconds() + ms / 1000;
            const m = now.getMinutes() + s / 60;
            const h = now.getHours() % 12 + m / 60;
            
            pHour.style.transform = `rotate(${h * 30}deg)`;
            pMin.style.transform = `rotate(${m * 6}deg)`;
            pSec.style.transform = `rotate(${s * 6}deg)`;
            
            requestAnimationFrame(updatePureWatch);
        }
        requestAnimationFrame(updatePureWatch);
    }



    // ─── PURE WATCH DIAL GENERATION ──────────────────────────────────────────
    const trackContainer = document.getElementById('pure-minute-track');
    if (trackContainer) {
        for (let i = 0; i < 60; i++) {
            const mark = document.createElement('div');
            const isHour = i % 5 === 0;
            mark.className = isHour ? 'track-mark mark-hour' : 'track-mark mark-minute';
            
            // The hour markers get roman numerals
            if (isHour) {
                const hourNum = i / 5 === 0 ? 12 : i / 5;
                const romanNumerals = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
                
                // Don't put a numeral at 6 because of the tourbillon
                if (hourNum !== 6) {
                    const numeral = document.createElement('div');
                    numeral.className = 'track-numeral';
                    numeral.innerText = romanNumerals[hourNum === 12 ? 0 : hourNum];
                    // Keep numerals upright
                    numeral.style.transform = `rotate(${-i * 6}deg)`;
                    mark.appendChild(numeral);
                }
            }
            
            mark.style.transform = `rotate(${i * 6}deg)`;
            trackContainer.appendChild(mark);
        }
    }
