# 雪凜 3D 角色製作 — VRoid Studio + Three.js 完整指南

> 從角色建模到網頁即時渲染的完整 Pipeline
> 技術棧：VRoid Studio → VRM 1.0 → @pixiv/three-vrm → Next.js

---

## 一、角色製作（VRoid Studio）

### 1.1 下載 & 安裝

- VRoid Studio：https://vroid.com/en/studio（免費，Win / Mac）
- 打開後選「Create New」

### 1.2 雪凜的角色設定指引

在 VRoid Studio 裡照以下方向調整：

**臉型**
- 臉型：偏小、圓潤下巴（少女感）
- 眼睛：大且微上挑（帥氣感），瞳孔用紫色漸層
- 睫毛：濃密上翹
- 眉毛：細且微上揚（自信感）
- 鼻子：小巧
- 嘴巴：小，嘴角微揚

**頭髮**
- 顏色：薰衣草紫（#b8a9e8 為基底，髮尖漸變到 #d8d0f0）
- 造型：雙馬尾（中長），前瀏海碎剪遮到眉毛上方
- 呆毛：一根
- 髮飾：粉色蝴蝶結 × 2（馬尾根部）+ 星星髮夾（右側）

**身體**
- 身高：偏矮（155cm 感）
- 體型：纖細但不瘦弱

**服裝**
- 上衣：白色水手服領 + 紫色蝴蝶結領結
- 裙子：紫色百褶裙，膝上 15cm（活潑感）
- 外搭：淺紫色針織開襟外套（柔和感）
- 鞋子：白色短靴
- 配件：手腕上一個星星手鍊

**膚色**
- 偏白偏暖：接近 #fce8e0

### 1.3 表情設定（重要！）

VRoid Studio 預設包含這些 BlendShape，確保都有調好：

| Expression | 用途 | 調整重點 |
|-----------|------|---------|
| happy | 微笑 | 眼睛微彎、嘴角上揚 |
| angry | 不滿 | 眉頭皺、嘴巴嘟 |
| sad | 難過 | 眉尾下垂、嘴角下彎 |
| relaxed | 放鬆 | 半閉眼、微笑 |
| surprised | 驚訝 | 眼睛睜大、嘴巴 O 型 |
| neutral | 預設 | 自然表情 |

**自訂表情（建議加）：**
- wink：右眼閉 + 微笑（用於打招呼）
- excited：眼睛發亮 + 大笑（用於結果頁）
- thinking：歪頭 + 嘟嘴（用於問卷出題）

### 1.4 匯出 VRM

1. 點右上角「Export VRM」
2. 格式選 **VRM 1.0**
3. 填寫：
   - Avatar name: `Yukirin`
   - Creator: `SnowRealm`
4. Texture quality: **High**
5. 點 Export
6. 存為 `yukirin.vrm`

### 1.5 檔案放置

```
public/
└── models/
    └── yukirin.vrm    （大約 5-15MB）
```

---

## 二、Three.js 載入 & 渲染

### 2.1 依賴安裝

```bash
npm install three @types/three @pixiv/three-vrm
```

### 2.2 VRM 載入器

```typescript
// components/three/useVRM.ts
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';

export function useVRM(url: string) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();

    // 註冊 VRM plugin
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      url,
      (gltf) => {
        const vrmInstance = gltf.userData.vrm as VRM;

        // VRM 預設面朝 +Z，Three.js 慣例面朝 -Z，需要旋轉
        vrmInstance.scene.rotation.y = Math.PI;

        setVrm(vrmInstance);
      },
      (event) => {
        setProgress((event.loaded / event.total) * 100);
      },
      (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    );
  }, [url]);

  return { vrm, progress, error };
}
```

### 2.3 角色渲染元件

