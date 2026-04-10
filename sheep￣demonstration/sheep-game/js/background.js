// ═══════════════════════════════════════════════════
//  ピクセルアート風 ゴシックハロウィン背景
//  巨大オレンジ月 × 枯れ木 × ダークキャッスル
// ═══════════════════════════════════════════════════

const canvas = document.getElementById('bgCanvas');
const ctx    = canvas.getContext('2d');

// ピクセルスケール：大きいほどドット絵感が増す
const PIXEL_SCALE = 3;

let W, H;

function resize() {
    W = Math.floor(window.innerWidth  / PIXEL_SCALE);
    H = Math.floor(window.innerHeight / PIXEL_SCALE);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// ───────────────────────────────────────
//  ユーティリティ：ピクセル単位で矩形を塗る
// ───────────────────────────────────────
function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

// ───────────────────────────────────────
//  1. 空グラデーション（ネイビー→ティール）
// ───────────────────────────────────────
function drawSky() {
    // 上から下へ帯状にグラデーション
    const colors = [
        [0.00, '#0d1022'],
        [0.20, '#111830'],
        [0.45, '#152540'],
        [0.65, '#1a3a50'],
        [0.82, '#1e3a40'],
        [1.00, '#1a2e30'],
    ];
    for (let i = 0; i < colors.length - 1; i++) {
        const [t0, c0] = colors[i];
        const [t1, c1] = colors[i + 1];
        const y0 = Math.floor(t0 * H);
        const y1 = Math.floor(t1 * H);
        const g  = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, c0);
        g.addColorStop(1, c1);
        ctx.fillStyle = g;
        ctx.fillRect(0, y0, W, y1 - y0 + 1);
    }
}

// ───────────────────────────────────────
//  2. 星（控えめ・ピクセル点）
// ───────────────────────────────────────
const STARS = [];
function initStars() {
    for (let i = 0; i < 40; i++) {
        STARS.push({
            x: Math.random() * W,
            y: Math.random() * H * 0.5,
            phase: Math.random() * Math.PI * 2,
            spd: 0.01 + Math.random() * 0.02,
            sz: Math.random() < 0.8 ? 1 : 2,
        });
    }
}

function drawStars(t) {
    STARS.forEach(s => {
        const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.phase + t * s.spd));
        ctx.fillStyle = `rgba(200,220,240,${a.toFixed(2)})`;
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.sz, s.sz);
    });
}

// ───────────────────────────────────────
//  3. 大きなオレンジ月（左寄り）
// ───────────────────────────────────────
function drawMoon() {
    const mx = Math.floor(W * 0.30);
    const my = Math.floor(H * 0.42);
    const r  = Math.floor(Math.min(W, H) * 0.28);

    // 光輪（薄いオレンジ）
    const glow = ctx.createRadialGradient(mx, my, r * 0.85, mx, my, r * 2.0);
    glow.addColorStop(0,   'rgba(255,145,0,0.28)');
    glow.addColorStop(0.5, 'rgba(255,110,0,0.12)');
    glow.addColorStop(1,   'rgba(255, 80,0,0.00)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, r * 2.0, 0, Math.PI * 2);
    ctx.fill();

    // 月本体（ピクセル円）
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > r) continue;
            const nx = dx / r;
            const ny = dy / r;
            // 放射グラデ（中心明るく）
            const t = dist / r;
            const bright = 1 - t * 0.5;
            // 月の色味（オレンジ→深いオレンジ）
            const rr = Math.floor(255 * bright);
            const gg = Math.floor((130 - t * 60) * bright);
            const bb = Math.floor(10  * bright);
            // クレーター的なノイズ（手動）
            let noise = 0;
            noise += 0.25 * (0.5 + 0.5 * Math.sin(nx * 18 + ny * 14));
            noise += 0.15 * (0.5 + 0.5 * Math.sin(nx * 32 - ny * 26));
            noise += 0.10 * (0.5 + 0.5 * Math.sin(nx * 8  + ny * 55));
            const darkPatch = noise < 0.35 ? 0.72 : 1.0;
            ctx.fillStyle = `rgb(${Math.floor(rr*darkPatch)},${Math.floor(gg*darkPatch)},${Math.floor(bb*darkPatch)})`;
            ctx.fillRect(mx + dx, my + dy, 1, 1);
        }
    }
}

