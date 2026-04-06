// --- ドット絵風のダークな夜の森（1枚目画像リスペクト版） ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

// ★ドットの粒の大きさ（4くらいが一番「レトロなドット絵」っぽくなります）
const PIXEL_SCALE = 4;

function resize() {
    canvas.width = Math.floor(window.innerWidth / PIXEL_SCALE);
    canvas.height = Math.floor(window.innerHeight / PIXEL_SCALE);
    ctx.imageSmoothingEnabled = false; // ぼかしを完全にオフ
}
window.addEventListener('resize', resize);
resize();

// --- データの準備 ---
// 1. 星のデータ
const stars = [];
for (let i = 0; i < 60; i++) {
    stars.push({
        x: Math.random() * 1000,
        y: Math.random() * (canvas.height * 0.7), // 星は上の方だけ
        speed: Math.random() * 0.05 + 0.02,
        alpha: Math.random()
    });
}

// 2. 枯れ木のデータ（今回は「四角」を繋げてドット絵っぽくする）
const treeBranches = [];
function makePixelTree(x, y, length, angle, width, depth) {
    if (depth === 0) return;
    treeBranches.push({ x, y, length, angle, width });

    const nextX = x - Math.sin(angle) * length;
    const nextY = y - Math.cos(angle) * length;
    // 角度をランダムにして、カクカクした不気味な枝にする
    makePixelTree(nextX, nextY, length * 0.7, angle - 0.4 - Math.random()*0.2, width * 0.6, depth - 1);
    makePixelTree(nextX, nextY, length * 0.7, angle + 0.4 + Math.random()*0.2, width * 0.6, depth - 1);
}
// 左右の木を生成
makePixelTree(canvas.width * 0.1, canvas.height, canvas.height * 0.3, 0.1, 10, 6);
makePixelTree(canvas.width * 0.9, canvas.height, canvas.height * 0.35, -0.1, 12, 6);

// 3. ドット絵の草をあらかじめ計算しておく
const grassHeights = [];
for(let x = 0; x < 2000; x++) {
    // ランダムに高い草と低い草を作る
    grassHeights.push(Math.random() > 0.8 ? Math.random() * 10 + 5 : Math.random() * 3);
}

// 4. 流れる霧のデータ
let fogOffset = 0;

// --- アニメーションループ ---
function drawBackground() {
    // 【1】空のグラデーション（1枚目画像の青緑〜霧がかったエメラルド）
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0d2332'); // 暗いティールブルー
    grad.addColorStop(0.6, '#244e58'); // 中間
    grad.addColorStop(1, '#628d7d'); // 下の方は明るい霧の色
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 【2】星（四角いドット）
    stars.forEach(star => {
        star.alpha += star.speed;
        let a = Math.abs(Math.sin(star.alpha));
        if (a > 0.5) { // チカチカ点滅させる
            ctx.fillStyle = '#a8cabc'; // 少し緑がかった星
            ctx.fillRect(Math.floor(star.x % canvas.width), Math.floor(star.y % canvas.height), 1, 1);
        }
    });

    // 【3】巨大な月（黄緑がかったクリーム色）
    const moonX = canvas.width * 0.65;
    const moonY = canvas.height * 0.3;
    const moonRadius = canvas.height * 0.25;

    // 月のぼんやりした光（ドット感を出すため、グラデーションではなく階段状の円で表現）
    ctx.fillStyle = 'rgba(235, 239, 193, 0.1)';
    ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius + 15, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius + 5, 0, Math.PI*2); ctx.fill();

    // 月の本体
    ctx.fillStyle = '#ebefc1';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // 【4】奥の霧（ゆっくり右から左へ流れる）
    fogOffset += 0.2;
    ctx.fillStyle = 'rgba(98, 141, 125, 0.4)'; // 霧の色
    for (let x = 0; x < canvas.width; x += 4) {
        let y = canvas.height * 0.75 + Math.sin((x + fogOffset) * 0.05) * 15;
        ctx.fillRect(x, y, 4, canvas.height - y);
    }

    // 【5】手前の地面と「ドットの草」（真っ黒に近い色）
    ctx.fillStyle = '#061014';
    let groundY = canvas.height * 0.85;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY); // 地面のベース

    // 草を1ドットずつ描画してカクカクにする
    for (let x = 0; x < canvas.width; x++) {
        let height = grassHeights[(Math.floor(x + fogOffset)) % grassHeights.length];
        ctx.fillRect(x, groundY - height, 1, height);
    }

    // 【6】左右の枯れ木（線を四角いドットとして描画してカクカクさせる）
    ctx.strokeStyle = '#061014';
    ctx.lineCap = 'square'; // ←ここがポイント！枝の先を四角くしてドット感アップ
    treeBranches.forEach(b => {
        ctx.lineWidth = Math.max(1, Math.floor(b.width)); // 太さも整数にしてドットっぽく
        ctx.beginPath();
        ctx.moveTo(Math.floor(b.x), Math.floor(b.y));
        ctx.lineTo(Math.floor(b.x - Math.sin(b.angle) * b.length), Math.floor(b.y - Math.cos(b.angle) * b.length));
        ctx.stroke();
    });

    requestAnimationFrame(drawBackground);
}

drawBackground();
