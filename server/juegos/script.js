// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger);

// Base de datos que ahora se carga dinámicamente
let gamesDatabase = [];

// ==========================================
// VIRTUAL GAMEPAD (MANDO MÓVIL) LOGIC
// ==========================================
let virtualGamepad = null;
let socketClient = null;

function initVirtualGamepad() {
    if (virtualGamepad) return;
    
    virtualGamepad = {
        id: "Nexus Mobile Controller",
        index: 0,
        connected: true,
        timestamp: performance.now(),
        mapping: "standard",
        axes: [0, 0, 0, 0],
        buttons: Array(17).fill(0).map(() => ({ pressed: false, touched: false, value: 0 }))
    };

    // Override browser API
    const originalGetGamepads = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : null;
    navigator.getGamepads = function() {
        // Return virtual gamepad as player 1, and any physical ones afterwards
        const physical = originalGetGamepads ? originalGetGamepads() : [];
        return [virtualGamepad, physical[0], physical[1], physical[2]];
    };

    // Notify emulators that a gamepad connected
    const event = new Event('gamepadconnected');
    event.gamepad = virtualGamepad;
    window.dispatchEvent(event);
    console.log("Gamepad Virtual inicializado e inyectado.");
}


const consolesDatabase = [
    {
        id: "n64",
        name: "Nintendo 64",
        year: 1996,
        image: "assets/n64_console.jpg"
    },
    {
        id: "nes",
        name: "Nintendo Entertainment System",
        year: 1985,
        image: "assets/nes_console.jpg"
    },
    {
        id: "ps1",
        name: "PlayStation",
        year: 1994,
        image: "assets/ps1_console.jpg"
    },
    {
        id: "ps5",
        name: "PlayStation 5",
        year: 2020,
        image: "assets/ps5_console.jpg"
    },
    {
        id: "switch",
        name: "Nintendo Switch",
        year: 2017,
        image: "assets/switch_console.jpg"
    },
    {
        id: "gba",
        name: "Game Boy Advance",
        year: 2001,
        image: "assets/gba_console.jpg"
    },
    {
        id: "nds",
        name: "Nintendo DS",
        year: 2004,
        image: "assets/nds_console.jpg"
    }
];

// DOM Elements
const catalogGrid = document.getElementById('catalog-grid');
const consolesGrid = document.getElementById('consoles-grid');
const searchContainer = document.getElementById('search-container');
const catalogTitle = document.getElementById('catalog-title');
const searchInput = document.getElementById('search-input');
const mainTabs = document.querySelectorAll('.tab-btn');
const noResultsMessage = document.getElementById('no-results');

// Initial Load Animation
function initIntroAnimations() {
    const tl = gsap.timeline();
    
    // Header comes down
    tl.from('.glass-header', {
        y: -100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    });
    
    // Hero Title pops up
    tl.from('.hero-title', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
    }, "-=0.4");
    
    // Hero Subtitle
    tl.from('.hero-subtitle', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out"
    }, "-=0.6");
    
    // Blobs slow pulse
    gsap.to('.blob', {
        scale: 1.05,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: 0.5
    });
}

// 3D Tilt Effect for cards
function initCardTilt(card) {
    const imageWrapper = card.querySelector('.card-image-wrapper');
    const playBtn = card.querySelector('.play-btn');
    
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element
        const y = e.clientY - rect.top;  // y position within the element
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -15; // Max 15 deg tilt
        const rotateY = ((x - centerX) / centerX) * 15;
        
        gsap.to(card, {
            rotateX: rotateX,
            rotateY: rotateY,
            transformPerspective: 1000,
            duration: 0.4,
            ease: "power1.out"
        });
        
        // Parallax effect on inner elements
        if (imageWrapper) {
            gsap.to(imageWrapper, {
                scale: 1.05,
                x: rotateY * 0.5,
                y: -rotateX * 0.5,
                duration: 0.4
            });
        }
        
        if (playBtn) {
            gsap.to(playBtn, {
                z: 50,
                duration: 0.4
            });
        }
    });
    
    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.8,
            ease: "elastic.out(1, 0.5)"
        });
        
        if (imageWrapper) {
            gsap.to(imageWrapper, {
                scale: 1,
                x: 0,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.5)"
            });
        }
        
        if (playBtn) {
            gsap.to(playBtn, {
                z: 0,
                duration: 0.8
            });
        }
    });
}

// Render games with entrance animation
function renderGames(games, isInitialLoad = false) {
    catalogGrid.innerHTML = '';
    
    if (games.length === 0) {
        noResultsMessage.classList.remove('hidden');
        return;
    }
    
    noResultsMessage.classList.add('hidden');
    
    const cards = [];
    
    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        // Hide initially for GSAP
        gsap.set(card, { opacity: 0, y: 50 });
        
        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${game.image}" alt="${game.title}" class="card-image" loading="lazy">
                <div class="card-overlay"></div>
                <div class="platform-badge platform-${game.platform}">${game.platformName}</div>
                <button class="play-btn" aria-label="Jugar ${game.title}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
            </div>
            <div class="card-content">
                <h3 class="game-title">${game.title}</h3>
                <div class="game-meta">
                    <span class="genre">${game.genre}</span>
                    <span class="year">${game.year}</span>
                </div>
            </div>
        `;
        
        // Add click event
        card.querySelector('.play-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Play click animation
            gsap.to(e.currentTarget, {
                scale: 0.8,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                onComplete: () => launchGame(game)
            });
        });
        
        catalogGrid.appendChild(card);
        cards.push(card);
        
        // Initialize 3D hover
        initCardTilt(card);
    });
    
    // Animate cards in
    if (isInitialLoad) {
        // Wait for hero animations to finish roughly, then use ScrollTrigger
        ScrollTrigger.batch(cards, {
            onEnter: batch => gsap.to(batch, {
                opacity: 1, 
                y: 0, 
                stagger: 0.1, 
                duration: 0.8, 
                ease: "back.out(1.2)",
                overwrite: true
            }),
            start: "top 85%"
        });
    } else {
        // Instant stagger for filtering
        gsap.to(cards, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: "power2.out"
        });
    }
}

// Render consoles catalog
function renderConsoles() {
    consolesGrid.innerHTML = '';
    
    consolesDatabase.forEach(consoleItem => {
        const card = document.createElement('div');
        card.className = 'game-card'; // Reusing game-card class for glassmorphism
        
        card.innerHTML = `
            <div class="card-image-wrapper" style="height: 200px; background: rgba(255,255,255,0.05); padding: 20px;">
                <img src="${consoleItem.image}" alt="${consoleItem.name}" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5));" loading="lazy">
                <div class="card-overlay"></div>
            </div>
            <div class="card-content" style="text-align: center;">
                <h3 class="game-title" style="font-size: 1.3rem;">${consoleItem.name}</h3>
                <div class="game-meta" style="justify-content: center; margin-top: 10px;">
                    <span class="year">${consoleItem.year}</span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            // Switch back to games view and filter
            switchView('games');
            currentFilter = consoleItem.id;
            filterGames();
            catalogTitle.innerText = `Juegos de ${consoleItem.name}`;
            
            // Re-highlight the Games tab
            mainTabs.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-view="games"]').classList.add('active');
        });
        
        consolesGrid.appendChild(card);
        initCardTilt(card);
    });
}