```typescript
// components/three/YukirinScene.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';

interface YukirinSceneProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  mood?: 'neutral' | 'happy' | 'surprised' | 'relaxed';
  enableMouseTracking?: boolean;   // 眼睛跟隨滑鼠
  enableBreathing?: boolean;       // 呼吸動畫
  enableBlinking?: boolean;        // 自動眨眼
  cameraPreset?: 'fullBody' | 'upperBody' | 'face';  // 鏡頭距離
}

export function initYukirinScene({
  canvas,
  mood = 'neutral',
  enableMouseTracking = true,
  enableBreathing = true,
  enableBlinking = true,
  cameraPreset = 'upperBody',
}: {
  canvas: HTMLCanvasElement;
} & Omit<YukirinSceneProps, 'canvasRef'>) {
  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // --- Scene ---
  const scene = new THREE.Scene();

  // --- Camera ---
  const camera = new THREE.PerspectiveCamera(
    30,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
  );

  // 鏡頭預設位置
  const CAMERA_PRESETS = {
    fullBody: { position: [0, 0.9, 3], lookAt: [0, 0.8, 0] },
    upperBody: { position: [0, 1.3, 1.5], lookAt: [0, 1.2, 0] },
    face: { position: [0, 1.45, 0.7], lookAt: [0, 1.4, 0] },
  };
  const preset = CAMERA_PRESETS[cameraPreset];
  camera.position.set(...(preset.position as [number, number, number]));
  camera.lookAt(new THREE.Vector3(...(preset.lookAt as [number, number, number])));

  // --- Lighting ---
  // 柔和三點照明
  const ambientLight = new THREE.AmbientLight(0xd0c0f8, 0.7);
  scene.add(ambientLight);

  // 主燈（偏暖紫）
  const keyLight = new THREE.DirectionalLight(0xf0e8ff, 0.9);
  keyLight.position.set(1, 2, 3);
  scene.add(keyLight);

  // 補光（偏粉）
  const fillLight = new THREE.DirectionalLight(0xffd0d0, 0.4);
  fillLight.position.set(-2, 1, 1);
  scene.add(fillLight);

  // 背光（邊緣光）
  const rimLight = new THREE.DirectionalLight(0xd0d0ff, 0.3);
  rimLight.position.set(0, 1, -2);
  scene.add(rimLight);

  // --- Load VRM ---
  let currentVrm: VRM | null = null;
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  loader.load('/models/yukirin.vrm', (gltf) => {
    currentVrm = gltf.userData.vrm as VRM;
    currentVrm.scene.rotation.y = Math.PI;
    scene.add(currentVrm.scene);

    // 設定初始表情
    setExpression(mood);
  });

  // --- Expression Control ---
  function setExpression(expression: string) {
    if (!currentVrm?.expressionManager) return;

    // 先重置所有表情
    currentVrm.expressionManager.setValue(VRMExpressionPresetName.Happy, 0);
    currentVrm.expressionManager.setValue(VRMExpressionPresetName.Sad, 0);
    currentVrm.expressionManager.setValue(VRMExpressionPresetName.Surprised, 0);
    currentVrm.expressionManager.setValue(VRMExpressionPresetName.Relaxed, 0);
    currentVrm.expressionManager.setValue(VRMExpressionPresetName.Angry, 0);

    // 設定目標表情
    switch (expression) {
      case 'happy':
        currentVrm.expressionManager.setValue(VRMExpressionPresetName.Happy, 1);
        break;
      case 'surprised':
        currentVrm.expressionManager.setValue(VRMExpressionPresetName.Surprised, 1);
        break;
      case 'relaxed':
        currentVrm.expressionManager.setValue(VRMExpressionPresetName.Relaxed, 1);
        break;
      // neutral = 不設定任何表情
    }
  }

  // --- Mouse Tracking (眼睛跟隨) ---
  const mouse = { x: 0, y: 0 };
  if (enableMouseTracking) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });
  }

  // --- Animation Loop ---
  const clock = new THREE.Clock();
  let blinkTimer = 0;
  let nextBlinkTime = 3 + Math.random() * 4; // 3-7 秒隨機眨眼
  let isBlinking = false;
  let blinkProgress = 0;

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    if (currentVrm) {
      // 更新 VRM（SpringBone 物理：頭髮飄動、裙子擺動）
      currentVrm.update(delta);

      // --- 呼吸動畫 ---
      if (enableBreathing && currentVrm.humanoid) {
        const chest = currentVrm.humanoid.getNormalizedBoneNode('chest');
        if (chest) {
          chest.rotation.x = Math.sin(elapsed * 1.5) * 0.01; // 微微起伏
        }
      }

      // --- 自動眨眼 ---
      if (enableBlinking && currentVrm.expressionManager) {
        blinkTimer += delta;
        if (!isBlinking && blinkTimer >= nextBlinkTime) {
          isBlinking = true;
          blinkProgress = 0;
        }
        if (isBlinking) {
          blinkProgress += delta * 8; // 眨眼速度
          if (blinkProgress < 1) {
            // 閉眼
            const v = Math.sin(blinkProgress * Math.PI);
            currentVrm.expressionManager.setValue(VRMExpressionPresetName.Blink, v);
          } else {
            // 完成眨眼
            currentVrm.expressionManager.setValue(VRMExpressionPresetName.Blink, 0);
            isBlinking = false;
            blinkTimer = 0;
            nextBlinkTime = 3 + Math.random() * 4;
          }
        }
      }

      // --- 眼睛跟隨滑鼠 ---
      if (enableMouseTracking && currentVrm.lookAt) {
        const target = new THREE.Vector3(
          mouse.x * 0.5,
          1.4 + mouse.y * 0.2,
          -1
        );
        currentVrm.lookAt.target = target;
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  // --- Resize ---
  function handleResize() {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }
  window.addEventListener('resize', handleResize);

  // --- Cleanup ---
  return {
    setExpression,
    dispose: () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (currentVrm) {
        scene.remove(currentVrm.scene);
      }
    },
  };
}
```

