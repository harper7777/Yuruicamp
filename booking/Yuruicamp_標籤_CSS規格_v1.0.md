# Yuruicamp｜標籤與訂單狀態 CSS 改版規格 v1.0

## 奶油暖白 × 鼠尾草綠 × 暖光奶油金 × 粉灰警示

> 本文件依照「Yuruicamp 標籤系統總覽」與「訂單狀態標籤設計建議」兩張設計圖整理。  
> 適用範圍包括露營地、文章、商品、客戶後台、首頁問卷、訂單確認與出貨狀態。  
> 核心原則：**先判斷標籤的功能，再決定色彩；不要讓每一個標籤各自使用不同顏色。**

---

# 1. 先區分三種元件

雖然專案裡都可能稱為 tag，但實際上有三種不同功能。

## 1.1 資訊標籤 Information Tag

用途：

- 顯示露營地環境與設施
- 顯示文章主題
- 顯示商品特性
- 顯示客戶屬性

特徵：

- 主要是閱讀
- 通常不可點擊
- 高度較小
- 不應搶過主要 CTA

範例：

```html
<span class="yc-tag yc-tag--green">森林系</span>
<span class="yc-tag yc-tag--neutral">獨立衛浴</span>
<span class="yc-tag yc-tag--gold">本週熱門</span>
```

## 1.2 篩選／問卷 Chip

用途：

- 「全部／待確認／已確認／已退款」
- 商品篩選
- 首頁個人化問卷
- 多選或單選條件

特徵：

- 可點擊
- 顏色表示是否選中
- 未選、Hover、選中狀態必須一致
- 不因內容文字不同就更換整顆按鈕顏色

範例：

```html
<button class="yc-filter-chip is-active" aria-pressed="true">全部</button>
<button class="yc-filter-chip" aria-pressed="false">待確認</button>
<button class="yc-filter-chip" aria-pressed="false">已確認</button>
<button class="yc-filter-chip" aria-pressed="false">已退款</button>
```

## 1.3 狀態 Badge

用途：

- 顯示某筆訂單目前的實際狀態
- 顯示後台風險與完成狀態

特徵：

- 通常不可點擊
- 使用語意色
- 必須和篩選 Chip 分開

範例：

```html
<span class="yc-order-status yc-order-status--confirmed">已確認</span>
<span class="yc-order-status yc-order-status--pending-shipment">待出貨</span>
```

---

# 2. 五組標籤色調

## 2.1 品牌綠

用途：

- 一般正向資訊
- 自然環境
- 新手友善
- 商品核心賣點
- 一般品牌屬性

```css
background: #EEF2EC;
border-color: rgba(143, 157, 139, 0.48);
color: #52634E;
```

代表：

```text
自然、穩定、新手友善、一般正向資訊
```

## 2.2 暖光奶油金

用途：

- 熱門
- 推薦
- 季節精選
- 功能亮點
- 待出貨
- 高價值客戶

```css
background: #FBF3D1;
border-color: #D9C98F;
color: #6A5A2E;
```

代表：

```text
亮點、推薦、流程進行中、需要多看一眼
```

暖光奶油金不能大量使用，否則頁面會整體泛黃。

## 2.3 中性米灰

用途：

- 設施
- 規格
- 材質
- 一般文章主題
- 未完成但沒有風險的狀態

```css
background: #F4F0E8;
border-color: #D8CFC3;
color: #625E56;
```

代表：

```text
一般資訊、規格、分類、尚未處理
```

## 2.4 成功綠

用途：

- 已確認
- 已完成
- 已上架
- 正向狀態

淺色版本：

```css
background: #E7EFE3;
border-color: #A8BEA0;
color: #4F624A;
```

實心版本：

```css
background: #73816E;
border-color: #73816E;
color: #FFFDF9;
```

## 2.5 粉灰警示

用途：

- 已退款
- 高退貨率
- 風險
- 錯誤或反向流程

