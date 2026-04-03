// ============================================================
// ui/events.js
// イベント登録を管理する
// ============================================================

import { getState } from '../core/game-state.js';
import { useCard, finishTurn } from '../core/battle.js';
import { setFocus, getFocusedIdx, applyFocus } from './ui.js';

// ════════════════════════
// 初期化
// ════════════════════════

/**
 * 全イベントを登録する（main.jsから呼ぶ）
 */
export function initEvents() {
  // ターン終了ボタン
  document.getElementById('btn-end-turn')?.addEventListener('click', () => {
    finishTurn();
  });

  // 手札エリアのスワイプ
  const handArea = document.getElementById('hand');
  if (handArea) setupHandSwipe(handArea);
}

// ════════════════════════
// カードのイベント登録
// （renderHand後に各カード要素に対して呼ぶ）
// ════════════════════════

/**
 * 手札カードにイベントを登録する
 */
export function attachCardEvents(cardElement, cardIndex, baseTransform, baseAngle) {
  const state = getState();
  const card  = state.hand[cardIndex];
  if (!card) return;

  // PC: ホバーでフォーカス
  cardElement.addEventListener('mouseenter', () => setFocus(cardIndex));
  cardElement.addEventListener('mouseleave', () => setFocus(-1));

  // クリック
  cardElement.addEventListener('click', () => {
    if (getFocusedIdx() === cardIndex) useCard(cardIndex);
    else setFocus(cardIndex);
  });

  // ダブルタップで即発動
  let lastTap = 0;
  cardElement.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTap < 280) {
      e.preventDefault();
      e.stopPropagation();
      useCard(cardIndex);
    } else {
      setFocus(cardIndex);
    }
    lastTap = now;
  }, { passive: false });

  // 上スワイプで発動
  setupCardSwipe(cardElement, cardIndex, baseTransform, baseAngle);
}

// ════════════════════════
// カード個別スワイプ
// ════════════════════════

function setupCardSwipe(el, idx, baseTransform, baseAngle) {
  let startY = null, startX = null, dragging = false;
  const THRESHOLD = 65;
  let winController = null;

  function onStart(e) {
    if (getState().gameOver) return;
    const pt = e.touches ? e.touches[0] : e;
    startY = pt.clientY; startX = pt.clientX;
    dragging = true;
    document.getElementById('swipe-zone')?.classList.add('active');

    // ドラッグ中だけ window にリスナーを追加し、終了時に自動削除
    winController = new AbortController();
    window.addEventListener('mousemove', onMove, { signal: winController.signal });
    window.addEventListener('mouseup',   onEnd,  { signal: winController.signal });

    e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    const pt = e.touches ? e.touches[0] : e;
    const dy = pt.clientY - startY;
    const dx = pt.clientX - startX;
    if (dy < 0) {
      const p   = Math.min(Math.abs(dy) / THRESHOLD, 1);
      const hex = Math.floor(p * 150).toString(16).padStart(2, '0');
      el.style.transform = `rotate(${baseAngle * (1 - p)}deg) translate(${dx * .2}px, ${dy}px) scale(${1 + p * .07})`;
      el.style.filter    = `drop-shadow(0 ${8 + Math.abs(dy) * .22}px 18px #c9962a${hex})`;
    }
    e.preventDefault();
  }

  function onEnd(e) {
    if (!dragging) return;
    dragging = false;
    winController?.abort();
    winController = null;
    document.getElementById('swipe-zone')?.classList.remove('active');
    const pt = e.changedTouches ? e.changedTouches[0] : e;
    const dy = pt.clientY - startY;
    el.style.filter = '';
    el.style.zIndex = idx + 1;

    if (dy < -THRESHOLD) {
      useCard(idx);
    } else {
      el.style.transform = baseTransform;
    }
    startY = null;
  }

  el.addEventListener('touchstart', onStart, { passive: false });
  el.addEventListener('touchmove',  onMove,  { passive: false });
  el.addEventListener('touchend',   onEnd);
  el.addEventListener('mousedown',  onStart);
}

// ════════════════════════
// 手札エリア全体スワイプ
// （横スワイプでフォーカス移動、縦スワイプで発動）
// ════════════════════════

function setupHandSwipe(area) {
  let startX = null, startY = null, active = false;
  const H_THRESH = 30;
  const V_THRESH = 65;

  area.addEventListener('touchstart', e => {
    if (getState().gameOver) return;
    const pt = e.touches[0];
    startX = pt.clientX; startY = pt.clientY; active = true;
  }, { passive: true });

  area.addEventListener('touchmove', e => {
    if (!active || startX === null) return;
    const pt = e.touches[0];
    const dx = pt.clientX - startX;
    const dy = pt.clientY - startY;
    const fi = getFocusedIdx();

    // 縦スワイプ中：フォーカス中カードを追従
    if (fi >= 0 && Math.abs(dy) > Math.abs(dx) && dy < 0) {
      const cards = area.querySelectorAll('.card');
      const el = cards[fi];
      if (el && !el.classList.contains('disabled')) {
        const p = Math.min(Math.abs(dy) / V_THRESH, 1);
        el.style.transform = `rotate(0deg) translate(${dx * .15}px, ${dy}px) scale(${1 + p * .06})`;
        e.preventDefault();
      }
    }
  }, { passive: false });

  area.addEventListener('touchend', e => {
    if (!active || startX === null) return;
    active = false;
    const pt = e.changedTouches[0];
    const dx = pt.clientX - startX;
    const dy = pt.clientY - startY;
    const n  = getState().hand.length;
    const fi = getFocusedIdx();

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > H_THRESH) {
      // 横スワイプ：フォーカス移動
      const dir    = dx < 0 ? 1 : -1;
      const cur    = fi < 0 ? (dir > 0 ? -1 : n) : fi;
      let   target = Math.max(0, Math.min(n - 1, cur + dir));
      const state  = getState();
      for (let i = 0; i < n; i++) {
        const t = (target + i * dir + n * 2) % n;
        if (state.energy >= state.hand[t].cost) { target = t; break; }
      }
      setFocus(target);

    } else if (Math.abs(dy) > Math.abs(dx) && dy < -V_THRESH && fi >= 0) {
      // 縦スワイプ：発動
      useCard(fi);
    } else {
      applyFocus();
    }

    startX = null; startY = null;
  }, { passive: true });
}
