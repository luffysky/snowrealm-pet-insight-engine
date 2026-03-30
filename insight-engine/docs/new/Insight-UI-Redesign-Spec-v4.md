# SnowRealm Insight — 全站 UI 重構規格書

> 柔光玻璃 × 蘿莉二次元 × Three.js 背景 × ShareCard v2
> 版本：v3.1 | 日期：2026-03-30
> 架構：Three.js WebGL 背景層 + HTML/CSS/SVG UI 層（雙層分離）

---

## 目錄

1. 設計系統總覽
2. Three.js 背景層規格
3. 角色系統：雪凜 (Yukirin)
4. 玻璃 UI 元件庫
5. 各頁面設計規格（6 頁）
6. ShareCard v2 分享卡系統
7. PNG/MP4 匯出方案
8. 效能分級策略（高/中/低階裝置）
9. PWA 配置方案
10. 多角色系統架構
11. 依賴與技術棧
12. 驗收清單


---

## 一、設計系統總覽

### 1.1 設計理念

**雙層架構：**
- **Layer 0 (背景)：** Three.js WebGL canvas — 玻璃球體、微光粒子、即時光照、滑鼠視差
- **Layer 1 (UI)：** HTML/CSS/SVG — glassmorphism 面板、雪凜角色、互動元件

為什麼分兩層：截圖/分享卡只截 DOM 層，背景可用 `renderer.domElement.toDataURL()` 另外合成。

### 1.2 色彩系統

```typescript
export const tokens = {
  lavender: '#b8a9e8', lavenderLight: '#d8d0f0', lavenderPale: '#eee8ff',
  peach: '#f5b8b5', peachLight: '#fdd5d1', peachPale: '#fff0ee',
  ice: '#a8d8ea', iceLight: '#d0eef7', mint: '#b5e8d5', gold: '#f0d88a',
  glassBg: 'rgba(255,255,255,0.18)',
  glassBgLight: 'rgba(255,255,255,0.42)',
  glassBorder: 'rgba(255,255,255,0.3)',
  glassBlur: 'blur(24px)',
  glassShadow: '0 8px 32px rgba(100,80,180,0.1)',
  textBright: 'rgba(240,235,255,0.9)',
  textNormal: 'rgba(220,210,245,0.7)',
  textMuted: 'rgba(200,190,230,0.5)',
  textDark: '#3d3155', textMedium: '#8a7ca8', textLight: '#b5a8d0',
  gradientPrimary: 'linear-gradient(135deg, #b8a9e8, #f5b8b5)',
  gradientBg: 'linear-gradient(150deg, #f3eeff 0%, #ffeef5 35%, #eef5ff 65%, #fff5ee 100%)',
} as const;
```

### 1.3 字體

```css
font-family: 'Zen Maru Gothic', 'Noto Sans TC', sans-serif;
@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');
```

### 1.4 圓角系統

小元件（標籤、badge）: 10px / 中元件（按鈕、選項）: 14px / 大元件（卡片）: 20px / 頭像: 35%

---

## 二、Three.js 背景層規格

### 2.1 場景設置

- Renderer: `WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })`
- Camera: `PerspectiveCamera(60, aspect, 0.1, 100)`, position z=5
- Tone mapping: `ACESFilmicToneMapping`, exposure 1.2

### 2.2 光照（柔和三點）

- Ambient: `0xd0c0f8`, intensity 0.7
- Key light: `0xf0e8ff`, intensity 0.9, position (2,3,4)
- Fill light: `0xffd0d0`, intensity 0.4, position (-2,1,1)
- Rim light: `0xd0d0ff`, intensity 0.3, position (0,1,-2)

### 2.3 玻璃球體（6 顆）— Perlin Noise 驅動

- Colors: `[0xc8b8f0, 0xf5c8c5, 0xa8d8ea, 0xd0c0f8, 0xf0d8d5, 0xb8e8d5]`
- Material: `MeshPhysicalMaterial({ transparent:true, opacity:0.25, roughness:0.1, transmission:0.9, thickness:0.5, clearcoat:1.0 })`
- 移動方式：用 3D Simplex Noise 驅動位置，不用 sin/cos（避免機械感）

