# Yuruicamp｜全站設計系統母規範 v3.2

## 奶油鼠尾草 × 輕度莫蘭迪 × 暖光奶油金導購

> 本文件是 Yuruicamp 視覺與使用體驗的**唯一設計依據（Single Source of Truth）**。  
> 品牌定位、色彩、字體、元件層級、頁面節奏、圖片、響應式與可及性皆以本文件為準。  
> CSS 實作方式、既有專案保護原則與交付流程，另見《Yuruicamp｜CSS 改版執行規格》。

---

# 1. 設計結論

Yuruicamp 不是安靜的莫蘭迪形象網站，也不是高壓促銷型商城。

最終方向：

> **舒服親切是入口，想像與放鬆讓人停留，清楚的行動促成轉換。**

整體設計語言：

```text
奶油暖白 × 鼠尾草森林綠 × 暖光奶油金 × 日系生活感
```

核心原則：

```text
背景可以安靜，主要行動不能安靜。
```

色彩角色：

```text
奶油色：建立空間、柔和、閱讀與內容承載
鼠尾草綠：品牌、探索、信任、導覽與一般互動
暖光奶油金：搜尋、預訂、購買、結帳、送出與完成
```

---

# 2. 品牌核心定位

## 2.1 品牌一句話

> **不用準備得很完美，也可以舒服地去露營。**

Yuruicamp 不是強調征服自然、裝備競賽或極限挑戰的品牌，而是讓使用者以自己的步調接近自然。

品牌提供：

- 更容易開始的露營方式
- 更舒服的戶外生活選擇
- 不製造裝備焦慮的購物體驗
- 能理解新手疑問的導購流程
- 將露營融入日常生活的選物與服務

## 2.2 品牌定位

```text
Soft Outdoor Lifestyle Commerce
輕鬆自在、具導購能力的戶外生活品牌
```

品牌核心：

> **把舒服的日常帶到戶外。**

## 2.3 品牌標語

```text
Camp at Your Own Pace.
按照自己的步調去露營。
```

---

# 3. 品牌體驗目標

使用者進站後應依序感受到：

```text
舒服 → 好奇 → 想像 → 信任 → 選擇 → 行動
```

## 第一眼：舒服

使用者應感受到：

> 「這裡看起來很舒服，我不需要很專業也能開始。」

## 第二眼：理解

使用者應清楚知道：

- 可以搜尋營區
- 可以租借或購買裝備
- 可依人數、情境與預算選擇
- 預訂與購買流程不複雜

## 第三步：行動

主要行動必須清楚可見：

- 搜尋
- 查看可訂日期
- 立即預訂
- 加入購物車
- 前往結帳

---

# 4. 視覺風格與比例

## 4.1 風格定位

```text
Japanese Soft Outdoor Minimalism
日系柔和戶外極簡
```

搭配：

```text
Dynamic Morandi Commerce
有節奏、有導購力的動態莫蘭迪電商
```

整體氛圍：

> 像森林旁的一間溫柔露營生活選物店，有晨光、亞麻、原木、咖啡與舒服的空間；但需要做決定時，會明確指出下一步。

## 4.2 建議比例

```text
45% 奶油暖白與內容留白
25% 極淺鼠尾草與奶油鼠尾草區塊
12% 中階品牌綠
8% 燕麥、亞麻與霧米色
5% 深灰綠文字
5% 暖光奶油金 CTA 與提示
```

注意：

- 25% 綠色不代表全部使用深綠
- 品牌感主要透過淺綠區塊與中綠元件反覆出現
- 深綠只用於 Header、品牌按鈕、局部標題與 Footer
- 暖光暖光奶油金只用於真正的重要行動

---

# 5. 核心 Design Tokens

正式專案統一使用 `--yc-*` 命名，避免同時維護 `--color-*` 與 `--yc-*` 兩套變數。



