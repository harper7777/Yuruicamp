# 🏕️ Yuruicamp 預約系統 — Header & Footer 前端規格書 (SDD)

**文件版本：** v1.0  
**建立日期：** 2026-06-12  
**負責模組：** `booking/` 預約子系統  
**狀態：** ✅ 規格確認，待實作

---

## 📌 開發最高原則 (Core Principles)

| 原則 | 說明 |
|------|------|
| **獨立元件** | 必須為預約系統獨立建立 `booking-header.html` 與 `booking-footer.html`，絕對禁止使用 jQuery `.load()` 去抓取 **買家端現有的** `components/header.html` / `components/footer.html` |
| **視覺差異化** | 買家端（`#f6fbf6` 淺綠白背景）vs 預約端（`#F2F0EB` 淺大地色），讓顧客一眼辨識出已切換頻道 |
| **響應式設計** | 手機（≤768px）與桌機皆需完美呈現，手機版需有 Offcanvas 側邊選單 |
| **能跑優先** | 先讓功能正常，再優化視覺細節 |

---

## 📁 檔案結構規劃

```
booking/
├── components/                        ← 【新建資料夾】預約系統專屬元件
│   ├── booking-header.html            ← 【新建】預約系統 Header 元件
│   └── booking-footer.html            ← 【新建】預約系統 Footer 元件
│
├── rental-guide.html                  ← 【新建】租借體驗說明頁
├── booking-faq.html                   ← 【新建】預約系統 FAQ 頁
│
├── camp-search.html                   ← 【更新】替換 header/footer 載入來源
├── camp-detail.html                   ← 【更新】替換 header/footer 載入來源
├── camp-rental.html                   ← 【更新】替換 header/footer 載入來源
├── booking-cart.html                  ← 【更新】替換 header/footer 載入來源
│
├── css/
│   └── booking.css                    ← 【更新】新增 booking-header / booking-footer 樣式區塊
└── js/
    └── booking-header.js              ← 【新建】Badge 動態更新、登入狀態判斷邏輯
```

---

## 🎨 色彩規範

### 買家端 vs 預約端對照

| 區域 | 買家端（現有商城） | 預約端（本次新建） |
|------|-----------------|-----------------|
| Header 背景 | `#f6fbf6` 淺綠白 | `#F2F0EB` 淺大地米色 |
| Footer 背景 | `#244d4d` 深青綠 | 沿用 `#244d4d`（保持品牌一致） |
| 主色 / 按鈕 | `#244d4d` 深青綠 | `#244d4d`（相同） |
| Logo 主字 | `#244d4d` | `#244d4d` |
| Logo 副標題 | 無 | `#7a8a82`（低彩度、縮小字體，約 `0.75rem`） |

### 視覺辨識邏輯

> 顧客從買家端點擊「🏕️ 預約」進入預約系統時，Header 背景從**淺綠白**切換為**淺大地米色**，讓人直覺感受到「已切換至不同服務頻道」，但整體色系仍保持極簡乾淨，不突兀。

---

## 1. 預約專屬 Header — `booking/components/booking-header.html`

### 1.1 整體佈局

```
[ 左：品牌識別區 ]  |  [ 中：核心導覽列 ]  |  [ 右：轉換與個人化區 ]
```

與現有商城一致的三欄水平排列，手機版折疊成 Offcanvas。

---

### 1.2 左側：品牌識別區

| 項目 | 規格 |
|------|------|
| **主字** | `Yuruicamp` |
| **副標題** | `\| 營地預約`（緊接在主字右側） |
| **副標題樣式** | 字體縮小（`0.75rem`）、低彩度（`color: #7a8a82`）、字重正常 |
| **點擊行為** | 導向 `./camp-search.html`（預約系統首頁）|
| **HTML 結構** | `<a href="./camp-search.html">Yuruicamp <span class="brand-sub">\| 營地預約</span></a>` |

---

### 1.3 中間：核心導覽列

三個純文字超連結，取代買家端的「商品 / 部落格 / 分店」：

