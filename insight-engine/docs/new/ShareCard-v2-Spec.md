# ShareCard v2 — 完整開發規格書

> SnowRealm Insight 分享卡系統重構
> 版本：v2.0 | 日期：2026-03-30
> 目標：四種戰術版型 + PNG/MP4 高清儲存 + html2canvas 模糊修復

---

## 一、系統架構總覽

### 1.1 卡型定義

```typescript
type ShareCardType = 'emotional' | 'identity' | 'authority' | 'professional';

interface ShareCardConfig {
  type: ShareCardType;
  route: string;           // 出現在哪個頁面
  purpose: string;         // 策略目的
  targetAudience: string;  // 目標受眾
  dimensions: {
    width: number;         // 設計稿寬度 (px)
    height: number;        // 設計稿高度 (px)
    exportScale: number;   // 輸出倍率
  };
}
```

### 1.2 四種卡型對照表

| 卡型 | 路由 | 目的 | 受眾 | 設計語言 |
|------|------|------|------|----------|
| emotional | /done | 情緒炫耀 + 分享 | 剛填完問卷的人 | 深紫星空、發光文字、零數據 |
| identity | /story/[responseId] | 社群滲透 | 瀏覽故事的人 | 暖金 IG 風、語錄＋標籤 |
| authority | /insight-admin/insight | 陌生流量入口 | 未註冊的陌生人 | 暗黑科技、大數字衝擊 |
| professional | /report/[slug] | B端轉換 | 企業決策者 | 純白極簡、白皮書風格 |

### 1.3 檔案結構

```
src/
├── components/
│   └── share-cards/
│       ├── index.ts                    # 統一匯出
│       ├── types.ts                    # 共用型別
│       ├── ShareCardRenderer.tsx       # 卡片渲染入口（根據 type 分派）
│       ├── ShareCardModal.tsx          # 包裝 Modal（複製連結 + 分享按鈕）
│       ├── cards/
│       │   ├── EmotionalCard.tsx       # 情緒爆發卡
│       │   ├── IdentityCard.tsx        # 人格投射卡
│       │   ├── AuthorityCard.tsx       # 權威數據卡
│       │   └── ProfessionalCard.tsx    # 專業背書卡
│       ├── hooks/
│       │   ├── useShareCardExport.ts   # PNG + MP4 匯出邏輯
│       │   └── useShareCardData.ts     # 從 API/context 取得卡片數據
│       └── utils/
│           ├── exportPng.ts            # modern-screenshot 封裝
│           ├── exportMp4.ts            # MediaRecorder 封裝
│           └── cardAnimations.ts       # 動畫時序配置
```

---

## 二、共用型別定義

```typescript
// types.ts

export type ShareCardType = 'emotional' | 'identity' | 'authority' | 'professional';

export interface ShareCardData {
  type: ShareCardType;
  surveyTitle?: string;
  surveyThemeColor?: string;
  brandUrl?: string;  // 預設 "insight.snowrealm.pet"
}

export interface EmotionalCardData extends ShareCardData {
  type: 'emotional';
  resultTitle: string;        // e.g. "靈魂型照顧者"
  quote: string[];            // 逐行文案，最多 3 行
  ctaText?: string;           // e.g. "來看看你是哪一種？"
}

export interface IdentityCardData extends ShareCardData {
  type: 'identity';
  userName: string;
  userInitial: string;        // 頭像字母
  storyExcerpt: string;       // 語錄（最多 2 行）
  tags: string[];             // e.g. ["#重感情", "#怕失去"]
  stats: Array<{
    label: string;
    value: number;            // 0-100
    average: number;          // 0-100
  }>;
}

export interface AuthorityCardData extends ShareCardData {
  type: 'authority';
  headlineNumber: number;     // e.g. 87
  headlineUnit: string;       // e.g. "%"
  headlineText: string;       // e.g. "的人其實還沒準備好養寵物"
  bars: Array<{
    label: string;
    percentage: number;
  }>;
  insightQuote: string;       // e.g. "大多數人以為是陪伴，其實是情感依附。"
}

export interface ProfessionalCardData extends ShareCardData {
  type: 'professional';
  reportTitle: string;        // e.g. "寵物情感依附"
  reportSubtitle: string;     // e.g. "白皮書"
  period: string;             // e.g. "2026 Q1"
  findings: Array<{
    value: string;            // e.g. "68%"
    description: string;
  }>;
}

export type AnyCardData =
  | EmotionalCardData
  | IdentityCardData
  | AuthorityCardData
  | ProfessionalCardData;
```