// ───────────────────────────────────────
//  4. ピクセル雲（横長の帯）
// ───────────────────────────────────────
const CLOUDS = [];
function initClouds() {
    const cloudDefs = [
        { y: 0.12, w: 0.28, h: 6, spd: 0.04, alpha: 0.55 },
        { y: 0.18, w: 0.20, h: 5, spd: 0.03, alpha: 0.40 },
        { y: 0.08, w: 0.35, h: 7, spd: 0.05, alpha: 0.35 },
        { y: 0.24, w: 0.18, h: 4, spd: 0.06, alpha: 0.30 },
        { y: 0.32, w: 0.25, h: 5, spd: 0.025,alpha: 0.25 },
    ];
    cloudDefs.forEach((d, i) => {
        CLOUDS.push({
            x: Math.random() * W,
            y: Math.floor(d.y * H),
            w: Math.floor(d.w * W),
            h: d.h,
            spd: d.spd,
            alpha: d.alpha,
        });
    });
}

function drawClouds() {
    CLOUDS.forEach(c => {
        c.x -= c.spd;
        if (c.x + c.w < 0) c.x = W + 10;
        ctx.fillStyle = `rgba(30,60,90,${c.alpha})`;
        // ギザギザ上辺でピクセルアート雲らしく
        for (let bx = 0; bx < c.w; bx += 4) {
            const bump = (Math.floor(bx / 12) % 2 === 0) ? 2 : 0;
            ctx.fillRect(Math.floor(c.x) + bx, c.y - bump, 4, c.h + bump);
        }
    });
}

// ───────────────────────────────────────
//  5. 背景レイヤー：遠景の木々（くすんだ青灰色）
// ───────────────────────────────────────
function drawBgTrees() {
    const color = '#1a2d3a';
    // 左奥の細い木群
    const trees = [
        { x: 0.02, h: 0.35, w: 2 },
        { x: 0.05, h: 0.28, w: 2 },
        { x: 0.08, h: 0.32, w: 3 },
        { x: 0.12, h: 0.25, w: 2 },
        { x: 0.55, h: 0.22, w: 2 },
        { x: 0.60, h: 0.30, w: 3 },
        { x: 0.65, h: 0.26, w: 2 },
        { x: 0.70, h: 0.20, w: 2 },
        { x: 0.75, h: 0.28, w: 2 },
        { x: 0.80, h: 0.32, w: 3 },
        { x: 0.85, h: 0.24, w: 2 },
        { x: 0.90, h: 0.36, w: 3 },
        { x: 0.95, h: 0.28, w: 2 },
    ];
    trees.forEach(t => {
        const tx = Math.floor(t.x * W);
        const ty = Math.floor(H * (1 - t.h * 0.6));
        // 幹
        px(tx, ty, t.w, H * t.h * 0.6, color);
        // 簡易枝（三角形っぽく積み上げ）
        for (let i = 0; i < 4; i++) {
            const bw = (4 - i) * 3 + t.w;
            const by = ty - i * 6 - 4;
            px(tx - bw / 2, by, bw, 5, color);
        }
    });
}

