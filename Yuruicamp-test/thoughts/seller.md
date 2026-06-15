# 專案前端設計規格書 (Front-End SDD) - 賣家管理系統

- **專案名稱：** 戶外露營用品電商平台 MVP (Seller Dashboard)
- **技術棧 (Tech Stack)：** HTML5, CSS3, JavaScript (ES6+), jQuery, Bootstrap 5, Chart.js (選用)
- **開發目標：** 產出無後端串接之全靜態前端切版，保留api接口，模擬高效率的後台管理介面，著重數據視覺化、表格行內編輯 (Inline Edit) 與狀態切換的即時互動體驗。

---

# 0. 全域規範與佈局 (Admin Layout)

## 0-1. 後台專屬雙欄佈局 (Dashboard Layout)

- **左側邊欄 (Sidebar)**
  - **UI 樣式：** 參考color.md，固定於左側 (position-fixed, vh-100)。
  - **內容：** 品牌 Logo、導覽選單（分析報表、訂單、商品、客戶、折扣、評論），選中項目加上 active 狀態（背景反白或加上左側亮色邊框）。
- **上方頂部列 (Topbar)**
  - **UI 樣式：** 參考color.md。
  - **內容：** 漢堡選單 (navbar-toggler)、管理員頭像 (rounded-circle)、快速通知小鈴鐺 (badge 標示未讀數量)。
- **右側內容區 (Main Content)**
  - **UI 樣式：** 淺灰色背景 (bg-light)，內部各區塊資料以 Bootstrap 卡片 (card, shadow-sm) 呈現，產生凸出的視覺層次。
- **響應式與互動 (RWD & jQuery)**
  - 手機版預設隱藏左側邊欄。
  - 點擊 Topbar 的漢堡選單時，觸發 Bootstrap offcanvas-start 行為，側邊欄由左側滑出覆蓋畫面。

---

# 1. 分析報表 (Analytics Dashboard)

## 1-1. 營運總覽卡片 (Key Metrics)

- **佈局：** 頂部使用 Bootstrap 網格 (row > 3 個 col-md-4) 放置 3 張統計卡片。
- **資料維度：** 「今日營業額」、「待出貨訂單數」、「低庫存商品數」。
- **視覺設計：** 核心數字使用大字級 (fs-2, fw-bold)。搭配趨勢小箭頭，例如：「↑ 12% 較上週」或「↓ 3%」。

## 1-2. 視覺化圖表區 (Data Visualization)

- **實作方式：** 頁面引入 Chart.js CDN，使用 `<canvas>` 渲染圖表，營造專業數據感。
- **圖表一 (折線圖 Line Chart)：** 呈現「近七日銷售額趨勢」。X 軸為日期，Y 軸為金額。
- **圖表二 (圓餅圖 Pie Chart/Doughnut Chart)：** 呈現「商品營收」。
- **(備案)** 也可以用「各產品營收」的水平長條圖。

---

# 2. 訂單管理 (Order Management)

## 2-1. 訂單列表 (Order Table)

- **UI 結構：** 使用 Bootstrap table, table-hover, table-responsive。
- **欄位設計：**
  - 訂單編號。
  - 下單時間（利用 `<small class="text-muted">` 呈現具體時分秒）。
  - 買家姓名。
  - 總金額。
  - 付款狀態（Bootstrap badge：bg-success 已付款 / bg-warning 未付款）。
  - 物流狀態（Bootstrap badge：待出貨/已出貨）。
  - 操作區（查看按鈕）。
- **篩選功能：** 列表上方配置 `<select class="form-select">`，包含「待處理、待出貨、已出貨、已完成、退貨」。

## 2-2. 訂單操作互動 (jQuery)

- **明細展開：** 點擊「查看」按鈕，觸發 Bootstrap modal 顯示完整商品清單與收件人地址。
- **狀態切換 (一鍵出貨)：** 針對「待出貨」的列，提供「標記為已出貨」按鈕。
  - 綁定 jQuery 點擊事件：使用 `$(this).closest('tr')` 找到該列，尋找物流 Badge 元素。
  - 將 Badge 的 Class 從 bg-warning 改為 bg-success，文字更改為「已出貨」。
  - 觸發全域 Toast 提示：「訂單 #XXXXX 狀態已更新為出貨」。

---

# 3. 商品與庫存管理 (Product & Inventory)

