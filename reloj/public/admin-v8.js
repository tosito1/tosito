import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    getDoc,
    addDoc,
    updateDoc, 
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

console.log("%c=== TOUST ADMIN SCRIPT LOADED - VERSION 8.1 ===%c", 'background:#d4af37;color:#000;padding:4px 8px;border-radius:4px;font-weight:bold', '');

// Usamos la misma configuración del proyecto
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
const db = getFirestore(app);
const auth = getAuth(app);

// Variables Globales
let currentAdminUser = null;
let watches = [];

// DOM Elements
const unauthorizedScreen = document.getElementById('unauthorized-screen');
const authButtons = document.getElementById('auth-buttons');
const adminApp = document.getElementById('admin-app');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const watchesList = document.getElementById('admin-watches-list');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModalBtn = document.getElementById('close-modal-btn');
const toast = document.getElementById('admin-toast');

// --- NAVEGACIÓN SPA ---
const navLinks = document.querySelectorAll('.sidebar-link[data-view]');
const views = document.querySelectorAll('.admin-view');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        const viewId = 'view-' + link.getAttribute('data-view');
        views.forEach(v => v.style.display = 'none');
        document.getElementById(viewId).style.display = 'block';
    });
});

// --- UTILIDADES ---
function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- AUTENTICACIÓN Y ROLES ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentAdminUser = user;
        try {
            // Verificar si es admin
            const adminDocRef = doc(db, 'relojes_toust_admins', user.uid);
            const adminSnap = await getDoc(adminDocRef);
            const isSuperAdmin = user.uid === 'UAApcyeDQNZElcOcrpUxMmpPysp1';
            
            if (adminSnap.exists() || isSuperAdmin) {
                // ES ADMIN
                if (isSuperAdmin && !adminSnap.exists()) {
                    await setDoc(doc(db, 'relojes_toust_admins', user.uid), { role: 'admin', autoCreated: true });
                }
                unauthorizedScreen.style.display = 'none';
                adminApp.style.display = 'flex';
                loadWatches();
                loadOrders();
                loadParts();
            } else {
                // NO ES ADMIN
                unauthorizedScreen.style.display = 'flex';
                authButtons.style.display = 'block';
                adminApp.style.display = 'none';
                document.querySelector('#unauthorized-screen h2').textContent = 'Acceso Denegado';
                document.querySelector('#unauthorized-screen p').textContent = `Hola ${user.displayName || user.email}, no tienes permisos de maestro relojero.`;
            }
        } catch (error) {
            console.error("Error al verificar admin:", error);
            alert("Error al verificar roles de administración.");
        }
    } else {
        // NO LOGUEADO
        currentAdminUser = null;
        unauthorizedScreen.style.display = 'flex';
        authButtons.style.display = 'block';
        adminApp.style.display = 'none';
        document.querySelector('#unauthorized-screen p').textContent = 'Debes iniciar sesión en la tienda primero.';
    }
});

adminLogoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});

// --- CARGA Y RENDERIZADO DEL CATÁLOGO ---
async function loadWatches() {
    try {
        const querySnapshot = await getDocs(collection(db, 'relojes_toust/tienda/productos'));
        watches = [];
        watchesList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            watches.push({ id: doc.id, ...data });
        });
        
        // Ordenar por precio descendente
        watches.sort((a, b) => b.price - a.price);
        
        renderWatches();
    } catch (error) {
        console.error("Error al cargar el catálogo:", error);
        showToast("Error al cargar los datos desde Firestore.");
    }
}

