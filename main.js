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

/* --- クラブ紹介セクションの写真（Google DriveのURLを貼り付けてください） --- */
const ABOUT_PHOTO_URL = '';  // 例: 'https://drive.google.com/file/d/XXXX/view'

/* --- メンバー募集セクションの写真（Google DriveのURLを貼り付けてください） --- */
const RECRUIT_PHOTO_URL = '';  // 例: 'https://drive.google.com/file/d/XXXX/view'

/* ------------------------------------------------------------
   お知らせデータと管理人川柳データは data.js に分離しました。
   このファイルより先に data.js を読み込んでください（index.html参照）。
   ------------------------------------------------------------ */


/* 川柳の状態管理 */
let _currentSenryu     = null;
let _currentSenryuMode = 'weekly';

/* 川柳を開く（mode: 'weekly'=今週 / 'random'=過去ランダム） */
function openSenryu(mode) {
  if (!SENRYU_LIST || SENRYU_LIST.length === 0) return;

  const modal = document.getElementById('senryuModal');
  if (!modal) return;
  modal.style.display = 'flex';

  _currentSenryuMode = mode;
  if (mode === 'weekly') {
    _currentSenryu = SENRYU_LIST[0];  // 先頭が最新
    document.getElementById('senryuTitle').textContent = '〜 今週の管理人川柳 〜';
  } else {
    // 今週分を除いてランダム選択（1件しかない場合は今週分）
    const pool = SENRYU_LIST.length > 1 ? SENRYU_LIST.slice(1) : SENRYU_LIST;
    _currentSenryu = pool[Math.floor(Math.random() * pool.length)];
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
  if (meta) meta.textContent = senryu.date ? `（${senryu.date}）` : '';

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

/* 太鼓「ドドン!」の音をWeb Audio APIで生成（本格的な和太鼓風） */
function playTaikoSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;

    // 全体音量を上げるためのマスターゲイン
    const master = ctx.createGain();
    master.gain.value = 1.4;
    master.connect(ctx.destination);

    // 太鼓の1打を生成する関数
    function hitTaiko(when, intensity) {
      // ▼1. 胴鳴り（メインの低音・周波数を素早く下げて「ドン」の感じを出す）
      //    100Hz → 55Hz に下がり、0.6秒かけて減衰
      const body = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      body.type = 'sine';
      body.frequency.setValueAtTime(110, when);
      body.frequency.exponentialRampToValueAtTime(55, when + 0.08);
      body.frequency.exponentialRampToValueAtTime(50, when + 0.6);
      bodyGain.gain.setValueAtTime(0.0001, when);
      bodyGain.gain.exponentialRampToValueAtTime(intensity * 0.9, when + 0.005); // 急峻なアタック
      bodyGain.gain.exponentialRampToValueAtTime(0.001, when + 0.7);
      body.connect(bodyGain).connect(master);
      body.start(when);
      body.stop(when + 0.75);

      // ▼2. サブベース（30Hz）で重量感を補強
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(40, when);
      sub.frequency.exponentialRampToValueAtTime(28, when + 0.5);
      subGain.gain.setValueAtTime(0.0001, when);
      subGain.gain.exponentialRampToValueAtTime(intensity * 0.6, when + 0.01);
      subGain.gain.exponentialRampToValueAtTime(0.001, when + 0.6);
      sub.connect(subGain).connect(master);
      sub.start(when);
      sub.stop(when + 0.65);

      // ▼3. アタック音（打撃の瞬間の「パン」、皮を叩く音）
      //    短いノイズバーストにバンドパスフィルタをかける
      const attackBuf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const attackData = attackBuf.getChannelData(0);
      for (let j = 0; j < attackData.length; j++) {
        const t = j / attackData.length;
        attackData[j] = (Math.random() * 2 - 1) * Math.exp(-t * 30);
      }
      const attackSrc = ctx.createBufferSource();
      attackSrc.buffer = attackBuf;
      const attackFilter = ctx.createBiquadFilter();
      attackFilter.type = 'bandpass';
      attackFilter.frequency.value = 800;  // 中域でアタック感を出す
      attackFilter.Q.value = 1.2;
      const attackGain = ctx.createGain();
      attackGain.gain.setValueAtTime(intensity * 0.5, when);
      attackGain.gain.exponentialRampToValueAtTime(0.001, when + 0.08);
      attackSrc.connect(attackFilter).connect(attackGain).connect(master);
      attackSrc.start(when);

      // ▼4. 胴の余韻（残響感を出すため、200Hzあたりに弱い共鳴を持たせたノイズ）
      const tailBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const tailData = tailBuf.getChannelData(0);
      for (let j = 0; j < tailData.length; j++) {
        const t = j / tailData.length;
        tailData[j] = (Math.random() * 2 - 1) * Math.exp(-t * 6);
      }
      const tailSrc = ctx.createBufferSource();
      tailSrc.buffer = tailBuf;
      const tailFilter = ctx.createBiquadFilter();
      tailFilter.type = 'lowpass';
      tailFilter.frequency.value = 250;
      tailFilter.Q.value = 4;
      const tailGain = ctx.createGain();
      tailGain.gain.setValueAtTime(intensity * 0.35, when + 0.01);
      tailGain.gain.exponentialRampToValueAtTime(0.001, when + 0.5);
      tailSrc.connect(tailFilter).connect(tailGain).connect(master);
      tailSrc.start(when);
    }

    // 「ド・ドン!」のリズム
    hitTaiko(now,        0.75);  // ド
    hitTaiko(now + 0.30, 1.0);   // ドン!（強め）

  } catch (e) {
    console.warn('太鼓音の再生に失敗', e);
  }
}

