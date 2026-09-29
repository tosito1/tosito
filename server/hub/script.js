// Inicializar variables CSS basadas en data-color
document.querySelectorAll('.app-card').forEach(card => {
    const color = card.getAttribute('data-color');
    card.style.setProperty('--card-color', color);
    
    // Convertir hex a rgba para el glow
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)){
        c= color.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        card.style.setProperty('--card-color-light', 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',0.15)');
    }
});

// Animación de entrada GSAP
const tl = gsap.timeline();

tl.fromTo('.glow-orb', 
    { opacity: 0, scale: 0.5 },
    { opacity: 0.5, scale: 1, duration: 2, stagger: 0.2, ease: 'power3.out' }
)
.fromTo('.title-anim', 
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
    '-=1.5'
)
.fromTo('.subtitle-anim',
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
    '-=0.8'
)
.fromTo('.app-card',
    { y: 50, opacity: 0, rotationX: 10 },
    { y: 0, opacity: 1, rotationX: 0, duration: 0.8, stagger: 0.15, ease: 'back.out(1.2)' },
    '-=0.5'
);

// Efecto 3D y Glow con el ratón
document.querySelectorAll('.app-card').forEach(card => {
    const content = card.querySelector('.card-content');
    
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Efecto Glow Border
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        
        // Efecto 3D Tilt
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8; // max rotacion en X
        const rotateY = ((x - centerX) / centerX) * 8;  // max rotacion en Y
        
        gsap.to(card, {
            rotationX: rotateX,
            rotationY: rotateY,
            scale: 1.02,
            duration: 0.4,
            ease: 'power2.out',
            transformPerspective: 1000
        });
    });
    
    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            duration: 0.8,
            ease: 'elastic.out(1, 0.3)'
        });
    });
});

// Parallax de orbes con el ratón en la pantalla
document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    
    gsap.to('.orb-1', { x: x * -2, y: y * -2, duration: 1.5, ease: 'power2.out' });
    gsap.to('.orb-2', { x: x * 3, y: y * 3, duration: 1.5, ease: 'power2.out' });
    gsap.to('.orb-3', { x: x * -1.5, y: y * -1.5, duration: 1.5, ease: 'power2.out' });
});
