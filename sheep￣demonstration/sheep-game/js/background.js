// ═══════════════════════════════════════════
//  ゴシックハロウィン背景
//  参考：巨大な月・枯れ木・羊と狼・墓地
// ═══════════════════════════════════════════
const canvas = document.getElementById('bgCanvas');
const ctx    = canvas.getContext('2d');

// ピクセルスケール（小さくレンダリングしてCSSで引き伸ばすことでドット絵風に）
const PIXEL_SCALE = 2;

let W, H;
function resize() {
    W = Math.floor(window.innerWidth  / PIXEL_SCALE);
    H = Math.floor(window.innerHeight / PIXEL_SCALE);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.imageSmoothingEnabled = false;
    buildScene();
}
window.addEventListener('resize', resize);

// ═══════════════════════════════════════════
//  シーンデータ
// ═══════════════════════════════════════════
let stars  = [];
let clouds = [];
let bats   = [];
let sheep  = [];
let wolf   = {};

function buildScene() {
    // 星
    stars = [];
    for (let i = 0; i < 70; i++) {
        stars.push({
            x     : Math.random() * W,
            y     : Math.random() * H * 0.6,
            size  : Math.random() < 0.75 ? 1 : 2,
            phase : Math.random() * Math.PI * 2,
            speed : 0.015 + Math.random() * 0.025,
        });
    }

    // 雲（月の前を流れる）
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x     : Math.random() * W * 1.8,
            y     : H * 0.22 + Math.random() * H * 0.28,
            speed : 0.07 + Math.random() * 0.09,
            scale : 0.5 + Math.random() * 0.9,
            alpha : 0.14 + Math.random() * 0.18,
        });
    }

    // コウモリ
    bats = [];
    for (let i = 0; i < 7; i++) {
        bats.push({
            x        : W * 0.2 + Math.random() * W * 0.65,
            y        : H * 0.12 + Math.random() * H * 0.32,
            flapSpd  : 0.18 + Math.random() * 0.18,
            moveSpd  : 0.25 + Math.random() * 0.45,
            dir      : Math.random() < 0.5 ? -1 : 1,
            angle    : Math.random() * Math.PI * 2,
            bobOff   : Math.random() * Math.PI * 2,
            size     : 0.5 + Math.random() * 0.7,
        });
    }

    // 羊の群れ（中央〜左寄り・丘の上を走る）
    sheep = [];
    for (let i = 0; i < 5; i++) {
        const x0 = W * 0.05 + i * W * 0.09;
        sheep.push({
            x       : x0,
            y       : 0, // groundAtX で決まる
            speed   : 0.55 + Math.random() * 0.35,
            scale   : 0.65 + Math.random() * 0.45,
            legPhase: Math.random() * Math.PI * 2,
        });
    }

    // 狼（羊の右後ろから追いかける）
    wolf = {
        x      : W * 0.62,
        y      : 0,
        speed  : 0.9,
        scale  : 1.5,
        phase  : 0,
    };
}

// ═══════════════════════════════════════════
//  ユーティリティ：丘の地面Y座標
// ═══════════════════════════════════════════
function groundY(x) {
    // 中央がやや盛り上がった丘
    const peak = Math.max(0, Math.sin(((x / W) - 0.5) * Math.PI)) * H * 0.11;
    const bump = Math.sin(x * 0.055) * H * 0.012 + Math.sin(x * 0.022) * H * 0.018;
    return H * 0.82 - peak - bump;
}

// ═══════════════════════════════════════════
//  描画：空グラデーション
// ═══════════════════════════════════════════
function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0,   '#0b1220');
    g.addColorStop(0.5, '#18213a');
    g.addColorStop(0.78,'#28203a');
    g.addColorStop(1,   '#3a2820');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
}

// ═══════════════════════════════════════════
//  描画：星
// ═══════════════════════════════════════════
function drawStars(t) {
    stars.forEach(s => {
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.phase + t * s.speed));
        ctx.fillStyle = `rgba(210,225,245,${a.toFixed(2)})`;
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    });
}

