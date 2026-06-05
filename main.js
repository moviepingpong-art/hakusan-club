/* ============================================================
   白山クラブ｜ラージボール卓球  -  main.js
   ============================================================
   ※ 画像データ（IMG_1〜IMG_19）は images.js で定義されます
   ============================================================

   目次
   0.  お知らせ
   1.  パスワード設定
   2.  ギャラリー
   3.  ライトボックス
   4.  体験・見学ボタン
   5.  部員カレンダー
   6.  クラブマップ（Orange HUB）
   7.  Deep Dive ビューア（記事・PDF・動画）
   8.  豆知識ガチャ
   9.  今日の卓球運勢
   10. ラケット音
   11. ヒーローアニメーション
   12. 花火アニメーション
   13. 追加レポート管理
   14. 星フィールド
   15. 初期化（DOMContentLoaded）

   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   0. お知らせデータ（新しい順に追加してください・最大20件表示）
   ------------------------------------------------------------ */

/* --- Google Apps Script Web API URL --- */
const GAS_URL = 'https://script.google.com/macros/s/AKfycby6cvIHu_7d5caysgDYznj1nJITMyyKs8h6woNEHKZi0toKKPxVr5nO6xGJlVr9DCNI/exec';

/* ------------------------------------------------------------
   お知らせデータと管理人川柳データは data.js に分離しました。
   このファイルより先に data.js を読み込んでください（index.html参照）。
   ------------------------------------------------------------ */


/* 川柳の状態管理 */
let _currentSenryu     = null;
let _currentSenryuMode = 'daily';

/* 本日の川柳のインデックスを計算
   - 基準日（2026/1/1）からの経過日数 % SENRYU_LIST.length
   - 配列順に毎日1つずつ進み、リスト末尾まで来たら自動でループ */
function getTodaysSenryuIndex() {
  const baseDate = new Date(2026, 0, 1); // 2026/1/1（月は0始まり）
  const today    = new Date();
  // 時刻部分を切り捨て（日付のみで比較）
  today.setHours(0, 0, 0, 0);
  baseDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - baseDate) / (1000 * 60 * 60 * 24));
  // 負数（基準日より前）も対応
  const len = SENRYU_LIST.length;
  return ((diffDays % len) + len) % len;
}

/* ====================================================
   🏓 大会カウントダウン（部員カレンダー×Drive連携データ）
   ==================================================== */
function renderTournamentCountdown() {
  const el = document.getElementById('tournamentCountdown');
  const txt = document.getElementById('tournamentCountdownText');
  if (!el || !txt) return;

  // data.js の TOURNAMENT_LIST（GASが書き込む）。無ければ非表示。
  if (typeof TOURNAMENT_LIST === 'undefined' || !Array.isArray(TOURNAMENT_LIST) || TOURNAMENT_LIST.length === 0) {
    el.style.display = 'none';
    return;
  }

  // 今日以降の大会だけ抽出し、日付の近い順に並べる
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = TOURNAMENT_LIST
    .map(t => ({ ...t, _d: new Date(t.date) }))
    .filter(t => !isNaN(t._d) && t._d >= today)
    .sort((a, b) => a._d - b._d);

  if (upcoming.length === 0) {
    el.style.display = 'none';
    return;
  }

  const next = upcoming[0];
  const diffDays = Math.ceil((next._d - today) / (1000 * 60 * 60 * 24));

  // 表示テキスト
  let label;
  if (diffDays === 0)      label = '本日開催！';
  else if (diffDays === 1) label = '明日開催！';
  else                     label = `次の大会まで あと${diffDays}日`;
  txt.textContent = label;

  // リンク（要項PDFがあれば開く、なければ部員カレンダーへ）
  if (next.pdf) {
    el.href = next.pdf;
    el.target = '_blank';
  } else {
    el.href = '#calendar';
    el.target = '_self';
  }

  el.style.display = 'inline-flex';
}

/* ====================================================
   📝 今月のひとこと（季節のあいさつ・毎月切り替え）
   ==================================================== */
const MONTHLY_GREETINGS = [
  { /* 1月 */ icon:'🎍', title:'新春のごあいさつ',
    msg:'新春のお慶びを申し上げます。本年も白山クラブをよろしくお願いいたします。寒さに負けず、元気にラリーを楽しみましょう。' },
  { /* 2月 */ icon:'🌱', title:'立春のごあいさつ',
    msg:'立春を迎え、寒さの中にも春の気配を感じる頃となりました。体育館で身体を温めながら、ラージボールを楽しみましょう。' },
  { /* 3月 */ icon:'🌸', title:'弥生のごあいさつ',
    msg:'桜のつぼみがふくらむ季節となりました。年度末で何かと慌ただしい時期ですが、新しい仲間との出会いも楽しみです。' },
  { /* 4月 */ icon:'🌷', title:'卯月のごあいさつ',
    msg:'桜咲く季節、ラージボールも軽やかに弾みます。新年度のはじまり、新しい目標を立てて練習に取り組みましょう。' },
  { /* 5月 */ icon:'🍃', title:'皐月のごあいさつ',
    msg:'新緑が美しい季節となりました。窓の外の景色も楽しみながら、爽やかな気分でラケットを振りましょう。' },
  { /* 6月 */ icon:'☔', title:'水無月のごあいさつ',
    msg:'梅雨入りの季節。雨で外出しにくい日も、体育館で爽やかな汗を流せばリフレッシュできます。一緒にラリーしませんか。' },
  { /* 7月 */ icon:'🎋', title:'文月のごあいさつ',
    msg:'夏本番、暑さが厳しくなってまいりました。水分補給をしっかりとって、無理せず元気にラリーを続けましょう。' },
  { /* 8月 */ icon:'🌻', title:'葉月のごあいさつ',
    msg:'暑い日が続きますが、冷房の効いた体育館で快適に練習しています。夏バテに負けず、楽しくラージボールを。' },
  { /* 9月 */ icon:'🌾', title:'長月のごあいさつ',
    msg:'スポーツの秋がやってまいりました。涼しくなってラケットを振るのも気持ちよい季節。心地よい汗を流しましょう。' },
  { /* 10月 */ icon:'🍂', title:'神無月のごあいさつ',
    msg:'紅葉が美しい季節となりました。気持ちよくラケットを振れる毎日です。大会の予定もあり、いっそう力が入ります。' },
  { /* 11月 */ icon:'🍁', title:'霜月のごあいさつ',
    msg:'朝晩の冷え込みが増してまいりました。準備運動を念入りに、ケガなく楽しく練習しましょう。' },
  { /* 12月 */ icon:'❄️', title:'師走のごあいさつ',
    msg:'今年も白山クラブをご愛顧いただきありがとうございました。良い年末年始をお迎えください。来年もよろしくお願いいたします。' },
];

/* 今月のひとことを開く */
function openMonthlyGreeting() {
  const modal = document.getElementById('monthlyGreetingModal');
  if (!modal) return;
  const now = new Date();
  const m = now.getMonth(); // 0-11
  const g = MONTHLY_GREETINGS[m];

  document.getElementById('mgIcon').textContent  = g.icon;
  document.getElementById('mgTitle').textContent = g.title;
  document.getElementById('mgMsg').textContent   = g.msg;
  document.getElementById('mgMonth').textContent = `${m + 1}月`;
  modal.style.display = 'flex';
}
function closeMonthlyGreeting() {
  const modal = document.getElementById('monthlyGreetingModal');
  if (modal) modal.style.display = 'none';
}

/* 川柳を開く（mode: 'daily'=本日 / 'random'=過去ランダム） */
function openSenryu(mode) {
  if (!SENRYU_LIST || SENRYU_LIST.length === 0) return;

  const modal = document.getElementById('senryuModal');
  if (!modal) return;
  modal.style.display = 'flex';

  _currentSenryuMode = mode;
  if (mode === 'daily' || mode === 'weekly') {  // 'weekly'は旧名・互換性のため残す
    _currentSenryu = SENRYU_LIST[getTodaysSenryuIndex()];
    document.getElementById('senryuTitle').textContent = '〜 本日の管理人川柳 〜';
  } else {
    // 本日分を除いてランダム選択
    const todayIdx = getTodaysSenryuIndex();
    const pool = SENRYU_LIST.filter((_, i) => i !== todayIdx);
    _currentSenryu = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : SENRYU_LIST[todayIdx];
    document.getElementById('senryuTitle').textContent = '〜 過去からの一句 〜';
  }
  playSenryu(_currentSenryu);
}

function closeSenryu() {
  const modal = document.getElementById('senryuModal');
  if (!modal) return;
  // 進行中の音声をキャンセル
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  modal.style.display = 'none';
  // 表示エリアもクリア
  const disp = document.getElementById('senryuDisplay');
  if (disp) disp.innerHTML = '';
}

function replaySenryu() {
  if (_currentSenryu) playSenryu(_currentSenryu);
}

/* 川柳を実際に再生する（太鼓→音声＋縦書き表示） */
function playSenryu(senryu) {
  const disp = document.getElementById('senryuDisplay');
  const meta = document.getElementById('senryuMeta');
  if (!disp) return;
  disp.innerHTML = '';
  if (meta) {
    // 配列の中での番号を表示（1-indexed）
    const idx = SENRYU_LIST.indexOf(senryu);
    meta.textContent = idx >= 0
      ? `（第${idx + 1}首 / 全${SENRYU_LIST.length}首）`
      : '';
  }

  // 1) ドドン!太鼓の音
  playTaikoSound();

  // 2) 太鼓の後に音声＋縦書き表示
  setTimeout(() => {
    showSenryuVertical(disp, senryu);
    speakSenryu(senryu);
  }, 900);
}