```typescript
// 球體漂浮 — Perlin Noise 驅動（隨機、有機）
import { createNoise3D } from 'simplex-noise';

const noise3D = createNoise3D();

function updateOrbs(orbs: THREE.Mesh[], time: number) {
  orbs.forEach((orb, i) => {
    const seed = i * 100;
    const speed = 0.08; // 極慢

    // 用 noise 產生不規則漂浮路徑
    orb.position.x = orb.userData.baseX + noise3D(seed, 0, time * speed) * 0.8;
    orb.position.y = orb.userData.baseY + noise3D(0, seed, time * speed) * 0.5;
    orb.position.z = orb.userData.baseZ + noise3D(seed, seed, time * speed) * 0.3;

    // 大小也微微變化（像呼吸）
    const breathe = 1 + noise3D(seed + 50, 0, time * 0.05) * 0.08;
    orb.scale.setScalar(orb.userData.baseScale * breathe);

    // 透明度微變（像光折射變化）
    if (orb.material instanceof THREE.MeshPhysicalMaterial) {
      orb.material.opacity = 0.2 + noise3D(seed + 99, 0, time * 0.03) * 0.08;
    }
  });
}
```

### 2.4 微光粒子（200 個）— Noise 場驅動

```typescript
// 粒子用 noise 場驅動，像螢火蟲飄動
function updateParticles(particles: THREE.Points, time: number) {
  const positions = particles.geometry.attributes.position;
  
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // 每個粒子依照當前位置取 noise 值來偏移
    const dx = noise3D(x * 0.5, y * 0.5, time * 0.02) * 0.003;
    const dy = noise3D(x * 0.5 + 100, y * 0.5, time * 0.02) * 0.003;
    
    positions.setX(i, x + dx);
    positions.setY(i, y + dy);
    
    // 超出範圍的粒子回到隨機位置
    if (Math.abs(positions.getX(i)) > 5) positions.setX(i, (Math.random() - 0.5) * 8);
    if (Math.abs(positions.getY(i)) > 5) positions.setY(i, (Math.random() - 0.5) * 8);
  }
  
  positions.needsUpdate = true;
}
```

### 2.5 光暈漂流（新增）

在背景層加入 2-3 個大面積的柔和光暈，用 Noise 驅動緩慢漂流：

```typescript
// 用 ShaderMaterial 做柔邊光暈
const glowMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0xb8a9e8) },
    uOpacity: { value: 0.06 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;
    
    // Simplex noise GLSL (簡化版)
    // ...（用 lygia 或 inline simplex noise）
    
    void main() {
      float dist = distance(vUv, vec2(0.5));
      float glow = smoothstep(0.5, 0.0, dist);
      
      // noise 讓邊緣不規則（像墨水在水裡擴散）
      float noiseVal = snoise(vec3(vUv * 3.0, uTime * 0.05));
      glow *= (0.8 + noiseVal * 0.3);
      
      gl_FragColor = vec4(uColor, glow * uOpacity);
    }
  `,
});

// 建立 3 個光暈平面
const glowColors = [0xb8a9e8, 0xf5b8b5, 0xa8d8ea];
glowColors.forEach((color, i) => {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    glowMaterial.clone()
  );
  mesh.material.uniforms.uColor.value = new THREE.Color(color);
  mesh.position.set(
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 3,
    -2
  );
  scene.add(mesh);
});
```

### 2.6 滑鼠視差 + 手機陀螺儀

- 桌面：mousemove → camera.position.x/y 緩動（lerp factor 0.02，極慢跟隨）
- 手機：deviceorientation → gamma/beta 映射
- 滑鼠移動也影響最近的光暈亮度（微微，接近滑鼠的光暈稍亮一點）

### 2.7 Noise 庫安裝

```bash
npm install simplex-noise
```

### 2.8 動畫速度對照表

```
所有 Three.js 動畫的速度原則：極慢、有機、不規則

