/* ============================================================
   community-anim.js
   ORANGE HUB セクション表示時の演出
   ─────────────────────────────────────────────────────────
   ① セクションが見えたらコンテンツを隠して動画をフェードイン再生
   ② 動画終了 1 秒前 → オレンジ球が宇宙空間に飛散（canvas）+ 効果音
   ③ 動画終了 → フェードアウト完了後にコンテンツをフェードイン表示
   ============================================================ */

'use strict';

(function () {

  const FADE_IN_DURATION  = 0.8;   // 動画フェードイン（秒）
  const FADE_OUT_DURATION = 1.2;   // 動画フェードアウト（秒）
  const BURST_BEFORE_END  = 1.0;   // 終了何秒前に球を弾かせるか
  const CONTENT_FADE_IN   = 1.0;   // コンテンツ表示のフェードイン（秒）
  const VIDEO_VOLUME      = 0.85;  // 動画音量（0.0〜1.0）

  document.addEventListener('DOMContentLoaded', init);

  /* ============================================================
     Web Audio API ユーティリティ
     ============================================================ */
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    /* スクロール操作でsuspendされている場合は再開 */
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  /* 風船が割れる「パン！」という音
     ─ 瞬間的な全帯域ノイズ爆発 + 低域ボディ + 鋭い減衰 */
  function playBurstSound() {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;

      /* ── ① 破裂瞬間：全帯域ホワイトノイズの極鋭アタック
              風船膜が一瞬で裂ける「バン」の核 */
      const bufLen1 = Math.floor(ctx.sampleRate * 0.18);
      const buf1    = ctx.createBuffer(1, bufLen1, ctx.sampleRate);
      const d1      = buf1.getChannelData(0);
      for (let i = 0; i < bufLen1; i++) d1[i] = (Math.random() * 2 - 1);
      const crack   = ctx.createBufferSource();
      crack.buffer  = buf1;
      /* ローパスで高域を少し丸めて「紙が裂ける」質感に */
      const lpf1    = ctx.createBiquadFilter();
      lpf1.type = 'lowpass'; lpf1.frequency.value = 8000;
      const cGain   = ctx.createGain();
      crack.connect(lpf1); lpf1.connect(cGain); cGain.connect(ctx.destination);
      cGain.gain.setValueAtTime(0.0,  now);
      cGain.gain.linearRampToValueAtTime(1.1,  now + 0.002); // 超鋭い立ち上がり
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      crack.start(now); crack.stop(now + 0.18);

      /* ── ② 空気圧開放の「ボン」：低域の膨らみ感
              風船内部の圧縮空気が一気に広がる低周波 */
      const osc     = ctx.createOscillator();
      const oGain   = ctx.createGain();
      osc.connect(oGain); oGain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45,  now + 0.08);
      oGain.gain.setValueAtTime(0.0,  now);
      oGain.gain.linearRampToValueAtTime(0.75, now + 0.003);
      oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now); osc.stop(now + 0.13);

      /* ── ③ ゴム膜の「ビリビリ」残響：中高域ノイズが短く尾を引く */
      const bufLen2 = Math.floor(ctx.sampleRate * 0.22);
      const buf2    = ctx.createBuffer(1, bufLen2, ctx.sampleRate);
      const d2      = buf2.getChannelData(0);
      for (let i = 0; i < bufLen2; i++) d2[i] = (Math.random() * 2 - 1);
      const tail    = ctx.createBufferSource();
      tail.buffer   = buf2;
      const bpf     = ctx.createBiquadFilter();
      bpf.type = 'bandpass'; bpf.frequency.value = 2800; bpf.Q.value = 1.2;
      const tGain   = ctx.createGain();
      tail.connect(bpf); bpf.connect(tGain); tGain.connect(ctx.destination);
      tGain.gain.setValueAtTime(0.0,  now + 0.01);
      tGain.gain.linearRampToValueAtTime(0.28, now + 0.018);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      tail.start(now + 0.01); tail.stop(now + 0.23);

    } catch(e) { /* AudioContext非対応環境は無視 */ }
  }

  /* 炭酸をコップに注いだ「シュワシュワ」音
     ─ 細かいランダムノイズが次々と弾けるプチプチ感 */
  function playSpaceScatterSound(durationSec) {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;

      /* ── ① ベースのシュー：帯域を絞ったホワイトノイズが徐々にフェード */
      const bufLen = Math.floor(ctx.sampleRate * durationSec);
      const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data   = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
      const baseNoise = ctx.createBufferSource();
      baseNoise.buffer = buf;
      const bpf    = ctx.createBiquadFilter();
      bpf.type = 'bandpass'; bpf.frequency.value = 5500; bpf.Q.value = 0.6;
      const bgain  = ctx.createGain();
      baseNoise.connect(bpf); bpf.connect(bgain); bgain.connect(ctx.destination);
      bgain.gain.setValueAtTime(0.0,  now);
      bgain.gain.linearRampToValueAtTime(0.28, now + 0.08);
      bgain.gain.setValueAtTime(0.28, now + durationSec * 0.3);
      bgain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
      baseNoise.start(now); baseNoise.stop(now + durationSec);

      /* ── ② 気泡プチプチ：細かい短いノイズバーストをランダムに連打 */
      const bubbleCount = 55;
      for (let i = 0; i < bubbleCount; i++) {
        const t       = now + Math.random() * durationSec * 0.9;
        const bubLen  = Math.floor(ctx.sampleRate * (0.012 + Math.random() * 0.025));
        const bbuf    = ctx.createBuffer(1, bubLen, ctx.sampleRate);
        const bdata   = bbuf.getChannelData(0);
        for (let j = 0; j < bubLen; j++) bdata[j] = (Math.random() * 2 - 1);
        const bsrc    = ctx.createBufferSource();
        bsrc.buffer   = bbuf;
        const bhpf    = ctx.createBiquadFilter();
        bhpf.type = 'highpass'; bhpf.frequency.value = 4000 + Math.random() * 4000;
        const bng     = ctx.createGain();
        bsrc.connect(bhpf); bhpf.connect(bng); bng.connect(ctx.destination);
        const vol = 0.08 + Math.random() * 0.18;
        bng.gain.setValueAtTime(0.0, t);
        bng.gain.linearRampToValueAtTime(vol, t + 0.002);
        bng.gain.exponentialRampToValueAtTime(0.001, t + bubLen / ctx.sampleRate);
        bsrc.start(t); bsrc.stop(t + bubLen / ctx.sampleRate + 0.01);
      }

    } catch(e) { /* AudioContext非対応環境は無視 */ }
  }

  /* ============================================================
     初期化
     ============================================================ */
  function init() {
    const section    = document.getElementById('community');
    const video      = document.getElementById('communityIntroVideo');
    const canvas     = document.getElementById('communityBallCanvas');
    const content    = document.getElementById('orangeHubContent');
    const floatBalls = section ? section.querySelectorAll('img[data-img="2"]') : [];
    if (!section || !video || !canvas || !content) return;

    video.muted = true;

    /* コンテンツ・浮遊球を最初から非表示にしておく */
    content.style.opacity    = '0';
    content.style.transition = `opacity ${CONTENT_FADE_IN}s ease`;
    floatBalls.forEach(img => { img.style.opacity = '0'; });

    let played = false;

    /* メニュー選択時に外部から呼ばれる（動画あり・音声あり） */
    window._communityPlayWithVideo = () => {
      if (played) return;
      played = true;
      observer.disconnect();
      playIntro(video, canvas, content, floatBalls);
    };

    /* 外部ページ（map.html / deepdive.html）から戻った時に呼ばれる
       （動画なし・球アニメなし・コンテンツを即表示） */
    window._communityShowInstant = () => {
      played = true;
      observer.disconnect();
      clearTimeout(dwellTimer);
      showContent(content, floatBalls);
    };

    let dwellTimer = null;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (played) return;

        if (entry.isIntersecting) {
          /* スクロール到達：600ms滞在で球アニメのみ・即コンテンツ表示 */
          dwellTimer = setTimeout(() => {
            if (played) return;
            played = true;
            observer.disconnect();
            playScrollIntro(canvas, content, floatBalls);
          }, 600);
        } else {
          clearTimeout(dwellTimer);
          dwellTimer = null;
        }
      });
    }, { threshold: 0.25 });

    /* 外部ページ（map.html / deepdive.html）から ?view=community で戻ってきた場合は、
       自動イントロ（動画・球アニメ）を一切行わず、コンテンツを即表示する。
       observer も動かさない（球アニメの自動再生を防ぐ）。 */
    if (window.__arrivedViaView === 'community') {
      played = true;
      showContent(content, floatBalls);
    } else {
      observer.observe(section);
    }
  }

  /* ============================================================
     スクロール到達時：球アニメのみ・コンテンツ即表示
     ============================================================ */
  function playScrollIntro(canvas, content, floatBalls) {
    /* 球アニメを短めに再生してからコンテンツ表示 */
    startBurstAnimation(canvas, FADE_OUT_DURATION * 0.6);
    setTimeout(() => showContent(content, floatBalls), 300);
  }

  /* ============================================================
     動画再生フロー
     ============================================================ */
  function playIntro(video, canvas, content, floatBalls) {

    /* スキップボタンを表示 */
    const skipBtn = document.getElementById('communitySkipBtn');
    if (skipBtn) skipBtn.style.display = 'block';

    /* 1) 動画フェードイン */
    video.currentTime = 0;
    video.muted       = true;          /* 必ずミュートで再生開始（自動再生ポリシー対策） */
    video.volume      = VIDEO_VOLUME;
    video.style.opacity    = '0';
    video.style.transition = `opacity ${FADE_IN_DURATION}s ease`;
    video.style.display    = 'block';

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        /* メニュー選択経由なので必ずユーザー操作済み → 音声ON */
        video.muted = false;
      }).catch(() => {
        if (skipBtn) skipBtn.style.display = 'none';
        showContent(content, floatBalls);
      });
    }

    requestAnimationFrame(() => requestAnimationFrame(() => {
      video.style.opacity = '1';
    }));

    /* 2) 終了 1 秒前に球爆発 + 効果音 */
    let burstFired = false;
    video.addEventListener('timeupdate', function onTimeUpdate() {
      const remaining = video.duration - video.currentTime;
      if (!burstFired && isFinite(remaining) && remaining <= BURST_BEFORE_END) {
        burstFired = true;
        playBurstSound();
        playSpaceScatterSound(FADE_OUT_DURATION + 0.8);
        startBurstAnimation(canvas, FADE_OUT_DURATION);
      }
    });

    /* 3) 動画終了 → フェードアウト → コンテンツ表示 */
    video.addEventListener('ended', function onEnded() {
      video.removeEventListener('ended', onEnded);
      if (skipBtn) skipBtn.style.display = 'none';

      if (!burstFired) {
        burstFired = true;
        playBurstSound();
        playSpaceScatterSound(FADE_OUT_DURATION + 0.8);
        startBurstAnimation(canvas, FADE_OUT_DURATION);
      }

      /* 動画フェードアウト */
      video.style.transition = `opacity ${FADE_OUT_DURATION}s ease`;
      video.style.opacity    = '0';

      /* フェードアウト完了後にコンテンツ表示 */
      setTimeout(() => {
        video.style.display = 'none';
        showContent(content, floatBalls);
      }, FADE_OUT_DURATION * 1000);
    });

    /* スキップ処理（グローバル関数として公開） */
    window.skipCommunityIntro = function () {
      /* スキップボタンを非表示 */
      if (skipBtn) skipBtn.style.display = 'none';

      /* 動画を停止 */
      video.pause();

      /* 球爆発アニメーションをスキップ演出として短く実行 */
      if (!burstFired) {
        burstFired = true;
        playBurstSound();
        startBurstAnimation(canvas, 0.4);
      }

      /* 動画をすぐフェードアウト */
      video.style.transition = 'opacity 0.4s ease';
      video.style.opacity    = '0';

      /* 0.4秒後にコンテンツ表示 */
      setTimeout(() => {
        video.style.display = 'none';
        showContent(content, floatBalls);
      }, 400);
    };
  }

  /* コンテンツ・浮遊球をフェードインで表示 */
  function showContent(content, floatBalls) {
    requestAnimationFrame(() => {
      content.style.opacity = '1';
      floatBalls.forEach((img, i) => {
        img.style.transition = `opacity ${CONTENT_FADE_IN}s ease ${i * 0.1}s`;
        img.style.opacity    = img.dataset.origOpacity || '0.15';
      });
    });
  }

  /* ============================================================
     オレンジ球 宇宙飛散アニメーション
     ============================================================ */
  function startBurstAnimation(canvas, fadeOutDuration) {

    const section = canvas.parentElement;
    canvas.width  = section.offsetWidth  || window.innerWidth;
    canvas.height = section.offsetHeight || 600;
    canvas.style.display = 'block';
    canvas.style.opacity = '1';

    const ctx = canvas.getContext('2d');
    const W   = canvas.width;
    const H   = canvas.height;

    /* 球パーティクル */
    const balls = [];
    for (let i = 0; i < 60; i++) {
      const radius = 8 + Math.random() * 30;
      const startX = W * 0.1 + Math.random() * W * 0.8;
      const startY = H * 0.4 + Math.random() * H * 0.4;
      const angle  = Math.random() * Math.PI * 2;
      const speed  = 2 + Math.random() * 6;
      const hue    = 18 + Math.random() * 30;
      const sat    = 90 + Math.random() * 10;
      const lit    = 45 + Math.random() * 20;
      balls.push({
        x: startX, y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (1 + Math.random() * 2),
        radius,
        color:   `hsl(${hue},${sat}%,${lit}%)`,
        alpha:   0.85 + Math.random() * 0.15,
        gravity: 0.04 + Math.random() * 0.04,
        drag:    0.985 + Math.random() * 0.01,
        spin:    (Math.random() - 0.5) * 0.06,
        angle:   Math.random() * Math.PI * 2,
        trail:   [],
        life:    1.0,
        decay:   0.008 + Math.random() * 0.012,
      });
    }

    /* 星屑 */
    const stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.5 + Math.random() * 1.5,
        a: Math.random(), da: 0.01 + Math.random() * 0.02,
      });
    }

    let startTime = null;
    const totalMs = (fadeOutDuration + 0.5) * 1000;

    function draw(now) {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / totalMs, 1);

      ctx.clearRect(0, 0, W, H);

      /* 宇宙背景 */
      ctx.fillStyle = `rgba(10,8,30,${0.45 * (1 - progress)})`;
      ctx.fillRect(0, 0, W, H);

      /* 星屑 */
      stars.forEach(s => {
        s.a += s.da;
        if (s.a > 1 || s.a < 0) s.da *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a * 0.6})`;
        ctx.fill();
      });

      /* 球 */
      balls.forEach(b => {
        if (b.life <= 0) return;

        /* 軌跡 */
        b.trail.push({ x: b.x, y: b.y, a: b.life * 0.3 });
        if (b.trail.length > 12) b.trail.shift();
        b.trail.forEach((t, i) => {
          const ta = t.a * (i / b.trail.length);
          ctx.beginPath();
          ctx.arc(t.x, t.y, b.radius * 0.4 * (i / b.trail.length), 0, Math.PI * 2);
          ctx.fillStyle = b.color.replace('hsl(', 'hsla(').replace(')', `,${ta})`);
          ctx.fill();
        });

        /* 本体グラデーション */
        const grd = ctx.createRadialGradient(
          b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.05,
          b.x, b.y, b.radius
        );
        grd.addColorStop(0, `rgba(255,240,200,${b.life * b.alpha})`);
        grd.addColorStop(0.5, b.color.replace('hsl(','hsla(').replace(')',`,${b.life * b.alpha})`));
        grd.addColorStop(1, `rgba(180,50,0,${b.life * b.alpha * 0.7})`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        /* シームライン */
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius * 0.85, b.radius * 0.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${b.life * 0.25})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        /* 物理 */
        b.vx *= b.drag; b.vy *= b.drag;
        b.vy += b.gravity;
        b.x  += b.vx;   b.y  += b.vy;
        b.angle += b.spin;
        b.life  -= b.decay;
      });

      if (progress < 1 && balls.some(b => b.life > 0)) {
        requestAnimationFrame(draw);
      } else {
        canvas.style.transition = `opacity ${fadeOutDuration * 0.6}s ease`;
        canvas.style.opacity    = '0';
        setTimeout(() => { canvas.style.display = 'none'; }, fadeOutDuration * 600);
      }
    }

    requestAnimationFrame(draw);
  }

})();