// ═══════════════════════════════════════════
//  描画：月
// ═══════════════════════════════════════════
function drawMoon() {
    const mx = W * 0.40;
    const my = H * 0.32;
    const r  = Math.min(W, H) * 0.20;

    // 外側の光輪
    const glow = ctx.createRadialGradient(mx, my, r * 0.7, mx, my, r * 2.4);
    glow.addColorStop(0,   'rgba(255,155,45,0.22)');
    glow.addColorStop(0.5, 'rgba(255,120,25,0.10)');
    glow.addColorStop(1,   'rgba(255, 90, 0, 0.00)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // 月本体
    const body = ctx.createRadialGradient(mx - r * 0.18, my - r * 0.18, r * 0.05, mx, my, r);
    body.addColorStop(0,   '#ffe090');
    body.addColorStop(0.25,'#ffaa40');
    body.addColorStop(0.65,'#e07825');
    body.addColorStop(1,   '#b85015');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fill();

    // クレーター模様
    ctx.fillStyle = 'rgba(150,55,8,0.32)';
    ctx.beginPath(); ctx.arc(mx + r * 0.22, my - r * 0.18, r * 0.26, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx - r * 0.28, my + r * 0.22, r * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + r * 0.05, my + r * 0.38, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx - r * 0.10, my - r * 0.05, r * 0.10, 0, Math.PI * 2); ctx.fill();
}

// ═══════════════════════════════════════════
//  描画：雲
// ═══════════════════════════════════════════
function drawCloud(cx, cy, sc, alpha) {
    ctx.fillStyle = `rgba(75,90,118,${alpha})`;
    const pts = [[0,0,22],[26,-12,27],[55,2,17],[42,-22,20],[14,-20,21],[-18,-8,15]];
    pts.forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(cx + dx * sc, cy + dy * sc, r * sc, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawClouds() {
    clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -140 * c.scale) c.x = W + 120;
        drawCloud(c.x, c.y, c.scale, c.alpha);
    });
}

// ═══════════════════════════════════════════
//  描画：お城（右奥の崖）
// ═══════════════════════════════════════════
function drawCastle() {
    const cx = W * 0.76;
    const by = H * 0.60;
    const s  = H / 380;
    ctx.fillStyle = '#0c1018';

    // 崖
    ctx.beginPath();
    ctx.moveTo(cx - 35 * s, H * 0.88);
    ctx.lineTo(cx - 18 * s, by + 2 * s);
    ctx.lineTo(cx + 82 * s, by + 2 * s);
    ctx.lineTo(cx + 98 * s, H * 0.88);
    ctx.fill();

    // 塔（左・中・右）
    ctx.fillRect(cx +  2 * s, by - 58 * s, 19 * s, 62 * s);
    ctx.fillRect(cx + 33 * s, by - 82 * s, 26 * s, 86 * s);
    ctx.fillRect(cx + 55 * s, by - 50 * s, 20 * s, 54 * s);

    // 胸壁
    [0,7,14].forEach(i => ctx.fillRect(cx + 3 * s + i * 5 * s, by - 67 * s, 4 * s, 9 * s));
    [0,7,14,21].forEach(i => ctx.fillRect(cx + 34 * s + i * 5 * s, by - 92 * s, 4 * s, 10 * s));
    [0,7,14].forEach(i => ctx.fillRect(cx + 56 * s + i * 5 * s, by - 59 * s, 4 * s, 8 * s));

    // 尖り屋根
    function spire(sx, sy) {
        ctx.beginPath(); ctx.moveTo(sx - 8 * s, sy); ctx.lineTo(sx, sy - 22 * s); ctx.lineTo(sx + 8 * s, sy); ctx.fill();
    }
    spire(cx + 11 * s, by - 65 * s);
    spire(cx + 46 * s, by - 90 * s);
    spire(cx + 65 * s, by - 57 * s);

    // 光る窓
    ctx.fillStyle = '#ffb840';
    ctx.fillRect(cx + 42 * s, by - 65 * s, 8 * s, 12 * s);
    const wg = ctx.createRadialGradient(cx + 46 * s, by - 59 * s, 2, cx + 46 * s, by - 59 * s, 22 * s);
    wg.addColorStop(0, 'rgba(255,180,60,0.45)');
    wg.addColorStop(1, 'rgba(255,180,60,0.00)');
    ctx.fillStyle = wg;
    ctx.fillRect(cx + 24 * s, by - 81 * s, 44 * s, 44 * s);
}

