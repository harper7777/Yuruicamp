# Yuruicamp 露營選物品牌網站 - 完整實現規劃

## 執行摘要 (TL;DR)

**目標**：建立可擴展的前端框架搭建，使用 HTML/CSS/JavaScript + Bootstrap + jQuery，所有頁面完整實現，數據使用 Mock (localStorage/靜態JSON)，預留 API 接入點。

**技術棧**：
- HTML5 + SCSS/CSS + Vanilla JS + jQuery + Bootstrap 5
- 靜態數據存儲 (localStorage/JSON)
- 無後端依賴（演示階段）
- Git 版本控制

**預期產物**：
- 完整的文件夾結構
- 10+ 個功能頁面
- 共用元件庫
- SCSS 變量系統
- Mock API 層

---

## 第 1 階段：基礎架構搭建 (Foundation)

### 步驟 1.1：建立項目目錄結構
依據現代前端最佳實踐組織文件：
```
Yuruicamp/
├── index.html                    # 首頁入口
├── css/
│   ├── variables.scss            # 色彩與尺度變量
│   ├── base.scss                 # Reset 和全局樣式
│   ├── components.scss           # 全局元件樣式
│   ├── layout.scss               # 版面佈局樣式
│   └── main.scss                 # 入口，引入上述 SCSS
├── js/
│   ├── config.js                 # 全局配置、Mock 數據
│   ├── api-mock.js               # 模擬 API 層（預留後端接入點）
│   ├── components/
│   │   ├── navbar.js             # 導航欄邏輯
│   │   ├── carousel.js           # 輪播邏輯
│   │   ├── modal.js              # Modal 邏輯
│   │   ├── cart.js               # 購物車邏輯
│   │   ├── toast.js              # Toast 提示邏輯
│   │   └── filter.js             # 商品篩選邏輯
│   ├── pages/
│   │   ├── home.js               # 首頁邏輯
│   │   ├── product-list.js       # 商品列表邏輯
│   │   ├── product-detail.js     # 商品詳情邏輯
│   │   ├── cart.js               # 購物車頁面邏輯
│   │   ├── checkout.js           # 結帳流程邏輯
│   │   ├── member-center.js      # 會員中心邏輯
│   │   ├── blog.js               # 部落格邏輯
│   │   └── branches.js           # 分店邏輯
│   └── main.js                   # 應用入口，初始化
├── assets/
│   ├── images/                   # 圖片資源（商品、Banner 等）
│   ├── icons/                    # SVG/Icon 資源
│   └── videos/                   # 影片資源（Hero Banner）
├── data/
│   ├── products.json             # 商品數據
│   ├── users.json                # 模擬用戶數據
│   ├── orders.json               # 訂單數據
│   ├── articles.json             # 文章數據
│   └── branches.json             # 分店數據
├── pages/
│   ├── home.html
│   ├── products.html
│   ├── product-detail.html
│   ├── cart.html
│   ├── checkout.html
│   ├── checkout-success.html
│   ├── member-center.html
│   ├── blog.html
│   ├── blog-detail.html
│   ├── branches.html
│   └── faq.html
├── components/                   # 可重用 HTML 片段（如需要）
│   └── navbar.html
│   └── footer.html
├── README.md
└── .gitignore
```

**關鍵設計決策**：
- SCSS 變量系統集中管理（variables.scss）
- Mock API 層使其日後易於切換真實後端
- 按頁面和元件分離 JavaScript 邏輯，避免全局污染

---

## 第 2 階段：樣式系統與全局元件 (Styling & Global Components)

### 步驟 2.1：建立 SCSS 變量系統
*相依性：步驟 1.1*

在 `css/variables.scss` 中定義：
- 色彩變量（參考已提供的 color.md）
- 字體堆棧與字體大小規模
- 間距/邊距規模
- 陰影定義
- 斷點定義（RWD）

```scss
// 色彩系統
$primary: #244d4d;           // 深青綠色 - 主色
$secondary: #779;            // 淺青灰綠 - 副色
$white: #fff;                // 白色背景
$light-bg: #f6fbf6;          // 淺綠背景
$light-gray: #f2f2f2;        // 淺灰色
$danger: #d32f2f;            // 紅色 - 警告/刪除
$success: #4caf50;           // 綠色 - 成功
$dark-hover: #316868;        // 深青綠懸停色

// 斷點
$xs: 0;
$sm: 576px;
$md: 768px;
$lg: 992px;
$xl: 1200px;
$xxl: 1400px;

// 間距規模
$spacing: 1rem;
$spacing-xs: 0.5rem;
$spacing-sm: 0.75rem;
// ... 等等
```

### 步驟 2.2：建立全局樣式 (base.scss)
*相依性：步驟 2.1*

- CSS Reset（清除默認樣式）
- 全局字體設定
- 連結、按鈕、表單的基礎樣式

### 步驟 2.3：建立可重用元件樣式 (components.scss)
*相依性：步驟 2.1、2.2*

