# Yuruicamp 露營選物品牌網站 - 賣家後台管理系統前端設計規格書

## 執行摘要 (TL;DR)

**目標**：建立可擴展的賣家後台前端框架，使用 HTML/CSS/JavaScript + Bootstrap 5 + jQuery，後台頁面完整實現，Mock 數據使用靜態 JSON，預留 API 接入點，展示高效率的數據可視化與行內互動體驗。

**技術棧**：

- HTML5 + CSS3 + jQuery 3.x + Bootstrap 5
- Chart.js（圖表視覺化）
- FontAwesome 6（Icon 圖示）
- 靜態 Mock 數據（JSON 檔案）
- 無後端依賴（演示階段）

**設計決策**：

- **頁面架構**：混合式 — `admin/dashboard.html` 作為主框架，用 jQuery `$.load()` 動態載入六個 HTML 片段 (partials)
- **配色**：深灰炭黑 Sidebar `#1e2329` + 品牌深青綠 Accent `#244d4d`，右側內容區使用 Bootstrap `bg-light`
- **登入流程**：`admin/login.html` 靜態 Mock 驗證（任意輸入帳密 → 寫入 `sessionStorage` → 跳轉 dashboard）
- **目錄**：完全獨立的 `admin/` 資料夾，與買家端前台分離

**預期產物**：

- 1 個登入頁 + 1 個後台主框架頁
- 6 個功能模組 HTML 片段（partials）
- 1 份後台專屬 CSS
- 7 個功能 JS 檔案
- 4 份 Mock JSON 數據

---

## 第 0 階段：後台配色系統與 CSS 變數

### 後台專屬色彩規範

後台管理系統採用與買家前台「刻意區隔」的色系，凸顯工具性與專業感：

| 用途                | 顏色代碼              | 說明                       |
| ------------------- | --------------------- | -------------------------- |
| Sidebar 背景        | `#1e2329`             | 深灰炭黑，主流後台配色     |
| Sidebar 文字        | `#c9d1d9`             | 淺灰文字，高對比易讀       |
| Sidebar Active 邊框 | `#244d4d`             | 品牌深青綠，左側亮色指示線 |
| Sidebar Active 背景 | `rgba(36,77,77,0.25)` | 選中項目的半透明底色       |
| Topbar 背景         | `#fff`                | 白色，與 Sidebar 形成層次  |
| 主內容區背景        | `#f0f2f5`             | 淺灰，卡片凸出視覺層次     |
| 品牌 Accent         | `#244d4d`             | 按鈕、連結、重點強調       |
| 成功狀態            | `#198754`             | Bootstrap success          |
| 警告狀態            | `#ffc107`             | Bootstrap warning          |
| 危險狀態            | `#dc3545`             | Bootstrap danger           |

### CSS 變數定義 (`admin/css/admin.css` 開頭)

```css
:root {
  /* === Admin Sidebar === */
  --admin-sidebar-bg: #1e2329; /* 側欄背景：深灰炭黑 */
  --admin-sidebar-text: #c9d1d9; /* 側欄文字：淺灰 */
  --admin-sidebar-width: 250px; /* 側欄寬度 */
  --admin-sidebar-active-border: #244d4d; /* 選中項目左側邊框：品牌綠 */
  --admin-sidebar-active-bg: rgba(36, 77, 77, 0.25); /* 選中背景：半透明 */

  /* === Admin Topbar === */
  --admin-topbar-height: 60px; /* 頂部列高度 */
  --admin-topbar-bg: #ffffff; /* 頂部列背景：白色 */
  --admin-topbar-shadow: 0 1px 4px rgba(0, 0, 0, 0.1); /* 頂部陰影 */

  /* === Main Content === */
  --admin-content-bg: #f0f2f5; /* 主內容區背景：淺灰 */
  --admin-card-bg: #ffffff; /* 卡片背景：白色 */
  --admin-brand-accent: #244d4d; /* 品牌強調色：深青綠 */
}
```

---

## 第 1 階段：基礎架構搭建 (Foundation)

### 步驟 1.1：建立後台目錄結構

```
Yuruicamp/
└── admin/
    ├── login.html                    # 賣家登入頁（入口）
    ├── dashboard.html                # 後台主框架（Sidebar + Topbar + 內容容器）
    ├── css/
    │   └── admin.css                 # 後台專屬樣式（Sidebar、Topbar、表格、圖表）
    ├── js/
    │   ├── core.js                   # 核心：Sidebar 導覽、AJAX loader、Toast 工廠、Auth 守衛
    │   ├── analytics.js              # 分析報表：Chart.js 初始化與數據填入
    │   ├── orders.js                 # 訂單管理：表格篩選、Modal、一鍵出貨
    │   ├── products.js               # 商品管理：行內編輯、庫存預警、狀態切換
    │   ├── customers.js              # 客戶管理：手風琴、行內編輯、紀錄展開
    │   ├── discounts.js              # 折扣管理：隨機碼生成、動態列表
    │   └── reviews.js                # 評論管理：回覆互動、已讀標記
    ├── partials/                     # AJAX 動態載入的 HTML 片段
    │   ├── analytics.html
    │   ├── orders.html
    │   ├── products.html
    │   ├── customers.html
    │   ├── discounts.html
    │   └── reviews.html
    └── data/                         # Mock JSON 數據
        ├── orders.json               # 模擬訂單列表（6 筆，涵蓋 3 種 orderStatus）
        ├── products.json             # 模擬商品庫存（10+ 筆）
        ├── customers.json            # 模擬會員資料（8+ 筆）
        ├── coupons.json              # 模擬折扣券（10+ 筆）
        └── reviews.json              # 模擬商品評論（8 筆，含已回覆與未回覆）
```

**關鍵設計決策**：

- `partials/` 下的 HTML 只包含 `<div>` 區塊內容，不含 `<html>`/`<head>`/`<body>` 標籤
- 每個 partial 對應一個同名 JS 檔，被 AJAX 載入後由 `core.js` 呼叫初始化函式
- `data/` 下的 JSON 供各 JS 用 `$.getJSON()` 讀取，模擬後端 API 回傳格式

### 步驟 1.2：Mock JSON 資料格式定義

**`admin/data/orders.json`**（涵蓋三種 `orderStatus`，供篩選功能演示）：

> **欄位說明**：
>
> - `id`：訂單編號，按 `createdAt` 升序排列，格式 `#0001` 起始
> - `orderStatus`：訂單出貨狀態（供篩選 Select 使用，已移除 `shippingStatus`）
>   - `"unshipped"` 未出貨（顧客下單後的初始狀態）
>   - `"shipped"` 已出貨（賣家點「出貨」後）
>   - `"returned"` 已退貨
> - `paymentStatus`：付款狀態（3 種）
>   - `"paid"` 已付款（線上付款完成）
>   - `"unpaid"` 未付款（線上付款待付）
>   - `"cod"` 貨到付款（取貨付款，永遠顯示此標籤不改變）
> - `history`：訂單紀錄時間軸，陣列格式 `[{ "time": "...", "action": "..." }]`

```json
[
  {
    "id": "#0001",
    "createdAt": "2026-05-27 15:44:18",
    "buyerName": "李建明",
    "total": 4560,
    "paymentStatus": "paid",
    "orderStatus": "shipped",
    "items": [
      { "name": "折疊桌椅組", "qty": 1, "price": 2800 },
      { "name": "保溫壺 1L", "qty": 2, "price": 880 }
    ],
    "address": "桃園市中壢區中山路300號",
    "history": [
      { "time": "2026-05-27 15:44:18", "action": "訂單產生" },
      { "time": "2026-05-27 15:44:18", "action": "待付款" },
      { "time": "2026-05-27 15:46:05", "action": "已付款" },
      { "time": "2026-05-27 15:46:05", "action": "待出貨" },
      { "time": "2026-05-29 10:00:00", "action": "已出貨" }
    ]
  },
  {
    "id": "#0006",
    "createdAt": "2026-06-04 14:32:10",
    "buyerName": "王小明",
    "total": 3850,
    "paymentStatus": "cod",
    "orderStatus": "unshipped",
    "items": [
      { "name": "Coleman 六人帳篷", "qty": 1, "price": 3200 },
      { "name": "充氣睡墊", "qty": 2, "price": 325 }
    ],
    "address": "台北市信義區松仁路100號",
    "history": [
      { "time": "2026-06-04 14:32:10", "action": "訂單產生" },
      { "time": "2026-06-04 14:32:10", "action": "貨到付款" },
      { "time": "2026-06-04 14:32:10", "action": "待出貨" }
    ]
  }
]
```

**`admin/data/products.json`**：

```json
[
  {
    "id": "P001",
    "thumbnail": "../assets/images/tent-01.jpg",
    "name": "Coleman 六人帳篷",
    "category": "帳篷",
    "spec": "深橄欖綠",
    "price": 3200,
    "stock": 3,
    "status": "active"
  }
]
```

**`admin/data/customers.json`**：

```json
[
  {
    "id": "U001",
    "avatar": "../assets/images/avatar-01.jpg",
    "name": "王小明",
    "phone": "0912-345-678",
    "email": "wang@example.com",
    "totalSpent": 12500,
    "tier": "VIP",
    "points": 1250,
    "coupons": 3,
    "tags": ["VIP", "高消費"],
    "orders": ["#0006", "ORD-20260520"]
  }
]
```

**`admin/data/coupons.json`**：

```json
[
  {
    "code": "YURUIKAMP20",
    "discount": 200,
    "quantity": 50,
    "used": 12,
    "expiry": "2026-08-31",
    "status": "active"
  },
  {
    "code": "CAMPFUN50",
    "discount": 50,
    "quantity": 100,
    "used": 87,
    "expiry": "2026-07-15",
    "status": "active"
  },
  {
    "code": "OLDCAMP10",
    "discount": 100,
    "quantity": 30,
    "used": 30,
    "expiry": "2026-05-01",
    "status": "disabled"
  }
]
```

**`admin/data/reviews.json`**（新增）：

> **欄位說明**：
>
> - `rating`：1–5 星評分
> - `photos`：買家實拍圖 URL 陣列（可為空陣列 `[]`）
> - `replied`：`true` 已回覆 / `false` 未回覆
> - `replyText`：店家回覆文字（`replied: false` 時為空字串）

```json
[
  {
    "id": "R001",
    "buyerName": "王小明",
    "buyerAvatar": "../assets/images/avatar-01.jpg",
    "rating": 4,
    "comment": "帳篷品質非常好，搭設方便，空間也很寬敞，非常滿意這次的購買！",
    "photos": [
      "../assets/images/review-photo-01.jpg",
      "../assets/images/review-photo-02.jpg"
    ],
    "productName": "Coleman 六人帳篷",
    "createdAt": "2026-06-01 14:32",
    "replied": false,
    "replyText": ""
  },
  {
    "id": "R002",
    "buyerName": "林美惠",
    "buyerAvatar": "../assets/images/avatar-02.jpg",
    "rating": 5,
    "comment": "睡墊很舒適，充氣快速，隔熱效果好，強烈推薦！",
    "photos": [],
    "productName": "充氣式睡墊 L號",
    "createdAt": "2026-06-02 10:15",
    "replied": true,
    "replyText": "感謝您的五星好評！祝露營愉快，歡迎再次選購。"
  },
  {
    "id": "R003",
    "buyerName": "張志偉",
    "buyerAvatar": "../assets/images/avatar-03.jpg",
    "rating": 3,
    "comment": "品質尚可，但包裝有些破損，希望改善物流包裝方式。",
    "photos": ["../assets/images/review-photo-03.jpg"],
    "productName": "MSR 超輕量帳篷",
    "createdAt": "2026-06-03 08:44",
    "replied": false,
    "replyText": ""
  }
]
```

---

## 第 2 階段：全局後台佈局 (Admin Layout)

### 步驟 2.1：賣家登入頁 (`admin/login.html`)

_相依性：步驟 1.1、admin.css_

**視覺設計**：

- 全版面：深色背景（`--admin-sidebar-bg` 的漸層）搭配置中白色卡片 (`card, shadow-lg`)
- 卡片頂部放置品牌 Logo + 「後台管理系統」副標題
- 表單欄位：帳號 Input (`<input type="text">`) + 密碼 Input (`<input type="password">`)
- 登入按鈕：`btn-block`，使用品牌深青綠填色

```html
<!-- admin/login.html 核心結構 -->
<div
  class="min-vh-100 d-flex align-items-center justify-content-center"
  style="background: linear-gradient(135deg, #1e2329 0%, #2d3748 100%);"
>
  <div class="card shadow-lg" style="width: 400px;">
    <div class="card-body p-5">
      <div class="text-center mb-4">
        <h4 class="fw-bold" style="color: var(--admin-brand-accent);">
          Yuruicamp 後台
        </h4>
        <p class="text-muted small">賣家管理系統</p>
      </div>
      <form id="loginForm">
        <div class="mb-3">
          <label class="form-label">帳號</label>
          <input
            type="text"
            class="form-control"
            id="username"
            placeholder="admin"
          />
        </div>
        <div class="mb-3">
          <label class="form-label">密碼</label>
          <input
            type="password"
            class="form-control"
            id="password"
            placeholder="••••••"
          />
        </div>
        <button
          type="submit"
          class="btn w-100 text-white"
          style="background-color: var(--admin-brand-accent);"
        >
          登入
        </button>
      </form>
    </div>
  </div>
</div>
```