---

## 三、與現有 UI 整合

### 3.1 佈局架構

```
┌──────────────────────────────┐
│  Layer 0: CSS gradient bg    │ ← 最底層，CSS 漸層
│  ┌────────────────────────┐  │
│  │ Layer 1: Three.js      │  │ ← 玻璃球體 + 粒子（已有）
│  │ canvas (背景特效)       │  │
│  │  ┌──────────────────┐  │  │
│  │  │ Layer 2: Three.js│  │  │ ← 雪凜 VRM 角色（新增）
│  │  │ canvas (角色)     │  │  │
│  │  │  ┌────────────┐  │  │  │
│  │  │  │ Layer 3:   │  │  │  │ ← HTML 玻璃面板 + 文字
│  │  │  │ HTML/CSS   │  │  │  │
│  │  │  │ glassmorphism│ │  │  │
│  │  │  └────────────┘  │  │  │
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 3.2 建議：合併成一個 Three.js Canvas

不要開兩個 canvas（效能殺手），把角色和背景放在同一個 scene：

```typescript
// components/three/CombinedScene.tsx

export function CombinedScene() {
  // 同一個 scene 裡面有：
  // 1. 玻璃球體 (z: -2 到 0)
  // 2. 粒子系統 (z: -3 到 -1)
  // 3. 雪凜 VRM (z: 0, 正中央)

  // 用 camera 的 layers 或 renderOrder 控制遮擋關係
  // VRM 角色用 depthTest: true 確保在球體前面
}
```

### 3.3 各頁面的角色配置

```typescript
const PAGE_CHARACTER_CONFIG = {
  // 首頁：上半身，眨眼打招呼
  landing: {
    cameraPreset: 'upperBody',
    mood: 'happy',
    enableMouseTracking: true,
    enableBlinking: true,
    enableBreathing: true,
  },

  // 問卷：臉部特寫，跟隨使用者視線
  survey: {
    cameraPreset: 'face',
    mood: 'neutral',       // 隨題目動態切換
    enableMouseTracking: true,
    enableBlinking: true,
    enableBreathing: true,
  },

  // 結果頁：上半身，興奮表情
  result: {
    cameraPreset: 'upperBody',
    mood: 'surprised',     // 或 happy
    enableMouseTracking: true,
    enableBlinking: true,
    enableBreathing: true,
  },

  // 社群：不顯示 3D 角色（用迷你 2D 頭像代替）
  social: null,

  // 個人頁：臉部特寫當大頭貼背景
  profile: {
    cameraPreset: 'face',
    mood: 'relaxed',
    enableMouseTracking: false,
    enableBlinking: true,
    enableBreathing: true,
  },
};
```

---

## 四、進階功能

### 4.1 對話時嘴型同步

問卷出題時，雪凜的嘴巴可以隨文字「說話」：

```typescript
// 簡單版：用 VRM 的母音表情模擬說話
function simulateTalking(vrm: VRM, duration: number) {
  const vowels = ['aa', 'ih', 'ou', 'ee', 'oh'] as const;
  let elapsed = 0;

  function tick(delta: number) {
    elapsed += delta;
    if (elapsed >= duration) {
      // 停止說話，關閉所有母音
      vowels.forEach(v => vrm.expressionManager?.setValue(v, 0));
      return false; // 停止
    }

    // 隨機切換母音
    const phase = Math.sin(elapsed * 8) * 0.5 + 0.5;
    const vowelIndex = Math.floor(elapsed * 6) % vowels.length;
    vowels.forEach((v, i) => {
      vrm.expressionManager?.setValue(v, i === vowelIndex ? phase * 0.6 : 0);
    });
    return true; // 繼續
  }
  return tick;
}
```

### 4.2 Idle 動畫（閒置時的微動作）

```typescript
function applyIdleAnimation(vrm: VRM, elapsed: number) {
  if (!vrm.humanoid) return;

  // 輕微的身體搖擺
  const spine = vrm.humanoid.getNormalizedBoneNode('spine');
  if (spine) {
    spine.rotation.z = Math.sin(elapsed * 0.8) * 0.02;
  }

  // 頭部微微歪
  const head = vrm.humanoid.getNormalizedBoneNode('head');
  if (head) {
    head.rotation.z = Math.sin(elapsed * 0.5) * 0.03;
    head.rotation.x = Math.sin(elapsed * 0.3) * 0.02;
  }

  // 手臂自然下垂微擺
  const leftArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
  if (leftArm) {
    leftArm.rotation.z = 0.8 + Math.sin(elapsed * 0.7) * 0.02;
  }
}
```

### 4.3 SpringBone 物理

VRM 內建 SpringBone 系統，頭髮和裙子會自動有物理飄動效果。在 `vrm.update(delta)` 時自動計算。

不需要額外代碼，但可以微調：
- VRoid Studio 裡調整頭髮的「彈性」和「重力」參數
- 匯出時這些參數會保存在 VRM 裡

---

## 五、效能優化

### 5.1 模型優化

```
VRoid Studio 匯出時：
- Texture quality: High (但不要 4K，2K 就夠)
- Polygon reduction: 開啟，目標 < 30000 面
- 合併相同材質的 mesh
```

### 5.2 渲染優化

```typescript
// 手機降級
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

