# 預約/租借管理模組 — 任務清單

> 賣家後台新增「預約/租借管理」模組的完整開發任務，按順序執行。

---

## 涉及檔案總覽

| 動作 | 檔案 |
|------|------|
| 新增 | `admin/data/bookings.json` |
| 新增 | `admin/partials/bookings.html` |
| 新增 | `admin/js/bookings.js` |
| 修改 | `admin/data/customers.json` |
| 修改 | `admin/dashboard.html` |
| 修改 | `admin/js/core.js` |
| 修改 | `admin/js/customers.js` |

---

## Task 1：建立 `admin/data/bookings.json`

建立 10 筆 Mock 預約資料，每筆欄位結構如下：

```json
{
  "id": "BK-0001",
  "customer_id": "U003",
  "submitted_at": "2026-05-20 09:15:00",
  "payment_status": "paid",
  "status": "completed",
  "equipment_returned": true,
  "booking_info": {
    "campground_id": "C001",
    "campground_name": "雲海仙境露營區",
    "region": "北部",
    "check_in": "2026-05-25",
    "check_out": "2026-05-27",
    "total_days": 2,
    "weekday_count": 2,
    "holiday_count": 0,
    "guest_count": 4
  },
  "selected_zones": [
    { "zone_id": "Z001", "zone_type": "草皮區", "quantity": 1, "subtotal": 2000 }
  ],
  "selected_rentals": [
    { "equipment_id": "E001", "name": "極限防水黑膠帳篷", "quantity": 1, "subtotal": 900 }
  ],
  "summary": {
    "zone_total": 2000,
    "rental_total": 900,
    "applied_discount": 100,
    "final_amount": 2800
  },
  "history": [
    { "time": "2026-05-20 09:15:00", "action": "預約單已送出" },
    { "time": "2026-05-20 09:15:00", "action": "已付款" },
    { "time": "2026-05-20 14:00:00", "action": "已確認預約" },
    { "time": "2026-05-27 12:00:00", "action": "已完成" }
  ]
}
```

10 筆資料分佈（涵蓋所有狀態與付款組合）：

| 單號 | 顧客 | 營區 | 狀態 | 付款狀態 | 有租借 |
|------|------|------|------|---------|--------|
| BK-0001 | U003 張志偉 | C001 雲海仙境 | completed | paid | 有 |
| BK-0002 | U001 王小明 | C002 溪谷秘境 | cancelled | refunded | 無 |
| BK-0003 | U006 陳大華 | C003 太平山 | confirmed | paid | 有 |
| BK-0004 | U008 吳建宏 | C004 南台灣星空 | pending | paid | 無 |
| BK-0005 | U005 李建明 | C005 花蓮海岸 | confirmed | paid | 有 |
| BK-0006 | U010 許志明 | C006 阿里山 | pending | paid | 有 |
| BK-0007 | U002 林美惠 | C007 宜蘭礁溪 | completed | paid | 無 |
| BK-0008 | U007 蔡佳玲 | C008 台中武陵 | cancelled | refunded | 有 |
| BK-0009 | U009 劉雅婷 | C002 溪谷秘境 | confirmed | paid | 有 |
| BK-0010 | U004 黃淑芬 | C001 雲海仙境 | pending | paid | 無 |

**付款狀態規則（v1.1）**：
- 僅 `paid`（已付款）、`refunded`（已退款）兩種
- 顧客結帳即付款 → 進後台預設 `paid`
- 管理員取消（pending / confirmed）→ 自動 `refunded`，history 加「已退款」
- 確認預約只改訂單狀態，不變付款狀態

注意：
- `selected_rentals` 為空陣列 `[]` 代表無租借
- 每筆 history 在「預約單已送出」後應有「已付款」
- 已取消（cancelled）的筆數，history 含「已取消（原因：xxx）」與「已退款」- `equipment_returned` 欄位：completed 且有租借為 `true`，其餘預設 `false`

---

## Task 2：修改 `admin/data/customers.json`

在現有 6 筆（U001～U006）後新增 4 筆，格式與現有完全一致：

```json
{
  "id": "U007",
  "avatar": "../assets/images/avatar-01.jpg",
  "name": "蔡佳玲",
  "phone": "0978-901-234",
  "email": "tsai@example.com",
  "totalSpent": 0,
  "tier": "一般",
  "points": 0,
  "coupons": 0,
  "tags": ["新會員"],
  "orders": []
}
```

| ID | 姓名 | 等級 | 標籤 |
|----|------|------|------|
| U007 | 蔡佳玲 | 一般 | 新會員 |
| U008 | 吳建宏 | VIP | VIP、高消費 |
| U009 | 劉雅婷 | 一般 | 新會員 |
| U010 | 許志明 | SVIP | SVIP、高消費 |

---

## Task 3：建立 `admin/partials/bookings.html`

結構參考 `admin/partials/orders.html`，差異如下：

- 卡片標題：`<i class="fas fa-calendar-check">` + 預約列表
- 雙篩選 Select（並排，AND 邏輯）：
  - `#bookingStatusFilter`：全部 / 待確認 / 已確認 / 已完成 / 已取消
  - `#paymentStatusFilter`：全部 / 已付款 / 已退款