/* ブラウザによっては getVoices() が非同期で読み込まれるため事前にウォームアップ */
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

/* 川柳ボタンを少し遅れて追いかける「つかまえてー」文字 */
function initSenryuChaser() {
  const btn    = document.getElementById('senryuFloatBtn');
  const chaser = document.getElementById('senryuChaser');
  if (!btn || !chaser) return;

  // ボタンが入っているヒーロー区画（position:relative の親）を取得
  const hero = btn.offsetParent || btn.parentElement;
  if (!hero) return;

  // 追従するオフセット（ボタンの少し右下に表示）
  const OFFSET_X = 60;
  const OFFSET_Y = 60;

  // 0.6秒の transition でゆっくり追いつくので、毎フレーム位置更新する必要はなく
  // 0.3秒ごとに目標位置を更新するだけで「ふらふら追いかける」動きになる
  function updateChaser() {
    const btnRect  = btn.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();

    // hero内での相対座標
    const x = btnRect.left - heroRect.left + OFFSET_X;
    const y = btnRect.top  - heroRect.top  + OFFSET_Y;

    chaser.style.transform = `translate(${x}px, ${y}px)`;
  }

  // 初回位置決め＆周期更新
  updateChaser();
  setInterval(updateChaser, 300);
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
  const items = NEWS_LIST.slice(0, NEWS_MAX);
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
  atmosphere: 'クラブ紹介・雰囲気',
  equipment:  '用具・施設',
  practice:   '練習・技術',
  match:      '試合・大会',
};
const CATEGORY_ICONS = {
  atmosphere: '😊',
  equipment:  '🏓',
  practice:   '🏋️',
  match:      '🏆',
};

/* photos 配列は data.js で定義しています */
let currentCategory = 'all';

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const filtered = currentCategory === 'all'
    ? photos
    : photos.filter(p => p.category === currentCategory);

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

function filterGallery(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderGallery();
}

// Google DriveのURLを直接表示用URLに変換する
function convertGoogleDriveUrl(url) {
  const match = url.match(/\/file\/d\/([^\/]+)/);
  if (match) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w800';
  return url;
}

/* クラブ紹介・メンバー募集の写真を表示 */
function renderSectionPhotos() {
  if (ABOUT_PHOTO_URL) {
    const el = document.getElementById('aboutPhoto');
    if (el) {
      el.innerHTML = `<img src="${convertGoogleDriveUrl(ABOUT_PHOTO_URL)}"
        alt="集合写真・練習風景"
        style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;display:block;cursor:pointer"
        onclick="openSectionPhotoEdit('about')">`;
    }
  } else {
    const el = document.getElementById('aboutPhoto');
    if (el) el.onclick = () => openSectionPhotoEdit('about');
  }
  if (RECRUIT_PHOTO_URL) {
    const el = document.getElementById('recruitPhoto');
    if (el) {
      el.innerHTML = `<img src="${convertGoogleDriveUrl(RECRUIT_PHOTO_URL)}"
        alt="練習・交流の様子"
        style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;display:block;cursor:pointer"
        onclick="openSectionPhotoEdit('recruit')">`;
    }
  } else {
    const el = document.getElementById('recruitPhoto');
    if (el) el.onclick = () => openSectionPhotoEdit('recruit');
  }
}

let sectionPhotoAuthed = false;
let sectionPhotoTarget = '';