---

## 三、各卡型設計規格

### 3.1 情緒爆發卡 (EmotionalCard)

**設計尺寸：** 360 × 640px（9:16 適合 IG 限動）
**匯出尺寸：** 1080 × 1920px（scale: 3）

#### 色彩系統
```css
--emo-bg: #0a0a12;
--emo-purple: #8b5cf6;
--emo-purple-light: #c4b5fd;
--emo-pink: #f9a8d4;
--emo-gold: #fef3c7;
--emo-text: rgba(255, 255, 255, 0.75);
--emo-text-muted: rgba(255, 255, 255, 0.3);
```

#### 排版結構（由上到下）
1. **品牌徽章** — 圓角 pill，左邊脈衝圓點 + "SNOWREALM INSIGHT" 大寫字母間距
2. **前標** — "你的測驗結果"，12px，淡色
3. **主標題** — 結果名稱，38px 粗體，4 色漸變（白→紫→粉→金）
4. **裝飾線** — 從左向右漸隱，48px 寬
5. **核心語錄** — 3 行，20px 襯線體，最後一句重點色 + 底線
6. **底部** — CTA 文字 + URL + 箭頭按鈕

#### 背景層
- 底層：純色 #0a0a12
- 發光層：2-3 個 radial-gradient 橢圓（紫 + 粉），配合緩慢 hue-rotate 動畫
- 星星層：30-35 個小圓點，隨機位置，twinkle 動畫（opacity + scale 交替）

#### 動畫時序
```
0.0s — 卡片出現
0.3s — 品牌徽章 fadeUp
0.5s — 前標 fadeUp
0.7s — 主標題 fadeUp（0.8s 持續時間）
1.2s — 裝飾線從 width:0 生長到 48px
1.4s — 語錄第 1 行 fadeUp
1.7s — 語錄第 2 行 fadeUp
2.0s — 語錄第 3 行 fadeUp
2.4s — 重點字底線從 right:100% 生長到 right:0
2.6s — 底部 fadeIn
持續 — 星星 twinkle (3s loop)、背景 hue-rotate (8s loop)、圓點脈衝 (2s loop)
```

#### html2canvas 注意事項
- 標題漸變色：用 `background: linear-gradient` + `-webkit-background-clip: text`
  - ⚠️ html2canvas 對 background-clip: text 支援不穩定
  - **Fallback：** 匯出時改用純色 `#d8b4fe`，或改用 modern-screenshot
- 發光圓點 box-shadow：匯出時可能消失，改用 radial-gradient 背景模擬
- filter: blur 的星星：匯出安全（blur 在子元素上，不是父容器）

---

### 3.2 人格投射卡 (IdentityCard)

**設計尺寸：** 360 × 640px
**匯出尺寸：** 1080 × 1920px（scale: 3）

#### 色彩系統
```css
--id-bg: #f8f6f1;
--id-gold: #c9956a;
--id-gold-light: #e8d5b7;
--id-gold-dark: #b08d5e;
--id-card-bg: #ffffff;
--id-quote-bg: #f2efe8;
--id-text: #2a2a2a;
--id-text-muted: #999999;
```

#### 排版結構（由上到下）
1. **頂部色塊** — 160px 高，金色漸層，內含 45° 斜線紋理（opacity 0.1），紋理緩慢滑動動畫
2. **頭像** — 72px 正方 rounded-20px，白底＋使用者首字母，向上浮出色塊 36px
3. **使用者名稱** — 20px 粗體 + "的寵物故事" 副標
4. **語錄區** — 白色圓角卡片，左上大引號裝飾，襯線體 16px
5. **標籤列** — pill 形標籤，金色系
6. **數據對比** — "你 vs 平均" 小標 + 3 條水平進度條
7. **底部** — CTA + URL

