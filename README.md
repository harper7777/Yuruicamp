# Yuruicamp 露營選物品牌網站

> 探索戶外，從這裡開始 🏕️

## 📋 專案概述

Yuruicamp 是一個完整的露營選物電商網站前端實現，包含 `pages/` 下 **11 個**買家功能頁面、Mock API 層、完整 RWD 響應式設計，以及一套獨立的**賣家管理後台**（含員工 ID 登入、**九大管理模組**、逐頁 view/edit 權限、圖表儀表板）。

**開發目標**：能跑 → 看懂 → 好改 → 效能，按此優先順序逐步實現。

**技術棧**：

| 技術 | 用途 |
|------|------|
| HTML5 | 語義化頁面結構 |
| SCSS / CSS3 | 買家前台樣式系統、約 4900 行完整 CSS |
| Vanilla JavaScript | 買家前台頁面互動邏輯（無框架依賴）|
| Bootstrap 5 + jQuery 3 + Chart.js | 賣家後台 UI 框架、圖表視覺化 |
| Mock API（localStorage / sessionStorage + JSON）| 模擬前後台資料，預留真實 API 接入點 |
| Git | 版本控制 |

**建置狀態**：✅ 買家前台 14 階段完成 + 賣家後台 9 模組完成（2026/06/15，含租借多營地庫存與異動員工 ID）+ 預約子系統 6 頁面完成（2026/06/12）

---

## 📁 目錄結構

