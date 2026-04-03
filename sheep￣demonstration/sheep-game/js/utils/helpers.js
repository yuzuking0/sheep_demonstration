// ============================================================
// utils/helpers.js
// どこからでも使える汎用関数
// ロジックもUIも関係ない純粋な便利関数だけ置く
// ============================================================

/**
 * 配列をシャッフルする（Fisher-Yates法）
 * @param {Array} array
 * @returns {Array} シャッフルされた新しい配列
 */
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * min〜maxのランダム整数
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 値をmin〜maxの範囲に収める
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * ms待つPromise（アニメ待ちに使う）
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 要素にクラスを一時的に付けてアニメを発火する
 * （同じクラスを連続で付けても発火するようにvoid再描画）
 */
export function triggerAnimation(element, className, duration = 500) {
  element.classList.remove(className);
  void element.offsetWidth; // 再描画を強制
  element.classList.add(className);
  setTimeout(() => element.classList.remove(className), duration);
}

/**
 * パーセント計算（0〜100）
 */
export function toPercent(value, max) {
  return clamp((value / max) * 100, 0, 100);
}