// Filter Logic
let currentFilter = 'all';
let currentSearch = '';

function filterGames() {
    let filtered = gamesDatabase;
    
    if (currentSearch) {
        const searchLower = currentSearch.toLowerCase();
        filtered = filtered.filter(game => 
            game.title.toLowerCase().includes(searchLower) ||
            game.genre.toLowerCase().includes(searchLower)
        );
    }
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(game => game.emulator === currentFilter || game.platform === currentFilter);
    }
    
    // Exit animation for current cards, then render
    const currentCards = document.querySelectorAll('.game-card');
    if (currentCards.length > 0) {
        gsap.to(currentCards, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            stagger: 0.02,
            onComplete: () => renderGames(filtered, false)
        });
    } else {
        renderGames(filtered, false);
    }
}

// Emulator Logic

const DEFAULT_CONTROLS = {
    nes: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        select: "Space",
        start: "Enter",
        a: "KeyD",
        b: "KeyS"
    },
    n64: {
        analogUp: "ArrowUp",
        analogDown: "ArrowDown",
        analogLeft: "ArrowLeft",
        analogRight: "ArrowRight",
        actionUp: "KeyI",
        actionDown: "KeyK",
        actionLeft: "KeyJ",
        actionRight: "KeyL",
        up: "KeyT",
        down: "KeyG",
        left: "KeyF",
        right: "KeyH",
        start: "Enter",
        a: "KeyD",
        b: "KeyS",
        r: "KeyW",
        l: "KeyQ",
        z: "KeyZ"
    },
    gba: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        select: "KeyQ",
        start: "KeyW",
        a: "KeyX",
        b: "KeyZ",
        l: "KeyA",
        r: "KeyS"
    }
};

