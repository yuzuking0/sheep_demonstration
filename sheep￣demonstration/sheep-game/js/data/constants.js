// ============================================================
// constants.js
// ゲーム全体で使う定数
// ここだけ変えればゲームバランスを調整できる
// ============================================================

export const GAME = {
  INITIAL_SHEEP:      20,
  INITIAL_ENERGY:     3,
  MAX_ENERGY:         3,
  HAND_SIZE:          5,
  STARTER_DECK_SIZE:  10,
  MAP_FLOORS:         8,   // マップのフロア数
};

export const ENEMIES = {
  WOLF: {
    id:      'wolf',
    name:    '野生の狼',
    maxHp:   50,
    attacks: [8,8,12,8,15],
  },

  SLIME: {
    id:      'slime',
    name:    'スライム',
    maxHp:   30,
    attacks: [5, 5, 7],
  },

  BAT: {
    id:      'bat',
    name:    'コウモリ',
    maxHp:   40,
    attacks: [3, 3, 5, 10]
  },

  ELITE_WOLF: {
    id:      'elite_wolf',
    name:    '禍狼',
    maxHp:   65,
    attacks: [12, 10, 18, 12],
  },

  BOSS: {
    id:      'boss',
    name:    '巨大オオカミ',
    maxHp:   80,
    attacks: [10, 15, 20, 10],
  },
};

// ステージ定義（順番に進む）
export const STAGES = [
  { enemy: 'BAT'   },
  { enemy: 'SLIME' },   // Stage 1
  { enemy: 'WOLF'  },   // Stage 2
  { enemy: 'BOSS'  },   // Stage 3（ボス）
];

export const SCREENS = {
  TITLE:   'title-screen',
  MAP:     'map-screen',
  BATTLE:  'battle-screen',
  REST:    'rest-screen',
  REWARD:  'reward-screen',
  SHOP:    'shop-screen',
  CLEAR:   'clear-screen',
};

export const NODE_TYPES = {
  BATTLE: 'battle',
  ELITE:  'elite',
  SHOP:   'shop',
  REST:   'rest',
  BOSS:   'boss',
};

export const REROLL_COST = 10;

export const CARD_TYPES = {
  BREED:   'breed',    // 増殖系
  ATTACK:  'attack',   // 攻撃系
  DRAW:    'draw',     // ドロー系
  PASSIVE: 'passive',  // 永続効果系
};

// アニメーション時間（ms）
export const ANIM = {
  CARD_PLAY:    280,
  CARD_DRAW:    220,
  ENEMY_HIT:    350,
  REWARD_DELAY: 500,
};
