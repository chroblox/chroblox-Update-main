"use strict";

let _gamesCached = false;
let _searchIndex = [];

// --- APP VAULT CATALOG ---
window.loadGameCatalog = async function() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    if (_gamesCached) return;

    try {
        const response = await fetch('/data/games.json?v=' + Date.now());
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
        
        const games = await response.json();
        if (games.length === 0) {
            grid.innerHTML = '<p>Catalog is empty.</p>';
            return;
        }

        grid.innerHTML = ''; 
        _searchIndex = [];

        const frag = document.createDocumentFragment();
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'premium-game-card';
            card.onclick = () => window.launchGame(game.url);

            card.innerHTML = `
                <div class="game-banner" style="background-image: url('${game.img}');"></div>
                <div class="game-details">
                    <h3>${game.name}</h3>
                </div>
            `;
            frag.appendChild(card);
            _searchIndex.push({ lowerName: game.name.toLowerCase(), card });
        });
        grid.appendChild(frag);
        _gamesCached = true;

    } catch (err) {
        grid.innerHTML = `<p style="color:var(--ac); padding: 20px;">⚠️ Catalog Error: ${err.message}</p>`;
    }
};

let _searchTimer = null;
const searchInput = document.getElementById('game-search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(() => {
            const term = e.target.value.toLowerCase();
            for (let i = 0; i < _searchIndex.length; i++) {
                _searchIndex[i].card.style.display = _searchIndex[i].lowerName.includes(term) ? 'flex' : 'none';
            }
        }, 150);
    });
}

