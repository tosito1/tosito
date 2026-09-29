// --- GSAP Animations & Motion Design ---

// 1. Initial Stagger Animation
// Toolbar enters from top
gsap.from(".toolbar", {
    y: -100,
    opacity: 0,
    duration: 1,
    ease: "elastic.out(1, 0.5)"
});

// Toolbar buttons stagger in
gsap.from(".toolbar .tool-group > *", {
    y: 20,
    opacity: 0,
    duration: 0.5,
    stagger: 0.05,
    ease: "back.out(1.7)",
    delay: 0.3,
    clearProps: "all" // Removes GSAP inline styles after animation so they don't get stuck
});

// Canvas fades in
gsap.from("canvas#board", {
    opacity: 0,
    duration: 1,
    delay: 0.5,
    clearProps: "opacity"
});

// 2. Custom Magnetic Cursor
const cursor = document.getElementById('custom-cursor');
const follower = document.getElementById('cursor-follower');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let followerX = mouseX;
let followerY = mouseY;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Instant update for the inner dot
    gsap.set(cursor, { x: mouseX, y: mouseY });
});

// Smooth follow loop for the outer ring using GSAP ticker
gsap.ticker.add(() => {
    // Lerp (Linear Interpolation)
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    gsap.set(follower, { x: followerX, y: followerY });
});

// Cursor Hover Effects on interactive elements
function setupHoverEffects(elements) {
    elements.forEach(el => {
        // Prevent duplicate listeners if called multiple times
        if (el.dataset.hasHoverEffect) return;
        el.dataset.hasHoverEffect = "true";
        
        el.addEventListener('mouseenter', () => {
            follower.classList.add('hover-active');
            // Magnetic scale effect for buttons
            if (el.tagName === 'BUTTON' || el.tagName === 'A') {
                gsap.to(el, { scale: 1.1, duration: 0.3, ease: "power2.out" });
            }
        });
        
        el.addEventListener('mouseleave', () => {
            follower.classList.remove('hover-active');
            if (el.tagName === 'BUTTON' || el.tagName === 'A') {
                gsap.to(el, { scale: 1, duration: 0.3, ease: "power2.out" });
            }
        });
        
        el.addEventListener('mousedown', () => {
            gsap.to(follower, { scale: 0.5, duration: 0.1 });
        });
        
        el.addEventListener('mouseup', () => {
            gsap.to(follower, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" });
        });
    });
}

// Setup initial hover effects
setupHoverEffects(document.querySelectorAll('button, select, input, a'));

// Use MutationObserver for dynamically added sticky notes
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.classList && node.classList.contains('sticky-note')) {
                setupHoverEffects([node, ...node.querySelectorAll('button')]);
            }
        });
    });
});
observer.observe(document.getElementById('sticky-container'), { childList: true });

// 3. Confetti on Download
const downloadButton = document.getElementById('download-btn');
if (downloadButton) {
    downloadButton.addEventListener('click', () => {
        // Only trigger confetti if the browser supports it and the function exists
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#ef4444', '#fde047', '#10b981'],
                zIndex: 9999
            });
        }
    });
}

// 4. Exposed function for Sticky Note spawn animation
window.animateStickySpawn = function(noteElement) {
    gsap.from(noteElement, {
        scale: 0,
        rotation: gsap.utils.random(-15, 15),
        duration: 0.6,
        ease: "elastic.out(1, 0.5)"
    });
};

// 5. Help Modal Animations
window.openHelpModal = function(modal) {
    modal.style.display = 'flex';
    gsap.fromTo(modal, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.3 }
    );
    gsap.fromTo(modal.querySelector('.modal-content'),
        { scale: 0.8, y: 50, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }
    );
};

window.closeHelpModal = function(modal) {
    gsap.to(modal.querySelector('.modal-content'), {
        scale: 0.8, y: 20, opacity: 0, duration: 0.3, ease: "power2.in"
    });
    gsap.to(modal, {
        opacity: 0, duration: 0.3, delay: 0.1, onComplete: () => {
            modal.style.display = 'none';
        }
    });
};
