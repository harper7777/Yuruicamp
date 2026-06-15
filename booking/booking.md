## Added（新增）

### booking/css/member-center.css
- 預約系統會員中心專屬樣式
- 完全獨立，不依賴 `../css/main.css`
- 包含：側邊欄、數位會員卡、統計方塊、購買紀錄 sub-tab、折價券、通知、RWD

### booking/member-center.html
- 新增預約系統版會員中心頁面
- 引用 `base.css` + `layout.css` + `booking.css` + `member-center.css`，不引用主站 CSS/JS
- 頁面結構（側邊欄 + 內容）：
  - **總覽**：數位會員卡、快捷統計（待處理訂單 / 即將出發預約 / 未讀通知）、最近活動
  - **個人資料**：姓名、電話、Email、生日、地址
  - **購買紀錄**：含兩個切換 tab
    - `商城購買紀錄`：列出商城訂單（狀態：已完成 / 處理中）
    - `預約紀錄`：列出營地預約（狀態：即將出發 / 已完成 / 已取消）
  - **折價券**：可使用 / 已失效切換
  - **通知**：含「全部標為已讀」功能
- 手機版改為水平滾動 tab 列

### booking/js/member-center.js
- 新增會員中心互動邏輯（純 Vanilla JS，不依賴 main.js）
- 主 Panel 切換（側邊欄 nav + 手機 tab 同步）
- 購買紀錄 sub-tab 切換（商城購買紀錄 ↔ 預約紀錄）
- 折價券 sub-tab 切換（可使用 ↔ 已失效）
- 個人資料表單送出
- 通知全部標為已讀
- 支援 URL `?tab=` 參數直接跳至指定 panel

---

## Changed（修改）

### booking/components/booking-header.html
- 桌機導覽列新增「會員中心」連結 → `./member-center.html`
- 手機 Offcanvas 選單新增「會員中心」連結
- 已登入頭像旁齒輪按鈕連結從 `../pages/member-center.html?tab=camping` 改為 `./member-center.html`

### booking/css/base.css
- 新增 `.modal` 基礎樣式（`display:none; position:fixed; inset:0`）
- 讓 `booking-header.html` 中 `class="modal"` 的登入 Modal 不依賴 main.css

### booking/css/main.css（主站）
- `@supports (-webkit-touch-callout: none)` 包住 `.hero-banner` 的 `-webkit-fill-available`，修正 Windows Chrome 上 hero 高度被壓縮的問題

### booking/js/layout.js
- 移除錯誤複製自 `main.js` 的 `initLayout()`（呼叫了不存在的 `loadPartial`、`setActiveNav` 等函式）
- 改為直接在 `DOMContentLoaded` 時呼叫 `initFloatingActions()`，修正 LINE / 回到頂部懸浮按鈕無法出現的問題

---

## Refactored（重構）

### booking 資料夾獨立化
- 將 `camp-rental.html`、`booking-cart.html`、`booking-faq.html`、`camp-detail.html`、`rental-guide.html` 的 CSS 引用從 `../css/main.css` 改為 `./css/base.css` + `./css/layout.css`
- booking 資料夾所有頁面不再引用主站 `../css/main.css`，與主站完全解耦