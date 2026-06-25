# Yuruicamp｜CSS 改版執行規格 v3.2

## 既有專案安全改版、Token 導入、測試與交付

> 本文件只負責說明「如何把 Yuruicamp 設計系統安全套用到既有專案」。  
> 品牌定位、正式色碼、元件視覺、頁面規範、攝影、響應式與可及性，以《Yuruicamp｜全站設計系統母規範 v3.2》為唯一依據。  


---


#  最高修改原則

改版目標：

> **不破壞既有 HTML 結構、JavaScript 行為與響應式版面，只整理視覺系統與 CSS 架構。**

修改時必須遵守：

- 不任意更改 HTML class 名稱
- 不刪除 JavaScript 依賴的 selector
- 不更改 DOM 結構
- 不破壞 Grid、Flex、Position 與既有版面尺寸
- 不任意刪除 Media Query
- 不直接對所有色碼做全域搜尋取代
- 優先建立 Design Tokens，再逐步替換元件
- 保留頁面專屬 class
- 保留既有動畫與功能
- 無法判斷用途的 selector 先保留並加註解
- 必要覆寫需說明原因
- 修改後列出主要變更與未確認區域

---

#  修改前盤點

開始修改前，必須完整閱讀所有相關 CSS，確認以下項目。

## 3.1 CSS 架構

- 現有 CSS Variables
- Reset／Base
- Typography
- Layout
- Utilities
- Component CSS
- Page CSS
- Media Query
- 第三方套件覆寫

## 3.2 共用元件

盤點：

- Header
- Footer
- Hero
- Button
- Card
- Form
- Tag／Badge
- Modal
- Search／Filter
- Product／Camp Card
- Cart／Checkout
- Toast／Alert

## 3.3 依賴關係

確認：

- JavaScript 依賴的 class／id
- Bootstrap 或其他框架 class
- 動態加入或移除的狀態 class
- `aria-expanded`、`hidden`、`disabled` 等狀態
- 頁面專屬 selector
- CSS 載入順序
- 舊 Theme 或 Component 是否在後方覆蓋新規則

## 3.4 互動狀態

逐一盤點：

- Hover
- Focus
- Focus Visible
- Active
- Selected
- Disabled
- Loading
- Error
- Success
- Empty State

## 3.5 色碼與重複規則

列出：

- 硬編碼色碼
- 重複 Button 規則
- 重複 Card 規則
- 重複 Form 規則
- 不存在或拼錯的 CSS Variable
- `!important`
- 相互覆蓋的 selector
- 同一語意卻使用不同顏色的元件

---

# 4. 設計系統引用規則

正式視覺以《全站設計系統母規範》為準。

## 4.1 唯一 Token 命名

專案統一使用：

```text
--yc-*
```

禁止同時保留：

```text
--yc-bg
--color-bg
--theme-bg
--main-background
```

若舊專案已使用其他命名，可先建立一層暫時 Alias，但最終需收斂。

範例：

```css
:root {
  --yc-bg: #F8F5EE;

  /* Temporary compatibility alias — 後續移除 */
  --color-bg: var(--yc-bg);
}
```

## 4.2 Token 放置位置

優先放置在：

```text
theme.css
或
base.css 最前方
```

若專案只有 `main.css`，則放在 `main.css` 最前方。

## 4.3 禁止重複定義

不得在不同檔案重複定義同一 Token，例如：

```css
/* base.css */
--yc-cta: #E2D39A;

/* booking.css */
--yc-cta: #F4E7B9; /* 禁止：頁面不得自行改寫核心 CTA */
```

頁面差異應建立語意 Token，而不是覆寫核心品牌色。

---

## 4.4 暖光奶油金 CTA 遷移注意

母規範 v3.2 的 CTA 色系為：

```css
--yc-cta: #E2D39A;
--yc-cta-hover: #D4C27E;
--yc-cta-active: #C4AF62;
--yc-cta-soft: #FBF3D1;
--yc-cta-line: #D9C98F;
--yc-on-cta: #4A4537;
```

遷移時必須同步處理：