/* 縦書きで川柳を順次表示 */
function showSenryuVertical(container, senryu) {
  const lines = [senryu.upper, senryu.middle, senryu.lower];
  container.innerHTML = '';

  lines.forEach((text, idx) => {
    const col = document.createElement('div');
    col.style.cssText = `
      writing-mode:vertical-rl;
      -webkit-writing-mode:vertical-rl;
      font-size:1.6rem;
      font-weight:700;
      color:#3a1a00;
      letter-spacing:0.15em;
      line-height:1.4;
      opacity:0;
      transform:translateY(-10px);
      transition:opacity 0.5s ease, transform 0.5s ease;
      min-height:200px;
      text-shadow:1px 1px 2px rgba(255,255,255,0.6);
    `;
    col.textContent = text;
    container.appendChild(col);

    // 順次フェードイン（太鼓終わりから各行 0.6秒間隔）
    setTimeout(() => {
      col.style.opacity   = '1';
      col.style.transform = 'translateY(0)';
    }, idx * 600 + 100);
  });
}

/* Web Speech APIで川柳を読み上げ（5・7・5を一呼吸ずつ空けて読む） */
function speakSenryu(senryu) {
  if (!('speechSynthesis' in window)) {
    console.warn('このブラウザは音声合成に対応していません');
    return;
  }

  // 日本語の声をランダム選択（男声/女声）
  let voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('ja'));
  // 初回読み込み時はvoicesが空のことがあるので、その場合は声指定なし（デフォルト）で進める
  const voice = voices.length > 0 ? voices[Math.floor(Math.random() * voices.length)] : null;

  const lines = [senryu.upper, senryu.middle, senryu.lower];
  const PAUSE_MS = 0;

  // ── Chrome の音声合成バグ対策 ──
  // 短いテキストや連続speakで突然 onend / onstart が来なくなることがある。
  // 「ウォッチドッグ」として一定時間音声が動かなければ強制的に次へ進める。
  function makeUtterance(text) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang   = 'ja-JP';
    u.rate   = 0.85;
    u.pitch  = 1.0;
    u.volume = 1.0;
    if (voice) u.voice = voice;
    return u;
  }

  function speakLine(idx) {
    if (idx >= lines.length) return;
    const u = makeUtterance(lines[idx]);

    let advanced = false;
    function goNext(label) {
      if (advanced) return;
      advanced = true;
      setTimeout(() => speakLine(idx + 1), PAUSE_MS);
    }

    u.onend   = () => goNext('end');
    u.onerror = (e) => { console.warn('音声合成エラー', e); goNext('error'); };

    // ウォッチドッグ：句の長さに見合った猶予時間内に終了しなかったら次へ
    // (5音=2.5秒前後・7音=3.5秒前後を想定し、十分な上限として5秒+句の文字数*0.4秒)
    const maxMs = 5000 + lines[idx].length * 400;
    setTimeout(() => {
      if (!advanced) {
        // まだ話しているなら見送る。話していない（=失敗）なら強制次へ
        if (!speechSynthesis.speaking && !speechSynthesis.pending) {
          goNext('watchdog');
        } else {
          // 話しているがonendが来ない場合のさらなる猶予
          setTimeout(() => goNext('watchdog-extra'), 2000);
        }
      }
    }, maxMs);

    speechSynthesis.speak(u);
  }

  // 既存の音声を停止し、Chromeのキュー状態をリセット
  try { speechSynthesis.cancel(); } catch (_) {}

  // cancel直後は内部状態が不安定なため少し待つ（cancel→pause→resumeで状態を確実にリセット）
  setTimeout(() => {
    try { speechSynthesis.resume(); } catch (_) {}
    speakLine(0);
  }, 50);
}

/* 太鼓「ドドン!」をMP3で再生（iPhoneのマナーモード問題を回避するためHTML audio使用） */
let _taikoAudio = null;
function playTaikoSound() {
  try {
    // <audio>要素を使い回す（毎回作るとモバイルで詰まる）
    if (!_taikoAudio) {
      _taikoAudio = new Audio('taiko.mp3');
      _taikoAudio.preload = 'auto';
      _taikoAudio.volume  = 1.0;
    }
    // 再生位置を頭に戻して再生
    _taikoAudio.currentTime = 0;
    const p = _taikoAudio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(err => console.warn('太鼓音の再生に失敗', err));
    }
  } catch (e) {
    console.warn('太鼓音の再生に失敗', e);
  }
}

/* ブラウザによっては getVoices() が非同期で読み込まれるため事前にウォームアップ */
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

/* 桜音声のトグル再生（タップで再生/停止） */
function toggleSakuraAudio() {
  const audio = document.getElementById('sakuraAudioEl');
  const label = document.getElementById('sakuraAudioTrigger');
  if (!audio) return;

  if (audio.paused) {
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    if (label) label.textContent = '🌸 再生中…（タップで停止）';
    // 再生終了で文言を元に戻す
    audio.onended = () => {
      if (label) label.textContent = '🌸 タップで音声再生';
    };
  } else {
    audio.pause();
    audio.currentTime = 0;
    if (label) label.textContent = '🌸 タップで音声再生';
  }
}

/* ヒーロー区画のイントロ要素（ロゴ・オレンジタグ）の表示制御
   - 初回アクセス時：3秒後にロゴとオレンジタグをフェードアウト→DOMから削除
   - セッション中の再訪：最初から非表示
   - sessionStorageでセッション内のフラグ管理 */
function initHeroIntro() {
  const elements = document.querySelectorAll('.intro-element');
  if (elements.length === 0) return;

  const SEEN_KEY = 'hakusan_intro_seen';
  const seen = sessionStorage.getItem(SEEN_KEY) === '1';

  if (seen) {
    // 既に見た → 最初から消す（transition抜きで即非表示）
    elements.forEach(el => {
      el.style.display = 'none';
    });
    return;
  }

  // 3秒後にフェードアウト開始
  setTimeout(() => {
    elements.forEach(el => {
      // 現在の高さを取得して固定（max-heightアニメーションのため）
      const h = el.offsetHeight;
      el.style.maxHeight = h + 'px';
      // 次フレームでアニメーション開始（フェード＋縮む）
      requestAnimationFrame(() => {
        el.style.opacity      = '0';
        el.style.maxHeight    = '0';
        el.style.marginTop    = '0';
        el.style.marginBottom = '0';
        el.style.transform    = 'translateY(-10px)';
      });
    });

    // アニメーション終了後にDOM上から完全に消す
    setTimeout(() => {
      elements.forEach(el => { el.style.display = 'none'; });
    }, 900);

    // セッション内の「見た」フラグ記録
    sessionStorage.setItem(SEEN_KEY, '1');
  }, 3000);
}

// カテゴリ設定
const NEWS_CAT = {
  site:    { icon:'🔧', label:'サイト更新', color:'#0057ff', bg:'rgba(0,87,255,0.07)', border:'rgba(0,87,255,0.2)' },
  gallery: { icon:'📸', label:'ギャラリー', color:'#e65100', bg:'rgba(230,81,0,0.07)',  border:'rgba(230,81,0,0.2)' },
  club:    { icon:'📢', label:'クラブ情報', color:'#2e7d32', bg:'rgba(46,125,50,0.07)', border:'rgba(46,125,50,0.2)' },
  content: { icon:'📄', label:'コンテンツ', color:'#6a1b9a', bg:'rgba(106,27,154,0.07)',border:'rgba(106,27,154,0.2)' },
};

const NEWS_SHOW  = 5;   // 最初に表示する件数
const NEWS_MAX   = 20;  // 最大表示件数
let   newsExpanded = false;

function renderNews() {
  const list = document.getElementById('newsBandList');
  const band = document.getElementById('newsBand');
  if (!list || !band) return;

  /* 日付の新しい順にソート（YYYY/MM/DD 形式を想定。
     破壊的変更を避けるため slice() でコピーしてからソート） */
  const items = NEWS_LIST.slice()
    .sort((a, b) => {
      // dateを YYYY/MM/DD として比較。文字列比較で日付順になる。
      const da = String(a.date || '').replace(/[^\d]/g, '');
      const db = String(b.date || '').replace(/[^\d]/g, '');
      return db.localeCompare(da);  // 降順（新しい順）
    })
    .slice(0, NEWS_MAX);

  if (items.length === 0) return;
  band.style.display = 'block';
  list.innerHTML = items.map((item, i) => {
    const c = NEWS_CAT[item.cat] || NEWS_CAT.site;
    return `<li style="
        display:flex;align-items:flex-start;gap:0.4rem;
        padding:0.5rem 0.8rem;
        border-bottom:${i < items.length - 1 ? '1px solid #e8edf8' : 'none'};
        font-size:0.78rem;
      ">
      <span style="flex-shrink:0;font-size:0.9rem">${c.icon}</span>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.15rem">
          <span style="font-size:0.68rem;font-weight:700;color:${c.color}">${c.label}</span>
          <span style="font-size:0.68rem;color:#999">${item.date}</span>
        </div>
        <p style="margin:0;color:#333;line-height:1.5;font-size:0.78rem">${item.text}</p>
      </div>
    </li>`;
  }).join('');
}

let newsBandExpanded = false;
function toggleNewsBand() {
  const wrap = document.getElementById('newsBandWrap');
  const btn  = document.getElementById('newsBandToggleBtn');
  newsBandExpanded = !newsBandExpanded;
  wrap.style.display = newsBandExpanded ? 'block' : 'none';
  btn.textContent = newsBandExpanded ? '▲' : '▼';
}



/* ------------------------------------------------------------
   1. パスワード設定
   ------------------------------------------------------------ */
window.ADMIN_PW  = '2026hakusan';
window.MEMBER_PW = 'm-hakusan';


/* ------------------------------------------------------------
   2. ギャラリー
   ------------------------------------------------------------ */
const CATEGORY_NAMES = {
  atmosphere:  'クラブ紹介・雰囲気',
  equipment:   '用具・施設',
  practice:    '練習・技術',
  match:       '試合・大会',
  groupphoto:  '集合写真・練習風景',
  interaction: '練習・交流の様子',
};
const CATEGORY_ICONS = {
  atmosphere:  '😊',
  equipment:   '🏓',
  practice:    '🏋️',
  match:       '🏆',
  groupphoto:  '📸',
  interaction: '📸',
};

/* photos 配列は data.js で定義しています */
let currentCategory = 'all';

