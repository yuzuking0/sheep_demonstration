// ============================================================
// main.js
// エントリーポイント - ここから全部始まる
//
// ゲームループ:
//   タイトル → 戦闘 → 報酬 → 戦闘 → ... → ボス → クリア
//                                    ↓（負け）
//                                  タイトル
// ============================================================

import { initState, resetForNextBattle } from './core/game-state.js';
import { registerCallbacks, startBattle, finishTurn } from './core/battle.js';
import { updateUI, showEnemyHitEffect, showPlayerHitEffect, showCardPlayEffect, renderRewardCards, resetHandState, updateStageDisplay } from './ui/ui.js';
import { showScreen }    from './ui/screens.js';
import { initEvents }    from './ui/events.js';
import { SFX }           from './systems/sound.js';
import { shuffle }       from './utils/helpers.js';
import { SCREENS, ANIM } from './data/constants.js';
import { CARDS }         from './data/cards.js';
import { getState }      from './core/game-state.js';
import { initShop, leaveShop, rerollShop, enterShop } from './systems/city.js';

// ════════════════════════
// コールバック登録
// ════════════════════════

registerCallbacks({
  onStateChange: () => updateUI(),

  onCardPlayed: ({ cardIndex }) => {
    showCardPlayEffect(cardIndex);
    SFX.cardPlay();
  },

  onEnemyDamaged: ({ damage }) => {
    showEnemyHitEffect(damage);
    SFX.enemyHit();
  },

  onEnemyAttack: ({ damage }) => {
    showPlayerHitEffect(damage);
    SFX.playerHit();
  },

  onGameOver: ({ result }) => {
    if (result === 'win') {
      SFX.win();
      setTimeout(() => onBattleWin(), ANIM.REWARD_DELAY);
    } else {
      SFX.lose();
      setTimeout(() => onBattleLose(), 600);
    }
  },
});

// ════════════════════════
// ステージ進行
// ════════════════════════

/** 戦闘に勝った時 */
function onBattleWin() {
  // ボスステージ含め常に報酬 → ショップへ
  showRewardScreen();
}

/** 戦闘に負けた時 */
function onBattleLose() {
  showScreen(SCREENS.TITLE);
}

/** 報酬選択が終わった時 → ボス後はショップ、通常は次戦闘へ */
function onRewardComplete(cardName) {
  const state = getState();
  const isBoss = state.enemy.key === 'BOSS';

  // ステージを進める
  state.stage += 1;

  if (isBoss) {
    // ボス戦後 → ショップへ
    initShop();
    showScreen(SCREENS.SHOP);
  } else {
    // 通常戦後 → 次の戦闘へ直行
    resetHandState();
    resetForNextBattle();
    updateStageDisplay();
    showScreen(SCREENS.BATTLE);
    startBattle();
    updateUI();
  }
}

// ════════════════════════
// 画面制御
// ════════════════════════

/** タイトル → 戦闘開始 */
function startGame() {
  resetHandState();
  initState();
  updateStageDisplay();   // ui.js からimport済み
  showScreen(SCREENS.BATTLE);
  startBattle();
  updateUI();
  initBackground();
}

/** 報酬画面を表示 */
function showRewardScreen() {
  const pool = shuffle([...CARDS]).slice(0, 3);
  renderRewardCards(pool);

  // カード選択イベント
  document.querySelectorAll('.reward-card').forEach((el, i) => {
    el.addEventListener('click', () => {
      const card = pool[i];

      // デッキに追加
      getState().deck.push({ ...card });

      // 選択アニメ
      document.querySelectorAll('.reward-card').forEach((c, j) => {
        c.classList.add(j === i ? 'selected' : 'dimmed');
      });

      setTimeout(() => onRewardComplete(card.name), 500);
    });
  });

  showScreen(SCREENS.REWARD);
}

/** クリア画面を表示 */
function showClearScreen() {
  const state = getState();
  const el = document.getElementById('clear-sheep');
  if (el) el.textContent = `残り羊：${state.sheep}体`;
  showScreen(SCREENS.CLEAR);
}

// ════════════════════════
// 背景生成
// ════════════════════════

function initBackground() {
  const stars = document.getElementById('bg-stars');
  if (stars && !stars.dataset.init) {
    for (let i = 0; i < 80; i++) {
      const el = document.createElement('div');
      el.className = 'bg-star';
      const sz = Math.random() * 1.8 + 0.4;
      el.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*55}%;--mo:${(Math.random()*.3+.1).toFixed(2)};--d:${(Math.random()*3+2).toFixed(1)}s;animation-delay:${(Math.random()*4).toFixed(1)}s`;
      stars.appendChild(el);
    }
    stars.dataset.init = '1';
  }
  const clouds = document.getElementById('bg-clouds');
  if (clouds && !clouds.dataset.init) {
    [{t:'8%',sc:1.2,d:100,dl:0},{t:'15%',sc:.8,d:75,dl:-25},{t:'5%',sc:1.5,d:120,dl:-50}].forEach(o => {
      const el = document.createElement('div');
      el.className = 'bg-cloud';
      el.style.cssText = `top:${o.t};transform:scale(${o.sc});animation-duration:${o.d}s;animation-delay:${o.dl}s`;
      el.innerHTML = `<div style="position:relative;width:80px;height:24px;background:#c8b090;border-radius:40px"><div style="position:absolute;width:32px;height:32px;background:#c8b090;border-radius:50%;top:-14px;left:8px"></div><div style="position:absolute;width:26px;height:26px;background:#c8b090;border-radius:50%;top:-11px;left:32px"></div></div>`;
      clouds.appendChild(el);
    });
    clouds.dataset.init = '1';
  }
}

// ════════════════════════
// グローバル公開（HTML onclick用）
// ════════════════════════

window.Game = {
  startGame,
  finishTurn,
  skipReward:  () => onRewardComplete(null),
  retry:       () => startGame(),
  leaveShop,
  rerollShop,
  enterShop,
};

// ════════════════════════
// 起動
// ════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  showScreen(SCREENS.TITLE);
});