if (isMobile) {
  renderer.setPixelRatio(1);

  // 關閉角色陰影
  renderer.shadowMap.enabled = false;

  // 降低背景粒子數
  PARTICLE_COUNT = 50;

  // 背景球體只留 2 顆
  ORB_COUNT = 2;
}

// 不可見時暫停
document.addEventListener('visibilitychange', () => {
  isRendering = !document.hidden;
});
```

### 5.3 模型載入策略

```typescript
// 先顯示 UI + 2D placeholder，VRM 在背景載入
function LoadingStrategy() {
  const [vrmReady, setVrmReady] = useState(false);

  return (
    <>
      {/* 2D SVG placeholder（之前做的那個） */}
      {!vrmReady && <YukirinSVGPlaceholder />}

      {/* 3D VRM（載入完成後淡入） */}
      <canvas
        style={{
          opacity: vrmReady ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
    </>
  );
}
```

---

## 六、截圖整合（ShareCard）

### 6.1 問題

Three.js canvas 不能用 `html2canvas` / `modern-screenshot` 截取。

### 6.2 解法

```typescript
async function captureWithCharacter(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  domElement: HTMLElement,
) {
  const { domToPng } = await import('modern-screenshot');

  // 1. 渲染一幀 Three.js
  renderer.render(scene, camera);
  const threeBg = renderer.domElement.toDataURL('image/png');

  // 2. 截 DOM
  domElement.classList.add('freeze-state');
  await new Promise(r => requestAnimationFrame(r));
  const domLayer = await domToPng(domElement, { scale: 3 });
  domElement.classList.remove('freeze-state');

  // 3. 合成
  const canvas = document.createElement('canvas');
  const w = domElement.offsetWidth * 3;
  const h = domElement.offsetHeight * 3;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bgImg = await loadImage(threeBg);
  ctx.drawImage(bgImg, 0, 0, w, h);

  const uiImg = await loadImage(domLayer);
  ctx.drawImage(uiImg, 0, 0, w, h);

  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}
```

---

## 七、快速開始 Checklist

### Step 1：建角色（1-2 小時）
- [ ] 下載 VRoid Studio
- [ ] 照 1.2 的設定做雪凜
- [ ] 調好所有表情（1.3）
- [ ] 匯出 VRM 1.0 → `public/models/yukirin.vrm`

### Step 2：技術整合（Claude Code 負責）
- [ ] `npm install three @pixiv/three-vrm`
- [ ] 建立 `CombinedScene.tsx`（背景球體 + 粒子 + VRM）
- [ ] 建立表情控制系統
- [ ] 建立自動眨眼 + 呼吸 + Idle 動畫
- [ ] 各頁面配置角色鏡頭和表情

### Step 3：UI 整合
- [ ] Landing 頁角色居中，玻璃卡疊上
- [ ] 問卷頁角色臉部特寫 + 對話氣泡
- [ ] 結果頁角色興奮表情
- [ ] 截圖合成功能

### Step 4：優化
- [ ] 手機降級策略
- [ ] 2D SVG placeholder 做 loading fallback
- [ ] 模型壓縮（< 10MB）
- [ ] 不可見時暫停渲染

---

## 八、Mixamo 動畫整合

### 8.1 概念

VRM 本身不包含動畫，Mixamo 提供幾千個免費動畫（揮手、跳舞、鼓掌、思考等）。
流程：Mixamo 下載 FBX → 轉換 → Three.js 載入 → 套用到 VRM 模型。

### 8.2 推薦動畫清單（從 Mixamo 下載）

去 https://www.mixamo.com/ 搜尋並下載以下動畫（FBX 格式，選 Without Skin）：

| 動畫名稱 | Mixamo 搜尋關鍵字 | 用途場景 | 對應 mood |
|----------|-------------------|----------|-----------|
| 揮手打招呼 | "Waving" | 首次進入、導覽開始 | happy |
| 開心跳躍 | "Happy Idle" / "Jump" | 問卷完成、獲得成就 | excited |
| 鼓掌 | "Clapping" | 分享成功、里程碑 | excited |
| 思考 | "Thinking" | 等待 LLM 回應、出題 | thinking |
| 害羞 | "Bashful" | 被誇獎時 | relaxed |
| 難過 | "Sad Idle" | Bug 回報、離線頁 | sad |
| 指向前方 | "Pointing" | 導覽時指示方向 | neutral |
| 待機呼吸 | "Breathing Idle" | 閒置狀態 | neutral |
| 坐姿 | "Sitting Idle" | 閒聊模式 | relaxed |
| 小跑步 | "Jog" | 帶使用者去另一個頁面 | happy |

下載設定：
- Format: FBX Binary
- Skin: Without Skin（不需要 mesh，只要骨骼動畫）
- Keyframe Reduction: none
- FPS: 30

### 8.3 方案 A：FBX 直接載入（推薦，最簡單）

使用 three-vrm 官方的 `loadMixamoAnimation` 方法：

```typescript
// utils/loadMixamoAnimation.ts
// 參考：https://github.com/V-Sekai/three-vrm-1-sandbox-mixamo

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';

// Mixamo 骨骼名稱 → VRM 骨骼名稱 的映射表
const MIXAMO_TO_VRM_BONE: Record<string, VRMHumanBoneName> = {
  'mixamorigHips': 'hips',
  'mixamorigSpine': 'spine',
  'mixamorigSpine1': 'chest',
  'mixamorigSpine2': 'upperChest',
  'mixamorigNeck': 'neck',
  'mixamorigHead': 'head',
  'mixamorigLeftShoulder': 'leftShoulder',
  'mixamorigLeftArm': 'leftUpperArm',
  'mixamorigLeftForeArm': 'leftLowerArm',
  'mixamorigLeftHand': 'leftHand',
  'mixamorigRightShoulder': 'rightShoulder',
  'mixamorigRightArm': 'rightUpperArm',
  'mixamorigRightForeArm': 'rightLowerArm',
  'mixamorigRightHand': 'rightHand',
  'mixamorigLeftUpLeg': 'leftUpperLeg',
  'mixamorigLeftLeg': 'leftLowerLeg',
  'mixamorigLeftFoot': 'leftFoot',
  'mixamorigLeftToeBase': 'leftToes',
  'mixamorigRightUpLeg': 'rightUpperLeg',
  'mixamorigRightLeg': 'rightLowerLeg',
  'mixamorigRightFoot': 'rightFoot',
  'mixamorigRightToeBase': 'rightToes',
};

export async function loadMixamoAnimation(
  url: string,
  vrm: VRM
): Promise<THREE.AnimationClip> {
  const loader = new FBXLoader();
  const fbx = await loader.loadAsync(url);

  const clip = fbx.animations[0];
  if (!clip) throw new Error('No animation found in FBX');

  const tracks: THREE.KeyframeTrack[] = [];

  clip.tracks.forEach((track) => {
    // track.name 格式: "mixamorigHips.quaternion" 或 "mixamorigHips.position"
    const [boneName, property] = track.name.split('.');
    const vrmBoneName = MIXAMO_TO_VRM_BONE[boneName];

    if (!vrmBoneName) return; // 跳過未映射的骨骼

    const boneNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName);
    if (!boneNode) return;

    // 旋轉軌道
    if (property === 'quaternion') {
      tracks.push(
        new THREE.QuaternionKeyframeTrack(
          `${boneNode.name}.quaternion`,
          track.times as Float32Array,
          track.values as Float32Array
        )
      );
    }

    // 位移軌道（只用在 Hips 上，做根運動）
    if (property === 'position' && vrmBoneName === 'hips') {
      const scale = 0.01; // Mixamo 用 cm，Three.js 用 m
      const scaledValues = new Float32Array(track.values.length);
      for (let i = 0; i < track.values.length; i++) {
        scaledValues[i] = (track.values as Float32Array)[i] * scale;
      }
      tracks.push(
        new THREE.VectorKeyframeTrack(
          `${boneNode.name}.position`,
          track.times as Float32Array,
          scaledValues
        )
      );
    }
  });

  return new THREE.AnimationClip('mixamo_anim', clip.duration, tracks);
}
```

### 8.4 方案 B：FBX → VRMA 預轉換

先把所有 FBX 動畫轉成 VRMA 格式，前端直接載入 VRMA：

```bash
# 安裝轉換工具
git clone https://github.com/TK-256/fbx2vrma-converter.git
cd fbx2vrma-converter
npm install

# 單個轉換
node fbx2vrma-converter.js -i animations/Waving.fbx -o public/animations/waving.vrma

# 批次轉換整個資料夾
node fbx2vrma-converter.js -i animations/ -o public/animations/
```

前端載入 VRMA：
```typescript
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';

// 在 GLTFLoader 中註冊 animation plugin
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

const gltf = await loader.loadAsync('/animations/waving.vrma');
const vrmAnimation = gltf.userData.vrmAnimations[0];
const clip = createVRMAnimationClip(vrmAnimation, vrm);
mixer.clipAction(clip).play();
```

### 8.5 動畫管理器

```typescript
// components/three/AnimationManager.ts

interface AnimationConfig {
  name: string;
  url: string;              // FBX 或 VRMA 路徑
  loop: boolean;            // 是否循環
  fadeIn: number;            // 淡入時間 (秒)
  fadeOut: number;           // 淡出時間 (秒)
  speed: number;             // 播放速度
  blendWithIdle: boolean;    // 是否跟 idle 動畫混合
}

const ANIMATIONS: Record<string, AnimationConfig> = {
  idle: {
    name: 'idle',
    url: '/animations/breathing-idle.fbx',
    loop: true,
    fadeIn: 0.5,
    fadeOut: 0.5,
    speed: 1,
    blendWithIdle: false,
  },
  wave: {
    name: 'wave',
    url: '/animations/waving.fbx',
    loop: false,
    fadeIn: 0.3,
    fadeOut: 0.5,
    speed: 1,
    blendWithIdle: true,
  },
  excited: {
    name: 'excited',
    url: '/animations/happy-idle.fbx',
    loop: true,
    fadeIn: 0.3,
    fadeOut: 0.5,
    speed: 1.2,
    blendWithIdle: false,
  },
  thinking: {
    name: 'thinking',
    url: '/animations/thinking.fbx',
    loop: true,
    fadeIn: 0.5,
    fadeOut: 0.5,
    speed: 0.8,
    blendWithIdle: false,
  },
  pointing: {
    name: 'pointing',
    url: '/animations/pointing.fbx',
    loop: false,
    fadeIn: 0.3,
    fadeOut: 0.3,
    speed: 1,
    blendWithIdle: true,
  },
  clapping: {
    name: 'clapping',
    url: '/animations/clapping.fbx',
    loop: false,
    fadeIn: 0.2,
    fadeOut: 0.5,
    speed: 1,
    blendWithIdle: true,
  },
  sad: {
    name: 'sad',
    url: '/animations/sad-idle.fbx',
    loop: true,
    fadeIn: 0.8,
    fadeOut: 0.8,
    speed: 0.7,
    blendWithIdle: false,
  },
};

export class AnimationManager {
  private mixer: THREE.AnimationMixer;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private vrm: VRM;
  private loaded: Set<string> = new Set();

  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.mixer = new THREE.AnimationMixer(vrm.scene);
  }

  // 預載所有動畫
  async preloadAll() {
    for (const [key, config] of Object.entries(ANIMATIONS)) {
      await this.load(key);
    }
  }

  // 載入單個動畫
  async load(animName: string) {
    if (this.loaded.has(animName)) return;
    const config = ANIMATIONS[animName];
    if (!config) return;

    const clip = await loadMixamoAnimation(config.url, this.vrm);
    const action = this.mixer.clipAction(clip);
    action.setLoop(
      config.loop ? THREE.LoopRepeat : THREE.LoopOnce,
      config.loop ? Infinity : 1
    );
    action.clampWhenFinished = !config.loop;
    action.timeScale = config.speed;

    this.actions.set(animName, action);
    this.loaded.add(animName);
  }

  // 播放動畫（帶淡入淡出）
  async play(animName: string) {
    await this.load(animName); // 確保已載入
    const config = ANIMATIONS[animName];
    const nextAction = this.actions.get(animName);
    if (!nextAction || !config) return;

    if (this.currentAction && this.currentAction !== nextAction) {
      // 交叉淡入淡出
      this.currentAction.fadeOut(config.fadeIn);
      nextAction.reset().fadeIn(config.fadeIn).play();
    } else {
      nextAction.reset().fadeIn(config.fadeIn).play();
    }

    this.currentAction = nextAction;

    // 非循環動畫播完後自動回到 idle
    if (!config.loop) {
      const duration = nextAction.getClip().duration / config.speed;
      setTimeout(() => {
        this.play('idle');
      }, (duration - config.fadeOut) * 1000);
    }
  }

  // 每幀更新
  update(delta: number) {
    this.mixer.update(delta);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.actions.clear();
  }
}
```

### 8.6 mood → 動畫 + 表情 聯合映射

```typescript
// LLM 回傳的 mood → 同時控制動畫和表情

