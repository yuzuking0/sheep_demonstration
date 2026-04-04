// ============================================================
// core/game-state.js
// ゲーム全体の状態を一元管理する
//
// ルール:
//   - 状態の「読み取り」はどこからでもOK
//   - 状態の「変更」は必ずこのファイルの関数を通す
//   - UIは直接触らない
// ============================================================

import { GAME, ENEMIES, STAGES } from '../data/constants.js';
import { buildStarterDeck } from '../data/cards.js';
import { shuffle } from '../utils/helpers.js';

/**
 * GameState の型定義（コメントとして）
 *
 * @typedef {Object} GameState
 * @property {number}   sheep      - 現在の羊数（HPも兼ねる）
 * @property {number}   maxSheep   - 最大羊数
 * @property {number}   energy     - 現在エネルギー
 * @property {number}   maxEnergy  - 最大エネルギー
 * @property {number}   turn       - 現在ターン数
 * @property {Array}    deck       - 山札
 * @property {Array}    hand       - 手札
 * @property {Array}    discard    - 捨て札
 * @property {Array}    passives   - 永続効果リスト
 * @property {Object}   enemy      - 現在の敵
 * @property {number}   turnIdx    - 敵の攻撃パターンのインデックス
 * @property {boolean}  gameOver   - ゲーム終了フラグ
 * @property {number}   drawCount  - このターン追加で引くカード数
 * @property {number}   lastDamage - 直前に与えたダメージ（エフェクト用）
 */

// ゲーム状態（シングルトン）
let state = null;

/**
 * ステージ番号（1始まり）に対応する敵データを返す
 */
function getEnemyForStage(stage) {
  const stageData = STAGES[stage - 1] ?? STAGES[STAGES.length - 1];
  const enemyKey  = stageData.enemy;
  const base      = ENEMIES[enemyKey];
  return { ...base, hp: base.maxHp };
}

/**
 * ゲームを初期化して新しい状態を作る（ゲーム開始時に呼ぶ）
 */
export function initState() {
  const deck = shuffle(buildStarterDeck());

  state = {
    sheep:     GAME.INITIAL_SHEEP,
    maxSheep:  GAME.INITIAL_SHEEP,
    energy:    GAME.INITIAL_ENERGY,
    maxEnergy: GAME.MAX_ENERGY,
    turn:      1,
    deck,
    hand:      [],
    discard:   [],
    passives:  [],
    enemy:     getEnemyForStage(1),
    turnIdx:   0,
    gameOver:  false,
    // ステージ管理
    stage:     1,
    maxStage:  GAME.MAX_STAGE,
  };

  return state;
}


/**
 * 次の戦闘用にリセットする（ステージをまたぐ時に呼ぶ）
 * デッキは引き継ぐ、羊（HP）は維持し、エナジー・ターンはリセット
 */
export function resetForNextBattle() {
  // デッキ全部回収してシャッフル（ここはそのまま）
  const allCards = [...state.deck, ...state.hand, ...state.discard];
  state.deck    = shuffle(allCards);
  state.hand    = [];
  state.discard = [];

  // --- 修正箇所：ひつじの数（HP）に関するリセットを削除 ---
  // state.sheep    = GAME.INITIAL_SHEEP; // これを削除
  // state.maxSheep = GAME.INITIAL_SHEEP; // これを削除

  // 戦闘状態のみリセット
  state.energy   = GAME.INITIAL_ENERGY;
  state.turn     = 1;
  state.turnIdx  = 0;
  state.gameOver = false;
  state.passives = []; // パッシブ効果をリセットするかどうかはゲームデザインによります

  // 次のステージの敵をセット
  state.enemy = getEnemyForStage(state.stage);
}

/**
 * 現在の状態を取得する（読み取り専用のつもりで使う）
 */
export function getState() {
  return state;
}

/**
 * 手札にカードを引く
 */
export function drawCards(n) {
  for (let i = 0; i < n; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break;
      // 捨て札をシャッフルして山札に戻す
      state.deck = shuffle([...state.discard]);
      state.discard = [];
    }
    state.hand.push(state.deck.pop());
  }
}

/**
 * 勝敗を判定する
 * @returns {'win' | 'lose' | null}
 */
export function checkGameOver() {
  if (state.enemy.hp <= 0) return 'win';
  if (state.sheep <= 0)    return 'lose';
  return null;
}

/**
 * 次の敵の攻撃力を取得する（予告表示用）
 */
export function getNextEnemyAttack() {
  return state.enemy.attacks[state.turnIdx % state.enemy.attacks.length];
}
