// ============================================================
// debug.js
// 開発用デバッグパネル
//
// 本番リリース時はindex.htmlのscriptタグを削除するだけでOK
// ゲームロジックへの副作用はすべてここに閉じ込める
// ============================================================

import { getState } from './core/game-state.js';
import { updateUI  } from './ui/ui.js';

// ════════════════════════
// デバッグ操作
// ════════════════════════

/**
 * 敵のHPを0にしてターン終了を発火 → 勝利判定が走る
 * 誤って敵の攻撃が飛ばないよう attacks を [0] に差し替えてから finishTurn を呼ぶ
 */
function debugKillEnemy() {
  const s = getState();
  if (!s || !s.enemy || s.gameOver) return;

  s.enemy.hp      = 0;
  s.enemy.attacks = [0]; // ターン終了時の敵攻撃ダメージを0にする
  updateUI();
  window.Game.finishTurn();
}

/**
 * 現在の羊数に 10000 を加算する
 */
function debugAddSheep() {
  const s = getState();
  if (!s) return;

  s.sheep += 10000;
  updateUI();
}

// ════════════════════════
// パネル生成
// ════════════════════════

function createDebugPanel() {
  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 12px;
    right: 12px;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.82);
    border: 1px solid #ff4444;
    border-radius: 8px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: monospace;
    font-size: 11px;
    user-select: none;
  `;

  const label = document.createElement('div');
  label.textContent = '🛠 DEBUG';
  label.style.cssText = 'color:#ff4444;font-weight:bold;letter-spacing:2px;margin-bottom:2px;';
  panel.appendChild(label);

  const killBtn = document.createElement('button');
  killBtn.textContent = '⚡ 敵を一撃';
  applyBtnStyle(killBtn, '#ff4444');
  killBtn.addEventListener('click', debugKillEnemy);
  panel.appendChild(killBtn);

  const sheepBtn = document.createElement('button');
  sheepBtn.textContent = '🐑 羊 +10000';
  applyBtnStyle(sheepBtn, '#44cc88');
  sheepBtn.addEventListener('click', debugAddSheep);
  panel.appendChild(sheepBtn);

  document.body.appendChild(panel);
}

function applyBtnStyle(btn, color) {
  btn.style.cssText = `
    background: transparent;
    border: 1px solid ${color};
    color: ${color};
    border-radius: 4px;
    padding: 4px 10px;
    cursor: pointer;
    font-family: monospace;
    font-size: 12px;
    white-space: nowrap;
    transition: background 0.15s;
  `;
  btn.addEventListener('mouseenter', () => { btn.style.background = color + '33'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
}

// ════════════════════════
// 起動
// ════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  createDebugPanel();
  console.log('[DEBUG] デバッグパネルを起動しました');
});