```css
:root {
  /* Base / Cream */
  --yc-bg: #F8F5EE;
  --yc-surface: #FFFDF9;
  --yc-surface-soft: #F0ECE3;
  --yc-oat: #E8E0D5;
  --yc-border: #D8CFC3;

  /* Sage Brand */
  --yc-sage-mist: #EEF2EC;
  --yc-sage-soft: #DCE5DA;
  --yc-sage-light: #B7C3B3;
  --yc-sage: #8F9D8B;
  --yc-sage-action: #73816E;
  --yc-sage-dark: #62705D;

  /* Conversion CTA — Warm Cream Gold */
  --yc-cta: #E2D39A;
  --yc-cta-hover: #D4C27E;
  --yc-cta-active: #C4AF62;
  --yc-cta-soft: #FBF3D1;
  --yc-cta-line: #D9C98F;
  --yc-on-cta: #4A4537;

  /* Text */
  --yc-text: #3E473D;
  --yc-text-secondary: #625E56;
  --yc-text-muted: #7B756D;

  /* Status */
  --yc-success: #73816E;
  --yc-success-soft: #EEF2EC;
  --yc-warning: #9A7455;
  --yc-warning-soft: #F4ECE2;
  --yc-error: #A65F58;
  --yc-error-soft: #F4E7E4;

  /* Header / Footer */
  --yc-header-bg: #73816E;
  --yc-footer-bg: #71806D;
  --yc-footer-bottom: #62705D;
  --yc-on-dark: #FFFDF9;
  --yc-on-dark-muted: rgba(255, 253, 249, 0.76);

  /* Shadow */
  --yc-shadow-soft: 0 5px 20px rgba(60, 70, 59, 0.065);
  --yc-shadow-hover: 0 16px 38px rgba(60, 70, 59, 0.13);
  --yc-shadow-cta: 0 8px 22px rgba(129, 111, 54, 0.14);

  /* Radius */
  --yc-radius-sm: 10px;
  --yc-radius-control: 12px;
  --yc-radius-button: 12px;
  --yc-radius-card: 19px;
  --yc-radius-section: 24px;
  --yc-radius-pill: 999px;

  /* Spacing */
  --yc-space-1: 4px;
  --yc-space-2: 8px;
  --yc-space-3: 12px;
  --yc-space-4: 16px;
  --yc-space-5: 24px;
  --yc-space-6: 32px;
  --yc-space-7: 48px;
  --yc-space-8: 64px;
  --yc-space-9: 80px;
  --yc-space-10: 96px;

  /* Typography */
  --yc-font-global: "Noto Serif TC", "Source Han Serif TC", serif;
  --yc-font-heading: "Noto Serif TC", "Source Han Serif TC", serif;
  --yc-font-body: "Noto Sans TC", "Source Han Sans TC", sans-serif;

  /* Motion */
  --yc-duration-fast: 180ms;
  --yc-duration-normal: 220ms;
  --yc-ease-soft: cubic-bezier(.2, .7, .2, 1);
}
```

## 5.1 暖光奶油金 CTA 使用原則

`#FBF3D1` 是本色系的柔和底色，不直接作為唯一主按鈕色。為了維持辨識度與文字對比，CTA 採用同色系階層：

```text
#FBF3D1  CTA Soft／提示底色／重複卡片預設
#E2D39A  主要 CTA
#D4C27E  Hover
#C4AF62  Active
#D9C98F  外框與分隔
#4A4537  CTA 文字
```

使用原則：

- 主 CTA 使用 `#E2D39A` 搭配深灰褐文字
- 大量重複卡片使用 `#FBF3D1`
- Hover 只稍微加深，不使用亮橘或深棕
- 一個區塊仍只保留一顆主要 CTA
- 暖光奶油金不作大面積背景，也不取代品牌綠
- 危險操作仍使用 `--yc-error`，不可使用奶油金

---

# 6. 色彩使用邏輯

## 6.1 奶油色

負責：

- 全站背景
- 卡片與表單
- Modal
- 商品資訊
- 閱讀內容
- 留白
- 高密度資訊承載

## 6.2 鼠尾草綠

負責：

- Header 與 Footer
- 品牌識別
- 區塊背景
- Icon
- 分類入口
- 查看詳情
- 探索與閱讀
- 信任資訊
- 選中狀態

## 6.3 暖光奶油金