function renderWatches() {
    watchesList.innerHTML = '';
    
    // Variables para las métricas
    let totalValue = 0;
    
    watches.forEach(watch => {
        totalValue += parseFloat(watch.price);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="table-product-cell">
                    <div class="table-img-wrapper">
                        <img src="${watch.image}" alt="${watch.name}" class="table-img">
                    </div>
                    <div class="table-product-info">
                        <h5>${watch.name}</h5>
                        <span>ID: ${watch.id.slice(0,6)}</span>
                    </div>
                </div>
            </td>
            <td style="color:var(--text-dim);">${(watch.specs && watch.specs.caja) ? watch.specs.caja.slice(0,15)+'...' : 'Acero'}</td>
            <td>
                <span class="badge ${watch.badge ? 'badge-gold' : 'badge-silver'}">${watch.badge || 'Estándar'}</span>
            </td>
            <td class="table-price">${parseFloat(watch.price).toLocaleString('es-ES')} €</td>
            <td>
                <button class="btn btn-secondary btn-small edit-btn" style="padding: 0.5rem 1rem; font-size: 0.8rem;" data-id="${watch.id}">Editar</button>
            </td>
        `;
        watchesList.appendChild(tr);
    });

    // Actualizar Tarjetas de Métricas
    const totalWatchesEl = document.getElementById('metric-total-watches');
    const totalValueEl = document.getElementById('metric-total-value');
    if(totalWatchesEl) totalWatchesEl.textContent = watches.length;
    if(totalValueEl) totalValueEl.textContent = totalValue.toLocaleString('es-ES') + ' €';

    // Event Listeners a los botones editar
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const watchId = e.currentTarget.getAttribute('data-id');
            const watch = watches.find(w => w.id === watchId);
            openEditModal(watch);
        });
    });
}

// --- CARGA Y RENDERIZADO DE PEDIDOS ---
async function loadOrders() {
    try {
        const querySnapshot = await getDocs(collection(db, 'relojes_toust/tienda/pedidos'));
        const ordersList = document.getElementById('admin-orders-list');
        if(!ordersList) return;
        ordersList.innerHTML = '';
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const date = data.date ? new Date(data.date).toLocaleDateString() : 'Desconocida';
            const customerName = data.shippingInfo?.name || 'Cliente sin nombre';
            const total = (data.totalPrice || 0).toLocaleString('es-ES') + ' €';
            const status = data.status || 'Pendiente';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:var(--text-dim);">${date}</td>
                <td style="color:white; font-family:var(--font-heading);">${customerName}</td>
                <td class="table-price">${total}</td>
                <td>
                    <span class="badge ${status === 'Enviado' ? 'badge-gold' : 'badge-silver'}">${status}</span>
                </td>
                <td>
                    ${status === 'Pendiente' ? 
                        `<button class="btn btn-secondary btn-small mark-shipped-btn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" data-id="${id}">Marcar Enviado</button>` : 
                        `<span style="color: var(--text-dim); font-size: 0.8rem;"><i data-lucide="check" style="width:14px;height:14px;vertical-align:middle;"></i> Completado</span>`
                    }
                </td>
            `;
            ordersList.appendChild(tr);
        });

        lucide.createIcons();

        // Eventos para Marcar Enviado
        document.querySelectorAll('.mark-shipped-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderId = e.target.getAttribute('data-id');
                e.target.disabled = true;
                e.target.textContent = 'Guardando...';
                try {
                    await updateDoc(doc(db, 'relojes_toust/tienda/pedidos', orderId), {
                        status: 'Enviado'
                    });
                    showToast("Pedido actualizado a Enviado");
                    loadOrders(); // Recargar la lista
                } catch(err) {
                    console.error(err);
                    showToast("Error al actualizar estado");
                    e.target.disabled = false;
                    e.target.textContent = 'Marcar Enviado';
                }
            });
        });
        
    } catch(err) {
        console.error("Error cargando pedidos:", err);
    }
}

// --- MODAL Y EDICIÓN ---
document.getElementById('add-product-btn')?.addEventListener('click', () => {
    openEditModal(null); // null = nuevo reloj
});

closeModalBtn?.addEventListener('click', () => {
    editModal.style.display = 'none';
});