包含：
- 導航欄樣式（桌面/手機）
- 按鈕變體（Primary、Secondary、Outline）
- 卡片樣式（商品卡、訂單卡等）
- Modal/Offcanvas 樣式
- Toast 樣式
- Badge/Tag 樣式
- 表單元件（Input、Select、Radio、Checkbox）
- 進度條樣式
- 手風琴樣式

### 步驟 2.4：全局 HTML 結構
*相依性：步驟 1.1*

建立所有頁面共同的骨架：
- 頂部導航欄（navbar.html）
- 頂部浮動 LINE 客服按鈕
- 頁腳（footer.html）
- 主容器結構

---

## 第 3 階段：全局共用元件 (Global Components)

### 步驟 3.1：導航欄 (Navbar) 實現
*相依性：步驟 2.3、2.4 完成*

**PC 版設計**：
- 左側 Logo
- 中央搜尋框（含動態下拉選單模擬 - 使用 `<datalist>` 或自製）
- 右側購物車 Icon (含 Badge 計數) + 登入/會員入口

**手機版設計**：
- Logo 左側
- 右側漢堡菜單（Hamburger Menu）
- 點擊展開 Offcanvas 側邊欄，顯示導航選項

**交互邏輯** (navbar.js)：
- 搜尋框 Focus 時展開下拉選單
- 點擊漢堡菜單展開/收合 Offcanvas
- 購物車 Badge 綁定全局購物車狀態

### 步驟 3.2：登入/註冊 Modal
*相依性：步驟 2.3*

**視覺設計**：
- 頁面中央模態窗口
- Google 登入按鈕（靜態，點擊觸發 JS 模擬登入）
- LINE 登入按鈕（靜態）
- 一個登入/註冊頁籤切換

**交互邏輯** (modal.js)：
- 點擊登入按鈕後修改全局 `window.isLoggedIn = true`
- 修改 Navbar 狀態（顯示用戶頭像取代登入按鈕）
- 登入成功後自動彈出「個人化問卷 Modal」

### 步驟 3.3：個人化問卷 Modal（Stepper）
*相依性：步驟 3.2*

**視覺設計**：
- Stepper 組件顯示進度（例：2/2 完成）
- 問題 1：偏好風格（多選 Tag）
- 問題 2：想添購的裝備（多選 Tag）
- 完成按鈕

**交互邏輯**：
- 點擊選項高亮（toggle active class）
- 完成後隱藏 Modal 並彈出成功 Toast

### 步驟 3.4：Toast 提示組件
*相依性：步驟 2.3*

可重用的 Toast 工廠函數 (toast.js)：
```javascript
showToast(message, type = 'info') // type: 'success', 'error', 'info'
```

應用場景：
- 加入購物車成功
- 資料保存成功
- 複製折扣碼成功

### 步驟 3.5：浮動按鈕 - LINE 客服
*相依性：步驟 2.3*

固定於右下角，點擊跳轉 LINE 官方帳號 URI。

---

## 第 4 階段：首頁 (Home Page) 實現

### 步驟 4.1：Hero Banner 區塊
*相依性：步驟 2.4*

**視覺設計**：
- `<video>` 標籤滿版背景播放（設定 autoplay, loop, muted, playsinline）
- 中央疊加高對比「立刻探索」CTA 按鈕

**交互邏輯** (home.js)：
- 點擊按鈕跳轉至商品列表頁

### 步驟 4.2：品牌輪播 (Brand Carousel)
*相依性：步驟 2.3*

**視覺設計**：
- 橫向無縫滾動品牌 Logo（5-8 個著名露營品牌）
- 可使用 CSS animation 或 Swiper.js（如允許引入）

**交互邏輯**：
- 自動循環滾動，可選點擊暫停/恢復

### 步驟 4.3：精選商品區塊
*相依性：步驟 2.3、Mock 數據*

**視覺設計**：
- 兩個橫向區塊：「最新商品」和「熱銷商品」
- 各顯示 3-5 張商品卡片（由 data/products.json 提供）
- 右上角「查看更多」按鈕

**商品卡片元件**：
- 商品圖片
- 商品名稱
- 原價（灰色刪除線）
- 特價（亮色突出）
- 右下角「加入購物車」按鈕

**交互邏輯** (home.js)：
- 點擊卡片跳轉至商品詳情頁
- 點擊「加入購物車」觸發 Toast 與 Badge 動畫（不跳轉）
- 點擊「查看更多」導向商品列表

### 步驟 4.4：首頁完整集成
*相依性：步驟 4.1、4.2、4.3*

- 建立 pages/home.html
- 整合所有首頁區塊

---

## 第 5 階段：商品列表頁面 (Product List Page)

### 步驟 5.1：側邊欄篩選器 (PC 版)
*相依性：步驟 2.3、Mock 數據*

**視覺設計**：
- 左側固定 Sidebar，高度同內容
- 篩選項：分類、價格區間（拉桿或 Input）、品牌（Checkbox）

**交互邏輯** (filter.js)：
- 點擊分類或勾選品牌後，右側商品列表動態切換（使用 jQuery toggle class 或隱藏顯示）
- 價格拉桿改變時即時篩選