// ───────────────────────────────────────
//  6. 城（右寄り・ピクセルアート風）
// ───────────────────────────────────────
function drawCastle() {
    const BASE_X = Math.floor(W * 0.54);
    const BASE_Y = Math.floor(H * 0.88);
    const S      = Math.max(1, Math.floor(H / 120)); // スケール係数
    const COL    = '#0d1018';
    const WIN    = '#ffaa30';

    function rect(x, y, w, h) { px(BASE_X + x * S, BASE_Y - y * S, w * S, h * S, COL); }
    function window_(x, y, w, h) {
        px(BASE_X + x * S, BASE_Y - y * S, w * S, h * S, WIN);
        // 窓の光のぼんやり
        const gx = BASE_X + x * S + (w * S) / 2;
        const gy = BASE_Y - y * S + (h * S) / 2;
        const gr = ctx.createRadialGradient(gx, gy, 1, gx, gy, 12 * S);
        gr.addColorStop(0, 'rgba(255,170,50,0.35)');
        gr.addColorStop(1, 'rgba(255,170,50,0.00)');
        ctx.fillStyle = gr;
        ctx.fillRect(gx - 12 * S, gy - 12 * S, 24 * S, 24 * S);
    }
    function spire(x, baseY, w, h) {
        // 三角形の尖り屋根
        const tx = BASE_X + x * S;
        const ty = BASE_Y - baseY * S;
        const tw = w * S;
        const th = h * S;
        ctx.fillStyle = COL;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + tw / 2, ty - th);
        ctx.lineTo(tx + tw, ty);
        ctx.fill();
    }
    function flag(x, y) {
        // 旗竿
        px(BASE_X + x * S, BASE_Y - y * S, 1, 8 * S, COL);
        // 旗
        ctx.fillStyle = COL;
        ctx.beginPath();
        ctx.moveTo(BASE_X + x * S + 1, BASE_Y - y * S);
        ctx.lineTo(BASE_X + x * S + 7 * S, BASE_Y - y * S + 3 * S);
        ctx.lineTo(BASE_X + x * S + 1, BASE_Y - y * S + 5 * S);
        ctx.fill();
    }
    function battlement(x, y, w) {
        for (let i = 0; i < Math.floor(w / 4); i++) {
            if (i % 2 === 0) px(BASE_X + (x + i * 4) * S, BASE_Y - (y + 3) * S, 3 * S, 3 * S, COL);
        }
    }

    // ── 土台・城壁 ──
    rect(-10, 0, 140, 18);        // 地面への基礎
    rect(0,   18, 120, 35);       // メイン城壁

    // ── 左翼タワー ──
    rect(-8, 18, 22, 55);
    spire(-8, 73, 22, 28);
    battlement(-8, 53, 22);
    window_(-4, 65, 7, 10);
    window_(-4, 45, 7,  8);
    flag(-2, 101);

    // ── 中央メインタワー（最も高い） ──
    rect(42, 18, 36, 90);
    spire(42, 108, 36, 45);
    battlement(42, 108, 36);
    window_(48, 95, 10, 13);
    window_(54, 78, 8, 10);
    window_(48, 60, 10, 12);
    window_(54, 42, 8,  9);
    flag(57, 153);

    // ── 右タワー ──
    rect(98, 18, 24, 60);
    spire(98, 78, 24, 30);
    battlement(98, 78, 24);
    window_(102, 68, 8, 10);
    window_(102, 48, 8,  8);
    flag(107, 108);

    // ── 右の低い翼（城壁） ──
    rect(80, 18, 20, 30);
    battlement(80, 48, 20);
    window_(84, 38, 6, 8);

    // ── 橋廊下（左翼と中央を繋ぐ） ──
    rect(14, 42, 28, 8);
    rect(78, 42, 14, 8);  // 中央〜右

    // ── 入口アーチ ──
    rect(50, 18, 20, 16);
    // アーチの暗い穴
    ctx.fillStyle = '#060810';
    ctx.beginPath();
    ctx.arc(BASE_X + 60 * S, BASE_Y - 18 * S, 8 * S, Math.PI, 0);
    ctx.rect(BASE_X + 52 * S, BASE_Y - 18 * S, 16 * S, 16 * S);
    ctx.fill();
}

// ───────────────────────────────────────
//  7. 前景の枯れ木（再帰的な枝・ピクセル単位）
// ───────────────────────────────────────
function drawBranch(x, y, angle, len, thick, depth) {
    if (depth <= 0 || len < 1.5) return;
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;

    ctx.strokeStyle = '#080a10';
    ctx.lineWidth   = Math.max(1, thick);
    ctx.lineCap     = 'square'; // ピクセルアートらしく角ばった
    ctx.beginPath();
    ctx.moveTo(Math.round(x), Math.round(y));
    ctx.lineTo(Math.round(ex), Math.round(ey));
    ctx.stroke();

    const spread = 0.38 + depth * 0.07;
    drawBranch(ex, ey, angle - spread,         len * 0.66, thick * 0.60, depth - 1);
    drawBranch(ex, ey, angle + spread * 0.80,  len * 0.62, thick * 0.56, depth - 1);
    if (depth >= 3) {
        drawBranch(ex, ey, angle - spread * 0.28, len * 0.48, thick * 0.48, depth - 2);
    }
}

function drawDeadTree(rootX, rootY, trunkH, lean, thick, depth) {
    ctx.strokeStyle = '#080a10';
    ctx.lineCap     = 'square';

    const topX = rootX + Math.cos(lean) * trunkH;
    const topY = rootY + Math.sin(lean) * trunkH;

    // 幹
    ctx.lineWidth = thick;
    ctx.beginPath();
    ctx.moveTo(Math.round(rootX), Math.round(rootY));
    ctx.lineTo(Math.round(topX), Math.round(topY));
    ctx.stroke();

    // 上方の主枝
    drawBranch(topX, topY, lean - 0.48, trunkH * 0.44, thick * 0.55, depth);
    drawBranch(topX, topY, lean + 0.36, trunkH * 0.40, thick * 0.50, depth);

    // 中腹の横枝
    const midX = rootX + Math.cos(lean) * trunkH * 0.55;
    const midY = rootY + Math.sin(lean) * trunkH * 0.55;
    drawBranch(midX, midY, lean - 0.80, trunkH * 0.35, thick * 0.38, depth - 1);
    drawBranch(midX, midY, lean + 0.65, trunkH * 0.30, thick * 0.35, depth - 1);
}

