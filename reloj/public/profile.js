import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCLAB3IW4U6CcXiE_r9t_gkMPVpdFY16g4",
    authDomain: "tosito-7f923.firebaseapp.com",
    projectId: "tosito-7f923",
    storageBucket: "tosito-7f923.firebasestorage.app",
    messagingSenderId: "944852070557",
    appId: "1:944852070557:web:96fbb05ea60bd99777a474",
    measurementId: "G-6HFY8ZWS6N"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authLoading = document.getElementById('auth-loading');
const profileApp = document.getElementById('profile-app');
const userEmailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn');

const navBtns = document.querySelectorAll('.nav-btn[data-view]');
const views = document.querySelectorAll('.admin-view');
const currentViewTitle = document.getElementById('current-view-title');

// Profile Form
const profileForm = document.getElementById('profile-form');
const saveIndicator = document.getElementById('save-indicator');

// Orders Table
const ordersTbody = document.getElementById('orders-tbody');
const emptyOrdersMsg = document.getElementById('empty-orders-msg');

let currentUser = null;

// Inicialización de la aplicación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        userEmailDisplay.textContent = user.email;
        authLoading.style.display = 'none';
        profileApp.style.display = 'flex';
        
        await loadUserProfile();
        await loadUserOrders();
    } else {
        // Redirigir a la tienda si no está logueado
        window.location.href = 'index.html';
    }
});

// Navegación (SPA)
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active class
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show view
        const targetView = btn.dataset.view;
        views.forEach(view => {
            if (view.id === 'view-' + targetView) {
                view.classList.add('active');
            } else {
                view.classList.remove('active');
            }
        });

        // Update title
        currentViewTitle.textContent = btn.textContent.trim();
    });
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error al cerrar sesión", error);
    }
});

// Cargar perfil
async function loadUserProfile() {
    try {
        const userDocRef = doc(db, "relojes_toust", "tienda", "usuarios", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            document.getElementById('profile-name').value = data.name || '';
            document.getElementById('profile-phone').value = data.phone || '';
            document.getElementById('profile-address').value = data.address || '';
            document.getElementById('profile-city').value = data.city || '';
            document.getElementById('profile-postal').value = data.postal || '';
            document.getElementById('profile-country').value = data.country || 'España';
        } else {
            // Predeterminado si no tiene perfil, usar el nombre de Google si hay
            if (currentUser.displayName) {
                document.getElementById('profile-name').value = currentUser.displayName;
            }
        }
    } catch (err) {
        console.error("Error cargando perfil", err);
    }
}

// Guardar perfil
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saveBtn = document.getElementById('save-profile-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<svg class="spinner" viewBox="0 0 40 40" style="width: 16px; height: 16px;"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="20 40"/></svg> Guardando...';
    saveBtn.disabled = true;

    const data = {
        name: document.getElementById('profile-name').value,
        phone: document.getElementById('profile-phone').value,
        address: document.getElementById('profile-address').value,
        city: document.getElementById('profile-city').value,
        postal: document.getElementById('profile-postal').value,
        country: document.getElementById('profile-country').value,
        updatedAt: new Date().toISOString()
    };

    try {
        await setDoc(doc(db, "relojes_toust", "tienda", "usuarios", currentUser.uid), data, { merge: true });
        
        saveIndicator.classList.add('show');
        setTimeout(() => saveIndicator.classList.remove('show'), 3000);
    } catch (err) {
        console.error("Error guardando perfil", err);
        alert("Hubo un error al guardar los datos.");
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
});

// Cargar pedidos
async function loadUserOrders() {
    try {
        const q = query(
            collection(db, "relojes_toust", "tienda", "pedidos"),
            where("userId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            document.querySelector('.table-container').style.display = 'none';
            emptyOrdersMsg.style.display = 'block';
            return;
        }

        document.querySelector('.table-container').style.display = 'block';
        emptyOrdersMsg.style.display = 'none';
        ordersTbody.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const id = docSnap.id;
            const date = new Date(order.createdAt).toLocaleDateString('es-ES');
            
            // Construir lista de relojes
            let itemsHtml = '';
            if (order.items && order.items.length > 0) {
                const names = order.items.map(item => `${item.name} (x${item.quantity})`);
                itemsHtml = names.join('<br>');
            } else {
                itemsHtml = 'Reloj Desconocido';
            }

            let statusClass = 'status-pendiente';
            let statusText = 'Pendiente';
            
            if (order.status === 'sent' || order.status === 'enviado') {
                statusClass = 'status-enviado';
                statusText = 'Enviado';
            } else if (order.status === 'cancelled' || order.status === 'cancelado') {
                statusClass = 'status-cancelado';
                statusText = 'Cancelado';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="order-badge">#${id.substring(0, 8).toUpperCase()}</span></td>
                <td>${date}</td>
                <td style="font-size: 0.85rem; line-height: 1.4;">${itemsHtml}</td>
                <td class="price">${Number(order.total).toLocaleString('es-ES')} €</td>
                <td class="${statusClass}" style="font-weight: 600;">${statusText}</td>
            `;
            ordersTbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error cargando pedidos", err);
        // Si hay error de indexación o similar, mostramos el mensaje de error en la consola
    }
}
