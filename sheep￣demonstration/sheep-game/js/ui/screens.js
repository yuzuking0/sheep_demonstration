// ============================================================
// ui/screens.js
// 画面の切り替えを管理する
//
// 役割:
//   - showScreen() で画面を切り替える
//   - 各画面の初期化処理を呼ぶ
// ============================================================

import { SCREENS } from '../data/constants.js';

let currentScreen = null;

/**
 * 指定した画面に切り替える
 * @param {string} screenId - SCREENS.XXX を使う
 */
export function showScreen(screenId) {
  // 全画面を非表示
  console.log("出そうとした画面のID:", screenId); 

  Object.values(SCREENS).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // 対象画面を表示
  const target = document.getElementById(screenId);

   console.log("見つかったHTML要素:", target);
  if (target) {
    target.style.display = 'flex';
    currentScreen = screenId;
  }
}

/**
 * 現在の画面IDを取得する
 */
export function getCurrentScreen() {
  return currentScreen;
}
