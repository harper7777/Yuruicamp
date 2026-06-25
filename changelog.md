# Changelog

本專案版本異動紀錄。README 底部保留最新摘要，完整紀錄以本檔為準。

# [2026-06-23]
### 預約頁面登出功能

-  booking-header.partial
桌機版： 在 bkUserMenu 的齒輪圖示後面，新增了登出按鈕 .bk-logout-btn（帶有箭頭向右的圖示）。

手機版： 在 offcanvas 選單底部，新增了登出按鈕 .bk-offcanvas__logout-btn（預設為隱藏狀態，登入後才會顯示）。

- booking-header.js
  新增 logout() 函式：
  清除 localStorage 中的 yuruiUser。
  呼叫 checkLoginState() 來更新 UI 介面。
  顯示「已成功登出」的提示訊息。
  更新 checkLoginState() 邏輯：
  現在會同步控制手機版登出選項的「顯示 / 隱藏」狀態。
  自動綁定桌機與手機版這兩個登出按鈕的點擊（Click）事件。

- booking.css
新增樣式： 加入桌機版 .bk-logout-btn 和手機版 .bk-offcanvas__logout-btn 的 CSS 樣式。

視覺設定： 登出按鈕統一採用偏紅色呈現，以增強視覺區別與警示效果。

-互動行為

點擊「頭像 + 名稱 + ▼」→ 開啟下拉選單
下拉選單有「會員中心」和紅色「登出」兩個選項
點選單外任何地方 / 按 Esc → 關閉
視覺效果

下拉選單有淡入 + 向下滑出的動畫
▼ 箭頭在展開時會旋轉 180°
「登出」用紅色文字顯示，hover 有淡紅色背景
手機版 offcanvas 的登出按鈕維持不變

### 預約頁面購物車與結帳頁面

- 1. `booking-cart.html` (改寫)
* **步驟 4「確認背包」**：
    * [ ] 顯示住宿卡片與裝備卡片。
    * [ ] 顯示費用摘要資訊。
    * [ ] 提供「清除背包」功能。
    * [ ] 提供「前往結帳」按鈕。

- 2. `booking-cart.js` (改寫)
* **邏輯處理**：
    * [ ] 從 `localStorage` 讀取資料並渲染兩張卡片（住宿 + 裝備）與費用。
    * [ ] 實作「清除背包」的清除邏輯。

- 3. `booking-checkout.html` (新建)
* **步驟 5「確認結帳」**：
    * [ ] 實作登入守衛（Login Guard），確保使用者已登入。
    * [ ] 建立三個手風琴面板（Accordion）：
        1. 預約明細
        2. 聯絡資訊
        3. 付款方式

- 4. `booking-checkout.js` (新建)
* **邏輯處理**：
    * [ ] 實作表單驗證功能。
    * [ ] 實作付款互動介面。
    * [ ] 處理送出結帳邏輯。
    * [ ] 處理結帳成功後的後續流程。

---

## 🔗 現有連結保持不變說明

以下既有連結**不需要修改**，原因如下：

* [x] **Cart Panel** 的「前往完成預約」按鈕已正確指向 `booking-cart.html`（現為購物車頁）。
* [x] **`camp-rental.js`** 與 **`camp-rental.html`** 的連結皆已正確指向 `booking-cart.html`。
### 清除背包點擊後的window.confirm()改成showConfirmToast
---
# [2026-06-22]
### 預約頁面
- 可直接點擊的測試用第三方登入
- 1. `booking/css/member-center.css` — 新增三組樣式
- [ ] **折價券票券外觀樣式**
  - 包含類別：`.coupon-ticket` / `.coupon-left` / `.coupon-right` / `.copy-btn`
- [ ] **狀態篩選按鈕樣式**
  - 包含類別：`.order-status-tabs` / `.order-status-tab`
- [ ] **訂單詳情 Modal 彈出視窗樣式**
  - 包含類別：`.bk-modal-overlay` / `.bk-modal-box`

 2. `booking/pages/member-center.html` — 三處架構修改
- [ ] **購買紀錄面板（Order Panel）優化**
  - 為「商城商品」與「營區預約」各自規劃獨立的篩選標籤：
    - **商城訂單標籤**：`全部` / `待付款` / `待出貨` / `已完成` / `退貨退款`
    - **預約紀錄標籤**：`全部` / `待付款` / `即將入住` / `已完成` / `取消`
  - 於每筆商城訂單結構中，新增「`查看明細`」操作按鈕。
- [ ] **折價券面板（Coupon Panel）調整**
  - 移除靜態結構，改由 JavaScript 動態渲染。
  - 將切換分頁標籤（Tab）的屬性定義修改為 `data-coupon-tab="active"`。
- [ ] **訂單詳情 Modal 埋設**
  - 將 Modal 的 HTML 基礎結構加在頁面 `<footer>` 標籤之前。

3. `booking/js/member-center.js` — 新增功能與邏輯控制
- [ ] **本機模擬資料層（Mock Data）**
  - `MOCK_COUPONS_MC`：配置折價券模擬資料。
  - `MOCK_ORDERS_MC`：配置歷史訂單與預約模擬資料。