| 順序 | 文字 | 連結目標 | 備註 |
|------|------|---------|------|
| 1 | 探索營區 | `./camp-search.html` | 預約系統首頁 |
| 2 | 租借體驗說明 | `./rental-guide.html` | 待新建頁面（見第 4 節）|
| 3 | 常見問題 | `./booking-faq.html` | 待新建頁面（見第 4 節）|

**Active 狀態：** 目前頁面對應的連結加上 `class="active"` 樣式（底線或加深色）。

---

### 1.4 右側：轉換與個人化區

#### ① 🔄 系統切換鈕（強烈視覺引導）

| 項目 | 規格 |
|------|------|
| **文字** | `🛍️ 前往裝備商城` |
| **樣式** | 實體色塊按鈕（`btn btn--primary`），使用主色 `#244d4d` |
| **點擊行為** | `window.location.href = '../pages/home.html'` |
| **桌機顯示** | 顯示完整按鈕文字 |
| **手機顯示** | 縮短為圖示 + 短文字 `🛍️ 商城`，或收入 Offcanvas |

#### ② 🎒 預約背包（Booking Cart）

| 項目 | 規格 |
|------|------|
| **Icon** | Bootstrap Icons `bi-bag-heart` 或 `bi-tent`（帳篷/背包感）|
| **點擊行為** | 導向 `./booking-cart.html` |
| **動態 Badge** | 圓點數字，右上角浮動，紅色/橘色背景 |

**Badge 計算邏輯（`booking-header.js` 實作）：**

```javascript
// LocalStorage key: 'bookingCart'（整個預約物件）
function updateBookingBadge() {
  const stored = localStorage.getItem('bookingCart');
  const badge  = document.getElementById('bookingBadge');

  if (!stored) {
    badge.style.display = 'none';
    return;
  }

  const cart = JSON.parse(stored);

  // 計算：已選營位數量 + 已選租借裝備總數量
  // selected_zones 固定為 1 個，quantity 固定為 1
  const zoneCount   = (cart.selected_zones   || []).reduce((s, z) => s + z.quantity,   0);
  // selected_rentals 在進入 camp-rental.html 後才會有值
  const rentalCount = (cart.selected_rentals || []).reduce((s, r) => s + r.quantity, 0);
  const total = zoneCount + rentalCount;

  if (total > 0) {
    badge.textContent  = total > 9 ? '9+' : total;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

// 頁面載入時更新一次，並監聽 LocalStorage 變化（跨頁籤同步）
updateBookingBadge();
window.addEventListener('storage', updateBookingBadge);
```

**LocalStorage 資料結構備忘：**

```json
{
  "booking_info": { "campground_id": "...", "campground_name": "...", ... },
  "selected_zones":   [{ "zone_id": "Z1", "quantity": 1, "subtotal": 3000 }],
  "selected_rentals": [{ "equipment_id": "E1", "quantity": 2, "subtotal": 800 }],
  "summary": { "zone_total": 3000, "rental_total": 800, "final_amount": 3800 }
}
```

#### ③ 👤 會員登入 / 狀態

| 狀態 | 行為 | 樣式 |
|------|------|------|
| **未登入** | 點擊 → 彈出 `loginModal`（與買家端共用相同 Modal HTML 結構）| 深色實體按鈕，文字「登入」 |
| **已登入** | 顯示用戶頭像 + 姓名；點擊設定齒輪圖示 → 導向 `member-center.html?tab=camping`（預設開啟「我的露營行程」頁籤）| 頭像圓圖 + 用戶名 |

> **注意：** `?tab=camping` 參數為後端開發預留，前端先加上，後端對接時依此參數跳頁籤。

---

### 1.5 手機版 Offcanvas 選單

展開後顯示以下連結（由上至下）：

```
1. 探索營區         → ./camp-search.html
2. 租借體驗說明     → ./rental-guide.html
3. 常見問題         → ./booking-faq.html
────────────────────（分隔線）
4. 🛍️ 前往裝備商城  → ../pages/home.html
5. 🎒 預約背包       → ./booking-cart.html（附 Badge）
```