function openEditModal(watch) {
    try {
        if (watch) {
            document.getElementById('modal-title').textContent = "Editar Reloj";
            document.getElementById('edit-id').value = watch.id;
            document.getElementById('edit-name').value = watch.name;
            document.getElementById('edit-price').value = watch.price;
            document.getElementById('edit-description').value = watch.description || '';
            document.getElementById('edit-specs').value = watch.specsSummary || '';
            document.getElementById('edit-spec-caja').value = (watch.specs && watch.specs.caja) ? watch.specs.caja : '';
            document.getElementById('edit-spec-cristal').value = (watch.specs && watch.specs.cristal) ? watch.specs.cristal : '';
            document.getElementById('edit-spec-movimiento').value = (watch.specs && watch.specs.movimiento) ? watch.specs.movimiento : '';
            document.getElementById('edit-spec-resistencia').value = (watch.specs && watch.specs.resistencia) ? watch.specs.resistencia : '';
            document.getElementById('edit-spec-correa').value = (watch.specs && watch.specs.correa) ? watch.specs.correa : '';
            document.getElementById('edit-category').value = watch.category || 'coleccion';
            document.getElementById('edit-category-label').value = watch.categoryLabel || '';
            document.getElementById('edit-image').value = watch.image;
            document.getElementById('edit-badge').value = watch.badge || '';
        } else {
            document.getElementById('modal-title').textContent = "Añadir Nuevo Reloj";
            document.getElementById('edit-form').reset();
            document.getElementById('edit-id').value = "";
        }
        editModal.style.display = 'flex';
    } catch (err) {
        alert("Error al abrir modal: " + err.message);
    }
}

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = editForm.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Guardando...";
    }

    try {
        const id = document.getElementById('edit-id').value;
        const watchData = {
            name: document.getElementById('edit-name').value,
            price: parseFloat(document.getElementById('edit-price').value),
            description: document.getElementById('edit-description').value || '',
            specsSummary: document.getElementById('edit-specs').value || '',
            specs: {
                caja: document.getElementById('edit-spec-caja').value || '',
                cristal: document.getElementById('edit-spec-cristal').value || '',
                movimiento: document.getElementById('edit-spec-movimiento').value || '',
                resistencia: document.getElementById('edit-spec-resistencia').value || '',
                correa: document.getElementById('edit-spec-correa').value || ''
            },
            category: document.getElementById('edit-category').value || 'coleccion',
            categoryLabel: document.getElementById('edit-category-label').value || '',
            image: document.getElementById('edit-image').value || '',
            badge: document.getElementById('edit-badge').value || ''
        };

        if (id) {
            // Actualizar existente
            const watchRef = doc(db, 'relojes_toust', 'tienda', 'productos', id);
            await updateDoc(watchRef, watchData);
            showToast("Reloj actualizado correctamente.");
        } else {
            // Crear nuevo
            const collRef = collection(db, 'relojes_toust', 'tienda', 'productos');
            await addDoc(collRef, watchData);
            showToast("Nuevo reloj añadido al catálogo.");
        }
        editModal.style.display = 'none';
        loadWatches(); // Recargar la lista
    } catch (error) {
        console.error("Error guardando en Firestore:", error);
        alert("Error al guardar: " + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Guardar Cambios";
        }
    }
});


// --- GESTIÓN DE COMPONENTES Y PROVEEDORES ---
let parts = [];
let currentPartFilter = 'todos';
const partsList = document.getElementById('admin-parts-list');
const partModal = document.getElementById('part-modal');
const partForm = document.getElementById('part-form');
const closePartModalBtn = document.getElementById('close-part-modal-btn');