只負責：

- 搜尋
- 查看可訂日期
- 立即預訂
- 加入購物車
- 立即購買
- 前往結帳
- 完成付款
- 送出申請
- 訂閱電子報

## 6.4 禁止用法

禁止：

- 所有按鈕都使用暖光奶油金
- 所有按鈕都使用綠色
- 大面積暖光奶油金背景
- 深咖啡色按鈕
- 黃棕色社群 Icon
- Header、Footer 同時過深
- 全站只剩奶油白，讓品牌綠消失
- 全站灰化，導致價格與 CTA 不明顯
- 使用顯眼紅色、亮橘、螢光綠、科技藍或純黑

---

# 7. 字體系統

## 7.0 全域字體

全站所有元素統一套用思源宋體作為基礎字體：

```css
*, *::before, *::after {
  font-family: var(--yc-font-global); /* "Noto Serif TC", "Source Han Serif TC", serif */
}
```

UI 元件（按鈕、表單、導覽）若需切換為無襯線體，以 `font-family: var(--yc-font-body)` 個別覆蓋。

## 7.1 標題

```text
Noto Serif TC
Source Han Serif TC
思源宋體
```

適用：

- Hero 標題
- 頁面標題
- 區塊標題
- 品牌故事
- 文章標題
- 情境卡片標題

字重：

```text
Hero：600
頁面標題：600
區塊標題：600
卡片標題：600
```

## 7.2 UI 與內文

```text
Noto Sans TC
Source Han Sans TC
Inter
```

適用：

- 導覽
- 商品資訊
- 價格
- 按鈕
- 表單
- 標籤
- 篩選條件
- 說明文字

字重：

```text
內文：400
輔助文字：400
按鈕：600–700
價格：600–700
```

禁止大量使用 800–900 粗體，也不要讓內文過細。

---

# 8. 圓角、陰影、間距與動畫

## 8.1 圓角

```text
Icon：10px–12px
輸入框：12px
按鈕：12px–14px
卡片：18px–20px
大型區塊：22px–26px
膠囊標籤：999px
```

## 8.2 陰影

一般：

```css
box-shadow: var(--yc-shadow-soft);
```

Hover：

```css
box-shadow: var(--yc-shadow-hover);
```

禁止純黑厚陰影、多層 3D 陰影與過度漂浮感。

## 8.3 間距

採 8px 為主要基準：

```text
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80 / 96px
```

主要區塊上下距離：

```text
桌面：72px–96px
平板：56px–72px
手機：44px–64px
```

## 8.4 動畫

適合：

- 卡片 Hover 上移 2px–4px
- 圖片放大至 1.02–1.03
- CTA Hover 稍微變深
- 內容淡入並上移 8px–16px
- 收藏 Icon 輕微縮放
- 互動時間 180ms–240ms

不適合：

- 彈跳或閃爍
- 高速滑入
- 大幅旋轉
- 過度視差
- 大量飄浮裝飾
- 每張卡片同時飛入

原則：

> **有生命，但不躁動。**

---

# 9. 全站版面節奏

避免：

```text
白底 → 標題 → 卡片 → 白底 → 標題 → 卡片
```

推薦節奏：

```text
奶油 Hero
→ 淺鼠尾草快速入口
→ 奶油商品／營地列表
→ 暖白信任資訊
→ 淺鼠尾草品牌故事或新手指南
→ 奶油內容文章
→ 淺綠最終 CTA
→ 中綠 Footer
```

每滑動 1–2 個區塊，應重新出現一次品牌綠，但不要一直使用深綠滿版。

---

# 10. Header

Header 使用中階鼠尾草綠：

```css
background: rgba(115, 129, 110, 0.96);
color: var(--yc-on-dark);
border-bottom: 1px solid rgba(255, 253, 249, 0.14);
backdrop-filter: blur(14px);
```

規則：

- Logo 使用奶油白
- 導覽預設使用約 82% 奶油白
- Hover／Active 使用完整奶油白
- Active 可使用細線、小圓點或淡綠膠囊
- Header 最多一顆奶油金 CTA
- 搜尋、收藏、會員、購物袋 Icon 維持奶油白