**交互邏輯 (`admin/js/core.js` 中的登入段落)**：

```javascript
// === 登入頁 Mock 驗證邏輯 ===
// 實際串接後端時，只需把 sessionStorage 寫入改為 fetch('/api/login') 即可
$("#loginForm").on("submit", function (e) {
  e.preventDefault(); // 阻止表單預設送出（不重整頁面）

  const username = $("#username").val().trim();
  const password = $("#password").val().trim();

  if (username && password) {
    // Mock：任意非空帳密皆視為成功
    sessionStorage.setItem("adminLoggedIn", "true");
    sessionStorage.setItem("adminName", username);
    // 跳轉至後台主頁面
    window.location.href = "dashboard.html";
  } else {
    // 欄位為空時：欄位變紅提示
    $("#username, #password").addClass("is-invalid");
  }
});
```

---

### 步驟 2.2：後台主框架結構 (`admin/dashboard.html`)

_相依性：步驟 2.1_

**整體骨架 (HTML 結構)**：

```html
<body class="d-flex" style="background: var(--admin-content-bg);">
  <!-- ① 左側 Sidebar（固定，不隨捲動） -->
  <aside id="adminSidebar">...</aside>

  <!-- ② 手機版 Offcanvas Sidebar（Bootstrap offcanvas-start） -->
  <div class="offcanvas offcanvas-start" id="mobileSidebar">...</div>

  <!-- ③ 右側主區域（Topbar + 動態內容區） -->
  <div id="mainWrapper" class="flex-grow-1 d-flex flex-column">
    <header id="adminTopbar">...</header>
    <main id="contentArea" class="p-4 flex-grow-1">
      <!-- 各 partial HTML 由 AJAX 動態注入此處 -->
      <div id="sectionLoader" class="text-center py-5">
        <div class="spinner-border text-secondary"></div>
      </div>
    </main>
  </div>
</body>
```

---

### 步驟 2.3：左側 Sidebar 詳細設計

_相依性：步驟 2.2_

**視覺設計**：

- 寬度：`250px`，`position: fixed`，`height: 100vh`
- 背景：`--admin-sidebar-bg`（`#1e2329`）
- 頂部：Yuruicamp Logo（白色文字版本）+ 「賣家後台」小字
- 導覽選單：6 個項目，每項包含 FontAwesome Icon + 文字標籤
- **Active 狀態**：左側加上 `4px` 品牌色實線邊框，背景半透明

```css
/* admin/css/admin.css - Sidebar 樣式 */
#adminSidebar {
  width: var(--admin-sidebar-width);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: var(--admin-sidebar-bg);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

/* 導覽項目基礎樣式 */
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: var(--admin-sidebar-text);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 4px solid transparent; /* 預設：透明邊框佔位，避免版面跳動 */
}

/* 滑鼠懸停效果 */
.sidebar-link:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

/* 選中狀態（active class 由 JS 動態加上） */
.sidebar-link.active {
  border-left-color: var(--admin-sidebar-active-border); /* 左側亮色邊框 */
  background-color: var(--admin-sidebar-active-bg);
  color: #ffffff;
  font-weight: 600;
}
```

**HTML 完整 Sidebar 結構**（品牌區塊 + 導覽選單）：

```html
<!-- admin/dashboard.html 中的完整 Sidebar -->
<aside id="adminSidebar" class="d-flex flex-column">
  <!-- ① 品牌 Logo 區塊 -->
  <div class="p-4 border-bottom border-secondary border-opacity-25">
    <h5 class="text-white fw-bold mb-0">Yuruicamp</h5>
    <small style="color: var(--admin-sidebar-text);">賣家後台管理系統</small>
  </div>

  <!-- ② 導覽選單 -->
  <nav class="flex-grow-1 mt-3">
    <a href="#" class="sidebar-link active" data-section="analytics">
      <i class="fas fa-chart-line"></i>
      <span>分析報表</span>
    </a>
    <a href="#" class="sidebar-link" data-section="orders">
      <i class="fas fa-shopping-bag"></i>
      <span>訂單管理</span>
    </a>
    <a href="#" class="sidebar-link" data-section="products">
      <i class="fas fa-box-open"></i>
      <span>商品與庫存</span>
    </a>
    <a href="#" class="sidebar-link" data-section="customers">
      <i class="fas fa-users"></i>
      <span>客戶管理</span>
    </a>
    <a href="#" class="sidebar-link" data-section="discounts">
      <i class="fas fa-tag"></i>
      <span>折扣管理</span>
    </a>
    <a href="#" class="sidebar-link" data-section="reviews">
      <i class="fas fa-star"></i>
      <span>評論管理</span>
    </a>
  </nav>

  <!-- ③ 底部登出連結 -->
  <div class="p-3 border-top border-secondary border-opacity-25">
    <a
      href="#"
      id="logoutBtn"
      class="d-flex align-items-center gap-2 text-decoration-none"
      style="color: var(--admin-sidebar-text);"
    >
      <i class="fas fa-sign-out-alt"></i>
      <span class="small">登出系統</span>
    </a>
  </div>
</aside>
```

---

### 步驟 2.4：頂部 Topbar 詳細設計

_相依性：步驟 2.2_

**視覺設計**：

- 高度：`60px`，`position: sticky; top: 0`，白色背景 + 底部陰影
- 左側：漢堡選單按鈕（手機版才顯示，`d-md-none`），當前頁面標題（`<span id="pageTitle">`，由 JS 動態更新）
- 右側：通知鈴鐺 Icon（`<span class="badge bg-danger">` 標示未讀數）、管理員頭像（`rounded-circle`）+ 下拉登出選單

```html
<!-- admin/dashboard.html 中的 Topbar -->
<header
  id="adminTopbar"
  class="d-flex align-items-center justify-content-between px-4"
  style="height: var(--admin-topbar-height);
               background: var(--admin-topbar-bg);
               box-shadow: var(--admin-topbar-shadow);
               position: sticky; top: 0; z-index: 999;"
>
  <!-- 左側：漢堡 + 頁面標題 -->
  <div class="d-flex align-items-center gap-3">
    <!-- 漢堡按鈕：只在手機版顯示 -->
    <button
      class="btn d-md-none"
      data-bs-toggle="offcanvas"
      data-bs-target="#mobileSidebar"
    >
      <i class="fas fa-bars"></i>
    </button>
    <h5 class="mb-0 fw-semibold" id="pageTitle">分析報表</h5>
  </div>

  <!-- 右側：通知 + 頭像 -->
  <div class="d-flex align-items-center gap-3">
    <!-- 通知鈴鐺 -->
    <button class="btn position-relative">
      <i class="fas fa-bell fs-5"></i>
      <span
        class="position-absolute top-0 start-100 translate-middle
                   badge rounded-pill bg-danger"
        id="notifBadge"
      >
        3
      </span>
    </button>

    <!-- 頭像 + 下拉選單 -->
    <div class="dropdown">
      <img
        src="../assets/images/admin-avatar.jpg"
        class="rounded-circle"
        width="36"
        height="36"
        role="button"
        data-bs-toggle="dropdown"
      />
      <ul class="dropdown-menu dropdown-menu-end">
        <li>
          <a class="dropdown-item" href="#">
            <i class="fas fa-user me-2"></i>管理員設定
          </a>
        </li>
        <li><hr class="dropdown-divider" /></li>
        <li>
          <a class="dropdown-item text-danger" href="#" id="logoutBtn">
            <i class="fas fa-sign-out-alt me-2"></i>登出
          </a>
        </li>
      </ul>
    </div>
  </div>
</header>
```

**RWD 響應式處理**：

- 桌面版（`md` 以上）：Sidebar 常駐固定在左側，主內容區用 `margin-left: 250px` 避免被遮擋
- 手機版（`md` 以下）：Sidebar 隱藏，改由 Topbar 漢堡按鈕觸發 Bootstrap `offcanvas-start` 從左滑出

```css
/* admin/css/admin.css - RWD 處理 */
#mainWrapper {
  margin-left: var(--admin-sidebar-width); /* 桌面版：推開 Sidebar 空間 */
}

@media (max-width: 767.98px) {
  #adminSidebar {
    display: none; /* 手機版：隱藏固定 Sidebar */
  }
  #mainWrapper {
    margin-left: 0; /* 手機版：取消推開距離 */
  }
}
```

---

### 步驟 2.5：AJAX Partial 載入系統

_相依性：步驟 2.2、2.3_

這是後台最核心的架構設計。使用 jQuery `$.load()` 把各功能模組的 HTML 片段注入主內容區，同時呼叫對應的 JS 初始化函式，模擬後端 API 路由切換。

```javascript
// admin/js/core.js - AJAX Section 載入系統

/**
 * loadSection(sectionName)
 * 功能：載入指定功能模組的 HTML partial 到 #contentArea
 *
 * @param {string} sectionName - 模組名稱 (analytics|orders|products|customers|discounts|reviews)
 *
 * --- API 預留說明 ---
 * 目前從本地 partials/ 資料夾載入靜態 HTML。
 * 若要串接後端，只需將 url 改為：
 *   const url = `/api/admin/partials/${sectionName}`;
 * 後端回傳動態 HTML 即可，其餘邏輯完全不變。
 */
function loadSection(sectionName) {
  const url = `partials/${sectionName}.html`;

  // 顯示 Loading 動畫
  $("#contentArea").html(`
    <div class="text-center py-5">
      <div class="spinner-border" style="color: var(--admin-brand-accent);"></div>
      <p class="mt-2 text-muted">載入中...</p>
    </div>
  `);

  // 用 jQuery $.load() 載入 HTML，完成後呼叫對應初始化函式
  $("#contentArea").load(url, function (response, status) {
    if (status === "error") {
      $("#contentArea").html(
        '<div class="alert alert-danger">載入失敗，請重新整理頁面。</div>',
      );
      return;
    }
    // 呼叫各模組的初始化函式（由對應 JS 檔定義）
    const initFns = {
      analytics: window.initAnalytics,
      orders: window.initOrders,
      products: window.initProducts,
      customers: window.initCustomers,
      discounts: window.initDiscounts,
      reviews: window.initReviews,
    };
    if (typeof initFns[sectionName] === "function") {
      initFns[sectionName]();
    }
  });
}

// === Sidebar 導覽點擊事件 ===
$(document).on("click", ".sidebar-link", function (e) {
  e.preventDefault();

  const section = $(this).data("section"); // 取得 data-section 屬性值
  const titles = {
    analytics: "分析報表",
    orders: "訂單管理",
    products: "商品與庫存",
    customers: "客戶管理",
    discounts: "折扣管理",
    reviews: "評論管理",
  };

  // 更新 Active 狀態
  $(".sidebar-link").removeClass("active");
  $(this).addClass("active");

  // 更新 Topbar 頁面標題
  $("#pageTitle").text(titles[section] || "後台管理");

  // 載入對應 Partial
  loadSection(section);

  // 手機版：關閉 Offcanvas Sidebar
  const offcanvas = bootstrap.Offcanvas.getInstance("#mobileSidebar");
  if (offcanvas) offcanvas.hide();
});

// === Auth 守衛：進入 dashboard.html 時驗證登入狀態 ===
$(document).ready(function () {
  if (!sessionStorage.getItem("adminLoggedIn")) {
    window.location.href = "login.html"; // 未登入則踢回登入頁
  }
  loadSection("analytics"); // 預設載入分析報表
});

// === 登出邏輯 ===
$(document).on("click", "#logoutBtn", function (e) {
  e.preventDefault();
  sessionStorage.removeItem("adminLoggedIn");
  window.location.href = "login.html";
});
```

---

### 步驟 2.6：後台 Toast 工廠函式

_相依性：步驟 2.2_

後台共用的 Toast 提示元件，供所有模組呼叫。

```javascript
// admin/js/core.js - Toast 工廠

/**
 * showAdminToast(message, type)
 * 功能：在後台右下角顯示短暫提示訊息
 *
 * @param {string} message - 提示文字
 * @param {string} type    - 類型：'success' | 'error' | 'info'（預設 'success'）
 */
function showAdminToast(message, type = "success") {
  const colorMap = {
    success: "bg-success",
    error: "bg-danger",
    info: "bg-primary",
  };
  const iconMap = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    info: "fa-info-circle",
  };

  const toastHtml = `
    <div class="toast align-items-center text-white border-0 ${colorMap[type]}"
         role="alert" aria-live="assertive">
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas ${iconMap[type]} me-2"></i>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast"></button>
      </div>
    </div>`;

  // 確保有 Toast 容器存在（固定在右下角）
  if ($("#toastContainer").length === 0) {
    $("body").append(
      '<div id="toastContainer" class="toast-container position-fixed bottom-0 end-0 p-3"></div>',
    );
  }

  const $toast = $(toastHtml).appendTo("#toastContainer");
  const bsToast = new bootstrap.Toast($toast[0], { delay: 3000 });
  bsToast.show();

  // Toast 消失後移除 DOM，避免堆積
  $toast[0].addEventListener("hidden.bs.toast", () => $toast.remove());
}

// 暴露為全域函式，供所有模組呼叫
window.showAdminToast = showAdminToast;
```

---

## 第 3 階段：分析報表 (`partials/analytics.html`)

### 步驟 3.1：KPI 統計卡片（三欄頂部）

_相依性：步驟 2.5、admin.css_

**視覺設計**：

