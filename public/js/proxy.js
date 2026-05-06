"use strict";

window.currentFrame = null;
const RAM_SAVER_ENABLED = true; 
const MAX_IDLE_MINUTES = 15;

const { ScramjetController } = window.$scramjetLoadController ? window.$scramjetLoadController() : {ScramjetController: null};

if (ScramjetController) {
    window.scramjet = new ScramjetController({
        files: { wasm: "/scram/scramjet.wasm.wasm", all: "/scram/scramjet.all.js", sync: "/scram/scramjet.sync.js" }
    });
    window.scramjet.init();
}
const connection = window.BareMux ? new window.BareMux.BareMuxConnection("/baremux/worker.js") : null;

// --- LAUNCH GAME (IFRAME) ---
window.launchGame = async function(inputValue) {
    window.isGameRunning = true;
    window.switchView("view-proxy");

    if (window.innerWidth <= 850) {
        const sb = document.getElementById('main-sidebar');
        if (sb) sb.classList.remove('open');
    }

    const loader = document.getElementById("proxy-loader");
    if(loader) loader.classList.remove("hidden");

    try {
        if(window.registerSW) {
            await Promise.race([
                window.registerSW(),
                new Promise((_, rej) => setTimeout(() => rej('SW timeout'), 5000))
            ]);
        }
    } catch (err) { console.warn("[Game] SW init:", err); }

    try {
        let rawSearchEngine = document.getElementById('sj-search-engine');
        let seValue = rawSearchEngine ? rawSearchEngine.value : "https://www.google.com/search?q=%s";
        const url = window.search ? window.search(inputValue, seValue) : inputValue;
        const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
        
        if (connection && (await connection.getTransport()) !== "/libcurl/index.mjs") {
            await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
        }

        if (window.currentFrame && window.currentFrame.frame && window.currentFrame.frame.parentNode) {
            window.currentFrame.frame.parentNode.removeChild(window.currentFrame.frame);
        }

        window.currentFrame = window.scramjet.createFrame();
        window.currentFrame.frame.id = "sj-frame";
        window.currentFrame.frame.setAttribute("allow", "fullscreen *; pointer-lock *; keyboard-map *; autoplay *;");
        window.currentFrame.frame.setAttribute("tabindex", "0");
        window.currentFrame.frame.style.touchAction = "auto";

        window.currentFrame.frame.onload = () => {
            if(loader) loader.classList.add("hidden");
            try { window.currentFrame.frame.contentWindow.focus(); } catch(e) {}
            window.currentFrame.frame.focus();
        };

        const container = document.getElementById("proxy-frame-container");
        container.appendChild(window.currentFrame.frame);
        window.currentFrame.go(url);
        
        const focusFrame = () => {
            if(window.currentFrame && window.currentFrame.frame) {
                try { window.currentFrame.frame.contentWindow.focus(); } catch(e) {}
                window.currentFrame.frame.focus();
            }
        };
        container.onmouseover = container.onclick = focusFrame;
        container.ontouchstart = focusFrame;
    } catch(err) {
        console.error("[Game] Launch failed:", err);
        if(loader) loader.classList.add("hidden");
    }
};

// --- EXIT LOGIC ---
const btnHome = document.getElementById("nav-home"); 
if(btnHome) {
    let isDraggingExit = false, exitStartX, exitStartY, exitInitialLeft, exitInitialTop;
    btnHome.addEventListener("mousedown", (e) => {
        isDraggingExit = false;
        exitStartX = e.clientX;
        exitStartY = e.clientY;
        exitInitialLeft = btnHome.offsetLeft;
        exitInitialTop = btnHome.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
        if (exitStartX !== undefined && exitStartY !== undefined) {
            const dx = e.clientX - exitStartX;
            const dy = e.clientY - exitStartY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDraggingExit = true;
            if (isDraggingExit) {
                btnHome.style.left = (exitInitialLeft + dx) + "px";
                btnHome.style.top = (exitInitialTop + dy) + "px";
                btnHome.style.right = "auto";
                btnHome.style.bottom = "auto";
            }
        }
    });

    document.addEventListener("mouseup", () => {
        exitStartX = undefined;
        exitStartY = undefined;
    });

    btnHome.addEventListener("click", (e) => {
        if (isDraggingExit) {
            e.preventDefault();
            e.stopPropagation();
            isDraggingExit = false;
            return;
        }
        if (window.currentFrame && window.currentFrame.frame && window.currentFrame.frame.parentNode) {
            window.currentFrame.frame.parentNode.removeChild(window.currentFrame.frame);
            window.currentFrame = null;
        }
        const loader = document.getElementById("proxy-loader");
        if(loader) loader.classList.add("hidden");
        
        window.isGameRunning = false;
        window.switchView("view-games"); 
    });
}