- [ ] **核心函式與商業邏輯實作**
  - `renderMcCoupons()`：動態渲染折價券票券卡片（如：`YURUI100`、`MEMBER10` 等）。
  - `copyMcCouponCode()`：點擊「複製」按鈕時，自動複製折扣碼至剪貼簿，並觸發顯示 Toast 提示訊息。
  - `openMcOrderDetail()`：點擊「查看明細」按鈕時，發起請求並開啟內含詳細商品清單的 Modal 視窗。
  - `filterRecList()`：監聽分頁標籤切換，依據選取的狀態即時過濾並動態渲染購買紀錄列表項目。


---

# [2026-06-20]
### 預約頁面
- alert改成toast
- Line、置頂按鈕懸浮要全域顯示
- header左上角加入logo
---
## [v1.3.1] - 2026-06-14

## 刪除首頁連結，新增預約體驗連結，連結到booking-search.html
## camp-search.html 的id checkInDate, checkOutDate 判斷checkOutDate 不會小於checkInDate

---
# [2026-06-14]
### 預約體驗頁面
- 新增 CSS 、Javascript 檔案
- 新增line、回到頂部的懸浮按鈕
- 更改社群與付款的圖示

---

#  [2026-06-15]

## 預約體驗頁面的會員中心頁面
- 新增 member-center.html 頁面，包含會員資料、購買紀錄、折價券及通知功能
- 新增 member-center.css，提供會員中心專屬樣式
- 新增 member-center.js，實現會員中心的互動邏輯
- 更新 rental-guide.html，新增 favicon 並調整標題格式
- 更新 changelog.md，記錄新增功能與修改內容

#  [2026-06-15]

## 預約體驗頁面
- 新增結帳頁面付款功能
- 側邊欄中新增價錢filter拉桿
- 使用者未登入/註冊時到結帳頁面會自動跳出登入/註冊畫面
- 登入部分 更改為第3方登入且點擊按鈕後從右側滑出

### 將booking資料夾中的html檔案全部移到booking/pages資料夾中


### Added
- 後台「權限管理」模組：`permissions.html`、`permissions.js`
- 員工資料層：`localStorage.adminEmployees`（種子：員工 `01` 超級管理員、`02` 示範員工）
- 逐頁 view/edit 權限：`canView()`、`canEdit()`、`applySidebarPermissions()`、`applyEditPermission()`
- 登入改為員工 ID 驗證；sessionStorage 擴充為 5 個 key

### Changed
- 後台預設首頁改為 `getDefaultSection()`（第一個有 view 權限的模組）
- 登出改為 `clearAdminSession()` 一次清除 5 個 session key

---

## [v1.3.0] - 2026-06-14

### Added
- 後台「預約/租借管理」模組：`bookings.html`、`bookings.js`、`admin/data/bookings.json`
- 預約單確認 / 取消 / 完成 Modal；裝備歸還勾選

### Changed
- `admin/data/customers.json` 補充與預約管理連動欄位
- `admin/dashboard.html`、`core.js` 加入 bookings section

---

## [v1.2.5] - 2026-06-13

### Changed
- 庫存異動紀錄改為 `id`、`date` 與 `items` 明細清單
- 商品管理頁可在庫存確定後按「生產異動紀錄」整合明細
- 異動頁可點擊 ID 連結開啟明細視窗

---

## [v1.2.4] - 2026-06-13

### Added
- 後台「庫存異動紀錄」：`movement.html`、`movement.js`、`admin/data/movement.json`

---

## [v1.2.3] - 2026-06-13

### Added
- 後台商品管理「租借」頁籤，從 `admin/data/reantal.json` 載入 20 筆租借商品
- 新增商品 Modal：租借商品切換與存放營地欄位

---

## [v1.2.2] - 2026-06-13

### Changed
- 後台商品列表移除售價與上架切換
- 新增 `total-stock`、分店 A/B/C 庫存欄位與共用確定按鈕
- 新增商品 Modal 補上商品描述欄位（不寫入資料）

---

## [v1.2.1] - 2026-06-13

### Added
- 後台新增商品 Modal：主要/次要圖片上傳、規格 key 選項與動態規格欄位

---

## [v1.2.0] - 2026-06-12

### Added
- 預約子系統（`booking/`）：6 頁面、5 JS 模組、`booking.css`
- `campgrounds.json`、`rentals.json`、獨立 Header/Footer

### Changed
- 刪除首頁連結，新增「預約體驗」連結至 `booking/camp-search.html`
- `camp-search.html`：`checkOutDate` 不可小於 `checkInDate`

---

## [v1.1.0] - 2026-06-04

### Added
- 賣家管理後台 6 模組：analytics、orders、products、customers、discounts、reviews

---

## [v1.0.2] - 2026-06-03

### Changed
- 新增廣告輪播、響應設計更動、star rating 更動
- 更動檔案：`main.css`、`product-list.js`、`products.html`

---

## [2026-06-07] - 早期結構調整

### Changed
- navbar → header
- header、footer 獨立（navbar、登入 modal）
- 浮動 LINE 客服按鈕移至 `main.js`