### 步驟 5.2：商品網格區域
*相依性：步驟 5.1、Mock 數據*

**視覺設計**：
- 使用 Bootstrap Grid (3-4 欄，響應式調整)
- 商品卡片（同首頁設計）
- 卡片 Hover 效果：上浮陰影 + 可選圖片替換

**交互邏輯** (product-list.js)：
- 卡片點擊跳轉詳情
- 購物車按鈕觸發 Toast + Badge 動畫

### 步驟 5.3：手機版篩選 (Bottom Sheet)
*相依性：步驟 2.3、5.1*

**視覺設計**：
- 隱藏 Sidebar（display: none 於小屏幕）
- 底部固定「篩選」按鈕
- 點擊後滑出 Offcanvas 或 Bottom Sheet（由下往上）

**交互邏輯**：
- 篩選完成後自動關閉或點擊「應用」關閉

### 步驟 5.4：分頁或無限滾動（可選）
*相依性：步驟 5.2*

考慮商品數量，決定是否實現分頁或 Intersection Observer 無限滾動。

---

## 第 6 階段：商品詳情頁面 (Product Detail Page)

### 步驟 6.1：圖集展示區
*相依性：步驟 2.3*

**視覺設計**：
- 左側：主圖（大）+ 下方縮圖廊（4-6 張）
- 點擊縮圖動態替換主圖 src

**交互邏輯** (product-detail.js)：
- 縮圖點擊事件更新主圖 src

### 步驟 6.2：購買信息區
*相依性：步驟 2.3*

**視覺設計**（右側）：
- 商品名稱
- 價格（原價 + 特價）
- 規格選擇：顏色/尺寸按鈕（有 Active 狀態）
- 數量增減器（+/- 按鈕 + Input，最低 1）
- 免運進度條（寫死 80%，文案「還差 NT$ 350...」）
- 「加入購物車」+ 「直接購買」大型按鈕

**交互邏輯** (product-detail.js)：
- 規格選擇：點擊時切換 Active class
- 數量控制：+/- 按鈕或直接輸入
- 購物車按鈕：觸發 Toast + Badge 動畫

### 步驟 6.3：Tab 頁籤區塊
*相依性：步驟 2.3、Mock 數據*

**視覺設計**：
- 兩個頁籤：「商品介紹」、「評價」
- 預設展開「商品介紹」

**商品介紹**：
- 大型情境圖 + 詳細規格圖文混排

**評價區**（靜態 Mock）：
- 3-4 則評論卡片，包含：
  - 用戶頭像 + 名稱
  - 5 星評分 Icon
  - 評論文字
  - 1-2 張用戶返圖

**交互邏輯**：
- Tab 切換使用 jQuery 點擊事件

---

## 第 7 階段：購物車與結帳流程 (Shopping Cart & Checkout)

### 步驟 7.1：購物車面板 (Offcanvas/Modal)
*相依性：步驟 2.3、Mock 購物車數據*

**視覺設計**：
- 右側滑出 Offcanvas 面板
- 空狀態：情境插畫 + 「去逛逛」按鈕
- 商品清單：縮圖 + 名稱 + 單價 + 數量控制 + 刪除按鈕

**交互邏輯** (cart.js)：
- 購物車數據存儲於 localStorage（或全局變量）
- +/- 數量：即時重算該列「小計」與總金額
- 刪除：fadeOut 動畫 + DOM 移除 + 重算總金額
- 「前往結帳」按鈕：檢查登入狀態

### 步驟 7.2：未登入攔截邏輯
*相依性：步驟 7.1、全局登入狀態*

**交互邏輯** (cart.js)：
- 點擊「前往結帳」時：
  - 若 `window.isLoggedIn === false`，調用 `e.preventDefault()`
  - 觸發登入 Modal（複用 3.2 的邏輯）
  - 登入成功後自動跳轉結帳頁

### 步驟 7.3：結帳頁面 (One-page Checkout)
*相依性：步驟 2.3、7.1*

**視覺設計**（雙欄）：
- 左側：手風琴表單（三個折疊面板）
  - 買家資訊（姓名、電話、信箱）
  - 物流配送（單選：宅配/門市取貨）
  - 付款方式（單選：信用卡/LINE Pay/貨到付款）
- 右側：固定 Order Summary（position: sticky）
  - 商品小計
  - 運費
  - 折扣碼輸入框
  - 最終金額

**交互邏輯** (checkout.js)：
- 「帶入會員資料」按鈕：自動填充 Input 值
- 物流選擇變更：右側運費即時更新 + 重算總金額
- 「確認結帳」按鈕（滿版）：跳轉成功頁

### 步驟 7.4：結帳成功頁面
*相依性：步驟 7.3*

**視覺設計**：
- 中央大型綠色 Check Icon
- 「訂單成立！」祝賀文字
- 隨機靜態訂單編號（如 #ORD-20260603）
- 兩個按鈕：「查看訂單明細」(→會員中心) + 「繼續購物」(→首頁)

---

## 第 8 階段：會員中心 (Member Center)

### 步驟 8.1：版面結構與導覽
*相依性：步驟 2.3*

