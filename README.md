<a id="top"></a>

# AI Image Print Preflight & Fix Guide · AI 圖印刷前檢查與修復指南

<div align="center">

### 🌐 English　｜　[🇹🇼 繁體中文 ↓](#繁體中文)

</div>

A front-end-only tool that helps you quickly see — before sending a file to print — whether an AI-generated image suits a given output size, what might need fixing, and how to hand it to a print shop. It doesn't replace a print shop or a prepress designer; it's a first self-check for people who aren't design professionals.

## Demo
GitHub Pages: https://zxc02621948-sketch.github.io/ai-print-preflight/
Chinese is `index.html`, English is `index.en.html` — switch at the top-right.

## Screenshot
![Main screen](assets/screenshot-hero.png)

## What it checks
After you upload an image and pick an output size, it gives a red/yellow/green overall score with per-item notes:
- **Effective DPI** — computed from your output size. The threshold scales with size: ~300 for normal prints, relaxed only for large prints (banners, billboards), since hitting 300 on huge sizes makes files unmanageable and they're viewed from far away. Above 300 isn't sharper, just gives scaling headroom; small sizes aren't over-demanded either.
- **Sharpness** — whether the source is crisp, in plain words (sharp / slightly soft / soft), no numbers.
- **Grain / specks** — how much fine AI grain or compression noise there is (clean / a little grainy / quite grainy).

It only reports what it can actually measure. Color (CMYK shift) can't be measured, and bleed is just a number you'd type, so those were removed — instead they're mentioned in plain language under "suggestions," telling you to flag them with your print shop when needed.

### Size → DPI thresholds
| Longest output edge | Examples | Green | Yellow | Red |
|---|---|---|---|---|
| ≤ 1 m | business card / A4 / A3 / A2 / A1 / poster | ≥ 300 | 250–299 | < 250 |
| 1–2 m | large poster / standee / small canvas | ≥ 180 | 120–179 | < 120 |
| 2–5 m | banner | ≥ 120 | 80–119 | < 80 |
| > 5 m | billboard | ≥ 80 | 50–79 | < 50 |

### Print-result preview
The middle preview is a draggable comparison: the sharp side is "as is" (the original on your screen), the blurry side is "as printed" (a prediction at this size). When DPI is enough, both look the same; when it's short, the "as printed" side blurs proportionally so you can see the gap with your own eyes.

## Fix suggestions
Based on the current risks, it lists steps to take with matching free tools:
- Low resolution → Upscayl (free desktop AI upscaler)
- Blur / grain / specks → Photopea (in-browser editor)
- Need editable layers → Canva Magic layers
- Vectorize a logo/icon → Inkscape Trace Bitmap (advanced, optional)

It also shows "how big you can print" (actual cm at 300 / 150 / 72 DPI) and a "handoff tips" card with beginner-friendly phrasing for talking to a print shop — no jargon dump.

## How to use
1. Open `index.html` or the live demo above.
2. Upload an image, or click "Load sample."
3. Pick an output size (A3, A2, business card, banner, or custom).
4. Read the overall score and per-item metrics on the right.
5. Drag the middle comparison to see roughly how sharp it'll print.
6. Fix with the suggested external tools, save, re-upload, and re-check.

## Disclaimer
This is a pre-print risk check, not a guarantee of the printed result. Actual quality also depends on the print shop's specs, paper, press and ink, RGB/CMYK conversion, PDF prep, trimming, and bleed. It does not evaluate color (screens are RGB; prints shift) and does not check bleed — for full-bleed jobs (cards, stickers, full-bleed posters), let the print shop handle it.

## ☕ Support
This tool is free and open source. If it helps you, consider buying me a coffee: https://ko-fi.com/kuanming

---

## 繁體中文

<div align="center">

### [🌐 English ↑](#top)　｜　🇹🇼 繁體中文

</div>

AI Print Preflight Guide 是一個純前端工具,幫你在送印前快速看懂 AI 生成圖片適不適合指定尺寸輸出、哪裡可能要修,以及怎麼把圖交給印刷店。它不取代印刷店或完稿師,是給「不是設計專業」的人先自己看一遍用的。

### Demo
GitHub Pages:https://zxc02621948-sketch.github.io/ai-print-preflight/
中文版為 `index.html`,英文版為 `index.en.html`,可在畫面右上切換。