async function loadParts() {
    try {
        const querySnapshot = await getDocs(collection(db, 'relojes_toust', 'admin', 'componentes'));
        parts = [];
        querySnapshot.forEach((doc) => {
            parts.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by name
        parts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        renderParts();
        if (typeof renderCalculatorParts === 'function') renderCalculatorParts();
    } catch (error) {
        console.error("Error al cargar componentes:", error);
    }
}

function renderParts() {
    if (!partsList) return;
    partsList.innerHTML = '';
    
    const filteredParts = currentPartFilter === 'todos' 
        ? parts 
        : parts.filter(p => p.category === currentPartFilter);

    if (filteredParts.length === 0) {
        partsList.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:2rem;">No hay componentes en esta categoría.</td></tr>';
        return;
    }

    // Group parts by model
    const groupedParts = {};
    filteredParts.forEach(part => {
        const model = part.model || 'Universal / General';
        if (!groupedParts[model]) {
            groupedParts[model] = [];
        }
        groupedParts[model].push(part);
    });

    // Render grouped parts
    Object.keys(groupedParts).sort().forEach(model => {
        // Add a header row for the model
        const headerTr = document.createElement('tr');
        headerTr.classList.add('model-group-header');
        headerTr.innerHTML = `
            <td colspan="6" style="background: rgba(212, 175, 55, 0.1); color: var(--gold-primary); font-family: var(--font-heading); font-size: 1.1rem; padding: 1rem; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
                <i data-lucide="package" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 8px;"></i>
                ${model}
            </td>
        `;
        partsList.appendChild(headerTr);

        // Render parts in this model
        groupedParts[model].forEach(part => {
            let stockClass = 'stock-high';
            if (part.stock === 0) stockClass = 'stock-empty';
            else if (part.stock <= 5) stockClass = 'stock-low';

            const categoryLabels = {
                movimiento: 'Calibre',
                caja: 'Caja',
                esfera: 'Esfera/Agujas',
                correa: 'Correa',
                cristal: 'Cristal',
                otro: 'Otro'
            };

            const supplierHtml = part.link 
                ? `<a href="${part.link}" target="_blank" style="color:var(--gold-primary);text-decoration:none;"><i data-lucide="external-link" style="width:14px;height:14px;vertical-align:middle;"></i> ${part.supplier || 'Comprar'}</a>`
                : (part.supplier || '—');

            const tr = document.createElement('tr');
            if (part.isDraft) {
                tr.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                tr.style.borderLeft = '3px solid var(--gold-secondary)';
            }
            tr.innerHTML = `
                <td>
                    <strong style="color:white;font-family:var(--font-heading);">${part.name}</strong>
                    ${part.isDraft ? '<span class="badge badge-gold" style="font-size: 0.65rem; margin-left: 0.5rem;">Borrador</span>' : ''}
                </td>
                <td style="color:var(--text-dim);">${categoryLabels[part.category] || 'Otro'}</td>
                <td><span class="stock-badge ${stockClass}">${part.stock} uds</span></td>
                <td class="table-price">${parseFloat(part.cost || 0).toLocaleString('es-ES')} €</td>
                <td>${supplierHtml}</td>
                <td>
                    <button class="btn btn-secondary btn-small edit-part-btn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" data-id="${part.id}">Editar</button>
                    <button class="btn btn-secondary btn-small delete-part-btn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; border-color: #8b0000; color: #ff4d4d; margin-left: 0.5rem;" data-id="${part.id}">X</button>
                </td>
            `;
            partsList.appendChild(tr);
        });
    });

    if(typeof lucide !== 'undefined') lucide.createIcons();

    document.querySelectorAll('.edit-part-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const partId = e.currentTarget.getAttribute('data-id');
            const part = parts.find(p => p.id === partId);
            openPartModal(part);
        });
    });

    document.querySelectorAll('.delete-part-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("¿Estás seguro de que deseas eliminar este componente?")) {
                const partId = e.currentTarget.getAttribute('data-id');
                const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
                await deleteDoc(doc(db, 'relojes_toust', 'admin', 'componentes', partId));
                loadParts();
            }
        });
    });
}

function openPartModal(part) {
    const modal = document.getElementById('part-modal');
    const form = document.getElementById('part-form');
    console.log('[openPartModal] called, part=', part, 'modal=', modal);
    if (!modal) { console.error('[openPartModal] ERROR: part-modal not found in DOM!'); return; }
    if (!part) {
        document.getElementById('part-id').value = '';
        if (form) form.reset();
        const title = document.getElementById('part-modal-title');
        if (title) title.textContent = 'Añadir Componente';
    } else {
        document.getElementById('part-id').value = part.id;
        document.getElementById('part-name').value = part.name || '';
        document.getElementById('part-category').value = part.category || 'otro';
        document.getElementById('part-stock').value = part.stock || 0;
        document.getElementById('part-cost').value = part.cost || 0;
        document.getElementById('part-supplier').value = part.supplier || '';
        document.getElementById('part-link').value = part.link || '';
        const title = document.getElementById('part-modal-title');
        if (title) title.textContent = 'Editar Componente';
    }
    modal.style.display = 'flex';
    console.log('[openPartModal] modal display set to flex');
}

// Filtros
document.querySelectorAll('.part-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.part-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentPartFilter = e.target.getAttribute('data-filter');
        renderParts();
    });
});

// Modal Logic
const addPartBtn = document.getElementById('add-part-btn');
console.log('[init] add-part-btn found:', addPartBtn);
console.log('[init] part-modal found:', document.getElementById('part-modal'));
if (addPartBtn) {
    addPartBtn.addEventListener('click', () => {
        console.log('[click] add-part-btn clicked');
        openPartModal(null);
    });
} else {
    console.error('[init] ERROR: add-part-btn NOT FOUND in DOM!');
}

closePartModalBtn?.addEventListener('click', () => {
    partModal.style.display = 'none';
});

partForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = partForm.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Guardando...";
    }
    try {
        const id = document.getElementById('part-id').value;
        const partData = {
            name: document.getElementById('part-name').value,
            category: document.getElementById('part-category').value,
            stock: parseInt(document.getElementById('part-stock').value) || 0,
            cost: parseFloat(document.getElementById('part-cost').value) || 0,
            supplier: document.getElementById('part-supplier').value || '',
            link: document.getElementById('part-link').value || ''
        };

        if (id) {
            const partRef = doc(db, 'relojes_toust', 'admin', 'componentes', id);
            await updateDoc(partRef, partData);
            showToast("Componente actualizado.");
        } else {
            const collRef = collection(db, 'relojes_toust', 'admin', 'componentes');
            await addDoc(collRef, partData);
            showToast("Componente añadido.");
        }
        partModal.style.display = 'none';
        loadParts();
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al guardar: " + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Guardar Pieza";
        }
    }
});


// --- CALCULADORA DE ENSAMBLAJE ---
let currentAssembly = [];
let currentCalcFilter = 'todos';

function renderCalculatorParts() {
    const calcGrid = document.getElementById('calc-parts-grid');
    if (!calcGrid) return;
    
    calcGrid.innerHTML = '';
    
    const filteredParts = currentCalcFilter === 'todos' 
        ? parts 
        : parts.filter(p => p.category === currentCalcFilter);

    if (filteredParts.length === 0) {
        calcGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:var(--text-dim); padding:2rem;">No hay componentes en esta categoría.</div>';
        return;
    }

    const categoryLabels = {
        movimiento: 'Calibre', caja: 'Caja', esfera: 'Esfera', correa: 'Correa', cristal: 'Cristal', otro: 'Otro'
    };

    filteredParts.forEach(part => {
        const div = document.createElement('div');
        div.className = 'calc-part-card';
        div.innerHTML = `
            <div class="calc-part-type">${categoryLabels[part.category] || 'Otro'}</div>
            <div class="calc-part-name">${part.name}</div>
            <div class="calc-part-cost">${parseFloat(part.cost || 0).toLocaleString('es-ES')} €</div>
        `;
        div.addEventListener('click', () => addToAssembly(part));
        calcGrid.appendChild(div);
    });
}

function addToAssembly(part) {
    currentAssembly.push({ ...part, uniqueId: Date.now() + Math.random() });
    updateAssemblyUI();
    showToast(`${part.name} añadido al ensamblaje`);
}

function removeFromAssembly(uniqueId) {
    currentAssembly = currentAssembly.filter(p => p.uniqueId !== uniqueId);
    updateAssemblyUI();
}

function updateAssemblyUI() {
    const list = document.getElementById('assembly-list');
    const totalCostEl = document.getElementById('assembly-total-cost');
    const suggestedPriceEl = document.getElementById('assembly-suggested-price');
    const marginInput = document.getElementById('assembly-margin');
    
    if (!list) return;

    list.innerHTML = '';
    
    let totalCost = 0;

    if (currentAssembly.length === 0) {
        list.innerHTML = '<div style="text-align:center; color: var(--text-dim); font-size: 0.85rem; padding: 2rem 0;">No hay piezas seleccionadas</div>';
    } else {
        currentAssembly.forEach(part => {
            const cost = parseFloat(part.cost || 0);
            totalCost += cost;
            
            const item = document.createElement('div');
            item.className = 'assembly-item';
            item.innerHTML = `
                <div class="assembly-item-info">
                    <span class="assembly-item-name">${part.name}</span>
                    <span class="assembly-item-cost">${cost.toLocaleString('es-ES')} €</span>
                </div>
                <button class="assembly-remove-btn" title="Quitar">
                    <i data-lucide="x" style="width:16px;height:16px;"></i>
                </button>
            `;
            item.querySelector('.assembly-remove-btn').addEventListener('click', () => removeFromAssembly(part.uniqueId));
            list.appendChild(item);
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }

    totalCostEl.textContent = `${totalCost.toLocaleString('es-ES')} €`;
    
    const marginPct = parseFloat(marginInput.value || 0) / 100;
    const suggestedPrice = totalCost + (totalCost * marginPct);
    suggestedPriceEl.textContent = `${suggestedPrice.toLocaleString('es-ES')} €`;
}

// Filtros de calculadora
document.querySelectorAll('.calc-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.calc-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCalcFilter = e.target.getAttribute('data-filter');
        renderCalculatorParts();
    });
});