// ═══════════════════════════════════════════
//  描画：コウモリ
// ═══════════════════════════════════════════
function drawBat(x, y, flap, sz) {
    const wy = Math.sin(flap) * 7 * sz;
    ctx.fillStyle = '#060910';

    // 胴体
    ctx.beginPath();
    ctx.ellipse(x, y, 4 * sz, 3 * sz, 0, 0, Math.PI * 2);
    ctx.fill();

    // 左翼
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 9 * sz, y - wy - 2, x - 14 * sz, y - wy);
    ctx.quadraticCurveTo(x - 10 * sz, y + 4 * sz, x, y + 2 * sz);
    ctx.fill();
    // 左翼先端
    ctx.beginPath();
    ctx.moveTo(x - 14 * sz, y - wy);
    ctx.lineTo(x - 18 * sz, y - wy + 5 * sz);
    ctx.lineTo(x - 16 * sz, y - wy + 2 * sz);
    ctx.fill();

    // 右翼
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 9 * sz, y - wy - 2, x + 14 * sz, y - wy);
    ctx.quadraticCurveTo(x + 10 * sz, y + 4 * sz, x, y + 2 * sz);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 14 * sz, y - wy);
    ctx.lineTo(x + 18 * sz, y - wy + 5 * sz);
    ctx.lineTo(x + 16 * sz, y - wy + 2 * sz);
    ctx.fill();
}

function drawBats() {
    bats.forEach(b => {
        b.angle += b.flapSpd;
        b.x     += b.dir * b.moveSpd;
        b.y     += Math.sin(b.angle * 0.28 + b.bobOff) * 0.5;
        if (b.x < -25) b.x = W + 25;
        if (b.x > W + 25) b.x = -25;
        drawBat(b.x, b.y, b.angle, b.size);
    });
}

// ═══════════════════════════════════════════
//  描画：枯れ木（左右フレーム）
// ═══════════════════════════════════════════
function drawBranch(x, y, angle, len, thick, depth) {
    if (depth <= 0 || len < 2) return;
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    ctx.beginPath();
    ctx.lineWidth = Math.max(0.5, thick);
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    const spread = 0.4 + depth * 0.08;
    drawBranch(ex, ey, angle - spread, len * 0.65, thick * 0.62, depth - 1);
    drawBranch(ex, ey, angle + spread * 0.75, len * 0.60, thick * 0.58, depth - 1);
    if (depth >= 3) drawBranch(ex, ey, angle - spread * 0.3, len * 0.50, thick * 0.5, depth - 2);
}

function drawDeadTree(rootX, rootY, trunkH, leanAngle, thick, depth) {
    ctx.strokeStyle = '#07080d';
    ctx.lineCap = 'round';
    // 幹
    const topX = rootX + Math.cos(leanAngle) * trunkH;
    const topY = rootY + Math.sin(leanAngle) * trunkH;
    ctx.beginPath();
    ctx.lineWidth = thick;
    ctx.moveTo(rootX, rootY);
    ctx.lineTo(topX, topY);
    ctx.stroke();
    // 枝
    drawBranch(topX, topY, leanAngle - 0.5, trunkH * 0.45, thick * 0.55, depth);
    drawBranch(topX, topY, leanAngle + 0.35, trunkH * 0.40, thick * 0.50, depth);
    drawBranch(topX * 0.3 + rootX * 0.7, topY * 0.3 + rootY * 0.7,
               leanAngle - 0.7, trunkH * 0.35, thick * 0.40, depth - 1);
}