```css
background: #F4E7E4;
border-color: #D4A29D;
color: #8A4842;
```

代表：

```text
退款、風險、需要注意
```

---

# 3. 可點擊篩選標籤

圖片中的「全部、待確認、已確認、已退款」是篩選 Chip，不是訂單狀態 Badge。

## 3.1 未選

```css
background: #FFFDF9;
border: 1px solid #D8CFC3;
color: #625E56;
```

## 3.2 Hover

```css
background: #EEF2EC;
border-color: #B7C3B3;
color: #52634E;
```

## 3.3 選中

```css
background: #73816E;
border-color: #73816E;
color: #FFFDF9;
```

## 3.4 為什麼不讓「已退款」篩選按鈕直接變紅？

因為篩選列的顏色責任是表示：

```text
現在選了哪一個條件
```

不是表示：

```text
這個文字本身是什麼狀態
```

如果每個篩選按鈕都使用不同色，使用者會分不清楚哪個才是目前選中的條件。

---

# 4. 訂單狀態設計

## 4.1 待確認

意義：

```text
訂單尚未完成確認
```

設計：

```css
background: #FFFDF9;
border-color: #B9B0A3;
color: #625E56;
```

原因：

- 屬於中性待處理
- 不應比已確認更醒目
- 也不需要使用警示紅色

CSS：

```css
.yc-order-status--pending-confirmation {
  color: #625E56;
  background: #FFFDF9;
  border-color: #B9B0A3;
}
```

## 4.2 已確認

意義：

```text
訂單已成立
```

設計：

```css
background: #73816E;
border-color: #73816E;
color: #FFFDF9;
```

原因：

- 是明確的正向完成狀態
- 實心鼠尾草綠比其他狀態更容易辨認
- 不使用奶油金，避免和「流程進行中」混淆

## 4.3 已退款

意義：

```text
款項已經退回
```

設計：

```css
background: #F4E7E4;
border-color: #C97872;
color: #8A4842;
```

原因：

- 需要明確和正常訂單區分
- 使用低飽和粉灰紅，不使用鮮紅
- 有警示感，但不破壞 Yuruicamp 柔和風格

## 4.4 待出貨

意義：

```text
訂單正在準備出貨
```

設計：

```css
background: #FBF3D1;
border-color: #D7B75F;
color: #6A5A2E;
```

原因：

- 屬於流程進行中
- 暖光奶油金有等待與提醒感
- 不會像紅色一樣表示錯誤

## 4.5 已出貨

意義：

```text
商品已寄出
```

設計：

```css
background: #EEF2EC;
border-color: #8F9D8B;
color: #4F624A;
```

原因：

- 已完成出貨節點
- 但尚未代表整張訂單完全結案
- 使用淺綠，和實心「已確認」做層級差異

## 4.6 已退貨

意義：

```text
商品已經退回
```

設計：

```css
background: #F3ECE7;
border-color: #CDAA9C;
color: #7A4D40;
```

原因：

- 和「已退款」同屬反向流程
- 但退貨描述的是商品流向，不一定已完成退款
- 使用玫瑰米灰，警示程度低於已退款

---

# 5. 訂單篩選與狀態 Badge 必須同時存在時

範例：

```html
<div class="yc-order-filter">
  <button class="yc-filter-chip is-active" aria-pressed="true">全部</button>
  <button class="yc-filter-chip" aria-pressed="false">待確認</button>
  <button class="yc-filter-chip" aria-pressed="false">已確認</button>
  <button class="yc-filter-chip" aria-pressed="false">已退款</button>
  <button class="yc-filter-chip" aria-pressed="false">待出貨</button>
  <button class="yc-filter-chip" aria-pressed="false">已出貨</button>
  <button class="yc-filter-chip" aria-pressed="false">已退貨</button>
</div>

<table class="yc-data-table">
  <tr>
    <td>YC20260001</td>
    <td>
      <span class="yc-order-status yc-order-status--pending-shipment">
        待出貨
      </span>
    </td>
  </tr>
</table>
```

