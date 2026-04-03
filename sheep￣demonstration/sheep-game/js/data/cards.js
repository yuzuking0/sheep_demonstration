// ============================================================
// data/cards.js
// カードデータの定義
//
// 【設計方針】コマンドパターン
//   effect は状態を直接触らず、
//   「何をしたいか」を表すコマンド配列を返すだけ。
//
//   実際の処理は battle.js の executeCommands() が担当する。
//   これにより：
//     - カードの意図が読みやすい
//     - アニメのタイミング制御が楽
//     - テストしやすい
//     - ログ・デバッグが楽
//
// コマンド一覧:
//   { type: 'gainSheep',     value: n }       羊を n 増やす
//   { type: 'loseSheep',     value: n }       羊を n 減らす
//   { type: 'dealDamage',    value: n }       敵に n ダメージ
//   { type: 'draw',          value: n }       n 枚ドロー
//   { type: 'multiplySheep', value: n }       羊を n 倍（最低+5）
//   { type: 'discardRandom' }                 手札をランダムに1枚捨てる
//   { type: 'addPassive',    passive: {...} } 永続効果を追加する
// ============================================================

import { CARD_TYPES } from './constants.js';

export const CARDS = [

  // ── 増殖系 ──────────────────────────────────────────────

  {
    id:    'breed',
    name:  '繁殖',
    cost:  1,
    type:  CARD_TYPES.BREED,
    emoji: '🐑',
    desc:  '羊を <strong>+3</strong> 増やす',
    effect: () => [
      { type: 'gainSheep', value: 3 },
    ],
  },

  {
    id:    'graze',
    name:  '放牧',
    cost:  1,
    type:  CARD_TYPES.BREED,
    emoji: '🌿',
    desc:  '羊 <strong>+5</strong> ＋1ドロー',
    effect: () => [
      { type: 'gainSheep', value: 5 },
      { type: 'draw',      value: 1 },
    ],
  },

  {
    id:    'herd',
    name:  '群れ',
    cost:  2,
    type:  CARD_TYPES.BREED,
    emoji: '🐑',
    desc:  '羊を <strong>+12</strong> 増やす',
    effect: () => [
      { type: 'gainSheep', value: 12 },
    ],
  },

  {
    id:    'double',
    name:  '倍化',
    cost:  2,
    type:  CARD_TYPES.BREED,
    emoji: '✖️',
    desc:  '羊を <strong>×2</strong>（最低+5）',
    effect: () => [
      { type: 'multiplySheep', value: 2 },
    ],
  },

  {
    id:    'pasture',
    name:  '牧草地',
    cost:  2,
    type:  CARD_TYPES.PASSIVE,
    emoji: '🌾',
    desc:  '毎ターン終了時 <strong>+3</strong>',
    effect: () => [
      {
        type: 'addPassive',
        passive: {
          name:     '牧草地',
          commands: [{ type: 'gainSheep', value: 3 }],
        },
      },
    ],
  },

  // ── 攻撃系 ──────────────────────────────────────────────

  {
    id:    'ram',
    name:  '体当たり',
    cost:  1,
    type:  CARD_TYPES.ATTACK,
    emoji: '💥',
    desc:  '羊 <strong>10</strong> 消費 → 敵に <strong>10</strong> ダメ',
    effect: () => [
      { type: 'loseSheep',  value: 10 },
      { type: 'dealDamage', value: 10 },
    ],
  },

  {
    id:    'charge',
    name:  '突撃',
    cost:  2,
    type:  CARD_TYPES.ATTACK,
    emoji: '⚡',
    desc:  '羊 <strong>20</strong> 消費 → 敵に <strong>25</strong> ダメ',
    effect: () => [
      { type: 'loseSheep',  value: 20 },
      { type: 'dealDamage', value: 25 },
    ],
  },

  {
    id:    'stampede',
    name:  'スタンピード',
    cost:  3,
    type:  CARD_TYPES.ATTACK,
    emoji: '🌪️',
    desc:  '羊 <strong>30</strong> 消費 → 敵に <strong>50</strong> ダメ',
    effect: () => [
      { type: 'loseSheep',  value: 30 },
      { type: 'dealDamage', value: 50 },
    ],
  },

  {
    id:    'sacrifice',
    name:  '特攻',
    cost:  1,
    type:  CARD_TYPES.ATTACK,
    emoji: '🩸',
    desc:  '羊の半分消費 → 同量ダメ',
    // stateが必要な場合だけ引数で受け取る
    effect: (state) => {
      const dmg = Math.floor(state.sheep / 2);
      if (dmg < 1) return [];
      return [
        { type: 'loseSheep',  value: dmg },
        { type: 'dealDamage', value: dmg },
      ];
    },
  },

  // ── ドロー系 ──────────────────────────────────────────────

  {
    id:    'plan',
    name:  '計画',
    cost:  1,
    type:  CARD_TYPES.DRAW,
    emoji: '📋',
    desc:  'カードを <strong>2枚</strong> 引く',
    effect: () => [
      { type: 'draw', value: 2 },
    ],
  },

  {
    id:    'convert',
    name:  '転換',
    cost:  0,
    type:  CARD_TYPES.DRAW,
    emoji: '♻️',
    desc:  '1枚捨て → <strong>2枚</strong> ドロー',
    effect: () => [
      { type: 'discardRandom' },
      { type: 'draw',          value: 2 },
    ],
  },

];

/**
 * IDでカードを取得する
 */
export function getCardById(id) {
  return CARDS.find(c => c.id === id);
}

/**
 * スターターデッキを返す（コピーして返す）
 */
export function buildStarterDeck() {
  const ids = [
    'breed', 'breed', 'breed',
    'graze', 'graze',
    'ram',   'ram',
    'plan',
    'convert',
    'double',
  ];
  return ids.map(id => ({ ...getCardById(id) }));
}
