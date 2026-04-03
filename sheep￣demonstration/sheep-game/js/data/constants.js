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
  MAX_STAGE:          3,   // ステージ数（最後がボス）
};

export const ENEMY = {
  WOLF: {
    id:      'wolf',
    name:    '野生の狼',
    maxHp:   50,
    attacks: [8,8,12,8,15],
  },
};

export const SCREENS = {
  TITLE:   'title-screen',
  BATTLE:  'battle-screen',
  REWARD:  'reward-screen',
  CLEAR:   'clear-screen',   // 追加
};

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