**PC 版**：雙欄設計
- 左側：Sidebar 導覽選單（5 個頁籤：總覽、資料、訂單、折價券、通知）
- 右側：內容區域

**手機版**：
- 上方橫向可滑動頁籤或下拉選單
- 下方內容區域

**交互邏輯** (member-center.js)：
- 點擊左側選單項目動態切換右側內容
- 或於不同 URL 子頁面實現（如 /pages/member-center.html?tab=orders）

### 步驟 8.2：會員等級與總覽
*相依性：步驟 8.1、Mock 用戶數據*

**視覺設計**：
- 高質感數位卡片（頂部或顯眼處）
- 用戶頭像 + 姓名
- 會員等級 Badge（「新手露友」、「探險家」、「營地大師」）
- 升等進度條（靜態：70% 進度 + 文案「目前累積消費 NT$ 3,500...」）

### 步驟 8.3：個人資料管理
*相依性：步驟 8.1*

**視覺設計**：
- 標準表單 Input 框
- 包含項目：姓名、電話、信箱、常用地址、個人喜好 Tag

**交互邏輯** (member-center.js)：
- 「儲存修改」按鈕：
  - `e.preventDefault()` 阻擋表單提交
  - 數據存儲至 localStorage
  - 彈出綠色 Toast「資料已更新成功」

### 步驟 8.4：訂單管理與查詢
*相依性：步驟 8.1、Mock 訂單數據*

**視覺設計**：
- 頂部五個狀態頁籤：全部、處理中、已出貨、已完成、已取消
- 下方訂單列表卡片
- 各卡片包含：訂單編號、日期、金額、狀態 Badge、商品縮圖、「查看明細」按鈕

**交互邏輯** (member-center.js)：
- 點擊頁籤切換列表顯示
- 「查看明細」點擊：彈出 Modal 或 Accordion 顯示詳細清單

### 步驟 8.5：訂單明細與 LINE 客服整合
*相依性：步驟 8.4*

**視覺設計**：
- Modal 內：完整購買清單 + 物流進度
- 「LINE 聯絡賣家」按鈕
  - 手機版：href 帶參數 URI（https://line.me/R/msg/text/?...）
  - 桌面版：旁邊「顯示 QR Code」按鈕，點擊彈出 QR Code 圖片

**交互邏輯** (member-center.js)：
- 手機環境：點擊按鈕喚醒 LINE
- 桌面環境：QR Code 按鈕彈出靜態 QR Code 圖片

### 步驟 8.6：商品評價機制
*相依性：步驟 8.5*

**視覺設計**：
- 已完成訂單明細內顯示「寫評價」按鈕
- Modal 包含：Textarea + 5 顆星星評分（CSS 實現可交互）

**交互邏輯** (member-center.js)：
- 星星點擊：使用 jQuery 改變 active class，視覺上亮起
- 提交評價：存儲至 localStorage，彈出成功 Toast

### 步驟 8.7：折價券管理
*相依性：步驟 8.1、Mock 折價券數據*

**視覺設計**：
- 類實體票券設計（CSS radial-gradient 邊緣缺口）
- 分頁籤：「可使用」、「已失效/已使用」
- 失效券：grayscale(100%) 濾鏡 + 浮水印

**互動**：
- 「複製」按鈕：觸發 JS 複製碼，彈出 Toast「已複製」

### 步驟 8.8：通知總覽
*相依性：步驟 8.1、Mock 通知數據*

**視覺設計**：
- 條列式清單，左側 Icon 區分類型（齒輪/訂單/禮物等）
- 未讀項目：小紅點 + 粗體標題

**交互邏輯** (member-center.js)：
- 點擊未讀項目：移除紅點 + 移除粗體 class（模擬標記已讀）

---

## 第 9 階段：分店與合作店家 (Branches & Partners)

### 步驟 9.1：實體分店資訊
*相依性：步驟 2.3、Mock 分店數據*

**視覺設計**（雙欄）：
- 左側：分店列表卡片（含店舖照片、名稱、營業時間、地址、電話）
- 右側：Google Maps iframe（靜態地圖）

**交互邏輯** (branches.js)：
- 點擊左側卡片：iframe src 動態切換至該店座標
- 卡片加上 active class（綠色邊框 Highlight）
- 「規劃路線」按鈕：跳轉 Google Maps

**手機版** (RWD)：
- 單欄佈局，地圖可隱藏

### 步驟 9.2：合作店家與營地
*相依性：步驟 2.3、Mock 合作店家數據*

**視覺設計**：
- Grid 或橫向輪播（Carousel）呈現卡片
- 卡片：封面圖 + 名稱 + 特色 Tag（#免裝備露營 等）

**交互邏輯** (branches.js)：
- 點擊卡片彈出 Modal 顯示詳細與優惠碼

---

## 第 10 階段：內容行銷 - 部落格 (Blog & Content Marketing)

### 步驟 10.1：文章總覽頁
*相依性：步驟 2.3、Mock 文章數據*