function getUserControls(emulator) {
    if (!DEFAULT_CONTROLS[emulator]) return null;
    
    // Check localStorage for saved user preferences
    const saved = localStorage.getItem('nexus_controls_' + emulator);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge in case we added new buttons to defaults
            return { ...DEFAULT_CONTROLS[emulator], ...parsed };
        } catch (e) {
            console.error("Error parsing saved controls", e);
        }
    }
    
    return { ...DEFAULT_CONTROLS[emulator] };
}
function launchGame(game) {
    currentEmulator = game.emulator;
    if (!game.emulator) {
        alert(`Iniciando ${game.title}... (Juego moderno o nativo)`);
        return;
    }

    const modal = document.getElementById('emulator-modal');
    const container = document.getElementById('game-container');
    container.setAttribute('data-game-id', game.id);
    
    modal.classList.remove('hidden');
    container.innerHTML = '<h2 style="color:white; font-family:var(--font-main);">Descargando ROM al navegador...</h2>';
    
    if (game.emulator === 'ps1') {
        // PlayStation specific modal setup if needed, otherwise default
        modal.style.background = '';
        modal.style.backdropFilter = '';
        modal.style.webkitBackdropFilter = '';
    } else {
        modal.style.background = '';
        modal.style.backdropFilter = '';
        modal.style.webkitBackdropFilter = '';
    }
    
    // Update Controls UI
    updateControlsUI(game.emulator);
    
    // Dynamic ROM path based on emulator folder
    const romPath = `assets/roms/${game.emulator}/${game.romFile}`;
    
    if (game.emulator === 'n64') {
        fetch(romPath)
            .then(response => {
                if(!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`ROM no encontrada.<br>Por favor, pon tu juego en: <br><strong style="color:white;">juegos/${romPath}</strong>`);
                    }
                    throw new Error("Error de red");
                }
                
                // Vite returns index.html for 404s in SPAs, prevent passing HTML to the emulator
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                     throw new Error(`ROM no encontrada (Vite devolvió HTML).<br>Por favor, pon tu juego en: <br><strong style="color:white;">juegos/${romPath}</strong>`);
                }
                
                return response.arrayBuffer();
            })
            .then(buffer => {
                container.innerHTML = ''; // clear loading text
                
                embedNintendo64({
                    container: "game-container",
                    name: game.title,
                    rom: buffer,
                    player1: getUserControls(game.emulator)
                });
            })
            .catch(err => {
                container.innerHTML = `
                    <div style="text-align: center;">
                        <h2 style="color:var(--accent-tertiary); font-family:var(--font-main); margin-bottom: 1rem;">⚠️ ${err.message}</h2>
                        <p style="color:var(--text-secondary); font-family:var(--font-main);">Para probar el emulador necesitas un archivo ROM real.</p>
                    </div>`;
            });
    } else if (game.emulator === 'nes') {
        fetch(romPath)
            .then(response => {
                if(!response.ok) throw new Error("ROM no encontrada");
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) throw new Error("ROM no encontrada (HTML devuelto)");
                return response.arrayBuffer();
            })
            .then(buffer => {
                container.innerHTML = '';
                embedNintendo({
                  container: "game-container",
                  name: game.romFile,
                  rom: buffer,
                  soundEnabled: true,
                  showMobileControls: false, // We'll manage our own UI
                  player1: getUserControls(game.emulator)
                });
            })
            .catch(err => {
                container.innerHTML = `
                    <div style="text-align: center;">
                        <h2 style="color:var(--accent-tertiary); font-family:var(--font-main); margin-bottom: 1rem;">⚠️ ${err.message}</h2>
                        <p style="color:var(--text-secondary); font-family:var(--font-main);">Verifica la ruta: juegos/${romPath}</p>
                    </div>`;
            });
    } else if (game.emulator === 'ps1') {
        fetch(romPath)
            .then(response => {
                if(!response.ok) throw new Error("ROM no encontrada");
                return response.arrayBuffer();
            })
            .then(buffer => {
                container.innerHTML = '';
                
                // PlayStation emulator expects ROMDATA to be a File object
                window.ROMDATA = new File([buffer], game.romFile);
                window.ROMNAME = game.romFile;
                
                window.styleCustomText = ""; // Required by PlayStation.js to not crash
                window.getSoundStatus = function() { return true; };
                
                container.innerHTML = '';
                
                // Clean up any old canvas if it exists
                const oldCanvas = document.getElementById('ps1-canvas');
                if (oldCanvas) oldCanvas.remove();
                
                // 1. We create the canvas explicitly and place it in the body.
                // 2. We use fixed positioning to overlay everything behind the transparent modal.
                // 3. We NEVER move it again, preserving WebGL context.
                const canvas = document.createElement('canvas');
                canvas.id = 'ps1-canvas';
                canvas.style.position = 'fixed';
                canvas.style.top = '0';
                canvas.style.left = '0';
                canvas.style.width = '100vw';
                canvas.style.height = '100vh';
                canvas.style.zIndex = '9998'; // Below the emulator modal actions (10000)
                canvas.style.backgroundColor = '#000';
                canvas.style.objectFit = 'contain';
                document.body.appendChild(canvas);
                
                // Configure Emscripten to use this canvas
                window.Module = window.Module || {};
                window.Module.canvas = canvas;
                
                // Make the modal transparent so we can see the canvas behind it
                const modal = document.getElementById('emulator-modal');
                modal.style.backgroundColor = 'transparent';
                
                // PlayStation emulator expects ROMDATA to be a File object
                window.ROMDATA = new File([buffer], game.romFile);
                window.ROMNAME = game.romFile;
                
                window.styleCustomText = ""; // Required by PlayStation.js to not crash
                window.getSoundStatus = function() { return true; };
                
                // Just in case PlayStation.js is an older version that creates a NEW canvas anyway (ignoring Module.canvas),
                // we observe the whole document (including head) and style any new canvas that isn't ours.
                const observer = new MutationObserver((mutations, obs) => {
                    let createdCanvas = document.querySelector('canvas:not(#ps1-canvas)');
                    if (createdCanvas && !createdCanvas.dataset.styled) {
                        createdCanvas.dataset.styled = "true";
                        createdCanvas.style.position = 'fixed';
                        createdCanvas.style.zIndex = '9998';
                        createdCanvas.style.width = '100vw';
                        createdCanvas.style.height = '100vh';
                        createdCanvas.style.top = '0';
                        createdCanvas.style.left = '0';
                        createdCanvas.style.backgroundColor = '#000';
                        createdCanvas.style.objectFit = 'contain';
                        
                        // If it appended it to head or something weird, we MUST move it to body to be visible.
                        if (createdCanvas.parentNode === document.head) {
                            document.body.appendChild(createdCanvas); 
                        }
                        
                        // Hide our pre-created one just in case
                        canvas.style.display = 'none';
                        obs.disconnect();
                    }
                });
                observer.observe(document.documentElement, { childList: true, subtree: true });
                
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.onload = function() {
                    setTimeout(function() {
                        if (typeof readFile === 'function') {
                            readFile(window.ROMDATA);
                        } else {
                            console.error("readFile function is not defined by PlayStation.js");
                        }
                    }, 500);
                };
                script.src = "emulators/ps1/PlayStation.js";
                document.head.appendChild(script);
            })
            .catch(err => {
                container.innerHTML = `
                    <div style="text-align: center;">
                        <h2 style="color:var(--accent-tertiary); font-family:var(--font-main); margin-bottom: 1rem;">⚠️ ${err.message}</h2>
                        <p style="color:var(--text-secondary); font-family:var(--font-main);">Verifica la ruta: juegos/${romPath}</p>
                    </div>`;
            });
    } else if (game.emulator === 'ps2') {
        // Implementación optimizada para Play.js (PS2 Emulator) usando carga diferida
        // Esto evita descargar la ISO entera (4GB+) en la RAM, lo cual colgaría el navegador
        container.innerHTML = '<canvas id="canvas" style="width:100%; height:100%; object-fit:contain;"></canvas>';
        const canvas = container.querySelector('canvas');
        
        // Configuración estándar de Emscripten para Play.js
        window.Module = window.Module || {};
        window.Module.canvas = canvas;
        
        window.Module.preRun = [function() {
            try {
                FS.createLazyFile('/', game.romFile, romPath, true, true);
                window.Module.arguments = [game.romFile];
            } catch (e) {
                console.error("Error montando ISO de PS2:", e);
            }
        }];
        
        // Play.js está compilado como ES Module, por lo que usamos importación dinámica
        import('./emulators/ps2/Play.js').then(module => {
            const Play = module.default;
            Play(window.Module).then(instance => {
                console.log("Play.js inicializado correctamente.");
            });
        }).catch(err => {
            console.error("Error cargando Play.js:", err);
            container.innerHTML = `
                <div style="text-align: center;">
                    <h2 style="color:var(--accent-tertiary); font-family:var(--font-main); margin-bottom: 1rem;">⚠️ Error cargando emulador</h2>
                    <p style="color:var(--text-secondary); font-family:var(--font-main);">No se pudo cargar el módulo ES de Play.js.</p>
                </div>`;
        });
    } else if (game.emulator === 'gba') {
        fetch(romPath)
            .then(response => {
                if(!response.ok) throw new Error("ROM no encontrada");
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) throw new Error("ROM no encontrada (HTML devuelto)");
                return response.arrayBuffer();
            })
            .then(buffer => {
                container.innerHTML = '<div id="gba-container" style="width:100%; height:100%; display:flex; justify-content:center; align-items:center;"></div>';
                
                embedGameBoyAdvance({
                  container: "gba-container",
                  name: game.romFile,
                  rom: buffer,
                  soundEnabled: true,
                  showMobileControls: false, // We'll handle custom controls if needed
                  player1: getUserControls(game.emulator)
                });
            })
            .catch(err => {
                container.innerHTML = `
                    <div style="text-align: center;">
                        <h2 style="color:var(--accent-tertiary); font-family:var(--font-main); margin-bottom: 1rem;">⚠️ ${err.message}</h2>
                        <p style="color:var(--text-secondary); font-family:var(--font-main);">Verifica la ruta: juegos/${romPath}</p>
                    </div>`;
            });
    } else if (game.emulator === 'nds') {
        fetch(romPath)
            .then(response => {
                if(!response.ok) throw new Error("ROM no encontrada");
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) throw new Error("ROM no encontrada (HTML devuelto)");
                return response.blob(); // Desmond loads from Blob URL
            })
            .then(blob => {
                container.innerHTML = `
                    <div id="nds-wrapper" style="width:100%; height:100%; display:flex; justify-content:center; align-items:center;">
                    </div>
                `;
                const wrapper = document.getElementById("nds-wrapper");
                const player = document.getElementById("nds-player");
                if (player) {
                    wrapper.appendChild(player); // Move from hidden to visible container
                    
                    // Inject styles into the open shadow DOM to make it responsive and large
                    if (player.shadowRoot && !player.shadowRoot.querySelector('#custom-styles')) {
                        const style = document.createElement("style");
                        style.id = "custom-styles";
                        style.textContent = `
                            #player {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                width: 100%;
                                height: 100%;
                            }
                            canvas {
                                width: 100%;
                                max-width: 600px;
                                height: auto;
                                margin-bottom: 4px;
                                border-radius: 4px;
                            }
                        `;
                        player.shadowRoot.appendChild(style);
                    }

                    player.loadURL(URL.createObjectURL(blob), function() {
                        console.log("Nintendo DS Loaded.");
                    });
                } else {
                    console.error("No se encontró el elemento nds-player en el DOM.");
                }
            })
            .catch(err => {
                container.innerHTML = `
                    <div style="text-align: center;">
                        <h2 style="color:var(--accent-tertiary); font-family:var(--font-main); margin-bottom: 1rem;">⚠️ ${err.message}</h2>
                        <p style="color:var(--text-secondary); font-family:var(--font-main);">Verifica la ruta: juegos/${romPath}</p>
                    </div>`;
            });
    } else {
        // Fallback for emulators that are not integrated yet
        container.innerHTML = `
            <div style="text-align: center;">
                <h2 style="color:var(--accent-secondary); font-family:var(--font-main); margin-bottom: 1rem;">Emulador para ${game.platformName} no integrado todavía</h2>
                <p style="color:white; font-family:var(--font-main);">Ruta esperada del juego: <strong>juegos/${romPath}</strong></p>
            </div>`;
    }
}

