# 一餐之間｜SDGs 互動式數位策展

一場關於「大外食時代如何普及環保餐具」的互動式數位展覽，以 SDG 12 為主軸，連結 SDG 4 的永續生活教育與 SDG 3 的衛生安心。

> GitHub Pages 網址會在首次成功部署後補上。

## 開始使用

需求：Node.js 24、pnpm 11。

```sh
pnpm install
pnpm dev
```

正式建置：

```sh
pnpm build
pnpm preview
```

網站使用 Vite、GSAP 與 ScrollTrigger，靜態輸出位於 `dist/`。GitHub Actions 會在推送至 `main` 後建置並部署到 GitHub Pages。

## 觀展回饋

前端表單需先連接 Google Apps Script Web App 才會將回饋寫入試算表。請依照 [`apps-script/SETUP.md`](./apps-script/SETUP.md) 在瀏覽器完成設定；此專案不使用 Clasp。尚未設定端點時，網站會提示表單尚未連接。

## 策展方向

- **命題：** 讓可重複使用餐具成為外食的更容易採用的預設選項。
- **對象：** 台灣外食消費者、餐飲業者與點餐平台（目前的工作假設）。
- **體驗：** 展場式捲動敘事、餐具預設互動模擬、行動提案與觀展回饋。
- **內容原則：** 以聯合國、台灣環境部及食藥署公開資料為參考，不使用未查證的減量數據。

完整協作與內容準則請見 [`AGENTS.md`](./AGENTS.md)。