/* フォトギャラリーで表示するカテゴリのみ（groupphoto/interactionはセクション写真用なので除外） */
const GALLERY_CATEGORIES = ['atmosphere', 'equipment', 'practice', 'match'];

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  // ギャラリー対象カテゴリのみに絞り込む（セクション写真は除外）
  const galleryPhotos = photos.filter(p => GALLERY_CATEGORIES.includes(p.category));

  const filtered = currentCategory === 'all'
    ? galleryPhotos
    : galleryPhotos.filter(p => p.category === currentCategory);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-light)">
        <div style="font-size:3rem;margin-bottom:0.8rem">📷</div>
        <div style="font-size:0.9rem">写真はGoogle Driveフォルダに保存すると毎週月曜日に自動更新されます。</div>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(photo => `
    <div class="gallery-item${photo.caption ? ' has-title' : ''}"
         onclick="openLightbox('${photo.src}')">
      <img src="${photo.src}" alt="${photo.caption || ''}">
      <div class="gallery-label">
        ${CATEGORY_ICONS[photo.category]} ${CATEGORY_NAMES[photo.category]}
        ${photo.caption
          ? `<br><strong style="font-size:0.85rem;letter-spacing:0.03em">${photo.caption}</strong>`
          : ''}
      </div>
    </div>`).join('');
}

/* 🏆 栄光の記録：championsカテゴリの写真を試合・大会タブに表示 */
function renderChampions() {
  const section = document.getElementById('championsSection');
  const grid    = document.getElementById('championsGrid');
  if (!section || !grid) return;
  if (typeof photos === 'undefined' || !Array.isArray(photos)) { section.style.display = 'none'; return; }

  const champs = photos.filter(p => p.category === 'champions');
  if (champs.length === 0) {
    /* 写真がまだ無いときはセクションごと隠す */
    section.style.display = 'none';
    grid.innerHTML = '';
    return;
  }

  section.style.display = 'block';
  grid.innerHTML = champs.map(photo => `
    <div class="champions-item${photo.caption ? ' has-title' : ''}"
         onclick="openLightbox('${photo.src}')">
      <img src="${photo.src}" alt="${photo.caption || '栄光の記録'}">
      ${photo.caption
        ? `<div class="champions-label">🏆 <strong>${photo.caption}</strong></div>`
        : ''}
    </div>`).join('');
}

function filterGallery(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderGallery();
}

/* クラブ紹介・メンバー募集の写真ストリップを表示
   - photos配列（data.js管理・GAS自動更新）から特定カテゴリの写真を取得
   - 横スクロールで複数枚を表示
   - 写真をタップで拡大表示（lightboxOpenを使用） */
function renderSectionPhotos() {
  renderSectionPhotoStrip('aboutPhoto',   'groupphoto',  '集合写真・練習風景');
  renderSectionPhotoStrip('recruitPhoto', 'interaction', '練習・交流の様子');
}

function renderSectionPhotoStrip(elId, category, altText) {
  const el = document.getElementById(elId);
  if (!el) return;

  // photos 配列から指定カテゴリだけ取り出し
  const list = (typeof photos !== 'undefined' && Array.isArray(photos))
    ? photos.filter(p => p.category === category)
    : [];

  // 見出しラベル（常に表示）
  const headerHtml = `
    <div style="
      flex:0 0 100%;
      width:100%;
      font-size:0.85rem;
      color:#4a5d8f;
      font-weight:700;
      letter-spacing:0.05em;
      margin-bottom:0.4rem;
      display:flex;align-items:center;gap:0.4rem;
    ">📸 ${altText}</div>`;

  if (list.length === 0) {
    // まだ写真がない場合は控えめなプレースホルダー
    el.style.flexWrap = 'wrap';
    el.innerHTML = headerHtml + `
      <div style="
        flex:1 1 100%;min-height:200px;display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        background:#e8edf8;border-radius:12px;color:#6b80c0;gap:0.5rem
      ">
        <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span style="font-size:0.85rem">写真は Google Drive に保存すると自動更新されます</span>
      </div>`;
    return;
  }

  // 見出し＋横スクロールギャラリーを生成
  el.style.flexWrap = 'wrap';
  el.innerHTML = headerHtml + `
    <div style="
      flex:1 1 100%;
      display:flex;
      gap:0.6rem;
      overflow-x:auto;
      overflow-y:hidden;
      padding:0.4rem 0;
      scroll-snap-type:x mandatory;
      -webkit-overflow-scrolling:touch;
    ">
      ${list.map(p => {
        const cap = (p.caption || '').replace(/'/g, "\\'");
        const catIcon = CATEGORY_ICONS[p.category] || '📸';
        const catName = CATEGORY_NAMES[p.category] || altText;
        return `
          <div style="
            flex:0 0 auto;
            width:280px;
            scroll-snap-align:start;
            position:relative;
            border-radius:12px;
            overflow:hidden;
            cursor:pointer;
            box-shadow:0 2px 8px rgba(0,0,0,0.08);
            transition:transform 0.2s;
          "
            onclick="openLightboxFromStrip('${p.src}','${cap || altText}')"
            onmouseover="this.style.transform='scale(1.02)'"
            onmouseout="this.style.transform='scale(1)'"
          >
            <img src="${p.src}"
              alt="${p.caption || altText}"
              loading="lazy"
              style="
                width:100%;height:210px;
                object-fit:cover;
                display:block;
              ">
            <div style="
              position:absolute;bottom:0;left:0;right:0;
              background:linear-gradient(transparent,rgba(0,0,0,0.75));
              color:white;
              font-size:0.76rem;
              padding:1.5rem 0.8rem 0.6rem;
              letter-spacing:0.03em;
            ">
              ${catIcon} ${catName}${p.caption
                ? `<br><strong style="font-size:0.85rem;letter-spacing:0.03em">${p.caption}</strong>`
                : ''}
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

/* セクション写真ストリップから拡大表示 */
function openLightboxFromStrip(src, caption) {
  if (typeof openLightbox === 'function') {
    openLightbox(src, caption);
  } else {
    // フォールバック：新タブで開く
    window.open(src, '_blank');
  }
}

/* お知らせ管理 */
function openNewsAdmin() {
  const modal = document.getElementById('newsAdminModal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.getElementById('newsAdminPwInput').value = '';
  document.getElementById('newsAdminPwError').style.display = 'none';
  document.getElementById('newsAdminPwBox').style.display = 'block';
  document.getElementById('newsAdminForm').style.display = 'none';
  // 今日の日付をデフォルト設定
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('newsDateInput').value = today;
}

function checkNewsAdminPw() {
  const pw = document.getElementById('newsAdminPwInput').value;
  if (pw !== window.ADMIN_PW) {
    document.getElementById('newsAdminPwError').style.display = 'block';
    return;
  }
  document.getElementById('newsAdminPwBox').style.display = 'none';
  document.getElementById('newsAdminForm').style.display = 'block';
}

function closeNewsAdmin() {
  document.getElementById('newsAdminModal').style.display = 'none';
}

async function generateNewsCode() {
  const cat  = document.getElementById('newsCatInput').value;
  const date = document.getElementById('newsDateInput').value;
  const text = document.getElementById('newsTextInput').value.trim();
  if (!date || !text) { alert('日付と内容を入力してください'); return; }

  const dateFormatted = date.replace(/-/g, '/');
  const btn = document.querySelector('#newsAdminForm button');
  btn.textContent = '送信中…';
  btn.disabled = true;

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: window.ADMIN_PW,
        item: { date: dateFormatted, cat, text }
      })
    });
    // no-corsのため成功とみなす
    document.getElementById('newsAdminModal').style.display = 'none';
    alert('✅ お知らせを追加しました！\n数秒後にサイトに反映されます。');
    // 30秒後にページをリロードして反映
    setTimeout(() => location.reload(), 30000);
  } catch(err) {
    alert('送信に失敗しました。もう一度お試しください。');
    btn.textContent = '📋 追加する';
    btn.disabled = false;
  }
}

/* お問い合わせフォーム送信処理 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('contactSubmitBtn');
    btn.innerHTML = '送信中…';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    const formData = new FormData(form);

    try {
      await fetch('https://ssgform.com/s/B1WNrmDL1EGa', {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
      form.reset();
      const success = document.getElementById('contactSuccess');
      success.style.display = 'block';
      btn.style.display = 'none';
      document.getElementById('contact').scrollIntoView({ behavior:'smooth', block:'start' });

      // セクション全体をクリック・タップしたら完了メッセージを非表示にして再送信可能に
      const contactSection = document.getElementById('contact');
      contactSection.addEventListener('click', function resetForm() {
        success.style.display = 'none';
        btn.innerHTML = '<span style="font-size:1.2rem">✉️</span> 送信する';
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.display = 'inline-flex';
        contactSection.removeEventListener('click', resetForm);
      }, { once: true });

    } catch(err) {
      alert('送信に失敗しました。メールにてご連絡ください。\nhakusan.large@gmail.com');
      btn.innerHTML = '<span style="font-size:1.2rem">✉️</span> 送信する';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });
}


/* ------------------------------------------------------------
   3. ライトボックス
   ------------------------------------------------------------ */
function openLightbox(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}


/* ------------------------------------------------------------
   4. 体験・見学ボタン
   ------------------------------------------------------------ */
function goContact() {
  /* 体験・見学ボタンはGoogleフォームに直接遷移 */
  window.open(
    'https://docs.google.com/forms/d/e/1FAIpQLSft4GetOiYW7qnZiy1DhTvz846pmFXtu3IEvDC1tgPrk52j3Q/viewform?usp=dialog',
    '_blank'
  );
}


/* ------------------------------------------------------------
   5. 部員カレンダー
   ------------------------------------------------------------ */
