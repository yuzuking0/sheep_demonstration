// ============================================================
// systems/city.js
// ショップ（街）処理
//
// 担当:
//   - カード生成（レアリティ別プール）
//   - 購入・リロール処理
//   - ショップ画面の描画・イベント
//   - 出発（次戦闘への遷移）
// ============================================================

import { CARDS }                        from '../data/cards.js';
import { SCREENS, REROLL_COST }         from '../data/constants.js';
import { getState, resetForNextBattle } from '../core/game-state.js';
import { startBattle }                  from '../core/battle.js';
import { shuffle }                      from '../utils/helpers.js';
import { showScreen }                   from '../ui/screens.js';
import {
  updateUI,
  resetHandState,
  buildCardHTML,
  updateStageDisplay,
  updateShopSheepCount,
} from '../ui/ui.js';

// ════════════════════════
// カードプール（レアリティ別）
// ════════════════════════

const COMMON   = CARDS.filter(c => c.rarity === 'common');
const UNCOMMON = CARDS.filter(c => c.rarity === 'uncommon');
const RARE     = CARDS.filter(c => c.rarity === 'rare');

function pick(pool, n) {
  return shuffle([...pool]).slice(0, n);
}

function generateShopCards() {
  return [
    ...pick(COMMON,   6),
    ...pick(UNCOMMON, 3),
    ...pick(RARE,     1),
  ];
}

// ════════════════════════
// 価格
// ════════════════════════

export function getPrice(card) {
  switch (card.rarity) {
    case 'common':   return 12;
    case 'uncommon': return 25;
    case 'rare':     return 50;
    default:         return 12;
  }
}

// ════════════════════════
// 初期化
// ════════════════════════

export function initShop() {
  const state = getState();
  state.shopCards = generateShopCards();
  renderShop();
}

// ════════════════════════
// 購入
// ════════════════════════

export function buyCard(cardId) {
  const state = getState();
  const idx   = state.shopCards.findIndex(c => c.id === cardId);
  if (idx === -1) return;

  const card  = state.shopCards[idx];
  const price = getPrice(card);
  if (state.sheep < price) return;

  state.sheep -= price;
  state.deck.push({ ...card });

  // 購入済みにする（配列からは消さずSOLD表示）
  const el = document.querySelector(`.shop-card-wrap[data-card-id="${cardId}"]`);
  if (el) {
    el.classList.add('sold');
    el.innerHTML += '<div class="sold-overlay">SOLD</div>';
  }

  state.shopCards.splice(idx, 1);
  updateShopSheepCount();
}

// ════════════════════════
// リロール
// ════════════════════════

export function rerollShop() {
  const state = getState();
  if (state.sheep < REROLL_COST) return;

  state.sheep    -= REROLL_COST;
  state.shopCards = generateShopCards();
  renderShop();
}

// ════════════════════════
// 出発（次戦闘へ）
// ════════════════════════

export function leaveShop() {
  const state = getState();

  // ボスステージクリア後（全ステージ制覇）→ クリア画面へ
  if (state.stage > state.maxStage) {
    const el = document.getElementById('clear-sheep');
    if (el) el.textContent = `残り羊：${state.sheep}体`;
    showScreen(SCREENS.CLEAR);
    return;
  }

  // 通常：次の戦闘へ
  resetHandState();
  resetForNextBattle();
  updateStageDisplay();
  showScreen(SCREENS.BATTLE);
  startBattle();
  updateUI();
}

// ════════════════════════
// 描画
// ════════════════════════

function renderShop() {
  const state = getState();
  const area  = document.getElementById('shop-cards');
  if (!area) return;

  area.innerHTML = '';

  state.shopCards.forEach(card => {
    const price    = getPrice(card);
    const rarityJp = { common: 'コモン', uncommon: 'アンコモン', rare: 'レア' }[card.rarity] || '';

    const wrap = document.createElement('div');
    wrap.className       = 'shop-card-wrap';
    wrap.dataset.cardId  = card.id;
    wrap.innerHTML = `
      <div class="card ${card.type} shop-card">
        ${buildCardHTML(card)}
      </div>
      <div class="shop-rarity ${card.rarity}">${rarityJp}</div>
      <div class="shop-price">🐑 ${price}</div>
    `;

    wrap.addEventListener('click', () => buyCard(card.id));
    area.appendChild(wrap);
  });

  updateShopSheepCount();
}