禁止：

- 使用過深灰綠
- Active 使用黃色或咖啡色
- 多顆奶油金按鈕
- 一般 Icon 使用暖光奶油金

---

# 11. Hero

Hero 任務：

1. 說明網站用途
2. 建立生活想像
3. 提供第一個清楚行動

圖片應包含：

- 奶油帳篷
- 鼠尾草綠用品
- 森林晨光
- 原木與亞麻
- 咖啡
- 真實人物放鬆互動
- 低對比自然環境

遮罩：

```css
background: linear-gradient(
  90deg,
  rgba(248, 245, 238, 0.95) 0%,
  rgba(248, 245, 238, 0.78) 38%,
  rgba(248, 245, 238, 0.12) 70%
);
```

主要 CTA 使用奶油金；次要 CTA 使用暖白底＋綠框。

避免暗森林、戰術露營、高對比 HDR、鮮橘帳篷與黑色重裝備。

---

# 12. 按鈕系統

## 12.1 Conversion CTA

用途：

- 搜尋
- 預訂
- 購買
- 加入購物車
- 查看詳請
- 下一步
- 結帳
- 付款
- 送出
- 登入


樣式：

```css
background: var(--yc-cta);
color: var(--yc-on-cta);
border: 1px solid var(--yc-cta);
```

Hover 使用 `--yc-cta-hover`，Active 使用 `--yc-cta-active`。

## 12.2 Brand Action

用途：

- 查看詳情
- 探索組合
- 閱讀指南
- 查看文章
- 了解更多
- 修改條件

樣式：

```css
background: var(--yc-sage-action);
color: var(--yc-on-dark);
border: 1px solid var(--yc-sage-action);
```

## 12.3 Secondary

用途：

- 返回
- 修改
- 繼續瀏覽
- 查看其他選擇

樣式：

```css
background: var(--yc-surface);
color: var(--yc-sage-action);
border: 1px solid var(--yc-sage);
```

## 12.4 Soft Conversion

用於大量重複商品卡與營區卡：

```css
background: var(--yc-cta-soft);
color: var(--yc-cta);
border: 1px solid var(--yc-cta-line);
```

Hover 轉為較深的暖光奶油金，文字仍維持深灰綠。

## 12.5 Text Action

用於：

- 清除
- 關閉
- 稍後再看
- 返回上一頁
- 查看全部

保持透明背景，以文字層級呈現。



---

# 13. 卡片、標籤與表單

## 13.1 卡片

```css
background: var(--yc-surface);
border: 1px solid rgba(216, 207, 195, 0.82);
border-radius: var(--yc-radius-card);
box-shadow: var(--yc-shadow-soft);
```

Hover：

- 上移 4px 以內
- 邊框轉 `--yc-sage-light`
- 使用 `--yc-shadow-hover`
- 圖片最大放大至 1.025

分類卡片可交替使用：

```text
#FFFDF9 / #EEF2EC / #F0ECE3 / #DCE5DA
```

## 13.2 標籤

綠色標籤用於：

```text
新手友善、森林系、適合家庭、輕鬆好收、一人也適合
```

暖光標籤只用於：

```text
本週熱門、即將額滿、推薦搭配、限時可訂
```

**禁止鮮紅熱賣、亮黃爆款、大型折扣角標與倒數閃爍。**

## 13.3 表單

一般欄位：

```css
background: var(--yc-surface);
color: var(--yc-text);
border: 1px solid var(--yc-border);
border-radius: var(--yc-radius-control);
```

Focus：

```css
border-color: var(--yc-sage);
box-shadow: 0 0 0 3px rgba(143, 157, 139, 0.17);
```

Checkbox／Radio 使用 `--yc-sage-action`。錯誤狀態使用 `--yc-error` 與 `--yc-error-soft`。

---

# 14. 頁面規範

## 14.1 首頁

建議順序：

1. Announcement
2. Header
3. Hero
4. 搜尋／導購入口
5. 信任資訊
7. 人氣情境組合
8. 精選營區或商品
9. 品牌故事
11. 最終導購 CTA
12. Footer