const CONTROLS_LABELS = {
    nes: {
        up: "Arriba", down: "Abajo", left: "Izquierda", right: "Derecha",
        a: "Botón A", b: "Botón B", select: "Select", start: "Start"
    },
    gba: {
        up: "Arriba", down: "Abajo", left: "Izquierda", right: "Derecha",
        a: "Botón A", b: "Botón B", l: "Gatillo L", r: "Gatillo R", select: "Select", start: "Start"
    },
    n64: {
        analogUp: "Analógico Arriba", analogDown: "Analógico Abajo", analogLeft: "Analógico Izq", analogRight: "Analógico Der",
        up: "D-Pad Arriba", down: "D-Pad Abajo", left: "D-Pad Izq", right: "D-Pad Der",
        actionUp: "Botón C Arriba", actionDown: "Botón C Abajo", actionLeft: "Botón C Izq", actionRight: "Botón C Der",
        a: "Botón A", b: "Botón B", z: "Gatillo Z", l: "Gatillo L", r: "Gatillo R", start: "Start"
    }
};

let currentEditingControls = null;
let currentEmulator = null;
let isEditingControls = false;

// Update Controls UI
function updateControlsUI(emulator) {
    currentEmulator = emulator;
    const list = document.getElementById('controls-list');
    const remapBtn = document.getElementById('remap-controls-btn');
    const saveBtn = document.getElementById('save-controls-btn');
    
    // Reset editing state
    isEditingControls = false;
    currentEditingControls = getUserControls(emulator);
    remapBtn.innerText = "Remapear Controles";
    remapBtn.style.background = "rgba(139, 92, 246, 0.4)";
    saveBtn.classList.add('hidden');
    
    let html = '';
    
    if (CONTROLS_LABELS[emulator]) {
        remapBtn.classList.remove('hidden');
        const labels = CONTROLS_LABELS[emulator];
        const controls = currentEditingControls;
        
        for (const [key, label] of Object.entries(labels)) {
            const mappedKey = controls[key] || "???";
            // Clean up visual representation (e.g., 'KeyD' -> 'D', 'ArrowUp' -> '↑')
            let visualKey = mappedKey.replace('Key', '').replace('Digit', '');
            if (visualKey === 'ArrowUp') visualKey = '↑';
            if (visualKey === 'ArrowDown') visualKey = '↓';
            if (visualKey === 'ArrowLeft') visualKey = '←';
            if (visualKey === 'ArrowRight') visualKey = '→';
            if (visualKey === 'Space') visualKey = 'Espacio';
            
            html += `
                <li>
                    <strong>${label}</strong> 
                    <div class="key-combo">
                        <kbd data-action="${key}" style="cursor: pointer;" title="Haz clic para cambiar">${visualKey}</kbd>
                    </div>
                </li>
            `;
        }
    } else if (emulator === 'ps1' || emulator === 'ps2') {
        remapBtn.classList.add('hidden'); // PlayStation controls are hardcoded in the emulator Core
        html = `
            <li><strong>Moverse</strong> <div class="key-combo"><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></div></li>
            <li><strong>Triángulo</strong> <div class="key-combo"><kbd>S</kbd></div></li>
            <li><strong>Cuadrado</strong> <div class="key-combo"><kbd>A</kbd></div></li>
            <li><strong>Equis (X)</strong> <div class="key-combo"><kbd>X</kbd></div></li>
            <li><strong>Círculo</strong> <div class="key-combo"><kbd>Z</kbd></div></li>
            <li><strong>Gatillos L1 / L2</strong> <div class="key-combo"><kbd>Q</kbd> / <kbd>E</kbd></div></li>
            <li><strong>Gatillos R1 / R2</strong> <div class="key-combo"><kbd>W</kbd> / <kbd>R</kbd></div></li>
            <li><strong>Start</strong> <div class="key-combo"><kbd>Enter</kbd></div></li>
            <li><strong>Select</strong> <div class="key-combo"><kbd>Shift</kbd></div></li>
        `;
    } else if (emulator === 'nds') {
        remapBtn.classList.add('hidden'); // Desmond has hardcoded controls
        html = `
            <li><strong>Moverse</strong> <div class="key-combo"><kbd>W</kbd><kbd>S</kbd><kbd>A</kbd><kbd>D</kbd></div></li>
            <li><strong>Botón A</strong> <div class="key-combo"><kbd>K</kbd></div></li>
            <li><strong>Botón B</strong> <div class="key-combo"><kbd>J</kbd></div></li>
            <li><strong>Botón X</strong> <div class="key-combo"><kbd>M</kbd></div></li>
            <li><strong>Botón Y</strong> <div class="key-combo"><kbd>N</kbd></div></li>
            <li><strong>Gatillo L</strong> <div class="key-combo"><kbd>Q</kbd></div></li>
            <li><strong>Gatillo R</strong> <div class="key-combo"><kbd>E</kbd></div></li>
            <li><strong>Start</strong> <div class="key-combo"><kbd>Enter</kbd></div></li>
            <li><strong>Select</strong> <div class="key-combo"><kbd>Shift</kbd></div></li>
            <li style="margin-top: 10px; text-align: center; font-size: 0.8rem;">El ratón actúa como el lápiz táctil en la pantalla inferior.</li>
        `;
    }
    list.innerHTML = html;
    
    // Add click listeners to kbds for remapping
    if (CONTROLS_LABELS[emulator]) {
        const kbds = list.querySelectorAll('kbd');
        kbds.forEach(kbd => {
            kbd.addEventListener('click', function() {
                if (!isEditingControls) return;
                
                // Reset all other kbds
                kbds.forEach(k => k.style.background = 'var(--accent-primary)');
                
                // Highlight current
                this.style.background = 'var(--accent-tertiary)';
                this.innerText = "...";
                
                const action = this.getAttribute('data-action');
                
                // Listen for next keypress (Use capture phase to intercept before emulator gets it)
                const handler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation(); // CRITICAL: Stop emulators from reading this key!
                    
                    window.removeEventListener('keydown', handler, true);
                    
                    const code = e.code;
                    currentEditingControls[action] = code;
                    
                    let visualKey = code.replace('Key', '').replace('Digit', '');
                    if (visualKey === 'ArrowUp') visualKey = '↑';
                    if (visualKey === 'ArrowDown') visualKey = '↓';
                    if (visualKey === 'ArrowLeft') visualKey = '←';
                    if (visualKey === 'ArrowRight') visualKey = '→';
                    if (visualKey === 'Space') visualKey = 'Espacio';
                    
                    this.innerText = visualKey;
                    this.style.background = 'var(--accent-primary)';
                };
                
                window.addEventListener('keydown', handler, true);
            });
        });
    }
}

