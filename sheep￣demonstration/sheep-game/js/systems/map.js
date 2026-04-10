// ============================================================
// systems/map.js
// マップ生成と状態管理（ロジックのみ、UI触らない）
//
// 用語:
//   floor    - 縦方向の段（0 = スタート、最終 = ボス）
//   node     - 各段にある選択肢（battle/elite/shop/rest/boss）
//   path     - プレイヤーが選んできたノードIDの履歴
// ============================================================

import { GAME } from '../data/constants.js';
import { getState } from '../core/game-state.js';
import { shuffle } from '../utils/helpers.js';

export const NODE_ICONS = {
  battle: '⚔️',
  elite:  '💀',
  shop:   '🏪',
  rest:   '🛏️',
  boss:   '👑',
};

export const NODE_LABELS = {
  battle: '戦闘',
  elite:  'エリート',
  shop:   'ショップ',
  rest:   '休憩',
  boss:   'ボス',
};

// ────────────────────────────────────────────
// 設定
// ────────────────────────────────────────────

const FLOORS          = GAME.MAP_FLOORS;  // 8
const NODES_PER_FLOOR = 3;

// フロアごとのノード種別セット（シャッフルして配置）
// ※ 最終フロアはボス固定のため定義不要
const FLOOR_DISTRIBUTIONS = [
  ['battle', 'battle', 'battle'],   // 0
  ['battle', 'battle', 'battle'],   // 1
  ['battle', 'battle', 'shop'],     // 2
  ['battle', 'elite',  'battle'],   // 3
  ['battle', 'elite',  'shop'],     // 4
  ['elite',  'battle', 'rest'],     // 5
  ['elite',  'shop',   'rest'],     // 6（ボス直前）
  // floor 7 = boss（後述で自動生成）
];

// ────────────────────────────────────────────
// 敵キー決定
// ────────────────────────────────────────────

function pickEnemyKey(type, floorIdx) {
  if (type === 'battle') {
    // 初期フロアはスライム or コウモリにする
    if (floorIdx < 3) {
      return Math.random() < 0.5 ? 'SLIME' : 'BAT';
    }
    return 'WOLF';
  }

  if (type === 'elite')  return 'ELITE_WOLF';
  if (type === 'boss')   return 'BOSS';
  return null;
}

// ────────────────────────────────────────────
// マップ生成
// ────────────────────────────────────────────

/**
 * 新しいマップを生成して返す
 * @returns {MapState}
 */
export function generateMap() {
  const floors = [];

  // floor 0 〜 6
  for (let f = 0; f < FLOORS - 1; f++) {
    const dist = shuffle([...FLOOR_DISTRIBUTIONS[f]]);
    floors.push(
      dist.map((type, n) => ({
        type,
        id:          `${f}-${n}`,
        connections: [],   // 次フロアへのインデックス（後で設定）
        cleared:     false,
        enemyKey:    pickEnemyKey(type, f),
      }))
    );
  }

  // floor 7: ボス（1ノード固定）
  floors.push([{
    type:        'boss',
    id:          `${FLOORS - 1}-0`,
    connections: [],
    cleared:     false,
    enemyKey:    'BOSS',
  }]);

  buildConnections(floors);

  return {
    floors,
    currentFloor:     -1,               // まだ選択前
    chosenPath:       [],               // 選んできたノードIDの配列
    availableNodeIds: floors[0].map(n => n.id),  // 最初は floor 0 全解放
  };
}

// ────────────────────────────────────────────
// 接続線の構築
// ────────────────────────────────────────────

function buildConnections(floors) {
  for (let f = 0; f < floors.length - 1; f++) {
    const curr = floors[f];
    const next = floors[f + 1];

    curr.forEach((node, ni) => {
      const targets = new Set();
      // 正面（インデックスをクランプ）
      targets.add(Math.min(ni, next.length - 1));
      // ランダムで斜め接続
      if (ni + 1 < next.length && Math.random() > 0.45) targets.add(ni + 1);
      if (ni - 1 >= 0           && Math.random() > 0.55) targets.add(ni - 1);
      node.connections = [...targets].sort();
    });

    // 次フロアに接続されていないノードが出ないよう保証
    next.forEach((_, ni) => {
      const reached = curr.some(n => n.connections.includes(ni));
      if (!reached) {
        const donor = curr[Math.min(ni, curr.length - 1)];
        donor.connections = [...new Set([...donor.connections, ni])].sort();
      }
    });
  }

  // ボス直前フロアは全ノードをボスへ接続
  const preBoss = floors[floors.length - 2];
  preBoss.forEach(n => { n.connections = [0]; });
}

// ────────────────────────────────────────────
// 状態操作
// ────────────────────────────────────────────

/**
 * ノードIDからノードオブジェクトを返す
 */
export function getNodeById(nodeId) {
  const { floors } = getState().map;
  const [f, n] = nodeId.split('-').map(Number);
  return floors[f][n];
}

/**
 * ノードを選択する（マップ画面でタップ時）
 * @returns {Node} 選択されたノード
 */
export function selectMapNode(nodeId) {
  const map = getState().map;
  const [floorIdx] = nodeId.split('-').map(Number);
  map.currentFloor = floorIdx;
  map.chosenPath.push(nodeId);
  return getNodeById(nodeId);
}

/**
 * 現在のノードを完了にして次フロアを解放する
 * （戦闘勝利 / ショップ退出 / 休憩完了 後に呼ぶ）
 */
export function completeMapNode() {
  const map = getState().map;
  const nodeId = map.chosenPath[map.chosenPath.length - 1];
  const [floorIdx, nodeIdx] = nodeId.split('-').map(Number);

  map.floors[floorIdx][nodeIdx].cleared = true;

  const nextF = floorIdx + 1;
  if (nextF < map.floors.length) {
    const node = map.floors[floorIdx][nodeIdx];
    map.availableNodeIds = node.connections.map(ni => `${nextF}-${ni}`);
  } else {
    map.availableNodeIds = [];
  }
}