首頁不能只有商品列表。

## 14.2 搜尋與篩選頁

- 搜尋按鈕：實心奶油金
- Checkbox／價格滑桿：鼠尾草綠
- 重設篩選：暖白底＋綠框
- 查看詳情：綠框
- 查看可訂日期：淡奶油金
- 熱門項目立即預訂：實心奶油金
- 信任資訊：淺綠或綠色文字

## 14.3 商品分類

- 奶油背景
- 暖白商品卡
- 淺綠分類入口
- 綠色篩選與排序
- 淡奶油金加入購物車
- Hover 轉實心奶油金

## 14.4 商品詳情

同時存在兩個交易按鈕時：

```text
立即購買 → 實心奶油金
加入購物車 → 淡奶油金或奶油金外框
```

收藏使用綠框或 Icon；查看搭配使用綠色。

## 14.5 營區詳情

首屏需清楚顯示：

- 地區、評價、價格
- 適合人數
- 可訂日期
- 設施
- 取消政策
- 立即預訂

預訂盒使用暖白卡片、綠色日期選中狀態、奶油金主要 CTA 與淺綠信任資訊。

## 14.6 購物車

```text
前往結帳 → 實心奶油金
繼續購物 → 綠框
套用優惠碼 → 綠色
刪除 → 柔磚紅文字
```

## 14.7 結帳

結帳頁比首頁更安靜：

```text
70% 奶油與暖白
20% 淺綠提示
10% 奶油金行動
```

主要付款、確認與送出按鈕使用實心奶油金。

## 14.8 會員中心

- 奶油背景
- 暖白資訊卡
- 綠色導覽
- 淺綠選中狀態
- 暖光奶油金只用於付款、續訂、再次購買
- 危險操作使用柔磚紅

## 14.9 文章與內容頁

- 大量留白
- 圖片作為主要視覺
- 標籤使用淺綠
- 閱讀更多使用綠色
- 無商品導購時不使用奶油金 CTA
- 文章主欄寬度 680px–760px

## 14.10 品牌故事、FAQ、聯絡

品牌故事：

- 圖文交錯
- 淺鼠尾草大區塊
- 暖光奶油金只用於最終 CTA 或少量細節

FAQ：

- 暖白 Accordion
- 展開狀態使用淺綠
- Arrow 使用品牌綠
- 聯絡客服使用綠色
- 送出表單使用奶油金

聯絡頁：

- 表單暖白
- Focus 綠色
- 送出按鈕奶油金
- 聯絡資訊使用淺綠卡片

---

# 15. 信任元件

可重複使用：

- 安心取消
- 即時庫存
- 安全付款
- 新手搭配
- 免費諮詢
- 租借清潔
- 配送說明
- 退換貨政策

信任元件不使用暖光奶油金。

建議：

```css
background: var(--yc-surface);
border: 1px solid var(--yc-border);
border-radius: 16px;
```

Icon 使用淺綠背景與品牌綠。

---

# 16. 圖像與攝影

圖片色彩比例：

```text
奶油與亞麻：35%–45%
自然綠：30%–40%
木質暖色：15%–20%
奶油金暖色：5% 以下
```

圖片應出現：

- 鼠尾草綠椅子
- 灰綠收納箱
- 綠色杯具
- 草地與苔蘚
- 森林晨光
- 奶油帳篷
- 原木桌
- 亞麻布
- 真實人物互動

避免：

- 全部偏黃或咖啡棕
- 高飽和橘色用品
- 冷藍棚拍
- 黑色戰術裝備
- 高對比 HDR
- 完全無人物的型錄感

調色：

- 降低彩度，但膚色不能灰
- 綠色不能偏黃螢光
- 木材偏自然灰棕
- 暗部保留細節
- 奶油白保持乾淨、不泛黃

---

# 17. Footer

主 Footer：

```css
background: var(--yc-footer-bg);
color: var(--yc-on-dark);
```

Bottom Bar：

```css
background: var(--yc-footer-bottom);
color: rgba(255, 253, 249, 0.66);
```