規則：

- 上方篩選列：選中的那一顆使用實心綠
- 表格中的狀態：使用各狀態語意色
- 不要讓篩選列本身變成七種不同顏色

---

# 6. 露營地標籤

## 6.1 環境標籤 `environment_tags`

全部使用品牌綠：

```text
高海拔
低海拔
有雲海
有溪流
森林系
```

HTML：

```html
<span class="yc-tag yc-tag--green">高海拔</span>
<span class="yc-tag yc-tag--green">有雲海</span>
<span class="yc-tag yc-tag--green">森林系</span>
```

理由：

- 都是自然與環境屬性
- 使用相同綠系可建立清楚分類
- 不需要每個環境特徵不同色

## 6.2 設施標籤 `facility_tags`

全部使用中性米灰：

```text
獨立衛浴
裝備租借
有雨棚
兒童遊樂設施
寵物友善
小木屋
可包區
```

HTML：

```html
<span class="yc-tag yc-tag--neutral">獨立衛浴</span>
<span class="yc-tag yc-tag--neutral">裝備租借</span>
<span class="yc-tag yc-tag--neutral">寵物友善</span>
```

理由：

- 屬於功能資訊
- 不應搶走露營地名稱、價格或預訂 CTA
- 和環境標籤區分後，使用者更容易掃讀

---

# 7. 文章標籤

## 7.1 新手／指南：品牌綠

```text
新手
購買指南
清單
生活技巧
```

## 7.2 季節／精選：暖光奶油金

```text
春季
夏季
```

若未來新增：

```text
秋季
冬季
編輯精選
本月推薦
```

也使用暖光奶油金。

## 7.3 其他主題：中性米灰

```text
帳篷
景點
台灣
料理
炊具
登山
裝備
輕量化
背包
防蟲
防曬
```

實作範例：

```html
<span class="yc-tag yc-tag--green">新手</span>
<span class="yc-tag yc-tag--gold">春季</span>
<span class="yc-tag yc-tag--neutral">帳篷</span>
```

---

# 8. 商品標籤

## 8.1 核心賣點：品牌綠

```text
輕量
超輕量
快速搭建
防水
防風
保暖
透氣
輕便
輕巧
耐用
折疊
快乾
隔熱
```

## 8.2 亮點特色：暖光奶油金

```text
USB充電
可調色溫
多模式
自動充氣
太陽能
```

## 8.3 規格／材質／情境：中性米灰

```text
專業
大容量
人體工學
高海拔
四季
三季
Gore-Tex
淨水
生存必備
家庭
寬敞
前庭設計
碳纖維
防震
鈦合金
日用
雙面
輕薄
天幕
豪華
```

## 8.4 品牌／風格

```text
Snow Peak → 品牌綠
日系 → 中性米灰
```

規則：

- 品牌標籤不直接使用品牌原本的 Logo 色
- 同一商品卡最多顯示 3 個標籤
- 超過 3 個使用「＋N」或放入詳細資訊
- 商品價格與購買 CTA 必須比標籤更醒目

---

# 9. 客戶標籤

## 9.1 高消費：暖光奶油金

```html
<span class="yc-tag yc-customer-tag--high-value">高消費</span>
```

## 9.2 新會員：品牌綠

```html
<span class="yc-tag yc-customer-tag--new">新會員</span>
```

## 9.3 高退貨率：粉灰警示

```html
<span class="yc-tag yc-customer-tag--high-return">高退貨率</span>
```

後台標籤使用語意色，不應和前台熱門標籤混合判斷。

---

# 10. 首頁個人化問卷

問卷標籤是可點擊 Chip，不是一般資訊標籤。

## 10.1 露營風格

```text
豪華露營 Glamping
輕量背包客
親子家庭
獨行俠
登山健行
車頂帳
極輕量
基地營
```

