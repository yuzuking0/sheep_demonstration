// ============================================================
// systems/sound.js
// 効果音・BGMの管理
//
// 現状: Web Audio API でシンプルな音を生成する
// 将来: 音声ファイル（.mp3/.ogg）に差し替えやすい構造
// ============================================================

// AudioContextはユーザー操作後に初期化する必要がある
let audioCtx = null;
let muted = false;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * ミュート切り替え
 */
export function toggleMute() {
  muted = !muted;
  return muted;
}

/**
 * シンプルなビープ音を鳴らす
 * @param {number} freq   - 周波数 (Hz)
 * @param {number} dur    - 長さ (秒)
 * @param {string} type   - 波形 ('sine' | 'square' | 'triangle' | 'sawtooth')
 * @param {number} volume - 音量 0〜1
 */
function beep(freq, dur = 0.1, type = 'sine', volume = 0.3) {
  if (muted) return;
  try {
    const ctx  = getCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (e) {
    // 音が鳴らなくてもゲームは続行
  }
}

// ════════════════════════
// ゲーム用効果音
// ════════════════════════

export const SFX = {
  /** カードを使った時 */
  cardPlay() {
    beep(440, 0.08, 'sine', 0.2);
    setTimeout(() => beep(550, 0.06, 'sine', 0.15), 60);
  },

  /** 敵にダメージを与えた時 */
  enemyHit() {
    beep(200, 0.12, 'square', 0.25);
    setTimeout(() => beep(150, 0.1, 'square', 0.2), 80);
  },

  /** プレイヤーが攻撃された時 */
  playerHit() {
    beep(180, 0.15, 'sawtooth', 0.3);
  },

  /** カードをドローした時 */
  draw() {
    beep(660, 0.06, 'sine', 0.15);
  },

  /** ターン終了 */
  endTurn() {
    beep(330, 0.08, 'triangle', 0.2);
    setTimeout(() => beep(440, 0.08, 'triangle', 0.15), 100);
  },

  /** 勝利 */
  win() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => beep(f, 0.2, 'sine', 0.3), i * 100);
    });
  },

  /** 敗北 */
  lose() {
    [400, 300, 200].forEach((f, i) => {
      setTimeout(() => beep(f, 0.3, 'sawtooth', 0.3), i * 150);
    });
  },
};