社群按鈕預設為奶油白線框；Hover 可轉暖白底＋奶油金 Icon。

禁止：

- Footer 主區過深
- 深綠背景搭配暗咖啡 Icon
- 黃銅色 Icon
- 各平台永久使用品牌色
- 社群 Icon 永久使用奶油金

---

# 18. 響應式與可及性

## 18.1 手機版

- Header 高度 64px–68px
- 隱藏次要導覽
- 保留 Logo、會員、購物袋
- 搜尋欄改為單欄或 2 欄
- 日期欄全寬
- 搜尋 CTA 全寬
- 商品與營區卡改為單欄
- Footer 使用單欄或 Accordion
- 深色區塊不要過高

## 18.2 可及性

必須確認：

- 正文與背景符合 WCAG AA
- 按鈕不只靠顏色區分
- `:focus-visible` 清楚
- 一般按鈕至少 44px 高
- Icon Button 至少 40px × 40px
- 手機可點擊範圍至少 44px × 44px
- Disabled 狀態清楚
- 錯誤訊息有文字
- 選中狀態有背景、邊框或 Icon
- 深綠背景的小字使用奶油白

---

# 19. 各頁 CTA 對照

| 頁面 | 主要 CTA | 次要操作 |
|---|---|---|
| 首頁 | 開始挑選、搜尋、立即預訂 | 查看組合、閱讀指南 |
| 營區搜尋 | 搜尋營區、查看可訂日期 | 查看詳情、重設 |
| 營區詳情 | 立即預訂 | 收藏、查看設施 |
| 商品分類 | 加入購物車 | 查看商品、篩選 |
| 商品詳情 | 立即購買／加入購物車 | 收藏、查看搭配 |
| 購物車 | 前往結帳 | 繼續購物、修改 |
| 結帳 | 完成付款 | 返回購物車 |
| 會員中心 | 再次購買、付款 | 查看訂單、修改資料 |
| 文章 | 商品導購時才用奶油金 | 閱讀更多、查看文章 |
| FAQ／聯絡 | 送出表單 | 查看 FAQ、聯絡方式 |

---

# 20. 全站驗收清單

## 品牌

- [ ] 第一眼是否舒服、親切？
- [ ] 是否能辨識奶油鼠尾草綠品牌？
- [ ] 綠色是否透過淺綠區塊與中綠元件呈現？
- [ ] 是否避免軍綠、螢光綠與老派咖啡棕？

## CTA

- [ ] 能否一眼找到主要行動？
- [ ] 同一區塊是否只有一顆實心暖光奶油金 CTA？
- [ ] 搜尋、預訂、購買、結帳是否使用一致 CTA？
- [ ] 瀏覽、閱讀與查看是否使用綠色？
- [ ] 重複卡片是否優先使用 Soft Conversion？

## 版面

- [ ] 是否有奶油、淺綠、暖白的區塊節奏？
- [ ] 是否避免所有區塊都是白底卡片？
- [ ] 是否每 1–2 區塊重新出現品牌綠？
- [ ] 是否有留白，但不會安靜到失去導購？

## 圖片

- [ ] 是否包含自然綠與鼠尾草綠？
- [ ] 是否避免整體偏黃、偏咖啡？
- [ ] 是否有生活情境，而不只有商品照？
- [ ] 是否能讓人想像使用後的生活？

## Footer

- [ ] 主區是否為中階綠？
- [ ] 是否只有 Bottom Bar 使用較深綠？
- [ ] 社群 Icon 是否為奶油白線框？
- [ ] 是否避免深咖啡與黃銅色？

## 可用性

- [ ] Focus 是否清楚？
- [ ] 手機按鈕是否至少 44px？
- [ ] 對比是否足夠？
- [ ] 重要狀態是否不只靠顏色？
- [ ] 錯誤、成功與空狀態是否有文字？

---

# 21. 最終設計口訣

```text
奶油色負責舒服
鼠尾草綠負責品牌與探索
暖光奶油金負責下一步
```

最終體驗：

> **讓使用者進來時覺得舒服，往下滑時保持好奇，做決定時不需要猜。**