#### 動畫時序
```
0.3s — 頭像 popIn（cubic-bezier 彈跳）
0.5s — 名稱 fadeUp
0.6s — 副標 fadeUp
0.7s — 語錄區 fadeUp
0.9s — 標籤 1 fadeUp
1.0s — 標籤 2 fadeUp
1.1s — 標籤 3 fadeUp
1.2s — "你 vs 平均" fadeIn
1.3s — 數據條 1 fadeUp + bar 從 0 滑動到目標值 (0.8s transition)
1.5s — 數據條 2 fadeUp + bar 滑動
1.7s — 數據條 3 fadeUp + bar 滑動
2.2s — 底部 fadeIn
持續 — 頂部紋理 patternSlide (20s loop)
```

#### 數據條實作
```tsx
// 注意：bar-fill 的 width 不能用 CSS animation
// 要用 JS 在元素可見後設定 transition + 目標 width
// 否則 html2canvas 截圖時會截到 width: 0 的狀態

// 方案：用 ref + useEffect 延遲設定
const barRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const timer = setTimeout(() => {
    if (barRef.current) {
      barRef.current.style.transition = 'width 0.8s cubic-bezier(.22,1,.36,1)';
      barRef.current.style.width = `${value}%`;
    }
  }, delay);
  return () => clearTimeout(timer);
}, [value, delay]);
```

---

### 3.3 權威數據卡 (AuthorityCard)

**設計尺寸：** 360 × 640px
**匯出尺寸：** 1080 × 1920px（scale: 3）

#### 色彩系統
```css
--auth-bg: #08090d;
--auth-orange: #f97316;
--auth-orange-muted: rgba(249, 115, 22, 0.6);
--auth-text: #c9d1d9;
--auth-text-muted: rgba(201, 209, 217, 0.4);
--auth-grid: rgba(255, 255, 255, 0.02);
```

#### 排版結構（由上到下）
1. **標籤** — 橘色小方點 + "AI INSIGHT REPORT" 大寫
2. **大數字** — 88px 超粗體白色 + 橘色百分號，從 0 跳動到目標值
3. **說明文** — 15px，關鍵詞橘色
4. **數據條組** — 4 條，橘色漸層填充
5. **洞察語錄** — 半透明橘色邊框卡片，襯線體
6. **底部** — CTA + 品牌

#### 背景層
- 底層：深黑漸層
- Grid 層：24px 間距細線網格（opacity 0.02）
- 掃描線：2px 高橘色漸層橫線，從上到下循環掃描（4s）
- 光暈：橘色 radial-gradient，脈衝動畫（scale 1 ↔ 1.15）

#### 動畫時序
```
0.3s — 標籤 fadeUp
0.5s — 開始數字跳動計數（持續 1.2s，ease-out-cubic）
1.8s — 說明文 fadeUp
2.0s — 數據條 1 fadeUp + bar 推進
2.15s — 數據條 2
2.3s — 數據條 3
2.45s — 數據條 4
3.0s — 洞察語錄 fadeUp
3.3s — 底部 fadeIn
持續 — 掃描線 scanDown (4s loop)、光暈脈衝 (3s loop)、標籤點閃爍 (1.5s loop)
```

#### 數字跳動實作
```typescript
function useCountUp(target: number, duration = 1200, delay = 500) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start: number | null = null;
      function step(timestamp: number) {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        setCurrent(Math.round(target * eased));
        if (progress < 1) rafRef.current = requestAnimationFrame(step);
      }
      rafRef.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return current;
}
```

---

### 3.4 專業背書卡 (ProfessionalCard)

**設計尺寸：** 360 × 640px
**匯出尺寸：** 1080 × 1920px（scale: 3）

#### 色彩系統
```css
--pro-bg: #ffffff;
--pro-text: #1a1a1a;
--pro-text-sub: #888888;
--pro-text-muted: #bbbbbb;
--pro-border: #f0f0f0;
--pro-border-light: #eeeeee;
```

#### 排版結構（由上到下）
1. **頂線** — 2px 黑色，從 width:0 伸展
2. **Header** — 左：RESEARCH REPORT + 日期；右：SnowRealm 品牌 pill
3. **主標題** — 28px 襯線體粗體，副標灰色
4. **分隔線** — 24px 黑色細線
5. **Section label** — "KEY FINDINGS" 大寫小字
6. **Findings 列表** — 大數字 + 說明文，中間細分隔線
7. **底部** — CTA + POWERED BY

