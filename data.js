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
  { date:"2026/05/28", cat:"site", text:"トップページ　管理人川柳を固定ボタンに変更し、今月のひとことを追加。" },
  { date:"2026/05/27", cat:"site", text:"OrangeHUBセクションの背景色、文字色を全面見直し。躍動する朝陽をテーマとして変更" },
  { date:"2026/05/26", cat:"site", text:"ヒーローメニューに音声再生を追加しました。" },
  { date:"2026/05/24", cat:"content", text:"管理人川柳と訪問者カウンタを設置しました。" },
  { date:'2026/05/22', cat:'gallery', text:'写真を追加しました。' },
  { date:'2026/05/21', cat:'site', text:'白山クラブ公式サイトを公開しました' },
];

/* ------------------------------------------------------------
   管理人川柳リスト
   ------------------------------------------------------------
   ★ 仕組み：
   本日の川柳は SENRYU_LIST[今日の経過日数 % リスト長] で自動選択されます。
   配列の順番通りに、毎日次の川柳が表示されます。
   100日でループします。

   ★ 入れ替え方：
   この配列を新しい100個で置き換えるだけ。
   GitHubに data.js をアップロードすれば即反映。
   ------------------------------------------------------------ */
const SENRYU_LIST = [
  // 1〜10：卓球の基本あるある
  { upper:'ラージボール', middle:'追いつけたのに', lower:'空振りで' },
  { upper:'サーブ前',     middle:'トスのルールに', lower:'悩む夜' },
  { upper:'妻のスマッシュ', middle:'俺のドライブより', lower:'よく決まる' },
  { upper:'練習日',       middle:'膝より先に',     lower:'心が折れ' },
  { upper:'ピンポン玉',   middle:'探せばいつも',   lower:'冷蔵庫下' },
  { upper:'ラケットを',   middle:'新調したのに',   lower:'腕変わらず' },
  { upper:'試合前',       middle:'素振り百回',     lower:'寝てしまう' },
  { upper:'卓球部',       middle:'平均年齢',       lower:'知らぬが花' },
  { upper:'ナイスショット', middle:'褒められたのは', lower:'相手の方' },
  { upper:'ミスショット', middle:'ラケットのせい', lower:'にしておく' },

  // 11〜20：シニアあるある
  { upper:'三日坊主',     middle:'今度は本気と',   lower:'毎月言い' },
  { upper:'ジム通い',     middle:'会費だけ毎月',   lower:'届く春' },
  { upper:'健康診断',     middle:'数値だけ見て',   lower:'ジム決意' },
  { upper:'老眼鏡',       middle:'探すメガネを',   lower:'かけている' },
  { upper:'体力測定',     middle:'昨日の俺に',     lower:'また負ける' },
  { upper:'階段で',       middle:'息より先に',     lower:'膝が鳴く' },
  { upper:'健康法',       middle:'覚えるたびに',   lower:'また忘れ' },
  { upper:'若い頃',       middle:'もっと走れた',   lower:'気がしてる' },
  { upper:'昔取った',     middle:'杵柄頼り',       lower:'今は痛い' },
  { upper:'運動後',       middle:'湿布の量で',     lower:'年がバレ' },

  // 21〜30：白山クラブ・仲間
  { upper:'白山の',       middle:'仲間と打てば',   lower:'年忘れ' },
  { upper:'若宮で',       middle:'今日も元気に',   lower:'球追って' },
  { upper:'月水日',       middle:'体育館へと',     lower:'足が向く' },
  { upper:'お茶タイム',   middle:'試合より長い',   lower:'井戸端会' },
  { upper:'差し入れの',   middle:'お菓子で復活',   lower:'第二試合' },
  { upper:'集合写真',     middle:'みんなで笑顔',   lower:'宝物' },
  { upper:'仲間との',     middle:'ラリーが続く',   lower:'幸せだ' },
  { upper:'入会日',       middle:'歓迎されて',     lower:'もう家族' },
  { upper:'引退を',       middle:'言い出しかねて', lower:'もう十年' },
  { upper:'クラブ費は',   middle:'孫の小遣いと',   lower:'同じ額' },

  // 31〜40：試合・大会
  { upper:'抽選で',       middle:'強敵相手と',     lower:'頭抱え' },
  { upper:'優勝の',       middle:'夢を見たまま',   lower:'目が覚めて' },
  { upper:'試合中',       middle:'相手の名前を',   lower:'忘れてた' },
  { upper:'ダブルスは',   middle:'息を合わせて',   lower:'息切れる' },
  { upper:'スポレクで',   middle:'若さに負けず',   lower:'頭使う' },
  { upper:'勝った日は',   middle:'帰りの足が',     lower:'軽くなる' },
  { upper:'負けた日も',   middle:'生ビールでは',   lower:'勝者気分' },
  { upper:'大会日',       middle:'朝五時起きで',   lower:'もう疲れ' },
  { upper:'敗者復活',     middle:'復活したら',     lower:'もう限界' },
  { upper:'メダルより',   middle:'仲間と笑える',   lower:'瞬間を' },

  // 41〜50：道具・用具
  { upper:'ラバーまた',   middle:'貼り替えたのに', lower:'回転無し' },
  { upper:'シューズの',   middle:'値段で選んだ',   lower:'今日もミス' },
  { upper:'ボックスは',   middle:'用具のために',   lower:'家を出る' },
  { upper:'ニューラケット', middle:'箱開ける時が', lower:'ピーク値' },
  { upper:'グリップが',   middle:'手より先に',     lower:'滑り落ち' },
  { upper:'タオルだけ',   middle:'こだわり強い',   lower:'昭和派' },
  { upper:'ユニフォーム', middle:'お腹のサイズが', lower:'毎年違う' },
  { upper:'カバンの中',   middle:'ボールに混じる', lower:'湿布かな' },
  { upper:'試合用',       middle:'ラケット出して', lower:'惚れ直す' },
  { upper:'ラージ球',     middle:'柔らかいから',   lower:'やさしいね' },

  // 51〜60：季節・自然
  { upper:'桜咲く',       middle:'体育館にも',     lower:'春が来る' },
  { upper:'夏の汗',       middle:'タオル何本',     lower:'では足りぬ' },
  { upper:'秋風と',       middle:'白山映える',     lower:'帰り道' },
  { upper:'雪深く',       middle:'体育館まで',     lower:'巡礼路' },
  { upper:'梅雨時は',     middle:'卓球場こそ',     lower:'天国だ' },
  { upper:'新年会',       middle:'去年の自分',     lower:'もうおらず' },
  { upper:'年末も',       middle:'打ち納めまで',   lower:'手は止めず' },
  { upper:'桜散る',       middle:'我が髪の毛も',   lower:'散っていく' },
  { upper:'紅葉狩り',     middle:'よりも卓球',     lower:'紅葉する' },
  { upper:'初日の出',     middle:'拝んだ後に',     lower:'素振り百' },

  // 61〜70：家族
  { upper:'孫が来て',     middle:'ラリー教えて',   lower:'抜かれそう' },
  { upper:'妻といる',     middle:'時間より長く',   lower:'クラブに居' },
  { upper:'家事よりも',   middle:'卓球優先',       lower:'妻の声' },
  { upper:'娘から',       middle:'父さんすごいと', lower:'言われたい' },
  { upper:'息子より',     middle:'まだ俺の方が',   lower:'動けると' },
  { upper:'孫からの',     middle:'じいじ卓球',     lower:'褒められる' },
  { upper:'夫婦して',     middle:'クラブに通って', lower:'仲深まる' },
  { upper:'妻が言う',     middle:'卓球やめたら',   lower:'寝てるだけ' },
  { upper:'敬老の日',     middle:'孫より早く',     lower:'走れたぞ' },
  { upper:'晩酌が',       middle:'卓球後では',     lower:'格別だ' },

  // 71〜80：健康・体調
  { upper:'血圧の',       middle:'数値も下がる',   lower:'打った後' },
  { upper:'ぎっくり腰',   middle:'試合の日には',   lower:'治る不思議' },
  { upper:'整骨院',       middle:'卓球仲間と',     lower:'再会す' },
  { upper:'湿布薬',       middle:'貼る場所だけは', lower:'増えていく' },
  { upper:'階段を',       middle:'駆け上がれたら', lower:'若さ戻る' },
  { upper:'整形外科',     middle:'通うルートも',   lower:'体育館経由' },
  { upper:'反射神経',     middle:'若い頃ほど',     lower:'錯覚も' },
  { upper:'寝違えても',   middle:'試合がある日',   lower:'治ってる' },
  { upper:'マッサージ',   middle:'卓球後だけは',   lower:'極楽だ' },
  { upper:'眠れない',     middle:'試合前夜は',     lower:'子供かな' },

  // 81〜90：勝負・心境
  { upper:'集中力',       middle:'切れた瞬間',     lower:'打たれる球' },
  { upper:'気合だけ',     middle:'十分なのに',     lower:'届かない' },
  { upper:'勝ち急ぎ',     middle:'自滅した時の',   lower:'空しさよ' },
  { upper:'リードした',   middle:'瞬間ミスする',   lower:'いつものこと' },
  { upper:'ジュース戦',   middle:'心臓だけが',     lower:'若返る' },
  { upper:'もう一本',     middle:'言いつつ既に',   lower:'帰り支度' },
  { upper:'相手より',     middle:'自分との戦い',   lower:'今日もまた' },
  { upper:'プレッシャー', middle:'もうこの歳で',   lower:'味わうとは' },
  { upper:'拾い続け',     middle:'いつかは届く',   lower:'信じてる' },
  { upper:'勝ち負けより', middle:'打てる喜び',     lower:'噛みしめる' },

  // 91〜100：人生・哲学
  { upper:'生涯スポーツ', middle:'やめたら老いが', lower:'追いつくよ' },
  { upper:'石川の',       middle:'仲間と歩む',     lower:'卓球道' },
  { upper:'下手なまま',   middle:'楽しめるのが',   lower:'真の達人' },
  { upper:'上達は',       middle:'孫の成長',       lower:'よりゆっくり' },
  { upper:'歳とるは',     middle:'技も増えると',   lower:'信じてる' },
  { upper:'まだまだと',   middle:'言える仲間が',   lower:'宝物' },
  { upper:'打てる日々',   middle:'当たり前ではと', lower:'噛み締める' },
  { upper:'卓球は',       middle:'人生縮図と',     lower:'コーチ言う' },
  { upper:'明日もまた',   middle:'体育館へと',     lower:'足が向く' },
  { upper:'生きてれば',   middle:'いつでも打てる', lower:'幸せだ' },
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
    "src": "https://drive.google.com/thumbnail?id=1RIJASatiAk-Blx8HeZdVM8VzUwiVE-CA&sz=w800",
    "category": "match",
    "caption": "2026/5/30ゆーりんピック"
  },
  {
    "id": 9,
    "src": "https://drive.google.com/thumbnail?id=14S67-yQkv_umKUIz_Z0c_ZjsCrohGkjM&sz=w800",
    "category": "match",
    "caption": "2026/5/10スポレク2"
  },
  {
    "id": 10,
    "src": "https://drive.google.com/thumbnail?id=1yGR9YRV0-nB9HvlbMTnDotNMqBT_2C3N&sz=w800",
    "category": "match",
    "caption": "2026/5/10スポレク優勝"
  },
  {
    "id": 11,
    "src": "https://drive.google.com/thumbnail?id=16fb7Q4ZS3zV0T8KvF-Zj8kCHKgNXaKqg&sz=w800",
    "category": "match",
    "caption": "2026/5/10スポレク1"
  },
  {
    "id": 12,
    "src": "https://drive.google.com/thumbnail?id=1tFdwbHuL8SInlqP5nrkZvd-52nOEVzbn&sz=w800",
    "category": "interaction",
    "caption": "能美クラブさん（石川総合スポーツセンター）"
  },
  {
    "id": 13,
    "src": "https://drive.google.com/thumbnail?id=1UrjFB9027WCPaiS8--TG-n9joMTJtI5b&sz=w800",
    "category": "interaction",
    "caption": "兼六クラブさん"
  },
  {
    "id": 14,
    "src": "https://drive.google.com/thumbnail?id=1yRrbwj8XWEfiUFLtzy1cWA6WaUO0jzmw&sz=w800",
    "category": "interaction",
    "caption": ""
  }
];
