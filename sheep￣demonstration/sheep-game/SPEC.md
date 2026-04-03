# 羊インフレーション - プロジェクト仕様書-

> 最終更新: 2025年
> ステータス: プロトタイプ開発中

---

## ゲーム概要 a 

スレスパ風のデッキ構築ローグライクカードゲーム。
羊を増やしながら敵と戦い、ステージを攻略していく。

**羊 = HP兼通貨** という独自のジレンマが面白さの核。

---

## ディレクトリ構成

```
sheep-game/
  index.html              エントリーポイント（HTML唯一のファイル）

  js/
    main.js               起動・各モジュールの初期化・グローバル公開
    core/
      game-state.js       ゲーム状態の一元管理・更新関数
      battle.js           戦闘進行の制御・コールバック発行
    data/
      cards.js            カードデータ定義
      constants.js        定数（バランス調整はここだけ触る）
    ui/
      ui.js               DOM更新・エフェクト描画
      screens.js          画面切り替え
      events.js           入力処理（タップ・スワイプ）
    systems/
      sound.js            効果音・BGM
    utils/
      helpers.js          汎用関数（shuffle・clamp など）

  css/
    base.css              CSS変数・共通スタイル・共通ボタン
    background.css        背景アニメーション（星・雲・丘）
    card.css              カードデザイン
    battle.css            戦闘画面レイアウト・エフェクト
```

---

## 設計ルール

### 責務の分離（絶対守る）

| ファイル | やること | やらないこと |
|---|---|---|
| `game-state.js` | 状態の読み書き | DOM操作・UI更新 |
| `battle.js` | 戦闘の進行制御 | 直接DOM操作 |
| `cards.js` | カードデータ定義 | ロジック処理 |
| `ui.js` | 画面の更新・描画 | ゲームロジック |
| `events.js` | 入力の検知 | 直接状態変更 |
| `sound.js` | 音の再生 | それ以外すべて |
| `helpers.js` | 汎用関数 | ゲーム固有の処理 |

### データの流れ

```
ユーザー操作
  → events.js（入力検知）
  → battle.js（進行制御）
  → game-state.js（状態更新）
  → battle.js（コールバック発行）
  → ui.js（画面更新）
       └→ sound.js（効果音）
```

---

## ゲームシステム

### 基本ステータス

```
初期羊数:    20（HP兼通貨）
初期エナジー: 3
最大エナジー: 3
手札枚数:    5枚
山札初期:   10枚
```

### ターン進行

1. エナジー回復（+maxEnergy）
2. 手札補充（5枚になるまで）
3. プレイヤー行動（カード使用）
4. ターン終了ボタン押下
5. 永続効果発動
6. 敵の攻撃（羊が減る）
7. 勝敗判定

### 勝敗条件

- **勝利**: 敵のHPが0になる
- **敗北**: 羊が0になる

---

## カード仕様

### カードオブジェクトの型

```js
{
  id:     string,    // ユニークID
  name:   string,    // 表示名
  cost:   number,    // エネルギーコスト
  type:   string,    // 'breed' | 'attack' | 'draw' | 'passive'
  emoji:  string,    // イラスト（絵文字）
  desc:   string,    // 効果説明（HTML可）
  effect: Function,  // (gameState) => void
}
```

### effectのルール

- `state` だけ変える（DOM・UIは触らない）
- ドロー処理は `state.drawCount += n` で指示する
- ダメージは `state.lastDamage = n` にセットする

### 現在のカード一覧

| ID | 名前 | コスト | タイプ | 効果 |
|---|---|---|---|---|
| breed | 繁殖 | 1 | breed | 羊+3 |
| graze | 放牧 | 1 | breed | 羊+5、1ドロー |
| herd | 群れ | 2 | breed | 羊+12 |
| double | 倍化 | 2 | breed | 羊×2（最低+5） |
| pasture | 牧草地 | 2 | passive | 毎ターン+3（永続） |
| ram | 体当たり | 1 | attack | 羊10消費→敵10ダメ |
| charge | 突撃 | 2 | attack | 羊20消費→敵25ダメ |
| stampede | スタンピード | 3 | attack | 羊30消費→敵50ダメ |
| sacrifice | 特攻 | 1 | attack | 羊の半分消費→同量ダメ |
| plan | 計画 | 1 | draw | 2ドロー |
| convert | 転換 | 0 | draw | 1捨て→2ドロー |

---

## ゲーム状態オブジェクト

```js
{
  sheep:      number,   // 現在の羊数（HP兼通貨）
  maxSheep:   number,   // 最大羊数
  energy:     number,   // 現在エネルギー
  maxEnergy:  number,   // 最大エネルギー
  turn:       number,   // 現在ターン数
  deck:       Card[],   // 山札
  hand:       Card[],   // 手札
  discard:    Card[],   // 捨て札
  passives:   Passive[],// 永続効果リスト
  enemy:      Enemy,    // 現在の敵
  turnIdx:    number,   // 敵の攻撃パターンインデックス
  gameOver:   boolean,  // ゲーム終了フラグ
  drawCount:  number,   // このターン追加ドロー数（カード効果用）
  lastDamage: number,   // 直前ダメージ（エフェクト用）
}
```

---

## 画面構成

### 現在実装済み

| 画面ID | 内容 |
|---|---|
| `title-screen` | タイトル・スタートボタン |
| `battle-screen` | 戦闘メイン画面 |
| `reward-screen` | 報酬カード選択 |

### 将来実装予定

| 画面ID | 内容 |
|---|---|
| `map-screen` | スレスパ風マップ（分岐・ルート選択） |
| `deck-screen` | デッキ確認画面 |
| `shop-screen` | ショップ |

---

## 今後のロードマップ

### フェーズ1（現在）
- [x] 戦闘システム基盤
- [x] カード使用・手札管理
- [x] 敵の攻撃
- [x] 報酬カード選択
- [ ] タイトル画面との接続
- [ ] スターターデッキ編集

### フェーズ2
- [ ] マップ画面（スレスパ風）
- [ ] 複数の敵
- [ ] カード報酬システム本格化
- [ ] レリック（永続バフアイテム）

### フェーズ3
- [ ] BGM・効果音本格化
- [ ] ボスバトル
- [ ] Capacitorでアプリ化
- [ ] Google Play提出

---

## 開発メモ

### カードを追加したい時
`js/data/cards.js` の `CARDS` 配列に追記するだけ。

### バランス調整したい時
`js/data/constants.js` の `GAME` オブジェクトを変える。

### 新しい画面を追加したい時
1. `index.html` に `<div id="xxx-screen">` を追加
2. `constants.js` の `SCREENS` に追記
3. `screens.js` が自動的に対応する
4. `main.js` に画面遷移の関数を追加

### 敵を追加したい時
`constants.js` の `ENEMY` オブジェクトに追記する。

---

## 操作方法

| 操作 | 効果 |
|---|---|
| カードをタップ | フォーカス |
| カードをダブルタップ | カード使用 |
| カードを上スワイプ | カード使用 |
| 手札を左右スワイプ | フォーカス移動 |
| TURN END ボタン | ターン終了 |