- 原本 CTA 白字改為 `var(--yc-on-cta)`
- 原本陶土色陰影改為暖金灰陰影
- 原本淡陶土背景改為 `var(--yc-cta-soft)`
- 原本陶土色外框改為 `var(--yc-cta-line)`
- Error／Danger 色不可跟著改成奶油金
- 若舊圖示直接使用陶土色，應改為品牌綠或奶油金深階，避免所有 Icon 同時變黃

---

# 5. 建議 CSS 結構

```css
/* 01. Design Tokens */
/* 02. Reset / Base */
/* 03. Typography */
/* 04. Layout */
/* 05. Header */
/* 06. Hero */
/* 07. Buttons */
/* 08. Forms */
/* 09. Cards */
/* 10. Tags / Status */
/* 11. Search / Filter */
/* 12. Product / Camp */
/* 13. Cart / Checkout */
/* 14. Modal / Toast */
/* 15. Footer */
/* 16. Utilities */
/* 17. Responsive */
/* 18. Compatibility Overrides */
```

若現有專案已拆檔，不必強制合併成單一檔案，但每個檔案職責應清楚。

---

# 6. Selector 對應策略

## 6.1 不改 HTML 的前提

優先將既有 selector 併入相同語意規則，例如：

```css
.btn-cta,
.btn-book,
.btn-checkout,
.btn-add-cart {
  /* Conversion CTA */
}
```

不要為了套用設計系統，直接要求 HTML 全面改 class。

## 6.2 JavaScript 狀態 class

例如：

```text
.is-active
.is-open
.is-loading
.is-selected
.is-disabled
.has-error
```

這些 class 必須保留。

若視覺需要改動，只修改 CSS，不重命名 class。

## 6.3 框架覆寫

若存在 Bootstrap 等框架：

- 先確認框架 CSS 載入順序
- 優先提高語意 selector 精準度
- 不要一開始就使用 `!important`
- 必須使用 `!important` 時，需加註解說明原因與移除條件

---

# 7. Token 遷移流程

## 階段 1：建立核心 Token

將母規範的 `--yc-*` Tokens 加入專案。

此階段只新增變數，不修改元件。

## 階段 2：建立舊值對照表

格式：

| 舊色碼／變數 | 出現位置 | 語意 | 新 Token | 處理方式 |
|---|---|---|---|---|
| `#244d4d` | Header、Footer | 舊深綠 | `--yc-header-bg`／`--yc-footer-bg` | 分開替換 |
| `#ffffff` | Card、Modal | Surface | `--yc-surface` | 依用途替換 |
| `#333333` | 標題、內文 | Text | `--yc-text`／`--yc-text-secondary` | 依文字層級拆分 |
| 舊橘色／陶土色 | Button | Conversion | `--yc-cta`／`--yc-cta-soft` | 僅限交易行動，並改用深色文字 |

禁止將相同舊色碼一次替換成單一新色，因為舊色可能同時承擔多種語意。

## 階段 3：先改共用元件

優先順序：

1. Typography
2. Header
3. Footer
4. Button
5. Card
6. Form
7. Tag／Status
8. Modal／Toast

## 階段 4：再改高轉換頁

優先順序：

1. 營區搜尋
2. 營區詳情
3. 商品詳情
4. 購物車
5. 結帳

## 階段 5：內容與品牌頁

最後處理：

1. 首頁內容節奏
2. 文章
3. 品牌故事
4. FAQ
5. 聯絡頁
6. 會員中心

## 階段 6：移除暫時 Alias

確認所有元件都已改用 `--yc-*` 後：

- 移除舊變數 Alias
- 清除未使用 Token
- 清除被覆蓋的舊規則
- 再次搜尋硬編碼舊色碼

---

# 8. 元件實作要求

本節只描述實作方式；正式視覺值請引用母規範。

## 8.1 Button

- 合併相同層級的 Button 規則
- Conversion、Brand、Secondary、Soft Conversion、Text Action 分開
- 暖光奶油金 CTA 必須使用深色文字 `--yc-on-cta`，不可沿用白字
- 不以頁面名稱決定顏色，而以操作語意決定
- 所有按鈕需具備 Hover、Focus Visible、Active、Disabled
- 重複卡片的交易按鈕優先使用 Soft Conversion

## 8.2 Card

- 合併 Product、Camp、Article 等共通基礎樣式
- 頁面差異只保留在 Modifier
- 圖片 Hover、Card Hover 與 Transition 統一
- 不允許部分卡片使用黑色陰影、部分使用品牌陰影

