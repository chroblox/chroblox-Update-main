"use strict";

// --- GLOBALS FOR SPA COMMUNICATION ---
window.isGameRunning = false;
window.currentView = 'view-launch';

// --- OS NAVIGATION ---
const navButtons = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

window.switchView = function(targetId) {
    let actualView = targetId;
    if (targetId === 'view-games' && window.isGameRunning) {
        actualView = 'view-proxy';
    }

    viewSections.forEach(view => view.classList.add('hidden'));
    
    const navTarget = ['view-privacy', 'view-tos', 'view-dmca'].includes(targetId) ? 'view-settings' : targetId;
    
    navButtons.forEach(b => {
        if(b.getAttribute('data-target') === navTarget) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    const targetView = document.getElementById(actualView);
    if (targetView) targetView.classList.remove('hidden');
    
    const sc = document.getElementById('stealth-controls');
    if (sc) {
        if (actualView === 'view-launch') {
            sc.classList.remove('hidden');
        } else {
            sc.classList.add('hidden');
        }
    }

    window.currentView = actualView;
    if (typeof window.handleViewBanners === 'function') {
        window.handleViewBanners(actualView);
    }
};

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchView(btn.getAttribute('data-target'));
    });
});

// --- CLOAKING ---
window.handleCloak = function(type) {
    let title = "Chroblox | Workspace v1.5";
    let icon = "favicon.ico";

    if (type === 'drive') {
        title = "My Drive - Google Drive";
        icon = "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png";
    } else if (type === 'classroom') {
        title = "Classes";
        icon = "https://ssl.gstatic.com/classroom/favicon.png";
    } else if (type === 'blooket') {
        title = "Blooket";
        icon = "https://www.blooket.com/favicon.ico";
    }

    document.title = title;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = icon;
    
    const stealthMenu = document.getElementById('stealth-menu');
    if(stealthMenu) stealthMenu.classList.add('hidden');
};

// --- SIDEBAR COLLAPSE ---
const sidebar = document.getElementById('main-sidebar');
const desktopCollapseBtn = document.getElementById('desktop-collapse-btn');
const mobileBtn = document.getElementById('mobile-menu-btn');

if (desktopCollapseBtn && sidebar) {
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }
    desktopCollapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    });
}

if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.innerWidth <= 850) sidebar.classList.remove('open');
        });
    });
}

// --- THEME ENGINE ---
const THEMES = {
  sakura: { ac:'#ff85a1', ag:'rgba(255,133,161,0.6)', draw:'sakura', lightBg:'#fff2f5', darkBg:'#070204' },
  blue:   { ac:'#00b4d8', ag:'rgba(0,180,216,0.6)',  draw:'ocean',  lightBg:'#f0f9ff', darkBg:'#010810' },
  gold:   { ac:'#f5a623', ag:'rgba(245,166,35,0.6)',  draw:'fire',   lightBg:'#fffcf5', darkBg:'#0a0500' },
  purple: { ac:'#b44fff', ag:'rgba(180,79,255,0.6)',  draw:'cosmos', lightBg:'#fbf5ff', darkBg:'#08040f' },
  green:  { ac:'#00ff41', ag:'rgba(0,255,65,0.6)',    draw:'matrix', lightBg:'#f5fff8', darkBg:'#000500' },
  dark:   { ac:'#ff4b4b', ag:'rgba(255,75,75,0.6)',   draw:'flares', lightBg:'#fff5f5', darkBg:'#0a0c10' }
};

window.setTheme = function(name) {
    const t = THEMES[name] || THEMES['dark'];
    document.documentElement.setAttribute('data-theme', name);
    document.documentElement.style.setProperty('--ac', t.ac);
    document.documentElement.style.setProperty('--ag', t.ag);
    document.documentElement.style.setProperty('--nb', t.ag.replace('0.6','0.12'));
    
    const mode = document.documentElement.getAttribute('data-mode') || 'dark';
    document.documentElement.style.setProperty('--bg', mode === 'light' ? t.lightBg : t.darkBg);
    
    document.querySelectorAll('.m-item').forEach(b => b.classList.remove('active'));
    try {
        if (window.event && window.event.currentTarget && window.event.currentTarget.classList) {
            window.event.currentTarget.classList.add('active');
        }
    } catch(e) {}
    
    const tMenu = document.getElementById('t-menu');
    if(tMenu) tMenu.classList.add('hidden');
    
    localStorage.setItem("chroblox-theme", name);
    if (typeof window.initParticles === 'function') window.initParticles();
};

const modeTog = document.getElementById('mode-tog');
if (modeTog) {
    modeTog.addEventListener('click', () => {
        const currentMode = document.documentElement.getAttribute('data-mode') || 'dark';
        const themeName = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextMode = currentMode === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-mode', nextMode);
        document.getElementById('mode-tog').innerText = nextMode === 'dark' ? '🌙 Mode' : '☀️ Mode';
        
        const t = THEMES[themeName];
        document.documentElement.style.setProperty('--bg', nextMode === 'light' ? t.lightBg : t.darkBg);
        if (typeof window.initParticles === 'function') window.initParticles();
    });
}

const tTog = document.getElementById('t-tog');
const stealthBtn = document.getElementById('stealth-btn');

if (tTog) {
    tTog.onclick = (e) => { 
        e.stopPropagation(); 
        document.getElementById('t-menu').classList.toggle('hidden'); 
        document.getElementById('stealth-menu').classList.add('hidden'); 
    };
}
if (stealthBtn) {
    stealthBtn.onclick = (e) => { 
        e.stopPropagation(); 
        document.getElementById('stealth-menu').classList.toggle('hidden'); 
        document.getElementById('t-menu').classList.add('hidden'); 
    };
}

document.addEventListener('click', (e) => {
    const tm = document.getElementById('t-menu');
    const sm = document.getElementById('stealth-menu');
    if (tTog && !tTog.contains(e.target) && tm) tm.classList.add('hidden');
    if (stealthBtn && !stealthBtn.contains(e.target) && sm) sm.classList.add('hidden');
});

// --- BOOT EVENT LISTENER ---
document.addEventListener("DOMContentLoaded", async () => {
    try {
        if(window.registerSW) {
            await Promise.race([
                window.registerSW(),
                new Promise((_, rej) => setTimeout(() => rej('SW timeout'), 5000))
            ]);
        }
    } catch (err) { console.warn("SW boot:", err); }

    const savedTheme = localStorage.getItem("chroblox-theme") || "dark";
    setTheme(savedTheme);
    
    if(typeof window.loadGameCatalog === 'function') window.loadGameCatalog();
    if(typeof window.handleViewBanners === 'function') window.handleViewBanners('view-launch');

    setTimeout(() => {
        if(typeof window.runAdblockCheck === 'function') window.runAdblockCheck();
    }, 3800);

    const seenUpdate = localStorage.getItem("chroblox-v1.5-seen");
    if (!seenUpdate) {
        const updateOverlay = document.getElementById("update-overlay");
        if (updateOverlay) setTimeout(() => updateOverlay.classList.remove("hidden"), 4000);
    }

    document.getElementById("close-update-btn")?.addEventListener("click", () => {
        localStorage.setItem("chroblox-v1.5-seen", "true");
        document.getElementById("update-overlay").classList.add("hidden");
    });
});