```
Yuruicamp/
├── index.html                    # 品牌入口頁（重定向至 home）
│
├── admin/                        # ⭐ 賣家管理後台（完全獨立模組）
│   ├── login.html                # 後台登入頁（員工 ID 驗證 → sessionStorage）
│   ├── dashboard.html            # 後台主框架（Sidebar + Topbar + 動態內容區 + 新增商品 Modal）
│   ├── css/
│   │   └── admin.css             # 後台專屬樣式（炭黑 Sidebar + 品牌深青綠 Accent）
│   ├── js/
│   │   ├── permissions.js        # 權限管理：員工資料層（localStorage）+ ADMIN_SECTIONS 定義
│   │   ├── core.js               # Auth 守衛、權限 helper、loadSection()、showAdminToast()
│   │   ├── analytics.js          # 數據總覽：KPI 計算、Chart.js 折線圖 + 甜甜圈圖
│   │   ├── orders.js             # 訂單管理：表格、篩選、出貨操作、詳情 Modal
│   │   ├── movement.js           # 庫存異動紀錄：配送店 / 接收店 / 負責員工 ID 異動表格
│   │   ├── products.js           # 商品管理：商店 / 租借頁籤、庫存編輯、多營地租借庫存、新增 Modal
│   │   ├── customers.js          # 會員管理：Accordion、等級/點數/優惠券編輯
│   │   ├── discounts.js          # 折扣管理：優惠券 CRUD、隨機碼產生
│   │   ├── reviews.js            # 評論管理：評論卡片、星等篩選、回覆功能
│   │   └── bookings.js           # 預約/租借管理：預約單表格、確認/取消/完成
│   ├── partials/                 # 九個功能模組的 HTML 片段（由 core.js 動態載入）
│   │   ├── analytics.html        # 數據總覽版面（KPI 卡 + 圖表 canvas）
│   │   ├── orders.html           # 訂單管理版面
│   │   ├── movement.html         # 庫存異動紀錄版面
│   │   ├── products.html         # 商品管理版面
│   │   ├── customers.html        # 會員管理版面
│   │   ├── discounts.html        # 折扣管理版面
│   │   ├── reviews.html          # 評論管理版面
│   │   ├── bookings.html         # 預約/租借管理版面
│   │   └── permissions.html      # 權限管理版面
│   └── data/                     # 後台專用 Mock 靜態資料（與買家端 data/ 分離）
│       ├── orders.json           # 6 筆訂單（含出貨狀態、付款狀態、品項明細）
│       ├── movement.json         # 20 筆庫存異動主檔（含負責員工 ID 與異動明細清單）
│       ├── products.json         # 10 筆商品（含 total-stock 與 branch 分店庫存）
│       ├── reantal.json          # 20 筆租借商品（camp 陣列保存 2~5 個營地與各自數量）
│       ├── customers.json        # 6 位會員（含等級、點數、優惠券）
│       ├── coupons.json          # 5 張優惠券（含啟用/停用狀態）
│       ├── reviews.json          # 5 則評論（含回覆狀態）
│       └── bookings.json         # 10 筆預約單（含付款/預約狀態、營位與租借明細）
│
├── booking/                      # ⭐ 營地預約子系統（完全獨立模組）
│   ├── camp-search.html          # 營區搜尋與列表頁
│   ├── camp-detail.html          # 營區詳情與預約頁
│   ├── camp-rental.html          # 裝備租借頁
│   ├── booking-cart.html         # 預約購物車與結帳頁
│   ├── rental-guide.html         # 租借體驗說明頁
│   ├── booking-faq.html          # 預約系統專屬 FAQ
│   ├── components/
│   │   ├── booking-header.partial # 預約系統專屬 Header fragment（避免 Live Server 注入破壞）
│   │   └── booking-footer.partial # 預約系統專屬 Footer fragment
│   ├── css/
│   │   └── booking.css           # 預約系統專屬樣式
│   ├── js/
│   │   ├── booking-header.js     # Badge 動態更新、登入狀態判斷
│   │   ├── booking-cart.js       # 結帳頁邏輯
│   │   ├── camp-search.js        # 搜尋篩選邏輯
│   │   ├── camp-detail.js        # 日期選擇 + 庫存連動
│   │   └── camp-rental.js        # 裝備推薦 + 租借計費
│   └── data/                     # 預約系統專用 Mock 靜態資料（與買家端 data/ 分離）
│       ├── campgrounds.json      # 8 筆營區資料（含 zones 營位定價）
│       └── rentals.json          # 8 筆租借裝備資料（依 campground_id 分組）
│
├── css/
│   ├── variables.scss            # 色彩、字體、間距變量系統
│   ├── base.scss                 # CSS Reset + 全局樣式
│   ├── components.scss           # 可重用元件樣式
│   ├── layout.scss               # 佈局 + Grid 系統
│   ├── main.scss                 # SCSS 入口（引入上述四個檔案）
│   └── main.css                  # ⭐ 編譯後主樣式（約 4900 行，包含 RWD + 瀏覽器相容）
│
├── js/
│   ├── config.js                 # 全局配置（AppConfig）與狀態（AppState）
│   ├── api-mock.js               # Mock API 層（window.API，預留後端接入點）
│   ├── main.js                   # 應用初始化、Lazy Loading Fallback、Scroll Lock
│   ├── components/               # 可跨頁面複用的 UI 元件
│   │   ├── header.js             # 導航欄（PC + Offcanvas 手機版）
│   │   ├── modal.js              # Modal（登入 + 個人化問卷 Stepper）
│   │   ├── cart.js               # 購物車邏輯（Badge + localStorage）
│   │   ├── toast.js              # Toast 提示工廠函數
│   │   ├── carousel.js           # 品牌輪播（CSS animation）
│   │   └── filter.js             # 商品篩選（CustomEvent 驅動）
│   └── pages/                    # 各頁面獨立邏輯
│       ├── home.js               # 首頁：精選商品渲染、加入購物車
│       ├── product-list.js       # 商品列表：網格渲染、分頁
│       ├── product-detail.js     # 商品詳情：圖集、規格、數量 Stepper
│       ├── cart.js               # 購物車頁：增刪改查、未登入攔截
│       ├── checkout.js           # 結帳：手風琴表單、運費計算
│       ├── member-center.js      # 會員中心：訂單/評價/折價券/通知
│       ├── blog.js               # 部落格列表：文章動態渲染
│       ├── blog-detail.js        # 文章詳情：內嵌商品導購卡片
│       ├── branches.js           # 分店：地圖 iframe 切換、合作店家 Modal
│       └── faq.js                # FAQ：Accordion + NPS 問卷
│
├── data/                         # Mock 靜態資料（JSON）
│   ├── products.json             # 50+ 商品資料
│   ├── users.json                # 模擬用戶資料
│   ├── orders.json               # 訂單資料
│   ├── reantalOrders.json        # 租借訂單資料
│   ├── articles.json             # 部落格文章
│   └── branches.json             # 分店 + 合作店家
│
├── pages/                        # 買家前台功能頁面（11 個）
│   ├── home.html                 # 首頁
│   ├── products.html             # 商品列表
│   ├── product-detail.html       # 商品詳情
│   ├── cart.html                 # 購物車
│   ├── checkout.html             # 結帳
│   ├── checkout-success.html     # 結帳成功
│   ├── member-center.html        # 會員中心
│   ├── blog.html                 # 部落格列表
│   ├── blog-detail.html          # 文章詳情
│   ├── branches.html             # 分店地圖
│   └── faq.html                  # 常見問題
│
├── components/                   # 可重用 HTML 片段（靜態範本）
│   ├── header.partial             # 共用 Header fragment，由 js/main.js 載入
│   └── footer.partial             # 共用 Footer fragment，由 js/main.js 載入
│
├── assets/
│   └── images/                   # 靜態圖片資源（brand_icon.png 等）
│
├── color/
│   └── color.md                  # 品牌色彩規範文件
│
├── plans/
│   ├── pageForBuyer.md              # 買家前台規劃文件（14 階段 + 驗證紀錄）
│   ├── pageForSeller.md             # 賣家後台規劃文件（後台設計規格書）
│   ├── pageForBooking.md            # 預約子系統規格書（SDD v1.0.0）
│   ├── bookingHeaderFooterUpdate.md # 預約 Header/Footer 前端規格書
│   ├── adminBooking.md              # 後台預約/租借管理模組任務清單
│   └── adminPermissions.md          # 後台權限管理 SDD（員工 + 逐頁權限）
│
├── thoughts/                     # 開發思考筆記（buyer.md、seller.md）
├── README.md                     # 此文件（專案說明，給外部人看）
├── userguide.md                  # 開發者工作手冊（改檔案時查表用）
├── changelog.md                  # 版本異動紀錄
└── .gitignore
```