// Event Listeners
document.getElementById('show-controls-btn').addEventListener('click', () => {
    document.getElementById('controls-overlay').classList.remove('hidden');
});

document.getElementById('remap-controls-btn').addEventListener('click', () => {
    isEditingControls = !isEditingControls;
    const remapBtn = document.getElementById('remap-controls-btn');
    const saveBtn = document.getElementById('save-controls-btn');
    
    if (isEditingControls) {
        remapBtn.innerText = "Cancelando...";
        remapBtn.style.background = "rgba(255, 0, 0, 0.4)";
        saveBtn.classList.remove('hidden');
        alert("Modo Edición Activado:\nHaz clic en cualquier tecla de la lista y presiona la nueva tecla que quieras asignarle en tu teclado.");
    } else {
        // Cancel, reload original UI
        updateControlsUI(currentEmulator);
    }
});

document.getElementById('save-controls-btn').addEventListener('click', () => {
    if (currentEmulator && currentEditingControls) {
        localStorage.setItem('nexus_controls_' + currentEmulator, JSON.stringify(currentEditingControls));
        alert("¡Controles guardados!\nRecarga el juego para aplicar los cambios.");
        updateControlsUI(currentEmulator); // Resets UI back to normal mode
    }
});

document.getElementById('close-controls-btn').addEventListener('click', () => {
    document.getElementById('controls-overlay').classList.add('hidden');
});

