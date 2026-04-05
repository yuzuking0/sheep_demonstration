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

import { CARDS }          from '../data/cards.js';
import { REROLL_COST }    from '../data/constants.js';
import { getState }       from '../core/game-state.js';
import { shuffle }        from '../utils/helpers.js';
import { buildCardHTML, updateShopSheepCount } from '../ui/ui.js';

// ショップ退出時のコールバック（main.js が登録）
let leaveCallback = null;
export function setLeaveShopCallback(cb) { leaveCallback = cb; }

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
// 商人のセリフ
// ════════════════════════

const MERCHANT_QUOTES = [
  'いらっしゃいませ！今日も最高の品を揃えましたぞ！',
  'フォッフォッフォ…君の羊、全部置いていっても構わんぞ？',
  '真珠より輝く逸品ぞろい！さあさあ、見ていってくれ！',
  '羊が多ければ多いほど、良い買い物ができるというもの！',
  '本日限りの特別価格だ！見逃すなよ！',
  'ほほほ…良い目をしているな。わかる人間にはわかるのだよ。',
  'カードは生き物じゃ。育てれば必ず報われる…はずじゃ！',
];

// ════════════════════════
// 初期化（商人イントロ表示）
// ════════════════════════

export function initShop() {
  const state = getState();
  state.shopCards = generateShopCards();

  // ランダムセリフ
  const q   = MERCHANT_QUOTES[Math.floor(Math.random() * MERCHANT_QUOTES.length)];
  const qEl = document.getElementById('merchant-quote');
  if (qEl) qEl.textContent = q;

  // イントロ表示 / カードグリッド非表示
  const intro = document.getElementById('shop-intro');
  const main  = document.getElementById('shop-main');
  if (intro) { intro.style.display = 'flex'; intro.classList.remove('exit'); }
  if (main)  { main.style.display  = 'none'; main.classList.remove('enter'); }
}

// ════════════════════════
// イントロ → カードグリッドへ遷移
// ════════════════════════

export function enterShop() {
  const intro = document.getElementById('shop-intro');
  if (intro) intro.classList.add('exit');

  setTimeout(() => {
    if (intro) intro.style.display = 'none';

    renderShop();

    const main = document.getElementById('shop-main');
    if (main) {
      main.style.display = 'flex';
      requestAnimationFrame(() => main.classList.add('enter'));
    }
  }, 450);
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
// 出発（マップへ戻る）
// ════════════════════════

export function leaveShop() {
  if (leaveCallback) leaveCallback();
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