function openSectionPhotoEdit(target) {
  sectionPhotoTarget = target;
  const modal = document.getElementById('sectionPhotoModal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('sectionPhotoPwInput').value = '';
    document.getElementById('sectionPhotoUrlInput').value = '';
    document.getElementById('sectionPhotoPwError').style.display = 'none';
    document.getElementById('sectionPhotoUrlBox').style.display = 'none';
    document.getElementById('sectionPhotoPwBox').style.display = 'block';
  }
}

function checkSectionPhotoPw() {
  const pw = document.getElementById('sectionPhotoPwInput').value;
  if (pw !== window.ADMIN_PW) {
    document.getElementById('sectionPhotoPwError').style.display = 'block';
    return;
  }
  document.getElementById('sectionPhotoPwBox').style.display = 'none';
  document.getElementById('sectionPhotoUrlBox').style.display = 'block';
}

function saveSectionPhoto() {
  const url = document.getElementById('sectionPhotoUrlInput').value.trim();
  if (!url) { alert('URLを入力してください'); return; }
  const label = sectionPhotoTarget === 'about' ? 'ABOUT_PHOTO_URL' : 'RECRUIT_PHOTO_URL';
  const code = `const ${label} = '${url}';`;
  const codeModal = document.getElementById('saveCodeModal');
  const textarea  = document.getElementById('saveCodeText');
  document.getElementById('sectionPhotoModal').style.display = 'none';
  if (codeModal && textarea) {
    textarea.value = `// main.jsの「${label}」の行を以下に置き換えてGitHubにアップロードしてください\n${code}`;
    codeModal.style.display = 'flex';
  }
}