// Eventos de calculadora
document.getElementById('clear-assembly-btn')?.addEventListener('click', () => {
    if(currentAssembly.length > 0 && confirm('¿Vaciar ensamblaje actual?')) {
        currentAssembly = [];
        updateAssemblyUI();
    }
});

document.getElementById('assembly-margin')?.addEventListener('input', updateAssemblyUI);


// --- GESTIÓN DE USUARIOS Y ROLES ---

let allUsers = [];
let adminUids = [];

window.loadUsers = async function() {
    const list = document.getElementById('admin-users-list');
    if (!list) return;

    try {
        // Cargar todos los usuarios (requiere reglas actualizadas)
        const usersSnap = await getDocs(collection(db, 'relojes_toust', 'tienda', 'usuarios'));
        allUsers = [];
        usersSnap.forEach(doc => {
            allUsers.push({ uid: doc.id, ...doc.data() });
        });

        // Cargar administradores
        const adminsSnap = await getDocs(collection(db, 'relojes_toust_admins'));
        adminUids = [];
        adminsSnap.forEach(doc => {
            adminUids.push(doc.id);
        });

        renderUsers();
    } catch (error) {
        console.error("Error cargando usuarios:", error);
        list.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #ff4d4d;">Error al cargar usuarios. Asegúrate de actualizar firestore.rules</td></tr>';
    }
};

window.renderUsers = function() {
    const list = document.getElementById('admin-users-list');
    if (!list) return;

    list.innerHTML = '';
    
    if (allUsers.length === 0) {
        list.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-dim);">No hay usuarios registrados.</td></tr>';
        return;
    }

    allUsers.forEach(user => {
        const tr = document.createElement('tr');
        
        // El super admin por defecto no se puede modificar
        const isSuperAdmin = user.uid === 'UAApcyeDQNZElcOcrpUxMmpPysp1';
        const isAdmin = isSuperAdmin || adminUids.includes(user.uid);
        
        let roleBadge = isAdmin 
            ? '<span style="background: rgba(212,175,55,0.1); color: var(--gold-primary); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem;">Admin</span>' 
            : '<span style="background: rgba(255,255,255,0.05); color: var(--text-dim); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem;">Usuario</span>';
            
        if (isSuperAdmin) {
            roleBadge = '<span style="background: rgba(255,255,255,0.1); color: white; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; border: 1px solid var(--gold-primary);">Super Admin</span>';
        }

        let actionBtn = '';
        if (!isSuperAdmin) {
            if (isAdmin) {
                actionBtn = `<button onclick="toggleAdmin('${user.uid}', false)" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: #ff4d4d; border-color: rgba(255,77,77,0.3);">Quitar Admin</button>`;
            } else {
                actionBtn = `<button onclick="toggleAdmin('${user.uid}', true)" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Hacer Admin</button>`;
            }
        }

        tr.innerHTML = `
            <td>
                <div style="font-weight: 500; color: white;">${user.name || 'Sin Nombre'}</div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">${user.phone || ''}</div>
            </td>
            <td style="color: var(--text-dim); font-size: 0.85rem;">${user.email || '—'}</td>
            <td style="color: var(--text-dim); font-size: 0.85rem; font-family: monospace;">${user.uid}</td>
            <td>${roleBadge}</td>
            <td>${actionBtn}</td>
        `;
        list.appendChild(tr);
    });
};

window.toggleAdmin = async function(uid, makeAdmin) {
    if (!confirm(makeAdmin ? '¿Estás seguro de que quieres dar privilegios de administrador a este usuario?' : '¿Quieres quitar los privilegios a este usuario?')) {
        return;
    }
    
    try {
        const adminRef = doc(db, 'relojes_toust_admins', uid);
        if (makeAdmin) {
            await setDoc(adminRef, { grantedAt: new Date().toISOString() });
            showToast('Rol de administrador concedido');
        } else {
            await deleteDoc(adminRef);
            showToast('Rol de administrador revocado');
        }
        await loadUsers();
    } catch (error) {
        console.error('Error modificando rol:', error);
        alert('Error: ' + error.message);
    }
};

// Cargar usuarios cuando se abre la vista
document.querySelectorAll('.sidebar-link[data-view="usuarios"]').forEach(btn => {
    btn.addEventListener('click', () => {
        loadUsers();
    });
});

