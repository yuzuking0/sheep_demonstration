// ============================================================
// ui/map-ui.js
// マップ画面の描画とクリックハンドラ
//
// ルール:
//   - 状態を直接書き換えない（selectMapNode() を通す）
//   - ゲームロジックは書かない
//   - ノード選択時は onNodeSelected コールバックを呼ぶ
// ============================================================

import { getState }                    from '../core/game-state.js';
import { selectMapNode, NODE_ICONS, NODE_LABELS } from '../systems/map.js';

// ────────────────────────────────────────────
// コールバック登録
// ────────────────────────────────────────────

let onNodeSelected = null;

/**
 * ノード選択時に呼ばれるコールバックを登録する
 * @param {function(node): void} cb
 */
export function registerMapCallback(cb) {
  onNodeSelected = cb;
}

// ────────────────────────────────────────────
// レイアウト定数
// ────────────────────────────────────────────

const FLOOR_H  = 68;   // px / フロア
const NODE_R   = 22;   // ノード半径 px
const X_RATIOS = [0.18, 0.50, 0.82];  // 3ノード時の横位置比率

// ────────────────────────────────────────────
// 描画
// ────────────────────────────────────────────

/**
 * マップ全体を再描画する
 */
export function renderMap() {
  const { map } = getState();
  const container = document.getElementById('map-container');
  if (!container || !map) return;

  container.innerHTML = '';

  const totalH     = map.floors.length * FLOOR_H;
  const containerW = container.offsetWidth || 360;
  container.style.height = `${totalH}px`;

  // ── SVGレイヤー（接続線）──
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = `position:absolute;top:0;left:0;width:100%;height:${totalH}px;pointer-events:none;overflow:visible`;
  container.appendChild(svg);

  // ── ノードと線を描画 ──
  map.floors.forEach((floorNodes, floorIdx) => {
    const cy = centerY(floorIdx, map.floors.length);

    floorNodes.forEach((node, nodeIdx) => {
      const xr = floorNodes.length === 1 ? 0.5 : X_RATIOS[nodeIdx];
      const cx = xr * containerW;

      // 接続線
      drawLines(svg, node, nodeIdx, floorIdx, floorNodes, map, containerW);

      // ノード要素
      const isAvail   = map.availableNodeIds.includes(node.id);
      const isChosen  = map.chosenPath.includes(node.id);

      const el = document.createElement('div');
      el.className = `map-node mn-${node.type}`;
      if (isAvail)       el.classList.add('mn-available');
      if (isChosen)      el.classList.add('mn-chosen');
      if (node.cleared)  el.classList.add('mn-cleared');

      el.style.cssText = `left:${cx - NODE_R}px;top:${cy - NODE_R}px;`;
      el.innerHTML     = `<span class="mn-icon">${NODE_ICONS[node.type]}</span>`
                       + `<span class="mn-label">${NODE_LABELS[node.type]}</span>`;

      if (isAvail) el.addEventListener('click', () => handleClick(node.id));
      container.appendChild(el);
    });
  });

  // マップ上部にヘッダーラベル（BOSS）
  updateMapHeader(map);

  // スクロール：スタート（下）が見えるように
  const scroll = document.getElementById('map-scroll');
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

// ────────────────────────────────────────────
// ヘッダー更新
// ────────────────────────────────────────────

function updateMapHeader(map) {
  const el = document.getElementById('map-floor-label');
  if (!el) return;
  const floor  = map.currentFloor + 1;   // 1始まり表示
  const total  = map.floors.length;
  el.textContent = floor <= 0
    ? `FLOOR - / ${total}`
    : `FLOOR ${floor} / ${total}`;
}

// ────────────────────────────────────────────
// クリックハンドラ
// ────────────────────────────────────────────

function handleClick(nodeId) {
  const node = selectMapNode(nodeId);
  renderMap();
  if (onNodeSelected) onNodeSelected(node);
}

// ────────────────────────────────────────────
// ユーティリティ
// ────────────────────────────────────────────

/** floor 0 を一番下に配置するための centerY（topからの距離） */
function centerY(floorIdx, totalFloors) {
  return (totalFloors - 1 - floorIdx) * FLOOR_H + FLOOR_H / 2;
}

function drawLines(svg, node, nodeIdx, floorIdx, floorNodes, map, containerW) {
  const nextFloor = map.floors[floorIdx + 1];
  if (!nextFloor) return;

  const xr1 = floorNodes.length === 1 ? 0.5 : X_RATIOS[nodeIdx];
  const x1  = xr1 * containerW;
  const y1  = centerY(floorIdx, map.floors.length) + NODE_R;

  node.connections.forEach(ni => {
    const xr2 = nextFloor.length === 1 ? 0.5 : X_RATIOS[ni];
    const x2  = xr2 * containerW;
    const y2  = centerY(floorIdx + 1, map.floors.length) - NODE_R;

    const nextId      = `${floorIdx + 1}-${ni}`;
    const isActive    = map.chosenPath.includes(node.id) && map.chosenPath.includes(nextId);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke',           isActive ? '#c9962a' : '#3a3020');
    line.setAttribute('stroke-width',     isActive ? '2.5'    : '1.5');
    line.setAttribute('stroke-dasharray', isActive ? '0'      : '5 4');
    line.setAttribute('stroke-linecap',   'round');
    svg.appendChild(line);
  });
}