---

### 1.6 載入機制

各 booking 頁面使用 **jQuery `.load()`** 載入，路徑為專屬的預約元件（非買家端元件）：

```html
<!-- 各 booking 頁面的 <div id="booking-header"></div> 下方 -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script>
  $(function () {
    // 載入預約系統專屬 Header（非買家端的 ../components/header.html）
    $('#booking-header').load('./components/booking-header.html', function () {
      // Header 載入完成後，初始化 Badge 與登入狀態
      // （booking-header.js 由 booking-header.html 內部引入）
    });
    $('#booking-footer').load('./components/booking-footer.html');
  });
</script>
```

---

## 2. 預約專屬 Footer — `booking/components/booking-footer.html`

完全沿用買家端「4 欄式排版 + 底部宣告區塊」，僅替換文字與連結。

### 2.1 四欄式資訊區塊

#### 欄位一：Yuruicamp（品牌宣告）

| 項目 | 內容 |
|------|------|
| 標語行 1 | 探索戶外，輕鬆出發 |
| 標語行 2 | 營地預約與裝備租借體驗，直接為您送達營區 |

#### 欄位二：預約與租借指南（取代買家端「快速連結」）

| 連結文字 | 目標 |
|---------|------|
| 探索營區 | `./camp-search.html` |
| 預約與付款方式 | `./booking-faq.html#payment`（FAQ 錨點）|
| 取消與退款政策 ⚠️ | `./booking-faq.html#cancellation`（重點必備）|
| 裝備損壞與押金說明 ⚠️ | `./booking-faq.html#damage`（重點必備）|

#### 欄位三：聯絡方式

**直接沿用買家端現有設定（完整照搬）：**

```
電話：0800-123-456
信箱：support@yuruicamp.com
地址：台北市信義區信義路五段 100 號
營業時間：週一至週日 10:00–20:00
```

#### 欄位四：關注我們

**直接沿用買家端現有設定（完整照搬）：**

```
Facebook  → https://facebook.com
Instagram → https://instagram.com
LINE      → #（待填入）
```

---

### 2.2 底部版權宣告區塊

**完全沿用現有內容，無需修改：**

| 項目 | 內容 |
|------|------|
| 版權文字 | `© 2025 Yuruicamp 露營選物品牌. 版權所有。` |
| 政策連結 | 隱私政策 \| 使用條款 \| 退換貨政策 |
| 付款圖示 | 信用卡、📱 LINE Pay、📦 貨到付款 |

---

## 3. 受影響頁面清單（需同步更新）

以下 4 個現有 booking 頁面，目前仍使用 jQuery 載入**買家端** `../components/header.html`，開發時需更新為載入**預約端** `./components/booking-header.html`：

| 頁面檔案 | 目前載入（錯誤）| 更新後（正確）|
|---------|--------------|------------|
| `booking/camp-search.html` | `$('#header').load('../components/header.html')` | `$('#booking-header').load('./components/booking-header.html')` |
| `booking/camp-detail.html` | `$('#header').load('../components/header.html')` | `$('#booking-header').load('./components/booking-header.html')` |
| `booking/camp-rental.html` | `$('#header').load('../components/header.html')` | `$('#booking-header').load('./components/booking-header.html')` |
| `booking/booking-cart.html` | `$('#header').load('../components/header.html')` | `$('#booking-header').load('./components/booking-header.html')` |

同步更新各頁面的 `<div id="header">` → `<div id="booking-header">`，`<div id="footer">` → `<div id="booking-footer">`。

---

## 4. 新增頁面規格（框架）

### 4.1 `booking/rental-guide.html` — 租借體驗說明頁

**定位：** Try-Before-You-Buy 圖文說明頁，解釋裝備租借流程。

**建議區塊（由上至下）：**