#### 動畫時序
```
0.2s — 頂線從 width:0 伸展到 100%
0.4s — Header fadeIn
0.6s — 主標題 fadeUp
1.0s — 分隔線 lineGrow
1.3s — Section label fadeIn
1.5s — Finding 1 從左 slideIn
1.8s — Finding 2 slideIn
2.1s — Finding 3 slideIn
2.5s — 底部 fadeIn
```

---

## 四、PNG 匯出方案（高清修復）

### 4.1 推薦方案：modern-screenshot

```bash
npm install modern-screenshot
```

```typescript
// utils/exportPng.ts
import { domToPng } from 'modern-screenshot';

interface ExportPngOptions {
  element: HTMLElement;
  filename?: string;
  scale?: number;
  onBeforeCapture?: () => void;  // 匯出前回調：停止動畫、設定定格狀態
  onAfterCapture?: () => void;   // 匯出後回調：恢復動畫
}

export async function exportCardAsPng({
  element,
  filename = 'share-card.png',
  scale = 3,
  onBeforeCapture,
  onAfterCapture,
}: ExportPngOptions): Promise<string> {
  // 1. 匯出前：停止所有動畫，確保元素在最終狀態
  onBeforeCapture?.();

  // 2. 等一幀讓 DOM 更新
  await new Promise(resolve => requestAnimationFrame(resolve));

  // 3. 截圖
  const dataUrl = await domToPng(element, {
    scale,
    quality: 1,
    style: {
      // 關閉所有 CSS 動畫，避免截到中間狀態
      animationPlayState: 'paused',
      animationDelay: '0s',
      animationDuration: '0s',
    },
  });

  // 4. 恢復動畫
  onAfterCapture?.();

  // 5. 下載
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();

  return dataUrl;
}
```

### 4.2 匯出前的定格處理

```typescript
// 每張卡需要一個 "freeze" 函式，把所有動畫元素設定到最終狀態

function freezeEmotionalCard(container: HTMLElement) {
  // 所有 fadeUp/fadeIn 元素設為 opacity:1, transform:none
  container.querySelectorAll('[class*="emo-"]').forEach(el => {
    (el as HTMLElement).style.opacity = '1';
    (el as HTMLElement).style.transform = 'none';
  });
  // 裝飾線設為最終寬度
  const line = container.querySelector('.emo-line') as HTMLElement;
  if (line) line.style.width = '48px';
  // 底線設為完成狀態
  const underline = container.querySelector('.emo-quote em::after');
  // ::after 無法直接操作，改用 class toggle
  container.classList.add('freeze-state');
}

// CSS 中預設 freeze class
// .freeze-state * { animation: none !important; }
// .freeze-state .emo-quote em::after { right: 0 !important; }
```

### 4.3 Fallback：html2canvas（如果已經在用）

```typescript
import html2canvas from 'html2canvas';

async function exportWithHtml2Canvas(element: HTMLElement) {
  const canvas = await html2canvas(element, {
    scale: 3,              // ← 關鍵：3 倍渲染解決模糊
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    // 固定尺寸，防止跑版
    width: element.offsetWidth,
    height: element.offsetHeight,
    windowWidth: element.offsetWidth,
    windowHeight: element.offsetHeight,
  });

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'share-card.png';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png', 1.0);
}
```

### 4.4 設計端避雷清單

匯出時以下 CSS 屬性可能出問題：

| 屬性 | 問題 | 替代方案 |
|------|------|----------|
| `backdrop-filter: blur()` | 完全不渲染 | 用半透明純色背景 |
| `-webkit-background-clip: text` | 部分不支援 | modern-screenshot OK；html2canvas 改用純色 |
| `box-shadow` 多層 | 可能消失 | 用 border + 背景漸層模擬 |
| `filter: blur()` 在父元素 | 子元素被裁切 | 把 blur 放在獨立的背景層 div |
| `mix-blend-mode` | 不支援 | 改用 opacity 疊加 |
| `CSS animation` 進行中 | 截到中間狀態 | 匯出前 freeze（見 4.2） |
| 外部字體未載入 | 文字回退 | 用 `document.fonts.ready` 等待 |
| 圖片跨域 | 被污染無法截圖 | 加 `crossOrigin="anonymous"` |

---

## 五、MP4 匯出方案（IG 限動用）

### 5.1 方案：MediaRecorder + Canvas