**視覺設計**：
- 頂部精選文章區（大圖 + 大標題）
- 下方文章網格（3 欄 Masonry 或標準 Grid）
- 各卡片：封面 + 分類 Tag + 標題 + 摘要 2 行 + 發佈日期

**交互邏輯** (blog.js)：
- 點擊卡片跳轉文章詳情頁
- 可選實現文章分類篩選

### 步驟 10.2：文章閱讀頁
*相依性：步驟 2.3、Mock 文章數據*

**視覺設計**：
- 中央單欄排版（置中，寬度限制以提升可讀性）
- 圖文並茂，行距 1.6-1.8
- 文章標題 + 作者 + 發佈日期 + 分類 Tag

**文內導購模組（關鍵）**：
- 在文章段落間靜態插入「商品卡片」（複用第 4 階段的設計）
- 卡片包含：圖片 + 名稱 + 價格 + 「加入購物車」按鈕
- 展示時向評審說明：讀者可直接點擊加入購物車，實現內容→銷售的無縫轉換

**交互邏輯** (blog.js)：
- 商品卡片點擊事件與首頁相同（購物車、詳情跳轉等）

---

## 第 11 階段：客服與 QA (Customer Service)

### 步驟 11.1：QA 常見問題
*相依性：步驟 2.3*

**視覺設計**：
- Accordion 手風琴折疊面板
- 分類：購物問題、退換貨須知、會員規則
- 點擊標題展開解答

**交互邏輯** (faq.js)：
- jQuery 點擊事件切換 Accordion 狀態

### 步驟 11.2：滿意度回饋問卷
*相依性：步驟 2.3*

**視覺設計**：
- 靜態 Modal 或獨立頁面
- NPS 滑桿（1-10 分）
- 星級評分（1-5 星）
- 文字建議框

**交互邏輯** (faq.js)：
- 送出後隱藏表單，顯示「感謝您的回饋」Toast + 打勾動畫

---

## 第 12 階段：Mock API 層與數據管理 (Data & API Layer)

### 步驟 12.1：建立 Mock API 層
*相依性：所有頁面邏輯完成*

在 `js/api-mock.js` 中定義模擬 API 函數：
```javascript
// 示例
window.API = {
  getProducts: (filters) => { /* 從 products.json 過濾 */ },
  getProductDetail: (id) => { /* 返回單一商品 */ },
  getOrders: (userId) => { /* 從 orders.json 返回用戶訂單 */ },
  submitOrder: (orderData) => { /* 模擬提交 */ },
  // ... 其他
};
```

**預留後端接入點**：
- 日後僅需將 `API.getProducts()` 改為 `fetch('/api/products')`，無需修改邏輯層

### 步驟 12.2：建立 Mock 數據檔案
*相依性：步驟 12.1*

- `data/products.json` - 50+ 商品數據
- `data/users.json` - 模擬用戶資料
- `data/orders.json` - 模擬訂單列表
- `data/articles.json` - 10+ 文章數據
- `data/branches.json` - 3-5 分店資料
- `data/partners.json` - 合作店家

### 步驟 12.3：狀態管理
*相依性：步驟 12.2*

在 `js/config.js` 中定義全局狀態：
```javascript
window.AppState = {
  isLoggedIn: false,
  currentUser: null,
  cart: [],
  preferences: {},
  // ... 其他
};
```

---

## 第 13 階段：RWD 響應式設計完善

### 步驟 13.1：斷點測試與調整
*相依性：所有頁面完成*

- 測試斷點：xs (320px), sm (576px), md (768px), lg (992px), xl (1200px)
- 調整 Navbar、Sidebar、Grid 佈局
- 測試觸摸交互（Offcanvas、Modal 等）

### 步驟 13.2：手機版特定優化
*相依性：步驟 13.1*

- 隱藏非必要元素（如 Sidebar 篩選）
- 放大可點擊元素（Button、Link）
- 優化字體大小與行距
- 確保表單輸入易用（特別是數字輸入）

---

## 第 14 階段：性能優化與測試

### 步驟 14.1：資源優化
*相依性：所有頁面完成*

- 圖片懶加載（Lazy Loading）
- CSS/JS 最小化
- 字體加載最佳化
- 檢查未使用的 CSS/JS

### 步驟 14.2：瀏覽器相容性測試
*相依性：步驟 14.1*

- Chrome、Safari、Firefox、Edge 最新版本
- Mobile Safari (iOS)、Chrome (Android)

### 步驟 14.3：功能驗證清單
*相依性：所有階段完成*

見下方「驗證」章節。

---

## 關鍵文件與修改清單