function drawTrees() {
    // 左の大木（画面を縦断するほど太く高い）
    drawDeadTree(W * 0.04, H * 0.88, -H * 0.72, -Math.PI / 2 + 0.18, W * 0.022, 5);
    // 左の細い脇木
    drawDeadTree(W * (-0.01), H * 0.92, -H * 0.52, -Math.PI / 2 + 0.32, W * 0.012, 4);

    // 右の大木（少し細め）
    drawDeadTree(W * 0.96, H * 0.86, -H * 0.65, -Math.PI / 2 - 0.22, W * 0.018, 5);
    // 右の脇木
    drawDeadTree(W * 1.01, H * 0.90, -H * 0.48, -Math.PI / 2 - 0.35, W * 0.011, 4);
}

// ═══════════════════════════════════════════
//  描画：地面・丘
// ═══════════════════════════════════════════
function drawGround() {
    // 中央の丘
    ctx.fillStyle = '#090b12';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 2) ctx.lineTo(x, groundY(x));
    ctx.lineTo(W, H);
    ctx.fill();

    // 最前景（さらに暗い帯）
    ctx.fillStyle = '#060710';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 2) {
        const g = H * 0.935 + Math.sin(x * 0.04) * H * 0.008 + Math.sin(x * 0.12) * H * 0.004;
        ctx.lineTo(x, g);
    }
    ctx.lineTo(W, H);
    ctx.fill();

    // 草のシルエット（ギザギザ）
    ctx.fillStyle = '#08090f';
    for (let x = W * 0.05; x < W * 0.95; x += W / 28) {
        const gy = H * 0.926 + Math.sin(x * 0.09) * H * 0.005;
        ctx.beginPath();
        ctx.moveTo(x - 4, gy + 2);
        ctx.lineTo(x - 1, gy - 9);
        ctx.lineTo(x + 2, gy + 1);
        ctx.lineTo(x + 4, gy - 7);
        ctx.lineTo(x + 7, gy + 2);
        ctx.fill();
    }
}

// ═══════════════════════════════════════════
//  描画：墓地フェンス＋墓石（右寄り）
// ═══════════════════════════════════════════
function drawGraveyard() {
    const gx = W * 0.67;
    const gy = groundY(W * 0.72);
    const s  = H / 380;

    ctx.fillStyle = '#0b0d18';

    // フェンス柱
    for (let i = 0; i < 7; i++) {
        const fx = gx + i * 15 * s;
        ctx.fillRect(fx, gy - 28 * s, 3.5 * s, 28 * s);
        // とがった先端
        ctx.beginPath();
        ctx.moveTo(fx, gy - 28 * s);
        ctx.lineTo(fx + 1.75 * s, gy - 36 * s);
        ctx.lineTo(fx + 3.5 * s, gy - 28 * s);
        ctx.fill();
    }
    // 横棒
    ctx.fillRect(gx, gy - 20 * s, 96 * s, 2.5 * s);
    ctx.fillRect(gx, gy - 10 * s, 96 * s, 2.5 * s);

    // 墓石
    const tombs = [
        { ox: W * 0.70, s: 1.0 },
        { ox: W * 0.75, s: 0.75 },
        { ox: W * 0.73, s: 0.85 },
    ];
    tombs.forEach(t => {
        const tx  = t.ox;
        const ty  = groundY(tx);
        const tw  = 16 * s * t.s;
        const th  = 24 * s * t.s;
        ctx.fillStyle = '#0c0f1c';
        ctx.fillRect(tx - tw / 2, ty - th, tw, th);
        // 丸みを帯びた頭部
        ctx.beginPath();
        ctx.arc(tx, ty - th, tw / 2, Math.PI, 0);
        ctx.fill();
    });
}