## 8.3 Form

- Input、Select、Textarea 使用一致基礎樣式
- Focus 統一使用品牌綠
- Error、Success、Disabled 狀態完整
- Checkbox／Radio 保留原生可用性
- 不得只靠邊框顏色表達錯誤

## 8.4 Header／Footer

- 保留原有互動與手機選單邏輯
- 不變更 JavaScript 用於開關選單的 class
- Footer Bottom 與主 Footer 分開處理
- 社群 Icon 不使用平台品牌色作為永久預設

## 8.5 Hero

- 保留原 Video、圖片、內容與 CTA 結構
- 遮罩以 pseudo element 或背景層實作
- 確認遮罩不阻擋連結點擊
- 手機版重新檢查圖片焦點與文字對比

---

# 9. 頁面語意對照

實作時依操作語意套用樣式：

| 操作 | 視覺層級 |
|---|---|
| 搜尋、預訂、購買、結帳、付款、送出 | Conversion CTA |
| 查看詳情、閱讀、探索、修改條件 | Brand Action |
| 返回、繼續瀏覽、查看其他選擇 | Secondary |
| 重複卡片中的加入購物車／查看日期 | Soft Conversion |
| 清除、關閉、稍後再看 | Text Action |
| 取消訂單、刪除 | Error／Danger |

不要根據按鈕出現在哪個頁面決定顏色。

---

# 10. Responsive 保護與檢查

不得刪除既有 Media Query。

需確認：

## Header

- 64px–68px
- 次要導覽隱藏
- Logo、會員、購物袋保留
- Menu 按鈕可操作
- Header CTA 可移入選單

## Hero

- 圖片焦點正確
- 標題不溢出
- 搜尋欄改為 1–2 欄
- 日期欄全寬
- CTA 全寬或具足夠點擊範圍

## Card

- 手機改為單欄
- 圖片比例一致
- 行動最多兩個
- 主要交易按鈕較寬
- 不產生水平捲動

## Footer

- 單欄或 Accordion
- 社群 Icon 40px–44px
- 不保留過多空白高度
- Accordion 可用鍵盤操作

---

# 11. 可及性實作檢查

必須確認：

- 標題與內文使用正確語意標籤
- 所有 Icon Button 有 `aria-label`
- `:focus-visible` 清楚
- 按鈕至少 44px 高
- Icon Button 至少 40px × 40px
- Disabled 不能只降低透明度到難以辨識
- 錯誤訊息包含文字
- 必要時使用 `aria-describedby`
- 選中狀態包含背景、邊框、文字或 Icon
- 深色背景小字使用奶油白
- Reduced Motion 使用者不被強迫觀看大幅動畫

建議：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# 12. 測試清單

## 12.1 桌面版

- [ ] Header 固定／滾動行為正常
- [ ] Hero 文字與 CTA 可讀
- [ ] 商品卡、營區卡未變形
- [ ] Modal、Dropdown、Accordion 正常
- [ ] Cart、Checkout 流程正常
- [ ] Footer 欄位與 Bottom Bar 正常
- [ ] 沒有水平溢位

## 12.2 手機版

- [ ] Menu 可開關
- [ ] 搜尋、日期與表單可操作
- [ ] 商品卡單欄
- [ ] CTA 至少 44px
- [ ] Fixed／Sticky 元件未遮住內容
- [ ] Footer Accordion 正常
- [ ] 沒有水平溢位

## 12.3 互動狀態

- [ ] Hover
- [ ] Focus Visible
- [ ] Active
- [ ] Selected
- [ ] Disabled
- [ ] Loading
- [ ] Error
- [ ] Success
- [ ] Empty State

## 12.4 JavaScript 回歸

- [ ] 購物車數量更新
- [ ] 收藏功能
- [ ] Modal
- [ ] Toast
- [ ] 篩選與排序
- [ ] 輪播
- [ ] Header／Footer 動態載入
- [ ] 表單驗證
- [ ] 結帳步驟
- [ ] Accordion／Tabs

---

# 13. CSS 品質要求

修改時同步處理：

