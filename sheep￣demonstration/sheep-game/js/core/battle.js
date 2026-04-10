// ============================================================
// core/battle.js
// 戦闘の進行を管理する
// ============================================================
 
import { getState, drawCards, checkGameOver, getNextEnemyAttack } from './game-state.js';
import { ANIM } from '../data/constants.js';
import { wait, clamp } from '../utils/helpers.js';
 
// ════════════════════════
// コールバック登録
// ════════════════════════
 
const callbacks = {
  onStateChange:  () => {},  
  onCardPlayed:   () => {},  
  onEnemyDamaged: () => {},  
  onEnemyAttack:  () => {},  
  onGameOver:     () => {},  
};
 
export function registerCallbacks(cbs) {
  Object.assign(callbacks, cbs);
}
 
// ════════════════════════
// コマンド実行エンジン
// ════════════════════════
 
export function executeCommands(commands, state) {
  let totalDamage = 0;
 
  for (const cmd of commands) {
    switch (cmd.type) {
 
      case 'gainSheep':
        state.sheep += cmd.value;
        break;
 
      case 'loseSheep':
        state.sheep = Math.max(0, state.sheep - cmd.value);
        break;
 
      case 'multiplySheep':
        state.sheep = Math.max(state.sheep * cmd.value, state.sheep + 5);
        break;
 
      case 'dealDamage':
        state.enemy.hp = Math.max(0, state.enemy.hp - cmd.value);
        totalDamage += cmd.value;
        break;
 
      case 'draw':
        drawCards(cmd.value);
        break;
 
      case 'discardRandom':
        if (state.hand.length > 0) {
          const i = Math.floor(Math.random() * state.hand.length);
          state.discard.push(state.hand.splice(i, 1)[0]);
        }
        break;
 
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
 
let isBusy = false;

export async function useCard(cardIndex) {
  if (isBusy) return;
  const state = getState();
  if (state.gameOver) return;

  const card = state.hand[cardIndex];
  if (!card || state.energy < card.cost) return;

  isBusy = true;

  callbacks.onCardPlayed({ cardIndex });

  await wait(ANIM.CARD_PLAY * 0.65);
 
  state.energy -= card.cost;
  state.hand.splice(cardIndex, 1);
 
  const commands = card.effect(state) || [];
  const { damage } = executeCommands(commands, state);
 
  state.discard.push(card);
 
  if (damage > 0) {
    callbacks.onEnemyDamaged({ damage });
  }
 
  callbacks.onStateChange();
 
  const result = checkGameOver();
  if (result) {
    await wait(300);
    state.gameOver = true;
    callbacks.onGameOver({ result });
  }

  isBusy = false;
}
 
// ════════════════════════
// ターン終了（★ここで攻撃無効を処理★）
// ════════════════════════
 
export async function finishTurn() {
  const state = getState();
  if (state.gameOver) return;
 
  // 1. 永続効果（リジェネ等）を発動
  for (const passive of state.passives) {
    if (passive.commands) {
      executeCommands(passive.commands, state);
    }
  }
 
  // 2. 敵の攻撃準備
  let attackDmg = state.enemy.attacks[state.turnIdx % state.enemy.attacks.length];

  // 【追加】無効化シールドのチェック
  const shieldIndex = state.passives.findIndex(p => p.isShield);
  if (shieldIndex !== -1) {
    // シールドがある場合、ダメージを0にし、シールドを消費（削除）する
    attackDmg = 0;
    state.passives.splice(shieldIndex, 1);
    console.log("攻撃をブロックしました！");
  }
 
  // 3. ダメージ適用
  state.sheep = Math.max(0, state.sheep - attackDmg);
 
  // 4. 敵攻撃エフェクトをUIに通知（ダメージ0でも通知することで「守った感」を出す）
  callbacks.onEnemyAttack({ damage: attackDmg });
 
  // 5. ターン更新
  state.turnIdx++;
  state.turn++;
  state.energy = state.maxEnergy;
 
  // 6. 手札補充
  const toDraw = 5 - state.hand.length;
  if (toDraw > 0) drawCards(toDraw);
 
  // 7. UI更新
  callbacks.onStateChange();
 
  // 8. 勝敗チェック
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
 
export function startBattle() {
  drawCards(4);
  callbacks.onStateChange();
}