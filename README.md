# 一餐之間｜SDGs 互動式數位策展

一場關於「大外食時代如何普及環保餐具」的互動式數位展覽，以 SDG 12 為主軸，連結 SDG 4 的永續生活教育與 SDG 3 的衛生安心。

> 線上展覽：[https://chiehyunwww.github.io/sdgs-interactive-curation/](https://chiehyunwww.github.io/sdgs-interactive-curation/)

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

- **命題：** 大外食時代如何普及環保餐具；優先選擇提供循環餐具的店家。
- **對象：** 外食的大學生與上班族。
- **體驗：** 展場式捲動敘事、餐具預設互動模擬、環境部綠食飯桌公開資料探索、行動提案與觀展回饋。
- **資料界線：** 環境部名錄不標示每家店的循環餐具服務，網站會提示觀眾出發前向店家確認；不使用未查證的減量數據。

完整協作與內容準則請見 [`AGENTS.md`](./AGENTS.md)。
