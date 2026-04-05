// ============================================================
// ui/ui.js
// 画面の表示を更新する
//
// ルール:
//   - ゲームロジックは書かない（表示だけ）
//   - getState() で状態を読んで表示に反映する
//   - DOM操作はここに集める
// ============================================================
import { getState, getNextEnemyAttack } from '../core/game-state.js';
import { toPercent, triggerAnimation } from '../utils/helpers.js';
import { attachCardEvents } from './events.js';

// 手札の状態管理（差分描画用）
let lastHandIds = '';
let focusedIdx = -1;
let enemyHpGhost = 100;

// ════════════════════════
// メイン更新
// ════════════════════════

/**
 * ゲーム状態をすべてのUIに反映する
 */
export function updateUI() {
    const s = getState();
    updateStats(s);
    
    

    updateHPBars(s);
    updateHand(s);
    updateEnemyVisuals(s); // ← これを追加！
}

// ════════════════════════
// ステータス表示
// ════════════════════════

function updateStats(s) {
    setText('sheep-val', s.sheep);
    setText('hp-nums', `${Math.max(0, s.sheep)} / ${s.maxSheep}`);
    setText('energy-val', `${s.energy}/${s.maxEnergy}`);
    setText('turn-val', s.turn);
    setText('enemy-hp-nums', `${s.enemy.hp} / ${s.enemy.maxHp}`);
    setText('intent-dmg', getNextEnemyAttack());
    setText('deck-count', s.deck.length);
    setText('discard-count', s.discard.length);
}

// ════════════════════════
// HPバー
// ════════════════════════

function updateHPBars(s) {
    // プレイヤーHP
  const hpPct = toPercent(s.sheep, s.maxSheep);
    setWidth('sheep-hp-fill', hpPct);
    setStyle('sheep-hp-fill', 'background',
                 s.sheep < 8  ? 'linear-gradient(90deg,#7b1a1a,#e74c3c)' :
                 s.sheep < 15 ? 'linear-gradient(90deg,#8a6010,#f0c060)' :
                                'linear-gradient(90deg,#2d5a1b,#7bc950)'
               );

  // 敵HP（ゴースト付き）
  const eHpPct = toPercent(s.enemy.hp, s.enemy.maxHp);
    setWidth('enemy-hp-fill', eHpPct);
    const ghost = document.getElementById('enemy-hp-ghost');
    if (ghost && eHpPct < enemyHpGhost) {
          ghost.style.width = enemyHpGhost + '%';
          setTimeout(() => {
                  enemyHpGhost = eHpPct;
                  ghost.style.width = eHpPct + '%';
          }, 250);
    } else {
          enemyHpGhost = eHpPct;
          if (ghost) ghost.style.width = eHpPct + '%';
    }
}

// ════════════════════════
// 手札描画
// ════════════════════════

function updateHand(s) {
    const handIds = s.hand.map(c => c.id).join(',') + '|' + s.energy;
    if (handIds !== lastHandIds) {
          lastHandIds = handIds;
          renderHand(s);
    } else {
          applyFocus();
    }
}

export function renderHand(s = getState()) {
    const area = document.getElementById('hand');
    if (!area) return;
    area.innerHTML = '';
    const cards = s.hand;
    const n = cards.length;
    if (n === 0) { focusedIdx = -1; return; }
    if (focusedIdx >= n) focusedIdx = n - 1;

  const areaW  = area.offsetWidth || window.innerWidth - 112;
    const cardW  = 90;
    const maxArc = 16;
    const step   = n > 1 ? Math.min((areaW - cardW) / (n - 1), cardW + 2) : 0;
    const totalW = n > 1 ? step * (n - 1) + cardW : cardW;
    const startX = Math.max(0, (areaW - totalW) / 2);

  cards.forEach((card, idx) => {
        const canPlay = !s.gameOver && s.energy >= card.cost;
        const el = document.createElement('div');
        el.className = `card ${card.type}` + (canPlay ? '' : ' disabled');

                    const t      = n > 1 ? (idx / (n - 1)) * 2 - 1 : 0;
        const angle  = t * maxArc * 0.65;
        const yLift  = -(1 - t * t) * 8;
        const baseT  = `rotate(${angle}deg) translateY(${yLift}px)`;

                    el.dataset.base  = baseT;
        el.dataset.angle = angle;
        el.style.left    = `${startX + step * idx}px`;
        el.style.bottom  = '0';
        el.style.transformOrigin = 'center 130%';
        el.style.transform = baseT;
        el.style.zIndex    = idx + 1;
        el.style.animationDelay = `${idx * 0.04}s`;
        el.classList.add('drawing');
        el.innerHTML = buildCardHTML(card);
        area.appendChild(el);

                    if (canPlay) {
                            attachCardEvents(el, idx, baseT, angle);
                    }
  });

  applyFocus();
}

export function buildCardHTML(card) {
    const typeLabel = { breed:'増殖', attack:'攻撃', draw:'ドロー', passive:'永続' }[card.type] || card.type;
    return `
        <div class="card-frame">
              <div class="card-header">
                      <div class="card-name">${card.name}</div>
                              <div class="card-cost">${card.cost}</div>
                                    </div>
                                          <div class="card-art"><span style="position:relative;z-index:2">${card.emoji}</span></div>
                                                <div class="card-divider"></div>
                                                      <div class="card-footer">
                                                              <div class="card-type">${typeLabel}</div>
                                                                      <div class="card-desc">${card.desc}</div>
                                                                            </div>
                                                                                </div>`;
}