document.getElementById('close-emulator').addEventListener('click', () => {
    document.getElementById('close-emulator').innerHTML = "Guardando...";
    
    const doReload = () => window.location.reload();
    
    // Forzar el guardado del FileSystem en IndexedDB antes de recargar
    const fs = (window.FS) ? window.FS : (window.Module && window.Module.FS ? window.Module.FS : null);
    if (fs && typeof fs.syncfs === 'function') {
        try {
            fs.syncfs(false, (err) => {
                if (err) console.error("FS Sync Error:", err);
                doReload();
            });
        } catch (e) {
            doReload();
        }
    } else {
        doReload();
    }
});

// Auto-guardar SRAM cada 10 segundos en emuladores WASM (como Desmond)
setInterval(() => {
    const fs = (window.FS) ? window.FS : (window.Module && window.Module.FS ? window.Module.FS : null);
    if (fs && typeof fs.syncfs === 'function' && document.getElementById('emulator-modal') && !document.getElementById('emulator-modal').classList.contains('hidden')) {
        try {
            fs.syncfs(false, () => {});
        } catch (e) {}
    }
}, 10000);

document.getElementById('save-state-btn').addEventListener('click', () => {
    if (!currentUser) {
        alert("Debes iniciar sesión para guardar en la nube.");
        document.getElementById('auth-modal').classList.remove('hidden');
        return;
    }
    
    const gameId = document.getElementById('game-container').getAttribute('data-game-id');
    const game = gamesDatabase.find(g => String(g.id) === String(gameId));
    
    if (game && game.emulator === 'n64' && typeof downloadStateNintendo64 === 'function') {
        downloadStateNintendo64();
    } else if (game && game.emulator === 'nes' && typeof downloadStateNintendo === 'function') {
        downloadStateNintendo();
    } else if (game && game.emulator === 'gba' && typeof downloadStateGameBoyAdvance === 'function') {
        downloadStateGameBoyAdvance();
    } else {
        alert("El emulador no está corriendo o no soporta guardado.");
    }
});

document.getElementById('load-state-btn').addEventListener('click', () => {
    if (!currentUser) {
        alert("Debes iniciar sesión para cargar de la nube.");
        document.getElementById('auth-modal').classList.remove('hidden');
        return;
    }
    
    // Fetch from cloud instead of local file input
    const gameId = document.getElementById('game-container').getAttribute('data-game-id');
    const game = gamesDatabase.find(g => String(g.id) === String(gameId));
    
    fetch(`http://localhost:3001/api/saves/${currentUser}/${gameId}`)
        .then(response => {
            if (!response.ok) throw new Error("No hay partida en la nube para este juego.");
            return response.arrayBuffer();
        })
        .then(buffer => {
            // MAGIA NEGRA: El emulador oculta su sistema de archivos, así que interceptamos
            // el input de archivo que crea internamente y le inyectamos nuestro archivo de la nube.
            const originalCreateElement = document.createElement;
            let inputIntercepted = false;
            
            document.createElement = function(tagName) {
                const el = originalCreateElement.call(document, tagName);
                if (tagName.toLowerCase() === 'input') {
                    // ¡Bloqueamos el clic real para que no se abra la ventana de Windows!
                    el.click = function() {
                        console.log("Dialogo de archivo bloqueado por la inyección.");
                    };

                    // Cuando el emulador cree su input invisible, lo capturamos
                    setTimeout(() => {
                        if (el.type === 'file') {
                            try {
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(new File([buffer], 'state.state', { type: "application/octet-stream" }));
                                el.files = dataTransfer.files;
                                el.dispatchEvent(new Event('change')); // Simulamos que el usuario seleccionó el archivo
                                inputIntercepted = true;
                            } catch(e) {
                                console.error("Inyección automática fallida", e);
                            }
                        }
                    }, 10);
                }
                return el;
            };

            // Llamamos a la función del emulador que desencadenará nuestro hook
            if (game && game.emulator === 'n64' && typeof uploadStateNintendo64 === 'function') {
                uploadStateNintendo64();
            } else if (game && game.emulator === 'nes' && typeof uploadStateNintendo === 'function') {
                uploadStateNintendo();
            }

            // Restauramos la función original para no romper el resto de la web
            setTimeout(() => {
                document.createElement = originalCreateElement;
                if (!inputIntercepted) {
                    alert("Error inyectando partida automáticamente. Intenta cargarla de forma manual.");
                } else {
                    console.log("¡Partida de la nube inyectada con éxito!");
                }
            }, 500);
        })
        .catch(err => alert(err.message));
});

searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    filterGames();
});

// ==========================================
// Cloud Saves & Auth Logic
// ==========================================
let currentUser = localStorage.getItem('nexus_user') || null;
let isLoginMode = true;

function updateAuthUI() {
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        if (currentUser === 'tosito' || currentUser === 'admin') {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
    }

    if (currentUser) {
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('user-display').classList.remove('hidden');
        document.getElementById('user-display').innerHTML = `👤 ${currentUser} | <a href="#" id="logout-btn" style="color:var(--accent-primary);">Salir</a>`;
        
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('nexus_user');
            currentUser = null;
            updateAuthUI();
        });
    } else {
        document.getElementById('login-btn').classList.remove('hidden');
        document.getElementById('user-display').classList.add('hidden');
    }
}
updateAuthUI();

document.getElementById('login-btn').addEventListener('click', () => {
    isLoginMode = true;
    document.getElementById('auth-title').innerText = "Iniciar Sesión";
    document.getElementById('auth-submit').innerText = "Entrar";
    document.getElementById('auth-toggle').innerHTML = `¿No tienes cuenta? <a href="#">Regístrate aquí</a>`;
    document.getElementById('auth-modal').classList.remove('hidden');
});

document.getElementById('auth-close').addEventListener('click', () => {
    document.getElementById('auth-modal').classList.add('hidden');
});

