"use strict";

const DIRECT_LINK_URL = 'https://hospitalforgery.com/kycrzvi3bw?key=3fb92c421dc14fda854989cb0df7a563'; 
const COOLDOWN_MS = 50 * 1000; 
let isAdLocked = false; 

// --- POPUNDER ENGINE ---
document.addEventListener('click', (e) => {
    if (e.target.closest('.support-btn-premium, #close-update-btn, #anti-adblock-overlay, #sleep-overlay, .adblock-modal, .update-content, #proxy-ad-banner-top, #proxy-ad-banner-bottom, .ad-content, #sj-form, .launch-btn, .premium-launch-btn, .premium-game-card, .lane-game-card, .game-card, #browser-url-form, .bar-search-btn, .cherri-card, .nav-item, .nav-controls, .floating-exit-btn, .legal-back-btn, .theme-btn, .stealth-pill-btn, .stealth-menu, .collapse-btn, .mobile-toggle, .browser-tab, .new-tab-btn, .tab-close, .player-controls')) {
        return;
    }

    if (e.button !== 0 || isAdLocked || !e.isTrusted || window.isGameRunning) return;

    try {
        const now = Date.now();
        const storedTime = localStorage.getItem('chroblox_popunder_time');
        const lastAdTime = storedTime ? parseInt(storedTime, 10) : 0;
        const timeSinceLastAd = now - lastAdTime;

        if (timeSinceLastAd >= COOLDOWN_MS) {
            isAdLocked = true;
            setTimeout(() => { isAdLocked = false; }, 2000);
            localStorage.setItem('chroblox_popunder_time', now.toString());

            let pop = window.open(DIRECT_LINK_URL, '_blank');
            if (pop) {
                pop.blur();
                window.focus();
            }
        }
    } catch (err) {
        console.error("[Ad Engine] Safe catch - Error handled:", err);
    }
});

window.triggerSupportAd = function() {
    let pop = window.open(DIRECT_LINK_URL, '_blank');
    if (pop) {
        pop.blur();
        window.focus();
        console.log("[Support] Thank you for clicking!");
    } else {
        alert("Please allow popups to support us!");
    }
};

// --- BANNERS ---
let sharedBannerCooldown = false;
let sharedBannerCooldownTimer = null;

window.renderBanners = function() {
    ['proxy-ad-banner-top', 'proxy-ad-banner-bottom'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        
        container.classList.add("show");
        const contentDiv = container.querySelector('.ad-content');
        contentDiv.innerHTML = ''; 
        
        const iframe = document.createElement('iframe');
        iframe.style.width = '728px'; 
        iframe.style.height = '90px'; 
        iframe.style.border = 'none'; 
        iframe.style.overflow = 'hidden';
        contentDiv.appendChild(iframe);
        
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html><head><style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style></head><body>
            <script type="text/javascript">
                atOptions = {
                    'key' : 'e5329f54bea294b733b7ba46c03c2250',
                    'format' : 'iframe',
                    'height' : 90,
                    'width' : 728,
                    'params' : {}
                };
            </script>
            <script type="text/javascript" src="https://hospitalforgery.com/e5329f54bea294b733b7ba46c03c2250/invoke.js"></script>
            </body></html>
        `);
        doc.close();
    });
};

window.hideBanners = function() {
    const topBanner = document.getElementById("proxy-ad-banner-top");
    const bottomBanner = document.getElementById("proxy-ad-banner-bottom");
    if (topBanner) topBanner.classList.remove("show");
    if (bottomBanner) bottomBanner.classList.remove("show");
};

function closeBannersManually() {
    window.hideBanners();
    if (['view-launch', 'view-settings', 'view-browser'].includes(window.currentView)) {
        sharedBannerCooldown = true;
        clearTimeout(sharedBannerCooldownTimer);
        sharedBannerCooldownTimer = setTimeout(() => {
            sharedBannerCooldown = false;
            if (['view-launch', 'view-settings', 'view-browser'].includes(window.currentView)) {
                window.renderBanners();
            }
        }, 180000); 
    }
}

const topCloseBtn = document.getElementById("close-ad-top-btn");
const bottomCloseBtn = document.getElementById("close-ad-bottom-btn");
if (topCloseBtn) topCloseBtn.addEventListener("click", closeBannersManually);
if (bottomCloseBtn) bottomCloseBtn.addEventListener("click", closeBannersManually);

window.handleViewBanners = function(targetId) {
    window.hideBanners();
    if (targetId === 'view-games') {
        if (!window.isGameRunning) window.renderBanners();
    } else if (['view-launch', 'view-settings', 'view-browser'].includes(targetId)) {
        if (!sharedBannerCooldown) window.renderBanners();
    }
};

// --- ADBLOCK DETECTION ---
const ADBLOCK_SIGNALS = { BAIT_DIV: 'bait-div' };
let _isPrivateMode = false;
let _adblockGracePeriod = false;
let _adblockTripped = false;

(async function detectPrivateMode() {
    try {
        if (navigator.storage && navigator.storage.estimate) {
            const { quota } = await navigator.storage.estimate();
            if (quota && quota < 200 * 1024 * 1024) {
                _isPrivateMode = true;
                console.log('[Chroblox] Private browsing detected — adblock check skipped');
            }
        }
    } catch (_) {}
})();

async function detectAdblock() {
    if (_isPrivateMode) return [];
    const failed = [];
    try {
        const bait = document.createElement("div");
        bait.className = "pub_300x250 pub_728x90 text-ad textAd text_ad adSense adBlock adContent adBanner ads ad-unit";
        bait.style.cssText = "position:absolute;top:-9999px;left:-9999px;width:10px;height:10px;";
        bait.innerHTML = "&nbsp;";
        document.body.appendChild(bait);
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const cs = window.getComputedStyle(bait);
        const blocked = bait.offsetParent === null || bait.offsetHeight === 0 || bait.offsetWidth === 0 || cs.display === "none" || cs.visibility === "hidden";
        
        bait.remove();
        if (blocked) failed.push(ADBLOCK_SIGNALS.BAIT_DIV);
    } catch (_) {}
    return failed;
}

function lockApp() {
    document.body.classList.add('adblock-locked');
    try {
        document.querySelectorAll('audio, video').forEach(el => { try { el.pause(); } catch (_) {} });
    } catch (_) {}
}

function unlockApp() {
    document.body.classList.remove('adblock-locked');
}

window.runAdblockCheck = async function() {
    const failed = await detectAdblock();
    const overlay = document.getElementById("anti-adblock-overlay");
    if (!overlay) return;
    if (failed.length > 0) {
        console.log('[Chroblox] Adblock detected. Signals:', failed.join(', '));
        _adblockTripped = true;
        overlay.classList.remove("hidden");
        lockApp();
    } else if (!_adblockTripped) {
        overlay.classList.add("hidden");
        unlockApp();
    }
};

(function continuousAdblockGuard() {
    _adblockGracePeriod = true;
    setTimeout(() => { _adblockGracePeriod = false; }, 2500);

    setInterval(() => {
        if (document.visibilityState === 'visible') window.runAdblockCheck();
    }, 30000);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            setTimeout(window.runAdblockCheck, 400);
        }
    });

    window.addEventListener('focus', () => setTimeout(window.runAdblockCheck, 400));
})();