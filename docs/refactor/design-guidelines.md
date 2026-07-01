# Yuruicamp Design Guidelines

## 品牌定位

Yuruicamp 正式設計方向以奶油白作為主要空間基底，鼠尾草綠作為品牌主色，亞麻與燕麥色作為中性輔助，整體呈現日系生活選物、森林晨光、低飽和與溫柔留白的氛圍。

核心感受：

- 奶油
- 文青
- 療癒
- 自然
- 低飽和
- 森林晨光
- 日系生活選物
- 溫柔留白

## 設計原則

1. 奶油白必須是畫面占比最高的顏色。
2. 鼠尾草綠是品牌主色，不得降為單純狀態色。
3. 深鼠尾草綠用於主要操作、Footer、Active 狀態與深層品牌層級。
4. 標準鼠尾草綠用於品牌識別、圖示、章節點綴與裝飾。
5. 淺鼠尾草綠用於選中狀態、標籤、柔和區塊與次要互動。
6. 亞麻與燕麥色負責陪襯與過渡，不搶品牌主視覺。
7. 避免高飽和色與冷灰破壞柔和氛圍。

## 色彩系統

### A. 奶油與表面色

| 用途 | Token | 色碼 |
| --- | --- | --- |
| 奶油背景 | `--yr-color-bg` | `#FAF7ED` |
| 暖瓷白 | `--yr-color-surface` | `#FFFDF8` |
| 淺奶茶 | `--yr-color-surface-muted` | `#F3EBDD` |
| 燕麥色 | `--yr-color-surface-oat` | `#EAE0D2` |

### B. 鼠尾草品牌色

| 用途 | Token | 色碼 |
| --- | --- | --- |
| 極淺鼠尾草綠 | `--yr-color-brand-pale` | `#E1E9DC` |
| 淺鼠尾草綠 | `--yr-color-brand-soft` | `#C7D4C1` |
| 品牌鼠尾草綠 | `--yr-color-brand` | `#9EAD96` |
| 深鼠尾草綠 | `--yr-color-brand-strong` | `#74846F` |
| Hover 鼠尾草綠 | `--yr-color-brand-hover` | `#62715E` |

### C. 亞麻與中性色

| 用途 | Token | 色碼 |
| --- | --- | --- |
| 亞麻米色 | `--yr-color-accent` | `#DCCFBE` |
| 邊框 | `--yr-color-border` | `#E2D8CA` |
| 主要文字 | `--yr-color-text` | `#3F463D` |
| 次要文字 | `--yr-color-text-muted` | `#625B53` |
| 輔助文字 | `--yr-color-text-subtle` | `#827A71` |

### D. 狀態色

| 用途 | Token | 色碼 |
| --- | --- | --- |
| Success | `--yr-color-success` | `#9EAD96` |
| Success Soft | `--yr-color-success-soft` | `#E1E9DC` |
| Warning | `--yr-color-warning` | `#DCCFBE` |
| Warning Soft | `--yr-color-warning-soft` | `#F3EBDD` |
| Danger | `--yr-color-danger` | `#827A71` |
| Danger Soft | `--yr-color-danger-soft` | `#EAE0D2` |
| Info | `--yr-color-info` | `#74846F` |
| Info Soft | `--yr-color-info-soft` | `#E1E9DC` |

### 色彩使用規則

- 奶油白與暖瓷白為整體主要面積，不得被深綠或重色大面積覆蓋。
- 鼠尾草綠必須維持品牌識別角色，不可只留在成功或自然狀態。
- 分類卡片應交錯使用奶茶色、燕麥色與淺鼠尾草綠，避免連續大面積深綠塊。
- Header 使用暖瓷白，不使用深綠背景。
- Footer 使用深鼠尾草綠，作為頁尾收束色。
- 不得新增亮綠、螢光綠、高飽和黃或亮橘。

## 字體系統

- 標題：`Noto Serif TC`, `Source Han Serif TC`, serif
- 內文：`Noto Sans TC`, `Source Han Sans TC`, sans-serif
- 文字以深灰綠與暖中性灰建立層級，不使用純黑。

## 間距系統

- 優先維持寬鬆留白。
- 區塊與卡片之間使用 `lg` 與 `xl` 間距營造呼吸感。
- 不以高密度堆疊換取視覺存在感。

## 圓角系統

- 小元件：`--yr-radius-sm`
- 表單 / Alert：`--yr-radius-md`
- 卡片 / 區塊：`--yr-radius-lg`
- 膠囊元件：`--yr-radius-pill`

## 陰影系統

- 陰影只保留柔和浮起感。
- 陰影顏色偏灰綠中性，不使用冷灰。
- 陰影透明度需低，避免厚重壓迫感。

## 按鈕規範

- 主按鈕：`--yr-color-brand-strong`
- Hover：`--yr-color-brand-hover`
- 次按鈕：`--yr-color-brand-soft`
- Outline：暖瓷白底搭配品牌鼠尾草綠邊框
- 柔和提醒操作：亞麻米色系

## 表單規範

- 欄位底色維持 `--yr-color-surface`
- 邊框使用 `--yr-color-border`
- Focus 使用深鼠尾草綠與低透明 focus ring
- Checkbox / Radio 使用深鼠尾草綠作為勾選色

## 卡片規範

- 卡片邊框使用 `--yr-color-border`
- 卡片主背景以暖瓷白為基礎
- 列表與分類卡片交錯使用淺奶茶、燕麥色與淺鼠尾草綠
- 不要將三個大型綠色色塊連續排列

## 狀態標籤規範

- Success：鼠尾草綠系
- Warning：亞麻米色系
- Danger：暖灰中性色系
- Info：深鼠尾草綠系

## 主站設計原則

- 主站整體基底以奶油背景與暖瓷白表面為主。
- 品牌導覽、章節標誌與圖示可使用標準鼠尾草綠。
- 主要 CTA 與 active 狀態使用深鼠尾草綠。

## 預約系統設計原則

- 高資訊密度畫面仍維持奶油基底與柔和表面色。
- 選中狀態可使用淺鼠尾草綠。
- 提醒與輔助說明優先使用亞麻與燕麥色。

## 後台設計原則

- 後台可增加層級對比，但不改變品牌主色方向。
- Footer、側邊 active 或強調操作可使用深鼠尾草綠。
- 仍避免純黑與冷灰。

## RWD 原則

- 色票與元件示例在小尺寸畫面需保持換行與留白。
- 品牌色塊在行動版避免形成過長的深綠連續區域。

## 無障礙原則

- 主要文字與深鼠尾草綠按鈕需維持可讀對比。
- 狀態不可僅依靠色彩，需要搭配文案。
- Focus 狀態必須可見。

## 禁止事項

- 不得把鼠尾草綠降為單純輔助色
- 不得重新引入暖灰褐作為主要品牌色
- 不得新增亮綠、螢光綠、高飽和黃或亮橘
- 不得以深綠大量覆蓋整個主內容區