const MOOD_MAPPING: Record<string, {
  animation: string;
  expression: string;
  expressionWeight: number;
}> = {
  happy: {
    animation: 'wave',        // 揮手
    expression: 'happy',
    expressionWeight: 0.8,
  },
  excited: {
    animation: 'excited',     // 開心跳
    expression: 'happy',
    expressionWeight: 1.0,
  },
  thinking: {
    animation: 'thinking',    // 手放下巴
    expression: 'neutral',
    expressionWeight: 1.0,
  },
  neutral: {
    animation: 'idle',        // 待機呼吸
    expression: 'neutral',
    expressionWeight: 1.0,
  },
  relaxed: {
    animation: 'idle',        // 待機
    expression: 'relaxed',
    expressionWeight: 0.7,
  },
  sad: {
    animation: 'sad',         // 垂頭
    expression: 'sad',
    expressionWeight: 0.8,
  },
  wink: {
    animation: 'wave',        // 揮手 + 眨眼
    expression: 'wink',
    expressionWeight: 1.0,
  },
};

// 使用方式
function applyMood(mood: string, animManager: AnimationManager, vrm: VRM) {
  const mapping = MOOD_MAPPING[mood] || MOOD_MAPPING.neutral;

  // 播放對應動畫
  animManager.play(mapping.animation);

  // 過渡到對應表情
  transitionExpression(vrm, currentMood, mapping.expression, 300);
}
```

### 8.7 特殊場景動畫

```typescript
// 導覽時「帶你去另一個頁面」的完整流程
async function navigateWithAnimation(
  targetPage: string,
  animManager: AnimationManager,
  vrm: VRM,
  router: NextRouter
) {
  // 1. 雪凜播放「pointing」動畫指向方向
  await animManager.play('pointing');
  await wait(800);

  // 2. 說「跟我走～」
  showBubble('跟我走～');

  // 3. 播放跑步動畫（如果有的話）或揮手
  await animManager.play('wave');
  await wait(500);

  // 4. 頁面跳轉
  router.push(targetPage);

  // 5. 到新頁面後回到 idle
  await wait(1000);
  animManager.play('idle');
}