document.getElementById('auth-toggle').addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        document.getElementById('auth-title').innerText = isLoginMode ? "Iniciar Sesión" : "Registrarse";
        document.getElementById('auth-submit').innerText = isLoginMode ? "Entrar" : "Crear Cuenta";
        document.getElementById('auth-toggle').innerHTML = isLoginMode ? 
            `¿No tienes cuenta? <a href="#">Regístrate aquí</a>` : 
            `¿Ya tienes cuenta? <a href="#">Inicia sesión aquí</a>`;
    }
});

document.getElementById('auth-submit').addEventListener('click', () => {
    const user = document.getElementById('auth-username').value;
    const pass = document.getElementById('auth-password').value;
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    
    fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
    })
    .then(r => r.json().then(data => ({ status: r.status, body: data })))
    .then(({ status, body }) => {
        if (status === 200) {
            currentUser = user;
            localStorage.setItem('nexus_user', user);
            updateAuthUI();
            document.getElementById('auth-modal').classList.add('hidden');
            alert(body.message);
        } else {
            alert(body.error);
        }
    })
    .catch(err => alert("Error de conexión con el backend: " + err));
});

// Intercept Emulator Save Download
const originalClick = HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click = function() {
    const isSaveFile = this.download && (
        this.download.endsWith('.sav') || 
        this.download.toLowerCase() === 'state' ||
        this.download.toLowerCase().includes('state')
    );
    const isBlob = this.href && this.href.startsWith('blob:');

    if (isSaveFile || isBlob) {
        // It's trying to download a save file! Intercept it for Cloud Save.
        if (currentUser) {
            const gameId = document.getElementById('game-container').getAttribute('data-game-id') || 'unknown_game';
            fetch(this.href).then(r => r.blob()).then(blob => {
                const formData = new FormData();
                formData.append('savefile', blob, `${gameId}.sav`);
                
                fetch(`http://localhost:3001/api/saves/${currentUser}/${gameId}`, {
                    method: 'POST',
                    body: formData
                })
                .then(r => r.json())
                .then(data => alert("¡NUBE: " + data.message + "!"))
                .catch(e => alert("Error subiendo a la nube: " + e));
            });
            return; // Prevent local download since it went to cloud
        }
    }
    return originalClick.call(this);
};

// Profile Modal Logic
document.getElementById('user-display').addEventListener('click', (e) => {
    if (e.target.tagName === 'A') return; // Don't trigger if clicking "Salir"
    if (!currentUser) return;
    
    document.getElementById('profile-modal').classList.remove('hidden');
    const savesList = document.getElementById('saves-list');
    savesList.innerHTML = '<p style="color:white;">Cargando partidas...</p>';
    
    fetch(`http://localhost:3001/api/user/saves/${currentUser}`)
        .then(r => r.json())
        .then(data => {
            const saves = data.saves;
            if (saves.length === 0) {
                savesList.innerHTML = '<p style="color:white;">No tienes partidas guardadas en la nube aún.</p>';
                return;
            }
            
            savesList.innerHTML = '';
            saves.forEach(saveId => {
                const game = gamesDatabase.find(g => String(g.id) === String(saveId));
                if (game) {
                    const card = document.createElement('div');
                    card.className = 'save-card';
                    card.innerHTML = `
                        <img src="${game.image}" alt="${game.title}">
                        <h3>${game.title}</h3>
                        <button class="glass-btn continue-btn">Continuar</button>
                    `;
                    card.querySelector('.continue-btn').addEventListener('click', () => {
                        document.getElementById('profile-modal').classList.add('hidden');
                        launchGame(game);
                        // Trigger load state after emulator boots
                        setTimeout(() => {
                            document.getElementById('load-state-btn').click();
                        }, 2500); // Wait 2.5 seconds for emulator to boot up
                    });
                    savesList.appendChild(card);
                }
            });
        })
        .catch(err => {
            savesList.innerHTML = '<p style="color:red;">Error cargando partidas.</p>';
        });
});

document.getElementById('profile-close').addEventListener('click', () => {
    document.getElementById('profile-modal').classList.add('hidden');
});

// View Switching Logic
function switchView(view) {
    if (view === 'games') {
        consolesGrid.classList.add('hidden');
        catalogGrid.classList.remove('hidden');
        searchContainer.classList.remove('hidden');
        catalogTitle.innerText = "Catálogo Completo";
        currentFilter = 'all'; // reset filter when clicking "Juegos" tab
        filterGames();
    } else if (view === 'consoles') {
        catalogGrid.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
        searchContainer.classList.add('hidden');
        consolesGrid.classList.remove('hidden');
        catalogTitle.innerText = "Catálogo de Consolas";
        renderConsoles();
    }
}

mainTabs.forEach(btn => {
    btn.addEventListener('click', (e) => {
        mainTabs.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        switchView(e.currentTarget.getAttribute('data-view'));
    });
});

// Boot up
document.addEventListener('DOMContentLoaded', () => {
    initIntroAnimations();
    
    // Fetch games dynamically from the backend API
    fetch('/api/games')
        .then(res => res.json())
        .then(data => {
            gamesDatabase = data;
            renderGames(gamesDatabase, true);
            renderConsoles();
        })
        .catch(err => {
            console.error("Error al cargar los juegos del servidor:", err);
            catalogGrid.innerHTML = '<div style="color:white;text-align:center;width:100%;padding:2rem;">Error al conectar con el servidor de juegos. (Asegúrate de que el backend en el puerto 3001 esté corriendo)</div>';
        });
});