function showCalRoleBadge() {
  const badge = document.getElementById('calRoleBadge');
  if (!badge) return;
  badge.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:stretch">
      <div style="flex:1;min-width:220px;background:linear-gradient(135deg,rgba(66,133,244,0.1),rgba(66,133,244,0.05));
                  border:2px solid rgba(66,133,244,0.3);border-radius:12px;padding:1.1rem 1.3rem">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.7rem">
          <span style="background:#4285f4;color:white;font-size:0.7rem;font-weight:700;
                       padding:0.2rem 0.7rem;border-radius:20px;letter-spacing:0.08em">🏓 部員</span>
          <span style="font-size:0.85rem;font-weight:700;color:var(--text-dark)">専用カレンダー</span>
        </div>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:0.4rem">
          <li style="font-size:0.82rem;color:var(--text-mid);display:flex;align-items:center;gap:0.4rem">
            <span style="color:#4caf50;font-weight:700">✅</span> カレンダーの閲覧
          </li>
          <li style="font-size:0.82rem;color:var(--text-mid);display:flex;align-items:center;gap:0.4rem">
            <span style="color:#ef5350;font-weight:700">❌</span> 予定の追加・修正・削除（役員のみ）
          </li>
        </ul>
      </div>
      <div style="flex:1;min-width:220px;background:rgba(66,133,244,0.05);
                  border:1px solid rgba(66,133,244,0.2);border-radius:12px;padding:1.1rem 1.3rem">
        <p style="font-size:0.78rem;font-weight:700;color:#1565c0;margin-bottom:0.5rem">ℹ️ ご注意</p>
        <p style="font-size:0.8rem;color:var(--text-mid);line-height:1.8">
          予定の追加・変更・削除は役員が行います。スケジュールへのご要望は役員までお伝えください。
        </p>
      </div>
    </div>`;
}

function checkCalPw() {
  const pw = document.getElementById('calPwInput').value;
  if (pw !== window.MEMBER_PW) {
    document.getElementById('calPwError').style.display = 'block';
    document.getElementById('calPwInput').value = '';
    return;
  }
  document.getElementById('calPwBox').style.display   = 'none';
  document.getElementById('calPwError').style.display = 'none';
  const area = document.getElementById('calendarArea');
  area.style.display = 'block';
  showCalRoleBadge();
  setTimeout(() => area.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  sessionStorage.setItem('calAuth', 'member');
}

function lockCalendar() {
  sessionStorage.removeItem('calAuth');
  document.getElementById('calendarArea').style.display = 'none';
  document.getElementById('calPwInput').value           = '';
  document.getElementById('calPwBox').style.display     = 'block';
  const badge = document.getElementById('calRoleBadge');
  if (badge) badge.innerHTML = '';
}


/* ------------------------------------------------------------
   6. クラブマップ（Orange HUB）
   ------------------------------------------------------------ */
const CLUB_DATA = [];

function openMap(lat, lng, name) {
  const modal = document.getElementById('mapChoiceModal');
  const label = document.getElementById('mapChoiceName');
  label.textContent = name;
  modal.style.display = 'flex';
  modal._lat  = lat;
  modal._lng  = lng;
  modal._name = name;
}

function chooseMap(type) {
  const modal = document.getElementById('mapChoiceModal');
  const { _lat: lat, _lng: lng, _name: name } = modal;
  let url;
  if (type === 'google') {
    url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  } else if (type === 'apple') {
    url = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name)}`;
  }
  window.open(url, '_blank');
  modal.style.display = 'none';
}

function closeMapModal() {
  document.getElementById('mapChoiceModal').style.display = 'none';
}

/* ------------------------------------------------------------
   クラブ追加申請モーダル
   ------------------------------------------------------------ */

/* Googleフォームを使う場合はこのURLを設定する（管理者が作成後に差し替え） */
const CLUB_REQUEST_GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdh5a2jeOYRH8N2zGlx_wnTTcTPisSnkg5Cqa0wPKuwVJbO1g/viewform?usp=publish-editor';