## 10.2 裝備偏好

```text
帳篷
睡袋
登山背包
炊具
照明設備
戶外服飾
桌椅
導航裝備
安全急救
攝影器材
```

HTML：

```html
<button class="yc-survey-chip" aria-pressed="false">
  豪華露營 Glamping
</button>

<button class="yc-survey-chip is-selected" aria-pressed="true">
  親子家庭
</button>
```

視覺狀態：

```text
未選：暖白底＋米灰框
Hover：極淺鼠尾草底
選中：實心品牌綠＋奶油白字
Disabled：淺灰底＋低對比文字
```

---

# 11. 命名規則

建議使用 BEM／語意命名：

```text
yc-tag
yc-tag--green
yc-tag--gold
yc-tag--neutral
yc-tag--success
yc-tag--danger

yc-filter-chip
yc-survey-chip

yc-order-status
yc-order-status--pending-confirmation
yc-order-status--confirmed
yc-order-status--refunded
yc-order-status--pending-shipment
yc-order-status--shipped
yc-order-status--returned
```

也可以搭配資料屬性：

```html
<span class="yc-order-status" data-order-status="confirmed">已確認</span>
```

但建議 class 和 `data-order-status` 至少使用其中一種，不要依賴文字內容做 CSS 選擇。

---

# 12. 尺寸與排版

## 一般資訊標籤

```text
高度：30px
左右 padding：11px
字級：12px
字重：600
圓角：999px
標籤間距：8px
```

## 可點擊 Chip

```text
最小高度：40px
手機最小高度：44px
左右 padding：17px
字級：14px
字重：600
圓角：999px
```

## 表格內緊湊狀態

```text
高度：26px
左右 padding：9px
字級：11px
```

所有標籤應保持：

- 相同膠囊形狀
- 相近左右留白
- 相同字重
- 相同邊框粗細
- 不因文字長度任意改變高度

---

# 13. 可及性

必須確認：

- 前景與背景對比足夠
- 可點擊 Chip 至少 44×44px（手機）
- 使用 `aria-pressed` 表達選取狀態
- Focus 不可只靠顏色
- 狀態 Badge 可搭配 Icon 或文字
- 不使用紅綠作為唯一判斷依據
- Disabled 狀態不可完全消失
- 標籤文字不要小於 11px
- 不使用閃爍、跳動或倒數動畫

---

# 14. 禁止事項

禁止：

- 每一個標籤自訂一種顏色
- 每一個篩選條件使用自己的狀態色
- 一般資訊標籤使用實心深色
- 暖光奶油金大量鋪滿整頁
- 使用鮮紅「熱賣」
- 使用亮黃「爆款」
- 使用高飽和品牌 Logo 色
- 使用漸層、發光或厚陰影
- 狀態標籤做成與主要 CTA 一樣醒目
- 用文字內容選擇 CSS，例如 `span:contains("已確認")`
- 同一個 tag 同時使用兩套 class 造成顏色衝突

---

# 15. 最終設計規則

```text
一般資訊先分功能，再選綠系或米灰。
熱門、推薦與流程進行中，才使用暖光奶油金。
完成狀態使用成功綠。
退款、退貨與高風險使用低飽和粉灰警示。
可點擊篩選只用選中／未選狀態，不讓每個選項各自變色。
```

最終口訣：

> **前台以綠系、米灰、奶油金為主；後台狀態使用語意色；不要讓每一個標籤都有自己的顏色。**

---

# 16. 完整 CSS

請搭配同目錄的：

```text
yuruicamp-tags-status.css
```

使用前先將此檔放在全站基礎 Design Tokens 之後、頁面專屬 CSS 之前載入：

```html
<link rel="stylesheet" href="../css/yuruicamp-tags-status.css">
```

若專案只能使用單一 `main.css`，可將 CSS 內容合併至：

```text
Tags / Status
```

區段，並保留註解。