// ════════════════════════
// フォーカス管理
// ════════════════════════

export function setFocus(idx) {
    focusedIdx = idx;
    applyFocus();
}

export function getFocusedIdx() {
    return focusedIdx;
}

export function applyFocus() {
    const els = document.getElementById('hand')?.querySelectorAll('.card');
    if (!els) return;
    els.forEach((el, i) => {
          if (i === focusedIdx) {
                  el.style.transform = 'rotate(0deg) translateY(-30px) scale(1.09)';
                  el.style.zIndex    = 30;
                  el.style.filter    = 'drop-shadow(0 22px 32px #000000cc) drop-shadow(0 0 14px #c9962a55)';
          } else {
                  el.style.transform = el.dataset.base || '';
                  el.style.zIndex    = i + 1;
                  el.style.filter    = focusedIdx >= 0 ? 'brightness(.48)' : '';
          }
    });
}

// ════════════════════════
// エフェクト
// ════════════════════════

/**
 * 敵ダメージエフェクト
 */
export function showEnemyHitEffect(damage) {
    // 狼をフラッシュ
  triggerAnimation(document.getElementById('wolf'), 'hit', 350);
    // 赤い光
  const flash = document.createElement('div');
    flash.className = 'enemy-flash';
    document.getElementById('enemy-area')?.appendChild(flash);
    setTimeout(() => flash.remove(), 350);
    // ダメージ数字
  spawnDamageNumber(damage, 'enemy');
}

/**
 * プレイヤー被弾エフェクト
 */
export function showPlayerHitEffect(damage) {
    const flash = document.createElement('div');
    flash.className = 'player-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
    spawnDamageNumber(damage, 'player');
    triggerAnimation(document.getElementById('sheep-val'), 'shake', 400);
}

/**
 * カード使用エフェクト（カードが飛ぶ）
 */
export function showCardPlayEffect(cardIndex) {
    const els = document.getElementById('hand')?.querySelectorAll('.card');
    const el  = els?.[cardIndex];
    if (!el) return;
    el.classList.add('playing');
    // プレイフラッシュ
  const flash = document.createElement('div');
    flash.className = 'play-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
}

function spawnDamageNumber(n, who) {
    const popup = document.createElement('div');
    popup.className = `damage-popup ${who}`;
    popup.textContent = `-${n}`;
    popup.style.cssText = `top:${20 + Math.random() * 20}%;left:${35 + Math.random() * 30}%;`;
    document.getElementById('enemy-area')?.appendChild(popup);
    setTimeout(() => popup.remove(), 900);
}

// ════════════════════════
// 報酬画面
// ════════════════════════

/**
 * 報酬カードを描画する
 */
export function renderRewardCards(cards) {
    const area = document.getElementById('reward-cards');
    if (!area) return;
    area.innerHTML = '';
    cards.forEach((card, idx) => {
          const wrap = document.createElement('div');
          wrap.className = 'reward-card-wrap';
          const el = document.createElement('div');
          el.className = `reward-card card ${card.type}`;
          el.innerHTML = buildCardHTML(card);
          el.dataset.idx = idx;
          wrap.appendChild(el);
          area.appendChild(wrap);
    });
}

// ════════════════════════
// ユーティリティ
// ════════════════════════

export function resetHandState() {
    lastHandIds = '';
    focusedIdx  = -1;
    enemyHpGhost = 100;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setWidth(id, pct) {
    const el = document.getElementById(id);
    if (el) el.style.width = pct + '%';
}

function setStyle(id, prop, value) {
    const el = document.getElementById(id);
    if (el) el.style[prop] = value;
}
// ════════════════════════
// ステージ表示
// ════════════════════════

export function updateStageDisplay() {
    const s = getState();
    const el = document.getElementById('stage-label');
    if (!el) return;
    if (s.map) {
        const floor  = s.map.currentFloor + 1;
        const total  = s.map.floors.length;
        const isBoss = floor === total;
        el.textContent = isBoss ? 'BOSS' : `FLOOR ${floor} / ${total}`;
        el.style.color  = isBoss ? 'var(--red3)' : 'var(--gold2)';
    }
}

// ════════════════════════
// ショップ羊数更新
// ════════════════════════

export function updateShopSheepCount() {
    const s = getState();
    setText('shop-sheep-val', s.sheep);
}

// ════════════════════════
// 敵の見た目切り替え
// ════════════════════════

function updateEnemyVisuals(s) {
    if (!s.enemy) return;
    const enemyKey = s.enemy.id.toUpperCase();
    const visualIds = {
        'SLIME':      'slime',
        'WOLF':       'wolf',
        'ELITE_WOLF': 'wolf',  // エリートは狼ビジュアルを流用
        'BOSS':       'boss'
    };

    // 一旦全部消す
    Object.values(visualIds).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 今の敵だけ表示する
    const currentId = visualIds[enemyKey];
    if (currentId) {
        const currentEl = document.getElementById(currentId);
        if (currentEl) currentEl.style.display = 'block';
    }

    // 名前とタイプバッジもついでに更新
    setText('enemy-name-display', s.enemy.name);
    const badge = document.getElementById('enemy-type-badge');
    if (badge) {
        badge.textContent = s.enemy.type || 'MONSTER';
        // クラス名を 'enemy-type-badge slime-type' のように付け替える
        badge.className = `enemy-type-badge ${enemyKey?.toLowerCase()}-type`;
    }
}