### 截圖
![主畫面](assets/screenshot-hero.png)

### 它會幫你看什麼
上傳圖片、選好輸出尺寸後,工具會給一個紅黃綠燈總分,並逐項說明:
- **有效 DPI**:依你填的輸出尺寸推算。門檻會跟著尺寸自動變 —— 一般輸出以 300 為準,只有大圖(帆布、看板)才放寬,因為大圖做到 300 檔案會大到跑不動、看的距離也遠。超過 300 不是更清楚,只是放大縮小的彈性;小尺寸也不會反過來要求過高。
- **銳利度**:原圖本身夠不夠銳,用白話講「清楚 / 略偏糊 / 偏糊」,不丟數字。
- **顆粒 / 髒點**:AI 圖常有的細小顆粒、壓縮髒點多不多,白話「乾淨 / 有點顆粒 / 顆粒偏多」。

只看工具真的量得到的東西。顏色(CMYK 色偏)量不到、出血只是自己填數字沒意義,都拿掉了,改成在「建議」裡用白話提醒、叫你需要時跟印刷店說一聲。

#### 尺寸 → DPI 門檻
| 輸出最長邊 | 例子 | 綠燈 | 黃燈 | 紅燈 |
|---|---|---|---|---|
| ≤ 1 m | 名片 / A4 / A3 / A2 / A1 / 海報 | ≥ 300 | 250–299 | < 250 |
| 1–2 m | 大海報 / 立牌 / 小帆布 | ≥ 180 | 120–179 | < 120 |
| 2–5 m | 帆布條 | ≥ 120 | 80–119 | < 80 |
| > 5 m | 大看板 | ≥ 80 | 50–79 | < 50 |

#### 印刷後預測對比
中間預覽是一條可拖曳的對比:沒拉過去(清楚那邊)是「本來的樣子」(你螢幕上看到的原圖),拉到糊那邊是「印出來的樣子」(這個尺寸印出來的預測)。DPI 足夠時兩邊幾乎一樣;DPI 不夠時,「印出來」那邊會依缺多少解析度自動變糊,讓你直接用眼睛看落差。

### 修復建議
依目前的風險,工具會列出該做的步驟,並附對應的免費工具:
- 解析度不足 → Upscayl(免費桌面版 AI 放大)
- 模糊 / 顆粒髒點 → Photopea(瀏覽器修圖)
- 需要拆可編輯圖層 → Canva 魔法圖層
- Logo / 圖示要向量化 → Inkscape Trace Bitmap(進階,非必做)

也提供「適合印多大」(300 / 150 / 72 DPI 對應的實際公分數),以及一張「轉檔交付建議」卡,內含新手對印刷店的講法,不堆專業名詞。

### 使用方式
1. 打開 `index.html`,或開上面的線上 Demo。
2. 上傳圖片,或點「載入測試樣張」。
3. 選輸出尺寸(A3、A2、名片、帆布條或自訂)。
4. 看右側總分與各項指標。
5. 拖中間的對比,看印出來大概多清楚。
6. 依「修復教學」用外部工具修正,存檔後重新上傳再評估。

### 免責說明
本工具是送印前的風險檢查,不保證實際印刷結果。實際品質仍受印刷店規格、紙材、印刷機與油墨、RGB / CMYK 轉換、PDF 完稿、裁切與出血等影響。顏色本工具不評估(螢幕是 RGB,印出來會偏),實際以印刷店為準。出血(裁切預留邊)本工具也不檢查;AI 圖通常沒有,若要印到紙的最邊邊(名片、貼紙、滿版海報),送印時交給印刷店處理即可。

### 技術說明
純前端靜態工具,不需後端或 API。主要技術為 HTML、CSS、JavaScript,影像取樣使用 Canvas。可直接部署到 GitHub Pages、Netlify、Vercel 或任何靜態網站服務。中英雙語共用相同邏輯:`index.html` / `app.js` 與 `index.en.html` / `app.en.js`。

### ☕ 支持作者
這個工具是免費且開源的。如果它對你有幫助,歡迎請我喝杯咖啡,支持我持續維護與開發更多免費工具:
👉 https://ko-fi.com/kuanming