// --- APP CAROUSEL LOGIC ---
(function setupCarousel() {
    const track = document.getElementById('apps-carousel');
    const wrap  = document.getElementById('carousel-wrap');
    if (!track || !wrap) return;

    const FEATURES = [
        {
            kind: 'feature',
            title: 'Game Vault',
            sub: '451 unblocked HTML5 titles',
            cta: '▶ Open Vault',
            brand: '#ff4757',
            bg: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%), url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80') center/cover",
            click: () => window.switchView('view-games')
        },
        {
            kind: 'feature',
            title: 'Movie Center',
            sub: 'Rolling out · Pending update',
            cta: '🕒 Coming Soon',
            brand: '#6366f1',
            bg: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%), url('https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=600&q=80') center/cover",
            click: () => window.switchView('view-movies')
        }
    ];

    const SITES = [
        {
            kind: 'site', title: 'Netflix', sub: 'Movies & TV', cta: '▶ Launch', brand: '#E50914',
            iconSvg: '<svg viewBox="0 0 24 24"><path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.926-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.045-15.913.011-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/></svg>',
            click: () => window.launchBrowser('https://www.netflix.com')
        },
        {
            kind: 'site', title: 'Twitch', sub: 'Live streaming', cta: '▶ Launch', brand: '#9146FF',
            iconSvg: '<svg viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>',
            click: () => window.launchBrowser('https://www.twitch.tv')
        },
        {
            kind: 'site', title: 'Quizlet', sub: 'Study sets & flashcards', cta: '▶ Launch', brand: '#4255FF',
            iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12c1.49 0 2.918-.272 4.236-.768l-1.83-3.17a8.5 8.5 0 1 1 4.69-4.691l3.171 1.83A11.95 11.95 0 0 0 24 12C24 5.373 18.627 0 12 0zm0 4.4a7.6 7.6 0 0 0 0 15.2c1.05 0 2.05-.214 2.96-.6l-.95-1.65a5.7 5.7 0 1 1 3.2-3.2l1.65.95A7.6 7.6 0 0 0 12 4.4zm0 4.4a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z"/></svg>',
            click: () => window.launchBrowser('https://quizlet.com')
        },
        {
            kind: 'site', title: 'Google Docs', sub: 'Write & collaborate', cta: '▶ Launch', brand: '#4285F4',
            iconSvg: '<svg viewBox="0 0 24 24"><path d="M14.727 6.727H14V0H4.91c-.905 0-1.637.732-1.637 1.636v20.728c0 .904.732 1.636 1.636 1.636h14.182c.904 0 1.636-.732 1.636-1.636V6.727h-6zM7.91 17.318a.819.819 0 0 1 .818-.818h6.545a.819.819 0 0 1 0 1.636H8.728a.819.819 0 0 1-.818-.818zm0-3.273a.819.819 0 0 1 .818-.819h6.545a.819.819 0 0 1 0 1.637H8.728a.819.819 0 0 1-.818-.819zm0-3.272a.819.819 0 0 1 .818-.819h6.545a.819.819 0 0 1 0 1.637H8.728a.819.819 0 0 1-.818-.818zM14.727 6V0l6 6h-6z"/></svg>',
            click: () => window.launchBrowser('https://docs.google.com')
        },
        {
            kind: 'site', title: 'GitHub', sub: 'Code repository', cta: '▶ Launch', brand: '#333333',
            iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
            click: () => window.launchBrowser('https://github.com')
        }
    ];

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function buildCard(item) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'carousel-card cc-' + item.kind;
        btn.style.setProperty('--brand', item.brand);
        btn.setAttribute('aria-label', item.title);

        let bgInline = '';
        if (item.kind === 'feature') {
            bgInline = `style="background: ${item.bg};"`;
        } else if (item.kind === 'game' && item.img) {
            bgInline = `style="background-image: url('${escapeHtml(item.img)}');"`;
        }

        const iconHtml = item.iconSvg ? `<div class="cc-icon">${item.iconSvg}</div>` : '';

        btn.innerHTML = `
            <div class="cc-bg" ${bgInline}></div>
            <div class="cc-overlay"></div>
            <div class="cc-shine"></div>
            <div class="cc-content">
                ${item.kind === 'site' ? iconHtml : ''}
                <h3 class="cc-title">${escapeHtml(item.title)}</h3>
                <p class="cc-sub">${escapeHtml(item.sub || '')}</p>
                <span class="cc-cta">${escapeHtml(item.cta || '▶ Launch')}</span>
            </div>
        `;
        btn.addEventListener('click', item.click);
        return btn;
    }

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    async function loadGames() {
        try {
            const res = await fetch('/data/games.json', { cache: 'force-cache' });
            if (!res.ok) return [];
            const games = await res.json();
            return shuffle(games).slice(0, 10).map(g => ({
                kind: 'game',
                title: g.name,
                sub: 'Play now',
                cta: '🎮 Play',
                brand: '#ec4899',
                img: g.img,
                click: () => { window.switchView('view-games'); window.launchGame && window.launchGame(g.url); }
            }));
        } catch (e) {
            return [];
        }
    }

    async function build() {
        const games = await loadGames();
        const middle = shuffle([...SITES, ...games]);
        const cards = [FEATURES[0], ...middle.slice(0, Math.ceil(middle.length / 2)), FEATURES[1], ...middle.slice(Math.ceil(middle.length / 2))];

        track.innerHTML = '';
        cards.forEach(item => track.appendChild(buildCard(item)));
        cards.forEach(item => {
            const c = buildCard(item);
            c.setAttribute('aria-hidden', 'true');
            track.appendChild(c);
        });

        startAutoScroll();
    }

    function startAutoScroll() {
        let paused = false;
        let userActiveUntil = 0;
        const SPEED_PX_PER_SEC = 50; 
        let lastTime = performance.now();
        let halfWidth = 0;
        let pos = 0; 
        let suppressSync = false; 

        const recompute = () => { halfWidth = track.scrollWidth / 2; };
        setTimeout(recompute, 100);
        setTimeout(recompute, 600);
        setTimeout(recompute, 1500);
        window.addEventListener('resize', recompute);

        track.addEventListener('scroll', () => {
            if (suppressSync) { suppressSync = false; return; }
            pos = track.scrollLeft;
        }, { passive: true });

        function tick(now) {
            const dt = Math.min(50, now - lastTime) / 1000;
            lastTime = now;

            const userActive = now < userActiveUntil;
            if (!paused && !userActive && halfWidth > 0) {
                pos += SPEED_PX_PER_SEC * dt;
                if (pos >= halfWidth) pos -= halfWidth;

                const target = Math.round(pos);
                if (target !== track.scrollLeft) {
                    suppressSync = true;
                    track.scrollLeft = target;
                }
            } else if (halfWidth > 0) {
                if (track.scrollLeft >= halfWidth) {
                    suppressSync = true;
                    track.scrollLeft -= halfWidth;
                    pos = track.scrollLeft;
                } else if (track.scrollLeft < 0) {
                    suppressSync = true;
                    track.scrollLeft += halfWidth;
                    pos = track.scrollLeft;
                }
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        wrap.addEventListener('mouseenter', () => { paused = true; });
        wrap.addEventListener('mouseleave', () => { paused = false; });

        const touchPause = () => { userActiveUntil = performance.now() + 2500; };
        track.addEventListener('wheel', touchPause, { passive: true });
        track.addEventListener('touchstart', touchPause, { passive: true });
        track.addEventListener('touchmove', touchPause, { passive: true });
    }

    // Defer until after boot screen finishes
    setTimeout(build, 3500);
})();