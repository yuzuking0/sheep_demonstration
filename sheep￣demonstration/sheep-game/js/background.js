// --- ドット絵風・ゴシックハロウィン背景（2枚目画像リスペクト版） ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

// ドットの粗さ（レトロ感を出す）
const PIXEL_SCALE = 3;

function resize() {
    canvas.width = Math.floor(window.innerWidth / PIXEL_SCALE);
    canvas.height = Math.floor(window.innerHeight / PIXEL_SCALE);
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// --- データの準備 ---

// 1. 星
const stars = [];
for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * 1000, y: Math.random() * (canvas.height * 0.5),
        speed: Math.random() * 0.05 + 0.02, alpha: Math.random()
    });
}

// 2. モクモク雲（2枚目画像のような雲）
const clouds = [];
for (let i = 0; i < 5; i++) {
    clouds.push({
        x: Math.random() * canvas.width * 2,
        y: canvas.height * 0.2 + Math.random() * canvas.height * 0.3,
        speed: 0.1 + Math.random() * 0.15,
        scale: 0.5 + Math.random() * 0.8
    });
}

// 3. 飛ぶコウモリ
const bats = [];
for (let i = 0; i < 4; i++) {
    bats.push({
        x: canvas.width * 0.3 + Math.random() * canvas.width * 0.4,
        y: canvas.height * 0.2 + Math.random() * canvas.height * 0.2,
        flapSpeed: 0.1 + Math.random() * 0.1, // 羽ばたくスピード
        moveSpeed: 0.2 + Math.random() * 0.3, // 飛ぶスピード
        angle: 0
    });
}

// --- 描画関数 ---

// お城を描く関数
function drawCastle(offsetX, offsetY) {
    ctx.fillStyle = '#141824'; // 背景のシルエット色（暗いネイビー）

    // 崖
    ctx.beginPath();
    ctx.moveTo(offsetX - 20, canvas.height);
    ctx.lineTo(offsetX, offsetY + 50);
    ctx.lineTo(offsetX + 100, offsetY + 50);
    ctx.lineTo(offsetX + 120, canvas.height);
    ctx.fill();

    // お城の塔
    ctx.fillRect(offsetX + 10, offsetY + 20, 15, 30); // 左の塔
    ctx.fillRect(offsetX + 40, offsetY, 20, 50);      // 中央の高い塔
    ctx.fillRect(offsetX + 70, offsetY + 15, 15, 35); // 右の塔

    // 屋根（三角）
    ctx.beginPath(); ctx.moveTo(offsetX + 10, offsetY + 20); ctx.lineTo(offsetX + 17, offsetY + 5); ctx.lineTo(offsetX + 25, offsetY + 20); ctx.fill();
    ctx.beginPath(); ctx.moveTo(offsetX + 40, offsetY); ctx.lineTo(offsetX + 50, offsetY - 20); ctx.lineTo(offsetX + 60, offsetY); ctx.fill();
    ctx.beginPath(); ctx.moveTo(offsetX + 70, offsetY + 15); ctx.lineTo(offsetX + 77, offsetY); ctx.lineTo(offsetX + 85, offsetY + 15); ctx.fill();

    // 窓（月の光が透けてるイメージ）
    ctx.fillStyle = '#ffaa44';
    ctx.fillRect(offsetX + 47, offsetY + 10, 6, 10);
}

// コウモリを描く関数
function drawBat(x, y, flap) {
    ctx.fillStyle = '#0a0c11';
    let wingY = Math.sin(flap) * 8; // 羽ばたきの上下
    ctx.beginPath();
    ctx.moveTo(x, y); // 体の中心
    ctx.lineTo(x - 12, y - wingY); // 左の羽の先
    ctx.lineTo(x - 5, y + 3); // 左の羽の下
    ctx.lineTo(x, y + 5); // しっぽ
    ctx.lineTo(x + 5, y + 3); // 右の羽の下
    ctx.lineTo(x + 12, y - wingY); // 右の羽の先
    ctx.fill();
}


// --- アニメーションループ ---
let frameCount = 0;

function drawBackground() {
    frameCount++;

    // 【1】空のグラデーション（ネイビーから下に向かって少し暖かみのある色へ）
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0f172a'); // 暗いネイビー
    grad.addColorStop(0.5, '#1e293b'); // 少し明るいネイビー
    grad.addColorStop(1, '#47403a'); // 地面付近は少し土っぽい色
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 【2】星（控えめに）
    ctx.fillStyle = '#cbd5e1';
    stars.forEach(star => {
        star.alpha += star.speed;
        if (Math.abs(Math.sin(star.alpha)) > 0.7) {
            ctx.fillRect(Math.floor(star.x % canvas.width), Math.floor(star.y % canvas.height), 1, 1);
        }
    });

    // 【3】巨大なオレンジの月
    const moonX = canvas.width * 0.4;
    const moonY = canvas.height * 0.35;
    const moonRadius = canvas.height * 0.22;

    // 月の光のぼんやり
    ctx.fillStyle = 'rgba(251, 146, 60, 0.15)';
    ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius + 20, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius + 10, 0, Math.PI*2); ctx.fill();

    // 月本体（ハロウィンっぽいオレンジ）
    ctx.fillStyle = '#fb923c';
    ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fill();
    // 月の模様（クレーターっぽく）
    ctx.fillStyle = 'rgba(194, 65, 12, 0.3)';
    ctx.beginPath(); ctx.arc(moonX + 15, moonY - 10, moonRadius * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX - 20, moonY + 20, moonRadius * 0.4, 0, Math.PI * 2); ctx.fill();

    // 【4】モクモクした雲（月の手前を流れる）
    ctx.fillStyle = '#64748b'; // 青みがかったグレー
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x < -100) cloud.x = canvas.width + 100;

        // 円を3つ組み合わせてモクモクさせる
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 20 * cloud.scale, 0, Math.PI*2);
        ctx.arc(cloud.x + 25 * cloud.scale, cloud.y - 10 * cloud.scale, 25 * cloud.scale, 0, Math.PI*2);
        ctx.arc(cloud.x + 50 * cloud.scale, cloud.y, 15 * cloud.scale, 0, Math.PI*2);
        ctx.fill();
    });

    // 【5】右奥のお城と崖
    drawCastle(canvas.width * 0.75, canvas.height * 0.45);

    // 【6】コウモリ
    bats.forEach(bat => {
        bat.angle += bat.flapSpeed;
        bat.x -= bat.moveSpeed; // 左へ飛ぶ
        bat.y += Math.sin(bat.angle * 0.5) * 0.5; // 少し上下にフワフワ
        if (bat.x < -20) bat.x = canvas.width + 20; // はみ出たら戻る
        drawBat(bat.x, bat.y, bat.angle);
    });

    // 【7】手前の地面（ゴツゴツした岩場っぽく）
    ctx.fillStyle = '#0a0c11';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for(let x = 0; x <= canvas.width; x += 5) {
        // 波を組み合わせてゴツゴツ感を出す
        let ground = Math.sin(x * 0.05) * 10 + Math.sin(x * 0.01) * 20;
        ctx.lineTo(x, canvas.height * 0.85 + ground);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();

    // 手前の太い木のシルエット（左側）
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(30, canvas.height);
    ctx.lineTo(20, canvas.height * 0.5);
    ctx.lineTo(40, canvas.height * 0.2); // 枝
    ctx.lineTo(10, canvas.height * 0.4);
    ctx.lineTo(0, canvas.height * 0.1);
    ctx.fill();

    requestAnimationFrame(drawBackground);
}

drawBackground();