// --- BROWSER HUB LOGIC ---
let browserTabs = [];
let activeBrowserTabId = null;

window.launchBrowser = function(val) {
    window.switchView("view-browser");
    let targetTabId = null;
    if(browserTabs.length === 0) {
        window.createNewBrowserTab();
        targetTabId = activeBrowserTabId;
    } else {
        const currentTab = browserTabs.find(t => t.id === activeBrowserTabId);
        if(currentTab && currentTab.url === 'about:blank') {
            targetTabId = currentTab.id;
        } else {
            window.createNewBrowserTab();
            targetTabId = activeBrowserTabId;
        }
    }
    if(val) window.loadUrlInBrowserTab(targetTabId, val);
};

const form = document.getElementById("sj-form");
if(form) {
    form.addEventListener("submit", (e) => { 
        e.preventDefault(); 
        let address = document.getElementById("sj-address");
        window.launchBrowser(address.value.trim()); 
    });
}

window.createNewBrowserTab = function() {
    const id = Date.now();
    browserTabs.push({ id, title: "New Tab", url: "about:blank", frameObj: null, domFrame: null });
    activeBrowserTabId = id;
    renderBrowserTabs();
};

window.closeBrowserTab = function(id) {
    const idx = browserTabs.findIndex(t => t.id === id);
    if(idx === -1) return;
    if(browserTabs[idx].tracker) clearInterval(browserTabs[idx].tracker);
    if(browserTabs[idx].domFrame) browserTabs[idx].domFrame.remove();
    browserTabs.splice(idx, 1);
    if(activeBrowserTabId === id) {
        activeBrowserTabId = browserTabs.length ? browserTabs[Math.max(0, idx - 1)].id : null;
    }
    renderBrowserTabs();
};

window.switchBrowserTab = function(id) {
    activeBrowserTabId = id;
    renderBrowserTabs();
};

window.reloadBrowserTab = function() {
    const tab = browserTabs.find(t => t.id === activeBrowserTabId);
    if(tab && tab.frameObj) tab.frameObj.go(tab.url);
};

window.goBackBrowser = function() {
    const tab = browserTabs.find(t => t.id === activeBrowserTabId);
    if(tab && tab.domFrame) {
        try { tab.domFrame.contentWindow.history.back(); } catch(e) {}
    }
};

window.goForwardBrowser = function() {
    const tab = browserTabs.find(t => t.id === activeBrowserTabId);
    if(tab && tab.domFrame) {
        try { tab.domFrame.contentWindow.history.forward(); } catch(e) {}
    }
};

const browserUrlForm = document.getElementById("browser-url-form");
if(browserUrlForm) {
    browserUrlForm.onsubmit = (e) => {
        e.preventDefault();
        const url = document.getElementById("browser-url-bar").value.trim();
        if(!url) return;
        window.loadUrlInBrowserTab(activeBrowserTabId, url);
    };
}