---

## 🚀 快速開始

### 環境要求

- 現代瀏覽器：Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+
- 本地 Web 伺服器（避免 CORS 問題，因為有 fetch JSON 資料）

### 啟動方式

**方式 1：VS Code Live Server（推薦）**

安裝 [Live Server 擴充套件](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)，在根目錄右鍵 → Open with Live Server。

> 共用 Header / Footer 片段使用 `.partial` 副檔名，而不是 `.html`。這是為了避免 Live Server 對 HTML fragment 注入 live reload script，造成像 `components/header` 這類被 `fetch()` 載入的片段 response 截斷。

**方式 2：Python 3**

```bash
cd Yuruicamp
python -m http.server 8000
# 瀏覽器開啟 http://localhost:8000
```

**方式 3：Node.js**

```bash
npx http-server -p 8000
# 瀏覽器開啟 http://localhost:8000
```

### 首次使用建議路徑

**買家前台（購物流程）**

```
入口頁 → index.html
首頁   → pages/home.html
商品   → pages/products.html → pages/product-detail.html
購物   → pages/cart.html → pages/checkout.html → pages/checkout-success.html
會員   → pages/member-center.html
內容   → pages/blog.html → pages/blog-detail.html
分店   → pages/branches.html
服務   → pages/faq.html
```