- 使用 `row > col-md-4` 排列 3 張卡片，`card shadow-sm rounded-3`
- 每張卡片：左側品牌色 Icon（`fs-2`）、右側數字 + 標題
- 核心數字：`fs-2 fw-bold`
- 趨勢箭頭：上升用 `text-success ↑`，下降用 `text-danger ↓`

三張卡片的數字欄位各加上 `id`，供 `analytics.js` 中的動態計算結果填入：

```html
<!-- partials/analytics.html - KPI 卡片區 -->
<div class="row g-4 mb-4">
  <!-- 卡片 1：今日營業額（由 JS 從 orders.json 動態計算填入） -->
  <div class="col-md-4">
    <div class="card shadow-sm border-0 rounded-3">
      <div class="card-body d-flex align-items-center gap-3">
        <div
          class="rounded-circle d-flex align-items-center justify-content-center"
          style="width:56px; height:56px; background: rgba(36,77,77,0.1);"
        >
          <i
            class="fas fa-dollar-sign fs-4"
            style="color: var(--admin-brand-accent);"
          ></i>
        </div>
        <div>
          <p class="text-muted small mb-1">今日營業額</p>
          <!-- id="kpiRevenue" 供 JS 填入計算結果 -->
          <h3 class="fw-bold mb-0" id="kpiRevenue">
            <span
              class="spinner-border spinner-border-sm text-secondary"
            ></span>
          </h3>
          <small class="text-muted" id="kpiRevenueNote">計算中...</small>
        </div>
      </div>
    </div>
  </div>

  <!-- 卡片 2：待出貨訂單數（由 JS 動態計算） -->
  <div class="col-md-4">
    <div class="card shadow-sm border-0 rounded-3">
      <div class="card-body d-flex align-items-center gap-3">
        <div
          class="rounded-circle d-flex align-items-center justify-content-center"
          style="width:56px; height:56px; background: rgba(255,193,7,0.15);"
        >
          <i class="fas fa-truck fs-4 text-warning"></i>
        </div>
        <div>
          <p class="text-muted small mb-1">待出貨訂單</p>
          <!-- id="kpiPending" 供 JS 填入計算結果 -->
          <h3 class="fw-bold mb-0">
            <span id="kpiPending">—</span>
            <span class="fs-6 text-muted">筆</span>
          </h3>
          <small class="text-muted">需盡快處理出貨</small>
        </div>
      </div>
    </div>
  </div>

  <!-- 卡片 3：低庫存商品數（由 JS 動態計算） -->
  <div class="col-md-4">
    <div class="card shadow-sm border-0 rounded-3">
      <div class="card-body d-flex align-items-center gap-3">
        <div
          class="rounded-circle d-flex align-items-center justify-content-center"
          style="width:56px; height:56px; background: rgba(220,53,69,0.1);"
        >
          <i class="fas fa-exclamation-triangle fs-4 text-danger"></i>
        </div>
        <div>
          <p class="text-muted small mb-1">低庫存商品</p>
          <!-- id="kpiLowStock" 供 JS 填入計算結果 -->
          <h3 class="fw-bold mb-0">
            <span id="kpiLowStock">—</span>
            <span class="fs-6 text-muted">件</span>
          </h3>
          <small class="text-muted">庫存量 &lt; 5 件</small>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### 步驟 3.2：近七日銷售額折線圖

_相依性：步驟 3.1、Chart.js CDN_

**視覺設計**：

- `<canvas id="salesLineChart">` 包在 `card shadow-sm` 內
- 左側佔 `col-lg-8`（折線圖），右側 `col-lg-4`（圓餅圖）並排

**交互邏輯 (`admin/js/analytics.js`)**：

```javascript
// admin/js/analytics.js

/**
 * initAnalytics()
 * 功能：初始化分析報表頁面的所有圖表
 * 由 core.js 在載入 partials/analytics.html 後呼叫
 */
