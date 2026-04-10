// core/game-state.js

import { GAME, ENEMIES } from '../data/constants.js';
import { buildStarterDeck } from '../data/cards.js';
import { shuffle } from '../utils/helpers.js';

let state = null;

function getEnemyForKey(key) {
  const base = ENEMIES[key];
  return { ...base, hp: base.maxHp, key };
}

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
    passives:  [], // ここで初期化
    enemy:     null,
    turnIdx:   0,
    gameOver:  false,
    map:       null,
    shopCards: [],
  };

  return state;
}

/**
 * 次の戦闘用にリセットする
 */
export function resetForNextBattle(enemyKey) {
  const allCards = [...state.deck, ...state.hand, ...state.discard];
  state.deck    = shuffle(allCards);
  state.hand    = [];
  state.discard = [];

  state.energy   = GAME.INITIAL_ENERGY;
  state.turn     = 1;
  state.turnIdx  = 0;
  state.gameOver = false;

  // 【修正】戦闘をまたいで残したくないパッシブ（シールドなど）を削除
  // 永続させたいもの（牧草地など）だけ残す場合は filter を使います
  // 面倒な場合は、一旦 state.passives = [] で全消しでもOKです
  state.passives = state.passives.filter(p => !p.isShield); 

  state.enemy = getEnemyForKey(enemyKey);
}

export function getState() {
  return state;
}

export function drawCards(n) {
  for (let i = 0; i < n; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break;
      state.deck = shuffle([...state.discard]);
      state.discard = [];
    }
    state.hand.push(state.deck.pop());
  }
}

export function checkGameOver() {
  if (!state.enemy) return null; // 敵がいない時は判定しない
  if (state.enemy.hp <= 0) return 'win';
  if (state.sheep <= 0)    return 'lose';
  return null;
}

export function getNextEnemyAttack() {
  if (!state.enemy) return 0;
  return state.enemy.attacks[state.turnIdx % state.enemy.attacks.length];
}