function openClubRequestModal() {
  const modal = document.getElementById('clubRequestModal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeClubRequestModal() {
  const modal = document.getElementById('clubRequestModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

/* 白山クラブの座標（初期表示の中心） */
const HAKUSAN_LAT = 36.5134;
const HAKUSAN_LNG = 136.5625;

/* クラブテーブルのフィルタ状態 */
let _filteredRows = [];

function flyToClub(lat, lng) {
  /* 地図インスタンスが生成済みなら即移動、まだなら待機 */
  function doFly() {
    const map = window._clubLeafletMap;
    if (!map) { setTimeout(doFly, 150); return; }
    map.flyTo([lat, lng], 15, { duration: 1.0 });
    /* マーカー参照テーブルからポップアップを開く */
    const key = lat + ',' + lng;
    if (window._clubMarkers && window._clubMarkers[key]) {
      window._clubMarkers[key].openPopup();
    }
  }
  doFly();
}

function initClubMap() {
  document.querySelectorAll('#clubTableBody tr[data-lat]').forEach(row => {
    CLUB_DATA.push({
      lat:     parseFloat(row.dataset.lat),
      lng:     parseFloat(row.dataset.lng),
      name:    row.dataset.name,
      address: row.dataset.address,
      region:  row.dataset.region,
    });
  });
  _filteredRows = Array.from(document.querySelectorAll('#clubTableBody tr[data-lat]'));
  renderTablePage(1);
  buildMap(CLUB_DATA);   /* 地図は1回だけ生成 */
}

function renderTablePage(page) {
  const total = _filteredRows.length;

  // 全件をスクロール表示（3件超はラップdivでスクロール）
  document.querySelectorAll('#clubTableBody tr[data-lat]').forEach(r => r.style.display = 'none');
  _filteredRows.forEach((r) => { r.style.display = ''; });

  const noResult = document.getElementById('noClubResult');
  if (noResult) noResult.style.display = total === 0 ? 'block' : 'none';
}

/* ---- 地図の初回生成（以後は再生成しない） ---- */
function buildMap(clubs) {
  const mapDiv = document.getElementById('clubMap');
  if (!mapDiv) return;

  mapDiv.innerHTML = '<div id="leafletMap" style="width:100%;height:100%"></div>';

  if (!document.getElementById('leafletCSS')) {
    const css = document.createElement('link');
    css.id = 'leafletCSS'; css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);
  }

  function initLeaflet() {
    if (typeof L === 'undefined') { setTimeout(initLeaflet, 200); return; }

    const map = L.map('leafletMap', {
      zoomControl: true, scrollWheelZoom: false, dragging: false,
    }).setView([HAKUSAN_LAT, HAKUSAN_LNG], 11);
    window._clubLeafletMap = map;
    window._clubMarkers    = {};   /* key: "lat,lng" → marker */

    /* クリックで操作を有効化するオーバーレイ */
    const mapEl   = document.getElementById('leafletMap');
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;z-index:999;background:rgba(0,0,0,0);cursor:pointer;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:rgba(0,0,0,0.5);color:white;padding:0.5rem 1rem;border-radius:50px;font-size:0.85rem;pointer-events:none;backdrop-filter:blur(4px)">🖱️ クリックして地図を操作</div>';
    mapEl.style.position = 'relative';
    mapEl.appendChild(overlay);
    const enableInteraction = () => { map.scrollWheelZoom.enable(); map.dragging.enable(); overlay.remove(); };
    overlay.addEventListener('click', enableInteraction);
    overlay.addEventListener('touchstart', enableInteraction, { passive: true });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    /* 全クラブのマーカーを追加してテーブルに保存 */
    updateMarkers(clubs);
  }

  if (!document.getElementById('leafletJS')) {
    const script = document.createElement('script');
    script.id = 'leafletJS';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = initLeaflet;
    document.head.appendChild(script);
  } else {
    initLeaflet();
  }
}

/* ---- マーカーだけ差し替え（地図インスタンスは使い回す） ---- */
function updateMarkers(clubs) {
  const map = window._clubLeafletMap;
  if (!map) { setTimeout(() => updateMarkers(clubs), 150); return; }

  /* 既存マーカーをすべて削除 */
  if (window._clubMarkers) {
    Object.values(window._clubMarkers).forEach(m => map.removeLayer(m));
  }
  window._clubMarkers = {};

  if (clubs.length === 0) return;

  const orangeIcon = L.divIcon({
    html: '<div style="width:28px;height:28px;background:#ff7a00;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
    iconSize:[28,28], iconAnchor:[14,28], popupAnchor:[0,-30], className:'',
  });
  const hakusanIcon = L.divIcon({
    html: '<div style="width:32px;height:32px;background:#ff3d00;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 10px rgba(255,61,0,0.6)"></div>',
    iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-34], className:'',
  });

  clubs.forEach(club => {
    const isHakusan = club.lat === HAKUSAN_LAT && club.lng === HAKUSAN_LNG;
    const marker = L.marker([club.lat, club.lng], { icon: isHakusan ? hakusanIcon : orangeIcon })
      .addTo(map)
      .bindPopup(
        `<b style="color:${isHakusan?'#ff3d00':'#ff7a00'}">${club.name}${isHakusan?' ⭐':''}</b><br>` +
        `<span style="font-size:0.85em">${club.address}</span>`
      );
    window._clubMarkers[club.lat + ',' + club.lng] = marker;
  });

  /* 初期表示：白山クラブのポップアップを自動で開く */
  const hakusanKey = HAKUSAN_LAT + ',' + HAKUSAN_LNG;
  if (window._clubMarkers[hakusanKey]) {
    window._clubMarkers[hakusanKey].openPopup();
  }
}

/* renderMap は後方互換のために残す（updateMarkersに委譲） */
function renderMap(clubs, centerLat, centerLng, zoom) {
  const map = window._clubLeafletMap;
  if (!map) return;
  updateMarkers(clubs);
  if (centerLat != null) {
    map.flyTo([centerLat, centerLng], zoom ?? 11, { duration: 0.8 });
  }
}

function showClubInfoTab(tab, clickedBtn) {
  ['about', 'schedule', 'gallery'].forEach(t => {
    const panel = document.getElementById('clubinfo-' + t);
    if (panel) panel.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.clubinfo-tab').forEach(btn => btn.classList.remove('active'));
  if (clickedBtn) clickedBtn.classList.add('active');
  if (tab === 'gallery') renderGallery();
  /* クラブ案内がフォーカス表示中なら、URL欄を共有可能な形に更新（再読み込みなし） */
  if (document.body.classList.contains('focus-mode') && tab !== 'gallery') {
    history.replaceState(
      { focusMode: true, sectionId: 'clubinfo' },
      '',
      '?view=clubinfo&tab=' + tab
    );
  }
}

/* ============================================================
   フォーカスモード
   ============================================================ */
function enterFocusMode(sectionId, playVideo) {
  document.querySelectorAll('section').forEach(sec => sec.classList.remove('focus-target'));
  const target = document.getElementById(sectionId);
  if (!target) return;
  target.classList.add('focus-target');
  document.body.classList.add('focus-mode');
  window.scrollTo({ top: 0, behavior: 'instant' });
  const initialUrl = sectionId === 'clubinfo' ? '?view=clubinfo&tab=about' : '?view=' + sectionId;
  history.pushState({ focusMode: true, sectionId }, '', initialUrl);
  const exitBtn       = document.getElementById('focusExitBtn');
  const backToTopWrap = document.getElementById('backToTopWrap');
  if (exitBtn)       exitBtn.classList.add('visible');
  if (backToTopWrap) backToTopWrap.style.display = 'none';
  if (sectionId === 'community') {
    /* ORANGE HUB を開いた時はメニューカード表示状態に戻す */
    if (typeof closeOrangeSection === 'function') closeOrangeSection();
    if (playVideo) {
      /* メニュー選択時のみ動画あり・音声あり・球アニメありで再生 */
      setTimeout(() => {
        if (window._communityPlayWithVideo) window._communityPlayWithVideo();
      }, 50);
    } else {
      /* 外部ページから戻った時は動画も球アニメも流さず即コンテンツ表示 */
      setTimeout(() => {
        if (window._communityShowInstant) window._communityShowInstant();
      }, 50);
    }
  }
}

function exitFocusMode() {
  document.body.classList.remove('focus-mode');
  document.querySelectorAll('section').forEach(sec => sec.classList.remove('focus-target'));
  const exitBtn       = document.getElementById('focusExitBtn');
  const backToTopWrap = document.getElementById('backToTopWrap');
  if (exitBtn)       exitBtn.classList.remove('visible');
  /* クラブ案内に戻るフロートボタンも隠す */
  const clubinfoBack = document.getElementById('clubinfoBackFloat');
  if (clubinfoBack) clubinfoBack.style.display = 'none';
  if (backToTopWrap) {
    backToTopWrap.style.display  = 'flex';
    /* トップへ戻るためscrollY=0→ボタンは非表示が正しい */
    backToTopWrap.style.opacity       = '0';
    backToTopWrap.style.transform     = 'translateY(20px)';
    backToTopWrap.style.pointerEvents = 'none';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', location.pathname);
}

/* ORANGE HUB のメニューカードから各セクションを開く */
function openOrangeSection(section) {
  // メニューカードを隠す
  const menu = document.getElementById('orangeHubMenu');
  if (menu) menu.style.display = 'none';

  // タイトル類を隠す
  const headline = document.getElementById('orangeHubHeadline');
  if (headline) headline.style.display = 'none';
  const title = document.getElementById('orangeHubTitle');
  if (title) title.style.display = 'none';

  // コンテンツエリアを表示
  const area = document.getElementById('orangeHubContentArea');
  if (area) area.style.display = 'block';

  // フローティング戻るボタンを表示
  const backFloat = document.getElementById('orangeHubBackFloat');
  if (backFloat) backFloat.style.display = 'flex';

  // 該当セクション以外を隠す
  const sectionMap = {
    map:      'community-map',
    voices:   'community-voices',
    omake:    'community-omake',
    deepdive: 'community-deepdive',
  };
  Object.keys(sectionMap).forEach(s => {
    const el = document.getElementById(sectionMap[s]);
    if (el) el.style.display = s === section ? 'block' : 'none';
  });

  // 地図を初期化・再描画
  if (section === 'map') {
    setTimeout(() => {
      // 既存の地図があればサイズを再計算（display:noneだった後の表示修正）
      if (window._clubLeafletMap && typeof window._clubLeafletMap.invalidateSize === 'function') {
        window._clubLeafletMap.invalidateSize();
      } else if (typeof renderMap === 'function' && typeof CLUB_DATA !== 'undefined') {
        // 地図がまだ作られていない場合は新規作成
        const centerLat = typeof HAKUSAN_LAT !== 'undefined' ? HAKUSAN_LAT : 36.5134;
        const centerLng = typeof HAKUSAN_LNG !== 'undefined' ? HAKUSAN_LNG : 136.5625;
        renderMap(CLUB_DATA, centerLat, centerLng, 11);
      }
    }, 150);
  }

  // ORANGE HUB セクションの上部にスクロール
  const community = document.getElementById('community');
  if (community) {
    setTimeout(() => {
      community.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

/* ORANGE HUB のメニュー画面に戻る */
function closeOrangeSection() {
  // すべてのサブセクションを隠す
  ['community-map', 'community-voices', 'community-omake', 'community-deepdive'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // コンテンツエリアを隠す
  const area = document.getElementById('orangeHubContentArea');
  if (area) area.style.display = 'none';

  // フローティング戻るボタンを隠す
  const backFloat = document.getElementById('orangeHubBackFloat');
  if (backFloat) backFloat.style.display = 'none';

  // メニューカードを表示
  const menu = document.getElementById('orangeHubMenu');
  if (menu) menu.style.display = 'grid';

  // タイトル類を再表示
  const headline = document.getElementById('orangeHubHeadline');
  if (headline) headline.style.display = 'block';
  const title = document.getElementById('orangeHubTitle');
  if (title) title.style.display = 'flex';

  // ORANGE HUB セクションの上部にスクロール
  const community = document.getElementById('community');
  if (community) {
    community.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function filterClubs(region, clickedBtn) {
  document.querySelectorAll('.region-btn').forEach(btn => {
    const active = btn.dataset.region === region;
    btn.style.background  = active ? '#ff7a00' : 'rgba(255,120,0,0.15)';
    btn.style.color       = active ? 'white'   : '#ff7a00';
    btn.style.borderColor = active ? '#ff7a00' : 'rgba(255,120,0,0.3)';
  });

  const allRows = Array.from(document.querySelectorAll('#clubTableBody tr[data-lat]'));
  _filteredRows = region === 'all' ? allRows : allRows.filter(r => r.dataset.region === region);
  renderTablePage(1);

  const filtered  = region === 'all' ? CLUB_DATA : CLUB_DATA.filter(c => c.region === region);
  const centerLat = region === 'all' ? HAKUSAN_LAT : (filtered.length ? filtered.reduce((s,c)=>s+c.lat,0)/filtered.length : HAKUSAN_LAT);
  const centerLng = region === 'all' ? HAKUSAN_LNG : (filtered.length ? filtered.reduce((s,c)=>s+c.lng,0)/filtered.length : HAKUSAN_LNG);
  const zoom      = region === 'all' ? 11 : (filtered.length === 1 ? 13 : 8);
  renderMap(filtered.length ? filtered : CLUB_DATA, centerLat, centerLng, zoom);
}



/* ------------------------------------------------------------
   7. Deep Dive ビューア（記事・PDF・動画）
   ------------------------------------------------------------ */
const VIDEO_YOUTUBE_ID = 'sdSuF4Kr8kM';

// ※ articleHTML は長い文字列のため、別途 HTML 側の <script> で定義されています
// ※ pdfPages 配列は images.js の IMG_5〜IMG_19 を参照します

let currentPdfPage = 0;

function openViewer(type) {
  const modal   = document.getElementById('viewerModal');
  const content = document.getElementById('modalContent');
  const footer  = document.getElementById('pdfNavFooter');

  /* flexで画面全体を占有 */
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  /* PDF以外はフッターを隠す */
  if (footer) footer.style.display = 'none';

  /* 訂正バナーをリセット */
  const existingBanner = document.getElementById('pdfCorrectionBanner');
  if (existingBanner) existingBanner.remove();

  if (type === 'pdf') {
    document.getElementById('modalTitle').textContent = '📊 ラージボール卓球 戦術と技術の解体新書';
    currentPdfPage = 0;

    /* 訂正バナーをヘッダー直下に挿入（折り畳み式） */
    const header = document.getElementById('viewerHeader');
    const banner = document.createElement('div');
    banner.id = 'pdfCorrectionBanner';
    banner.style.cssText = 'flex-shrink:0;background:#7f1d1d;border-bottom:1px solid #ef4444;padding:0.5rem 1.2rem;cursor:pointer;user-select:none;';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.6rem;" onclick="toggleCorrectionBanner()">
        <span style="font-size:1rem;flex-shrink:0">⚠️</span>
        <span style="color:#fca5a5;font-weight:700;font-size:0.82rem;flex:1">【訂正】サーブのトスルールについて</span>
        <span id="correctionChevron" style="color:#fca5a5;font-size:0.75rem;transition:transform 0.2s">▼ 詳細</span>
      </div>
      <div id="correctionDetail" style="display:none;padding:0.5rem 0 0.2rem 1.8rem;
           color:rgba(255,255,255,0.85);font-size:0.8rem;line-height:1.75">
        本資料の比較表に「トスルール：制限なし」との記載がありますが、
        <strong style="color:#fca5a5">これは誤りです。</strong>
        現在のルールでは<strong style="color:#fef08a">硬式と同様に16cm以上のトスが必要</strong>です。
      </div>`;
    header.insertAdjacentElement('afterend', banner);

    content.innerHTML = '<div id="pdfSlideArea" style="text-align:center;max-width:860px;margin:0 auto;"></div>';
    if (footer) footer.style.display = 'block';
    renderPdfPage();

  } else if (type === 'video') {
    document.getElementById('modalTitle').textContent = '🎬 ラージボール卓球の謎を解き明かす';
    content.innerHTML = `
      <div style="max-width:860px;margin:0 auto;text-align:center;padding:2rem 0">
        <img src="https://img.youtube.com/vi/${VIDEO_YOUTUBE_ID}/maxresdefault.jpg"
             style="width:100%;max-width:800px;border-radius:12px;display:block;margin:0 auto 1.5rem;cursor:pointer"
             onclick="window.open('https://youtu.be/${VIDEO_YOUTUBE_ID}','_blank')"
             onerror="this.src='https://img.youtube.com/vi/${VIDEO_YOUTUBE_ID}/hqdefault.jpg'">
        <a href="https://youtu.be/${VIDEO_YOUTUBE_ID}" target="_blank" rel="noopener"
           style="display:inline-flex;align-items:center;gap:0.7rem;background:#ff0000;color:#fff;
                  font-size:1.1rem;font-weight:700;padding:0.9rem 2rem;border-radius:50px;
                  text-decoration:none;box-shadow:0 4px 15px rgba(255,0,0,0.4)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
                     10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8
                     8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          YouTubeで動画を見る
        </a>
      </div>`;

  } else if (type === 'article') {
    document.getElementById('modalTitle').textContent = '📝 ただの「大きいピンポン」じゃない。5つの衝撃';
    content.innerHTML = `<div style="max-width:720px;margin:0 auto">${window.articleHTML || ''}</div>`;
  }
}

function toggleCorrectionBanner() {
  const detail   = document.getElementById('correctionDetail');
  const chevron  = document.getElementById('correctionChevron');
  if (!detail) return;
  const open = detail.style.display === 'none';
  detail.style.display  = open ? 'block' : 'none';
  chevron.textContent   = open ? '▲ 閉じる' : '▼ 詳細';
  /* バナー開閉後に画像高さを再計算 */
  renderPdfPage();
}

function renderPdfPage() {
  const pages     = window.pdfPages || [];
  const slideArea = document.getElementById('pdfSlideArea');
  const dots      = document.getElementById('pdfDots');
  const prevBtn   = document.getElementById('pdfPrevBtn');
  const nextBtn   = document.getElementById('pdfNextBtn');
  const label     = document.getElementById('pdfPageLabel');
  if (!slideArea) return;

  /* ヘッダー・バナー・フッターの実高さを動的に取得して画像高さを決定 */
  const headerH = (document.getElementById('viewerHeader')?.offsetHeight     || 56);
  const bannerH = (document.getElementById('pdfCorrectionBanner')?.offsetHeight || 0);
  const footerH = (document.getElementById('pdfNavFooter')?.offsetHeight      || 90);
  const padding = 24; /* content padding上下 */
  const imgMaxH = `calc(100dvh - ${headerH + bannerH + footerH + padding}px)`;

  /* スライド画像 */
  slideArea.innerHTML = `
    <img src="${pages[currentPdfPage]}"
         style="width:100%;max-width:860px;height:auto;max-height:${imgMaxH};
                object-fit:contain;border-radius:8px;border:1px solid rgba(255,255,255,0.1);
                display:block;margin:0 auto;">`;

  /* ページ番号ドット（フッター内） */
  if (dots) {
    dots.innerHTML = pages.map((_, i) => `
      <button onclick="jumpPdfPage(${i})"
        style="width:26px;height:26px;border-radius:50%;
               border:2px solid ${i === currentPdfPage ? '#ffca28' : 'rgba(255,255,255,0.3)'};
               background:${i === currentPdfPage ? '#ffca28' : 'transparent'};
               color:${i === currentPdfPage ? '#000' : 'white'};
               cursor:pointer;font-size:0.72rem;padding:0;line-height:1;
               transition:all 0.15s">${i + 1}</button>`).join('');
  }

  /* ページラベル・ボタン有効無効 */
  if (label)   label.textContent     = `${currentPdfPage + 1} / ${pages.length}`;
  if (prevBtn) prevBtn.disabled      = currentPdfPage === 0;
  if (nextBtn) nextBtn.disabled      = currentPdfPage === pages.length - 1;
  if (prevBtn) prevBtn.style.opacity = currentPdfPage === 0 ? '0.4' : '1';
  if (nextBtn) nextBtn.style.opacity = currentPdfPage === pages.length - 1 ? '0.4' : '1';

  const content = document.getElementById('modalContent');
  if (content) content.scrollTop = 0;
}

function changePdfPage(dir) {
  const pages = window.pdfPages || [];
  currentPdfPage = Math.max(0, Math.min(pages.length - 1, currentPdfPage + dir));
  renderPdfPage();
}

function jumpPdfPage(n) {
  currentPdfPage = n;
  renderPdfPage();
}

function closeViewer() {
  const modal  = document.getElementById('viewerModal');
  const footer = document.getElementById('pdfNavFooter');
  const banner = document.getElementById('pdfCorrectionBanner');
  modal.style.display  = 'none';
  if (footer) footer.style.display = 'none';
  if (banner) banner.remove();
  document.body.style.overflow = '';
  document.getElementById('modalContent').innerHTML = '';
}


/* ------------------------------------------------------------
   8. 豆知識ガチャ
   ------------------------------------------------------------ */
const TRIVIAS = [
  { text: 'ラージボールの直径は44mm。硬式（40mm）より4mm大きいだけで空気抵抗が約21%も増える！',              isLie: false },
  { text: 'ラージボールのネットは硬式より2cm高い17.25cm。たった2cmがプレーを大きく変える！',               isLie: false },
  { text: 'ラージボールは表ソフトラバーのみ使用可能。裏ソフトは使えない！',                                   isLie: false },
  { text: 'ラージボールは1988年に日本で生まれた「新卓球」が起源！',                                          isLie: false },
  { text: 'ラージボールのサーブにトス制限はなく、どんな高さからでも打てる！',                                  isLie: true  },
  { text: 'ラージボールの重さは約2.2〜2.4g。硬式（2.7g）より軽いため回転が持続しにくい！',                    isLie: false },
  { text: 'ラージボールの色はオレンジのみ。白いラージボールは公式大会では使えない！',                          isLie: false },
  { text: '白山クラブは毎週月・水曜日に練習している。年間の練習回数は約100回！',                               isLie: false },
  { text: 'ラージボールは世界選手権が開催される国際公式競技として認定されている！',                            isLie: true  },
  { text: 'ラージボールは空気抵抗が大きいため、一撃でポイントを取ることが物理的に難しい！',                    isLie: false },
];
let currentTrivia = null;

function drawTrivia() {
  currentTrivia = TRIVIAS[Math.floor(Math.random() * TRIVIAS.length)];
  const box = document.getElementById('triviaBox');
  const ans = document.getElementById('triviaAnswer');
  box.innerHTML = `<p style="color:#4a2200;font-size:0.9rem;line-height:1.8;font-weight:500">${currentTrivia.text}</p>`;
  ans.style.display = 'none';
  document.getElementById('trueBtn').style.display = 'inline-block';
  document.getElementById('lieBtn').style.display  = 'inline-block';
}

function answerTrivia(userSaysTrue) {
  if (!currentTrivia) return;
  const ans     = document.getElementById('triviaAnswer');
  const correct = userSaysTrue === !currentTrivia.isLie;
  if (correct) {
    ans.style.background = 'rgba(76,175,80,0.15)';
    ans.style.color      = '#2e7d32';
    ans.style.border     = '1px solid #4caf50';
    ans.innerHTML        = currentTrivia.isLie
      ? '❌ 正解！これは嘘でした！現在のラージボールもサーブは16cm以上のトスが必要です😄'
      : '✅ 正解！本当のことでした！さすが！';
  } else {
    ans.style.background = 'rgba(239,83,80,0.15)';
    ans.style.color      = '#c62828';
    ans.style.border     = '1px solid #ef5350';
    ans.innerHTML        = currentTrivia.isLie
      ? '😅 残念！実はこれが嘘でした！騙されましたね〜'
      : '😅 残念！これは本当のことでした！もう一回！';
  }
  ans.style.display = 'block';
  document.getElementById('trueBtn').style.display = 'none';
  document.getElementById('lieBtn').style.display  = 'none';
}


/* ------------------------------------------------------------
   9. 今日の卓球運勢
   ------------------------------------------------------------ */
const FORTUNES = [
  { rank:'大吉', emoji:'🌟', msg:'バックハンドが神がかり的に冴える日！思い切って打ちまくれ！',            color:'#ffca28' },
  { rank:'中吉', emoji:'😊', msg:'フットワークが軽い一日。コートを縦横無尽に走り回れ！',                  color:'#66bb6a' },
  { rank:'小吉', emoji:'🙂', msg:'サーブが決まる予感。今日はサーブ練習に集中せよ！',                      color:'#42a5f5' },
  { rank:'吉',   emoji:'😐', msg:'ネットに嫌われる日。でも笑顔でラリーを楽しもう！',                      color:'#78909c' },
  { rank:'末吉', emoji:'😅', msg:'ボールが手に吸い付かない日。用具のメンテナンスをしよう！',               color:'#8d6e63' },
  { rank:'凶',   emoji:'😱', msg:'今日は卓球より観戦日和。YouTubeで上手い人の動画を見よう！',              color:'#ef5350' },
  { rank:'大吉', emoji:'🏆', msg:'今日のあなたは無敵！ラリーが全部入る気がする！練習に行け！',             color:'#ffca28' },
  { rank:'中吉', emoji:'🎯', msg:'狙ったコースに決まる日。コース練習で磨きをかけよう！',                   color:'#66bb6a' },
  { rank:'吉',   emoji:'😄', msg:'チームワークが上がる日。仲間と楽しく練習すれば最高！',                   color:'#ab47bc' },
  { rank:'小吉', emoji:'💪', msg:'体が軽い日！いつもより少し多く走れる気がする！',                        color:'#42a5f5' },
  { rank:'末吉', emoji:'🤔', msg:'今日は頭で考える日。戦術書でも読みましょう！',                          color:'#8d6e63' },
  { rank:'凶',   emoji:'😴', msg:'眠気MAX。今日は早く寝て明日に備えよう！明日は絶対大吉！',                color:'#ef5350' },
];

function drawFortune() {
  const today = new Date();
  const seed  = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const f     = FORTUNES[seed % FORTUNES.length];
  document.getElementById('fortuneBox').innerHTML = `
    <div style="font-size:2.5rem;margin-bottom:0.5rem">${f.emoji}</div>
    <div style="font-family:'Oswald',sans-serif;font-size:1.6rem;font-weight:700;
                color:${f.color};margin-bottom:0.6rem">${f.rank}</div>
    <p style="color:#4a2200;font-size:0.85rem;line-height:1.8;font-weight:500">${f.msg}</p>
    <p style="color:#8a4d1d;font-size:0.7rem;margin-top:0.6rem">
      ${today.getMonth() + 1}月${today.getDate()}日の運勢
    </p>`;
}


/* ------------------------------------------------------------
   10. ラケット音
   ------------------------------------------------------------ */
const RACKET_EMOJIS = ['🏓', '💥', '⚡', '✨', '🎯'];
let rallyCount    = 0;
let rallyInterval = null;

function playRacketSound() {
  rallyCount++;

  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.type = 'sine';
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) { /* 音声APIが使えない環境では無視 */ }

  const emoji = document.getElementById('soundEmoji');
  const wave  = document.getElementById('soundWave');
  const count = document.getElementById('soundCount');
  if (emoji) {
    emoji.textContent  = RACKET_EMOJIS[rallyCount % RACKET_EMOJIS.length];
    emoji.style.transform = 'scale(1.5)';
    setTimeout(() => { emoji.style.transform = 'scale(1)'; }, 150);
  }
  if (wave) {
    wave.style.display   = 'block';
    wave.style.animation = 'none';
    setTimeout(() => { wave.style.animation = 'soundPulse 0.4s ease-out forwards'; }, 10);
  }
  if (count) {
    let msg = `ラリー回数：${rallyCount}回`;
    if      (rallyCount === 10)  msg += ' 🎉 10回達成！';
    else if (rallyCount === 30)  msg += ' 🔥 30回！すごい！';
    else if (rallyCount === 50)  msg += ' 🏆 50回！プロ並み！';
    else if (rallyCount === 100) msg += ' 👑 100回！白山クラブ入会資格あり！';
    count.textContent = msg;
  }
}

function startRally() {
  const btn = document.getElementById('rallyBtn');
  if (rallyInterval) {
    clearInterval(rallyInterval);
    rallyInterval = null;
    if (btn) { btn.textContent = '🔄 連続ラリー'; btn.style.background = 'rgba(255,255,255,0.1)'; }
  } else {
    if (btn) { btn.textContent = '⏹️ 止める'; btn.style.background = 'rgba(255,87,34,0.3)'; }
    rallyInterval = setInterval(playRacketSound, 400);
  }
}


/* ------------------------------------------------------------
   11. ヒーローアニメーション
   ------------------------------------------------------------ */
let heroAnimActive = false;
let heroAnimFrame  = null;
let heroAnimTimer  = null;

function launchHeroAnim() {
  const section = document.getElementById('heroSection');
  const canvas  = document.getElementById('heroCanvas');
  if (!section || !canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = section.offsetWidth;
  canvas.height = section.offsetHeight;
  canvas.style.display = 'block';

  if (heroAnimActive) {
    heroAnimActive = false;
    cancelAnimationFrame(heroAnimFrame);
    clearTimeout(heroAnimTimer);
  }
  heroAnimActive = true;
  const W = canvas.width, H = canvas.height;
  const items = [];

  class Ball {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() < 0.5 ? -30 : W + 30;
      this.y = Math.random() * H;
      this.r = Math.random() * 18 + 10;
      const dir = this.x < 0 ? 1 : -1;
      this.vx    = dir * (Math.random() * 8 + 5);
      this.vy    = (Math.random() - 0.5) * 6;
      this.spin  = (Math.random() - 0.5) * 0.2;
      this.angle = 0;
      this.life  = 1;
      this.decay = Math.random() * 0.004 + 0.002;
      this.color = Math.random() < 0.7 ? '#ff7043' : '#ffca28';
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.angle += this.spin; this.life -= this.decay;
      if (this.life <= 0 || this.x < -60 || this.x > W + 60) this.reset();
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.life * 0.85;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const grad = ctx.createRadialGradient(-this.r * 0.3, -this.r * 0.3, this.r * 0.1, 0, 0, this.r);
      grad.addColorStop(0, this.color === '#ff7043' ? '#ffab91' : '#fff9c4');
      grad.addColorStop(1, this.color);
      ctx.fillStyle   = grad;
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = 15;
      ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, this.r, this.r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, this.r * 0.4, this.r, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  class SpeedLine {
    constructor() { this.reset(); }
    reset() {
      this.x     = Math.random() < 0.5 ? 0 : W;
      this.y     = Math.random() * H;
      const dir  = this.x === 0 ? 1 : -1;
      this.vx    = dir * (Math.random() * 20 + 15);
      this.len   = Math.random() * 120 + 60;
      this.life  = 1;
      this.decay = Math.random() * 0.06 + 0.04;
      this.width = Math.random() * 2 + 0.5;
      this.color = `hsl(${Math.random() < 0.5 ? 200 : 35},100%,70%)`;
    }
    update() {
      this.x += this.vx; this.life -= this.decay;
      if (this.life <= 0 || this.x < -200 || this.x > W + 200) this.reset();
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.life * 0.6;
      ctx.lineWidth   = this.width;
      ctx.shadowColor = this.color; ctx.shadowBlur = 6;
      const grad = ctx.createLinearGradient(this.x - Math.sign(this.vx) * this.len, this.y, this.x, this.y);
      grad.addColorStop(0, 'transparent'); grad.addColorStop(1, this.color);
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x - Math.sign(this.vx) * this.len, this.y);
      ctx.lineTo(this.x, this.y); ctx.stroke();
      ctx.restore();
    }
  }

  class Sparkle {
    constructor() { this.reset(); }
    reset() {
      this.x    = Math.random() * W; this.y = Math.random() * H;
      this.r    = Math.random() * 3 + 1;
      this.life = Math.random();
      this.decay = Math.random() * 0.02 + 0.005;
      this.grow = Math.random() < 0.5;
    }
    update() {
      this.grow ? (this.life += this.decay) : (this.life -= this.decay);
      if (this.life >= 1) this.grow = false;
      if (this.life <= 0) this.reset();
    }
    draw(ctx) {
      ctx.save(); ctx.globalAlpha = this.life * 0.7;
      ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r * this.life, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 8;  i++) items.push(new Ball());
  for (let i = 0; i < 25; i++) items.push(new SpeedLine());
  for (let i = 0; i < 40; i++) items.push(new Sparkle());

  function animate() {
    if (!heroAnimActive) return;
    ctx.clearRect(0, 0, W, H);
    items.forEach(item => { item.update(); item.draw(ctx); });
    heroAnimFrame = requestAnimationFrame(animate);
  }
  animate();

  if (heroAnimTimer) clearTimeout(heroAnimTimer);
  heroAnimTimer = setTimeout(() => {
    heroAnimActive = false;
    cancelAnimationFrame(heroAnimFrame);
    canvas.style.transition = 'opacity 1.5s';
    canvas.style.opacity    = '0';
    setTimeout(() => {
      canvas.style.display  = 'none';
      canvas.style.opacity  = '1';
    }, 1500);
  }, 12000);
}


/* ------------------------------------------------------------
   12. 花火アニメーション
   ------------------------------------------------------------ */
let fireworksActive = false;
let fireworksTimer  = null;
let animFrameId     = null;

function launchFireworks() {
  const section = document.getElementById('community-deepdive');
  const canvas  = document.getElementById('fireworksCanvas2') || document.getElementById('fireworksCanvas');
  if (!section || !canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = section.offsetWidth  || window.innerWidth;
  canvas.height = section.offsetHeight || window.innerHeight * 0.8;
  canvas.style.display = 'block';
  section.style.transition = 'background 1s';
  section.style.background = '#020818';
  fireworksActive = true;

  const particles = [];
  const COLORS    = ['#ff4444','#ff8c00','#ffca28','#44ff88','#44aaff','#cc44ff','#ff44cc','#ffffff','#ffff44','#ff88ff'];

  class Particle {
    constructor(x, y, color, isRocket = false) {
      this.x = x; this.y = y; this.color = color; this.isRocket = isRocket;
      if (isRocket) {
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -(Math.random() * 6 + 6);
        this.size = 3; this.life = 1; this.decay = 0.012; this.trail = [];
      } else {
        const angle = Math.random() * Math.PI * 2, speed = Math.random() * 5 + 1.5;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 3 + 1; this.life = 1;
        this.decay = Math.random() * 0.018 + 0.010; this.gravity = 0.09;
      }
    }
    update() {
      if (this.isRocket) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) this.trail.shift();
        this.x += this.vx; this.y += this.vy; this.vy += 0.12; this.life -= this.decay;
        if (this.life <= 0 || this.vy >= 0) { explode(this.x, this.y); return false; }
      } else {
        this.x += this.vx; this.y += this.vy;
        this.vy += this.gravity; this.vx *= 0.98; this.life -= this.decay;
        if (this.life <= 0) return false;
      }
      return true;
    }
    draw(ctx) {
      ctx.save(); ctx.globalAlpha = this.life;
      if (this.isRocket) {
        this.trail.forEach((t, i) => {
          ctx.globalAlpha = (i / this.trail.length) * 0.5 * this.life;
          ctx.fillStyle = '#ffaa44';
          ctx.beginPath(); ctx.arc(t.x, t.y, 2, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = this.life;
        ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ffff88'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = this.color; ctx.shadowColor = this.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function explode(x, y) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const count = Math.floor(Math.random() * 50 + 40);
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
    for (let i = 0; i < 10;    i++) particles.push(new Particle(x, y, '#ffffff'));
  }

  function launchRocket() {
    if (!fireworksActive) return;
    particles.push(new Particle(
      Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
      canvas.height, '#ffffff', true
    ));
  }

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.3,
    a: Math.random() * 0.8 + 0.2,
  }));

  const rocketInterval = setInterval(launchRocket, 500);
  launchRocket(); launchRocket(); launchRocket();

  function animate() {
    if (!fireworksActive) return;
    ctx.fillStyle = 'rgba(2,8,24,0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      ctx.globalAlpha = s.a * (0.5 + Math.sin(Date.now() / 1000 + s.x) * 0.3);
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    for (let i = particles.length - 1; i >= 0; i--) {
      if (!particles[i].update()) { particles.splice(i, 1); continue; }
      particles[i].draw(ctx);
    }
    animFrameId = requestAnimationFrame(animate);
  }
  animate();

  if (fireworksTimer) clearTimeout(fireworksTimer);
  fireworksTimer = setTimeout(() => {
    fireworksActive = false;
    clearInterval(rocketInterval);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    canvas.style.transition      = 'opacity 1.5s';
    canvas.style.opacity         = '0';
    section.style.transition     = 'background 1.5s';
    section.style.background     = 'linear-gradient(135deg,#0a0a2e 0%,#1a1a4e 100%)';
    setTimeout(() => { canvas.style.display = 'none'; canvas.style.opacity = '1'; }, 1500);
  }, 10000);
}




/* ------------------------------------------------------------
   14. 星フィールド
   ------------------------------------------------------------ */
function initStars() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx   = canvas.getContext('2d');
  const stars = [];

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 200; i++) {
    stars.push({
      x:     Math.random(),
      y:     Math.random(),
      r:     Math.random() * 1.5 + 0.2,
      o:     Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.003 + 0.001,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.o += s.speed;
      if (s.o > 1 || s.o < 0.1) s.speed = -s.speed;
      ctx.beginPath();
      ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.o})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}


/* ------------------------------------------------------------
   15. 初期化（DOMContentLoaded）
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {

  // ---- お知らせ初期表示 ----
  renderNews();

  // ---- 大会カウントダウン ----
  renderTournamentCountdown();

  // ---- クラブ紹介・メンバー募集の写真表示 ----
  renderSectionPhotos();

  // ---- お問い合わせフォーム初期化 ----
  initContactForm();

  // ---- ギャラリー初期表示 ----
  renderGallery();

  // ---- ヒーロー区画のイントロ要素（ロゴ・オレンジタグ）処理 ----
  initHeroIntro();

  // ---- スクロールフェードイン ----
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ---- トップへ戻るボタン ----
  const backToTop = document.getElementById('backToTopWrap');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (document.body.classList.contains('focus-mode')) return;
      const show = window.scrollY > 400;
      backToTop.style.display       = 'flex';
      backToTop.style.opacity       = show ? '1' : '0';
      backToTop.style.transform     = show ? 'translateY(0)' : 'translateY(20px)';
      backToTop.style.pointerEvents = show ? 'auto' : 'none';
    });
  }

  // ---- ラケット音アニメーション用CSS ----
  const soundStyle = document.createElement('style');
  soundStyle.textContent =
    '@keyframes soundPulse { 0%{transform:scale(0.5);opacity:1} 100%{transform:scale(2);opacity:0} }';
  document.head.appendChild(soundStyle);

  // ---- カレンダー：セッション認証が残っていれば自動表示 ----
  if (sessionStorage.getItem('calAuth')) {
    const box  = document.getElementById('calPwBox');
    const area = document.getElementById('calendarArea');
    if (box && area) {
      box.style.display  = 'none';
      area.style.display = 'block';
      showCalRoleBadge();
    }
  }


  // ---- ビジュアライザーバー生成 ----
  const visEl = document.getElementById('visualizer');
  if (visEl) {
    for (let i = 0; i < 16; i++) {
      const bar = document.createElement('div');
      bar.id = 'vbar' + i;
      bar.style.cssText =
        'width:8px;height:4px;background:linear-gradient(to top,#88ddaa,#44aaff);' +
        'border-radius:2px;transition:height 0.1s';
      visEl.appendChild(bar);
    }
  }

  // ---- ナビ＆クイックメニュー自動生成 ----
  // section に data-menu-label を付けるだけで、上部ナビとヒーローメニューの両方に
  // 自動で追加されます。順番は HTML 内の section の出現順と一致します。
  const sections = document.querySelectorAll('section[data-menu-label]');

  // 上部グローバルナビ
  const navEl = document.getElementById('globalNav');
  if (navEl) {
    sections.forEach(sec => {
      const icon  = sec.dataset.menuIcon  || '';
      const label = sec.dataset.menuLabel || sec.id;
      const a     = document.createElement('a');
      a.href      = '#' + sec.id;
      a.textContent = (icon ? icon + ' ' : '') + label;
      a.addEventListener('click', e => { e.preventDefault(); enterFocusMode(sec.id, true); });
      navEl.appendChild(a);
    });
  }

  // ヒーロークイックメニュー
  const menuEl = document.getElementById('quickMenu');
  if (menuEl) {
    sections.forEach(sec => {
      const { id }                = sec;
      const icon   = sec.dataset.menuIcon   || '📌';
      const label  = sec.dataset.menuLabel  || id;
      const color  = sec.dataset.menuColor  || 'rgba(255,255,255,0.1)';
      const border = sec.dataset.menuBorder || 'rgba(255,255,255,0.2)';
      const hover  = sec.dataset.menuHover  || 'rgba(255,255,255,0.22)';
      const a      = document.createElement('a');
      a.href       = '#' + id;
      a.style.cssText =
        `display:flex;flex-direction:row;align-items:center;gap:0.6rem;` +
        `background:${color};border:1.5px solid ${border};border-radius:12px;` +
        `padding:0.75rem 1rem;text-decoration:none;color:white;` +
        `transition:background 0.2s,transform 0.15s;backdrop-filter:blur(6px);` +
        `position:relative;z-index:1;`;
      a.addEventListener('mouseover', () => {
        a.style.background = hover;
        a.style.transform  = 'translateY(-2px)';
      });
      a.addEventListener('mouseout', () => {
        a.style.background = color;
        a.style.transform  = '';
      });
      a.addEventListener('click', e => {
        e.preventDefault();
        enterFocusMode(id, true);
      });
      a.innerHTML =
        `<span style="font-size:1.4rem;flex-shrink:0">${icon}</span>` +
        `<span style="font-size:0.82rem;font-weight:700;letter-spacing:0.04em;line-height:1.3">${label}</span>`;
      menuEl.appendChild(a);
    });
  }

  // ---- 独立ページへの外部リンクをメニューに追加 ----
  // フォトギャラリー・大会結果・全国クラブマップ・DEEP DIVE（別HTMLページ）
  const EXTERNAL_MENU = [
    { href: 'gallery.html',  icon: '📸', label: 'フォトギャラリー', color: 'rgba(0,87,255,0.28)',   border: 'rgba(0,87,255,0.5)',   hover: 'rgba(0,87,255,0.45)' },
    { href: 'matches.html',  icon: '🏆', label: '大会結果',         color: 'rgba(63,81,181,0.3)',   border: 'rgba(63,81,181,0.55)', hover: 'rgba(63,81,181,0.5)' },
    { href: 'map.html',      icon: '🗾', label: '全国クラブマップ', color: 'rgba(76,175,80,0.28)',  border: 'rgba(76,175,80,0.5)',  hover: 'rgba(76,175,80,0.45)' },
    { href: 'deepdive.html', icon: '🔬', label: 'DEEP DIVE',        color: 'rgba(255,143,0,0.28)',  border: 'rgba(255,143,0,0.5)',  hover: 'rgba(255,143,0,0.45)' }
  ];

  // 上部グローバルナビへ
  if (navEl) {
    EXTERNAL_MENU.forEach(m => {
      const a = document.createElement('a');
      a.href = m.href;
      a.textContent = m.icon + ' ' + m.label;
      navEl.appendChild(a);
    });
  }

  // ヒーロークイックメニューへ
  if (menuEl) {
    EXTERNAL_MENU.forEach(m => {
      const a = document.createElement('a');
      a.href = m.href;
      a.style.cssText =
        `display:flex;flex-direction:row;align-items:center;gap:0.6rem;` +
        `background:${m.color};border:1.5px solid ${m.border};border-radius:12px;` +
        `padding:0.75rem 1rem;text-decoration:none;color:white;` +
        `transition:background 0.2s,transform 0.15s;backdrop-filter:blur(6px);` +
        `position:relative;z-index:1;`;
      a.addEventListener('mouseover', () => {
        a.style.background = m.hover;
        a.style.transform  = 'translateY(-2px)';
      });
      a.addEventListener('mouseout', () => {
        a.style.background = m.color;
        a.style.transform  = '';
      });
      a.innerHTML =
        `<span style="font-size:1.4rem;flex-shrink:0">${m.icon}</span>` +
        `<span style="font-size:0.82rem;font-weight:700;letter-spacing:0.04em;line-height:1.3">${m.label}</span>`;
      menuEl.appendChild(a);
    });
  }

  // ---- クラブマップ・Orange HUB 初期化 ----
  initClubMap();

  // ---- 星フィールド ----
  initStars();

  // ---- フォーカスモード：ブラウザ「戻る」対応 ----
  window.addEventListener('popstate', e => {
    if (e.state && e.state.focusMode) {
      enterFocusMode(e.state.sectionId);
    } else {
      exitFocusMode();
    }
  });

  // ---- URL に ?view= があればフォーカスモードで開始 ----
  const urlParams = new URLSearchParams(location.search);
  const viewParam = urlParams.get('view');
  if (viewParam && document.getElementById(viewParam)) {
    history.replaceState({ focusMode: true, sectionId: viewParam }, '', location.search);
    enterFocusMode(viewParam);
    /* ?tab= が指定されていれば、クラブ案内の該当タブを開く（共有リンク用） */
    const tabParam = urlParams.get('tab');
    if (viewParam === 'clubinfo' && tabParam) {
      /* 大会結果は専用ページに移行したのでリダイレクト（旧共有リンク対応） */
      if (tabParam === 'matches') {
        location.href = 'matches.html';
        return;
      }
      const tabBtn = document.querySelector(`.clubinfo-tab[onclick*="'${tabParam}'"]`);
      if (typeof showClubInfoTab === 'function') {
        showClubInfoTab(tabParam, tabBtn || null);
      }
    }
  }
  /* プリロード時の画面隠しを解除（focus-mode適用後に表示） */
  document.documentElement.removeAttribute('data-preload-view');

});
