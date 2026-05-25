/* ============================================================
   data.js
   白山クラブサイトのデータファイル
   ─────────────────────────────────────────────────────────
   このファイルはGASが自動で書き換えるため、手動編集する場合は
   必ず GitHub から最新版を取得してから編集してください。
   ============================================================ */

/* ------------------------------------------------------------
   お知らせデータ（新しい順に追加してください・最大20件表示）
   ------------------------------------------------------------ */
const NEWS_LIST = [
  { date:"2026/05/25", cat:"site", text:"トップページの表示方法を変更\n3秒後クラブ名を最上段、戻るボタンでも同様" },
  { date:"2026/05/23", cat:"site", text:"SEO対策実施しました。\n白山ラージボール卓球クラブに変更" },
  { date:"2026/05/24", cat:"content", text:"ヒーローメニュー区画内に管理人川柳を追加しました。" },
  { date:'2026/05/22', cat:'gallery', text:'写真を追加しました。' },
  { date:'2026/05/21', cat:'site', text:'白山クラブ公式サイトを公開しました' },
];

/* ------------------------------------------------------------
   管理人川柳リスト（新しいものを上に追加してください）
   ------------------------------------------------------------ */
const SENRYU_LIST = [
  // 卓球テーマ
  { date:'2026/05/24', upper:'ラージボール', middle:'追いつけたのに', lower:'空振りで' },
  { date:'2026/05/17', upper:'サーブの時',   middle:'トスのルールに', lower:'悩む夜' },
  { date:'2026/05/10', upper:'妻のスマッシュ', middle:'俺のドライブより', lower:'よく決まる' },
  { date:'2026/05/03', upper:'練習日',     middle:'膝より先に',   lower:'心が折れ' },
  { date:'2026/04/26', upper:'ピンポン玉', middle:'探せばいつも', lower:'冷蔵庫下' },
  { date:'2026/04/19', upper:'ラケットを', middle:'新調したのに', lower:'腕変わらず' },
  { date:'2026/04/12', upper:'試合前',     middle:'素振り百回',   lower:'寝てしまう' },
  { date:'2026/04/05', upper:'卓球部',     middle:'平均年齢',     lower:'知らぬが花' },
  // スポーツ全般
  { date:'2026/03/29', upper:'三日坊主',   middle:'今度は本気と', lower:'毎月言い' },
  { date:'2026/03/22', upper:'ジム通い',   middle:'会費だけ毎月', lower:'届く春' },
  { date:'2026/03/15', upper:'健康診断',   middle:'数値だけ見て', lower:'ジム決意' },
  { date:'2026/03/08', upper:'老眼鏡',     middle:'探すメガネを', lower:'かけている' },
  { date:'2026/03/01', upper:'体力測定',   middle:'昨日の俺に',   lower:'また負ける' },
  { date:'2026/02/22', upper:'階段で',     middle:'息より先に',   lower:'膝が鳴く' },
  { date:'2026/02/15', upper:'健康法',     middle:'覚えるたびに', lower:'また忘れ' },
];

/* ------------------------------------------------------------
   フォトギャラリー（GASが週次でGoogle Driveから自動更新）
   ※ この配列は GAS の updateGallery() が自動管理します。
   ※ 手動編集は避けてください。
   ------------------------------------------------------------ */
let photos = [
  {
    "id": 1,
    "src": "https://drive.google.com/thumbnail?id=1y_V5Pj4AZmCyIYdMbUWfj3e8GDa9EwvC&sz=w800",
    "category": "atmosphere",
    "caption": ""
  },
  {
    "id": 2,
    "src": "https://drive.google.com/thumbnail?id=1_QZSJb38ditFd5xM0RclXVv6RDHH7111&sz=w800",
    "category": "atmosphere",
    "caption": ""
  },
  {
    "id": 3,
    "src": "https://drive.google.com/thumbnail?id=1UvO4rfYz0swvfgmEaoX2Gof7ra5mKle-&sz=w800",
    "category": "practice",
    "caption": ""
  },
  {
    "id": 4,
    "src": "https://drive.google.com/thumbnail?id=1Y_GlL4UKbY9ywpEf0uFzs7FZGZ3LBNPu&sz=w800",
    "category": "practice",
    "caption": ""
  },
  {
    "id": 5,
    "src": "https://drive.google.com/thumbnail?id=1rBHi4oj0sbs0fk_RWYe7a_Dne_fdutCP&sz=w800",
    "category": "practice",
    "caption": ""
  },
  {
    "id": 6,
    "src": "https://drive.google.com/thumbnail?id=199wQY9aK9kHLFp8uSwbwR2W4ucGbygVq&sz=w800",
    "category": "practice",
    "caption": ""
  },
  {
    "id": 7,
    "src": "https://drive.google.com/thumbnail?id=1JQ74O1k0bIH-DTYDJ7yJX1z3KRTY36wx&sz=w800",
    "category": "practice",
    "caption": ""
  },
  {
    "id": 8,
    "src": "https://drive.google.com/thumbnail?id=14S67-yQkv_umKUIz_Z0c_ZjsCrohGkjM&sz=w800",
    "category": "match",
    "caption": "2026/5　スポレク2"
  },
  {
    "id": 9,
    "src": "https://drive.google.com/thumbnail?id=16fb7Q4ZS3zV0T8KvF-Zj8kCHKgNXaKqg&sz=w800",
    "category": "match",
    "caption": "2026/5　スポレク1"
  },
  {
    "id": 10,
    "src": "https://drive.google.com/thumbnail?id=1yGR9YRV0-nB9HvlbMTnDotNMqBT_2C3N&sz=w800",
    "category": "match",
    "caption": "2026/5　スポレク優勝"
  }
];