// ==========================================
// MANDO MÓVIL (MOBILE CONTROLLER)
// ==========================================
document.getElementById('mobile-controller-btn').addEventListener('click', () => {
    initVirtualGamepad();
    const qrModal = document.getElementById('qr-modal');
    const qrStatus = document.getElementById('qr-status');
    const qrContainer = document.getElementById('qrcode');
    qrModal.classList.remove('hidden');
    qrStatus.innerText = "Conectando al servidor y obteniendo IP...";
    qrContainer.innerHTML = '';
    
    // Conectar a Socket.io si no lo está
    if (!socketClient) {
        socketClient = io();
        
        socketClient.on('connect', () => {
            console.log("Conectado al servidor WebSocket.");
        });
        
        socketClient.on('gamepad_input', (data) => {
            // Update virtualGamepad buttons
            if (virtualGamepad && virtualGamepad.buttons[data.button]) {
                virtualGamepad.buttons[data.button].pressed = data.pressed;
                virtualGamepad.buttons[data.button].value = data.pressed ? 1.0 : 0.0;
                virtualGamepad.timestamp = performance.now();
            }
            
            // SYNTHESIZE KEYBOARD EVENTS FOR UNIVERSAL COMPATIBILITY (GBA, NES, PS1, PS2...)
            if (currentEmulator) {
                const keyCode = getKeyCodeForGamepadButton(currentEmulator, data.button);
                if (keyCode) {
                    // Try to get legacy keyCode number if needed by some emulators
                    let legacyCode = 0;
                    if (keyCode.startsWith('Key')) legacyCode = keyCode.charCodeAt(3); // Rough approximation
                    if (keyCode === 'Enter') legacyCode = 13;
                    if (keyCode === 'ShiftRight' || keyCode === 'ShiftLeft' || keyCode === 'Shift') legacyCode = 16;
                    if (keyCode === 'Space') legacyCode = 32;
                    if (keyCode === 'ArrowUp') legacyCode = 38;
                    if (keyCode === 'ArrowDown') legacyCode = 40;
                    if (keyCode === 'ArrowLeft') legacyCode = 37;
                    if (keyCode === 'ArrowRight') legacyCode = 39;
                    
                    const eventType = data.pressed ? 'keydown' : 'keyup';
                    
                    // Dispatch to window (GBA, NES, N64)
                    window.dispatchEvent(new KeyboardEvent(eventType, {
                        key: keyCode, code: keyCode, keyCode: legacyCode, which: legacyCode, bubbles: true, cancelable: true
                    }));
                    
                    // Dispatch to document (some emulators bind to document)
                    document.dispatchEvent(new KeyboardEvent(eventType, {
                        key: keyCode, code: keyCode, keyCode: legacyCode, which: legacyCode, bubbles: true, cancelable: true
                    }));
                    
                    // Dispatch to Module.canvas (Play.js, PlayStation.js, etc)
                    if (window.Module && window.Module.canvas) {
                        window.Module.canvas.dispatchEvent(new KeyboardEvent(eventType, {
                            key: keyCode, code: keyCode, keyCode: legacyCode, which: legacyCode, bubbles: true, cancelable: true
                        }));
                    }
                }
            }
        });
    }

    // Obtener IP y generar sala
    fetch('/api/ip')
        .then(res => res.json())
        .then(data => {
            const roomId = Math.random().toString(36).substring(7);
            socketClient.emit('join_room', roomId);
            
            const currentPort = window.location.port ? `:${window.location.port}` : '';
            const controllerUrl = `http://${data.ip}${currentPort}/controller.html?room=${roomId}`;
            
            // Generar QR
            new QRCode(qrContainer, {
                text: controllerUrl,
                width: 200,
                height: 200,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
            
            qrStatus.innerHTML = `O visita manualmente:<br><a href="${controllerUrl}" target="_blank" style="color:var(--accent-primary); word-break: break-all;">${controllerUrl}</a>`;
        })
        .catch(err => {
            qrStatus.innerText = "Error obteniendo IP: " + err.message;
        });
});

document.getElementById('close-qr-btn').addEventListener('click', () => {
    document.getElementById('qr-modal').classList.add('hidden');
});

// HELPER FOR UNIVERSAL GAMEPAD TO KEYBOARD MAPPING
function getKeyCodeForGamepadButton(emulator, btnIndex) {
    // Standard map indices
    // 0:A, 1:B, 2:X, 3:Y, 4:L, 5:R, 8:Select, 9:Start
    // 12:Up, 13:Down, 14:Left, 15:Right
    
    // Check if there are user controls configured
    const controls = getUserControls(emulator);
    
    if (emulator === 'nes') {
        const map = {0:'a', 1:'b', 8:'select', 9:'start', 12:'up', 13:'down', 14:'left', 15:'right'};
        return map[btnIndex] ? controls[map[btnIndex]] : null;
    } else if (emulator === 'gba') {
        const map = {0:'a', 1:'b', 4:'l', 5:'r', 8:'select', 9:'start', 12:'up', 13:'down', 14:'left', 15:'right'};
        return map[btnIndex] ? controls[map[btnIndex]] : null;
    } else if (emulator === 'n64') {
        // N64: A=0, B=1, Z=8(Select), L=4, R=5, Start=9
        // D-pad = Analog Stick (or we map D-Pad to Analog for simplicity)
        const map = {0:'a', 1:'b', 2:'actionUp', 3:'actionDown', 4:'l', 5:'r', 8:'z', 9:'start', 12:'analogUp', 13:'analogDown', 14:'analogLeft', 15:'analogRight'};
        return map[btnIndex] ? controls[map[btnIndex]] : null;
    } else if (emulator === 'ps1' || emulator === 'ps2') {
        // Hardcoded mapping based on updateControlsUI
        const map = {
            0: 'KeyX', 1: 'KeyZ', 2: 'KeyA', 3: 'KeyS', 
            4: 'KeyQ', 5: 'KeyW', 
            8: 'ShiftRight', 9: 'Enter', 
            12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight'
        };
        return map[btnIndex] || null;
    } else if (emulator === 'nds') {
        // Hardcoded mapping for Desmond
        const map = {
            0: 'KeyK', 1: 'KeyJ', 2: 'KeyM', 3: 'KeyN', 
            4: 'KeyQ', 5: 'KeyE', 
            8: 'ShiftRight', 9: 'Enter', 
            12: 'KeyW', 13: 'KeyS', 14: 'KeyA', 15: 'KeyD'
        };
        return map[btnIndex] || null;
    }
    return null;
}
