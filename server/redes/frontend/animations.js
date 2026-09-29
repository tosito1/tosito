/* ═══════════════════════════════════════════════════════════════
   NEXUS NETWORK CONTROLLER V3 — animations.js
   Premium animations powered by GSAP + CountUp.js + Tippy.js
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── Safely wait for GSAP ──
function onGSAPReady(fn) {
    if (typeof gsap !== 'undefined') {
        fn();
    } else {
        window.addEventListener('load', fn);
    }
}

// ═══════════════════════════════════════
// 1. PAGE LOAD — Master entrance timeline
// ═══════════════════════════════════════
onGSAPReady(function () {

    // Register ScrollTrigger if available
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // ── Sidebar entrance ──
    gsap.from('.sidebar', {
        x: -260,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.1,
    });

    // ── Sidebar logo ──
    gsap.from('.sidebar-logo', {
        x: -30,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.5)',
        delay: 0.4,
    });

    // ── Nav items stagger ──
    gsap.from('.nav-item', {
        x: -25,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.07,
        delay: 0.5,
    });

    // ── Top bar ──
    gsap.from('.top-bar', {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.6,
    });

    // ── Stat cards stagger ──
    gsap.from('.stat-card', {
        y: 30,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.3)',
        stagger: 0.1,
        delay: 0.8,
    });

    // ── Filter bar ──
    gsap.from('.filter-bar', {
        y: 20,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        delay: 1.1,
    });

    // ── Filter buttons stagger ──
    gsap.from('.filter-btn', {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: 'back.out(2)',
        stagger: 0.04,
        delay: 1.2,
    });
});

// ═══════════════════════════════════════
// 2. TAB SWITCHING — Animated transitions
// ═══════════════════════════════════════
const _originalShowTab = typeof showTab === 'function' ? showTab : null;

function animateTabIn(tabId) {
    if (typeof gsap === 'undefined') return;

    const content = document.getElementById('tab-' + tabId);
    if (!content) return;

    // Animate the tab content and its children
    gsap.fromTo(content,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    );

    // Stagger children
    const children = content.querySelectorAll(
        '.stat-card, .device-card, .kpi-card, .analytics-card, .settings-card, .log-row, .alert-item'
    );
    if (children.length > 0) {
        gsap.fromTo(children,
            { opacity: 0, y: 20 },
            {
                opacity: 1, y: 0,
                duration: 0.4,
                ease: 'power2.out',
                stagger: { amount: 0.35, from: 'start' },
                delay: 0.05,
            }
        );
    }

    // Page title animation
    const title = document.getElementById('page-title');
    if (title) {
        gsap.fromTo(title,
            { opacity: 0, x: -10 },
            { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
        );
    }

    // KPI cards: trigger CountUp
    if (tabId === 'analytics') {
        setTimeout(animateKPIs, 200);
    }
}

// Intercept tab switching — hook into the nav-item click
document.addEventListener('DOMContentLoaded', () => {
    // Override nav-item clicks to add animation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            if (tabId) {
                // Small delay to let the existing tab logic run first
                setTimeout(() => animateTabIn(tabId), 10);
            }
        });
    });

    // Animate initial tab
    setTimeout(() => animateTabIn('dashboard'), 900);

    // Init tooltips after DOM is ready
    initTooltips();

    // Init Tippy on stats
    initStatTippy();
});

// ═══════════════════════════════════════
// 3. DEVICE CARDS — Animate on inject
// ═══════════════════════════════════════
// We'll override the devices-grid update by watching for DOM mutations
const _devGridObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('device-card')) {
                animateDeviceCardIn(node);
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const grids = document.querySelectorAll('.devices-grid');
    grids.forEach(grid => {
        _devGridObserver.observe(grid, { childList: true });
    });
});

function animateDeviceCardIn(card) {
    if (typeof gsap === 'undefined') return;
    gsap.fromTo(card,
        { opacity: 0, y: 25, scale: 0.96 },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            ease: 'back.out(1.4)',
        }
    );
}

// ═══════════════════════════════════════
// 4. STAT CARDS — CountUp on update
// ═══════════════════════════════════════

// Store CountUp instances
const _countUps = {};

function animateStatNumber(elementId, newValue) {
    if (typeof countUp === 'undefined' && typeof CountUp === 'undefined') {
        // Fallback: just set the text
        const el = document.getElementById(elementId);
        if (el) el.textContent = newValue;
        return;
    }

    const CountUpClass = typeof CountUp !== 'undefined' ? CountUp : countUp.CountUp;
    const el = document.getElementById(elementId);
    if (!el) return;

    const current = parseInt(el.textContent) || 0;
    if (current === newValue) return;

    if (_countUps[elementId]) {
        _countUps[elementId].update(newValue);
    } else {
        const cu = new CountUpClass(elementId, newValue, {
            startVal: current,
            duration: 0.8,
            useEasing: true,
            useGrouping: false,
        });
        cu.start();
        _countUps[elementId] = cu;
    }

    // Flash effect on change
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(el,
            { color: newValue > current ? '#34d399' : '#f87171' },
            { color: '', duration: 1, delay: 0.3, ease: 'power2.inOut' }
        );
    }
}

// ═══════════════════════════════════════
// 5. KPI CARDS — CountUp on tab switch
// ═══════════════════════════════════════
function animateKPIs() {
    const kpiIds = ['kpi-total', 'kpi-online', 'kpi-offline', 'kpi-untrusted'];
    kpiIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        const val = parseInt(el.textContent) || 0;

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(el,
                { scale: 0.7, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.5,
                    ease: 'back.out(2)',
                    delay: i * 0.08,
                }
            );
        }

        // CountUp animation
        const CountUpClass = typeof CountUp !== 'undefined' ? CountUp : (typeof countUp !== 'undefined' ? countUp.CountUp : null);
        if (CountUpClass) {
            const cu = new CountUpClass(id, val, {
                startVal: 0,
                duration: 1.2,
                useEasing: true,
                delay: i * 0.1,
            });
            cu.start();
        }
    });
}

// ═══════════════════════════════════════
// 6. TOAST SYSTEM — GSAP enhanced
// ═══════════════════════════════════════
// Patch the showToast function to use GSAP
const _originalShowToast = window.showToast;
window.showToast = function(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✓', error: '✕', info: 'ℹ' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span style="font-size:1rem; font-weight:700; flex-shrink:0;">${icons[type] || icons.info}</span>
        <span>${msg}</span>
    `;
    container.appendChild(toast);

    if (typeof gsap !== 'undefined') {
        // Spring entrance from right
        gsap.fromTo(toast,
            { x: 120, opacity: 0, scale: 0.9 },
            { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
        );

        // Auto-dismiss with spring exit
        gsap.to(toast, {
            x: 120,
            opacity: 0,
            scale: 0.9,
            duration: 0.4,
            ease: 'back.in(1.5)',
            delay: 3.5,
            onComplete: () => toast.remove(),
        });
    } else {
        setTimeout(() => toast.remove(), 4000);
    }
};

// ═══════════════════════════════════════
// 7. MODAL — GSAP animated open/close
// ═══════════════════════════════════════
function openModalAnimated(backdropEl) {
    if (!backdropEl) return;
    backdropEl.style.display = 'flex';

    if (typeof gsap !== 'undefined') {
        const box = backdropEl.querySelector('.modal-box, .card');
        gsap.fromTo(backdropEl,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
        if (box) {
            gsap.fromTo(box,
                { opacity: 0, y: 40, scale: 0.93 },
                { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.5)' }
            );
        }
    } else {
        backdropEl.classList.add('open');
    }
}

function closeModalAnimated(backdropEl, onDone) {
    if (!backdropEl) return;

    if (typeof gsap !== 'undefined') {
        const box = backdropEl.querySelector('.modal-box, .card');
        const tl = gsap.timeline({
            onComplete: () => {
                backdropEl.style.display = 'none';
                backdropEl.classList.remove('open');
                if (onDone) onDone();
            }
        });
        if (box) {
            tl.to(box, { opacity: 0, y: 20, scale: 0.95, duration: 0.25, ease: 'power2.in' });
        }
        tl.to(backdropEl, { opacity: 0, duration: 0.2, ease: 'power2.in' }, box ? '-=0.1' : '0');
    } else {
        backdropEl.classList.remove('open');
        backdropEl.style.display = 'none';
        if (onDone) onDone();
    }
}

// Expose for app.js use
window.openModalAnimated = openModalAnimated;
window.closeModalAnimated = closeModalAnimated;

// Intercept existing modal closers
document.addEventListener('DOMContentLoaded', () => {
    // Close on backdrop click with animation
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModalAnimated(backdrop);
            }
        });
    });

    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const backdrop = btn.closest('.modal-backdrop');
            if (backdrop) closeModalAnimated(backdrop);
        });
    });
});

// ═══════════════════════════════════════
// 8. TIPPY TOOLTIPS — Premium
// ═══════════════════════════════════════
function initTooltips() {
    if (typeof tippy === 'undefined') return;

    // Style override for Tippy
    const tippyTheme = `
        .tippy-box[data-theme~='nexus'] {
            background: rgba(13,26,48,0.97);
            border: 1px solid rgba(37,99,235,0.35);
            border-radius: 10px;
            color: #e8f0fe;
            font-family: 'Inter', sans-serif;
            font-size: 0.78rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.5), 0 0 20px rgba(37,99,235,0.1);
            backdrop-filter: blur(12px);
        }
        .tippy-box[data-theme~='nexus'] .tippy-arrow { color: rgba(37,99,235,0.5); }
    `;
    if (!document.getElementById('tippy-nexus-theme')) {
        const style = document.createElement('style');
        style.id = 'tippy-nexus-theme';
        style.textContent = tippyTheme;
        document.head.appendChild(style);
    }

    // Common tippy defaults
    tippy.setDefaultProps({
        theme: 'nexus',
        animation: 'scale-subtle',
        duration: [200, 150],
        arrow: true,
    });
}

function initStatTippy() {
    if (typeof tippy === 'undefined') return;

    const tooltips = {
        'count-online':  'Dispositivos respondiendo al ping en este momento',
        'count-offline': 'Dispositivos conocidos sin actividad reciente',
        'count-total':   'Total de dispositivos detectados alguna vez',
        'count-unknown': 'Dispositivos sin catalogar como "de confianza"',
        'rx-speed':      'Velocidad de descarga (Bajada) en tiempo real',
        'tx-speed':      'Velocidad de subida (Subida) en tiempo real',
    };

    Object.entries(tooltips).forEach(([id, content]) => {
        const el = document.getElementById(id);
        if (el) {
            tippy(el.closest('.stat-card, .traffic-item') || el, { content });
        }
    });
}

// ═══════════════════════════════════════
// 9. NAV ITEM MAGNETIC HOVER EFFECT
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined') return;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            gsap.to(item.querySelector('.nav-icon'), {
                scale: 1.2,
                duration: 0.3,
                ease: 'back.out(2)',
            });
        });
        item.addEventListener('mouseleave', () => {
            gsap.to(item.querySelector('.nav-icon'), {
                scale: 1,
                duration: 0.2,
                ease: 'power2.inOut',
            });
        });
    });
});

// ═══════════════════════════════════════
// 10. BUTTON RIPPLE EFFECT
// ═══════════════════════════════════════
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-primary, .btn, .btn-secondary');
    if (!btn || typeof gsap === 'undefined') return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.25);
        width: 4px; height: 4px;
        left: ${x}px; top: ${y}px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 99;
    `;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);

    gsap.to(ripple, {
        width: Math.max(rect.width, rect.height) * 2.5,
        height: Math.max(rect.width, rect.height) * 2.5,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
    });
});

// ═══════════════════════════════════════
// 11. DEVICE CARD — Hover 3D tilt
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined') return;

    // Use event delegation for dynamically added cards
    const container = document.querySelector('.main-content');
    if (!container) return;

    container.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.device-card');
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);

        gsap.to(card, {
            rotateY: dx * 5,
            rotateX: -dy * 5,
            duration: 0.3,
            ease: 'power1.out',
            transformPerspective: 600,
        });
    });

    container.addEventListener('mouseleave', (e) => {
        const card = e.target.closest('.device-card');
        if (!card) return;
        gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.5)',
        });
    }, true);

    container.addEventListener('mouseleave', (e) => {
        // Reset all cards when leaving the container
        if (e.target === container) {
            container.querySelectorAll('.device-card').forEach(card => {
                gsap.to(card, {
                    rotateY: 0, rotateX: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.5)',
                });
            });
        }
    });
});

// ═══════════════════════════════════════
// 12. SCAN INDICATOR — Pulsing text
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined') return;

    const scanEl = document.querySelector('.scan-indicator');
    if (!scanEl) return;

    // Subtle flicker animation
    gsap.to(scanEl, {
        opacity: 0.5,
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
    });
});

// ═══════════════════════════════════════
// 13. TRAFFIC VALUES — Number animation
// ═══════════════════════════════════════
let _lastRx = 0, _lastTx = 0;

function animateTrafficValue(elId, newVal) {
    if (typeof gsap === 'undefined') return;
    const el = document.getElementById(elId);
    if (!el) return;

    gsap.fromTo(el,
        { scale: 1.08, color: '#60a5fa' },
        { scale: 1, color: '', duration: 0.4, ease: 'power2.out' }
    );
}

// Patch: watch for text updates to rx-speed and tx-speed
const _rxEl = () => document.getElementById('rx-speed');
const _txEl = () => document.getElementById('tx-speed');

const _trafficObserver = new MutationObserver((mutations) => {
    mutations.forEach(m => {
        if (m.target.id === 'rx-speed' || m.target.id === 'tx-speed') {
            animateTrafficValue(m.target.id, m.target.textContent);
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const rx = _rxEl(), tx = _txEl();
    if (rx) _trafficObserver.observe(rx, { childList: true, characterData: true, subtree: true });
    if (tx) _trafficObserver.observe(tx, { childList: true, characterData: true, subtree: true });
});

// ═══════════════════════════════════════
// 14. STAT NUMBERS — Auto-CountUp hook
// ═══════════════════════════════════════
// Watch stat numbers for changes and animate them
const _statIds = ['count-online', 'count-offline', 'count-total', 'count-unknown'];
const _statObserver = new MutationObserver((mutations) => {
    mutations.forEach(m => {
        const id = m.target.id;
        if (_statIds.includes(id)) {
            const newVal = parseInt(m.target.textContent) || 0;
            // CountUp already set, just flash
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(m.target,
                    { scale: 1.15 },
                    { scale: 1, duration: 0.4, ease: 'back.out(2)' }
                );
            }
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    _statIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) _statObserver.observe(el, { childList: true, characterData: true, subtree: true });
    });
});

// ═══════════════════════════════════════
// 15. LOG ROWS — Animate on add
// ═══════════════════════════════════════
const _logObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('log-row')) {
                if (typeof gsap !== 'undefined') {
                    gsap.fromTo(node,
                        { opacity: 0, x: -20, backgroundColor: 'rgba(37,99,235,0.1)' },
                        {
                            opacity: 1,
                            x: 0,
                            backgroundColor: 'transparent',
                            duration: 0.4,
                            ease: 'power2.out',
                        }
                    );
                }
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const logTable = document.getElementById('log-table');
    if (logTable) _logObserver.observe(logTable, { childList: true });
});

// ═══════════════════════════════════════
// 16. SIDEBAR LOGO — Pulse on scan
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined') return;

    const logoIcon = document.querySelector('.logo-icon');
    if (!logoIcon) return;

    gsap.to(logoIcon, {
        filter: 'drop-shadow(0 0 14px rgba(37,99,235,0.8))',
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
    });
});

// ═══════════════════════════════════════
// 17. INSPECTOR MODAL — Animated open
// ═══════════════════════════════════════
// Intercept the inspector modal
const _origInspectorStyle = null;
const _inspectorModalEl = () => document.getElementById('inspector-modal');

// Patch the inspector opening
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.querySelector('#inspector-modal button');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const modal = _inspectorModalEl();
            if (modal && typeof gsap !== 'undefined') {
                gsap.to(modal.firstElementChild, {
                    opacity: 0,
                    y: 20,
                    scale: 0.96,
                    duration: 0.25,
                    ease: 'power2.in',
                    onComplete: () => { modal.style.display = 'none'; }
                });
                gsap.to(modal, { opacity: 0, duration: 0.2, ease: 'power2.in' });
            } else if (modal) {
                modal.style.display = 'none';
            }
        });
    }
});

// Expose a helper to open inspector with animation
window.openInspectorAnimated = function() {
    const modal = _inspectorModalEl();
    if (!modal) return;
    modal.style.display = 'flex';
    modal.style.opacity = '0';

    if (typeof gsap !== 'undefined') {
        gsap.to(modal, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.fromTo(modal.firstElementChild,
            { opacity: 0, y: 40, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.3)' }
        );
    } else {
        modal.style.opacity = '1';
    }
};

// ═══════════════════════════════════════
// 18. SECURITY BADGE — Attention pulse
// ═══════════════════════════════════════
function pulseSecurityBadge() {
    const badge = document.getElementById('security-badge');
    if (!badge || typeof gsap === 'undefined') return;

    gsap.fromTo(badge,
        { scale: 1 },
        { scale: 1.4, duration: 0.2, yoyo: true, repeat: 3, ease: 'power2.inOut' }
    );
}
window.pulseSecurityBadge = pulseSecurityBadge;

// ═══════════════════════════════════════
// 19. BACKGROUND BLOB — GSAP control
// ═══════════════════════════════════════
onGSAPReady(() => {
    // Animate blobs in on load
    gsap.to('.blob', {
        opacity: 1,
        duration: 2.5,
        ease: 'power2.out',
        stagger: 0.5,
    });
});

// ═══════════════════════════════════════
// 20. ADBLOCK TOGGLE — Animated feedback
// ═══════════════════════════════════════
const _origToggleAdblock = window.toggleAdblock;
window.toggleAdblock = function(enabled) {
    if (_origToggleAdblock) _origToggleAdblock(enabled);

    const shield = document.querySelector('.card [style*="border-left"]');
    if (shield && typeof gsap !== 'undefined') {
        gsap.fromTo(shield,
            { boxShadow: enabled ? '0 0 0 0 rgba(16,185,129,0)' : '0 0 0 0 rgba(239,68,68,0)' },
            {
                boxShadow: enabled
                    ? '0 0 30px rgba(16,185,129,0.2), 0 0 0 2px rgba(16,185,129,0.3)'
                    : '0 0 0 0 rgba(16,185,129,0)',
                duration: 0.5,
                ease: 'power2.out',
            }
        );
    }
};

console.log('[Nexus Animations] ✓ GSAP + CountUp + Tippy initialized');