- table `id="bookingsTable"`，thead 欄位（共 9 欄）：
  - 預約單號 / 下單日期 / 顧客姓名 / 入住・退營 / 營區 / 含租借 / 付款狀態 / 訂單狀態 / 操作
- tbody `id="bookingsTableBody"`，初始顯示 Loading spinner，`colspan="9"`

---

## Task 4：建立 `admin/js/bookings.js`

使用 jQuery Event Namespace `.bookings` 防止重複事件堆疊，參考 `orders.js` 撰寫風格。

主要函式：

### `window.initBookings()`
- `$(document).off('.bookings')` 移除舊事件
- 若 `window.bookingsCache` 有資料直接渲染，否則 `$.getJSON('data/bookings.json', ...)`
- 儲存至 `window.bookingsCache`

### `renderBookingsTable(bookings)`
Badge 對照表：
```js
// 付款狀態（2 種，共用 getPayBadgeHtml）
paid:     綠色「已付款」
refunded: 灰色「已退款」

// 訂單狀態
var statusBadgeMap = { pending, confirmed, completed, cancelled ... };
```
- 每列 `<tr>` 加 `data-booking-status` 與 `data-payment-status`
- 渲染完成後呼叫 `applyBookingFilters()`

### `applyBookingFilters()`
- 讀取 `#bookingStatusFilter`、`#paymentStatusFilter`
- AND 邏輯：列需同時符合兩個條件（值為 `all` 時跳過）
欄位渲染細節：
- 預約單號：`.booking-id-link`，`data-booking-id`，底線點擊樣式
- 下單日期：`submitted_at` 拆分日期 + 小字時間（同 orders.js 格式）
- 顧客姓名：`.booking-customer-link`，`data-customer-id`，底線超連結樣式
- 入住・退營：`check_in ～ check_out`（小字顯示幾晚）
- 營區：`campground_name` + `region` 灰色小 badge
- 含租借：`selected_rentals.length > 0` → 綠色 `有租借` badge，否則灰色 `無`
- 操作按鈕邏輯：
  - `pending`：`[確認預約]`（`.btn-confirm-booking`） + `[取消]`（`.btn-cancel-booking`）
  - `confirmed`：`[取消]`（`.btn-cancel-booking`）
  - `completed` / `cancelled`：無按鈕

### `showBookingModal(booking)`
填入 `#bookingDetailModal` 並開啟：
- 訂購人：姓名 / 電話 / Email / **付款狀態**（`#bkModalPaymentStatus`）
- 住宿明細：營區・地區・入退日・幾晚（平日/假日）・人數・各營位列表
- 裝備租借：逐筆列出（無租借顯示「本次未選擇租借裝備」）
- 費用明細：住宿費 / 租借費 / 折扣（`applied_discount > 0` 才顯示）/ 總計
- 裝備歸還 Checkbox（`#equipmentReturnSection`）：僅 `status === 'confirmed'` 且有租借時顯示（`d-none` 切換）
- 狀態紀錄時間軸 `#bkModalHistory`
- `#btnCompleteBooking`（footer）：僅 `status === 'confirmed'` 時顯示

### 事件綁定（`.bookings` namespace）
| 事件 | 選擇器 | 行為 |
|------|--------|------|
| change | `#bookingStatusFilter, #paymentStatusFilter` | 呼叫 applyBookingFilters（AND） |
| click | `.booking-id-link` | 呼叫 showBookingModal |
| click | `.btn-confirm-booking` | 更新 status → confirmed（payment 維持 paid）、push history、Toast |
| click | `.btn-cancel-booking` | 暫存 booking id、開啟 #bookingCancelModal |
| click | `#confirmCancelBtn` | status → cancelled、payment_status → refunded、history 含原因 + 已退款、更新雙 badge |
| click | `.booking-customer-link` | 設定 `window.pendingCustomerId`、觸發 `.sidebar-link[data-section="customers"]` click |
| click | `#btnCompleteBooking` | 更新 status → completed、`equipment_returned = true`、push history、更新畫面、Toast、關閉 Modal |

---

## Task 5：修改 `admin/dashboard.html`

### 5-a. Sidebar 桌面版（`<aside id="adminSidebar">`）

在 `<a data-section="reviews">` 之後插入：

```html
<hr style="border-color: rgba(255,255,255,0.15); margin: 8px 16px;">
<a href="#" class="sidebar-link"
   data-section="bookings" data-title="預約/租借管理">
  <i class="fas fa-calendar-check"></i>
  <span>預約/租借管理</span>
</a>
```

### 5-b. Sidebar 手機版 Offcanvas（`<div id="mobileSidebar">`）

同上，在手機版 `<a data-section="reviews">` 之後插入相同 HTML。

### 5-c. 新增 Modal：`#bookingDetailModal`

放在 `#orderDetailModal` 結束 `</div>` 之後，`modal-lg modal-dialog-scrollable`：

