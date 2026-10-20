const FEEDBACK_SHEET_NAME = '觀展回饋';
const FEEDBACK_HEADERS = ['提交時間', '最有感的行動', '觀展想法'];
const ALLOWED_ACTIONS = ['點餐時先詢問', '自備餐具', '借用循環餐具', '改善清洗資訊'];

function doPost(event) {
  const nonce = String(event?.parameter?.nonce || '');
  if (!/^[\w-]{20,80}$/.test(nonce)) return feedbackReply_('', 'error');

  try {
    const payload = JSON.parse(String(event?.parameter?.payload || '{}'));
    const action = String(payload.action || '').trim();
    const message = String(payload.message || '').trim().slice(0, 300);
    if (!ALLOWED_ACTIONS.includes(action)) return feedbackReply_(nonce, 'error');

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) return feedbackReply_(nonce, 'error');

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      let sheet = spreadsheet.getSheetByName(FEEDBACK_SHEET_NAME);
      if (!sheet) sheet = spreadsheet.insertSheet(FEEDBACK_SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(FEEDBACK_HEADERS);
        sheet.getRange(1, 1, 1, FEEDBACK_HEADERS.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([new Date(), action, message]);
    } finally {
      lock.releaseLock();
    }

    return feedbackReply_(nonce, 'ok');
  } catch (error) {
    return feedbackReply_(nonce, 'error');
  }
}

function feedbackReply_(nonce, status) {
  const safeNonce = /^[\w-]{20,80}$/.test(nonce) ? nonce : '';
  const safeStatus = status === 'ok' ? 'ok' : 'error';
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
    window.parent.postMessage({type:'sdgs-feedback-response',nonce:${JSON.stringify(safeNonce)},status:${JSON.stringify(safeStatus)}},'*');
  </script><p>回饋處理完成，可以關閉此頁。</p></body></html>`;
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