```typescript
// utils/exportMp4.ts

interface ExportMp4Options {
  element: HTMLElement;
  filename?: string;
  duration?: number;    // 錄製秒數，預設 4
  fps?: number;         // 幀率，預設 30
  scale?: number;       // 渲染倍率，預設 2（MP4 不需要 3x）
  onStart?: () => void; // 開始錄製前：重播動畫
}

export async function exportCardAsMp4({
  element,
  filename = 'share-card.mp4',
  duration = 4,
  fps = 30,
  scale = 2,
  onStart,
}: ExportMp4Options): Promise<void> {
  const width = element.offsetWidth * scale;
  const height = element.offsetHeight * scale;

  // 1. 建立離屏 canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 2. 設定 MediaRecorder
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5_000_000,  // 5 Mbps 高品質
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // 3. 重播動畫
  onStart?.();

  // 4. 開始錄製
  recorder.start();

  // 5. 逐幀繪製（使用 modern-screenshot 每幀截圖）
  const { domToCanvas } = await import('modern-screenshot');
  const interval = 1000 / fps;
  let elapsed = 0;

  await new Promise<void>((resolve) => {
    const tick = async () => {
      if (elapsed >= duration * 1000) {
        recorder.stop();
        resolve();
        return;
      }
      const frame = await domToCanvas(element, { scale });
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(frame, 0, 0, width, height);
      elapsed += interval;
      setTimeout(tick, interval);
    };
    tick();
  });

  // 6. 等待錄製完成
  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  // 7. 下載 WebM（瀏覽器原生支援）
  const blob = new Blob(chunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename.replace('.mp4', '.webm');
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
```

### 5.2 MP4 轉換注意事項

- 瀏覽器原生只能錄 WebM，不能直接出 MP4
- **方案 A（推薦）：** 直接下載 WebM，IG 限動支援 WebM 上傳
- **方案 B：** 用 FFmpeg WASM 在前端轉換（增加 ~3MB 依賴）
  ```bash
  npm install @ffmpeg/ffmpeg @ffmpeg/util
  ```
- **方案 C：** 後端轉換（上傳 WebM 到 server，用 FFmpeg 轉 MP4 回傳）

### 5.3 錄製 UX 流程

```
用戶按「儲存為影片」
  → 顯示 "錄製中..." overlay
  → 重播入場動畫
  → 動畫結束後多錄 1 秒定格
  → 停止錄製
  → 下載檔案
  → 隱藏 overlay
```

---

## 六、ShareCardRenderer 整合元件

```tsx
// ShareCardRenderer.tsx

'use client';

import { useRef, useState, useCallback } from 'react';
import { EmotionalCard } from './cards/EmotionalCard';
import { IdentityCard } from './cards/IdentityCard';
import { AuthorityCard } from './cards/AuthorityCard';
import { ProfessionalCard } from './cards/ProfessionalCard';
import { exportCardAsPng } from './utils/exportPng';
import { exportCardAsMp4 } from './utils/exportMp4';
import type { AnyCardData } from './types';

interface ShareCardRendererProps {
  data: AnyCardData;
  showActions?: boolean;  // 是否顯示分享/下載按鈕
}

const CARD_MAP = {
  emotional: EmotionalCard,
  identity: IdentityCard,
  authority: AuthorityCard,
  professional: ProfessionalCard,
} as const;

export function ShareCardRenderer({ data, showActions = true }: ShareCardRendererProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const CardComponent = CARD_MAP[data.type];

  const handleExportPng = useCallback(async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      await exportCardAsPng({
        element: cardRef.current,
        filename: `snowrealm-${data.type}-card.png`,
        scale: 3,
        onBeforeCapture: () => {
          // 添加 freeze class 停止動畫
          cardRef.current?.classList.add('freeze-state');
        },
        onAfterCapture: () => {
          cardRef.current?.classList.remove('freeze-state');
        },
      });
    } finally {
      setExporting(false);
    }
  }, [data.type, exporting]);

  const handleExportMp4 = useCallback(async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      // 先重播動畫
      setReplayKey(k => k + 1);
      // 等一幀讓動畫重啟
      await new Promise(r => requestAnimationFrame(r));
      await exportCardAsMp4({
        element: cardRef.current,
        filename: `snowrealm-${data.type}-card.webm`,
        duration: 4,
        scale: 2,
      });
    } finally {
      setExporting(false);
    }
  }, [data.type, exporting]);

  return (
    <div className="share-card-wrapper">
      {/* 卡片渲染區 */}
      <div ref={cardRef} key={replayKey}>
        <CardComponent data={data} />
      </div>

      {/* 操作按鈕 */}
      {showActions && (
        <div className="share-card-actions">
          <button onClick={handleExportPng} disabled={exporting}>
            {exporting ? '處理中...' : '儲存圖片'}
          </button>
          <button onClick={handleExportMp4} disabled={exporting}>
            {exporting ? '錄製中...' : '儲存影片'}
          </button>
          {/* ShareButtons 元件（LINE 分享 + 複製連結 + Z幣獎勵） */}
          {/* <ShareButtons ... /> */}
        </div>
      )}
    </div>
  );
}
```