```
modal-header：預約明細 — <span id="bkModalId"></span>  [status badge id="bkModalStatus"]
modal-body：
  訂購人資訊（id：bkModalName / bkModalPhone / bkModalEmail / bkModalPaymentStatus）
  住宿明細（id：bkModalStayDetail）
  裝備租借明細（id：bkModalRentalDetail）
  費用明細（id：bkModalCostBreakdown）
  裝備歸還區塊（id="equipmentReturnSection" class="d-none"）
    <div class="form-check">
      <input type="checkbox" id="equipmentReturnedCheck">
      <label>確認裝備已全數歸還</label>
    </div>
  狀態紀錄時間軸（id：bkModalHistory）
modal-footer：
  <button data-bs-dismiss="modal">關閉</button>
  <button id="btnCompleteBooking" class="d-none">標記已完成</button>
```

### 5-d. 新增 Modal：`#bookingCancelModal`

放在 `#bookingDetailModal` 之後，`modal-sm`：

```
modal-header：取消預約確認
modal-body：
  <p>此操作無法復原，請填寫取消原因（選填）：</p>
  <textarea id="cancelReasonInput" rows="3"
    placeholder="例：顧客臨時取消、天氣因素..."></textarea>
modal-footer：
  <button data-bs-dismiss="modal">不取消</button>
  <button id="confirmCancelBtn">確認取消</button>
```

### 5-e. 新增 JS 引用（在 `</body>` 之前）

```html
<script src="js/bookings.js"></script>
```

---

## Task 6：修改 `admin/js/core.js`

在 `loadSection()` 的 `initFunctions` 字典新增一行：

```js
bookings: window.initBookings,
```

同時，`@param` 的可選值說明也更新加入 `'bookings'`。

---

## Task 7：修改 `admin/js/customers.js`

在 `renderCustomersAccordion()` 最末行 `$('#customersAccordion').html(html)` **之後**新增：

```js
// 若從預約管理顧客連結跳轉，自動展開並滾動至目標顧客
if (window.pendingCustomerId) {
  var targetId = window.pendingCustomerId;
  window.pendingCustomerId = null; // 用完即清，防止重複觸發
  var $target = $('#collapse-' + targetId);
  if ($target.length) {
    new bootstrap.Collapse($target[0], { toggle: false }).show();
    setTimeout(function () {
      $target[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
}
```

---

## Task 8：AI 驗證

完成所有實作後，逐一進行以下驗證。

### 8-a. 無亂碼 / 語法檢查

- 確認所有新增與修改的 `.json`、`.html`、`.js` 檔案無亂碼
- JSON：括號對稱、逗號位置正確、無多餘尾逗號
- JS：無 unclosed function、無缺漏分號、無 undefined 變數引用
- HTML：標籤正確閉合、id 無重複

### 8-b. 功能驗證清單

| 驗證項目 | 預期結果 |
|---------|---------|
| Sidebar 顯示 | 登入後台後，桌面版與 Offcanvas 均出現「預約/租借管理」連結，位於分隔線下方 |
| 標題更新 | 點擊後 Topbar 顯示「預約/租借管理」|
| 表格載入 | 10 筆，付款欄僅「已付款」或「已退款」 |
| 付款篩選 | 已付款 8 筆、已退款 2 筆（BK-0002、BK-0008） |
| 雙篩選 AND | 例：已確認 + 已付款 → BK-0003/0005/0009 |
| 明細 Modal | 訂購人區顯示付款 badge；時間軸含「已付款」 |
| 取消 | status→已取消、payment→已退款、history 含退款 |
| 裝備歸還區塊 | 僅 confirmed + 有租借 → 顯示 Checkbox；其他情況隱藏 |
| 完成按鈕 | 僅 confirmed → Modal footer 顯示「標記已完成」；其他隱藏 |
| 確認預約 | 點擊後：狀態 badge → 已確認、確認按鈕消失、Toast 出現 |
| 取消（待確認）| 取消 Modal 開啟、填原因確認後：badge → 已取消、操作欄清空、history 含原因 |
| 取消（已確認）| 同上 |
| 標記已完成 | 點擊後：badge → 已完成、Modal 關閉、Toast 出現 |
| 顧客名稱連結 | 點擊後切換至客戶管理，目標顧客 Accordion 自動展開並滾動至該位置 |
| 重複切換 | 切換其他 section 再切回，表格重新渲染正常，無事件重複堆疊 |

### 8-c. 跨頁面影響確認

| 確認項目 | 預期結果 |
|---------|---------|
| 分析報表 / 訂單管理 / 庫存異動 / 商品管理 / 折扣管理 / 評論管理 | 各自功能正常，未受影響 |
| 客戶管理（一般進入） | 無 `pendingCustomerId` 時，第一筆預設展開行為不變 |
| `#orderDetailModal` | 與 `#bookingDetailModal` id 完全隔離，互不干擾 |
| Sidebar active 狀態 | 所有 section 之間切換，active class 正確更新 |
| core.js `initFunctions` | 新增 `bookings` 後，其餘模組初始化呼叫不受影響 |