// --- GESTIÓN DE IMÁGENES (BASE64) ---
(function initBulkImport() {
    const uploadInput = document.getElementById('part-image-upload');
    const uploadLabel = document.getElementById('upload-label');
    const urlInput = document.getElementById('part-image');
    
    if (uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // UI Loading state
            const originalHTML = uploadLabel.innerHTML;
            uploadLabel.innerHTML = '<i data-lucide="loader-2" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px; animation: spin 2s linear infinite;"></i> Procesando...';
            lucide.createIcons();
            uploadLabel.style.pointerEvents = 'none';
            uploadLabel.style.opacity = '0.7';
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    // Redimensionar si es muy grande para no exceder los límites de Firestore (1MB)
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600;
                    const MAX_HEIGHT = 600;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convertir a Base64 WebP (mejor compresión, soporta transparencia)
                    const dataUrl = canvas.toDataURL('image/webp', 0.85);
                    
                    // Poner en el input
                    urlInput.value = dataUrl;
                    
                    if (typeof showToast === 'function') {
                        showToast('¡Imagen procesada correctamente!');
                    } else {
                        alert('Imagen lista.');
                    }
                    
                    // Restore UI
                    uploadLabel.innerHTML = originalHTML;
                    lucide.createIcons();
                    uploadLabel.style.pointerEvents = 'auto';
                    uploadLabel.style.opacity = '1';
                    uploadInput.value = ''; // Reset input
                };
                img.src = event.target.result;
            };
            
            reader.onerror = function() {
                alert("Error al leer el archivo.");
                uploadLabel.innerHTML = originalHTML;
                lucide.createIcons();
                uploadLabel.style.pointerEvents = 'auto';
                uploadLabel.style.opacity = '1';
            };
            
            reader.readAsDataURL(file);
        });
    }
});


// --- EXTRACCIÓN AUTOMÁTICA DE DATOS ---
const extractUrlBtn = document.getElementById('extract-url-btn');
if (extractUrlBtn) {
    extractUrlBtn.addEventListener('click', async () => {
        const urlInput = document.getElementById('part-link');
        const url = urlInput.value.trim();
        
        if (!url) {
            alert("Por favor, introduce una URL primero.");
            return;
        }

        const originalHTML = extractUrlBtn.innerHTML;
        extractUrlBtn.disabled = true;
        extractUrlBtn.innerHTML = '<i data-lucide="loader-2" style="width:14px;height:14px;animation:spin 2s linear infinite;"></i>...';
        if(typeof lucide !== 'undefined') lucide.createIcons();

        try {
            // Usamos un proxy CORS público
            const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data.contents) {
                const html = data.contents;
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Intentar extraer el título (og:title o <title>)
                let title = '';
                const ogTitle = doc.querySelector('meta[property="og:title"]');
                if (ogTitle) title = ogTitle.getAttribute('content');
                if (!title) {
                    const titleTag = doc.querySelector('title');
                    if (titleTag) title = titleTag.textContent;
                }
                
                // Limpiar el título
                if (title) {
                    title = title.split('|')[0].trim();
                    title = title.replace('AliExpress', '').trim();
                    if (title.length > 50) title = title.substring(0, 50) + '...';
                    document.getElementById('part-name').value = title;
                }

                // Intentar extraer la imagen (og:image)
                const ogImage = doc.querySelector('meta[property="og:image"]');
                if (ogImage) {
                    const imgUrl = ogImage.getAttribute('content');
                    // Solo actualizamos si no hay nada o el usuario lo permite
                    document.getElementById('part-image').value = imgUrl;
                    if (typeof showToast === 'function') showToast("Datos extraídos correctamente.");
                } else {
                    if (typeof showToast === 'function') showToast("Extracción parcial. Revisa los datos.");
                }
            } else {
                throw new Error("No se pudo obtener el contenido.");
            }
        } catch (error) {
            console.error("Error al extraer URL:", error);
            alert("No se pudo extraer la información automáticamente. Es posible que AliExpress haya bloqueado la petición del proxy. Por favor, rellena los campos a mano.");
        } finally {
            extractUrlBtn.disabled = false;
            extractUrlBtn.innerHTML = originalHTML;
            if(typeof lucide !== 'undefined') lucide.createIcons();
        }
    });
}
