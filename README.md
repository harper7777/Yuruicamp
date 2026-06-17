# Yuruicamp 露營選物品牌網站

> 探索戶外，從這裡開始 <i class="bi bi-tent"></i>

## 📋 專案概述

Yuruicamp 是一個完整的露營選物電商網站前端實現，包含 `pages/` 下 **11 個**買家功能頁面、Mock API 層、完整 RWD 響應式設計，以及一套獨立的**賣家管理後台**（含員工 ID 登入、**九大管理模組**、逐頁 view/edit 權限、圖表儀表板）。

**開發目標**：能跑 → 看懂 → 好改 → 效能，按此優先順序逐步實現。

**技術棧**：

| 技術                                             | 用途                                |
| ------------------------------------------------ | ----------------------------------- |
| HTML5                                            | 語義化頁面結構                      |
| SCSS / CSS3                                      | 買家前台樣式系統、4489 行完整 CSS   |
| Vanilla JavaScript                               | 買家前台頁面互動邏輯（無框架依賴）  |
| Bootstrap 5 + jQuery 3 + Chart.js                | 賣家後台 UI 框架、圖表視覺化        |
| Mock API（localStorage / sessionStorage + JSON） | 模擬前後台資料，預留真實 API 接入點 |
| Git                                              | 版本控制                            |

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
│   │   ├── booking-header.html   # 預約系統專屬 Header（背景 #F2F0EB，禁止複用買家端）
│   │   └── booking-footer.html   # 預約系統專屬 Footer
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
│   ├── header.html
│   └── footer.html
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

| 用途           | 色碼      | 預覽               |
| -------------- | --------- | ------------------ |
| 主色 Primary   | `#244d4d` | 深青綠（品牌主軸） |
| 副色 Secondary | `#779999` | 淺青灰綠           |
| 成功 Success   | `#4caf50` | 綠色               |
| 危險 Danger    | `#d32f2f` | 紅色               |
| 輕背景         | `#f6fbf6` | 淺綠底             |
| 深 Hover       | `#316868` | 按鈕懸停           |

所有色彩定義於 `css/variables.scss`，並由 `main.css` 的 CSS Custom Properties 引入。

> 💡 **預約子系統色彩差異**：預約端 Header 背景使用 `#F2F0EB`（淺大地米色），有別於買家端 `#f6fbf6`（淺綠白），讓使用者一眼辨識已切換至不同服務頻道。詳見 `booking/css/booking.css`。

### 響應式斷點（RWD）

| 斷點 | 寬度        | 目標裝置                |
| ---- | ----------- | ----------------------- |
| xs   | < 576px     | iPhone SE、小型 Android |
| sm   | 576–767px   | 大型手機                |
| md   | 768–991px   | iPad 直式               |
| lg   | 992–1199px  | iPad 橫式、筆電         |
| xl   | 1200–1399px | 桌上型電腦              |
| xxl  | ≥ 1400px    | 大型螢幕                |

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
window.AppState.isLoggedIn; // Boolean - 是否已登入
window.AppState.currentUser; // Object  - 當前用戶資料
window.AppState.cart; // Array   - 購物車商品列表
window.AppState.preferences; // Object  - 個人化喜好

// 持久化（寫入 localStorage）
window.saveAppState();

// 重置（清除所有狀態與 localStorage）
window.resetAppState();
```

### Mock API（`window.API`）

```javascript
// 商品
await window.API.products.getAll(filters); // 取得商品列表（支援篩選）
await window.API.products.getById(productId); // 取得單一商品詳情

// 用戶
await window.API.users.login(email, password); // 模擬登入
await window.API.users.getProfile(userId); // 取得用戶資料

// 訂單
await window.API.orders.getAll(userId); // 取得用戶訂單列表
await window.API.orders.create(orderData); // 建立訂單（模擬）

// 文章
await window.API.articles.getAll(); // 取得文章列表
await window.API.articles.getById(articleId); // 取得文章詳情

// 分店
await window.API.branches.getAll(); // 取得分店列表
```

> 💡 日後接入真實後端只需修改 `js/api-mock.js` 的實作，頁面邏輯無需改動。

### UI 元件函數

```javascript
// Toast 提示
window.showToast(message, type);
// type: 'success' | 'error' | 'warning' | 'info'
// 範例：window.showToast('已加入購物車', 'success')

// Modal 對話框
window.openModal(modalId); // 開啟 Modal
window.closeModal(modalId); // 關閉 Modal
// 範例：window.openModal('loginModal')

