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

### components/header.partial（booking-header 區塊）
- 桌機導覽列新增「會員中心」連結 → `./member-center.html`
- 手機 Offcanvas 選單新增「會員中心」連結
- 已登入頭像旁齒輪按鈕連結從 `../pages/member-center.html?tab=camping` 改為 `./member-center.html`

### booking/css/base.css
- 新增 `.modal` 基礎樣式（`display:none; position:fixed; inset:0`）
- 讓 `components/header.partial` 的 booking-header 區塊中 `class="modal"` 的登入 Modal 不依賴 main.css

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


# 視覺風格與色彩配置提案

## 1. 全局畫布與空間感 (Base & Surface)
網頁的底色就像是空間的牆面與地板，決定了整體的溫度。

* **網頁總背景 (Body Background)**： 使用 **晨光奶油黃** ` #FDF1DB `。這會立刻消除純白背景帶來的生硬科技感，賦予網站一種溫暖、療癒的底蘊。
* **卡片/區塊背景 (Card/Surface)**： 使用 **純白** ` #FFFFFF ` 或微微帶一點點綠的極淺色。因為底色已經是奶油黃，商品卡片如果維持白色，可以在視覺上「浮」出來，創造乾淨的層次感。
* **分隔線與邊框 (Borders/Dividers)**： 使用 **暖沙色** ` #D7C0A4 `。用它來取代原本生硬的灰色格線，能讓區塊的劃分更柔和。

---

## 2. 視覺骨架與文字層次 (Typography)
>  **重要原則**：絕對不要用純黑色（`#000000` 或 `#333333`）作為文字顏色，它會破壞大地色的氛圍。

* **主要標題與內文 (Heading & Primary Text)**： 使用 **深炭褐木** ` #4A3B32 `。這個顏色夠深，能確保良好的閱讀對比度，同時又帶有泥土與木質的溫潤感。
* **次要資訊與小字 (Secondary Text)**： 例如日期、營地海拔說明、副標題，可以使用 **尤加利綠** ` #96AB88 ` 或 **淺鼠尾草綠** ` #A4BD9B `，拉開文字的層次。

---

## 3. 品牌主視覺與大區塊 (Brand Elements)
Header（導覽列）、Footer（頁尾）與大面積的視覺焦點。

* **導覽列與頁尾背景**： 使用 **深青苔綠** ` #5A6D56 ` 或 **石生苔綠** ` #6B8F71 `。這能穩住整個網頁的上下兩端，與中間輕盈的奶油黃底色形成漂亮的「深-淺-深」夾心結構。
* **主視覺上的反白字**： 在這些深綠色區塊上的文字，可以直接使用 **晨光奶油黃** ` #FDF1DB ` 或純白來反白，會非常有質感。

---

## 4. 視覺動線與互動引導 (Action & Highlight)
這是用來引導使用者目光，告訴他們「該點哪裡」的關鍵色。

* **主要行動按鈕 (Primary Button)**： 例如「加入購物車」、「查看詳情」、「前往結帳」，請大膽使用 **溫暖陶土橘** ` #9D5F1B `。這個顏色在奶油底與綠色系中是對比色，能瞬間抓住眼球。
* **次要按鈕與 Hover 狀態**： 例如篩選器的外框按鈕，或是滑鼠游標停留在綠色按鈕時的變色，可以使用 **強調色 橄欖綠** ` #7B8563 `，製造細微的互動層次。

---

## 5. 標籤與狀態提示 (Badges & UI Details)
* **「熱銷」或「重要警告」標籤**： 使用 **溫暖陶土橘** ` #9D5F1B ` 搭配白色文字。
* **「NEW」或「環境友善」標籤**： 使用 **淺鼠尾草綠** ` #A4BD9B ` 搭配深炭褐木色的文字。

---

##  具體應用想像（以商品卡片為例）

>  **想像一張露營裝備的卡片配置：**
> 
> 1. 卡片直接放在 **晨光奶油黃** 的大背景上，卡片本身是乾淨的白色，邊緣帶著一點 **暖沙色** 的細緻邊框或非常柔和的陰影。
> 2. 左上角的「NEW」標籤是 **淺鼠尾草綠** 加上深褐色字。
> 3. 商品的標題「雪地露營帳篷」是用 **深炭褐木** 色，看起來沉穩高級。
> 4. 下面的價格數字也是深褐色，旁邊可能帶有 **尤加利綠** 的小字說明。
> 5. 最下方的「加入購物車」是一顆飽滿的 **溫暖陶土橘** 按鈕。