```
1. Hero Banner：標題「露營不用自備裝備」+ 副標語
2. 流程說明：Step 1 選營區 → Step 2 選裝備 → Step 3 送達營地 → Step 4 歸還
3. 常見裝備分類展示（帳篷、睡袋、炊具、照明）
4. 押金與損壞說明（連結至 booking-faq.html#damage）
5. CTA：立即預約 → camp-search.html
```

### 4.2 `booking/booking-faq.html` — 預約系統 FAQ 頁

**定位：** 預約與租借的專屬常見問題頁，有別於買家端的 `pages/faq.html`。

**建議問答區塊（含錨點 ID）：**

```
#payment     — 預約與付款方式
#cancellation — 取消與退款政策（必備）
#damage      — 裝備損壞與押金說明（必備）
#checkin     — 入住與退房規則
#delivery    — 裝備送達與取回方式
```

---

## 5. CSS 新增區塊規劃（`booking/css/booking.css`）

在現有 `booking.css` 末尾新增以下區塊：

```css
/* =====================================================
   Booking Header（預約系統專屬）
   ===================================================== */

.booking-header { ... }           /* 背景 #F2F0EB，與買家端做視覺區分 */
.booking-header .navbar { ... }
.booking-header .brand-sub { ... } /* Logo 副標題，縮小低彩度 */
.booking-header .booking-cart-btn { ... } /* 預約背包按鈕 */
.booking-badge { ... }             /* Badge 圓點，絕對定位右上角 */
.booking-header .switch-btn { ... } /* 前往裝備商城按鈕 */

/* =====================================================
   Booking Footer（預約系統專屬）
   ===================================================== */

.booking-footer { ... }            /* 沿用買家端 footer 樣式，確認路徑正確 */
```

---

## 6. JS 新增檔案規劃（`booking/js/booking-header.js`）

**功能列表：**

| 功能 | 說明 |
|------|------|
| `updateBookingBadge()` | 讀取 `localStorage.bookingCart`，計算並更新 Badge 數字 |
| 登入狀態判斷 | 讀取登入狀態（`localStorage.userToken` 或 `sessionStorage`），切換「登入按鈕 vs 用戶頭像」|
| Offcanvas 開關 | 手機版漢堡選單展開/收起邏輯 |
| `storage` 事件監聽 | 跨頁面同步 Badge（用戶在其他頁面更改購物車時即時更新）|

> **注意：** `booking-header.js` 需在 `booking-header.html` 元件內部用 `<script>` 引入，確保 Header 載入後自動初始化。

---

## 7. 開發順序建議

```
Step 1：建立 booking/components/ 資料夾
Step 2：建立 booking-header.html（含 Offcanvas HTML 結構）
Step 3：建立 booking-header.js（Badge + 登入狀態）
Step 4：在 booking.css 新增 Header 樣式
Step 5：建立 booking-footer.html
Step 6：在 booking.css 新增 Footer 樣式
Step 7：更新 4 個受影響頁面（camp-search / camp-detail / camp-rental / booking-cart）
Step 8：新建 rental-guide.html（框架 + 基本內容）
Step 9：新建 booking-faq.html（框架 + 基本問答）
Step 10：全頁測試（桌機 + 手機 RWD）
```

---

## 8. 驗收標準 (Acceptance Criteria)

- [ ] Header 背景色為 `#F2F0EB`，視覺上有別於買家端 `#f6fbf6`
- [ ] Logo 點擊後正確導向 `camp-search.html`
- [ ] 三個導覽連結皆可正常跳頁
- [ ] 「前往裝備商城」按鈕正確導向 `../pages/home.html`
- [ ] Badge 能正確讀取 `bookingCart` 並顯示數量
- [ ] 未選購時 Badge 隱藏（不顯示 0）
- [ ] 未登入 → 點「登入」彈 Modal；已登入 → 點設定圖示導向 `member-center.html?tab=camping`
- [ ] 手機版 Offcanvas 5 個連結全部正常
- [ ] 4 個現有 booking 頁面皆已更換載入來源
- [ ] Footer 4 欄資訊正確，版權區塊、付款圖示顯示正常
- [ ] RWD：手機版（≤768px）與桌機版皆正常排版
