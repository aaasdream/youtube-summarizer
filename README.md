# YouTube 影片摘要助手 (YouTube Video Summarizer)

這是一個 Chrome 擴充功能，可以使用 Google Gemini AI 來自動總結 YouTube 影片的內容。它會分析影片的字幕，並生成一個簡潔的摘要。

![示例截圖](screenshots/demo.png)

## 功能特點

- 🎯 一鍵總結 YouTube 影片內容
- 🌐 支援多語言字幕（優先使用中文/英文字幕）
- 🤖 使用 Google Gemini AI 進行智能摘要
- 💡 可自訂提示詞，獲得不同風格的摘要
- 📱 簡潔的使用界面

## 安裝方式

1. 下載此專案的 ZIP 檔案或使用 git clone：
   ```bash
   git clone https://github.com/[您的用戶名]/youtube-summarizer.git
   ```

2. 開啟 Chrome 瀏覽器，進入擴充功能管理頁面：
   - 在網址列輸入 `chrome://extensions/`
   - 或從選單中選擇「更多工具」>「擴充功能」

3. 在擴充功能頁面右上角啟用「開發人員模式」

4. 點擊「載入未封裝項目」，選擇已解壓的專案資料夾

## 使用方法

1. 取得 Gemini API 金鑰：
   - 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 登入您的 Google 帳號
   - 創建新的 API 金鑰

2. 設定擴充功能：
   - 點擊 Chrome 工具列上的擴充功能圖示
   - 在彈出的設定視窗中輸入您的 Gemini API 金鑰
   - 可選：自訂摘要提示詞

3. 使用摘要功能：
   - 前往任何 YouTube 影片頁面
   - 在影片右上角會出現一個 📝 按鈕
   - 點擊按鈕開始生成影片摘要
   - 等待幾秒鐘，摘要結果會以彈窗形式顯示

## 注意事項

- 影片必須要有字幕才能使用此功能
- 建議使用官方字幕或高品質的社群字幕
- API 使用可能需要付費，請參考 [Gemini API 定價](https://ai.google.dev/pricing)
- 目前僅支援 Chrome 瀏覽器

## 自訂提示詞

您可以在擴充功能的設定中自訂提示詞，以獲得不同風格的摘要。預設提示詞為：
```
這個字幕中 