function closeSectionPhotoModal() {
  document.getElementById('sectionPhotoModal').style.display = 'none';
}
function closeSaveCodeModal() {
  document.getElementById('saveCodeModal').style.display = 'none';
}
function copySaveCode() {
  const textarea = document.getElementById('saveCodeText');
  textarea.select();
  document.execCommand('copy');
  alert('✅ コードをコピーしました！\nmain.jsの該当行を置き換えてGitHubにアップロードしてください。');
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

/* テーブルのページネーション設定 */
const CLUBS_PER_PAGE = 8;
let   _currentPage   = 1;
let   _filteredRows  = [];

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
  _currentPage = page;
  const total  = _filteredRows.length;
  const pages  = Math.ceil(total / CLUBS_PER_PAGE);
  const start  = (page - 1) * CLUBS_PER_PAGE;
  const end    = start + CLUBS_PER_PAGE;

  document.querySelectorAll('#clubTableBody tr[data-lat]').forEach(r => r.style.display = 'none');
  _filteredRows.forEach((r, i) => {
    r.style.display = (i >= start && i < end) ? '' : 'none';
  });

  const noResult = document.getElementById('noClubResult');
  if (noResult) noResult.style.display = total === 0 ? 'block' : 'none';

  const pagi = document.getElementById('clubPagination');
  if (!pagi) return;
  if (pages <= 1) { pagi.innerHTML = ''; return; }

  let html = '';
  const btn = (label, p, active, disabled) =>
    `<button onclick="renderTablePage(${p})"
      style="min-width:32px;padding:0.35rem 0.65rem;border-radius:6px;
             border:1px solid ${active?'#ff7a00':'rgba(255,120,0,0.3)'};
             background:${active?'#ff7a00':'transparent'};color:${active?'white':'#ff7a00'};
             font-size:0.8rem;cursor:${disabled?'default':'pointer'};font-weight:700;
             opacity:${disabled?'0.4':'1'}"
      ${disabled?'disabled':''}>${label}</button>`;

  html += btn('◀', Math.max(1,page-1), false, page===1);
  for (let p = 1; p <= pages; p++) {
    if (pages <= 7 || Math.abs(p-page) <= 2 || p === 1 || p === pages) {
      html += btn(p, p, p===page, false);
    } else if (Math.abs(p-page) === 3) {
      html += `<span style="color:rgba(255,255,255,0.3);padding:0 0.2rem">…</span>`;
    }
  }
  html += btn('▶', Math.min(pages,page+1), false, page===pages);
  pagi.innerHTML = html;
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
  ['about', 'schedule', 'matches', 'gallery'].forEach(t => {
    const panel = document.getElementById('clubinfo-' + t);
    if (panel) panel.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.clubinfo-tab').forEach(btn => btn.classList.remove('active'));
  if (clickedBtn) clickedBtn.classList.add('active');
  if (tab === 'gallery') renderGallery();
}

/* ============================================================
   フォーカスモード
   ============================================================ */
function enterFocusMode(sectionId) {
  document.querySelectorAll('section').forEach(sec => sec.classList.remove('focus-target'));
  const target = document.getElementById(sectionId);
  if (!target) return;
  target.classList.add('focus-target');
  document.body.classList.add('focus-mode');
  window.scrollTo({ top: 0, behavior: 'instant' });
  history.pushState({ focusMode: true, sectionId }, '', '?view=' + sectionId);
  const exitBtn       = document.getElementById('focusExitBtn');
  const backToTopWrap = document.getElementById('backToTopWrap');
  if (exitBtn)       exitBtn.classList.add('visible');
  if (backToTopWrap) backToTopWrap.style.display = 'none';
  if (sectionId === 'community') {
    showCommunityTab('map');
    /* メニュー選択時は動画あり・音声ありで再生 */
    setTimeout(() => {
      if (window._communityPlayWithVideo) window._communityPlayWithVideo();
    }, 50);
  }
}

function exitFocusMode() {
  document.body.classList.remove('focus-mode');
  document.querySelectorAll('section').forEach(sec => sec.classList.remove('focus-target'));
  const exitBtn       = document.getElementById('focusExitBtn');
  const backToTopWrap = document.getElementById('backToTopWrap');
  if (exitBtn)       exitBtn.classList.remove('visible');
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

function showCommunityTab(tab) {
  const tabMap = {
    map:      'community-map',
    voices:   'community-voices',
    omake:    'community-omake',
    deepdive: 'community-deepdive',
  };
  Object.keys(tabMap).forEach(t => {
    const el  = document.getElementById(tabMap[t]);
    const btn = document.getElementById('tab-' + t);
    if (el)  el.style.display = t === tab ? 'block' : 'none';
    if (btn) {
      btn.style.background  = t === tab ? '#ff7a00'               : 'rgba(255,255,255,0.05)';
      btn.style.color       = t === tab ? 'white'                 : 'rgba(255,255,255,0.8)';
      btn.style.borderColor = t === tab ? '#ff7a00'               : 'rgba(255,255,255,0.3)';
    }
  });
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
  box.innerHTML = `<p style="color:white;font-size:0.9rem;line-height:1.8">${currentTrivia.text}</p>`;
  ans.style.display = 'none';
  document.getElementById('trueBtn').style.display = 'inline-block';
  document.getElementById('lieBtn').style.display  = 'inline-block';
}

function answerTrivia(userSaysTrue) {
  if (!currentTrivia) return;
  const ans     = document.getElementById('triviaAnswer');
  const correct = userSaysTrue === !currentTrivia.isLie;
  if (correct) {
    ans.style.background = 'rgba(76,175,80,0.2)';
    ans.style.color      = '#a5d6a7';
    ans.style.border     = '1px solid #4caf50';
    ans.innerHTML        = currentTrivia.isLie
      ? '❌ 正解！これは嘘でした！現在のラージボールもサーブは16cm以上のトスが必要です😄'
      : '✅ 正解！本当のことでした！さすが！';
  } else {
    ans.style.background = 'rgba(239,83,80,0.2)';
    ans.style.color      = '#ef9a9a';
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
    <p style="color:rgba(255,255,255,0.85);font-size:0.85rem;line-height:1.8">${f.msg}</p>
    <p style="color:rgba(255,255,255,0.3);font-size:0.7rem;margin-top:0.6rem">
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
   13. 追加レポート管理
   ------------------------------------------------------------ */
function showReportPwBox() {
  document.getElementById('reportPwInput').value        = '';
  document.getElementById('reportPwError').style.display = 'none';
  document.getElementById('reportForm').style.display   = 'none';
  const box = document.getElementById('reportPwBox');
  box.style.display = 'block';
  setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
}

function checkReportPw() {
  const pw = document.getElementById('reportPwInput').value;
  if (pw !== window.ADMIN_PW) {
    document.getElementById('reportPwError').style.display = 'block';
    document.getElementById('reportPwInput').value = '';
    return;
  }
  document.getElementById('reportPwBox').style.display = 'none';
  const form = document.getElementById('reportForm');
  form.style.display = 'block';
  setTimeout(() => form.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
}

function saveReport() {
  const icon  = document.getElementById('rIcon').value.trim()  || '📄';
  const title = document.getElementById('rTitle').value.trim();
  const sub   = document.getElementById('rSub').value.trim();
  const tags  = document.getElementById('rTags').value.trim();
  const body  = document.getElementById('rBody').value.trim();
  if (!title || !body) { alert('タイトルと本文は必須です。'); return; }

  const reports = JSON.parse(localStorage.getItem('deepdive_reports') || '[]');
  reports.unshift({
    id:   Date.now(),
    icon, title, sub, tags, body,
    date: new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }),
  });
  localStorage.setItem('deepdive_reports', JSON.stringify(reports));
  ['rTitle', 'rSub', 'rTags', 'rBody'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('rIcon').value             = '📄';
  document.getElementById('reportForm').style.display = 'none';
  renderExtraReports();
  document.getElementById('extraReportsArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteReport(id) {
  const input = prompt('削除するにはパスワードを入力してください');
  if (!input) return;
  if (input !== window.ADMIN_PW) { alert('パスワードが違います。'); return; }
  const reports = JSON.parse(localStorage.getItem('deepdive_reports') || '[]');
  localStorage.setItem('deepdive_reports', JSON.stringify(reports.filter(r => r.id !== id)));
  renderExtraReports();
}

function renderExtraReports() {
  const area = document.getElementById('extraReportsArea');
  if (!area) return;
  const reports = JSON.parse(localStorage.getItem('deepdive_reports') || '[]');
  if (reports.length === 0) { area.innerHTML = ''; return; }

  const COLORS = ['#7b1fa2', '#00695c', '#1565c0', '#e65100', '#b71c1c'];
  area.innerHTML = `
    <h3 style="font-family:'Oswald',sans-serif;font-size:1.1rem;color:rgba(255,255,255,0.5);
               letter-spacing:0.15em;text-align:center;margin-bottom:1.5rem;text-transform:uppercase">
      ── 追加レポート ──
    </h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem">
      ${reports.map((r, i) => {
        const color   = COLORS[i % COLORS.length];
        const tagHtml = r.tags
          ? r.tags.split(',').map(t =>
              `<span style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);
                            font-size:0.72rem;padding:0.2rem 0.7rem;border-radius:20px;
                            border:1px solid rgba(255,255,255,0.15)">${t.trim()}</span>`
            ).join('')
          : '';
        return `
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);
                      border-radius:16px;overflow:hidden;position:relative">
            <div style="background:linear-gradient(135deg,${color}cc,${color});padding:1.5rem;text-align:center">
              <div style="font-size:2.5rem;margin-bottom:0.3rem">${r.icon}</div>
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.7);letter-spacing:0.1em">${r.date}</div>
            </div>
            <div style="padding:1.3rem">
              <h3 style="font-family:'Oswald',sans-serif;font-size:1rem;color:white;
                         margin-bottom:0.5rem;line-height:1.4">${r.title}</h3>
              ${r.sub ? `<p style="font-size:0.8rem;color:rgba(255,255,255,0.55);margin-bottom:0.8rem">${r.sub}</p>` : ''}
              ${tagHtml ? `<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.8rem">${tagHtml}</div>` : ''}
              <p style="font-size:0.83rem;color:rgba(255,255,255,0.75);line-height:1.8;white-space:pre-wrap">${r.body}</p>
              <button onclick="deleteReport(${r.id})"
                style="margin-top:1rem;background:rgba(239,68,68,0.15);color:#fca5a5;
                       border:1px solid rgba(239,68,68,0.3);border-radius:6px;
                       padding:0.3rem 0.8rem;cursor:pointer;font-size:0.75rem">🗑️ 削除</button>
            </div>
          </div>`;
      }).join('')}
    </div>`;
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

  // ---- クラブ紹介・メンバー募集の写真表示 ----
  renderSectionPhotos();

  // ---- お問い合わせフォーム初期化 ----
  initContactForm();

  // ---- ギャラリー初期表示 ----
  renderGallery();

  // ---- 川柳ボタン追従「つかまえてー」 ----
  initSenryuChaser();

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

  // ---- 追加レポート初期表示 ----
  renderExtraReports();

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
      a.addEventListener('click', e => { e.preventDefault(); enterFocusMode(sec.id); });
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
        enterFocusMode(id);
      });
      a.innerHTML =
        `<span style="font-size:1.4rem;flex-shrink:0">${icon}</span>` +
        `<span style="font-size:0.82rem;font-weight:700;letter-spacing:0.04em;line-height:1.3">${label}</span>`;
      menuEl.appendChild(a);
    });
  }

  // ---- クラブマップ・Orange HUB 初期化 ----
  initClubMap();
  showCommunityTab('map');

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
    history.replaceState({ focusMode: true, sectionId: viewParam }, '', '?view=' + viewParam);
    enterFocusMode(viewParam);
  }

});