---

## 七、動畫配置集中管理

```typescript
// utils/cardAnimations.ts

// 每種卡的動畫時序配置
// delay: 動畫開始延遲 (ms)
// duration: 動畫持續時間 (ms)

export const ANIMATION_TIMINGS = {
  emotional: {
    badge:      { delay: 300, duration: 600 },
    pretitle:   { delay: 500, duration: 600 },
    title:      { delay: 700, duration: 800 },
    line:       { delay: 1200, duration: 1000 },
    quote1:     { delay: 1400, duration: 600 },
    quote2:     { delay: 1700, duration: 600 },
    quote3:     { delay: 2000, duration: 600 },
    underline:  { delay: 2400, duration: 800 },
    footer:     { delay: 2600, duration: 600 },
    totalDuration: 3200,
  },
  identity: {
    avatar:     { delay: 300, duration: 500 },
    name:       { delay: 500, duration: 500 },
    subtitle:   { delay: 600, duration: 500 },
    quoteBox:   { delay: 700, duration: 600 },
    tag1:       { delay: 900, duration: 400 },
    tag2:       { delay: 1000, duration: 400 },
    tag3:       { delay: 1100, duration: 400 },
    statsLabel: { delay: 1200, duration: 500 },
    stat1:      { delay: 1300, duration: 400 },
    bar1:       { delay: 1400, duration: 800 },
    stat2:      { delay: 1500, duration: 400 },
    bar2:       { delay: 1600, duration: 800 },
    stat3:      { delay: 1700, duration: 400 },
    bar3:       { delay: 1800, duration: 800 },
    footer:     { delay: 2200, duration: 500 },
    totalDuration: 2700,
  },
  authority: {
    label:      { delay: 300, duration: 500 },
    countUp:    { delay: 500, duration: 1200 },
    desc:       { delay: 1800, duration: 500 },
    bar1:       { delay: 2000, duration: 400 },
    bar2:       { delay: 2150, duration: 400 },
    bar3:       { delay: 2300, duration: 400 },
    bar4:       { delay: 2450, duration: 400 },
    insight:    { delay: 3000, duration: 500 },
    footer:     { delay: 3300, duration: 500 },
    totalDuration: 3800,
  },
  professional: {
    topLine:    { delay: 200, duration: 600 },
    header:     { delay: 400, duration: 500 },
    title:      { delay: 600, duration: 700 },
    divider:    { delay: 1000, duration: 800 },
    sectionLabel: { delay: 1300, duration: 400 },
    finding1:   { delay: 1500, duration: 500 },
    finding2:   { delay: 1800, duration: 500 },
    finding3:   { delay: 2100, duration: 500 },
    footer:     { delay: 2500, duration: 500 },
    totalDuration: 3000,
  },
} as const;

// Freeze class CSS（加在全域 CSS 或 Tailwind @layer）
export const FREEZE_CSS = `
.freeze-state,
.freeze-state *,
.freeze-state *::before,
.freeze-state *::after {
  animation-play-state: paused !important;
  animation-delay: -9999s !important;
  transition: none !important;
}
`;
```

---

## 八、整合到現有頁面

### 8.1 /done 頁面（問卷完成頁）

```tsx
// 在現有 StoryCard + ShareButtons 的位置，改用 ShareCardRenderer
import { ShareCardRenderer } from '@/components/share-cards';

// 從問卷結果取得數據，組裝成 EmotionalCardData
const cardData: EmotionalCardData = {
  type: 'emotional',
  resultTitle: surveyResult.personalityType,  // e.g. "靈魂型照顧者"
  quote: surveyResult.emotionalQuote,         // AI 生成的 3 行語錄
  ctaText: '來看看你是哪一種？',
  brandUrl: 'insight.snowrealm.pet',
};

<ShareCardRenderer data={cardData} showActions={true} />
```

