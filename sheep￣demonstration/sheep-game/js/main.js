// ============================================================
// main.js
// エントリーポイント - ここから全部始まる
//
// ゲームループ:
//   タイトル → マップ → [ノード選択]
//                ↑            ↓
//                └── 完了 ← 戦闘/ショップ/休憩/エリート/ボス
//                                  ↓（ボス撃破）
//                               クリア画面
//                  ↓（負け）
//               タイトル
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
import { initShop, leaveShop, rerollShop, enterShop, setLeaveShopCallback } from './systems/city.js';
import { generateMap, completeMapNode, getNodeById } from './systems/map.js';
import { registerMapCallback, renderMap }            from './ui/map-ui.js';

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

// マップ → ノード選択時
registerMapCallback(onMapNodeSelected);

// ショップ退出 → マップへ戻る
setLeaveShopCallback(() => {
  completeMapNode();
  showScreen(SCREENS.MAP);
  renderMap();
  updateMapSheep();
});

// ════════════════════════
// マップ → ノード処理
// ════════════════════════

/**
 * マップでノードを選んだ時に呼ばれる
 */
function onMapNodeSelected(node) {
  switch (node.type) {
    case 'battle':
    case 'elite':
    case 'boss':
      resetHandState();
      resetForNextBattle(node.enemyKey);
      updateStageDisplay();
      showScreen(SCREENS.BATTLE);
      startBattle();
      updateUI();
      break;

    case 'shop':
      initShop();
      showScreen(SCREENS.SHOP);
      break;

    case 'rest':
      enterRest();
      break;
  }
}

// ════════════════════════
// 戦闘結果
// ════════════════════════

function onBattleWin() {
  showRewardScreen();
}

function onBattleLose() {
  showScreen(SCREENS.TITLE);
}

// ════════════════════════
// 報酬画面
// ════════════════════════

function showRewardScreen() {
  const pool = shuffle([...CARDS]).slice(0, 3);
  renderRewardCards(pool);

  document.querySelectorAll('.reward-card').forEach((el, i) => {
    el.addEventListener('click', () => {
      const card = pool[i];
      getState().deck.push({ ...card });

      document.querySelectorAll('.reward-card').forEach((c, j) => {
        c.classList.add(j === i ? 'selected' : 'dimmed');
      });

      setTimeout(() => onRewardComplete(), 500);
    });
  });

  showScreen(SCREENS.REWARD);
}

function onRewardComplete() {
  const state = getState();
  const nodeId = state.map.chosenPath[state.map.chosenPath.length - 1];
  const node   = getNodeById(nodeId);

  completeMapNode();

  if (node.type === 'boss') {
    showClearScreen();
  } else {
    showScreen(SCREENS.MAP);
    renderMap();
    updateMapSheep();
  }
}

// ════════════════════════
// 休憩処理
// ════════════════════════

const REST_HEAL = 5;

function enterRest() {
  const state  = getState();
  const actual = Math.min(REST_HEAL, state.maxSheep - state.sheep);
  state.sheep  = Math.min(state.sheep + REST_HEAL, state.maxSheep);

  const el = document.getElementById('rest-heal-text');
  if (el) {
    el.textContent = actual > 0
      ? `羊が ${actual} 体 戻ってきた！`
      : '羊はすでに満員だ…';
  }
  showScreen(SCREENS.REST);
}

function leaveRest() {
  completeMapNode();
  showScreen(SCREENS.MAP);
  renderMap();
  updateMapSheep();
}

// ════════════════════════
// クリア画面
// ════════════════════════

function showClearScreen() {
  const state = getState();
  const el = document.getElementById('clear-sheep');
  if (el) el.textContent = `残り羊：${state.sheep}体`;
  showScreen(SCREENS.CLEAR);
}

// ════════════════════════
// マップ画面
// ════════════════════════

function updateMapSheep() {
  const state = getState();
  const el = document.getElementById('map-sheep-display');
  if (el) el.textContent = `🐑 ${state.sheep}`;
}

// ════════════════════════
// ゲーム開始
// ════════════════════════

function startGame() {
  resetHandState();
  initState();
  getState().map = generateMap();
  updateMapSheep();
  showScreen(SCREENS.MAP);
  renderMap();
  initBackground();
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
  skipReward:  () => onRewardComplete(),
  retry:       () => startGame(),
  leaveShop,
  rerollShop,
  enterShop,
  leaveRest,
};

// ════════════════════════
// 起動
// ════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  showScreen(SCREENS.TITLE);
});