function drawTrees() {
    // ── 左側の大木群 ──
    // 一番大きい木（月に重なる）
    drawDeadTree(W * 0.14, H * 0.92, H * 0.70, -Math.PI / 2 + 0.06, W * 0.025, 6);
    // 左端の細い木
    drawDeadTree(W * 0.02, H * 0.95, H * 0.55, -Math.PI / 2 + 0.22, W * 0.014, 5);
    // 左の中間木
    drawDeadTree(W * 0.07, H * 0.94, H * 0.45, -Math.PI / 2 + 0.30, W * 0.010, 4);

    // ── 右側の大木群（城の両脇） ──
    drawDeadTree(W * 0.90, H * 0.90, H * 0.60, -Math.PI / 2 - 0.18, W * 0.020, 5);
    drawDeadTree(W * 0.99, H * 0.93, H * 0.50, -Math.PI / 2 - 0.30, W * 0.012, 4);
}

// ───────────────────────────────────────
//  8. 地面・草（下端）
// ───────────────────────────────────────
function drawGround() {
    // 地面のシルエット（なだらか）
    ctx.fillStyle = '#080a10';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 2) {
        const g = H * 0.88
            + Math.sin(x * 0.035) * H * 0.018
            + Math.sin(x * 0.012) * H * 0.022;
        ctx.lineTo(x, g);
    }
    ctx.lineTo(W, H);
    ctx.fill();

    // 草のギザギザ
    ctx.fillStyle = '#080a10';
    for (let x = 0; x < W; x += Math.floor(W / 35)) {
        const gy = H * 0.876 + Math.sin(x * 0.09) * H * 0.012;
        ctx.fillRect(x,     gy - 8, 2, 9);
        ctx.fillRect(x + 3, gy - 6, 2, 7);
        ctx.fillRect(x + 6, gy - 9, 2, 10);
        ctx.fillRect(x + 9, gy - 5, 2, 6);
    }
}

// ───────────────────────────────────────
//  9. コウモリ（1〜2羽・シンプル）
// ───────────────────────────────────────
const BATS = [
    { x: 0.48, y: 0.42, spd: 0.25, dir: -1, angle: 0, flapSpd: 0.16, sz: 1.0 },
    { x: 0.36, y: 0.52, spd: 0.18, dir:  1, angle: 1, flapSpd: 0.20, sz: 0.65 },
];

function drawBat(bx, by, flap, sz) {
    const wy = Math.sin(flap) * 5 * sz;
    ctx.fillStyle = '#060810';
    ctx.lineCap = 'square';

    // 胴体
    ctx.fillRect(Math.round(bx - 2 * sz), Math.round(by - 2 * sz), Math.round(4 * sz), Math.round(4 * sz));

    // 翼（ピクセルアート風にシンプルな多角形）
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 10 * sz, by - wy);
    ctx.lineTo(bx -  7 * sz, by + 3 * sz);
    ctx.lineTo(bx, by + 1 * sz);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 10 * sz, by - wy);
    ctx.lineTo(bx +  7 * sz, by + 3 * sz);
    ctx.lineTo(bx, by + 1 * sz);
    ctx.fill();
}

function drawBats(t) {
    BATS.forEach(b => {
        b.angle += b.flapSpd;
        b.x += b.dir * b.spd / W;
        if (b.x > 1.05) b.x = -0.05;
        if (b.x < -0.05) b.x = 1.05;
        const bx = b.x * W;
        const by = b.y * H + Math.sin(b.angle * 0.3) * H * 0.02;
        drawBat(bx, by, b.angle, b.sz * Math.max(1, H / 150));
    });
}

// ───────────────────────────────────────
//  メインループ
// ───────────────────────────────────────
let frame = 0;

// 初期化（サイズ依存のデータ）
initStars();
initClouds();

function draw() {
    frame++;
    ctx.clearRect(0, 0, W, H);

    // 描画順（奥→手前）
    drawSky();           // 1. 空
    drawStars(frame);    // 2. 星
    drawMoon();          // 3. 月（最背面オブジェクト）
    drawClouds();        // 4. 雲（月より前）
    drawBgTrees();       // 5. 遠景の木々（くすんだ青灰）
    drawCastle();        // 6. 城
    drawBats(frame);     // 7. コウモリ
    drawTrees();         // 8. 前景の枯れ木（月に重なる）
    drawGround();        // 9. 地面・草

    requestAnimationFrame(draw);
}

draw();
