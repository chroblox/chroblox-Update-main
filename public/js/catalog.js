"use strict";

let _gamesCached = false;
let _searchIndex = [];

// --- APP VAULT CATALOG ---
window.loadGameCatalog = async function() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    if (_gamesCached) return;

    try {
        // Fetching from new /data/ directory
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
                <div class="game-details" style="padding-bottom: 25px;">
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