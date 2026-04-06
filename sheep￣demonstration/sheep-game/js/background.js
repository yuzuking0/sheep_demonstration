// --- 背景キャンバスのアニメーション ---

const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

// 画面サイズにキャンバスを合わせる
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// 星のデータを作る
const stars = [];
for (let i = 0; i < 150; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1, // 1〜4pxのドット
        speed: Math.random() * 0.5 + 0.1, // キラキラするスピード
        alpha: Math.random() // 透明度
    });
}

// アニメーションループ
function drawBackground() {
    // 1. 背景を塗りつぶす
    ctx.fillStyle = '#112233';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 大きな月を描く
    ctx.fillStyle = '#E8E4B8'; // 月の色（淡い黄色）
    ctx.beginPath();
    // 画面中央より少し上、右寄りに配置
    ctx.arc(canvas.width * 0.7, canvas.height * 0.3, 100, 0, Math.PI * 2);
    ctx.fill();

    // 3. 星をキラキラさせる
    stars.forEach(star => {
        // 透明度をフワフワ変える
        star.alpha += star.speed * 0.05;
        const currentAlpha = Math.abs(Math.sin(star.alpha));

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        // 星を四角（ドット）で描く
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // 次のフレームを描画
    requestAnimationFrame(drawBackground);
}

// 背景アニメーション開始！
drawBackground();
