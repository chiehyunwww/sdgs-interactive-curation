# 在瀏覽器設定觀展回饋試算表

本專案不使用 Clasp。請直接在 Google 試算表的 Apps Script 編輯器中建立 Web App，然後把部署網址提供給前端設定。

## 建立 Web App

1. 建立一份新的 Google 試算表，確認只有需要的協作者能檢視回饋內容。
2. 在試算表選擇「擴充功能 → Apps Script」。這樣程式會綁定到這份試算表。
3. 將本資料夾的 [`Code.gs`](./Code.gs) 全文貼進編輯器，儲存專案。
4. 選擇「部署 → 新增部署作業」，類型選「網頁應用程式」。
5. 執行身分選擇「我」，存取權選擇允許觀眾匿名使用的「任何人」，完成授權與部署。
6. 複製部署產生、結尾為 `/exec` 的 Web App 網址。不要把 Apps Script 編輯器網址貼進來。

部署設定會讓公開網站訪客可以新增回饋列。表單不收集姓名、電子郵件或其他聯絡資料；請不要在回饋欄位要求使用者提供敏感資訊，也請限制試算表的協作者權限。若部署對話框沒有「任何人」選項，請確認 Google Workspace 管理員是否限制公開 Web App，再依帳戶政策處理。

## 連接本機預覽

在專案根目錄複製 `.env.example` 為 `.env.local`，填入：

```dotenv
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/你的部署識別碼/exec
```

重新啟動 `pnpm dev`。`.env.local` 已被 Git 忽略；這個 URL 是公開回饋端點，不是祕密金鑰。

## 連接 GitHub Pages

在 GitHub repository 的 **Settings → Secrets and variables → Actions → Variables** 新增 repository variable：

- Name：`VITE_APPS_SCRIPT_URL`
- Value：上面複製的 `/exec` 網址

再到 Actions 重新執行 **Deploy to GitHub Pages** workflow。部署成功後，網站表單才會把回饋寫入試算表。若修改 Apps Script，請建立新部署版本，確認 `/exec` 仍指向最新部署。

Apps Script 回應頁會啟用 iframe 嵌入，讓網站收到成功或失敗訊息；回應只包含隨機請求識別碼與狀態，不含觀眾輸入內容。