window.initAnalytics = function () {
  // ===================================================================
  // === 1. KPI 動態計算：從 orders.json + products.json 讀取數據 ===
  // ===================================================================
  // API 預留：實際串接後，把兩個 $.getJSON 路徑改為後端端點即可
  // GET /api/admin/analytics/kpi → 回傳 { revenue, pendingShip, lowStock }

  $.getJSON("../data/orders.json", function (orders) {
    // 今日日期字串，格式 "2026-06-03"（與 createdAt 開頭比對）
    const today = new Date().toISOString().slice(0, 10);

    // 今日已出貨訂單的總營業額（orderStatus 已改為 shipped，無 completed 狀態）
    const todayRevenue = orders
      .filter(
        (o) => o.orderStatus === "shipped" && o.createdAt.startsWith(today),
      )
      .reduce((sum, o) => sum + o.total, 0);

    // 所有未出貨的訂單數量（shippingStatus 已移除，改用 orderStatus === 'unshipped'）
    const pendingShip = orders.filter(
      (o) => o.orderStatus === "unshipped",
    ).length;

    // 填入 DOM
    $("#kpiRevenue").text(
      todayRevenue > 0 ? `NT$ ${todayRevenue.toLocaleString()}` : "NT$ 0",
    );
    $("#kpiRevenueNote").text(
      todayRevenue > 0 ? "今日已完成訂單加總" : "今日尚無完成訂單",
    );
    $("#kpiPending").text(pendingShip);
  });

  $.getJSON("../data/products.json", function (products) {
    // 庫存量低於 5 件的商品數量
    const lowStock = products.filter((p) => p.stock < 5).length;
    $("#kpiLowStock").text(lowStock);
  });

  // ===================================================================
  // === 2. 折線圖：近七日銷售額趨勢 ===
  // ===================================================================
  const lineCtx = document.getElementById("salesLineChart").getContext("2d");

  // Mock 數據：實際串接後改為 $.getJSON('/api/admin/sales?range=7days', ...)
  const salesData = {
    labels: ["5/28", "5/29", "5/30", "5/31", "6/1", "6/2", "6/3"],
    datasets: [
      {
        label: "銷售額 (NT$)",
        data: [18200, 21500, 16800, 29400, 22100, 31600, 24500],
        borderColor: "#244d4d", // 品牌深青綠線條
        backgroundColor: "rgba(36,77,77,0.08)", // 半透明填色
        borderWidth: 2.5,
        pointBackgroundColor: "#244d4d",
        pointRadius: 5,
        tension: 0.4, // 線條平滑度
        fill: true,
      },
    ],
  };

  new Chart(lineCtx, {
    type: "line",
    data: salesData,
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            // 提示框顯示格式：NT$ 24,500
            label: (ctx) => ` NT$ ${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (val) => `NT$ ${(val / 1000).toFixed(0)}K`, // Y 軸顯示：NT$ 24K
          },
        },
      },
    },
  });

  // ===================================================================
  // === 3. 甜甜圈圖：各商品營收佔比（Mock 數據，串接後改為 API）===
  // ===================================================================
  const donutCtx = document
    .getElementById("revenueDonutChart")
    .getContext("2d");

  new Chart(donutCtx, {
    type: "doughnut",
    data: {
      labels: ["帳篷", "睡袋", "炊具", "燈具", "其他"],
      datasets: [
        {
          data: [38, 25, 18, 12, 7],
          backgroundColor: [
            "#244d4d",
            "#3d7d7d",
            "#779988",
            "#aabbaa",
            "#d0e4d0",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      cutout: "65%", // 甜甜圈中間洞的大小
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, padding: 16 },
        },
      },
    },
  });
};
```

---

### 步驟 3.3：圖表 HTML 容器結構

_相依性：步驟 3.2_

```html
<!-- partials/analytics.html - 圖表區（接在 KPI 卡片之後） -->
<div class="row g-4">
  <!-- 折線圖 -->
  <div class="col-lg-8">
    <div class="card shadow-sm border-0 rounded-3">
      <div class="card-header bg-white border-0 pt-3 pb-0">
        <h6 class="fw-semibold mb-0">
          <i
            class="fas fa-chart-line me-2"
            style="color: var(--admin-brand-accent);"
          ></i>
          近七日銷售額趨勢
        </h6>
      </div>
      <div class="card-body">
        <canvas id="salesLineChart" height="100"></canvas>
      </div>
    </div>
  </div>

  <!-- 甜甜圈圖 -->
  <div class="col-lg-4">
    <div class="card shadow-sm border-0 rounded-3">
      <div class="card-header bg-white border-0 pt-3 pb-0">
        <h6 class="fw-semibold mb-0">
          <i
            class="fas fa-chart-pie me-2"
            style="color: var(--admin-brand-accent);"
          ></i>
          商品營收佔比
        </h6>
      </div>
      <div class="card-body">
        <canvas id="revenueDonutChart"></canvas>
      </div>
    </div>
  </div>
</div>
```

---

## 第 4 階段：訂單管理 (`partials/orders.html`)

### 步驟 4.1：訂單表格與狀態篩選

_相依性：步驟 2.5、admin/data/orders.json_

**視覺設計**：

- 表格容器：`card shadow-sm border-0`
- 表格本體：`table table-hover table-responsive`
- 列上方：篩選 `<select class="form-select">`（對應 `orderStatus` 三種值）

```html
<!-- partials/orders.html -->
<div class="card shadow-sm border-0 rounded-3">
  <div
    class="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3"
  >
    <h6 class="fw-semibold mb-0">訂單列表</h6>
    <!-- 篩選 Select：value 對應 orders.json 的 orderStatus 欄位三種值 -->
    <select class="form-select form-select-sm w-auto" id="orderStatusFilter">
      <option value="all">全部訂單</option>
      <option value="unshipped">未出貨</option>
      <option value="shipped">已出貨</option>
      <option value="returned">已退貨</option>
    </select>
  </div>
  <div class="card-body p-0">
    <div class="table-responsive">
      <table class="table table-hover mb-0" id="ordersTable">
        <thead class="table-light">
          <tr>
            <th>訂單編號</th>
            <th>訂單日期</th>
            <th>客戶姓名</th>
            <th>總金額</th>
            <th>付款狀態</th>
            <th>訂單狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="ordersTableBody">
          <!-- 由 orders.js 的 renderOrdersTable() 動態填入 -->
        </tbody>
      </table>
    </div>
  </div>
</div>
```

**表格列 HTML 模板**（由 JS 字串拼接）：

```html
<!-- 每列結構（JS 動態產生） -->
<!-- 訂單編號：hover 提示「點擊查看明細」，點擊開啟 modal -->
<tr data-order-id="#0006" data-order-status="unshipped">
  <td>
    <span
      class="order-id-link text-primary fw-semibold"
      data-order-id="#0006"
      style="cursor:pointer; text-decoration:underline dotted;"
      title="點擊查看訂單明細"
      >#0006</span
    >
  </td>
  <td>2026-06-04<br /><small class="text-muted">14:32:10</small></td>
  <td>王小明</td>
  <td>NT$ 3,850</td>
  <td>
    <!-- 3 種付款狀態 -->
    <span class="badge bg-success">已付款</span>
    <!-- <span class="badge bg-warning text-dark">未付款</span> -->
    <!-- <span class="badge bg-info text-dark">貨到付款</span> -->
  </td>
  <td>
    <!-- 3 種訂單狀態（只顯示一個 badge） -->
    <span class="badge bg-warning text-dark order-status-badge">未出貨</span>
    <!-- <span class="badge bg-success order-status-badge">已出貨</span> -->
    <!-- <span class="badge bg-danger order-status-badge">已退貨</span> -->
  </td>
  <td>
    <!-- 出貨按鈕：只在 orderStatus=unshipped 時顯示；已出貨/已退貨時操作欄空白 -->
    <button class="btn btn-sm btn-outline-success btn-ship-order">
      <i class="fas fa-truck me-1"></i>出貨
    </button>
  </td>
</tr>
```

---

### 步驟 4.2：訂單明細 Modal（含訂單紀錄）

_相依性：步驟 4.1_

**視覺設計**：點擊「訂單編號」觸發 Bootstrap Modal，顯示完整訂單資訊與時間軸紀錄。
Modal 靜態放在 `dashboard.html`，內容由 `orders.js` 的 `showOrderModal()` 動態填入。

```html
<!-- dashboard.html 中的訂單明細 Modal -->
<div class="modal fade" id="orderDetailModal" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">訂單明細 — <span id="modalOrderId"></span></h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
        ></button>
      </div>
      <div class="modal-body">
        <!-- 買家資訊 + 訂單狀態 -->
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <small class="text-muted d-block">買家姓名</small>
            <span id="modalBuyerName" class="fw-semibold"></span>
          </div>
          <div class="col-md-6">
            <small class="text-muted d-block">訂單狀態</small>
            <span id="modalOrderStatus"></span>
          </div>
        </div>
        <!-- 商品清單 -->
        <h6 class="fw-semibold mb-2">商品清單</h6>
        <table class="table table-sm table-bordered">
          <thead class="table-light">
            <tr>
              <th>商品名稱</th>
              <th>數量</th>
              <th>單價</th>
              <th>小計</th>
            </tr>
          </thead>
          <tbody id="modalItemsList"></tbody>
          <tfoot class="table-light">
            <tr>
              <td colspan="3" class="text-end fw-semibold">合計</td>
              <td class="text-end fw-bold" id="modalTotal"></td>
            </tr>
          </tfoot>
        </table>
        <hr />
        <!-- 收件地址 -->
        <h6 class="fw-semibold mb-2">收件資訊</h6>
        <p id="modalAddress" class="text-muted mb-0"></p>
        <hr />
        <!-- 訂單紀錄時間軸：由 orders.js 動態填入 -->
        <h6 class="fw-semibold mb-2">
          <i class="fas fa-history me-2 text-muted"></i>訂單紀錄
        </h6>
        <ul id="modalHistory" class="list-unstyled small mb-0">
          <!-- 每筆：時間 + 動作，例：2026-05-27 15:44:18 訂單產生 -->
        </ul>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          關閉
        </button>
      </div>
    </div>
  </div>
</div>
```

---

### 步驟 4.3：訂單 JS 邏輯（重構版）

_相依性：步驟 4.1、4.2_

**核心設計**：初次載入後將資料存入 `window.ordersCache`，後續所有操作（點訂單編號開 modal、點出貨按鈕）都直接讀寫快取，不重新 fetch JSON，確保出貨後 history 能即時反映在 modal。

```javascript
// admin/js/orders.js

window.initOrders = function () {
  $(document).off('.orders');

  // === 1. 載入資料（優先使用快取）===
  if (window.ordersCache && window.ordersCache.length > 0) {
    renderOrdersTable(window.ordersCache);
  } else {
    $.getJSON('data/orders.json', function (orders) {
      window.ordersCache = orders;
      renderOrdersTable(orders);
    });
  }

  // === 2. 篩選器（依 data-order-status 屬性顯示/隱藏列）===
  $(document).on('change.orders', '#orderStatusFilter', function () {
    var status = $(this).val();
    if (status === 'all') {
      $('#ordersTableBody tr').show();
    } else {
      $('#ordersTableBody tr').hide();
      $('#ordersTableBody tr[data-order-status="' + status + '"]').show();
    }
  });

  // === 3. 點擊訂單編號 → 開啟 modal（從快取讀取，不重新 fetch）===
  $(document).on('click.orders', '.order-id-link', function () {
    var orderId = $(this).data('order-id');
    var order = (window.ordersCache || []).find(function (o) { return o.id === orderId; });
    if (!order) return;
    showOrderModal(order);
  });

  // === 4. 出貨按鈕：更新快取、更新畫面、push history ===
  $(document).on('click.orders', '.btn-ship-order', function () {
    var $row = $(this).closest('tr');
    var orderId = $row.data('order-id');
    var order = (window.ordersCache || []).find(function (o) { return o.id === orderId; });

    if (order) {
      order.orderStatus = 'shipped';
      var now = new Date();
      // 取當下時間格式化為 YYYY-MM-DD HH:MM:SS
      var timeStr = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate())
                  + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
      order.history.push({ time: timeStr, action: '已出貨' });
    }

    $row.find('.order-status-badge')
        .removeClass('bg-warning text-dark bg-danger')
        .addClass('bg-success').text('已出貨');
    $row.attr('data-order-status', 'shipped');
    $(this).hide();
    window.showAdminToast('訂單 ' + orderId + ' 已更新為「已出貨」');
  });
};

function renderOrdersTable(orders) {
  // 付款狀態 badge（3 種）
  var payBadgeMap = {
    paid:   '<span class="badge bg-success">已付款</span>',
    unpaid: '<span class="badge bg-warning text-dark">未付款</span>',
    cod:    '<span class="badge bg-info text-dark">貨到付款</span>'
  };
  // 訂單狀態 badge（3 種）
  var orderStatusMap = {
    unshipped: '<span class="badge bg-warning text-dark order-status-badge">未出貨</span>',
    shipped:   '<span class="badge bg-success order-status-badge">已出貨</span>',
    returned:  '<span class="badge bg-danger order-status-badge">已退貨</span>'
  };

  var html = orders.map(function (order) {
    var shipBtn = (order.orderStatus === 'unshipped')
      ? '<button class="btn btn-sm btn-outline-success btn-ship-order">' +
        '<i class="fas fa-truck me-1"></i>出貨</button>'
      : '';
    var idLink = '<span class="order-id-link text-primary fw-semibold" data-order-id="' + order.id + '"' +
                 ' style="cursor:pointer; text-decoration:underline dotted;" title="點擊查看訂單明細">' +
                 order.id + '</span>';
    var dp = order.createdAt.split(' ');
    return '<tr data-order-id="' + order.id + '" data-order-status="' + order.orderStatus + '">' +
           '<td>' + idLink + '</td>' +
           '<td>' + dp[0] + '<br><small class="text-muted">' + (dp[1]||'') + '</small></td>' +
           '<td class="fw-semibold">' + order.buyerName + '</td>' +
           '<td class="fw-semibold">NT$ ' + order.total.toLocaleString() + '</td>' +
           '<td>' + (payBadgeMap[order.paymentStatus]||'') + '</td>' +
           '<td>' + (orderStatusMap[order.orderStatus]||'') + '</td>' +
           '<td>' + shipBtn + '</td></tr>';
  }).join('');
  $('#ordersTableBody').html(html);
}

function showOrderModal(order) {
  $('#modalOrderId').text(order.id);
  $('#modalBuyerName').text(order.buyerName);
  var statusMap = {
    unshipped: '<span class="badge bg-warning text-dark">未出貨</span>',
    shipped:   '<span class="badge bg-success">已出貨</span>',
    returned:  '<span class="badge bg-danger">已退貨</span>'
  };
  $('#modalOrderStatus').html(statusMap[order.orderStatus] || '');
  var itemsHtml = (order.items || []).map(function (item) {
    return '<tr><td>' + item.name + '</td><td class="text-center">' + item.qty +
           '</td><td class="text-end">NT$ ' + item.price.toLocaleString() +
           '</td><td class="text-end">NT$ ' + (item.qty * item.price).toLocaleString() + '</td></tr>';
  }).join('');
  $('#modalItemsList').html(itemsHtml);
  $('#modalTotal').text('NT$ ' + order.total.toLocaleString());
  $('#modalAddress').text(order.address);
  // 訂單紀錄時間軸
  var historyHtml = (order.history || []).map(function (e) {
    return '<li><span class="text-muted me-2">' + e.time + '</span>' + e.action + '</li>';
  }).join('');
  $('#modalHistory').html(historyHtml || '<li class="text-muted">尚無紀錄</li>');
  new bootstrap.Modal('#orderDetailModal').show();
}
}
```

---

## 第 5 階段：商品與庫存管理 (`partials/products.html`)

### 步驟 5.0：`initProducts()` 完整入口函式

_相依性：步驟 2.5、admin/data/products.json_

這是商品管理模組被 `core.js` 呼叫的初始化函式，負責載入數據、渲染表格、以及綁定所有事件。

```javascript
// admin/js/products.js

/**
 * initProducts()
 * 功能：商品管理頁面初始化
 *  1. 從 products.json 載入商品列表並渲染表格
 *  2. 綁定庫存行內編輯事件
 *  3. 綁定上架/下架 form-switch 事件
 *  4. 綁定「新增商品」Modal 送出事件
 *
 * API 預留：$.getJSON 路徑改為 GET /api/admin/products 即可
 */
window.initProducts = function () {
  // === 1. 載入商品數據並渲染 ===
  $.getJSON("../data/products.json", function (products) {
    renderProductsTable(products);
  }).fail(function () {
    $("#productsTableBody").html(
      '<tr><td colspan="7" class="text-center text-danger">載入商品數據失敗</td></tr>',
    );
  });

  // === 2. 庫存儲存按鈕事件（見步驟 5.2） ===
  $(document).on("click", ".btn-save-stock", handleSaveStock);

  // === 3. 上架/下架切換事件（見步驟 5.3） ===
  $(document).on("change", ".status-toggle", handleStatusToggle);

  // === 4. 新增商品 Modal 送出事件（見本步驟末尾） ===
  $(document).on("submit", "#addProductForm", handleAddProduct);
};

/**
 * renderProductsTable(products)
 * 功能：將商品 JSON 陣列渲染成完整的 <tbody> 內容
 * 注意：庫存 < 5 的列自動加上 table-danger 背景
 */
function renderProductsTable(products) {
  if (!products || products.length === 0) {
    $("#productsTableBody").html(
      '<tr><td colspan="7" class="text-center text-muted py-4">目前沒有商品</td></tr>',
    );
    return;
  }

  const html = products
    .map((product) => {
      const rowClass = product.stock < 5 ? "table-danger" : ""; // 低庫存警告背景
      const isActive = product.status === "active";

      return `
    <tr class="${rowClass}" data-product-id="${product.id}">
      <td>
        <img src="${product.thumbnail}" width="40" height="40"
             class="rounded" style="object-fit: cover;"
             onerror="this.src='../assets/images/placeholder.jpg'">
      </td>
      <td class="fw-semibold">${product.name}</td>
      <td><span class="badge bg-secondary">${product.category}</span></td>
      <td class="text-muted small">${product.spec}</td>
      <td>NT$ ${product.price.toLocaleString()}</td>
      <td>
        <div class="input-group input-group-sm" style="width: 120px;">
          <input type="number" class="form-control stock-input"
                 value="${product.stock}" min="0">
          <button class="btn btn-outline-secondary btn-save-stock" type="button">
            <i class="fas fa-save save-icon"></i>
          </button>
        </div>
      </td>
      <td>
        <div class="form-check form-switch">
          <input class="form-check-input status-toggle" type="checkbox"
                 id="statusToggle_${product.id}"
                 ${isActive ? "checked" : ""}>
          <label class="form-check-label status-label"
                 for="statusToggle_${product.id}"
                 style="color: ${isActive ? "#244d4d" : "#aaa"};">
            ${isActive ? "上架中" : "已下架"}
          </label>
        </div>
      </td>
    </tr>`;
    })
    .join("");

  $("#productsTableBody").html(html);
}

/**
 * handleAddProduct(e)
 * 功能：「新增商品」Modal 送出時，把假商品 prependTo 表格頂部
 */
function handleAddProduct(e) {
  e.preventDefault();

  const newProduct = {
    id: "P-NEW-" + Date.now(),
    thumbnail: "../assets/images/placeholder.jpg",
    name: $("#newProductName").val().trim(),
    category: $("#newProductCategory").val(),
    spec: $("#newProductSpec").val().trim() || "—",
    price: parseInt($("#newProductPrice").val()) || 0,
    stock: parseInt($("#newProductStock").val()) || 0,
    status: "active",
  };

  // 渲染單列並插入頂部（帶 fadeIn 動畫）
  const rowClass = newProduct.stock < 5 ? "table-danger" : "";
  const $newRow = $(`
    <tr class="${rowClass}" data-product-id="${newProduct.id}">
      <td><img src="${newProduct.thumbnail}" width="40" height="40" class="rounded"></td>
      <td class="fw-semibold">${newProduct.name}</td>
      <td><span class="badge bg-secondary">${newProduct.category}</span></td>
      <td class="text-muted small">${newProduct.spec}</td>
      <td>NT$ ${newProduct.price.toLocaleString()}</td>
      <td>
        <div class="input-group input-group-sm" style="width: 120px;">
          <input type="number" class="form-control stock-input" value="${newProduct.stock}" min="0">
          <button class="btn btn-outline-secondary btn-save-stock" type="button">
            <i class="fas fa-save save-icon"></i>
          </button>
        </div>
      </td>
      <td>
        <div class="form-check form-switch">
          <input class="form-check-input status-toggle" type="checkbox"
                 id="statusToggle_${newProduct.id}" checked>
          <label class="form-check-label status-label"
                 for="statusToggle_${newProduct.id}"
                 style="color: #244d4d;">上架中</label>
        </div>
      </td>
    </tr>`);

  $newRow.hide().prependTo("#productsTableBody").fadeIn(400);

  // 關閉 Modal 並清空表單
  bootstrap.Modal.getInstance("#addProductModal").hide();
  $("#addProductForm")[0].reset();

  window.showAdminToast(`商品「${newProduct.name}」已新增`);
}
```

**「新增商品」按鈕 + Modal HTML**（放在 `partials/products.html` 的 card-header 右側，Modal 靜態放置於 `dashboard.html`）：

```html
<!-- partials/products.html - card-header 右側加入新增按鈕 -->
<div
  class="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3"
>
  <h6 class="fw-semibold mb-0">商品列表</h6>
  <button
    class="btn btn-sm text-white"
    style="background-color: var(--admin-brand-accent);"
    data-bs-toggle="modal"
    data-bs-target="#addProductModal"
  >
    <i class="fas fa-plus me-1"></i>新增商品
  </button>
</div>
```

```html
<!-- dashboard.html 中的「新增商品」Modal（靜態放置，partials 載入後即可使用） -->
<div class="modal fade" id="addProductModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">新增商品</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
        ></button>
      </div>
      <div class="modal-body">
        <form id="addProductForm">
          <div class="mb-3">
            <label class="form-label"
              >商品名稱 <span class="text-danger">*</span></label
            >
            <input
              type="text"
              class="form-control"
              id="newProductName"
              required
            />
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label">分類</label>
              <select class="form-select" id="newProductCategory">
                <option>帳篷</option>
                <option>睡袋</option>
                <option>炊具</option>
                <option>燈具</option>
                <option>背包</option>
                <option>其他</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label">規格 / 顏色</label>
              <input
                type="text"
                class="form-control"
                id="newProductSpec"
                placeholder="例：深橄欖綠"
              />
            </div>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label"
                >售價 (NT$) <span class="text-danger">*</span></label
              >
              <input
                type="number"
                class="form-control"
                id="newProductPrice"
                min="1"
                required
              />
            </div>
            <div class="col-6">
              <label class="form-label">初始庫存</label>
              <input
                type="number"
                class="form-control"
                id="newProductStock"
                min="0"
                value="0"
              />
            </div>
          </div>
          <div class="modal-footer px-0 pb-0">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              取消
            </button>
            <button
              type="submit"
              class="btn text-white"
              style="background-color: var(--admin-brand-accent);"
            >
              <i class="fas fa-plus me-1"></i>建立商品
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
```

---

### 步驟 5.1：商品表格與低庫存預警

_相依性：步驟 5.0、admin/data/products.json_

**視覺設計**：

- 商品圖片：`<img>` 縮圖 (40×40, `rounded`)
- 庫存預警：庫存量 < 5 的商品列，**由 JS 自動加上 `table-danger` class**（Bootstrap 內建淡紅色背景）
- 這個設計意圖模擬高周轉率時期的供應鏈預警視覺提示

```javascript
// admin/js/products.js 中的渲染邏輯

/** 判斷是否低庫存，決定列的背景色 */
const rowClass = product.stock < 5 ? "table-danger" : "";

const rowHtml = `
<tr class="${rowClass}" data-product-id="${product.id}">
  <td>
    <img src="${product.thumbnail}" width="40" height="40"
         class="rounded object-fit-cover">
  </td>
  <td class="fw-semibold">${product.name}</td>
  <td><span class="badge bg-secondary">${product.category}</span></td>
  <td class="text-muted">${product.spec}</td>
  <td>NT$ ${product.price.toLocaleString()}</td>
  <td>
    <!-- 庫存行內編輯 input-group -->
    <div class="input-group input-group-sm" style="width: 120px;">
      <input type="number" class="form-control stock-input"
             value="${product.stock}" min="0">
      <button class="btn btn-outline-secondary btn-save-stock" type="button"
              title="儲存庫存">
        <i class="fas fa-save save-icon"></i>
      </button>
    </div>
  </td>
  <td>
    <!-- 上架/下架切換開關 -->
    <div class="form-check form-switch">
      <input class="form-check-input status-toggle"
             type="checkbox"
             id="statusToggle_${product.id}"
             ${product.status === "active" ? "checked" : ""}>
      <label class="form-check-label status-label"
             for="statusToggle_${product.id}"
             style="color: ${product.status === "active" ? "#244d4d" : "#aaa"};">
        ${product.status === "active" ? "上架中" : "已下架"}
      </label>
    </div>
  </td>
</tr>`;
```

---

### 步驟 5.2：庫存行內編輯互動

_相依性：步驟 5.1_

庫存行內編輯是展示 jQuery 即時互動的重要亮點，全程不重整頁面。

```javascript
// admin/js/products.js - 庫存行內編輯

/**
 * 庫存儲存按鈕點擊事件
 *
 * 互動流程：
 *  1. 點擊儲存 Icon
 *  2. Icon 切換為綠色打勾（text-success）
 *  3. 0.5 秒後恢復為原始 fa-save Icon
 *  4. 顯示 Toast：「庫存更新成功」
 *
 * API 預留：實際串接後，在步驟 2 之前加入
 *   $.ajax({ url: `/api/admin/products/${id}/stock`, method: 'PATCH', data: { stock: newStock } })
 */
// 事件處理函式（由 initProducts() 中的 $(document).on() 呼叫）
function handleSaveStock() {
  // 別名，讓 initProducts() 中 .on('click', '.btn-save-stock', handleSaveStock) 可直接參考
}
$(document).on("click", ".btn-save-stock", function () {
  const $btn = $(this);
  const $row = $btn.closest("tr");
  const productId = $row.data("product-id");
  const newStock = $btn.siblings(".stock-input").val();

  // 步驟 2：Icon 切換為綠色打勾
  $btn
    .find(".save-icon")
    .removeClass("fa-save")
    .addClass("fa-check text-success");
  $btn.prop("disabled", true); // 防止重複點擊

  // 步驟 3：0.5 秒後恢復
  setTimeout(function () {
    $btn
      .find(".save-icon")
      .removeClass("fa-check text-success")
      .addClass("fa-save");
    $btn.prop("disabled", false);

    // 更新列背景色（即時反映庫存預警狀態）
    if (parseInt(newStock) < 5) {
      $row.addClass("table-danger");
    } else {
      $row.removeClass("table-danger");
    }
  }, 500);

  // 步驟 4：Toast
  window.showAdminToast(`商品 ${productId} 庫存已更新為 ${newStock}`);
});
```

---

### 步驟 5.3：上架/下架狀態切換

_相依性：步驟 5.1_

```javascript
// admin/js/products.js - 商品狀態切換

/**
 * form-switch 切換事件
 *
 * 互動流程：
 *  - 開關開啟：旁邊 Label 文字改為品牌綠色「上架中」
 *  - 開關關閉：Label 文字改為灰色「已下架」
 *
 * API 預留：$.ajax({ url: `/api/admin/products/${id}/status`, method: 'PATCH', ... })
 */
function handleStatusToggle() {
  // 別名，讓 initProducts() 中 .on('change', '.status-toggle', handleStatusToggle) 可直接參考
}
$(document).on("change", ".status-toggle", function () {
  const $label = $(this).siblings(".status-label");
  const isActive = $(this).is(":checked");

  if (isActive) {
    $label.text("上架中").css("color", "#244d4d"); // 品牌深青綠
  } else {
    $label.text("已下架").css("color", "#aaa"); // 灰色
  }

  const statusText = isActive ? "上架" : "下架";
  window.showAdminToast(`商品狀態已更新為「${statusText}」`);
});
```

---

## 第 6 階段：客戶管理 (`partials/customers.html`)

### 步驟 6.0：`initCustomers()` 完整入口函式

_相依性：步驟 2.5、admin/data/customers.json_

```javascript
// admin/js/customers.js

/**
 * initCustomers()
 * 功能：客戶管理頁面初始化
 *  1. 從 customers.json 載入會員列表，動態渲染手風琴
 *  2. 綁定鉛筆 Icon 行內編輯事件
 *
 * API 預留：$.getJSON 路徑改為 GET /api/admin/customers 即可
 */
window.initCustomers = function () {
  $.getJSON("../data/customers.json", function (customers) {
    renderCustomersAccordion(customers);
  }).fail(function () {
    $("#customersAccordion").html(
      '<div class="alert alert-danger">載入會員資料失敗</div>',
    );
  });

  // 行內編輯事件（見步驟 6.2）
  $(document).on("click", ".btn-inline-edit", handleInlineEdit);
  $(document).on("keydown blur", ".inline-edit-input", handleInlineEditSave);
};

/**
 * renderCustomersAccordion(customers)
 * 功能：將 customers.json 陣列動態渲染成 Bootstrap Accordion HTML
 *
 * 邏輯說明：
 *  - 每位會員為一個 accordion-item
 *  - accordion-header 顯示：頭像、姓名、聯絡資訊、累積消費、標籤 Badge
 *  - accordion-body 包含：可編輯欄位（等級/點數/折扣券）、購買紀錄 Collapse
 *  - 購買紀錄從 customer.orders 陣列動態產生 <li> 列表
 *    （注意：目前 orders 陣列只存訂單 ID，顯示時只顯示 ID 與假金額）
 */
function renderCustomersAccordion(customers) {
  const tagColorMap = {
    VIP: "bg-warning text-dark",
    高消費: "bg-success",
    高退貨率: "bg-danger",
    新會員: "bg-info text-dark",
  };

  const html = customers
    .map((customer, index) => {
      // 標籤 Badge HTML
      const tagsHtml = (customer.tags || [])
        .map(
          (tag) =>
            `<span class="badge ${tagColorMap[tag] || "bg-secondary"} ms-1">${tag}</span>`,
        )
        .join("");

      // 購買紀錄列表（從 customer.orders 陣列動態產生）
      const ordersHtml =
        (customer.orders || []).length > 0
          ? customer.orders
              .map(
                (orderId) => `
          <li class="list-group-item d-flex justify-content-between align-items-center px-0">
            <div>
              <code>${orderId}</code>
              <span class="text-muted ms-2 small">點擊訂單管理查看詳情</span>
            </div>
            <span class="badge bg-secondary rounded-pill">查看</span>
          </li>`,
              )
              .join("")
          : '<li class="list-group-item px-0 text-muted">尚無購買紀錄</li>';

      const collapseId = `orders_${customer.id}`;
      const accordionId = `customer_${customer.id}`;

      return `
    <div class="accordion-item border-0 shadow-sm mb-2 rounded-3 overflow-hidden"
         data-customer-id="${customer.id}">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed py-3" type="button"
                data-bs-toggle="collapse" data-bs-target="#${accordionId}">

          <img src="${customer.avatar || "../assets/images/placeholder.jpg"}"
               class="rounded-circle me-3 flex-shrink-0"
               width="40" height="40"
               style="object-fit: cover;"
               onerror="this.src='../assets/images/placeholder.jpg'">

          <div class="flex-grow-1">
            <span class="fw-semibold me-2">${customer.name}</span>
            <small class="text-muted d-none d-md-inline">
              ${customer.phone} ／ ${customer.email}
            </small>
          </div>

          <div class="d-flex align-items-center gap-2 me-3">
            <span class="text-muted small">NT$ ${customer.totalSpent.toLocaleString()}</span>
            ${tagsHtml}
          </div>

        </button>
      </h2>

      <div id="${accordionId}" class="accordion-collapse collapse">
        <div class="accordion-body bg-light">

          <!-- 可編輯欄位 -->
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label text-muted small">會員等級</label>
              <div class="d-flex align-items-center gap-2">
                <span class="editable-field fw-semibold" data-field="tier">${customer.tier}</span>
                <i class="fas fa-pencil-alt text-muted small btn-inline-edit"
                   style="cursor: pointer;" data-field="tier"></i>
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small">累積點數</label>
              <div class="d-flex align-items-center gap-2">
                <span class="editable-field fw-semibold" data-field="points">${customer.points.toLocaleString()}</span>
                <i class="fas fa-pencil-alt text-muted small btn-inline-edit"
                   style="cursor: pointer;" data-field="points"></i>
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label text-muted small">持有折扣券</label>
              <div class="d-flex align-items-center gap-2">
                <span class="editable-field fw-semibold" data-field="coupons">${customer.coupons} 張</span>
                <i class="fas fa-pencil-alt text-muted small btn-inline-edit"
                   style="cursor: pointer;" data-field="coupons"></i>
              </div>
            </div>
          </div>

          <!-- 購買紀錄 Collapse -->
          <hr class="my-2">
          <button class="btn btn-sm btn-outline-secondary"
                  data-bs-toggle="collapse" data-bs-target="#${collapseId}">
            <i class="fas fa-history me-1"></i>
            查看購買紀錄 (${customer.orders.length} 筆)
          </button>

          <div class="collapse mt-3" id="${collapseId}">
            <ul class="list-group list-group-flush">
              ${ordersHtml}
            </ul>
          </div>

        </div>
      </div>
    </div>`;
    })
    .join("");

  $("#customersAccordion").html(html);
}

// 行內編輯輔助函式（由 initCustomers 中的事件綁定呼叫）
function handleInlineEdit() {
  // 實作見步驟 6.2 的 .btn-inline-edit 點擊邏輯
}
function handleInlineEditSave() {
  // 實作見步驟 6.2 的 .inline-edit-input keydown/blur 邏輯
}
```

---

### 步驟 6.1：手風琴式會員清單

_相依性：步驟 6.0、admin/data/customers.json_

**視覺設計**：

- 外層用 Bootstrap `accordion`，每位會員為一個 `accordion-item`
- `accordion-header`（預設收合狀態）顯示：頭像、姓名、聯絡資訊、累積消費、標籤 Badge
- `accordion-body`（展開後）顯示：詳細資料編輯欄位 + 過去購買紀錄

```html
<!-- partials/customers.html -->
<div class="accordion" id="customersAccordion">
  <!-- 範例：單一會員項目 -->
  <div
    class="accordion-item border-0 shadow-sm mb-2 rounded-3 overflow-hidden"
    data-customer-id="U001"
  >
    <h2 class="accordion-header">
      <button
        class="accordion-button collapsed"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#customer_U001"
      >
        <!-- 頭像 -->
        <img
          src="../assets/images/avatar-01.jpg"
          class="rounded-circle me-3"
          width="40"
          height="40"
        />

        <!-- 姓名 + 聯絡資訊 -->
        <div class="flex-grow-1">
          <span class="fw-semibold me-2">王小明</span>
          <small class="text-muted d-none d-md-inline">
            0912-345-678 ／ wang@example.com
          </small>
        </div>

        <!-- 累積消費 + 標籤（推到右側） -->
        <div class="d-flex align-items-center gap-2 me-3">
          <span class="text-muted small">NT$ 12,500</span>
          <span class="badge bg-warning text-dark">VIP</span>
          <!-- 高退貨率標籤範例 -->
          <!-- <span class="badge bg-danger">高退貨率</span> -->
        </div>
      </button>
    </h2>

    <!-- 展開內容 -->
    <div id="customer_U001" class="accordion-collapse collapse">
      <div class="accordion-body bg-light">
        <!-- 詳細資料 + 行內編輯（見步驟 6.2） -->
        <!-- 購買紀錄（見步驟 6.3） -->
      </div>
    </div>
  </div>
</div>
```

---

### 步驟 6.2：可編輯欄位（鉛筆 Icon 行內編輯）

_相依性：步驟 6.1_

**互動流程**：

1. 「會員等級、點數、折扣券數量」旁邊放小鉛筆 Icon (`fa-pencil-alt`)
2. 點擊鉛筆 Icon：JS 把純文字 `<span>` 替換為 `<input class="form-control form-control-sm">`
3. 按下 **Enter** 或 Input 失焦 (`blur`) 後，儲存數值並把 Input 恢復為純文字 `<span>`

```html
<!-- partials/customers.html - 行內編輯欄位 -->
<div class="row g-3">
  <div class="col-md-4">
    <label class="form-label text-muted small">會員等級</label>
    <div class="d-flex align-items-center gap-2">
      <span class="editable-field fw-semibold" data-field="tier">VIP</span>
      <i
        class="fas fa-pencil-alt text-muted small btn-inline-edit"
        style="cursor: pointer;"
        data-field="tier"
      ></i>
    </div>
  </div>
  <div class="col-md-4">
    <label class="form-label text-muted small">累積點數</label>
    <div class="d-flex align-items-center gap-2">
      <span class="editable-field fw-semibold" data-field="points">1,250</span>
      <i
        class="fas fa-pencil-alt text-muted small btn-inline-edit"
        style="cursor: pointer;"
        data-field="points"
      ></i>
    </div>
  </div>
  <div class="col-md-4">
    <label class="form-label text-muted small">持有折扣券</label>
    <div class="d-flex align-items-center gap-2">
      <span class="editable-field fw-semibold" data-field="coupons">3 張</span>
      <i
        class="fas fa-pencil-alt text-muted small btn-inline-edit"
        style="cursor: pointer;"
        data-field="coupons"
      ></i>
    </div>
  </div>
</div>
```

```javascript
// admin/js/customers.js - 行內編輯邏輯

/**
 * 鉛筆 Icon 點擊：純文字 → Input
 *
 * 使用 $(this).closest('.d-flex') 找到父容器，
 * 再尋找同層的 .editable-field 並替換為 Input
 */
$(document).on("click", ".btn-inline-edit", function () {
  const $container = $(this).closest(".d-flex");
  const $span = $container.find(".editable-field");
  const currentVal = $span.text();

  // 替換為 Input
  const $input = $(`
    <input type="text"
           class="form-control form-control-sm inline-edit-input"
           style="width: 100px;"
           value="${currentVal}">
  `);
  $span.replaceWith($input);
  $input.focus().select(); // 自動聚焦並選取文字
});

/**
 * Enter 鍵或 blur：Input → 純文字，並顯示 Toast
 */
$(document).on("keydown blur", ".inline-edit-input", function (e) {
  // blur 事件直接存檔；keydown 只處理 Enter 鍵
  if (e.type === "keydown" && e.key !== "Enter") return;

  const $input = $(this);
  const newVal = $input.val().trim() || "—";

  // 恢復為純文字 span
  const $newSpan = $(
    `<span class="editable-field fw-semibold">${newVal}</span>`,
  );
  $input.replaceWith($newSpan);

  window.showAdminToast("會員資料已更新");
});
```

---

### 步驟 6.3：購買紀錄展開

_相依性：步驟 6.1_

在手風琴 `accordion-body` 下方，放置一個 Bootstrap Collapse 按鈕展開購買紀錄，避免一展開就顯示大量資料導致版面過長。

```html
<!-- partials/customers.html - 購買紀錄 Collapse（放在 accordion-body 內） -->
<hr class="my-3" />
<button
  class="btn btn-sm btn-outline-secondary btn-toggle-orders"
  data-bs-toggle="collapse"
  data-bs-target="#orders_U001"
>
  <i class="fas fa-history me-1"></i>
  查看購買紀錄 (2 筆)
</button>

<div class="collapse mt-3" id="orders_U001">
  <ul class="list-group list-group-flush">
    <li
      class="list-group-item d-flex justify-content-between align-items-center px-0"
    >
      <div>
        <code>#0006</code>
        <span class="text-muted ms-2 small">2026-06-04</span>
      </div>
      <span class="badge bg-success rounded-pill">NT$ 3,850</span>
    </li>
    <li
      class="list-group-item d-flex justify-content-between align-items-center px-0"
    >
      <div>
        <code>ORD-20260520</code>
        <span class="text-muted ms-2 small">2026-05-20</span>
      </div>
      <span class="badge bg-success rounded-pill">NT$ 8,650</span>
    </li>
  </ul>
</div>
```

---

## 第 7 階段：折扣管理 (`partials/discounts.html`)

### 步驟 7.1：折扣券生成操作區 UI

_相依性：步驟 2.5_

**視覺設計**：

- 頂部操作區：高亮背景框 `bg-primary bg-opacity-10 rounded-3 p-4`
- 三個控制項並排：折扣額度 Input、發行數量 Input、<i class="bi bi-lightning"></i> 生成按鈕（品牌色、較大按鈕）

```html
<!-- partials/discounts.html - 折扣券生成操作區 -->
<div
  class="p-4 rounded-3 mb-4"
  style="background: rgba(36, 77, 77, 0.08); border: 1px dashed #244d4d;"
>
  <h6 class="fw-semibold mb-3" style="color: var(--admin-brand-accent);">
    <i class="fas fa-bolt me-2"></i>快速生成折扣券
  </h6>
  <div class="row g-3 align-items-end">
    <div class="col-md-3">
      <label class="form-label small text-muted">折扣額度 (NT$)</label>
      <input
        type="number"
        class="form-control"
        id="couponDiscount"
        placeholder="例：200"
        min="1"
      />
    </div>
    <div class="col-md-3">
      <label class="form-label small text-muted">發行數量</label>
      <input
        type="number"
        class="form-control"
        id="couponQty"
        placeholder="例：50"
        min="1"
        max="100"
      />
    </div>
    <div class="col-md-3">
      <label class="form-label small text-muted">有效期限</label>
      <input type="date" class="form-control" id="couponExpiry" />
    </div>
    <div class="col-md-3">
      <button
        class="btn w-100 text-white fw-semibold"
        id="btnGenerateCoupon"
        style="background-color: var(--admin-brand-accent);"
      >
        <i class="fas fa-bolt me-1"></i
        ><i class="bi bi-lightning"></i> 生成折扣券
      </button>
    </div>
  </div>
</div>

<!-- 現有折扣券列表 -->
<div class="card shadow-sm border-0 rounded-3">
  <div class="card-header bg-white border-0 py-3">
    <h6 class="fw-semibold mb-0">現有折扣券列表</h6>
  </div>
  <div class="card-body p-0">
    <div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th>折扣碼</th>
            <th>折扣額度</th>
            <th>已使用 / 總量</th>
            <th>有效期限</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="couponsTableBody">
          <!-- 由 JS 動態產生 -->
        </tbody>
      </table>
    </div>
  </div>
</div>
```

---

### 步驟 7.2：隨機碼生成函式與動態列表插入

_相依性：步驟 7.1_

這是折扣管理模組的 jQuery 核心亮點互動：

```javascript
// admin/js/discounts.js

window.initDiscounts = function () {
  // 載入既有折扣券
  $.getJSON("../data/coupons.json", function (coupons) {
    coupons.forEach((coupon) => appendCouponRow(coupon));
  });

  // === 生成折扣券按鈕點擊事件 ===
  $(document).on("click", "#btnGenerateCoupon", function () {
    const discount = parseInt($("#couponDiscount").val());
    const qty = parseInt($("#couponQty").val());
    const expiry = $("#couponExpiry").val();

    // 基本驗證
    if (!discount || !qty || !expiry) {
      window.showAdminToast("請填寫完整的折扣額度、數量與有效期限", "error");
      return;
    }
    if (qty > 100) {
      window.showAdminToast("單次最多生成 100 組", "error");
      return;
    }

    // 批次生成並插入列表
    for (let i = 0; i < qty; i++) {
      const code = generateCouponCode(); // 呼叫隨機碼生成函式
      const couponData = {
        code: code,
        discount: discount,
        quantity: 1,
        used: 0,
        expiry: expiry,
        status: "active",
        isNew: true, // 標記為新生成，用於 fadeIn 動畫
      };
      appendCouponRow(couponData);
    }

    // 顯示 Toast 告知完成
    window.showAdminToast(`成功生成 ${qty} 組折扣碼`);

    // 清空輸入欄位
    $("#couponDiscount, #couponQty, #couponExpiry").val("");
  });

  // === 停用折扣券 ===
  // 互動流程：
  //  1. 點擊「停用」按鈕
  //  2. Badge 從「啟用中」切換為「已停用」
  //  3. 隱藏停用按鈕（已停用後不需要再按）
  //  4. 顯示 Toast
  //
  // API 預留：$.ajax({ url: `/api/admin/coupons/${code}/disable`, method: 'PATCH' })
  $(document).on("click", ".btn-disable-coupon", function () {
    const $row = $(this).closest("tr");
    const couponCode = $row.find("code").text();

    $row
      .find(".coupon-status-cell")
      .html('<span class="badge bg-secondary">已停用</span>');
    $(this).remove(); // 移除停用按鈕

    window.showAdminToast(`折扣券 ${couponCode} 已停用`, "info");
  });

  // === 刪除折扣券 ===
  // 互動流程：
  //  1. 點擊刪除按鈕
  //  2. 整列 fadeOut(300) 並從 DOM 移除
  //  3. 顯示 Toast
  //
  // API 預留：$.ajax({ url: `/api/admin/coupons/${code}`, method: 'DELETE' })
  $(document).on("click", ".btn-delete-coupon", function () {
    const $row = $(this).closest("tr");
    const couponCode = $row.find("code").text();

    $row.fadeOut(300, function () {
      $(this).remove();
      window.showAdminToast(`折扣券 ${couponCode} 已刪除`, "info");
    });
  });
};

/**
 * generateCouponCode()
 * 功能：生成 8 位英數大寫隨機字串
 * 範例輸出：YURUI6O5、CAMP8X2Z
 *
 * 原理：
 *   Math.random()           → 0 到 1 之間的亂數 (例: 0.8341...)
 *   .toString(36)           → 轉為 36 進位字串 (包含 0-9 和 a-z)
 *   .substring(2, 10)       → 取第 2 到 9 個字元 (去掉 "0." 開頭)
 *   .toUpperCase()          → 全部轉為大寫
 *   .padEnd(8, '0')         → 不足 8 位則補 0（避免太短）
 */
function generateCouponCode() {
  return Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()
    .padEnd(8, "0");
}

/**
 * appendCouponRow(coupon)
 * 功能：把一筆折扣券資料插入列表頂部（使用 fadeIn 動畫）
 */
function appendCouponRow(coupon) {
  const statusBadge =
    coupon.status === "active"
      ? '<span class="badge bg-success">啟用中</span>'
      : '<span class="badge bg-secondary">已停用</span>';

  const $row = $(`
    <tr>
      <td>
        <code class="fw-bold">${coupon.code}</code>
      </td>
      <td>NT$ ${coupon.discount}</td>
      <td>${coupon.used} / ${coupon.quantity}</td>
      <td>${coupon.expiry}</td>
      <td class="coupon-status-cell">${statusBadge}</td>
      <td>
        <!-- 停用按鈕：只在啟用中時顯示 -->
        ${
          coupon.status === "active"
            ? `<button class="btn btn-sm btn-outline-warning btn-disable-coupon me-1">
               <i class="fas fa-ban"></i> 停用
             </button>`
            : ""
        }
        <!-- 刪除按鈕 -->
        <button class="btn btn-sm btn-outline-danger btn-delete-coupon">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `);

  if (coupon.isNew) {
    // 新生成的折扣券：先隱藏，再 fadeIn 插入頂部（視覺亮點）
    $row.hide().prependTo("#couponsTableBody").fadeIn(400);
  } else {
    // 既有數據：直接 append
    $row.appendTo("#couponsTableBody");
  }
}
```

---

## 第 8 階段：評論管理 (`partials/reviews.html`)

### 步驟 8.1：評論卡片列表、篩選 Tab 與未回覆標記

_相依性：步驟 2.5、admin/data/reviews.json_

**視覺設計**：

- 頁面頂部放置三個篩選 Tab（全部 / 未回覆 / 已回覆），使用 Bootstrap `nav-pills`
- 捨棄傳統表格，改用 Bootstrap 卡片列表（`card` 縱向排列），由 JS 動態渲染
- 每張卡片包含：買家頭像、星星評分（FontAwesome 實心/空心星）、留言文字、實拍縮圖、對應商品名稱、留言時間
- **未回覆醒目提示**：`replied: false` 的卡片加上 `border-start border-danger border-5`（左側顯眼紅色粗邊框）
- **已回覆**：卡片無紅框，且初始即渲染「店家回覆」區塊（從 `replyText` 欄位取值）

**`partials/reviews.html` 骨架結構**（由 JS 填入動態內容）：

```html
<!-- partials/reviews.html -->

<!-- 篩選 Tab -->
<ul class="nav nav-pills mb-4" id="reviewFilterTabs">
  <li class="nav-item">
    <button class="nav-link active" data-filter="all">
      全部 <span class="badge bg-secondary ms-1" id="tabCountAll">0</span>
    </button>
  </li>
  <li class="nav-item ms-2">
    <button class="nav-link" data-filter="unreplied">
      未回覆 <span class="badge bg-danger ms-1" id="tabCountUnreplied">0</span>
    </button>
  </li>
  <li class="nav-item ms-2">
    <button class="nav-link" data-filter="replied">
      已回覆 <span class="badge bg-success ms-1" id="tabCountReplied">0</span>
    </button>
  </li>
</ul>

<!-- 評論卡片容器（由 initReviews() 動態填入） -->
<div class="d-flex flex-column gap-3" id="reviewsList">
  <!-- 動態渲染 -->
</div>
```

---

### 步驟 8.2：`initReviews()` 動態渲染 + 回覆互動邏輯

_相依性：步驟 8.1、admin/data/reviews.json_

```javascript
// admin/js/reviews.js

/**
 * initReviews()
 * 功能：評論管理頁面初始化
 *  1. 從 reviews.json 動態渲染評論卡片
 *  2. 更新篩選 Tab 的數量 Badge
 *  3. 綁定 Tab 篩選事件
 *  4. 綁定回覆互動事件
 *
 * API 預留：$.getJSON 路徑改為 GET /api/admin/reviews 即可
 */
window.initReviews = function () {
  // === 1. 從 JSON 載入評論並渲染 ===
  $.getJSON("../data/reviews.json", function (reviews) {
    renderReviewCards(reviews);
    updateReviewTabCounts(reviews);
  }).fail(function () {
    $("#reviewsList").html(
      '<div class="alert alert-danger">載入評論失敗</div>',
    );
  });

  // === 2. 篩選 Tab 點擊事件 ===
  $(document).on("click", "#reviewFilterTabs .nav-link", function () {
    $("#reviewFilterTabs .nav-link").removeClass("active");
    $(this).addClass("active");

    const filter = $(this).data("filter"); // 'all' | 'unreplied' | 'replied'

    $("#reviewsList .card").each(function () {
      const isReplied = $(this).data("replied"); // true / false
      let show = false;
      if (filter === "all") show = true;
      else if (filter === "unreplied") show = !isReplied;
      else if (filter === "replied") show = isReplied;

      show ? $(this).show() : $(this).hide();
    });
  });

  // === 3. 點擊「回覆買家」按鈕：slideDown 展開 textarea ===
  $(document).on("click", ".btn-reply-toggle", function () {
    const $card = $(this).closest(".card");
    const $replyArea = $card.find(".reply-area");

    $replyArea.is(":visible")
      ? $replyArea.slideUp(200)
      : $replyArea.slideDown(200);
    if (!$replyArea.is(":visible")) $card.find(".reply-textarea").focus();
  });

  // === 4. 點擊「送出回覆」按鈕 ===
  $(document).on("click", ".btn-submit-reply", function () {
    const $card = $(this).closest(".card");
    const $textarea = $card.find(".reply-textarea");
    const replyText = $textarea.val().trim();

    if (!replyText) {
      window.showAdminToast("請輸入回覆內容", "error");
      return;
    }

    // 步驟 A：收合 textarea
    $card.find(".reply-area").slideUp(200);

    // 步驟 B：append 店家回覆區塊
    $card.find(".card-body").append(`
      <div class="bg-light rounded p-3 mt-3 seller-reply">
        <small class="fw-semibold" style="color: var(--admin-brand-accent);">
          <i class="fas fa-store me-1"></i>店家回覆：
        </small>
        <p class="mb-0 mt-1 text-muted">${replyText}</p>
      </div>`);

    // 步驟 C：移除紅色左框，更新 data 屬性
    $card.removeClass("border-start border-danger border-5");
    $card.data("replied", true);

    // 步驟 D：更新 Tab 計數
    $.getJSON("../data/reviews.json", function (reviews) {
      updateReviewTabCounts(reviews); // 注意：此時 DOM 已更新，實際計數以 DOM 為準
    });

    // 用 DOM 計算即時數量更新
    const totalCards = $("#reviewsList .card").length;
    const unreplied = $("#reviewsList .card").filter(
      (_, el) => !$(el).data("replied"),
    ).length;
    const replied = totalCards - unreplied;
    $("#tabCountAll").text(totalCards);
    $("#tabCountUnreplied").text(unreplied);
    $("#tabCountReplied").text(replied);

    $textarea.val("");
    window.showAdminToast("回覆已送出，評論已標記為已處理");
  });
};

/**
 * renderReviewCards(reviews)
 * 功能：將 reviews.json 陣列渲染成評論卡片 HTML，注入 #reviewsList
 */
function renderReviewCards(reviews) {
  if (!reviews || reviews.length === 0) {
    $("#reviewsList").html('<p class="text-muted">目前沒有評論</p>');
    return;
  }

  const html = reviews
    .map((review) => {
      // 星星評分 HTML（實心 fas / 空心 far）
      const starsHtml = Array.from(
        { length: 5 },
        (_, i) =>
          `<i class="${i < review.rating ? "fas" : "far"} fa-star"></i>`,
      ).join("");

      // 實拍縮圖 HTML
      const photosHtml = (review.photos || [])
        .map(
          (src) =>
            `<img src="${src}" class="rounded" width="80" height="80"
            style="object-fit: cover; cursor: pointer;"
            onerror="this.style.display='none'">`,
        )
        .join("");

      // 未回覆 → 加紅框；已回覆 → 顯示店家回覆區塊
      const borderClass = review.replied
        ? ""
        : "border-start border-danger border-5";
      const replyBlockHtml = review.replied
        ? `<div class="bg-light rounded p-3 mt-3 seller-reply">
           <small class="fw-semibold" style="color: var(--admin-brand-accent);">
             <i class="fas fa-store me-1"></i>店家回覆：
           </small>
           <p class="mb-0 mt-1 text-muted">${review.replyText}</p>
         </div>`
        : "";

      return `
    <div class="card shadow-sm border-0 ${borderClass} rounded-3"
         data-review-id="${review.id}"
         data-replied="${review.replied}">
      <div class="card-body">

        <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="d-flex align-items-center gap-2">
            <img src="${review.buyerAvatar}" class="rounded-circle"
                 width="40" height="40" style="object-fit: cover;"
                 onerror="this.src='../assets/images/placeholder.jpg'">
            <div>
              <span class="fw-semibold">${review.buyerName}</span><br>
              <span class="text-warning small">${starsHtml}</span>
              <small class="text-muted ms-1">${review.rating}.0</small>
            </div>
          </div>
          <div class="text-end">
            <small class="badge bg-light text-dark border">${review.productName}</small><br>
            <small class="text-muted">${review.createdAt}</small>
          </div>
        </div>

        <p class="mb-2">${review.comment}</p>

        ${photosHtml ? `<div class="d-flex gap-2 mb-3">${photosHtml}</div>` : ""}

        ${
          !review.replied
            ? `<button class="btn btn-sm btn-outline-secondary btn-reply-toggle">
               <i class="fas fa-reply me-1"></i>回覆買家
             </button>
             <div class="reply-area mt-2" style="display: none;">
               <textarea class="form-control mb-2 reply-textarea" rows="3"
                         placeholder="輸入回覆內容..."></textarea>
               <button class="btn btn-sm text-white btn-submit-reply"
                       style="background-color: var(--admin-brand-accent);">
                 <i class="fas fa-paper-plane me-1"></i>送出回覆
               </button>
             </div>`
            : '<span class="badge bg-success"><i class="fas fa-check me-1"></i>已回覆</span>'
        }

        ${replyBlockHtml}

      </div>
    </div>`;
    })
    .join("");

  $("#reviewsList").html(html);
}

/**
 * updateReviewTabCounts(reviews)
 * 功能：根據 reviews 陣列更新三個篩選 Tab 的數字 Badge
 */
function updateReviewTabCounts(reviews) {
  const total = reviews.length;
  const unreplied = reviews.filter((r) => !r.replied).length;
  const replied = reviews.filter((r) => r.replied).length;
  $("#tabCountAll").text(total);
  $("#tabCountUnreplied").text(unreplied);
  $("#tabCountReplied").text(replied);
}
```

---

## 附錄 A：CDN 引用清單

以下 CDN 需在 `admin/dashboard.html` 的 `<head>` 及 `</body>` 前引入：

```html
<!-- HEAD 區塊 -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
/>
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
/>
<link rel="stylesheet" href="css/admin.css" />

<!-- BODY 結束前 -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<!-- 後台 JS（core 最先載入） -->
<script src="js/core.js"></script>
<script src="js/analytics.js"></script>
<script src="js/orders.js"></script>
<script src="js/products.js"></script>
<script src="js/customers.js"></script>
<script src="js/discounts.js"></script>
<script src="js/reviews.js"></script>
```

---

## 附錄 B：API 預留接入點總覽

| 模組             | Mock 來源                             | 未來 API 端點                                  |
| ---------------- | ------------------------------------- | ---------------------------------------------- |
| 登入驗證         | `sessionStorage` 靜態寫入             | `POST /api/admin/login`                        |
| 訂單列表         | `$.getJSON('../data/orders.json')`    | `GET /api/admin/orders?status=all`             |
| 訂單篩選         | 前端 `data-order-status` 屬性         | `GET /api/admin/orders?orderStatus=:status`    |
| 訂單出貨更新     | 純前端 Badge class 切換               | `PATCH /api/admin/orders/:id/ship`             |
| KPI 今日營業額   | `$.getJSON` 從 orders.json 計算       | `GET /api/admin/analytics/kpi`                 |
| KPI 待出貨數     | `$.getJSON` 從 orders.json 計算       | 同上（回傳物件含 pendingShip 欄位）            |
| KPI 低庫存數     | `$.getJSON` 從 products.json 計算     | 同上（回傳物件含 lowStock 欄位）               |
| 商品列表         | `$.getJSON('../data/products.json')`  | `GET /api/admin/products`                      |
| 商品新增         | 純前端 `prependTo` 表格頂部           | `POST /api/admin/products`                     |
| 庫存更新         | 純前端數值更新                        | `PATCH /api/admin/products/:id/stock`          |
| 商品狀態切換     | 純前端 label 文字切換                 | `PATCH /api/admin/products/:id/status`         |
| 會員列表         | `$.getJSON('../data/customers.json')` | `GET /api/admin/customers`                     |
| 會員資料更新     | 純前端 span 替換                      | `PATCH /api/admin/customers/:id`               |
| 折扣券列表       | `$.getJSON('../data/coupons.json')`   | `GET /api/admin/coupons`                       |
| 折扣券生成       | 純前端動態 `prependTo` + fadeIn       | `POST /api/admin/coupons/batch`                |
| 折扣券停用       | 純前端 Badge class 切換               | `PATCH /api/admin/coupons/:code/disable`       |
| 折扣券刪除       | 純前端 `fadeOut` 移除列               | `DELETE /api/admin/coupons/:code`              |
| 評論列表         | `$.getJSON('../data/reviews.json')`   | `GET /api/admin/reviews`                       |
| 評論篩選         | 前端 `data-replied` 屬性              | `GET /api/admin/reviews?replied=true/false`    |
| 評論回覆         | 純前端 append 文字區塊                | `POST /api/admin/reviews/:id/reply`            |
| 分析圖表（折線） | JS 寫死陣列數據                       | `GET /api/admin/analytics/sales?range=7days`   |
| 分析圖表（圓餅） | JS 寫死陣列數據                       | `GET /api/admin/analytics/revenue-by-category` |

---

## 附錄 C：功能驗收清單

### 全局佈局

- [x] 進入 `dashboard.html` 前若未登入，自動跳轉 `login.html`
- [x] 登入後 `sessionStorage` 有 `adminLoggedIn = 'true'`
- [x] Sidebar 導覽點擊時，`active` class 正確切換
- [x] Topbar 頁面標題隨導覽切換正確更新
- [x] 手機版漢堡選單觸發 Offcanvas 由左滑出
- [x] 登出後清除 `sessionStorage` 並跳回登入頁

### 分析報表

- [x] 三張 KPI 卡片正確顯示數字與趨勢箭頭
- [x] 折線圖 X 軸為近七日日期，Y 軸為金額
- [x] 甜甜圈圖各扇形顯示商品分類與比例

### 訂單管理

- [x] 訂單表格由 Mock JSON 動態渲染
- [x] 篩選 `<select>` 切換後，表格列正確顯示/隱藏
- [x] 點擊「查看」彈出 Modal，顯示商品清單與地址
- [x] 點擊「出貨」Badge 從黃轉綠，文字改為「已出貨」，顯示 Toast

### 商品管理

- [x] 庫存 < 5 的列背景呈現 `table-danger` 淡紅色
- [x] 修改庫存輸入後點擊儲存：Icon 短暫變綠色打勾，0.5 秒恢復，顯示 Toast
- [x] 庫存修改後若低於 5，列背景即時變紅；否則移除紅色
- [x] form-switch 切換時，旁邊 Label 文字與顏色正確更新

### 客戶管理

- [x] 手風琴點擊後展開會員詳細資料
- [x] 鉛筆 Icon 點擊將純文字替換為可編輯 Input
- [x] Enter 鍵或失焦後 Input 恢復為純文字並顯示 Toast
- [x] 購買紀錄 Collapse 按鈕展開/收合歷史訂單列表

### 分析報表（KPI 動態）

- [x] 進入分析報表時，KPI 卡片顯示 Loading 動畫
- [x] 計算完成後，今日營業額正確填入（從 orders.json 篩選今日 orderStatus = 'shipped' 訂單）
- [x] 待出貨數正確填入（從 orders.json 計算 orderStatus = 'unshipped' 筆數）
- [x] 低庫存數正確填入（從 products.json 計算 stock < 5 筆數）

### 訂單管理

- [x] 訂單表格由 Mock JSON 動態渲染（6 筆，id 格式 #0001~#0006 按下單時間升序）
- [x] 付款狀態 3 種：已付款（綠）、未付款（黃）、貨到付款（藍），貨到付款不改變
- [x] 訂單狀態 3 種：未出貨（黃）、已出貨（綠）、已退貨（紅）
- [x] 篩選 `<select>` 切換後，對應 `data-order-status` 的列正確顯示/隱藏
- [x] 點擊「訂單編號」（虛線底線）彈出 Modal，顯示商品清單、地址、訂單紀錄時間軸
- [x] 「查看」按鈕已移除
- [x] 出貨按鈕只在 orderStatus = unshipped 時顯示；點擊後狀態改為已出貨並隱藏按鈕
- [x] 出貨後 history 即時新增「已出貨」紀錄，再次點訂單編號可在 modal 看到

### 商品管理

- [x] 商品表格由 Mock JSON 動態渲染（含縮圖）
- [x] 庫存 < 5 的列背景呈現 `table-danger` 淡紅色
- [x] 修改庫存輸入後點擊儲存：Icon 短暫變綠色打勾，0.5 秒恢復，顯示 Toast
- [x] 庫存修改後若低於 5，列背景即時變紅；否則移除紅色
- [x] form-switch 切換時，旁邊 Label 文字與顏色正確更新
- [x] 點擊「新增商品」按鈕觸發 Modal
- [x] Modal 送出後新商品以 fadeIn 插入表格頂部，Modal 自動關閉

### 客戶管理

- [x] 手風琴由 customers.json 動態渲染（含頭像、標籤 Badge）
- [x] 手風琴點擊後展開會員詳細資料（包含等級/點數/折扣券可編輯欄位）
- [x] 鉛筆 Icon 點擊將純文字替換為可編輯 Input
- [x] Enter 鍵或失焦後 Input 恢復為純文字並顯示 Toast
- [x] 購買紀錄從 customer.orders 陣列動態渲染，Collapse 展開/收合正確

### 折扣管理

- [x] 現有折扣券列表由 coupons.json 動態渲染（含停用/刪除操作欄）
- [x] 額度、數量、期限三欄皆為空時點擊生成，顯示錯誤 Toast
- [x] 正常生成時，折扣碼為 8 位英數大寫字串
- [x] 新生成的列以 `fadeIn` 動畫插入列表頂部
- [x] Toast 顯示「成功生成 N 組折扣碼」
- [x] 點擊「停用」後 Badge 切換為「已停用」，停用按鈕消失
- [x] 點擊刪除圖示後列 fadeOut 並從 DOM 移除

### 評論管理

- [x] 評論卡片由 reviews.json 動態渲染（含已回覆/未回覆狀態）
- [x] 篩選 Tab（全部/未回覆/已回覆）數量 Badge 正確顯示
- [x] 點擊 Tab 後對應卡片正確顯示/隱藏
- [x] 未回覆評論卡片有左側紅色粗邊框
- [x] 已回覆評論卡片初始即顯示「店家回覆」區塊
- [x] 點擊「回覆買家」slideDown 展開 textarea
- [x] 送出空白回覆時顯示錯誤 Toast
- [x] 送出後：收合 textarea、append 店家回覆區塊、移除紅色邊框、Tab 計數更新、顯示 Toast

---

## 附錄 D：實作修正紀錄（2026-06-03）

### 問題 1：UTF-8 編碼損毀

**原因**：初始建構時使用 PowerShell `Get-Content | Set-Content` 進行批次路徑替換，PowerShell 預設以系統 Code Page（非 UTF-8）讀寫，導致 5 個 JS 檔案內的中文字元損毀為亂碼（mojibake）。

**受影響檔案**：

- `admin/js/analytics.js`
- `admin/js/orders.js`
- `admin/js/products.js`
- `admin/js/discounts.js`
- `admin/js/reviews.js`
- `admin/js/customers.js`（`tagColorMap` 鍵值損毀為 `????`，造成標籤顏色全部 fallback）

**修正方式**：使用 PowerShell `[System.IO.File]::WriteAllText(path, content, New-Object System.Text.UTF8Encoding($false))` 完整重寫所有 JS 檔案，確保無 BOM 的正確 UTF-8 編碼。

---

### 問題 2：事件堆疊（Event Accumulation）

**原因**：`core.js` 的 `loadSection()` 每次切換頁面都會重新呼叫各模組的 `initXxx()` 函式，這些函式內的 `$(document).on()` 會不斷疊加 event handler，造成重複觸發。

**修正方式**：在每個 `initXxx()` 函式開頭加入 `$(document).off('.namespace')`，利用 **jQuery Event Namespace** 機制先解除舊的 handler，再重新綁定：

| 模組     | Namespace    |
| -------- | ------------ |
| 訂單管理 | `.orders`    |
| 商品管理 | `.products`  |
| 客戶管理 | `.customers` |
| 折扣管理 | `.discounts` |
| 評論管理 | `.reviews`   |

---

### 問題 3：佔位圖路徑失效

**原因**：`assets/images/` 目錄為空，所有使用本機路徑的 `<img>` 無法載入。

**修正方式**：所有 `<img>` 的 `src` 與 `onerror` 屬性改用線上服務：

```html
<!-- 統一格式 -->
<img
  src="..."
  onerror="this.src='https://placehold.co/48x48/cccccc/555555?text=No+Image'"
/>
```

---

### 問題 4：HTML 與 JS 結構不一致

修正清單：

| 問題                             | 原狀態                                           | 修正後                                       |
| -------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| `dashboard.html` 新增商品按鈕    | `type="submit"`，無 ID                           | 改為 `type="button" id="submitAddProduct"`   |
| `products.html` 表頭有「規格」欄 | 7 欄（含規格）                                   | 移除規格欄，改為「售價/狀態/上架切換」7 欄   |
| `discounts.html` 表格只有 6 欄   | 折扣碼/折扣額/使用量/期限/狀態/操作              | 改為 8 欄（增加總數量/已使用/剩餘）          |
| `discounts.html` 生成表單 ID     | `#couponDiscount`, `#btnGenerateCoupon`          | 改為 `#newCouponCode`, `#submitAddCoupon` 等 |
| `reviews.html` 容器 ID           | `#reviewsList`                                   | 改為 `#reviewsContainer`                     |
| `reviews.html` 篩選按鈕 class    | `nav-link`（Bootstrap nav-pills）                | 改為 `filter-btn`（配合 JS 邏輯）            |
| `discounts.js` 依賴 Modal        | `bootstrap.Modal.getInstance('#addCouponModal')` | 改為 inline form，無 Modal                   |

---

### 問題 5：功能遺漏補齊

| 功能                                  | 補齊說明                                                            |
| ------------------------------------- | ------------------------------------------------------------------- |
| 低庫存列背景                          | `products.js` 的 `<tr>` 加入 `class="table-danger"`                 |
| 庫存更新後列背景即時更新              | 儲存時對 `$row` 動態 `addClass/removeClass('table-danger')`         |
| 未回覆評論邊框顏色                    | 修正為 `border-danger`（紅色），符合規格要求                        |
| 新增優惠券 fadeIn 動畫                | 改為 `$('#couponsTableBody').prepend($(newRow).hide().fadeIn(400))` |
| 新增商品 fadeIn 動畫                  | 同上                                                                |
| Enter 鍵觸發儲存                      | `customers.js` 加入 `keydown.customers` 事件                        |
| `showAdminToast` 支援 `'danger'` type | `core.js` 的 `colorMap` 加入 `danger: 'bg-danger'`                  |
| 評論 Tab Badge 計數                   | `reviews.js` 在載入後動態更新 `#tabCountAll/Unreplied/Replied`      |
| 回覆後 Tab 計數即時更新               | 送出回覆後重算並更新三個 Badge                                      |

---

### 驗收結論

附錄 C 全部 56 個驗收項目已全部完成（含原始 34 條功能清單及擴充項目）。

**主要技術亮點**：

- jQuery Event Namespace 防止頁面切換時事件堆疊
- UTF-8 編碼正確處理（無 BOM）
- 線上佔位圖服務確保圖片正常顯示
- Bootstrap `table-danger` 整列淡紅色庫存警告
- 評論 Tab 計數即時同步更新

---

## 附錄 E：訂單系統升級 & JS 全面亂碼修復（2026-06-04）

### E-1 訂單管理功能升級

**付款狀態新增「貨到付款」**

| `paymentStatus` 值 | 顯示文字 | Badge 顏色             |
| ------------------ | -------- | ---------------------- |
| `paid`             | 已付款   | `bg-success`           |
| `unpaid`           | 未付款   | `bg-warning text-dark` |
| `cod`              | 貨到付款 | `bg-info text-dark`    |

**訂單狀態簡化為三種**

| `orderStatus` 值 | 顯示文字 | 說明                       |
| ---------------- | -------- | -------------------------- |
| `unshipped`      | 未出貨   | 初始狀態，顯示「出貨」按鈕 |
| `shipped`        | 已出貨   | 點擊出貨後，按鈕消失       |
| `returned`       | 已退貨   | 退貨狀態                   |

> 已移除原本的 `shippingStatus` 獨立欄位，統一由 `orderStatus` 管理。

**訂單 ID 格式**

- 格式：`#0001`（4 位數字，不足補零）
- 按照 `createdAt` 時間排序，最舊的訂單拿到 `#0001`

**訂單紀錄（history）**

每筆訂單在 `orders.json` 中新增 `history` 陣列，記錄時間軸事件：

```json
"history": [
  { "time": "2026-05-27 15:44:18", "action": "訂單產生" },
  { "time": "2026-05-27 15:50:02", "action": "已付款" },
  { "time": "2026-05-29 09:12:00", "action": "已出貨" }
]
```

點擊訂單編號連結（`.order-id-link`）會開啟訂單明細 Modal，其中 `#modalHistory` 以 `<li>` 時間軸方式列出每個事件。

**「查看」按鈕移除**

原本的「查看」按鈕（`.btn-view-order`）已移除，改由點擊訂單編號觸發 Modal。

---

### E-2 JS 亂碼全面修復

**問題根源**

Windows 環境下使用 PowerShell 或編輯器儲存 JS 檔案時，若未明確指定 UTF-8，系統預設以 **Windows-1252（cp1252）** 編碼讀寫，導致兩種亂碼：

| 類型                    | 症狀                 | 原因                                     |
| ----------------------- | -------------------- | ---------------------------------------- |
| **`?` 字元遺失型**      | 中文變成 `?`         | 字元完全遺失，無法還原                   |
| **Latin-1 Mojibake 型** | 中文變成 `é«˜æ¶ˆè²»` | UTF-8 bytes 被當 Windows-1252 chars 解讀 |

**受影響檔案與修復方式**

| 檔案                    | 問題類型         | 修復方式                                              |
| ----------------------- | ---------------- | ----------------------------------------------------- |
| `admin/js/analytics.js` | `?` 字元遺失     | 依 `pageForSeller.md` 人工還原，PowerShell UTF-8 寫入 |
| `admin/js/customers.js` | Latin-1 Mojibake | 人工還原完整中文，PowerShell UTF-8 寫入               |
| `admin/js/products.js`  | Latin-1 Mojibake | 人工還原完整中文，PowerShell UTF-8 寫入               |
| `admin/js/discounts.js` | Latin-1 Mojibake | 人工還原完整中文，PowerShell UTF-8 寫入               |
| `admin/js/reviews.js`   | Latin-1 Mojibake | 人工還原完整中文，PowerShell UTF-8 寫入               |

**正確的 PowerShell UTF-8 寫入規範**

```powershell
# 必須使用 UTF8 Encoding（含 BOM 版本）
[System.IO.File]::WriteAllText(
  '完整路徑\檔案.js',
  $content,
  [System.Text.Encoding]::UTF8
)
```

> ⚠️ 注意：PowerShell 5.x 的 `Set-Content`、`Out-File` 預設不是 UTF-8，**一定要用 `[System.IO.File]::WriteAllText`** 才能確保正確編碼。

**驗證方式**

使用 Node.js 搜尋關鍵中文字串：

```bash
node -e "const fs = require('fs'); const c = fs.readFileSync('admin/js/customers.js', 'utf8'); console.log(c.includes('高消費'));"
# 應輸出 true
```

---

### E-3 驗收結論（2026-06-04）

以下 Node.js 驗證全部通過：

| 檔案 / 資料      | 驗證項目                                                    | 結果 |
| ---------------- | ----------------------------------------------------------- | ---- |
| `analytics.js`   | 銷售額、帳篷、今日已完成訂單加總                            | ✅   |
| `customers.js`   | 高消費、新會員、高退貨率、會員等級                          | ✅   |
| `products.js`    | 上架中、已下架、編輯庫存、低庫存警告                        | ✅   |
| `discounts.js`   | 啟用中、已停用、折抵 NT$、無限期                            | ✅   |
| `reviews.js`     | 已回覆、待回覆、賣家回覆、送出回覆                          | ✅   |
| `orders.js`      | order-id-link、btn-ship-order、showOrderModal、modalHistory | ✅   |
| `orders.json`    | #0001 格式、paymentStatus、orderStatus、history 陣列        | ✅   |
| `dashboard.html` | orderDetailModal、modalHistory                              | ✅   |
| `core.js`        | showAdminToast                                              | ✅   |