// 問卷完成慶祝
async function celebrateResult(animManager: AnimationManager, vrm: VRM) {
  // 1. 驚訝表情
  transitionExpression(vrm, 'neutral', 'surprised', 200);
  await wait(500);

  // 2. 鼓掌動畫
  await animManager.play('clapping');
  await wait(2000);

  // 3. 切到開心
  transitionExpression(vrm, 'surprised', 'happy', 300);
  await animManager.play('excited');
}
```

### 8.8 動畫檔案管理

```
public/
├── models/
│   └── yukirin.vrm
└── animations/
    ├── breathing-idle.fbx     # ~100KB  待機
    ├── waving.fbx             # ~150KB  揮手
    ├── happy-idle.fbx         # ~120KB  開心
    ├── clapping.fbx           # ~130KB  鼓掌
    ├── thinking.fbx           # ~100KB  思考
    ├── sad-idle.fbx           # ~100KB  難過
    ├── pointing.fbx           # ~110KB  指向
    ├── bashful.fbx            # ~100KB  害羞
    ├── sitting-idle.fbx       # ~100KB  坐姿
    └── jog.fbx                # ~120KB  小跑步
    # 總計約 1.1MB（很輕量）
```

### 8.9 動畫載入策略

```typescript
// 不要一次載入全部，按需載入 + 快取
// idle 和 wave 首屏就載（最常用）
// 其他的使用時才載

async function initAnimations(animManager: AnimationManager) {
  // 立即載入
  await Promise.all([
    animManager.load('idle'),
    animManager.load('wave'),
  ]);

  // 閒置時預載其他
  requestIdleCallback(async () => {
    await animManager.load('thinking');
    await animManager.load('excited');
    await animManager.load('pointing');
    // 其他的用到再載...
  });
}
```

---

## 九、參考資源

- VRoid Studio 下載：https://vroid.com/en/studio
- @pixiv/three-vrm GitHub：https://github.com/pixiv/three-vrm
- three-vrm 範例（表情控制）：https://pixiv.github.io/three-vrm/packages/three-vrm/examples/
- VRM 官方規格：https://vrm.dev/en/
- Wawa Sensei VTuber 教學：https://wawasensei.dev/tuto/vrm-avatar-with-threejs-react-three-fiber-and-mediapipe
- BOOTH VRM 模型市集（找參考）：https://booth.pm/en/