球體漂浮：   noise speed 0.08  （約 12-15 秒一個大循環）
球體呼吸：   noise speed 0.05  （約 20 秒一個大小變化）
粒子漂流：   noise speed 0.02  （幾乎靜止，只有微微飄）
光暈漂流：   noise speed 0.05  （緩慢漂移）
滑鼠跟隨：   lerp 0.02         （滑鼠停了 2-3 秒才追上）

CSS 動畫速度（配合 Three.js 調慢）：
光澤流動：   16s 一個循環（原本 8s，放慢一倍）
邊緣呼吸：   8s 一個循環（原本 5s）
懸浮微顫：   10s 一個循環（原本 6s），只動 1px（原本 2px）
標籤光掠：   8s（原本 4s）
數據條流光： 6s（原本 3s）
```

---

## 三、角色系統：雪凜 (Yukirin)

（詳見 Yukirin-VRoid-ThreeJS-Guide.md）

摘要：
- VRoid Studio 建模 → VRM 1.0 匯出
- @pixiv/three-vrm 載入
- 表情：happy/surprised/relaxed/neutral + 自訂 wink/excited/thinking
- 動畫：自動眨眼(3-7s隨機) + 呼吸(胸部微起伏) + Idle(身體微搖) + 眼睛跟隨滑鼠
- SpringBone：頭髮/裙子自動物理飄動
- 鏡頭預設：fullBody / upperBody / face

---

## 四、玻璃 UI 元件庫

### 4.1 GlassPanel

- dark variant: bg rgba(255,255,255,0.18), blur(24px) — Three.js 背景上用
- light variant: bg rgba(255,255,255,0.42), blur(20px) — 純色背景上用
- hover: translateY(-2px), 加強 shadow

### 4.2 Button 系統

- Primary: lavender→peach 漸層, 白色文字, shadow
- Secondary: lavender 背景 12%, 紫色邊框+文字
- Glass: 白色 15% + blur, 半透明文字

### 4.3 其他元件

- GlassInput: 14px rounded, blur(12px), focus 時邊框變紫
- GlassTag: 10px rounded, 漸層背景, 紫色文字
- GlassProgress: 4px track, lavender→peach 漸層 fill
- ReactionButton: 40px 方形, blur(10px), hover scale(1.1)
- BottomNav: 5 項, 中間凸起漸層按鈕
- Toast: 玻璃面板 + 左邊 3px 紫色 border + 迷你角色

---

## 五、各頁面設計規格

### 5.1 首頁 / Landing
角色大圖眨眼 → 玻璃卡疊上 → 品牌pill + 主標題(漸變色) + CTA按鈕 → 熱門問卷卡水平滾動

### 5.2 問卷填寫
進度條 → 迷你角色+對話氣泡出題 → 玻璃選項卡(選中:漸變邊框+scale) → 下一題按鈕

### 5.3 結果 / 完成頁
頂部漸層色塊(角色探出) → 結果名 + 語錄 + 特質標籤 → 數據條 → ShareCard按鈕

### 5.4 社群動態牆
篩選tab → 貼文玻璃卡(頭像+文字+迷你結果卡+互動按鈕列)

### 5.5 個人主頁
角色頭像 + Stats 3格 + 成就徽章 + 故事列表

### 5.6 後台管理
Light variant 玻璃 → Metric 2×2 grid → 趨勢長條圖 → 問卷列表

---

## 六、ShareCard v2 分享卡系統

（詳見 ShareCard-v2-Spec.md）

四種卡型：emotional(深紫星空) / identity(暖金IG風) / authority(暗黑橘色) / professional(純白極簡)
每種有獨立動畫時序、色彩系統、TypeScript 型別定義

---

## 七、PNG/MP4 匯出方案

- PNG: modern-screenshot scale 3x + freeze 動畫
- MP4: MediaRecorder + canvas.captureStream(), 4秒
- Three.js合成: renderer.toDataURL() + DOM截圖 → canvas 合併兩層

---

## 八、效能分級策略

### 8.1 裝置偵測

```typescript
export type PerformanceTier = 'high' | 'mid' | 'low';