**賣家後台（管理流程）** — 詳見 [userguide.md 第 13 節](userguide.md#13-賣家後台--admin)

```
登入   → admin/login.html（Demo 員工 ID：01 老闆 / 02 員工，密碼任意非空）
後台   → admin/dashboard.html（預設載入第一個有 view 權限的模組）
         ├── 分析報表      ← Sidebar「分析報表」
         ├── 訂單管理      ← Sidebar「訂單管理」
         ├── 庫存異動紀錄  ← Sidebar「庫存異動紀錄」
         ├── 商品與庫存    ← Sidebar「商品與庫存」
         ├── 客戶管理      ← Sidebar「客戶管理」
         ├── 折扣管理      ← Sidebar「折扣管理」
         ├── 評論管理      ← Sidebar「評論管理」
         ├── 預約/租借管理 ← Sidebar「預約/租借管理」
         └── 權限管理      ← Sidebar「權限管理」
登出   → Sidebar 底部或 Topbar 頭像 → 登出（清除 5 個 sessionStorage key，返回登入頁）
```

> 💡 後台登入狀態用 `sessionStorage`（5 個 key）；員工主檔用 `localStorage.adminEmployees`。關閉分頁後 session 自動清除，不影響買家前台的 `localStorage`。

**預約系統（預約流程）**

```
搜尋   → booking/camp-search.html（篩選地區、環境、設施）
詳情   → booking/camp-detail.html（選日期、選營位類型，寫入 localStorage.bookingCart）
租借   → booking/camp-rental.html（加選裝備，更新 bookingCart）
結帳   → booking/booking-cart.html（確認明細、填聯絡資訊、送出預約）
說明   → booking/rental-guide.html（租借流程圖文說明）
FAQ    → booking/booking-faq.html（預約與退款常見問題）
```

> 💡 預約系統使用獨立的 `localStorage.bookingCart` 儲存跨頁資料，與電商購物車的 `localStorage.cart` 完全分離，互不干擾。

---

## 🎨 設計系統

### 色彩規範

| 用途 | 色碼 | 預覽 |
|------|------|------|
| 主色 Primary | `#244d4d` | 深青綠（品牌主軸）|
| 副色 Secondary | `#779999` | 淺青灰綠 |
| 成功 Success | `#4caf50` | 綠色 |
| 危險 Danger | `#d32f2f` | 紅色 |
| 輕背景 | `#f6fbf6` | 淺綠底 |
| 深 Hover | `#316868` | 按鈕懸停 |

所有色彩定義於 `css/variables.scss`，並由 `main.css` 的 CSS Custom Properties 引入。

> 💡 **預約子系統色彩差異**：預約端 Header 背景使用 `#F2F0EB`（淺大地米色），有別於買家端 `#f6fbf6`（淺綠白），讓使用者一眼辨識已切換至不同服務頻道。詳見 `booking/css/booking.css`。

### 響應式斷點（RWD）

| 斷點 | 寬度 | 目標裝置 |
|------|------|---------|
| xs | < 576px | iPhone SE、小型 Android |
| sm | 576–767px | 大型手機 |
| md | 768–991px | iPad 直式 |
| lg | 992–1199px | iPad 橫式、筆電 |
| xl | 1200–1399px | 桌上型電腦 |
| xxl | ≥ 1400px | 大型螢幕 |

**手機版特別處理**：
- Touch Target ≥ 44px（符合 Apple HIG 與 Material Design 規範）
- `input` / `select` 強制 `font-size: 16px` 避免 iOS Safari 頁面縮放
- Safe Area Inset 支援（iPhone 有 Home Bar 機型）
- Offcanvas 開啟時鎖定 body 捲動（iOS Safari 適配）
- Navbar Offcanvas 從左側滑入（`.navbar-offcanvas` 補齊 `position:fixed; transform:translateX(-100%)`，預設隱藏，點漢堡☰後滑入）

---

## 🔧 全局 API 速查

### 應用狀態（AppState）

```javascript
// 讀取
window.AppState.isLoggedIn    // Boolean - 是否已登入
window.AppState.currentUser   // Object  - 當前用戶資料
window.AppState.cart          // Array   - 購物車商品列表
window.AppState.preferences   // Object  - 個人化喜好

// 持久化（寫入 localStorage）
window.saveAppState()

// 重置（清除所有狀態與 localStorage）
window.resetAppState()
```

### Mock API（`window.API`）

```javascript
// 商品
await window.API.products.getAll(filters)       // 取得商品列表（支援篩選）
await window.API.products.getById(productId)    // 取得單一商品詳情

// 用戶
await window.API.users.login(email, password)   // 模擬登入
await window.API.users.getProfile(userId)       // 取得用戶資料

// 訂單
await window.API.orders.getAll(userId)          // 取得用戶訂單列表
await window.API.orders.create(orderData)       // 建立訂單（模擬）

// 文章
await window.API.articles.getAll()              // 取得文章列表
await window.API.articles.getById(articleId)   // 取得文章詳情

// 分店
await window.API.branches.getAll()              // 取得分店列表
```

> 💡 日後接入真實後端只需修改 `js/api-mock.js` 的實作，頁面邏輯無需改動。

### UI 元件函數

```javascript
// Toast 提示
window.showToast(message, type)
// type: 'success' | 'error' | 'warning' | 'info'
// 範例：window.showToast('已加入購物車', 'success')

// Modal 對話框
window.openModal(modalId)    // 開啟 Modal
window.closeModal(modalId)   // 關閉 Modal
// 範例：window.openModal('loginModal')

// 購物車操作
window.addToCart(product, quantity)         // 加入購物車
window.removeFromCart(productId)            // 移除商品
window.updateCartQuantity(productId, qty)   // 更新數量
window.clearCart()                          // 清空購物車
```

### 工具函數

```javascript
window.formatCurrency(3500)           // → 'NT$3,500'
window.formatDate('2026-06-03')       // → '2026/06/03'
window.generateId()                   // → 'id-1748922345-abc123xyz'
window.isValidEmail('a@b.com')        // → true / false
window.isValidPhone('0912345678')     // → true / false
window.calculateCartTotal()           // → Number（購物車總金額）
window.calculateShippingFee(total)    // → 0 或 60（依免運門檻）
window.debounce(fn, 300)              // 防抖（搜尋框使用）
window.throttle(fn, 100)              // 節流（滾動事件使用）
```

---

## 🗄️ localStorage 結構

| 鍵 | 型別 | 說明 |
|----|------|------|
| `isLoggedIn` | Boolean | 登入狀態 |
| `currentUser` | Object / null | 當前用戶資料 |
| `cart` | Array | 電商購物車商品（`[{id, name, price, quantity, ...}]`）|
| `preferences` | Object | 個人化問卷結果（風格偏好、裝備需求）|
| `theme` | String | 主題（預留，目前固定 `'light'`）|
| `memberProfile` | Object | 會員中心儲存的個人資料 |
| `bookingCart` | Object | 預約購物車（`{booking_info, selected_zones, selected_rentals, summary}`）|
| `adminEmployees` | Array | 後台員工清單與逐頁權限（`permissions.js` 種子初始化）|

> ⚠️ `cart`（電商）與 `bookingCart`（預約）是兩個**完全獨立**的 localStorage key，互不干擾。

### sessionStorage 結構（後台）

| 鍵 | 型別 | 說明 |
|----|------|------|
| `adminLoggedIn` | String | `"true"` 表示已登入 |
| `adminId` | String | 員工 ID（例：`"01"`）|
| `adminName` | String | 顯示名稱 |
| `isSuperAdmin` | String | `"true"` / `"false"` |
| `adminPermissions` | String | JSON 字串，各 section 的 `{ view, edit }` |

---

## ⚡ 效能優化（第 14 階段）

所有頁面已套用以下最佳化措施：

- **`<link rel="preconnect">`**：所有 HTML 預先與外部圖片伺服器建立連線，減少 DNS 查詢延遲
- **`<script defer>`**：所有 JS 延遲載入，不阻塞 HTML 解析與首屏渲染
- **`loading="lazy"`**：非首屏圖片懶加載，減少初始請求數
- **Lazy Loading Fallback**：不支援原生 lazy 的舊瀏覽器，自動切換 `IntersectionObserver` 模擬
- **`<meta name="theme-color">`**：手機瀏覽器狀態列顯示品牌綠色 `#244d4d`
- **`will-change`**：動畫元素預先通知瀏覽器 GPU 合成，動畫更流暢
- **CSS Containment**：商品卡與部落格卡設定 `contain: layout style`，限制重排範圍
- **`@media (prefers-reduced-motion)`**：尊重使用者「減少動態效果」的無障礙偏好
- **`@media print`**：列印樣式隱藏導航、影片、Toast 等非必要元素

---

## 🌐 瀏覽器相容性（第 14 階段）

| 瀏覽器 | 最低版本 | 說明 |
|--------|---------|------|
| Chrome / Edge | 90+ | 完整支援 |
| Firefox | 88+ | 完整支援 |
| Safari | 14+ | 已加入 `-webkit-` 前綴、iOS 縮放修正、Safe Area 支援 |
| Samsung Internet | 14+ | 基於 Chromium，完整支援 |

**已處理的相容性問題**：
- Flexbox / Transform `-webkit-` vendor prefix
- CSS Grid fallback（不支援 Grid 的瀏覽器改用 Flex）
- `select` 下拉箭頭 Safari 樣式修正
- `appearance: none` 跨瀏覽器表單樣式統一
- `scroll-behavior: smooth` 降級處理

---

## 🔐 後端接入指南

Mock API 採用適配器模式設計，日後切換真實後端只需改動一個檔案：

**目前（Mock）**：
```javascript
// js/api-mock.js 內部從 JSON 檔讀取
window.API.products.getAll = async (filters) => {
  const data = await fetch('../data/products.json').then(r => r.json());
  return data.filter(/* ... */);
};
```

**日後（真實 API）**：
```javascript
// 只需修改 api-mock.js，pages/*.js 的呼叫方式完全不變
window.API.products.getAll = async (filters) => {
  const res = await fetch(`${window.AppConfig.API_BASE_URL}/products`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  });
  return await res.json();
};
```

API Base URL 設定在 `js/config.js`：
```javascript
window.AppConfig.API_BASE_URL = 'http://localhost:3000/api'; // 修改此處即可
```

---

## 📦 關鍵數字

| 項目 | 買家前台 | 賣家後台 | 預約系統 | 合計 |
|------|---------|---------|---------|------|
| HTML 頁面 | 11 個 | 2 個（login + dashboard）+ 9 個 partials | 6 個 | 28 個 |
| JavaScript 模組 | 19 個（6 元件 + 10 頁面 + 3 核心）| 10 個（permissions + core + 8 功能）| 5 個 | 34 個 |
| CSS 檔案 | 1 個（main.css）| 1 個（admin.css）| 1 個（booking.css）| 3 個 |
| Mock 資料 JSON | 6 個（data/）| 8 個（admin/data/）| 2 個（booking/data/）| 16 個 |
| RWD 斷點 | 6 個（xs / sm / md / lg / xl / xxl）| Bootstrap 5 斷點（同套）| 768px 主要斷點 | — |
| 儲存機制 | localStorage（8 個鍵，含 bookingCart、adminEmployees）| sessionStorage（5 個 key）| localStorage.bookingCart | — |

---

## 🗺️ 未來擴展方向

| 方向 | 說明 |
|------|------|
| 接入真實後端（前台）| 修改 `js/api-mock.js` 的各函數實作，頁面邏輯零改動 |
| 接入真實後端（後台）| 修改 `admin/js/*.js` 中各 `fetch('../data/xxx.json')` 及 `permissions.js` 的 localStorage 邏輯改為真實 API |
| 後台密碼驗證 / 操作日誌 | 逐頁 view/edit 權限已完成；待辦：密碼後端驗證、審計紀錄（見 [plans/adminPermissions.md](plans/adminPermissions.md)）|
| 升級至 SPA | 以 Vue 3 或 React 重構，可直接複用現有 CSS 設計系統與 JSON 資料 |
| 加入數據分析 | 在 `main.js` 的 `initGlobalListeners()` 接入 GA4 / GTM 事件追蹤 |
| 自動化測試 | 以 Playwright 或 Cypress 撰寫自動化測試腳本 |
| 深色模式 | `main.css` 已預留 `@media (prefers-color-scheme: dark)` 區塊 |
| PWA | 加入 `manifest.json` 與 Service Worker 支援離線瀏覽 |

---

## 📞 品牌聯絡資訊

- **電話**：0800-123-456
- **信箱**：support@yuruicamp.com
- **地址**：台北市信義區信義路五段 100 號
- **LINE 客服**：右下角浮動按鈕（所有頁面均可使用）

---
**最後更新**：2026/06/23（會員中心訂單篩選合併）
**版本**：1.3.14
**開發計劃**：[plans/pageForBuyer.md](plans/pageForBuyer.md)（買家前台）｜[plans/pageForSeller.md](plans/pageForSeller.md)（賣家後台）｜[plans/pageForBooking.md](plans/pageForBooking.md)（預約系統）｜[plans/adminBooking.md](plans/adminBooking.md)（後台預約管理）｜[plans/adminPermissions.md](plans/adminPermissions.md)（後台權限）

**更新紀錄**（完整版見 [changelog.md](changelog.md)）：
- `v1.3.14`（2026/06/23）：會員中心購買訂單動態篩選移除獨立「處理中」與「貨到付款」按鈕；舊 `processing` 狀態會併入「待出貨」`unshipped`，舊 `cod` 付款狀態會併入「待付款」`paid`，結帳新增貨到付款訂單也改寫入 `paymentStatus: "paid"`；租借訂單舊 `processing` / `shipped` / `delivered` 只作相容 alias，不再渲染成獨立篩選按鈕。
- `v1.3.13`（2026/06/23）：會員中心移除購買 / 租借共用的 `order-status-tabs`，改為 `purchaseOrdersPanel` 與 `rentalOrdersPanel` 各自動態渲染篩選列；購買訂單篩選依 `data/orders.json` 的 `status` 與新增 `paymentStatus` 產生，支援待付款 `paid`、已付款 `unpaid`、待出貨 `unshipped`、已出貨 `shipped`、已完成 `delivered`、已退貨 `returned`、貨到付款 `cod`；租借訂單篩選依 `data/reantalOrders.json` 的 `status` 與新增 `paymentStatus` 產生，支援已退款 `refunded`、已付款 `paid`、待確認 `pending`、已確認 `confirmed`、已完成 `completed`、已取消 `cancelled`；結帳新增訂單狀態同步改為 `unshipped` 並寫入 `paymentStatus`。
- `v1.3.12`（2026/06/23）：`data/users.json` 新增 `points` 預設 760，會員中心 `cardPoints` 改為讀取 `users.json` points 並監聽 mock 點數增量動態更新；`data/orders.json` 每筆訂單新增 `points`，訂單明細顯示本筆回饋點數；結帳按下 `confirmOrderBtn` 後會依畫面摘要建立符合 `orders.json` 欄位的訂單，ID 依最大 `ord-xxx` 加 1，`points` 以 `checkoutSubtotal` 的 10% 無條件進位計算，並透過 `localStorage` mock 層追加訂單與累加會員點數。
- `v1.3.11`（2026/06/22）：個人化問卷新增選取數驗證與關閉限制；step 1 至少選擇 2 項才可進下一步，step 2 至少選擇 2 項才可完成，未選時顯示「請至少選擇一個選項」提示；`personalizationModal` 不再支援外框與 ESC 關閉，關閉按鈕會提示未完成確認；完成後會同步 step 1 / step 2 選項到會員中心 `survey-tags`，並補齊會員中心缺少的問卷標籤。
- `v1.3.10`（2026/06/22）：共用登入 Modal 在 Google 登入下方新增 Facebook 登入按鈕；目前 Facebook 按鈕先沿用 Google 登入的模擬使用者資料與登入後流程，並補上重複初始化防護與按鈕樣式。
- `v1.3.9`（2026/06/22）：修正 `pages/product-detail.html` 在頁面腳本先完成全域初始化、共用 header 後注入時，購物車計數徽章不會重新同步的問題；`js/main.js` 會在 header/footer 片段載入後補跑登入狀態與購物車徽章同步，並以語法檢查與商品詳情頁 localStorage cart 驗證確認徽章可顯示。
- `v1.3.8`（2026/06/19）：會員中心「我的訂單」新增購買訂單 / 租借訂單切換按鈕；購買訂單維持讀取 `data/orders.json`，租借訂單新增讀取 `data/reantalOrders.json`，並以 `renderRentalOrders()`、`loadRentalOrders()`、`openRentalOrderDetail()` 參照既有 `renderOrders()` 卡片與明細流程渲染；新增程式已補上重點註解，並完成 JS 語法與 JSON 解析檢查。
- `v1.3.7`（2026/06/18）：`data/orders.json` 部分訂單新增可多張記錄的 `coupons` 陣列，包含 coupon code、折扣類型、折扣金額或百分比與實際折抵金額；會員中心訂單明細 `orderDetailBody` 新增「使用折扣卷：」顯示列，會從訂單 coupon 資料渲染折扣碼與折抵內容；新增程式已補上重點註解。
- `v1.3.6`（2026/06/18）：購物車 `couponInput` 與結帳 `checkoutCouponInput` 改為可手動輸入也可從 `datalist` 選取，選項統一由 `data/users.json` 的 `coupons.code` 產生；新增共用 `js/components/coupons.js` 管理 coupon 載入、驗證、折扣計算與跨頁暫存，購物車輸入正確 code 後會帶入並套用到結帳頁；新增程式已補上重點註解。
- `v1.3.5`（2026/06/18）：會員中心會員卡新增 `div.member-card-points` 回饋點數顯示，點數由 `data/orders.json` 中 `status` 為 `delivered` 的訂單 `subtotal` 加總後乘以 10% 計算；新增程式皆補上重點註解，並在訂單載入成功或失敗時同步更新會員卡點數。
- `v1.3.4`（2026/06/18）：移除首頁與商品列表頁商品卡片圖片上的 `.product-card-quick-add` 快速加入購物車浮層按鈕與相關事件綁定，並清除對應 hover 樣式；保留卡片底部 `.product-card-add-btn` 加入購物車與卡片詳情頁導向。
- `v1.3.3`（2026/06/15）：後台租借庫存與庫存異動補強 — `admin/data/reantal.json` 改為每筆商品以 `camp` 陣列保存 `2` 到 `5` 個營地與各自數量，移除頂層 `quantity`；租借列表庫存改為各營地數量總和，並移除存放營地欄；新增 / 編輯租借商品 Modal 改為「新增營地」動態欄位，`newProductStock` 於租借模式唯讀並由營地數量加總；庫存確定按鈕改為資料有異動才顯示，庫存欄位增加綠 / 紅背景提示；庫存異動紀錄新增負責員工 ID，`admin/data/movement.json` 每筆資料補 `employeeId`，列表與明細 Modal 都會顯示；`#mainWrapper` 補上剩餘視窗寬度填滿；已用 Node 檢查 `products.js`、`movement.js` 語法與 JSON / contract 資料結構。
- `v1.3.2`（2026/06/15）：移除登入及免費註冊功能，保留純第三方登入。
- `v1.3.1`（2026/06/14）：後台「權限管理」— 員工 CRUD、`localStorage.adminEmployees`、逐頁 view/edit、登入改員工 ID 驗證、`canView`/`canEdit` helper。
- `v1.3.0`（2026/06/14）：後台「預約/租借管理」— `bookings.json`、`bookings.js`、確認/取消/完成 Modal。
- `v1.2.8`（2026/06/14）：修改HTML、CSS結構，讓折扣%數換行顯示在金額下方
- `v1.2.7`（2026/06/14）：修復商品卡片高度不一致問題 — 設定 `.product-card-name` 固定高度 2.52rem（2 行）、`.product-card-rating` 固定高度 1.1rem、`.product-card-price` 最小高度 1.5rem，卡片在首頁橫向列表與商品列表頁網格中現已統一大小；驗證所有功能正常（加入購物車、Badge 更新、Toast 提示、詳情頁導航）。
- `v1.2.6`（2026/06/14）：登出功能設計規範：登出時僅清除認證狀態（`isLoggedIn`、`currentUser`），購物車數據（`cart`）保留在 `localStorage`；新增 `window.logout()` 函數規範登出行為，`resetAppState()` 標記為過時（@deprecated）。
- `v1.2.5`（2026/06/13）：庫存異動紀錄改為 `id`、`date` 與 `items` 明細清單；商品管理頁可在通過庫存確定後按「生產異動紀錄」整合明細，異動頁可點擊 ID 連結開啟明細視窗。
- `v1.2.4`（2026/06/13）：後台新增庫存異動紀錄導覽、`movement.html`、`movement.js` 與 `admin/data/movement.json`，可從 JSON 渲染異動 ID、日期、商品名稱、數量、配送店與接收店。
- `v1.2.3`（2026/06/13）：後台商品管理新增租借頁籤表格，從 `admin/data/reantal.json` 載入 20 筆租借商品；新增商品 Modal 加入租借商品切換與存放營地欄位，租借商品會送入租借頁籤。
- `v1.2.2`（2026/06/13）：後台商品管理移除列表售價與上架切換，新增 `total-stock`、分店 A/B/C 庫存欄位與共用確定按鈕；新增商品 Modal 補上商品描述欄位（不寫入資料）。
- `v1.2.1`（2026/06/13）：後台新增商品 Modal 補上主要 / 次要圖片上傳、規格 key 選項與動態規格欄位
- `v1.2.0`（2026/06/12）：新增預約子系統（`booking/`）— 6 頁面、5 JS 模組、booking.css、campgrounds.json、rentals.json、獨立 Header/Footer
- `v1.1.0`（2026/06/04）：賣家管理後台 6 模組完成（analytics / orders / products / customers / discounts / reviews）
- `v1.0.2`（2026/06/03）：新增廣告輪播、響應設計更動、star rating 更動（更動檔案：main.css, product-list.js, products.html）