### 8.2 /story/[responseId]（公開故事頁）

```tsx
const cardData: IdentityCardData = {
  type: 'identity',
  userName: response.userName,
  userInitial: response.userName[0].toUpperCase(),
  storyExcerpt: response.storyExcerpt,
  tags: response.personalityTags,
  stats: response.comparisonStats,
};
```

### 8.3 /insight-admin/insight（AI 洞察報告）

```tsx
const cardData: AuthorityCardData = {
  type: 'authority',
  headlineNumber: insights.topStat.value,
  headlineUnit: '%',
  headlineText: insights.topStat.description,
  bars: insights.distributions,
  insightQuote: insights.aiSummary,
};
```

### 8.4 /report/[slug]（公開報告頁）

```tsx
const cardData: ProfessionalCardData = {
  type: 'professional',
  reportTitle: report.title,
  reportSubtitle: report.subtitle,
  period: report.period,
  findings: report.topFindings.slice(0, 3),
};
```

---

## 九、依賴安裝

```bash
# 核心截圖（取代 html2canvas）
npm install modern-screenshot

# MP4 錄製（可選，如果要前端轉 MP4）
npm install @ffmpeg/ffmpeg @ffmpeg/util

# 如果保留 html2canvas 作為 fallback
# npm install html2canvas
```

---

## 十、驗收清單

- [ ] 四種卡型元件建立完成，接受對應的 data prop
- [ ] 每張卡的入場動畫按照時序表正確播放
- [ ] PNG 匯出：scale 3x、畫質清晰、無模糊
- [ ] PNG 匯出：動畫元素在定格狀態（不會截到半透明）
- [ ] MP4/WebM 匯出：完整錄製入場動畫 + 1s 定格尾巴
- [ ] 字體載入：等待 `document.fonts.ready` 後再截圖
- [ ] LINE 分享按鈕正常（複製連結 + OG 圖）
- [ ] Z 幣獎勵邏輯不變（分享後 +5 Z幣）
- [ ] 各頁面整合完成（/done、/story、/insight、/report）
- [ ] 手機端卡片不超出螢幕寬度（max-width: 100vw）
- [ ] 深色/淺色主題：emotional + authority 固定深色、identity + professional 固定淺色（不跟隨系統）

---

## 十一、AI 文案生成 Prompt（給 OpenAI/Anthropic）

每種卡型的文案可以用 AI 自動生成。以下是 prompt 模板：

### 情緒卡文案 Prompt
```
你是 SnowRealm Insight 的文案產生器。

根據以下問卷結果，產生一張「情緒爆發卡」的文案。

問卷主題：{surveyTitle}
人格結果：{personalityType}
關鍵特質：{traits}

請輸出 JSON：
{
  "resultTitle": "最多 6 個中文字的結果名稱",
  "quote": [
    "第一行（情境描述，最多 12 字）",
    "第二行（轉折，最多 12 字）",
    "第三行（點題，最多 8 字，要能戳到心裡）"
  ],
  "ctaText": "行動呼籲，最多 10 字"
}

風格要求：
- 不要數據、不要專業術語
- 要像詩一樣的節奏感
- 第三行要讓人停頓 3 秒
- 語氣溫柔但有力量
```

### 權威卡文案 Prompt
```
你是 SnowRealm Insight 的數據文案產生器。

根據以下問卷統計，產生一張「權威數據卡」的文案。

問卷主題：{surveyTitle}
統計摘要：{stats}

請輸出 JSON：
{
  "headlineNumber": 87,
  "headlineUnit": "%",
  "headlineText": "的人其實{反直覺的洞察}",
  "bars": [
    { "label": "標籤", "percentage": 87 },
    ...最多 4 條
  ],
  "insightQuote": "一句反直覺的洞察，要讓人覺得「原來我也是這樣」"
}

風格要求：
- headline 要有衝擊力，讓人想點進來驗證
- insightQuote 要反直覺，不要心靈雞湯
- 數字要看起來「有點可怕」但不至於嚇跑人
```