1. 將散落硬編碼色碼改為 Variables
2. 合併重複 Button 規則
3. 合併重複 Card 規則
4. 合併重複 Form 規則
5. 避免過多 `!important`
6. 不使用不存在的 Variable
7. 不讓舊色碼覆蓋新 Token
8. 保留頁面專屬 class
9. 保留原有動畫與 Responsive
10. 對相容性覆寫加註解
11. 清除已無作用的規則
12. 避免過度提高 Selector Specificity

---

# 14. 不可接受的修改結果

以下任一情況視為不合格：

- 直接刪除原本 selector
- 改動 HTML 結構或 class，卻未經必要性評估
- 破壞 JavaScript
- 手機版溢出
- 按鈕小於最低點擊尺寸
- 大量使用 `!important`
- 只替換色碼，沒有整理語意層級
- 同時維護兩套 Token 命名
- 頁面專屬 CSS 覆蓋核心 Token
- Conversion CTA 與一般查看操作使用相同層級
- 桌面正常但手機失效
- 只測靜態畫面，未測 Hover、Focus、Disabled 與 Error
- 未說明哪些區域無法確認

視覺是否符合品牌，則依母規範的驗收清單判定。

---

# 15. 完成後交付內容

完成修改後，需提供：

1. 修改完成的完整 CSS 檔
2. 新增或更動的 `--yc-*` Tokens
3. 舊變數到新 Token 的對照表
4. 主要元件修改摘要
5. 未修改或無法確認的區域
6. 仍存在的硬編碼舊色碼
7. 仍存在的 `!important`
8. 可能需同步修改的其他 CSS
9. HTML class 若有必要調整，只列出建議，不直接更動
10. 桌面版測試結果
11. 手機版測試結果
12. JavaScript 回歸測試結果
13. 可及性檢查結果

---

# 16. 建議交付格式

```text
A. 修改檔案清單
B. Design Tokens 變更
C. 共用元件變更
D. 頁面專屬變更
E. Responsive 變更
F. JavaScript 回歸結果
G. 可及性結果
H. 尚未處理區域
I. 殘留舊色碼與 !important
J. 後續建議
```

---

# 17. 可直接貼給 Claude 的執行指令

```text
請完整閱讀我提供的所有 CSS，以及：

1.《Yuruicamp｜全站設計系統母規範 v3.2》
2.《Yuruicamp｜CSS 改版執行規格 v3.2》

任務：

1. 先盤點 CSS 架構、Variables、共用元件、頁面專屬 selector、Media Query、框架覆寫與 JavaScript 依賴。
2. 不改 HTML 結構、不任意改 class 或 id、不破壞 JavaScript。
3. 保留既有 Grid、Flex、Position、動畫、Responsive 與功能。
4. 在全域 CSS 最前方建立母規範中的 `--yc-*` Design Tokens。
5. 不同用途的舊色碼必須依語意拆分，不可直接全域替換。
6. Conversion CTA、Brand Action、Secondary、Soft Conversion、Text Action 必須分級；奶油金 CTA 使用深色文字，不得沿用白字。
7. 合併重複 Button、Card、Form 規則。
8. Header、Hero、Footer、Tag、Status、Search、Product、Camp、Cart、Checkout 依母規範實作。
9. 保留並檢查所有 Media Query。
10. 補齊 Hover、Focus Visible、Active、Selected、Disabled、Loading、Error、Success 與 Empty State。
11. 避免大量使用 !important；必要時加註解說明原因。
12. 不使用不存在的 CSS Variable，也不允許頁面 CSS 重新定義核心品牌 Token。
13. 完成後輸出完整修改檔案，不只提供片段。
14. 最後依《CSS 改版執行規格》的交付格式，列出：
    - 修改檔案清單
    - Token 變更
    - 舊值對照
    - 元件與頁面修改摘要
    - Responsive 與 JavaScript 測試
    - 可及性結果
    - 未確認區域
    - 殘留硬編碼色碼與 !important
    - 建議同步修改的其他檔案

請先分析，再改寫。不要只做全域色碼替換。
```

---

# 18. 與母規範的同步規則

日後若需要改色碼、字體、按鈕層級或頁面視覺：

1. 先修改《全站設計系統母規範》
2. 再依母規範修改 CSS
3. 本執行文件只在「流程、技術限制、測試或交付方式」改變時更新

不要在本文件單獨修改品牌色碼或元件視覺。