// 購物車操作
window.addToCart(product, quantity); // 加入購物車
window.removeFromCart(productId); // 移除商品
window.updateCartQuantity(productId, qty); // 更新數量
window.clearCart(); // 清空購物車
```

### 工具函數

```javascript
window.formatCurrency(3500); // → 'NT$3,500'
window.formatDate("2026-06-03"); // → '2026/06/03'
window.generateId(); // → 'id-1748922345-abc123xyz'
window.isValidEmail("a@b.com"); // → true / false
window.isValidPhone("0912345678"); // → true / false
window.calculateCartTotal(); // → Number（購物車總金額）
window.calculateShippingFee(total); // → 0 或 60（依免運門檻）
window.debounce(fn, 300); // 防抖（搜尋框使用）
window.throttle(fn, 100); // 節流（滾動事件使用）
```

---

## 🗄️ localStorage 結構

| 鍵              | 型別          | 說明                                               |
| --------------- | ------------- | -------------------------------------------------- |
| `isLoggedIn`    | Boolean       | 登入狀態                                           |
| `currentUser`   | Object / null | 當前用戶資料                                       |
| `cart`          | Array         | 購物車商品（`[{id, name, price, quantity, ...}]`） |
| `preferences`   | Object        | 個人化問卷結果（風格偏好、裝備需求）               |
| `theme`         | String        | 主題（預留，目前固定 `'light'`）                   |
| `memberProfile` | Object        | 會員中心儲存的個人資料                             |

---

## <i class="bi bi-lightning"></i> 效能優化（第 14 階段）

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

| 瀏覽器           | 最低版本 | 說明                                                 |
| ---------------- | -------- | ---------------------------------------------------- |
| Chrome / Edge    | 90+      | 完整支援                                             |
| Firefox          | 88+      | 完整支援                                             |
| Safari           | 14+      | 已加入 `-webkit-` 前綴、iOS 縮放修正、Safe Area 支援 |
| Samsung Internet | 14+      | 基於 Chromium，完整支援                              |

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
  const data = await fetch("../data/products.json").then((r) => r.json());
  return data.filter(/* ... */);
};
```

**日後（真實 API）**：

```javascript
// 只需修改 api-mock.js，pages/*.js 的呼叫方式完全不變
window.API.products.getAll = async (filters) => {
  const res = await fetch(`${window.AppConfig.API_BASE_URL}/products`, {
    method: "GET",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return await res.json();
};
```

API Base URL 設定在 `js/config.js`：

```javascript
window.AppConfig.API_BASE_URL = "http://localhost:3000/api"; // 修改此處即可
```

---

## 📦 關鍵數字

| 項目            | 買家前台                             | 賣家後台                                   | 合計  |
| --------------- | ------------------------------------ | ------------------------------------------ | ----- |
| HTML 頁面       | 11 個                                | 2 個（login + dashboard）+ 6 個 partials   | 19 個 |
| JavaScript 模組 | 17 個（6 元件 + 10 頁面 + 1 主程式） | 7 個（1 core + 6 功能）                    | 24 個 |
| CSS 檔案        | 1 個（main.css，4,489 行）           | 1 個（admin.css，303 行）                  | 2 個  |
| Mock 資料 JSON  | 5 個（data/）                        | 5 個（admin/data/）                        | 10 個 |
| RWD 斷點        | 6 個（xs / sm / md / lg / xl / xxl） | Bootstrap 5 斷點（同套）                   | —     |
| 儲存機制        | localStorage（7 個鍵）               | sessionStorage（adminLoggedIn、adminName） | —     |

---

## 🗺️ 未來擴展方向

| 方向                 | 說明                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| 接入真實後端（前台） | 修改 `js/api-mock.js` 的各函數實作，頁面邏輯零改動                       |
| 接入真實後端（後台） | 修改 `admin/js/*.js` 中各 `fetch('../data/xxx.json')` 改為真實 API 呼叫  |
| 後台 RBAC 權限       | 在 `admin/js/core.js` 的 Auth 守衛層加入角色驗證（管理員 / 客服 / 倉管） |
| 升級至 SPA           | 以 Vue 3 或 React 重構，可直接複用現有 CSS 設計系統與 JSON 資料          |
| 加入數據分析         | 在 `main.js` 的 `initGlobalListeners()` 接入 GA4 / GTM 事件追蹤          |
| 自動化測試           | 以 Playwright 或 Cypress 撰寫自動化測試腳本                              |
| 深色模式             | `main.css` 已預留 `@media (prefers-color-scheme: dark)` 區塊             |
| PWA                  | 加入 `manifest.json` 與 Service Worker 支援離線瀏覽                      |

---

## 📞 品牌聯絡資訊

- **電話**：0800-123-456
- **信箱**：support@yuruicamp.com
- **地址**：台北市信義區信義路五段 100 號
- **LINE 客服**：右下角浮動按鈕（所有頁面均可使用）

---

**最後更新**：2026/06/04（賣家管理後台 6 模組完成）
**版本**：1.1.0  
**開發計劃**：[plans/pageForBuyer.md](plans/pageForBuyer.md)（買家前台）｜[plans/pageForSeller.md](plans/pageForSeller.md)（賣家後台）

**更新紀錄**：2026/06/03（新增廣告輪播、響應設計更動、star rating 更動）
**版本**：1.0.2
** (Add AD function and contains) 新增 \_initAdCarousel 廣告輪播功能 (更動檔案 main.css, product-list.js, products.html)
** (fix response design) 小於531px、991px 響應設計更動導覽列 (更動檔案 main.css)
\*\* (Fix star rating bug) 更改星星表現方式 (更動檔案 main.css, product-list.js)
