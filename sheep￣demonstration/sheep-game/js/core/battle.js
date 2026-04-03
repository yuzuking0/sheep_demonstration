// ============================================================
// core/battle.js
// 戦闘の進行を管理する
//
// 【重要】コマンドパターンの実行者
//   cards.js の effect() はコマンド配列を返すだけ。
//   このファイルの executeCommands() が実際に状態を変える。
//
// 役割:
//   - カード使用 → コマンド実行 → UI通知 の流れを制御
//   - game-state.js（状態）と ui.js（表示）をつなぐ橋渡し
//   - UIは直接触らない。コールバックでui.jsに通知する
// ============================================================

// ============================================================
// core/battle.js
// 戦闘の進行を管理する
//
// 【重要】コマンドパターンの実行者
//   cards.js の effect() はコマンド配列を返すだけ。
//   このファイルの executeCommands() が実際に状態を変える。
//
// 役割:
//   - カード使用 → コマンド実行 → UI通知 の流れを制御
//   - game-state.js（状態）と ui.js（表示）をつなぐ橋渡し
//   - UIは直接触らない。コールバックでui.jsに通知する
// ============================================================
 
import { getState, drawCards, checkGameOver, getNextEnemyAttack } from './game-state.js';
import { ANIM } from '../data/constants.js';
import { wait, clamp } from '../utils/helpers.js';
 
// ════════════════════════
// コールバック登録
// ════════════════════════
 
const callbacks = {
  onStateChange:  () => {},  // 状態が変わった
  onCardPlayed:   () => {},  // カードを使った（アニメ用）
  onEnemyDamaged: () => {},  // 敵にダメージ（エフェクト用）
  onEnemyAttack:  () => {},  // 敵が攻撃した（エフェクト用）
  onGameOver:     () => {},  // ゲーム終了
};
 
export function registerCallbacks(cbs) {
  Object.assign(callbacks, cbs);
}
 
// ════════════════════════
// コマンド実行エンジン
// ════════════════════════
 
/**
 * コマンド配列を順番に実行してstateを更新する
 *
 * カードの effect() が返したコマンドをここで処理する。
 * 新しいコマンドを追加したい場合はここにcaseを足すだけ。
 *
 * @param {Array}  commands - コマンド配列
 * @param {Object} state    - ゲーム状態
 * @returns {{ damage: number }} 実行結果のサマリ
 */
export function executeCommands(commands, state) {
  let totalDamage = 0;
 
  for (const cmd of commands) {
    switch (cmd.type) {
 
      // 羊を増やす
      case 'gainSheep':
        state.sheep += cmd.value;
        break;
 
      // 羊を減らす（0以下にならない）
      case 'loseSheep':
        state.sheep = Math.max(0, state.sheep - cmd.value);
        break;
 
      // 羊を n 倍（最低 +5 保証）
      case 'multiplySheep':
        state.sheep = Math.max(state.sheep * cmd.value, state.sheep + 5);
        break;
 
      // 敵にダメージ
      case 'dealDamage':
        state.enemy.hp = Math.max(0, state.enemy.hp - cmd.value);
        totalDamage += cmd.value;
        break;
 
      // カードを引く
      case 'draw':
        drawCards(cmd.value);
        break;
 
      // 手札をランダムに1枚捨てる
      case 'discardRandom':
        if (state.hand.length > 0) {
          const i = Math.floor(Math.random() * state.hand.length);
          state.discard.push(state.hand.splice(i, 1)[0]);
        }
        break;
 
      // 永続効果を追加する
      case 'addPassive':
        state.passives.push(cmd.passive);
        break;
 
      default:
        console.warn(`[battle] 未知のコマンド: ${cmd.type}`);
    }
  }
 
  return { damage: totalDamage };
}
 
// ════════════════════════
// カード使用
// ════════════════════════
 
/**
 * 手札のカードを使用する
 * @param {number} cardIndex - 手札のインデックス
 */
// アニメーション中の二重実行を防ぐフラグ
let isBusy = false;

export async function useCard(cardIndex) {
  if (isBusy) return;
  const state = getState();
  if (state.gameOver) return;

  const card = state.hand[cardIndex];
  if (!card || state.energy < card.cost) return;

  isBusy = true;

  // 1. カード使用アニメをUIに通知
  callbacks.onCardPlayed({ cardIndex });

  // 2. アニメが山を迎えるまで待つ
  await wait(ANIM.CARD_PLAY * 0.65);
 
  // 3. コスト消費・手札から除去
  state.energy -= card.cost;
  state.hand.splice(cardIndex, 1);
 
  // 4. effectからコマンド配列を取得して実行
  const commands = card.effect(state) || [];
  const { damage } = executeCommands(commands, state);
 
  // 5. 捨て札に追加
  state.discard.push(card);
 
  // 6. ダメージが出たらエフェクトをUIに通知
  if (damage > 0) {
    callbacks.onEnemyDamaged({ damage });
  }
 
  // 7. 状態変化をUIに通知
  callbacks.onStateChange();
 
  // 8. 勝敗チェック
  const result = checkGameOver();
  if (result) {
    await wait(300);
    state.gameOver = true;
    callbacks.onGameOver({ result });
  }

  isBusy = false;
}
 
// ════════════════════════
// ターン終了
// ════════════════════════
 
/**
 * ターンを終了する
 */
export async function finishTurn() {
  const state = getState();
  if (state.gameOver) return;
 
  // 1. 永続効果を発動（コマンドパターンで実行）
  for (const passive of state.passives) {
    if (passive.commands) {
      executeCommands(passive.commands, state);
    }
  }
 
  // 2. 敵の攻撃
  const attackDmg = state.enemy.attacks[state.turnIdx % state.enemy.attacks.length];
  state.sheep = Math.max(0, state.sheep - attackDmg);
 
  // 3. 敵攻撃エフェクトをUIに通知
  callbacks.onEnemyAttack({ damage: attackDmg });
 
  // 4. ターン更新
  state.turnIdx++;
  state.turn++;
  state.energy = state.maxEnergy;
 
  // 5. 手札補充
  const toDraw = 5 - state.hand.length;
  if (toDraw > 0) drawCards(toDraw);
 
  // 6. UI更新
  callbacks.onStateChange();
 
  // 7. 勝敗チェック
  await wait(300);
  const result = checkGameOver();
  if (result) {
    state.gameOver = true;
    callbacks.onGameOver({ result });
  }
}
 
// ════════════════════════
// 戦闘開始
// ════════════════════════
 
/**
 * 戦闘開始時の初期ドロー
 */
export function startBattle() {
  drawCards(4);
  callbacks.onStateChange();}