export function detectPerformanceTier(): PerformanceTier {
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 4;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isSaveData = (navigator as any).connection?.saveData === true;

  // GPU 偵測
  let gpuTier: 'high' | 'mid' | 'low' = 'mid';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        const gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        if (/RTX|RX 7|Apple M[2-9]|Apple GPU/i.test(gpu)) gpuTier = 'high';
        else if (/Mali-4|Adreno 3|Intel HD [2-4]|SwiftShader/i.test(gpu)) gpuTier = 'low';
      }
    }
  } catch {}

  if (isSaveData) return 'low';
  if (!isMobile && cores >= 6 && memory >= 8 && gpuTier !== 'low') return 'high';
  if (isMobile && cores <= 4) return 'low';
  if (isMobile && memory <= 3) return 'low';
  return 'mid';
}
```

### 8.2 三級配置表

| 功能 | High | Mid | Low |
|------|------|-----|-----|
| pixelRatio | devicePixelRatio (max 2) | 1.5 | 1 |
| 玻璃球體 | 6 顆, 32 segments | 3 顆, 16 segments | 0（關閉） |
| 粒子數 | 200 | 80 | 0（關閉） |
| MeshPhysicalMaterial | transmission + clearcoat | MeshStandardMaterial | 不渲染 |
| VRM 角色 | 全功能 | 保留，關 SpringBone | PNG 立繪替代 |
| 眨眼/呼吸/Idle | 全開 | 眨眼+呼吸 | 關閉 |
| 滑鼠跟隨 | 開 | 開 | 關 |
| 目標 FPS | 60 | 30 | 不跑 rAF |
| backdrop-filter | blur(24px) | blur(24px) | 純色半透明 fallback |
| CSS 動畫 | 全開 | 全開 | 全開（CSS 很輕） |

### 8.3 低階 Fallback

```typescript
// 不載入 Three.js，用 CSS 漸層 + 浮動色塊動畫
function LowTierBackground() {
  return (
    <div style={{ position:'fixed', inset:0, background: tokens.gradientBg, zIndex:0 }}>
      <div className="css-blob blob-1" />
      <div className="css-blob blob-2" />
      <div className="css-blob blob-3" />
    </div>
  );
}

// VRM → 預截好的 PNG 立繪
function LowTierCharacter({ mood }: { mood: string }) {
  return <img src={`/images/yukirin-${mood}.png`} alt="雪凜" />;
}
```

### 8.4 玻璃 Fallback CSS

```css
.glass { background:rgba(255,255,255,0.18); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.3); }
.glass--fallback { background:rgba(240,235,255,0.85); border:1px solid rgba(220,210,240,0.5); }
```

### 8.5 可視區域渲染

- IntersectionObserver: canvas 離開視窗 → 暫停 Three.js
- Page Visibility API: 切分頁 → 暫停
- 只在 isVisible 時呼叫 renderer.render()

### 8.6 FPS 監控動態降級

收集 60 幀平均 FPS：avgFPS < 20 且 tier=high → 降到 mid；avgFPS < 15 且 tier=mid → 降到 low。自動、無感。

---

## 九、PWA 配置方案

### 9.1 安裝

```bash
npm install next-pwa
```

### 9.2 next.config.ts

```typescript
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // VRM 模型：Cache First（下載一次不再請求）
    { urlPattern: /\/models\/.*\.vrm$/, handler: 'CacheFirst',
      options: { cacheName:'vrm-models', expiration:{ maxEntries:10, maxAgeSeconds:30*24*60*60 } } },
    // 圖片：Stale While Revalidate
    { urlPattern: /\/images\/.*\.(png|jpg|webp|svg)$/, handler: 'StaleWhileRevalidate',
      options: { cacheName:'images', expiration:{ maxEntries:100, maxAgeSeconds:7*24*60*60 } } },
    // Google Fonts：Cache First
    { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: 'CacheFirst',
      options: { cacheName:'google-fonts', expiration:{ maxEntries:10, maxAgeSeconds:365*24*60*60 } } },
    // CDN 資源：Cache First
    { urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/, handler: 'CacheFirst',
      options: { cacheName:'cdn-libs', expiration:{ maxEntries:20, maxAgeSeconds:30*24*60*60 } } },
    // API：Network First
    { urlPattern: /\/api\/.*/, handler: 'NetworkFirst',
      options: { cacheName:'api', expiration:{ maxEntries:50, maxAgeSeconds:5*60 }, networkTimeoutSeconds:10 } },
  ],
})({ reactStrictMode: true });