| 文件 | 目的 | 優先級 |
|------|------|--------|
| css/variables.scss | 色彩與尺度系統 | ⭐⭐⭐ 必須 |
| css/base.scss | 全局樣式重置 | ⭐⭐⭐ 必須 |
| css/components.scss | 可重用元件樣式 | ⭐⭐⭐ 必須 |
| js/config.js | 全局配置與狀態 | ⭐⭐⭐ 必須 |
| js/api-mock.js | Mock API 層 | ⭐⭐ 重要 |
| js/components/navbar.js | 導航欄邏輯 | ⭐⭐⭐ 必須 |
| js/components/cart.js | 購物車邏輯 | ⭐⭐⭐ 必須 |
| js/pages/*.js | 各頁面邏輯 | ⭐⭐⭐ 必須 |
| data/*.json | Mock 數據 | ⭐⭐ 重要 |
| pages/*.html | 各功能頁面 | ⭐⭐⭐ 必須 |

---

## 驗證步驟 (Verification)

> **驗證日期**：2026/06/03　**驗證方式**：原始碼靜態分析 + 運行時功能確認

### 功能驗證

**全局元件**：
1. ✅ Navbar 在 PC/手機端正確顯示與交互 — `js/components/navbar.js` → `initNavbar()`
2. ✅ 登入 Modal 能正確模擬登入並更新全局狀態 — `js/components/modal.js` → `openModal('loginModal')`
3. ✅ Toast 提示在各場景正確顯示 — `js/components/toast.js` → `showToast(msg, type)`
4. ✅ 購物車 Badge 動態更新 — `js/components/cart.js` → `updateBadge()`
5. ✅ 個人化問卷 Modal（Stepper） — `js/components/modal.js` → `initPersonalizationModal()`
6. ✅ 浮動 LINE 客服按鈕 — 所有頁面 HTML 底部已內嵌

**首頁**：
1. ✅ Hero Banner 顯示（背景大圖 + 含 playsinline 屬性） — `pages/home.html` → `hero-banner` section
2. ✅ 品牌輪播無縫滾動 — `js/components/carousel.js` + CSS animation
3. ✅ 精選商品卡片動態渲染 — `js/pages/home.js` → `_buildProductCard()`, `_renderProducts()`
4. ✅ 「查看更多」按鈕導向商品列表 — `home.js` → `window.location.href = 'products.html'`
5. ✅ 商品卡「加入購物車」觸發 Toast + Badge — `home.js` → `_handleAddToCart(productId)`

**商品列表**：
1. ✅ 側邊欄篩選在 PC 版顯示（992px 以上） — `pages/products.html` → `.filter-sidebar`
2. ✅ 手機版為底部滑出篩選（Bottom Sheet） — `main.css` → `.mobile-filter-btn` + Offcanvas
3. ✅ 篩選即時更新商品列表 — `js/components/filter.js` → `applyFilters()` + CustomEvent
4. ✅ 商品卡片 Hover 效果正常 — `main.css` → `.product-card:hover { transform: translateY(-4px) }`

**商品詳情**：
1. ✅ 圖集縮圖點擊替換主圖 — `js/pages/product-detail.js` → thumbnail click event
2. ✅ 規格選擇切換 Active 狀態 — `product-detail.js` → spec button active class toggle
3. ✅ 數量增減正常（最低 1） — `product-detail.js` → `initQtyStepper()`
4. ✅ Tab 頁籤切換內容 — `pages/product-detail.html` → tab panel switching
5. ✅ 加入購物車觸發 Toast + Badge 動畫 — `product-detail.js` → `addToCart()` + `showToast()`
6. ✅ 免運進度條顯示 — `product-detail.html` → shipping progress bar

**購物車與結帳**：
1. ✅ 購物車頁面正確顯示所有商品 — `pages/cart.html` + `js/pages/cart.js`
2. ✅ 數量調整即時重算總金額 — `cart.js` → quantity change → `recalculateTotal()`
3. ✅ 刪除商品 fadeOut 動畫 + 重算 — `cart.js` → remove item with animation
4. ✅ 未登入跳轉邏輯正常 — `cart.js` → `isLoggedIn` check → `openModal('loginModal')`
5. ✅ 結帳頁面手風琴展開/收合正常 — `pages/checkout.html` → `.checkout-panel` custom accordion
6. ✅ 物流選擇動態更新運費 — `js/pages/checkout.js` → `selectedShippingMethod` + fee recalc
7. ✅ 結帳成功頁面正確顯示 — `pages/checkout-success.html` 存在並含訂單號碼

**會員中心**：
1. ✅ 頁籤切換內容正常（PC 左側欄 / 手機橫向）— `js/pages/member-center.js` → tab switching
2. ✅ 資料編輯與保存 (localStorage) — `member-center.js` → `localStorage.setItem()`
3. ✅ 訂單狀態篩選正常 — `member-center.js` → status tab filter
4. ✅ 評價 Modal 星級互動正常 — `member-center.js` → `openReviewModal()` + star toggle
5. ✅ 折價券複製功能正常 — `member-center.js` → `copyCouponCode()` → `navigator.clipboard.writeText()`
6. ✅ 通知點擊標記已讀 — `member-center.js` → remove unread class
7. ✅ 會員等級進度條顯示 — `member-center.html` → level card + progress bar

**部落格**：
1. ✅ 文章列表網格顯示正常 — `pages/blog.html` → `#articlesGrid` 由 JS 動態渲染
2. ✅ 文章詳情頁圖文排版正確 — `pages/blog-detail.html` → article layout
3. ✅ 文內商品卡片可交互 — `blog-detail.html` → `.inline-product-card` + add to cart

**分店與合作**：
1. ✅ 分店卡片點擊更新地圖 — `js/pages/branches.js` → `updateMap(mapQuery, address)`
2. ✅ 「規劃路線」按鈕正常 — `branches.html` → `maps.google.com/maps/search/` href
3. ✅ 合作店家卡片彈出 Modal — `branches.js` → partner detail modal
4. ✅ 分店卡片上下區塊排版正確 — 上方 `.branch-card-header`（淺綠底色店名）/ 下方 `.branch-card-body`（地址、電話、時間各一行，標籤橫排）

**客服**：
1. ✅ QA Accordion 展開/收合 — `pages/faq.html` + `js/pages/faq.js` → custom accordion
2. ✅ NPS 評分按鈕互動 — `faq.js` → `_selectedNps` + active class toggle
3. ✅ 問卷提交觸發成功反饋 — `faq.js` → `_initSubmitFeedback()` → `showToast()`

### RWD 驗證

1. ✅ 320px (iPhone SE) — `main.css` → `@media (max-width: 575px)` 商品卡壓縮、Hero 縮放
2. ✅ 576px (大型手機) — `main.css` → `@media (max-width: 767px)` 單欄佈局、字型縮小
3. ✅ 768px (iPad 直式) — `main.css` → `@media (min-width: 768px and max-width: 991px)` 雙欄→單欄
4. ✅ 992px (iPad 橫式) — `main.css` → `.filter-sidebar` 顯示、購物車單欄
5. ✅ 1200px (Desktop) — `main.css` → 完整體驗、Navbar 搜尋框加寬
6. ✅ Touch Target ≥ 44px — `main.css` → `@media (max-width: 767px)` 所有按鈕 `min-height: 44px`
7. ✅ iOS Safari 表單不縮放 — `main.css` → `input { font-size: 16px !important }`
8. ✅ Safe Area Inset（iPhone 有 Home Bar）— `main.css` → `env(safe-area-inset-bottom)`

### 效能驗證

1. ✅ 首頁資源預先連線 — 所有 HTML → `<link rel="preconnect" href="https://picsum.photos">`
2. ✅ JS 延遲載入（不阻塞渲染）— 所有 HTML → `<script defer>`
3. ✅ 圖片懶加載 — 商品詳情評價圖 / 部落格作者頭像 → `loading="lazy"`
4. ✅ Lazy Loading Fallback — `js/main.js` → `initLazyLoadingFallback()` + IntersectionObserver
5. ✅ Body Scroll Lock（iOS） — `js/main.js` → `initBodyScrollLock()` + MutationObserver
6. ✅ LCP 效能監測 — `js/main.js` → `PerformanceObserver` 記錄最大內容繪製時間
7. ✅ 瀏覽器相容性 CSS — `main.css` → `-webkit-` vendor prefix、CSS Grid fallback、`@supports`
8. ✅ 列印樣式 — `main.css` → `@media print` 隱藏 Navbar/Toast/影片
9. ✅ localStorage 資料持久化正常 — `js/config.js` → `saveAppState()` + `beforeunload`
10. ✅ 功能驗證頁面 — `pages/verify.html` — 51 項交互式測試清單 + 效能指標

---

## 重要設計決策與假設

1. **無後端環境**：所有資料使用 Mock (localStorage/JSON)，日後易於切換真實 API
2. **靜態頁面導航**：使用傳統 HTML 頁面跳轉，非 SPA（可日後升級至 React/Vue）
3. **Bootstrap 5 網格系統**：加速 RWD 開發
4. **jQuery 輔助交互**：減少 Vanilla JS 複雜度，易於維護
5. **SCSS 變量集中**：統一色彩管理，品牌一致性
6. **文件結構模塊化**：按頁面和元件分離，便於多人開發

---

## 進度追蹤

> **最後更新**：2026/06/03　**整體完成度**：✅ 100%（所有 14 階段已完成並驗證）+ Hero Banner 清理

| 階段 | 主要產出物 | 狀態 | 完成日期 |
|------|-----------|------|---------|
| **第 1 階段**（基礎架構） | 目錄結構、`.gitignore`、`README.md` | ✅ 已完成 | 2026/06/03 |
| **第 2 階段**（樣式系統） | `css/variables.scss`、`base.scss`、`components.scss`、`main.css`（4437 行） | ✅ 已完成 | 2026/06/03 |
| **第 3 階段**（全局元件） | `navbar.js`、`modal.js`、`toast.js`、`carousel.js`、LINE 浮動按鈕 | ✅ 已完成 | 2026/06/03 |
| **第 4 階段**（首頁） | `pages/home.html`、`js/pages/home.js`、Hero Banner、品牌輪播、精選商品 | ✅ 已完成 | 2026/06/03 |
| **第 5 階段**（商品列表） | `pages/products.html`、`js/pages/product-list.js`、篩選器（PC + 手機 Bottom Sheet） | ✅ 已完成 | 2026/06/03 |
| **第 6 階段**（商品詳情） | `pages/product-detail.html`、`js/pages/product-detail.js`、圖集、規格選擇、Tab | ✅ 已完成 | 2026/06/03 |
| **第 7 階段**（購物車與結帳） | `pages/cart.html`、`pages/checkout.html`、`pages/checkout-success.html`、`js/pages/cart.js`、`checkout.js` | ✅ 已完成 | 2026/06/03 |
| **第 8 階段**（會員中心） | `pages/member-center.html`、`js/pages/member-center.js`、訂單/折價券/評價/通知 | ✅ 已完成 | 2026/06/03 |
| **第 9 階段**（分店） | `pages/branches.html`、`js/pages/branches.js`、Google Maps iframe、合作店家 Modal | ✅ 已完成 | 2026/06/03 |
| **第 10 階段**（部落格） | `pages/blog.html`、`pages/blog-detail.html`、`js/pages/blog.js`、文內商品導購卡片 | ✅ 已完成 | 2026/06/03 |
| **第 11 階段**（客服 FAQ） | `pages/faq.html`、`js/pages/faq.js`、Accordion、NPS 問卷、Toast 反饋 | ✅ 已完成 | 2026/06/03 |
| **第 12 階段**（Mock API） | `js/api-mock.js`、`js/config.js`（AppState/AppConfig）、`data/*.json`（5 個資料檔） | ✅ 已完成 | 2026/06/03 |
| **第 13 階段**（RWD 完善） | `main.css` 新增 600+ 行 RWD：5 個斷點、Touch Target 44px、iOS Safe Area、Body Scroll Lock | ✅ 已完成 | 2026/06/03 |
| **第 14 階段**（效能優化） | 12 頁 `preconnect` + `theme-color`、全站 `defer`、Lazy Loading Fallback、瀏覽器相容 CSS、`pages/verify.html`（51 項驗證） | ✅ 已完成 | 2026/06/03 |
| **修復：Navbar Offcanvas** | `main.css` 補齊 `.navbar-offcanvas` 定位 CSS（`position:fixed; left:0; transform:translateX(-100%)`），修復手機側欄直接顯示在頁面的問題；同步清除 12 個 HTML 頁面 offcanvas 內帶 inline style 的重複導覽 `<ul>`，改由 CSS class 統一控制樣式 | ✅ 已完成 | 2026/06/03 |
| **修復：Hero Banner 清理** | `pages/home.html` 移除 picsum `<img>` 備援層（與 video 同 z-index 導致圖片蓋住影片）；`css/main.css` 的 `.hero-banner video` 改用 `inset:0` 現代定位寫法，移除舊式 `top:50%/left:50%/transform` 組合 | ✅ 已完成 | 2026/06/03 |
| **調整：分店卡片排版** | `js/pages/branches.js` `buildBranchCard()` 拆成 `.branch-card-header`（店名）+ `.branch-card-body`（資訊+標籤）；`css/main.css` 新增對應樣式，上方淺綠底色（`#f0f7f7`），標籤橫排 | ✅ 已完成 | 2026/06/03 |
| **總計** | **48 個檔案**、**11 頁 HTML**、**17 個 JS 模組** | ✅ 全部完成 | 2026/06/03 |

### 關鍵數字統計

| 項目 | 數量 |
|------|------|
| HTML 頁面（含驗證頁） | 12 個 |
| JavaScript 模組 | 17 個（7 元件 + 10 頁面邏輯）|
| CSS 行數（main.css） | 4,489 行 |
| Mock 資料 JSON | 5 個（商品/用戶/訂單/文章/分店）|
| RWD 斷點覆蓋 | 5 個（320px / 576px / 768px / 992px / 1200px）|
| 功能驗證項目 | 51 項（`pages/verify.html`）|

---

## 下一步行動（全部完成）

1. ✅ 審批規劃
2. ✅ 建立基礎文件夾結構（第 1 階段）
3. ✅ 開發 SCSS 變量系統（第 2 階段）
4. ✅ 逐階段實現頁面與功能（第 3–12 階段）
5. ✅ RWD 響應式設計完善（第 13 階段）
6. ✅ 效能優化與瀏覽器相容性（第 14 階段）
7. ✅ 驗證步驟執行與進度更新（2026/06/03）
8. ✅ 修復 Navbar Offcanvas CSS 定位缺失問題，清除 12 個頁面的重複 inline-style 導覽清單（2026/06/03）
9. ✅ 修復 Hero Banner img 層蓋住 video 的問題，移除 picsum 備援圖片，更新 video CSS 為現代 inset 寫法（2026/06/03）

### 若需後續擴展，建議方向

- 🔄 **接入真實後端**：將 `js/api-mock.js` 中的 Mock 函數替換為 `fetch('/api/...')` 即可
- 🚀 **升級至 SPA**：以 Vue 3 或 React 重構，複用現有 CSS 設計系統與 JSON 資料結構
- 📊 **加入 GA/GTM**：在 `js/main.js` 的 `initGlobalListeners` 中接入 Analytics 事件追蹤
- 🧪 **自動化測試**：以 Playwright 或 Cypress 將 `pages/verify.html` 的 51 項轉為自動化測試腳本

