"use strict";

const BG_THEMES = {
  sakura: { ac:'#ff85a1', ag:'rgba(255,133,161,0.6)', draw:'sakura' },
  blue:   { ac:'#00b4d8', ag:'rgba(0,180,216,0.6)',  draw:'ocean' },
  gold:   { ac:'#f5a623', ag:'rgba(245,166,35,0.6)',  draw:'fire' },
  purple: { ac:'#b44fff', ag:'rgba(180,79,255,0.6)',  draw:'cosmos' },
  green:  { ac:'#00ff41', ag:'rgba(0,255,65,0.6)',    draw:'matrix' },
  dark:   { ac:'#ff4b4b', ag:'rgba(255,75,75,0.6)',   draw:'flares' }
};

const cv = document.getElementById('bg');
let cx = null;
let W, H, mx = -1000, my = -1000, raf;
let particles = [];

if (cv) {
    cx = cv.getContext('2d', {alpha: false});
    function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
    resize(); 
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
}

function spawnEmber(randY = false) {
    let isFire = Math.random() > 0.3;
    particles.push({
        x: Math.random() * W,
        y: randY ? Math.random() * H : H + 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: isFire ? -(Math.random() * 3 + 2) : -(Math.random() * 1 + 0.5),
        life: 1,
        decay: isFire ? 0.015 : 0.005,
        s: isFire ? 16 : 24,
        type: isFire ? 'f' : 's'
    });
}

function spawnFlare(randY = false) {
    const colors = ['255, 75, 75', '255, 30, 30', '255, 120, 50'];
    particles.push({
        x: Math.random() * W,
        y: randY ? Math.random() * H : H + 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 2 + 1),
        sway: Math.random() * Math.PI * 2,
        life: 1,
        decay: Math.random() * 0.008 + 0.003,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)]
    });
}

window.initParticles = function() {
    if (!cx) return; 
    particles = [];
    const themeAttr = document.documentElement.getAttribute('data-theme') || 'dark';
    const draw = BG_THEMES[themeAttr]?.draw;
    
    if(draw === 'sakura') {
        for(let i=0; i<70; i++) particles.push({ x: Math.random()*W, y: Math.random()*H, s: Math.random()*6+4, a: Math.random()*Math.PI, v: Math.random()*1.5+0.5, sway: Math.random()*0.02 });
    } else if(draw === 'fire') {
        for(let i=0; i<100; i++) spawnEmber(true);
    } else if(draw === 'flares') {
        for(let i=0; i<80; i++) spawnFlare(true);
    } else if(draw === 'ocean') {
        for(let i=0; i<50; i++) particles.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*10+2, v: Math.random()*2+1 });
    } else if(draw === 'cosmos') {
        for(let i=0; i<150; i++) particles.push({ x: Math.random()*W, y: Math.random()*H, z: Math.random()*W, t: Math.random()>0.8?'p':'s' });
    } else if(draw === 'matrix') {
        for(let i=0; i<W/20; i++) particles.push({x:i*20, y:Math.random()*H, v:Math.random()*4+2});
    }
};

function render() {
    if (!cx) return; 
    const mode = document.documentElement.getAttribute('data-mode') || 'dark';
    const themeAttr = document.documentElement.getAttribute('data-theme') || 'dark';
    const t = BG_THEMES[themeAttr] || BG_THEMES['dark'];
    
    cx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0c10';
    cx.fillRect(0,0,W,H);

    if(t.draw === 'sakura') {
        cx.fillStyle = mode === 'dark' ? '#ff85a1' : '#ffb7c5';
        particles.forEach(p => {
            p.y += p.v; p.a += p.sway; p.x += Math.sin(p.y/50 + p.a) * 1.5;
            let dx = p.x - mx, dy = p.y - my, dist = Math.hypot(dx, dy);
            if(dist < 150) { p.x += dx*0.02; p.y += dy*0.02; p.a += 0.1; }
            if(p.y > H + 20) { p.y = -20; p.x = Math.random()*W; }
            if(p.x > W + 20) p.x = -20; else if(p.x < -20) p.x = W + 20;
            cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a);
            cx.beginPath(); cx.ellipse(0,0, p.s, p.s/2.5, 0, 0, Math.PI*2); cx.fill(); cx.restore();
        });
    } else if(t.draw === 'fire') {
        for(let i=particles.length-1; i>=0; i--){
            let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= p.decay;
            let dx = mx - p.x, dy = my - p.y, dist = Math.hypot(dx, dy);
            if(dist < 200) { p.vx += dx*0.002; p.vy += dy*0.002; }
            if(p.life <= 0) { particles.splice(i,1); spawnEmber(); continue; }
            cx.beginPath(); cx.arc(p.x, p.y, p.s * p.life, 0, Math.PI*2);
            cx.fillStyle = p.type==='f' ? `rgba(245,166,35,${p.life})` : `rgba(255,200,100,${p.life*0.1})`; cx.fill();
        }
    } else if(t.draw === 'flares') {
        for(let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i]; p.sway += 0.05; p.x += p.vx + (Math.sin(p.sway) * 0.5); p.y += p.vy; p.life -= p.decay;
            let dx = mx - p.x; let dy = my - p.y; let dist = Math.hypot(dx, dy);
            if (dist < 150) { p.x -= (dx / dist) * 2; p.y -= (dy / dist) * 2; }
            if (p.life <= 0 || p.y < -20) { particles.splice(i, 1); spawnFlare(); continue; }
            cx.beginPath(); cx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); cx.fillStyle = `rgba(${p.color}, ${p.life})`; cx.fill();
        }
    } else if(t.draw === 'ocean') {
        cx.strokeStyle = mode === 'dark' ? 'rgba(0,180,216,0.6)' : 'rgba(0,91,150,0.4)'; cx.lineWidth = 1.5;
        particles.forEach(p => { p.y -= p.v; p.x += Math.sin(p.y/30)*0.5; let dx = p.x - mx, dy = p.y - my, dist = Math.hypot(dx, dy); if(dist < 100) { p.x += dx*0.05; p.y += dy*0.05; } if(p.y < -20) { p.y = H+20; p.x = Math.random()*W; } cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI*2); cx.stroke(); });
    } else if(t.draw === 'cosmos') {
        cx.fillStyle = mode === 'dark' ? t.ac : '#aaa'; let mouseXOffset = (mx - W/2) * 0.05, mouseYOffset = (my - H/2) * 0.05;
        particles.forEach(p => { p.z -= 2; if(p.z <= 0) p.z = W; let x = (p.x - W/2 - mouseXOffset) * (W/p.z) + W/2; let y = (p.y - H/2 - mouseYOffset) * (W/p.z) + H/2; let s = (1 - p.z/W) * (p.t==='s'?3:10); if (x > 0 && x < W && y > 0 && y < H) { cx.globalAlpha = 1 - p.z/W; cx.beginPath(); cx.arc(x, y, s, 0, Math.PI*2); cx.fill(); }});
    } else if(t.draw === 'matrix') {
        cx.fillStyle = t.ac; cx.font = '16px monospace';
        particles.forEach(p => { let dx = mx-p.x, dy = my-p.y, dist = Math.hypot(dx,dy); let drawX = p.x; if(dist < 100) drawX -= (dx/dist)*(100-dist)*0.5; cx.fillText(String.fromCharCode(0x30A0 + Math.random()*96), drawX, p.y); p.y += p.v; if(p.y > H) p.y = 0; });
    }
    cx.globalAlpha = 1; raf = requestAnimationFrame(render);
}
if (cx) render();