export default nextConfig;
```

### 9.3 manifest.json

```json
{
  "name": "SnowRealm Insight",
  "short_name": "Insight",
  "description": "和雪凜一起探索你的內心",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#f3eeff",
  "theme_color": "#b8a9e8",
  "icons": [
    { "src":"/icons/icon-192.png", "sizes":"192x192", "type":"image/png", "purpose":"any maskable" },
    { "src":"/icons/icon-512.png", "sizes":"512x512", "type":"image/png", "purpose":"any maskable" }
  ],
  "lang": "zh-TW"
}
```

### 9.4 HTML head

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#b8a9e8" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

### 9.5 安裝提示 Hook

```typescript
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setIsInstallable(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setDeferredPrompt(null); setIsInstallable(false);
    return result.outcome === 'accepted';
  };

  return { isInstallable, install };
}
```

### 9.6 離線頁面

```
/app/offline/page.tsx
- 靜態 PNG 版雪凜（難過表情）
- "嗚嗚...連不上網路"
- "雪凜正在等你回來，連上網路後重新整理就好了"
```

### 9.7 VRM 預載策略

首次訪問時用 `requestIdleCallback` 在背景下載 VRM 到 Cache Storage，之後都從快取讀取，不重複下載。

---

## 十、多角色系統架構

### 10.1 角色定義

```typescript
export interface CharacterConfig {
  id: string;
  name: string;
  vrmPath: string;
  fallbackImage: string;
  themeColor: string;
  accentColor: string;
  personality: string;
  defaultMood: string;
}

export const CHARACTERS: Record<string, CharacterConfig> = {
  yukirin: {
    id: 'yukirin', name: '雪凜',
    vrmPath: '/models/yukirin.vrm',
    fallbackImage: '/images/yukirin-neutral.png',
    themeColor: '#b8a9e8', accentColor: '#f5b8b5',
    personality: '活潑、溫暖、有點調皮的 AI 嚮導',
    defaultMood: 'happy',
  },
  // 未來擴展：
  // mochi: { name:'麻糬', themeColor:'#f5b8b5', personality:'慵懶貓系少女' },
  // haru: { name:'小春', themeColor:'#a8d8ea', personality:'冷靜知性型' },
};
```

### 10.2 角色切換

```typescript
export function useCharacter(scene: THREE.Scene) {
  const currentVRM = useRef<VRM | null>(null);

  const switchCharacter = async (characterId: string) => {
    const config = CHARACTERS[characterId];
    // 1. 移除現有角色 + 釋放資源
    if (currentVRM.current) { scene.remove(currentVRM.current.scene); /* dispose meshes */ }
    // 2. 載入新角色
    const gltf = await loader.loadAsync(config.vrmPath);
    const vrm = gltf.userData.vrm as VRM;
    vrm.scene.rotation.y = Math.PI;
    scene.add(vrm.scene);
    currentVRM.current = vrm;
  };

  return { currentVRM, switchCharacter };
}
```

### 10.3 問卷綁定角色

不同問卷主題可以指定不同角色出題，增加多樣性和新鮮感。

---

## 十一、依賴與技術棧

```bash
npm install three @types/three @pixiv/three-vrm  # 3D + VRM
npm install modern-screenshot                      # 截圖
npm install next-pwa                               # PWA
# 可選：npm install @ffmpeg/ffmpeg @ffmpeg/util    # MP4 前端轉換
```

### 完整檔案結構

```
src/
├── components/
│   ├── three/
│   │   ├── ThreeBackground.tsx
│   │   ├── VRMCharacter.tsx
│   │   ├── CombinedScene.tsx
│   │   ├── useThreeExport.ts
│   │   └── useVisibilityRendering.ts
│   ├── character/
│   │   ├── characters.ts
│   │   ├── useCharacter.ts
│   │   └── LowTierCharacter.tsx
│   ├── ui/
│   │   ├── GlassPanel.tsx, GlassButton.tsx, GlassInput.tsx
│   │   ├── GlassTag.tsx, GlassProgress.tsx
│   │   ├── ReactionButton.tsx, BottomNav.tsx, Toast.tsx
│   ├── share-cards/
│   │   ├── ShareCardRenderer.tsx
│   │   ├── cards/ (Emotional, Identity, Authority, Professional)
│   │   └── utils/ (exportPng, exportMp4, exportWithBackground)
│   └── layout/
│       ├── AppShell.tsx
│       └── InstallPrompt.tsx
├── hooks/
│   ├── usePerformanceTier.ts
│   ├── useInstallPrompt.ts
│   └── useAdaptiveQuality.ts
├── utils/
│   ├── performanceTier.ts
│   └── tierConfig.ts
├── styles/ (tokens.ts, glass.css)
├── public/
│   ├── models/yukirin.vrm
│   ├── images/yukirin-{mood}.png (low-tier fallbacks)
│   ├── icons/icon-192.png, icon-512.png
│   └── manifest.json
└── app/
    ├── layout.tsx (PWA meta)
    ├── page.tsx, survey/[id], done, story/[id], social, profile, admin
    └── offline/page.tsx
