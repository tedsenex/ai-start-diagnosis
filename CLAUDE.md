# AI 時代起步診斷：專案說明（給 Claude Code）

李煜的對話式診斷網頁。主軸是「陪你走過 AI 焦慮」。訪客先選身份，再像聊天一樣作答，最後拿到診斷報告，並用 LINE 預約一對一諮詢。

整個網頁是單一靜態檔 `index.html`，沒有建置步驟，也沒有後端。直接用瀏覽器打開就能跑，放到任何靜態主機（Vercel、Netlify、GitHub Pages）也能上線。

## 檔案結構

```
index.html                 整個網頁：樣式、版面、題庫、計分、報告、預約
assets/logo.png            左上角章魚 logo（已去背、裁切，144×144）。index.html 內是 base64 內嵌版
assets/logo-original.png   logo 原檔
docs/創業準備度評估系統.md   原始評估系統文件：八構面、題庫、評分錨點、紅旗、諮詢流程、台灣創業資源
tests/walkthrough.mjs      自動測試：模擬 iPhone 跑完兩條路線
```

## index.html 內部結構

依出現順序：

1. `<style>`：設計 tokens 在 `:root`，深色模式在兩個 dark 區塊。
2. 版面骨架：`header.top`、`#home`、`#talk`（內含 `#thread` 對話串與 `#dock` 作答區）、`#report`。
3. `<script>`，依序為：
   - `CONTACT`：預約管道。`line` 是 LINE 官方帳號 ID（目前 `@402cgabo`）。
   - 題庫資料：`A_DIMS`、`A_Q`（想創業／做自媒體）、`B_DIMS`、`PAINS`、`B_Q`（企業主／主管）、`PATHS`。
   - 狀態與計分：`S`、`score()`、`dimAvg()`、`compute()`、`anxiety()`、`runway()`。
   - 介面：`home()` 首頁、`rebuild()`／`answer()`／`showDock()`／`undo()` 對話流程。
   - 報告：`radar()`、`dimBars()`、`anxSec()`、`booking()`、`reportA()`、`reportB()`。

## 題目資料格式

```js
{ id:'x1',            // 唯一 id，也是 localStorage 的存檔 key
  dim:'X',            // 所屬構面 k；pre:1 代表開場題（不計分）
  g:'like',           // 構面內的子群組（對應 DIMS 的 g 權重）
  type:'choice',      // choice | likert | skill | number | text | multi
  text:'題目',         // 也可以是 a=>'依答案變化的題目'
  options:[['選項文字', 分數1–5, 焦慮值0–1(可省略)]],
  rev:1,              // likert 反向題
  max:3,              // multi 最多選幾項
  when:a=>...,        // 條件題（例如只問合夥人）
  react:(ans,all)=>'答完後的回饋文字', calm:1 // calm=1 用「緩解一下」樣式
}
```

## 計分規則

- 構面得分 =（題目平均 − 1）÷ 4 × 權重。有子群組的構面先算群組平均，再加權。
- 路線 A 總分 100 分，分 9 個構面，對應 A～E 等級。
  - 有 1 個短板（構面低於 40%）最高 B 級；2 個以上最高 C 級。
  - 有紅旗（`flagsA()`）最高 C 級。
  - 適配度 = X、M、P、A、C；準備度 = R、V、T、L。兩軸以 60% 為分界，決定四種路徑。
- 路線 B 總分 100 分，分 5 構面，對應觀望期、摸索期、試點期、擴散期。注意事項在 `notesB()`，痛點對應 AI 做法在 `PAINS`。
- AI 焦慮指數 = 有焦慮值的已答選項取平均 × 100。0–29 相對踏實、30–59 有點焦慮、60 以上高度焦慮。
- 跑道 = 生活預備金 ÷ 每月必要支出（單位萬元）。

## 品牌與文字規則（改文案前必讀）

- 說話的人是**李煜**，用第一人稱「我」，句子要短。稱呼對方用「你」。
- **不用英文名 TED**。副標固定寫「李煜｜行銷・創業人」。
- 不自稱老師、導師、講師、專家、達人、大師、教練、顧問。
- 禁用詞：爆款、流量密碼、秒懂、賦能、帶你飛、乾貨。
- 不寫沒定案的價格、諮詢時長、回覆時間。
- 自我介紹的三項實績與「為什麼做這份診斷」的引言是李煜本人的原話，改動前要先問。其中第一項目前寫「平台」，之前版本寫「品牌」，還沒確認是哪個。

## 設計

- 視覺參考：海報作品集風格。暖白底、墨黑粗外框、大圓角卡片、一塊大橘色色塊、hashtag 膠囊、圓形箭頭按鈕。
- 主色是橘 `--accent:#F2551D`，輔色是黃 `--sun`。
- 字體：中文用 Noto Sans TC，英文標籤用 Quicksand，大字用 Unbounded，數字用 IBM Plex Mono。
- 淺色與深色兩套都要顧。顏色一律用 token，不要寫死。報告的黑色小卡是刻意寫死的深色。

## 踩過的雷（一定要遵守）

1. **作答區與按鈕不要用 `position:fixed` 固定在畫面底部。** 在 Messenger、LINE 內建瀏覽器裡，鍵盤收起後固定元素會錯位，造成「送出後下一題跳掉」。現在作答區放在對話串最後面，跟著頁面捲動。
2. 輸入框和按鈕並排要用 grid（`minmax(0,1fr) auto`），不要用 flex。舊版 iOS WebView 會把按鈕擠出畫面。
3. 文字題送出時要先 `blur()`，讓鍵盤收起。
4. 用 `el.hidden` 控制顯示時，CSS 必須有 `[hidden]{display:none!important}`。
5. 進度存在 localStorage，key 是 `ai-start-v2`，讀寫都包在 try/catch。**改題目 id 或刪題時要把 key 改版**（例如 `ai-start-v3`），不然舊存檔會對不上。
6. 預約不收任何個資，也沒有後端。按「用 LINE 預約」會打開 `https://line.me/R/oaMessage/%40402cgabo/?{預填訊息}`，對方按傳送後，訊息進 LINE 官方帳號。

## 測試

```bash
npm init -y && npm i -D playwright && npx playwright install chromium webkit
node tests/walkthrough.mjs
```

測試會用 iPhone 13 的尺寸跑完兩條路線。每一題都會檢查作答區有完整出現在畫面內、而且在題目下方；文字題會模擬鍵盤開關；最後檢查 LINE 預約連結。有裝 webkit 就會連 Safari 引擎一起跑。

**改完之後，仍然要用手機在 Messenger 和 LINE 的內建瀏覽器實測一次。** 自動測試模擬不到這兩個 App 的內建瀏覽器。

## 可以接著做的事

- **自動收集結果**：現在答案只存在訪客自己的手機。自架後可以加一個表單端點（Google Apps Script、Formspree、Vercel Function），把結果送到你的試算表或 Notion。
- 加上數據追蹤，看哪一題流失最多人。
- 把 logo 換成 SVG 向量檔，在高解析度螢幕上會更銳利。
