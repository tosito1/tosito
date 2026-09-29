
        gsap.registerPlugin(ScrollTrigger, Flip);

        let lenis, synth, noiseSynth, kickDrum, bassSynth, beatLoop;
        let isAudioEnabled = true;
        const darkScale = ["C3", "Eb3", "G3", "Bb3", "C4", "Eb4"];
        let audioInited = false;

        async function initAudio() {
            if (audioInited) return;
            await Tone.start();
            audioInited = true;

            const reverb = new Tone.Reverb({ decay: 6, preDelay: 0.1 }).toDestination();
            const delay = new Tone.FeedbackDelay("8n", 0.5).connect(reverb);
            const dist = new Tone.Distortion(0.6).connect(delay);

            synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sawtooth" },
                envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 2 }
            }).connect(dist);
            synth.volume.value = -18;

            const filter = new Tone.Filter(1500, "highpass").toDestination();
            noiseSynth = new Tone.NoiseSynth({
                noise: { type: "pink" },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
            }).connect(filter);
            noiseSynth.volume.value = -12;

            kickDrum = new Tone.MembraneSynth().toDestination();
            kickDrum.volume.value = -5;

            bassSynth = new Tone.MonoSynth({
                oscillator: { type: "sawtooth" },
                filter: { Q: 2, type: "lowpass", rolloff: -24 },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
            }).toDestination();
            bassSynth.volume.value = -12;

            beatLoop = new Tone.Loop(time => {
                kickDrum.triggerAttackRelease("C1", "8n", time);
                if (Math.random() > 0.4) bassSynth.triggerAttackRelease("C2", "16n", time + 0.25);
                if (Math.random() > 0.8) noiseSynth.triggerAttackRelease("32n", time + 0.5);
            }, "4n");
            Tone.Transport.bpm.value = 110;
        }

        function playDarkNote() { if (!synth || !isAudioEnabled) return; try { synth.triggerAttackRelease(darkScale[Math.floor(Math.random() * darkScale.length)], "16n", "+0.05"); } catch (e) { } }
        function playSprayNoise() { if (!noiseSynth || !isAudioEnabled) return; try { noiseSynth.triggerAttackRelease("32n", "+0.05"); } catch (e) { } }

        document.getElementById('sound-toggle').addEventListener('click', function () {
            isAudioEnabled = !isAudioEnabled;
            this.innerHTML = isAudioEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute text-gray-500"></i>';
            this.style.opacity = isAudioEnabled ? '1' : '0.5';
            if (!isAudioEnabled && isRadioPlaying) toggleRadio();
        });

        let isRadioPlaying = false;
        function toggleRadio() {
            if (!audioInited) initAudio();
            if (!isAudioEnabled) return;
            isRadioPlaying = !isRadioPlaying;
            const btn = document.getElementById('radio-btn');
            if (isRadioPlaying) {
                Tone.Transport.start(); beatLoop.start(0);
                btn.style.opacity = '1'; btn.classList.add('animate-pulse'); btn.innerHTML = '<i class="fas fa-broadcast-tower"></i>';
            } else {
                beatLoop.stop(); Tone.Transport.stop();
                btn.style.opacity = '0.5'; btn.classList.remove('animate-pulse'); btn.innerHTML = '<i class="fas fa-radio"></i>';
            }
        }
        document.getElementById('radio-btn').addEventListener('click', toggleRadio);

        const bootLines = ["Iniciando OS_CAOS v9.4...", "Cargando núcleo base... [OK]", "Estableciendo conexión... [OK]", "Verificando credenciales...", "ERROR: Acceso denegado.", "Bypassing firewall...", "Inyectando script...", "ALERTA: Toxicidad alta.", "Preparando interfaz..."];

        function runBootSequence() {
            const bootText = document.getElementById('boot-text');
            let delay = 0;
            bootLines.forEach((line, index) => {
                setTimeout(() => {
                    bootText.innerHTML += line + "<br>";
                    if (index === bootLines.length - 1) {
                        setTimeout(() => {
                            document.getElementById('boot-screen').style.display = 'none';
                            document.getElementById('unlock-screen').style.display = 'flex';
                            setupHoldInteraction();
                        }, 800);
                    }
                }, delay);
                delay += Math.random() * 200 + 50;
            });
        }
        window.iniciarApp = () => {
            cargarRecuerdos();
            cargarHistoria();
            runBootSequence();
        };

        function setupHoldInteraction() {
            const btn = document.getElementById('unlock-btn');
            const pBar = document.getElementById('hold-progress-bar');
            const pContainer = document.getElementById('hold-progress-container');
            const icons = [document.getElementById('icon-heart'), document.getElementById('icon-cat'), document.getElementById('icon-bolt')];
            let holdTimer, progress = 0, isHolding = false;

            const startHold = (e) => {
                if (e && e.cancelable) e.preventDefault();

                if (isHolding) return;
                isHolding = true;

                // Iniciamos el motor de audio SIN usar "await" para no bloquear la animación visual en móviles
                initAudio().catch(e => console.log("Audio int delay:", e));

                pContainer.style.opacity = '1'; document.getElementById('hold-warning').style.opacity = '1';
                document.getElementById('lock-title').style.animation = "glitch-anim-1 0.1s infinite";

                holdTimer = setInterval(() => {
                    progress += 1.5; // Un poco más lento para el reto
                    pBar.style.width = `${progress}%`;

                    // RETO: El botón se vuelve inestable
                    if (progress > 15) {
                        const intensity = (progress / 100) * 20;
                        gsap.to(btn, {
                            x: (Math.random() - 0.5) * intensity,
                            y: (Math.random() - 0.5) * intensity,
                            rotation: (Math.random() - 0.5) * (intensity / 2),
                            duration: 0.05
                        });
                    }

                    if (Math.random() > 0.8) playSprayNoise();
                    icons.forEach(icon => gsap.to(icon, { color: Math.random() > 0.5 ? '#39ff14' : '#b026ff', duration: 0.1 }));
                    if (progress >= 100) { clearInterval(holdTimer); triggerUnlock(); }
                }, 30);
            };

            const endHold = () => {
                if (progress >= 100) return;
                isHolding = false; clearInterval(holdTimer); progress = 0; pBar.style.width = '0%';
                document.getElementById('lock-title').style.animation = "glitch-anim-1 2.5s infinite linear alternate-reverse";
                gsap.to(btn, { x: 0, y: 0, rotation: 0, duration: 0.2 });
                pContainer.style.opacity = '0'; document.getElementById('hold-warning').style.opacity = '0';
                icons.forEach(icon => gsap.to(icon, { color: '#0a0a0a', duration: 0.2 }));
            };

            // Usamos "Pointer Events", el estándar más moderno y robusto para pantallas táctiles
            btn.addEventListener('pointerdown', startHold);
            btn.addEventListener('pointerup', endHold);
            btn.addEventListener('pointerleave', endHold);
            btn.addEventListener('pointercancel', endHold);

            // Seguros extra contra comportamientos nativos de los móviles (iOS / Android)
            btn.addEventListener('contextmenu', e => e.preventDefault());
            btn.addEventListener('selectstart', e => e.preventDefault());
        }

        function triggerUnlock() {
            if (kickDrum) kickDrum.triggerAttackRelease("C1", "8n");
            // Aseguramos que el audio esté activado al entrar
            if (window.unlockAudio) window.unlockAudio(); 
            if (!audioInited) initAudio();
            
            gsap.to("#unlock-screen", {
                opacity: 0, duration: 0.5, onComplete: () => {
                    document.getElementById('unlock-screen').style.display = 'none';
                    document.getElementById('intro-cinematica').style.display = 'flex';
                    initSmoothScroll(); playIntroCinematica();
                }
            });
        }

        function initSmoothScroll() {
            // Desactivamos Lenis en pantallas muy pequeñas por rendimiento si es necesario, pero suele ir bien.
            lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smooth: true, smoothTouch: false });
            lenis.on('scroll', ScrollTrigger.update);
            lenis.on('scroll', (e) => {
                const scrollable = document.documentElement.scrollHeight - window.innerHeight;
                if (scrollable > 0) document.getElementById('scroll-progress-bar').style.width = ((window.scrollY / scrollable) * 100) + '%';
            });
            gsap.ticker.add((time) => { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0);
        }

        function playIntroCinematica() {
            const tl = gsap.timeline();
            const polaroids = document.querySelectorAll('.intro-polaroid');
            gsap.set(polaroids, { scale: 0.1, opacity: 0 });
            gsap.set(polaroids[0], { x: -300, y: -300, rotation: -90 });
            gsap.set(polaroids[1], { x: 300, y: -200, rotation: 90 });
            gsap.set(polaroids[2], { x: -200, y: 300, rotation: -60 });
            gsap.set(polaroids[3], { y: 400, rotation: 30 });

            tl.to('.intro-text:nth-child(1)', { opacity: 1, scale: 1.1, duration: 1, ease: "expo.out", onStart: playSprayNoise })
                .to('.intro-text:nth-child(1)', { opacity: 0, duration: 0.2, delay: 0.5 })
                .to('.intro-text:nth-child(2)', { opacity: 1, scale: 1.1, duration: 1, ease: "expo.out", onStart: playSprayNoise })
                .to('.intro-text:nth-child(2)', { opacity: 0, duration: 0.2, delay: 0.5 })

                .to(polaroids[0], { x: -30, y: 20, rotation: -25, scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2)", onStart: () => { if (synth) synth.triggerAttackRelease("C3", "8n"); } })
                .to(polaroids[1], { x: 30, y: -20, rotation: 20, scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2)" }, "-=0.4")
                .to(polaroids[2], { x: -15, y: -25, rotation: 10, scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2)" }, "-=0.4")
                .to(polaroids[3], { x: 0, y: 0, rotation: -4, scale: 1.1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.4)", onStart: () => { if (synth) synth.triggerAttackRelease(["C3", "G3", "C4"], "4n"); playSprayNoise(); } }, "-=0.2")

                .to({}, { duration: 1.2 })
                .to("#camera-flash", { opacity: 1, duration: 0.05, onStart: () => { playSprayNoise(); if (kickDrum) kickDrum.triggerAttackRelease("C1", "8n"); } })
                .to(polaroids, { scale: 10, opacity: 0, duration: 0.8, stagger: 0.05, ease: "expo.in" })
                .to("#camera-flash", { opacity: 0, duration: 0.8 }, "-=0.8")
                .to("#intro-cinematica", { opacity: 0, duration: 0.5 }, "-=0.5")
                .set("#intro-cinematica", { display: "none" })
                .set("#main-content", { display: "block" })
                .to("#main-content", { opacity: 1, duration: 1 }, "-=0.2")
                .add(animarHero);
        }

        function animarHero() {
            gsap.timeline().to('.hero-subtitle', { y: 0, opacity: 1, duration: 1, ease: "expo.out" })
                .to('.hero-line', { scaleY: 1, duration: 1, ease: "expo.inOut" }, "-=0.5")
                .to('.parallax-layer', { opacity: 1, y: 0, scale: 1, duration: 1.5, stagger: 0.2, ease: "back.out(1.2)" }, "-=0.5");
            iniciarScrollTriggers();
        }

        function scrambleText(element) {
            if (element.dataset.scrambled === "true") return;
            const final = element.getAttribute('data-final'); if (!final) return;
            element.dataset.scrambled = "true";
            const chars = '!<>-_\\/[]{}—=+*^?#_@%$'; let iteration = 0;
            element.style.opacity = 1; element.style.visibility = 'visible';
            const interval = setInterval(() => {
                element.innerText = final.split('').map((letter, index) => {
                    if (index < iteration) return final[index];
                    return letter === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
                }).join('');
                if (iteration >= final.length) clearInterval(interval);
                iteration += 1 / 2.5; // Un pelín más rápido
            }, 30);
        }

        let currentHAudio = null;
        let ytPlayer = null;
        let audioContextUnlocked = false;

        // Función para "desbloquear" TODO el sistema de audio
        window.unlockAudio = () => {
            if (audioContextUnlocked) return;
            console.log("Attempting Master Audio Unlock...");
            
            // 1. Unmute Tone.js
            Tone.start();
            
            // 2. Unmute HTML5 Audio
            const dummy = new Audio();
            dummy.volume = 0;
            dummy.play().catch(() => {});

            // 3. Unmute YouTube si ya está listo
            if (ytPlayer && ytPlayer.unMute) {
                try {
                    ytPlayer.unMute();
                    ytPlayer.playVideo();
                    setTimeout(() => ytPlayer.stopVideo(), 100);
                } catch(e) {}
            }
            
            audioContextUnlocked = true;
        };

        // Inicializar YouTube Player
        window.onYouTubeIframeAPIReady = () => {
            const div = document.createElement('div');
            div.id = 'yt-hidden-player';
            div.style.position = 'fixed';
            div.style.left = '-9999px';
            div.style.top = '0';
            div.style.width = '1px';
            div.style.height = '1px';
            div.style.pointerEvents = 'none';
            document.body.appendChild(div);
            ytPlayer = new YT.Player('yt-hidden-player', {
                height: '1', width: '1',
                playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1, 'playsinline': 1, 'mute': 0 },
                events: { 
                    'onReady': (e) => {
                        console.log("YouTube API Ready");
                        e.target.setVolume(0);
                        if (audioContextUnlocked) e.target.unMute();
                    },
                    'onStateChange': (e) => {
                        if (e.data === YT.PlayerState.PLAYING) {
                            console.log("YouTube actually playing");
                        }
                    }
                }
            });
        };

        function iniciarScrollTriggers() {
            gsap.to("#story-line", { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: "#historia", start: "top center", end: "bottom center", scrub: 1 } });
            
            // Scramble de títulos fijos (ej: "El Origen", "Nuestras movidas")
            gsap.utils.toArray('.scramble-target').forEach(el => { 
                ScrollTrigger.create({ 
                    trigger: el, 
                    start: "top 90%", 
                    onEnter: () => scrambleText(el),
                    onEnterBack: () => scrambleText(el)
                }); 
            });

            const galleryScroll = document.getElementById("galeria-scroll");
            const scrollWidth = window.innerWidth < 768 ? galleryScroll.scrollWidth - window.innerWidth + 50 : galleryScroll.scrollWidth - window.innerWidth;
            const horizontalTween = gsap.to(galleryScroll, {
                x: -scrollWidth, ease: "none",
                scrollTrigger: { trigger: "#galeria-pin", pin: true, scrub: 1, end: () => "+=" + scrollWidth }
            });
            gsap.to("#scroll-progress", { width: "100%", ease: "none", scrollTrigger: { trigger: "#galeria-pin", start: "top top", end: () => "+=" + scrollWidth, scrub: true } });

            window.addEventListener('recuerdos-cargados', () => {
                gsap.utils.toArray('#galeria-scroll .polaroid-wrapper').forEach(wrapper => {
                    gsap.from(wrapper, {
                        rotation: (Math.random() * 40) - 20, y: 150, scale: 0.6, opacity: 0,
                        duration: 1.5, ease: "elastic.out(1, 0.75)",
                        scrollTrigger: {
                            trigger: wrapper,
                            containerAnimation: horizontalTween,
                            start: "left 95%"
                        }
                    });
                });
            });
        }

        function extraerYTId(url) {
            if (!url) return null;
            console.log("Checking URL for YT ID:", url);
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
            const id = match ? match[1] : null;
            console.log("Extracted ID:", id);
            return id;
        }

        function transformarUrlAudio(url) {
            if (!url) return "";
            if (url.includes("drive.google.com")) {
                const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
                if (match && match[1]) return `https://drive.google.com/uc?id=${match[1]}&export=media`;
            }
            return url;
        }

        let audioTransitionTimeout = null;
        let lastAudioUrl = null;

        function updateHistoryMedia(bpm, audioUrl) {
            console.log("Update Media Triggered:", { bpm, audioUrl });
            
            // Si es el mismo audio que ya suena, no hacemos nada
            if (audioUrl === lastAudioUrl && audioUrl !== null) return;
            
            // Cancelamos cualquier "parada" pendiente para evitar huecos de silencio al scrollear rápido
            if (audioTransitionTimeout) { clearTimeout(audioTransitionTimeout); audioTransitionTimeout = null; }

            if (audioUrl === null) {
                // Si salimos de una zona, esperamos un poco antes de parar por si entramos en otra rápido
                audioTransitionTimeout = setTimeout(() => {
                    console.log("Stopping audio (debounced)");
                    lastAudioUrl = null;
                    if (ytPlayer && ytPlayer.stopVideo) {
                        const volObj = { v: ytPlayer.getVolume() || 0 };
                        gsap.to(volObj, { v: 0, duration: 1, onUpdate: () => ytPlayer.setVolume(volObj.v), onComplete: () => ytPlayer.stopVideo() });
                    }
                    if (currentHAudio) {
                        const old = currentHAudio;
                        gsap.to(old, { volume: 0, duration: 1.5, onComplete: () => { old.pause(); old.remove(); } });
                        currentHAudio = null;
                    }
                }, 100);
                return;
            }

            lastAudioUrl = audioUrl;
            if (!isAudioEnabled) { console.log("Audio disabled, skipping"); return; }
            
            if (bpm && isRadioPlaying) gsap.to(Tone.Transport, { bpm: bpm, duration: 2 });

            const ytId = extraerYTId(audioUrl);
            const realUrl = transformarUrlAudio(audioUrl);

            // Manejo de YouTube
            if (ytId && ytPlayer && ytPlayer.loadVideoById) {
                // Verificar si ya está sonando ese vídeo exacto
                try {
                    const currentData = ytPlayer.getVideoData();
                    if (currentData && currentData.video_id === ytId && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                        console.log("YouTube video already playing, skipping reload");
                        return;
                    }
                } catch(e) {}

                if (currentHAudio) { 
                    gsap.to(currentHAudio, { volume: 0, duration: 1, onComplete: () => { currentHAudio.pause(); currentHAudio = null; } }); 
                }
                
                console.log("Commanding YouTube to play ID:", ytId);
                try {
                    ytPlayer.unMute();
                    ytPlayer.loadVideoById(ytId);
                    ytPlayer.playVideo();
                    const volObj = { v: 0 };
                    gsap.to(volObj, { v: 70, duration: 2, onUpdate: () => ytPlayer.setVolume(volObj.v) });
                } catch(e) { console.error("YT Player Error:", e); }
                return;
            } 

            // Manejo de Archivo Directo / Drive
            if (realUrl && !ytId) {
                if (currentHAudio && currentHAudio.dataset.src === realUrl) return;
                
                // Si pasamos de YT a Audio, paramos YT con fade
                if (ytPlayer && ytPlayer.stopVideo) {
                    const volObj = { v: ytPlayer.getVolume() || 0 };
                    gsap.to(volObj, { v: 0, duration: 1, onUpdate: () => ytPlayer.setVolume(volObj.v), onComplete: () => ytPlayer.stopVideo() });
                }

                if (currentHAudio) {
                    const old = currentHAudio;
                    gsap.to(old, { volume: 0, duration: 1.5, onComplete: () => { old.pause(); old.remove(); } });
                }
                
                const audio = new Audio(realUrl);
                audio.dataset.src = realUrl;
                audio.volume = 0;
                audio.loop = true;
                currentHAudio = audio;
                audio.play().catch(() => {
                    window.addEventListener('click', () => { if (currentHAudio) currentHAudio.play(); }, { once: true });
                });
                gsap.to(audio, { volume: 0.6, duration: 2 });
            }
        }

        window.addEventListener('historia-cargada', () => {
            console.log("Event: historia-cargada received. Initializing triggers...");
            gsap.utils.toArray('.story-item').forEach(item => {
                gsap.fromTo(item, { opacity: 0, x: item.classList.contains('md:flex-row-reverse') ? 50 : -50 }, { 
                    opacity: 1, x: 0, duration: 1, ease: "expo.out", 
                    scrollTrigger: { trigger: item, start: "top 80%" } 
                });

                ScrollTrigger.create({
                    trigger: item,
                    start: "top center",
                    end: "bottom center",
                    onEnter: () => updateHistoryMedia(item.dataset.bpm, item.dataset.audio),
                    onEnterBack: () => updateHistoryMedia(item.dataset.bpm, item.dataset.audio),
                    onLeave: () => updateHistoryMedia(null, null),
                    onLeaveBack: () => updateHistoryMedia(null, null)
                });

                item.querySelectorAll('.scramble-target').forEach(el => {
                    ScrollTrigger.create({ trigger: el, start: "top 85%", onEnter: () => scrambleText(el), once: true });
                });
            });
            ScrollTrigger.refresh();
        });
        // --- SISTEMA DE PESTAÑAS (MÓVIL / DESKTOP) ---
        const homeView = document.getElementById('home-view');
        const albumView = document.getElementById('album-view');
        const navAlbumBtns = [document.getElementById('nav-album-btn-mobile'), document.getElementById('nav-album-btn-desk')];
        const btnVolver = document.getElementById('btn-volver');
        const mobileTabs = document.querySelectorAll('.mobile-tab');

        function updateMobileTabs(activeTabId) {
            mobileTabs.forEach(tab => tab.classList.remove('tab-active'));
            if (activeTabId) {
                const activeEl = document.querySelector(`.mobile-tab[href="#${activeTabId}"]`) || document.getElementById('nav-album-btn-mobile');
                if (activeEl) activeEl.classList.add('tab-active');
            }
        }

        const zoomSlider = document.getElementById('zoom-slider');
        const albumGrid = document.getElementById('album-grid');
        let flipTimer, distanciaInicial = null, valorZoomInicial = null;

        function aplicarZoom(size) {
            clearTimeout(flipTimer);
            flipTimer = setTimeout(() => {
                const state = Flip.getState('#album-grid .polaroid-wrapper');
                albumGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(min(100%, ${size}px), 1fr))`;
                Flip.from(state, { duration: 0.5, ease: "back.out(1.05)", absolute: true, stagger: 0.015, onComplete: () => ScrollTrigger.refresh() });
            }, 50);
        }

        zoomSlider.addEventListener('input', (e) => { if (Math.random() > 0.8) playSprayNoise(); aplicarZoom(e.target.value); });

        // Wheel zoom (Desktop)
        albumView.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                let nuevoZoom = parseInt(zoomSlider.value) - e.deltaY;
                nuevoZoom = Math.max(120, Math.min(600, nuevoZoom));
                zoomSlider.value = nuevoZoom;
                aplicarZoom(nuevoZoom);
            }
        }, { passive: false });

        albumView.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                distanciaInicial = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
                valorZoomInicial = parseInt(zoomSlider.value);
            }
        }, { passive: false });

        let lastZoomUpdate = 0;
        albumView.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && distanciaInicial !== null) {
                e.preventDefault();
                const now = Date.now();
                if (now - lastZoomUpdate < 16) return; // Limit to ~60fps
                lastZoomUpdate = now;

                const distanciaActual = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
                let nuevoZoom = valorZoomInicial + ((distanciaActual - distanciaInicial) * 2);
                nuevoZoom = Math.max(120, Math.min(600, nuevoZoom));
                zoomSlider.value = nuevoZoom;

                // Live update without Flip for performance during gesture
                albumGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(min(100%, ${nuevoZoom}px), 1fr))`;
            }
        }, { passive: false });

        albumView.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                distanciaInicial = null;
                ScrollTrigger.refresh();
            }
        });

        // --- SISTEMA DE LIGHTBOX ---
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxHint = document.getElementById('lightbox-hint');
        let lbScale = 1, lbX = 0, lbY = 0, lbDistInicial = null, lbTouchX = 0, lbTouchY = 0;

        function abrirLightbox(src) {
            playSprayNoise();
            lightboxImg.src = src;
            lightbox.classList.remove('hidden');
            lbScale = 1; lbX = 0; lbY = 0;
            actualizarTransformLightbox();
            if (lenis) lenis.stop();
            gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.4 });
            gsap.fromTo(lightboxImg, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, delay: 0.1, ease: "back.out(1.2)" });
            setTimeout(() => lightboxHint.style.opacity = '1', 1000);
        }

        function cerrarLightbox() {
            playSprayNoise();
            gsap.to(lightbox, {
                opacity: 0, duration: 0.3, onComplete: () => {
                    lightbox.classList.add('hidden');
                    lightboxImg.src = "";
                    if (lenis) lenis.start();
                    lightboxHint.style.opacity = '0';
                }
            });
        }

        function actualizarTransformLightbox(smooth = false) {
            lightboxImg.style.transition = smooth ? "transform 0.3s ease-out" : "none";
            lightboxImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
        }

        const lbContainer = document.getElementById('lightbox-container');
        lbContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                lbDistInicial = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            } else if (e.touches.length === 1) {
                lbTouchX = e.touches[0].pageX - lbX;
                lbTouchY = e.touches[0].pageY - lbY;
            }
        });

        lbContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 2 && lbDistInicial !== null) {
                const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
                const delta = dist / lbDistInicial;
                lbScale = Math.max(1, Math.min(8, lbScale * delta));
                lbDistInicial = dist;
                actualizarTransformLightbox(false);
            } else if (e.touches.length === 1 && lbScale > 1) {
                lbX = e.touches[0].pageX - lbTouchX;
                lbY = e.touches[0].pageY - lbTouchY;
                actualizarTransformLightbox(false);
            }
        });

        lbContainer.addEventListener('touchend', () => {
            lbDistInicial = null;
            if (lbScale < 1.1) {
                lbScale = 1; lbX = 0; lbY = 0;
                actualizarTransformLightbox(true);
            }
        });

        function mostrarAlbum(e) {
            if (e) e.preventDefault();
            playSprayNoise();
            updateMobileTabs('album');
            gsap.to(homeView, {
                opacity: 0, duration: 0.4, onComplete: () => {
                    homeView.classList.add('hidden'); albumView.classList.remove('hidden');
                    window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true });
                    gsap.fromTo(albumView, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" });
                    gsap.fromTo('#album-grid .polaroid-wrapper', { opacity: 0, scale: 0.9, y: 20 }, { opacity: 1, scale: 1, y: 0, stagger: 0.03, duration: 0.6, ease: "back.out(1.2)" });
                    ScrollTrigger.refresh();
                    gsap.utils.toArray('#album-view .scramble-target').forEach(el => scrambleText(el));
                }
            });
        }

        function mostrarHome(e, clickedTab) {
            if (homeView.classList.contains('hidden')) {
                // If we are in album, go back home first, then scroll
                if (e && e.target.id !== 'btn-volver') e.preventDefault(); // allow normal anchor behavior if clicking tabs from home
                playSprayNoise();
                gsap.to(albumView, {
                    opacity: 0, duration: 0.4, onComplete: () => {
                        albumView.classList.add('hidden'); homeView.classList.remove('hidden');
                        gsap.to(homeView, { opacity: 1, duration: 0.6, ease: "expo.out" });
                        ScrollTrigger.refresh();

                        if (clickedTab && clickedTab.getAttribute('href') !== '#') {
                            updateMobileTabs(clickedTab.getAttribute('href').replace('#', ''));
                            const target = document.querySelector(clickedTab.getAttribute('href'));
                            if (target && lenis) lenis.scrollTo(target);
                        } else {
                            updateMobileTabs('inicio');
                        }
                    }
                });
            } else {
                // Normal anchor scroll via Lenis or Native
                if (clickedTab && clickedTab.getAttribute('href') !== '#') {
                    updateMobileTabs(clickedTab.getAttribute('href').replace('#', ''));
                }
            }
        }

        navAlbumBtns.forEach(btn => btn?.addEventListener('click', mostrarAlbum));
        btnVolver.addEventListener('click', (e) => mostrarHome(e, null));

        // Rest of Logic (Canvas, Particles, Cursor) only for desktop mostly
        if (window.matchMedia("(pointer: fine)").matches) {
            const cursorDot = document.querySelector('.cursor-dot'), cursorOutline = document.querySelector('.cursor-outline'), cursorText = document.querySelector('.cursor-text');
            const trailCanvas = document.getElementById('trail-canvas'), tCtx = trailCanvas.getContext('2d');
            const splatterCanvas = document.getElementById('splatter-canvas'), sCtx = splatterCanvas.getContext('2d');
            let trails = [], splatters = [], mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }, outlineX = mouse.x, outlineY = mouse.y;
            let isSprayMode = false, isSprayingFree = false, currentColor = '#39ff14';

            function resizeCanvas() {
                trailCanvas.width = splatterCanvas.width = window.innerWidth; trailCanvas.height = splatterCanvas.height = window.innerHeight;
                sCtx.clearRect(0, 0, splatterCanvas.width, splatterCanvas.height); splatters.forEach(s => drawSplatterObj(s));
            }
            window.addEventListener('resize', resizeCanvas); resizeCanvas();

            window.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX; mouse.y = e.clientY;
                cursorDot.style.left = `${mouse.x}px`; cursorDot.style.top = `${mouse.y}px`;
                if (!isSprayMode) trails.push({ x: mouse.x, y: mouse.y, life: 1, color: Math.random() > 0.5 ? '#39ff14' : '#b026ff' });
                else if (isSprayingFree) { sCtx.fillStyle = currentColor; sCtx.shadowBlur = 15; sCtx.shadowColor = currentColor; sCtx.beginPath(); sCtx.arc(mouse.x, mouse.y, Math.random() * 8 + 4, 0, Math.PI * 2); sCtx.fill(); if (Math.random() > 0.8) playSprayNoise(); }
            });

            window.addEventListener('mousedown', (e) => { if (isSprayMode && !e.target.closest('button') && !e.target.closest('a')) { isSprayingFree = true; currentColor = Math.random() > 0.5 ? '#39ff14' : '#b026ff'; } });
            window.addEventListener('mouseup', () => isSprayingFree = false);
            window.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('a') || isSprayMode) return;
                const color = Math.random() > 0.5 ? '#39ff14' : '#b026ff';
                const splatter = { x: e.clientX, y: e.clientY, color: color, drops: [] };
                for (let i = 0; i < (Math.random() * 10 + 5); i++) splatter.drops.push({ x: splatter.x + Math.cos(Math.random() * Math.PI * 2) * Math.random() * 50, y: splatter.y + Math.sin(Math.random() * Math.PI * 2) * Math.random() * 50, r: Math.random() * 5 + 2 });
                splatter.drops.push({ x: splatter.x, y: splatter.y, r: Math.random() * 15 + 8 });
                splatters.push(splatter); drawSplatterObj(splatter); if (kickDrum) kickDrum.triggerAttackRelease("G1", "16n");
            });

            function drawSplatterObj(s) { sCtx.fillStyle = s.color; sCtx.shadowBlur = 15; sCtx.shadowColor = s.color; s.drops.forEach(d => { sCtx.beginPath(); sCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2); sCtx.fill(); }); }

            const renderCursor = () => {
                outlineX += (mouse.x - outlineX) * 0.15; outlineY += (mouse.y - outlineY) * 0.15;
                cursorOutline.style.left = `${outlineX}px`; cursorOutline.style.top = `${outlineY}px`; cursorText.style.left = `${outlineX}px`; cursorText.style.top = `${outlineY}px`;
                tCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
                for (let i = 0; i < trails.length; i++) {
                    let p = trails[i]; p.life -= 0.03; if (p.life <= 0) { trails.splice(i, 1); i--; continue; }
                    tCtx.beginPath(); tCtx.arc(p.x, p.y, p.life * 6, 0, Math.PI * 2); tCtx.fillStyle = p.color; tCtx.globalAlpha = p.life; tCtx.shadowBlur = 10; tCtx.shadowColor = p.color; tCtx.fill();
                }
                tCtx.globalAlpha = 1; requestAnimationFrame(renderCursor);
            }; requestAnimationFrame(renderCursor);

            const bindHoverTriggers = () => {
                document.querySelectorAll('.hover-trigger:not([data-hover-bound])').forEach(trigger => {
                    trigger.dataset.hoverBound = "true";
                    trigger.addEventListener('mouseenter', () => {
                        const text = trigger.getAttribute('data-cursor-text');
                        if (text) { cursorText.textContent = text; cursorText.style.opacity = '1'; cursorOutline.style.width = '80px'; cursorOutline.style.height = '80px'; cursorOutline.style.backgroundColor = 'rgba(57, 255, 20, 0.1)'; cursorOutline.style.borderColor = '#39ff14'; cursorOutline.style.animation = 'none'; cursorDot.style.opacity = '0'; }

                    });
                    trigger.addEventListener('mouseleave', () => {
                        cursorText.style.opacity = '0'; cursorOutline.style.width = '45px'; cursorOutline.style.height = '45px'; cursorOutline.style.backgroundColor = 'transparent'; cursorOutline.style.borderColor = 'rgba(57, 255, 20, 0.5)'; cursorOutline.style.animation = 'spin 8s linear infinite'; cursorDot.style.opacity = '1';
                        gsap.to(trigger, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
                    });
                    trigger.addEventListener('mousemove', (e) => {
                        const rect = trigger.getBoundingClientRect(); gsap.to(trigger, { x: (e.clientX - rect.left - rect.width / 2) * 0.3, y: (e.clientY - rect.top - rect.height / 2) * 0.3, duration: 0.4, ease: "power2.out" });
                    });
                });
            };
            new MutationObserver(bindHoverTriggers).observe(document.body, { childList: true, subtree: true }); bindHoverTriggers();
        } // Fin if pointer:fine

        // Background Particles (Always on)
        const bgCanvas = document.getElementById('magic-canvas'), bCtx = bgCanvas.getContext('2d');
        let particlesArray = [];
        function initCanvasParticles() {
            bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; particlesArray = [];
            for (let i = 0; i < (window.innerWidth * window.innerHeight) / 10000; i++) {
                particlesArray.push({ x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height, size: Math.random() * 2 + 0.5, color: Math.random() > 0.5 ? 'rgba(57, 255, 20, 0.4)' : 'rgba(176, 38, 255, 0.4)' });
            }
        }
        function animateCanvas() {
            bCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            particlesArray.forEach(p => {
                p.y -= 0.5; p.x += (Math.random() - 0.5);
                if (p.y < 0) { p.y = bgCanvas.height; p.x = Math.random() * bgCanvas.width; }
                bCtx.beginPath(); bCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2); bCtx.fillStyle = p.color; bCtx.shadowBlur = 5; bCtx.shadowColor = p.color; bCtx.fill();
            });
            requestAnimationFrame(animateCanvas);
        }
        window.addEventListener('resize', initCanvasParticles); initCanvasParticles(); animateCanvas();

        const modal = document.getElementById('modal-añadir'), modalContent = document.getElementById('modal-contenido'), form = document.getElementById('formulario-recuerdo');

        function abrirModal() {
            playSprayNoise();
            modal.classList.remove('hidden');
            if (lenis) lenis.stop();
            gsap.to(modalContent, { scale: 1, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.6)" });
        }

        function cerrarModal() {
            playSprayNoise();
            gsap.to(modalContent, {
                scale: 0.9, opacity: 0, duration: 0.4, ease: "power2.in", onComplete: () => {
                    modal.classList.add('hidden');
                    form.reset();
                    document.getElementById('preview-container').classList.add('hidden');
                    document.getElementById('input-camara').value = "";
                    document.getElementById('input-galeria').value = "";
                    if (lenis) lenis.start();
                }
            });
        }

        const btnHacerFoto = document.getElementById('btn-hacer-foto');
        const btnSubirGaleria = document.getElementById('btn-subir-galeria');
        const inputCamara = document.getElementById('input-camara');
        const inputGaleria = document.getElementById('input-galeria');
        const filePreview = document.getElementById('file-preview');
        const previewContainer = document.getElementById('preview-container');

        const handleFileSelection = (file) => {
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    filePreview.src = e.target.result;
                    previewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        };

        btnHacerFoto.addEventListener('click', () => inputCamara.click());
        btnSubirGaleria.addEventListener('click', () => inputGaleria.click());

        inputCamara.addEventListener('change', (e) => { handleFileSelection(e.target.files[0]); inputGaleria.value = ""; });
        inputGaleria.addEventListener('change', (e) => { handleFileSelection(e.target.files[0]); inputCamara.value = ""; });

        async function compressImage(file, maxWidth = 1200, quality = 0.7) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        if (width > maxWidth) {
                            height = (maxWidth / width) * height;
                            width = maxWidth;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    };
                };
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titulo = document.getElementById('titulo-foto').value;
            const file = inputCamara.files[0] || inputGaleria.files[0];

            if (!file) {
                alert("Selecciona o haz una foto primero");
                return;
            }

            const toast = document.getElementById('toast-msg');
            document.getElementById('toast-text').textContent = "Procesando y comprimiendo evidencia...";
            gsap.to(toast, { y: 20, opacity: 1, duration: 0.6 });

            try {
                // Comprimir imagen antes de subirla para no superar el límite de 1MB de Firestore
                const compressedBase64 = await compressImage(file);

                await window.firestore.addDoc(window.firestore.collection(window.db, "recuerdos"), {
                    titulo: titulo,
                    imagen: compressedBase64,
                    timestamp: window.firestore.serverTimestamp()
                });

                cerrarModal();
                document.getElementById('toast-text').textContent = "Evidencia guardada en el sistema";
                setTimeout(() => gsap.to(toast, { y: 0, opacity: 0, duration: 0.5 }), 3000);

                if (synth) { try { synth.triggerAttackRelease(["C4", "G4", "C5"], "4n", "+0.05"); } catch (e) { } }
                playSprayNoise();
            } catch (error) {
                console.error("Error subiendo:", error);
                alert("Error al subir la foto.");
                gsap.to(toast, { y: 0, opacity: 0, duration: 0.5 });
            }
        });

        function cargarRecuerdos() {
            try {
                const q = window.firestore.query(window.firestore.collection(window.db, "recuerdos"), window.firestore.orderBy("timestamp", "desc"));

                window.firestore.onSnapshot(q, (snapshot) => {
                    const galeria = document.getElementById('galeria-scroll');
                    const grid = document.getElementById('album-grid');
                    if (!galeria || !grid) return;
                    galeria.innerHTML = '<div class="w-[30vw] md:w-[15vw]"></div>';
                    grid.innerHTML = '';

                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        if (!data.imagen) return;
                        const rot = (Math.random() * 16) - 8;
                        const colorBorder = Math.random() > 0.5 ? 'border-neon-green' : 'border-neon-purple';
                        const textCol = colorBorder === 'border-neon-green' ? 'text-neon-green' : 'text-neon-purple';

                        const editBtn = `
                            <button onclick="event.stopPropagation(); abrirEditorRecuerdo('${doc.id}')" class="absolute top-2 right-2 z-30 bg-black/80 p-2 text-white border border-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                                <i class="fas fa-edit"></i>
                            </button>
                        `;

                        const htmlGaleria = `
                            <div class="polaroid-wrapper">
                                <div class="polaroid-3d hover-trigger group relative" onclick="abrirLightbox('${data.imagen}')" data-cursor-text="VER" style="transform: rotate(${rot}deg);">
                                    ${editBtn}
                                    <div class="tape"></div>
                                    <div class="w-[260px] md:w-[450px] aspect-[4/5] bg-black polaroid-img-container border ${colorBorder}">
                                        <img src="${data.imagen}" class="w-full h-full object-cover">
                                    </div>
                                    <p class="polaroid-text ${textCol}">${data.titulo || 'SIN TÍTULO'}</p>
                                </div>
                            </div>`;

                        const htmlGrid = `
                            <div class="polaroid-wrapper">
                                <div class="polaroid-3d hover-trigger group relative" onclick="abrirLightbox('${data.imagen}')" data-cursor-text="VER" style="transform: rotate(${rot}deg);">
                                    ${editBtn}
                                    <div class="tape"></div>
                                    <div class="w-full aspect-[4/5] bg-black polaroid-img-container border ${colorBorder}">
                                        <img src="${data.imagen}" class="w-full h-full object-cover">
                                    </div>
                                    <p class="polaroid-text ${textCol}">${data.titulo || 'SIN TÍTULO'}</p>
                                </div>
                            </div>`;
                        
                        galeria.insertAdjacentHTML('afterbegin', htmlGaleria);
                        grid.insertAdjacentHTML('afterbegin', htmlGrid);
                    });
                    window.dispatchEvent(new CustomEvent('recuerdos-cargados'));
                    setTimeout(() => ScrollTrigger.refresh(), 500);
                });
            } catch (err) { console.error("Error recuerdos:", err); }
        }

        const modalHistoria = document.getElementById('modal-historia'), modalHistContent = document.getElementById('modal-historia-contenido'), formHistoria = document.getElementById('form-historia');

        function abrirEditorHistoria() {
            playSprayNoise();
            modalHistoria.classList.remove('hidden');
            if (lenis) lenis.stop();
            gsap.fromTo(modalHistContent, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.2)" });
            actualizarListaHistoria();
        }

        function cerrarEditorHistoria() {
            playSprayNoise();
            gsap.to(modalHistContent, { scale: 0.9, opacity: 0, duration: 0.4, onComplete: () => { modalHistoria.classList.add('hidden'); if (lenis) lenis.start(); resetFormHistoria(); } });
        }

        function resetFormHistoria() {
            formHistoria.reset();
            document.getElementById('historia-id').value = "";
            document.getElementById('btn-cancel-edit').classList.add('hidden');
        }

        async function actualizarListaHistoria() {
            const lista = document.getElementById('lista-historia');
            const q = window.firestore.query(window.firestore.collection(window.db, "historia"), window.firestore.orderBy("orden", "asc"));
            const snapshot = await window.firestore.getDocs(q);
            lista.innerHTML = '';

            snapshot.forEach(doc => {
                const data = doc.data();
                lista.innerHTML += `
                    <div class="flex items-center justify-between bg-black/40 p-4 border border-[#222] hover:border-neon-green transition-colors">
                        <div class="flex items-center gap-4">
                            <span class="text-neon-purple font-mono font-bold">#${data.orden || '0'}</span>
                            <span class="text-white font-mono text-sm uppercase">${data.titulo2}</span>
                        </div>
                        <div class="flex gap-4">
                            <button onclick="editarHito('${doc.id}')" class="text-gray-500 hover:text-neon-green transition-colors"><i class="fas fa-edit"></i></button>
                            <button onclick="eliminarHito('${doc.id}')" class="text-gray-500 hover:text-red-500 transition-colors"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            });
        }

        window.editarHito = async (id) => {
            const docRef = window.firestore.doc(window.db, "historia", id);
            const docSnap = await window.firestore.getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('historia-id').value = id;
                document.getElementById('h-titulo1').value = data.titulo1;
                document.getElementById('h-titulo2').value = data.titulo2;
                document.getElementById('h-desc').value = data.desc;
                document.getElementById('h-img').value = data.img || "";
                document.getElementById('h-audio').value = data.audio || "";
                document.getElementById('h-bpm').value = data.bpm || "";
                document.getElementById('h-orden').value = data.orden || "";
                document.getElementById('btn-cancel-edit').classList.remove('hidden');
                modalHistContent.scrollTo({ top: 0, behavior: 'smooth' });
                if (synth) synth.triggerAttackRelease("G4", "8n");
            }
        };

        window.eliminarHito = async (id) => {
            if (confirm("¿Seguro que quieres borrar este recuerdo?")) {
                await window.firestore.deleteDoc(window.firestore.doc(window.db, "historia", id));
                actualizarListaHistoria();
                playSprayNoise();
            }
        };

        // Selector de Álbum para Historia
        const selectorOverlay = document.getElementById('selector-album-overlay');
        const gridSelector = document.getElementById('grid-selector-album');

        function abrirSelectorAlbum() {
            playSprayNoise();
            selectorOverlay.classList.remove('hidden');
            cargarFotosParaSelector();
        }

        function cerrarSelectorAlbum() {
            selectorOverlay.classList.add('hidden');
        }

        async function cargarFotosParaSelector() {
            const q = window.firestore.query(window.firestore.collection(window.db, "recuerdos"), window.firestore.orderBy("timestamp", "desc"));
            const snapshot = await window.firestore.getDocs(q);
            gridSelector.innerHTML = '';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const div = document.createElement('div');
                div.className = "aspect-square border border-[#333] hover:border-neon-green transition-all cursor-pointer overflow-hidden group";
                div.innerHTML = `<img src="${data.imagen}" class="w-full h-full object-cover group-hover:scale-110 transition-transform">`;
                div.onclick = () => {
                    document.getElementById('h-img').value = data.imagen;
                    cerrarSelectorAlbum();
                    playSprayNoise();
                };
                gridSelector.appendChild(div);
            });
        }

        async function subirAudioAStorage(file) {
            if (!file) return;
            mostrarToast("Subiendo audio... no cierres el panel");
            try {
                const storageRef = window.storage.ref(window.storage.storage, `audio_historias/${Date.now()}_${file.name}`);
                const snapshot = await window.storage.uploadBytes(storageRef, file);
                const url = await window.storage.getDownloadURL(snapshot.ref);
                document.getElementById('h-audio').value = url;
                mostrarToast("Audio listo para guardar");
            } catch (err) {
                console.error(err);
                alert("Error al subir audio");
            }
        }

        formHistoria.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('historia-id').value;
            const data = {
                titulo1: document.getElementById('h-titulo1').value,
                titulo2: document.getElementById('h-titulo2').value,
                desc: document.getElementById('h-desc').value,
                img: document.getElementById('h-img').value,
                audio: document.getElementById('h-audio').value,
                bpm: parseInt(document.getElementById('h-bpm').value) || 110,
                orden: parseInt(document.getElementById('h-orden').value) || 0,
                timestamp: window.firestore.serverTimestamp()
            };

            try {
                if (id) {
                    await window.firestore.setDoc(window.firestore.doc(window.db, "historia", id), data, { merge: true });
                } else {
                    await window.firestore.addDoc(window.firestore.collection(window.db, "historia"), data);
                }
                resetFormHistoria();
                actualizarListaHistoria();
                mostrarToast("Cronología actualizada correctamente");
            } catch (err) {
                console.error(err);
                alert("Error al guardar");
            }
        });

        function mostrarToast(text) {
            const toast = document.getElementById('toast-msg');
            document.getElementById('toast-text').textContent = text;
            gsap.to(toast, { y: 20, opacity: 1, duration: 0.6 });
            setTimeout(() => gsap.to(toast, { y: 0, opacity: 0, duration: 0.5 }), 3000);
        }

        // Editor de Recuerdos (Album)
        const modalEditRec = document.getElementById('modal-editar-recuerdo');
        const formEditRec = document.getElementById('form-editar-recuerdo');

        window.abrirEditorRecuerdo = async (id) => {
            const docRef = window.firestore.doc(window.db, "recuerdos", id);
            const docSnap = await window.firestore.getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('edit-recuerdo-id').value = id;
                document.getElementById('edit-recuerdo-texto').value = data.texto || "";
                document.getElementById('edit-recuerdo-cat').value = data.categoria || "";
                document.getElementById('edit-recuerdo-fecha').value = data.fecha || "";
                modalEditRec.classList.remove('hidden');
                if (lenis) lenis.stop();
            }
        };

        window.cerrarEditorRecuerdo = () => {
            modalEditRec.classList.add('hidden');
            if (lenis) lenis.start();
        };

        formEditRec.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-recuerdo-id').value;
            const data = {
                texto: document.getElementById('edit-recuerdo-texto').value,
                categoria: document.getElementById('edit-recuerdo-cat').value,
                fecha: document.getElementById('edit-recuerdo-fecha').value
            };
            await window.firestore.setDoc(window.firestore.doc(window.db, "recuerdos", id), data, { merge: true });
            cerrarEditorRecuerdo();
            mostrarToast("Recuerdo actualizado");
        });

        window.eliminarRecuerdo = async () => {
            const id = document.getElementById('edit-recuerdo-id').value;
            if (confirm("¿Borrar esta foto para siempre?")) {
                await window.firestore.deleteDoc(window.firestore.doc(window.db, "recuerdos", id));
                cerrarEditorRecuerdo();
                mostrarToast("Recuerdo eliminado");
            }
        };

        function cargarHistoria() {
            try {
                const q = window.firestore.query(window.firestore.collection(window.db, "historia"), window.firestore.orderBy("orden", "asc"));

                window.firestore.onSnapshot(q, (snapshot) => {
                    const container = document.getElementById('historia-container');
                    if (!container) return;
                    container.innerHTML = '';

                    snapshot.forEach((doc, index) => {
                        const data = doc.data();
                        const isEven = index % 2 === 0;
                        const mainColor = data.color || (isEven ? 'neon-purple' : 'neon-green');
                        const borderColor = mainColor === 'neon-purple' ? 'border-neon-purple' : 'border-neon-green';
                        const textColor = mainColor === 'neon-purple' ? 'text-neon-purple' : 'text-neon-green';
                        const shadowColor = mainColor === 'neon-purple' ? 'rgba(176,38,255,0.1)' : 'rgba(57,255,20,0.1)';
                        const icon = isEven ? 'fa-times' : 'fa-heart';

                        const html = `
                            <div class="story-item flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center justify-between mb-32 md:mb-48" 
                                 data-bpm="${data.bpm || 110}" data-audio="${data.audio || ''}">
                                <div class="w-full md:w-5/12 mb-10 md:mb-0 ${isEven ? 'md:pr-20 text-left md:text-right' : 'md:pl-20 text-left'}">
                                    <span class="${textColor} font-graffiti text-3xl md:text-4xl mb-4 block scramble-target" data-final="${data.titulo1}">${data.titulo1.replace(/./g, '#')}</span>
                                    <h3 class="font-mono font-bold text-2xl md:text-4xl text-white mb-6 uppercase tracking-tight scramble-target" data-final="${data.titulo2}">${data.titulo2.replace(/./g, '@')}</h3>
                                    <p class="text-gray-400 font-mono leading-relaxed text-sm md:text-lg border-l-4 ${isEven ? 'md:border-l-0 md:border-r-4' : ''} ${borderColor} ${isEven ? 'pl-4 md:pl-0 md:pr-6' : 'pl-4 md:pl-6'} bg-black/40 p-4 md:p-6 rounded-r-xl ${isEven ? 'md:rounded-l-xl md:rounded-r-none' : ''} backdrop-blur-sm shadow-[inset_5px_0_15px_${shadowColor}] ${isEven ? 'md:shadow-[inset_-5px_0_15px_' + shadowColor + ']' : ''}">
                                        ${data.desc}
                                    </p>
                                </div>
                                <div class="w-10 h-10 bg-black border-4 ${borderColor} rounded-full z-10 shadow-[0_0_30px_${mainColor === 'neon-purple' ? '#b026ff' : '#39ff14'}] md:flex hidden justify-center items-center glow-dot hover:scale-150 transition-transform">
                                    <i class="fas ${icon} ${textColor} text-sm"></i>
                                </div>
                                <div class="w-full md:w-5/12 ${isEven ? 'md:pl-20' : 'md:pr-20'}">
                                    <div class="glass-panel p-2 md:p-3 rounded-none transform transition-all duration-700 hover:scale-[1.05] ${isEven ? 'hover:-rotate-6' : 'hover:rotate-6'} hover-trigger ${borderColor} border-2 group relative" data-cursor-text="${isEven ? 'Vigila' : 'Peligro'}">
                                        <button onclick="abrirEditorHistoria(); editarHito('${doc.id}')" class="absolute top-4 right-4 z-30 bg-black/80 p-2 text-neon-green border border-neon-green opacity-0 group-hover:opacity-100 transition-opacity">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <div class="relative overflow-hidden h-[300px] md:h-[400px]">
                                            <div class="absolute inset-0 bg-black/20 mix-blend-overlay opacity-0 group-hover:opacity-50 transition-opacity z-20 pointer-events-none"></div>
                                            <img src="${data.img || 'assets/hero_rat.png'}" class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100">
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                        container.insertAdjacentHTML('beforeend', html);
                    });
                    
                    window.dispatchEvent(new CustomEvent('historia-cargada'));
                    setTimeout(() => ScrollTrigger.refresh(), 500);
                });
            } catch (err) { console.error("Error historia:", err); }
        }

        let secretCode = "RATA", currentInput = "";
        window.addEventListener("keydown", (e) => {
            if (!modal.classList.contains('hidden')) return;
            currentInput = (currentInput + (e.key || "").toUpperCase()).slice(-secretCode.length);
            if (currentInput === secretCode) { currentInput = ""; activarTerminalSecreta(); }
        });
        function activarTerminalSecreta() {
            playSprayNoise(); if (synth) synth.triggerAttackRelease("C2", "2n");
            document.getElementById('secret-terminal').style.display = 'flex'; if (lenis) lenis.stop();
            const container = document.getElementById('secret-text-container'); container.innerHTML = "> INICIANDO PROTOCOLO...<br><br>";
            const msgs = [
                "> BYPASSING FIREWALL...",
                "> ACCESO CONCEDIDO...",
                "> DECRIPTANDO MANIFIESTO...",
                "> -------------------------",
                "> PARA MI PANTERA:",
                "> He programado esta movida digital para nosotros.",
                "> Un muro inquebrantable donde pintar recuerdos.",
                "> Esto no es cursi, es nuestro propio caos.",
                "> Mezcla de ratas, panteras, pinchos y graffitis.",
                "> A seguir pintando la calle de neón.",
                "> -------------------------",
                "> TE QUIERO. 🖤",
                "> ID: 994-CAOS",
                "> FIN."
            ];
            msgs.forEach((msg, i) => setTimeout(() => {
                const isSpecial = msg.includes("TE QUIERO") || msg.includes("PARA MI PANTERA");
                container.innerHTML += `<span class="${isSpecial ? 'text-neon-purple font-bold text-lg md:text-2xl' : ''}">${msg}</span><br><br>`;
                container.scrollTop = container.scrollHeight;
                if (kickDrum) kickDrum.triggerAttackRelease("C1", "16n");
                playSprayNoise();
            }, 1000 + (i * 1200)));
        }
        document.getElementById('close-secret').addEventListener('click', () => { document.getElementById('secret-terminal').style.display = 'none'; playSprayNoise(); if (lenis) lenis.start(); });

    