```

---

## 十二、驗收清單

### Three.js 背景
- [ ] 玻璃球體漂浮（60fps 桌面 / 30fps 手機）
- [ ] 微光粒子飄散
- [ ] 滑鼠 / 陀螺儀視差
- [ ] Alpha 透明，CSS 漸層透出

### VRM 角色
- [ ] VRM 載入成功 + 面朝正確方向
- [ ] 4+ 種表情切換
- [ ] 自動眨眼 + 呼吸 + Idle 動畫
- [ ] SpringBone 頭髮/裙子飄動
- [ ] 眼睛跟隨滑鼠

### 效能分級
- [ ] 裝置偵測正確分級 (high/mid/low)
- [ ] 低階自動 fallback 到 CSS + PNG
- [ ] FPS 監控動態降級生效
- [ ] 可視區域控制（不可見時暫停）
- [ ] 頁面不可見時暫停渲染

### 玻璃 UI
- [ ] dark / light variant 正確
- [ ] backdrop-filter Safari 正常
- [ ] 低階 fallback 純色方案
- [ ] hover / 點擊動畫流暢

### 頁面
- [ ] 首頁：角色 + 玻璃卡疊層
- [ ] 問卷：角色對話 + 選項互動
- [ ] 結果：角色慶祝 + 數據條
- [ ] 社群：貼文列表 + 互動
- [ ] 個人：Stats + 成就
- [ ] 後台：Metric + 趨勢圖

### ShareCard
- [ ] PNG scale 3x 清晰
- [ ] 動畫 freeze 截圖
- [ ] MP4/WebM 錄製 4 秒
- [ ] Three.js + DOM 合成

### PWA
- [ ] Service Worker 註冊成功
- [ ] VRM 模型快取（Cache First）
- [ ] manifest.json 正確
- [ ] 安裝提示正常彈出
- [ ] 離線頁面顯示（雪凜難過表情）
- [ ] iOS Safari 支援（apple-mobile-web-app）

### 效能指標
- [ ] Lighthouse Performance > 80
- [ ] 首屏載入 < 3s
- [ ] VRM 載入 < 5s（快取後 < 1s）
- [ ] 記憶體無洩漏（切頁 dispose 正確）
- [ ] 手機不過熱（低階自動降級）
