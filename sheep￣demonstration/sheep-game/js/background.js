// --- ドット絵風のダークな夜の森 背景プログラム ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

// ★ドットの粗さ（数字が大きいほどファミコンっぽく荒くなります。おすすめは 3 か 4）
const PIXEL_SCALE = 3;

function resize() {
    // 画面サイズをあえて小さく設定することで、ドット絵にする
    canvas.width = window.innerWidth / PIXEL_SCALE;
    canvas.height = window.innerHeight / PIXEL_SCALE;
    ctx.imageSmoothingEnabled = false; // ぼかしをオフ
}
window.addEventListener('resize', resize);
resize();

// --- データの準備 ---
// 1. 星のデータ
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * 1000,
        y: Math.random() * 500,
        speed: Math.random() * 0.05 + 0.01,
        alpha: Math.random()
    });
}

// 2. 流れる雲のデータ
const clouds = [];
for (let i = 0; i < 6; i++) {
    clouds.push({
        x: Math.random() * 1000,
        y: Math.random() * (canvas.height * 0.5), // 空の上半分に配置
        width: 80 + Math.random() * 100,
        height: 15 + Math.random() * 20,
        speed: 0.1 + Math.random() * 0.2
    });
}

// 3. 左右の枯れ木のデータを作る関数
const treeBranches = [];
function makeTree(x, y, length, angle, width, depth) {
    if (depth === 0) return;
    treeBranches.push({ x, y, length, angle, width });

    // 次の枝の計算
    const nextX = x - Math.sin(angle) * length;
    const nextY = y - Math.cos(angle) * length;
    // 枝分かれ
    makeTree(nextX, nextY, length * 0.7, angle - 0.5, width * 0.7, depth - 1);
    makeTree(nextX, nextY, length * 0.7, angle + 0.5, width * 0.7, depth - 1);
}
// 画面の左と右に木を生やす（画面外にはみ出すくらいの大きめサイズ）
makeTree(canvas.width * 0.05, canvas.height * 1.2, canvas.height * 0.4, 0.2, 12, 5); // 左の木
makeTree(canvas.width * 0.95, canvas.height * 1.2, canvas.height * 0.45, -0.2, 14, 5); // 右の木


// --- アニメーションループ（毎フレーム絵を描き直す） ---
function drawBackground() {
    // 【1】空のグラデーション（ダークな青緑）
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0a1c29'); // 空の上の暗い色
    grad.addColorStop(1, '#1b3e47'); // 地平線近くの青緑
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 【2】星をキラキラさせる
    stars.forEach(star => {
        star.alpha += star.speed;
        ctx.fillStyle = `rgba(200, 255, 255, ${Math.abs(Math.sin(star.alpha))})`;
        ctx.fillRect(star.x % canvas.width, star.y % canvas.height, 1, 1);
    });

    // 【3】巨大な月（少し黄色っぽい白）
    ctx.fillStyle = '#f7f4d2';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.6, canvas.height * 0.35, canvas.height * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 【4】不気味に流れる雲（暗い半透明）
    ctx.fillStyle = 'rgba(20, 40, 50, 0.5)';
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed; // 左へ流す
        if (cloud.x < -cloud.width * 2) cloud.x = canvas.width + cloud.width; // はみ出たら右に戻す

        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width, cloud.height, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // 【5】奥の地面（丘のシルエット）
    ctx.fillStyle = '#0f2026'; // 少しだけ明るい黒
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for(let x = 0; x <= canvas.width; x += 5) {
        // なだらかな丘
        ctx.lineTo(x, canvas.height * 0.8 - Math.sin(x * 0.02) * 15);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();

    // 【6】手前の地面と草（ほぼ真っ黒）
    ctx.fillStyle = '#03080a';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for(let x = 0; x <= canvas.width; x += 2) {
        // 複雑な波を混ぜて、ギザギザした草を表現
        let grass = Math.sin(x * 0.2) * 3 + Math.sin(x * 0.05) * 5;
        ctx.lineTo(x, canvas.height * 0.9 - Math.sin(x * 0.01) * 20 + grass);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();

    // 【7】左右の枯れ木のシルエット
    ctx.strokeStyle = '#03080a'; // 手前の地面と同じ真っ黒
    ctx.lineCap = 'round'; // 枝の先を丸くする
    treeBranches.forEach(b => {
        ctx.lineWidth = b.width;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - Math.sin(b.angle) * b.length, b.y - Math.cos(b.angle) * b.length);
        ctx.stroke();
    });

    // 次のフレームへ
    requestAnimationFrame(drawBackground);
}

// アニメーション開始！
drawBackground();