// ═══════════════════════════════════════════
//  描画：カボチャ
// ═══════════════════════════════════════════
function drawPumpkin(px, py, sz) {
    const s = sz * (H / 380);

    // 胴体（3分割の楕円）
    const segs = [
        ['#6a3208', -9 * s, 12 * s, 14 * s],
        ['#7c3a0a', 0,      13 * s, 16 * s],
        ['#6a3208',  9 * s, 12 * s, 14 * s],
    ];
    segs.forEach(([c, dx, rw, rh]) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(px + dx, py, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // 顔（暗いくり抜き）
    ctx.fillStyle = '#2e1002';
    // 目（三角）
    [[px - 7 * s, py - 4 * s], [px + 4 * s, py - 4 * s]].forEach(([ex, ey]) => {
        ctx.beginPath();
        ctx.moveTo(ex - 3.5 * s, ey + 2 * s);
        ctx.lineTo(ex + 3.5 * s, ey + 2 * s);
        ctx.lineTo(ex, ey - 3 * s);
        ctx.fill();
    });
    // 口（ギザギザ）
    ctx.beginPath();
    ctx.moveTo(px - 9 * s, py + 5 * s);
    const teeth = [-9,-6,-3,0,3,6,9];
    teeth.forEach((tx, i) => {
        ctx.lineTo(px + tx * s, py + (i % 2 === 0 ? 5 : 9) * s);
    });
    ctx.lineTo(px + 9 * s, py + 5 * s);
    ctx.fill();

    // 茎
    ctx.fillStyle = '#2a4a05';
    ctx.fillRect(px - 2 * s, py - 15 * s, 4 * s, 6 * s);
}

// ═══════════════════════════════════════════
//  描画：羊シルエット
// ═══════════════════════════════════════════
function drawSheep(x, y, sz, legPhase) {
    const s = sz * (H / 280);
    ctx.fillStyle   = '#08090e';
    ctx.strokeStyle = '#08090e';

    // 体（ふわふわ）
    ctx.beginPath(); ctx.ellipse(x, y, 17 * s, 12 * s, 0, 0, Math.PI * 2); ctx.fill();
    // 毛のこぶ
    ctx.beginPath(); ctx.arc(x - 8  * s, y - 9  * s, 9  * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x      * 1, y - 12 * s, 10 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 8  * s, y - 9  * s, 8  * s, 0, Math.PI * 2); ctx.fill();

    // 頭
    ctx.beginPath(); ctx.ellipse(x + 19 * s, y - 5 * s, 7 * s, 6 * s, 0.25, 0, Math.PI * 2); ctx.fill();
    // 耳
    ctx.beginPath(); ctx.ellipse(x + 16 * s, y - 11 * s, 3.5 * s, 2.5 * s, -0.6, 0, Math.PI * 2); ctx.fill();

    // 脚（4本）
    ctx.lineWidth = 2.5 * s;
    ctx.lineCap   = 'round';
    const legs = [
        { bx: x - 9 * s, phase: legPhase },
        { bx: x - 2 * s, phase: legPhase + Math.PI },
        { bx: x + 5 * s, phase: legPhase + 0.3 },
        { bx: x + 12 * s, phase: legPhase + Math.PI + 0.3 },
    ];
    legs.forEach(l => {
        const lx = l.bx + Math.sin(l.phase) * 5 * s;
        const ly = y + 12 * s + Math.abs(Math.cos(l.phase)) * 2 * s;
        ctx.beginPath();
        ctx.moveTo(l.bx, y + 11 * s);
        ctx.lineTo(lx, ly + 9 * s);
        ctx.stroke();
    });
}

// ═══════════════════════════════════════════
//  描画：狼シルエット
// ═══════════════════════════════════════════
function drawWolf(x, y, sz, t) {
    const s = sz * (H / 280);
    ctx.fillStyle   = '#060810';
    ctx.strokeStyle = '#060810';

    // 体
    ctx.beginPath(); ctx.ellipse(x, y, 26 * s, 14 * s, -0.18, 0, Math.PI * 2); ctx.fill();
    // 首〜頭
    ctx.beginPath(); ctx.ellipse(x + 20 * s, y - 10 * s, 11 * s, 9 * s, -0.38, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 30 * s, y - 18 * s, 13 * s, 10 * s, -0.18, 0, Math.PI * 2); ctx.fill();
    // 口先
    ctx.beginPath();
    ctx.moveTo(x + 38 * s, y - 14 * s);
    ctx.lineTo(x + 52 * s, y -  9 * s);
    ctx.lineTo(x + 38 * s, y -  9 * s);
    ctx.fill();
    // 牙
    ctx.fillStyle = '#ddd8d0';
    ctx.beginPath(); ctx.moveTo(x + 42 * s, y - 9 * s); ctx.lineTo(x + 45 * s, y - 4 * s); ctx.lineTo(x + 48 * s, y - 9 * s); ctx.fill();
    ctx.fillStyle = '#060810';

    // 耳
    [[x + 23 * s, y - 26 * s, x + 28 * s, y - 40 * s, x + 33 * s, y - 26 * s],
     [x + 34 * s, y - 24 * s, x + 39 * s, y - 36 * s, x + 44 * s, y - 22 * s]
    ].forEach(([ax,ay,bx,by,cx2,cy]) => {
        ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.lineTo(cx2,cy); ctx.fill();
    });

    // 背中のとがった毛
    for (let i = 0; i < 6; i++) {
        const fx = x - 18 * s + i * 8 * s;
        const fy = y - 14 * s;
        ctx.beginPath(); ctx.moveTo(fx - 3*s, fy); ctx.lineTo(fx, fy - 13*s*(1 + i*0.12)); ctx.lineTo(fx + 3*s, fy); ctx.fill();
    }

    // 尻尾
    ctx.lineWidth = 4.5 * s;
    ctx.lineCap   = 'round';
    const tailSway = Math.sin(t * 0.04) * 8 * s;
    ctx.beginPath();
    ctx.moveTo(x - 22 * s, y - 7 * s);
    ctx.quadraticCurveTo(x - 38 * s, y - 28 * s + tailSway, x - 30 * s, y - 38 * s + tailSway);
    ctx.stroke();

    // 脚（走るアニメ）
    ctx.lineWidth = 4 * s;
    const la = t * 0.14;
    [
        { bx: x - 14*s, ph: la },
        { bx: x - 4*s,  ph: la + Math.PI },
        { bx: x + 10*s, ph: la + 0.4 },
        { bx: x + 18*s, ph: la + Math.PI + 0.4 },
    ].forEach(l => {
        const lx = l.bx + Math.sin(l.ph) * 12 * s;
        const ly = y + 13 * s + Math.abs(Math.cos(l.ph)) * 3 * s;
        ctx.beginPath(); ctx.moveTo(l.bx, y + 12*s); ctx.lineTo(lx, ly + 13*s); ctx.stroke();
    });
}

// ═══════════════════════════════════════════
//  メインループ
// ═══════════════════════════════════════════
let frame = 0;

function draw() {
    frame++;
    ctx.clearRect(0, 0, W, H);

    drawSky();
    drawStars(frame);
    drawMoon();
    drawClouds();       // 月の前を流れる雲
    drawCastle();
    drawBats();
    drawTrees();        // 木は地面より前・空より後ろ
    drawGround();
    drawGraveyard();

    // カボチャ
    drawPumpkin(W * 0.07, groundY(W * 0.07) + 2, 1.2);
    drawPumpkin(W * 0.88, groundY(W * 0.88) + 2, 1.0);
    drawPumpkin(W * 0.85, groundY(W * 0.85) + 6, 0.7);
    drawPumpkin(W * 0.10, groundY(W * 0.10) + 6, 0.8);

    // 羊（左から右へ逃げる → 左へ巻き戻し）
    sheep.forEach(sh => {
        sh.x -= sh.speed;
        sh.legPhase += 0.20;
        if (sh.x < -50) sh.x = W + 60;
        const gy = groundY(sh.x);
        drawSheep(sh.x, gy - 2, sh.scale, sh.legPhase);
    });

    // 狼（羊より少し右を追いかける）
    wolf.x -= wolf.speed;
    wolf.phase = frame;
    if (wolf.x < -80) wolf.x = W + 90;
    const wy = groundY(wolf.x);
    drawWolf(wolf.x, wy - 3, wolf.scale, frame);

    requestAnimationFrame(draw);
}

// 初期化してスタート
resize();
draw();
