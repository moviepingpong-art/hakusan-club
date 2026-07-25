# hakusan-club — 白山ラージボール卓球クラブ 公式サイト

GitHub Pages で公開している静的サイト（素のHTML/CSS/JS）。
公開URL: https://moviepingpong-art.github.io/hakusan-club/

主なページ: `index.html`（トップ）/ `gallery.html` / `matches.html` / `map.html` / `deepdive.html`

---

# ⚠️ 絶対に編集してはいけないもの

## `data.js` の `photos` 配列と `NEWS_LIST` 配列

この2つは **GAS（Google Apps Script）とサイト側で自動管理**されている。
リポジトリ上の内容は**古い可能性が高い**ので、手で編集すると自動更新の結果を巻き戻してしまう。

- GAS「白山クラブ自動更新」がギャラリー用のGoogleドライブフォルダを管理している。
- `updateTournaments.gs` がドライブを走査し、Googleカレンダーの予定と突き合わせて、
  GitHub API経由で `data.js` の `TOURNAMENT_LIST` を書き換える。

**`data.js` を触るときは、`SENRYU_LIST` など自動管理されていない部分だけをピンポイントで編集する。**
ファイル全体の書き換え（丸ごと生成し直す等）は禁止。

## 関連リンクの「便利ツール」カード

`index.html` の関連リンクセクションにある `dropper-tools.com` へのリンクは、
ドロッパー側のSEO導線として意図的に置いてある。削除しない。

## 部員限定エリア

`index.html` の部員カレンダーはパスワードで保護されている。
認証の仕組みを外したり、カレンダーのURLを公開部分に露出させたりしない。

---

# 既存の設定（把握しておくこと）

- Google Analytics: `G-62E06GLKBV`
- お問い合わせフォーム: SSGform のエンドポイントにPOST
- 訪問者カウンター: hits.sh のバッジ
- 構造化データ: トップに `SportsClub` の JSON-LD、`matches.html` に `SportsEvent` の JSON-LD
- Search Console 認証済み。sitemap 送信済み。

---

# 主要な定数・ID

- IndexNow キー: `c5fe32a6cb9946268ce8537e8a0a9bdf`
- Drive 親フォルダID: `1q_3cknEoJzFezW3yuiLTKQ4mo1siicQM`
- GAS Web App URL:
  `https://script.google.com/macros/s/AKfycby6cvIHu_7d5caysgDYznj1nJITMyyKs8h6woNEHKZi0toKKPxVr5nO6xGJlVr9DCNI/exec`

---

# 進め方（ユーザーの好み）

- **一気に全部やらず、区切りごとに確認を取る。**
- 変更したら、**確認URLと確認ポイント**をセットで伝える。