## 3-1. 商品列表與庫存快調 (Inventory Table)

- **欄位設計：** 圖片縮圖群組、商品名稱、分類標籤、規格、售價、目前庫存量、狀態（上架/下架）。
- **庫存預警警示：** 針對庫存量低於 5 的商品列，透過 CSS 賦予該 `<tr>` table-danger class，呈現淡紅色背景，模擬高周轉率時期的供應鏈預警。
- **行內編輯 (Inline Edit) 模擬：**
  - 庫存量欄位使用 Bootstrap input-group (輸入框 + 儲存小按鈕)。
  - jQuery 事件：修改 `<input>` 數字後點擊儲存，按鈕內 Icon 短暫切換為綠色打勾 (text-success)，0.5 秒後恢復，並跳出 Toast「庫存更新成功」，全程不重整頁面。

## 3-2. 商品狀態切換

- **UI 結構：** 使用 Bootstrap 切換開關 (form-check form-switch)。
- **jQuery 互動：** 監聽 change 事件。開關開啟時，旁邊的 `<label>` 文字顯示為藍色「上架中」；關閉時，更改文字為灰色「已下架」。

---

# 4. 客戶管理 (Customer Management)

## 4-1. 會員名單

- **UI 結構：** 手風琴列表 (accordion) 或可展開表格。
- **欄位設計：**
  - 基本資料：頭像、姓名、聯絡資料 (手機/Email)。
  - 營運數據：累積消費金額。
  - 標籤 (Tags)：使用 Badge 標示屬性（如 bg-warning 標示「VIP」、bg-danger 標示「高退貨率」）。
- **行內管理 (可編輯欄位)：**
  - 會員等級、點數、折扣券數量旁邊放置一個小鉛筆 Icon。
  - 點擊 Icon 觸發 JS 將純文字替換為 `<input class="form-control form-control-sm">`，按下 Enter 後存檔恢復為純文字。
- **歷史紀錄展開：** 點擊整列可向下展開 (collapse) 顯示該會員過往的購買紀錄清單。

---

# 5. 折扣管理 (Discount Management)

## 5-1. 折扣券一鍵生成 (Coupon Generator)

- **UI 結構：** 畫面上方配置具備高亮背景 (bg-primary bg-opacity-10) 的操作區，包含：「折扣額度 Input」、「發行數量 Input」與大顆的「<i class="bi bi-lightning"></i> 生成折扣券」按鈕。
- **動態生成邏輯 (jQuery 亮點)：**
  - 點擊按鈕後，讀取「發行數量」與「額度」。
  - 寫一隻 JS 函式產生指定長度的隨機英數大寫字串（例如：使用 Math.random().toString(36).substring(2, 10).toUpperCase() 產出類似 YURUI6O5 的字串）。
  - 利用 jQuery 字串拼接 `<tr>...</tr>` HTML，透過 .prependTo('tbody') 或 .hide().prependTo('tbody').fadeIn() 加到下方的「現有折扣券列表」最上方。
  - 觸發 Toast：「成功生成 N 組折扣碼」。

---

# 6. 評論區 (Review Management)

## 6-1. 賣場評論列表

- **視覺排版：** 捨棄傳統表格，改用 Bootstrap 卡片列表 (list-group 或多張 card 排列)。
- **內容：** 買家頭像、星級 (FontAwesome 實心/空心星星)、買家留言、實拍附圖縮圖、對應商品名稱、留言時間。
- **未回覆醒目提示：** 針對店家尚未回覆的評論卡片，加上 border-start border-danger border-5 class，產生左側顯眼的紅色粗邊框，提醒客服處理。

## 6-2. 賣家回覆功能 (Reply Interaction)

- **jQuery 互動實作：**
  - 點擊卡片內的「回覆買家」按鈕。
  - 在該卡片下方使用 .slideDown() 動態展開一個包含 `<textarea>` 與「送出回覆」按鈕的區塊。
  - 輸入文字並點擊送出後：
    - 隱藏 textarea 區塊。
    - 抓取 textarea 的值，動態 append 一塊淺灰色背景 (bg-light, rounded) 的區塊在買家留言下方，文字標示：「店家回覆：(輸入的文字)」。
    - 移除該卡片外層的紅色粗邊框 (.removeClass('border-danger'))，標記為已處理狀態。