window.loadUrlInBrowserTab = async function(id, rawInput) {
    const loader = document.getElementById('browser-loader');
    if (loader) loader.classList.remove('hidden');

    try {
        if(window.registerSW) {
            await Promise.race([
                window.registerSW(),
                new Promise((_, rej) => setTimeout(() => rej('SW timeout'), 5000))
            ]);
        }
    } catch (err) { console.warn("[Browser] SW init:", err); }

    try {
        let rawSearchEngine = document.getElementById('sj-search-engine');
        let seValue = rawSearchEngine ? rawSearchEngine.value : "https://www.google.com/search?q=%s";
        const url = window.search ? window.search(rawInput, seValue) : rawInput;
        const tab = browserTabs.find(t => t.id === id);
        if(!tab) {
            if (loader) loader.classList.add('hidden');
            return;
        }
        tab.url = url;
        document.getElementById("browser-url-bar").value = url;

        const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
        if (connection && (await connection.getTransport()) !== "/libcurl/index.mjs") {
            await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
        }
        
        if(!tab.frameObj) {
            tab.frameObj = window.scramjet.createFrame();
            tab.domFrame = tab.frameObj.frame;
            tab.domFrame.className = "browser-iframe hidden";
            document.getElementById("browser-viewport").appendChild(tab.domFrame);
            
            tab.domFrame.onload = () => {
                if (loader) loader.classList.add('hidden');
                
                tab.tracker = setInterval(() => {
                    try {
                        if(activeBrowserTabId !== tab.id) return; 
                        const rawUrl = tab.domFrame.contentWindow.location.href;
                        if(rawUrl && rawUrl !== "about:blank") {
                            const prefix = "/scramjet/";
                            const idx = rawUrl.indexOf(prefix);
                            if(idx !== -1) {
                                let decoded = decodeURIComponent(rawUrl.substring(idx + prefix.length));
                                if(document.activeElement !== document.getElementById("browser-url-bar")) {
                                    document.getElementById("browser-url-bar").value = decoded;
                                }
                            }
                        }
                    } catch(e) {}
                }, 1000);
            };
        }
        
        tab.frameObj.go(url);
        renderBrowserTabs();
    } catch(err) {
        console.error("[Browser] Load failed:", err);
        if (loader) loader.classList.add('hidden');
    }
};

function renderBrowserTabs() {
    const list = document.getElementById("browser-tabs-list");
    if(!list) return;
    
    list.innerHTML = browserTabs.map(t => `
        <div class="browser-tab ${t.id === activeBrowserTabId ? 'active' : ''}" onclick="switchBrowserTab(${t.id})">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                ${t.url === 'about:blank' ? 'New Tab' : t.url}
            </span>
            <button class="tab-close" onclick="event.stopPropagation(); closeBrowserTab(${t.id})">×</button>
        </div>
    `).join('') + '<button class="new-tab-btn" onclick="createNewBrowserTab()">+</button>';
    
    const splash = document.getElementById("browser-splash");
    const urlBar = document.getElementById("browser-url-bar");
    if(urlBar) urlBar.value = "";

    if(browserTabs.length === 0) {
        if(splash) splash.style.display = "flex";
    } else {
        const active = browserTabs.find(t => t.id === activeBrowserTabId);
        if(active.url === 'about:blank') {
            if(splash) splash.style.display = "flex";
            if(urlBar) urlBar.value = "";
        } else {
            if(splash) splash.style.display = "none";
            if(urlBar) urlBar.value = active.url;
        }
        
        browserTabs.forEach(t => {
            if(t.domFrame) {
                if(t.id === activeBrowserTabId && t.url !== 'about:blank') {
                    t.domFrame.classList.remove('hidden');
                } else {
                    t.domFrame.classList.add('hidden');
                }
            }
        });
    }
}

// --- RAM SAVER ---
if (RAM_SAVER_ENABLED) {
    let idleTime = 0;
    const resetTimer = () => { idleTime = 0; };
    window.onload = resetTimer; window.onmousemove = resetTimer;
    window.onmousedown = resetTimer; window.ontouchstart = resetTimer; window.onkeypress = resetTimer;

    setInterval(() => {
        const isHidden = document.getElementById("home-ui")?.classList.contains("hidden");
        if ((window.currentFrame || browserTabs.length > 0) && isHidden === false) {
            idleTime++;
            if (idleTime >= MAX_IDLE_MINUTES) {
                if (window.currentFrame && window.currentFrame.frame) {
                    window.currentFrame.frame.parentNode.removeChild(window.currentFrame.frame);
                    window.currentFrame = null;
                }
                browserTabs.forEach(t => { if(t.domFrame) t.domFrame.remove(); });
                browserTabs = [];
                
                const sleepOverlay = document.getElementById('sleep-overlay');
                if(sleepOverlay) sleepOverlay.classList.remove('hidden');
            }
        }
    }, 60000); 
}