# Changelog

本專案版本異動紀錄。README 底部保留最新摘要，完整紀錄以本檔為準。

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
