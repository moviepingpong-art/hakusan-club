# 白山ラージボール卓球クラブ 公式サイト

石川県白山市を拠点に活動する「白山ラージボール卓球クラブ」の公式ウェブサイトです。
GitHub Pages で公開している静的サイト（素の HTML / CSS / JavaScript）です。

🔗 **公開URL:** https://moviepingpong-art.github.io/hakusan-club/

---

## ページ構成

| ページ | ファイル | 内容 |
|---|---|---|
| トップ | `index.html` | クラブ紹介・お知らせ・大会カウントダウン・関連リンク・部員限定エリア |
| フォトギャラリー | `gallery.html` | 練習・試合・大会の風景（Googleドライブ連携で自動更新） |
| 大会結果 | `matches.html` | 優勝・入賞の記録（`SportsEvent` の構造化データ付き） |
| 全国クラブマップ | `map.html` | 全国のラージボール卓球クラブを地図で紹介 |
| DEEP DIVE | `deepdive.html` | ラージボール卓球の物理・戦術・用具の深掘り解説 |

---

## ファイル構成

```
hakusan-club/
├── index.html / gallery.html / matches.html / map.html / deepdive.html  … 各ページ
├── style.css        … 全体スタイル
├── main.js          … トップの動的処理（川柳・大会カウントダウン・演出など）
├── data.js          … コンテンツデータ（お知らせ・川柳・写真・大会一覧）
├── images.js        … 画像データ定義
├── robots.txt / sitemap.xml            … SEO
├── favicon 各種 / apple-touch-icon.png … アイコン
├── *.jpg / *.mp3    … 背景画像・BGM
└── LICENSE / CLAUDE.md / .nojekyll
```

---

## 技術・運用

- **ホスティング:** GitHub Pages（`.nojekyll` により Jekyll ビルドは無効化）
- **アクセス解析:** Google Analytics（`G-62E06GLKBV`）
- **お問い合わせ:** SSGform エンドポイントへ POST
- **訪問者カウンター:** hits.sh バッジ
- **構造化データ:** トップに `SportsClub`、大会結果ページに `SportsEvent` の JSON-LD
- **SEO:** Google Search Console 認証済み・sitemap 送信済み・IndexNow 対応
- **自動更新:** Google Apps Script（GAS）がギャラリー画像と大会情報を管理し、GitHub API 経由で `data.js` を更新

---

## 開発時の注意

⚠️ **`data.js` の一部は自動管理されています。手編集しないでください。**

- `photos` 配列・`NEWS_LIST`・`TOURNAMENT_LIST` は **GAS による自動更新対象**です。
  リポジトリ上の内容は古い可能性があり、手で書き換えると自動更新の結果を巻き戻してしまいます。
- 手動編集してよいのは `SENRYU_LIST`（川柳）など自動管理されていない部分のみです。
- `data.js` のファイル全体の再生成は禁止です。

その他の運用ルール・各種ID・エンドポイントの詳細は [`CLAUDE.md`](./CLAUDE.md) を参照してください。

---

## ライセンス

本リポジトリおよびサイトの全内容の著作権は白山ラージボール卓球クラブに帰属します。
**無断利用（複製・転載・改変・再配布等）を禁止します。** 詳細は [`LICENSE`](./LICENSE) を参照してください。
