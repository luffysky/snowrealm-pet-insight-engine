VRM + Mixamo 動畫修正：

問題：雪凜/凜空載入 Mixamo 動畫後姿勢扭曲
原因：Mixamo 的骨骼命名和旋轉跟 VRM 不一致

解法：使用 three-vrm 官方的 mixamoVRMRigMap + 
      必須在 loadMixamoAnimation 裡做骨骼重映射

去看 three-vrm 的官方範例：
https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm/examples/humanoidAnimation/loadMixamoAnimation.js

這是官方已經寫好的 Mixamo → VRM 骨骼映射函式
不要自己寫映射，直接用官方的

關鍵步驟：
1. npm install @pixiv/three-vrm（確認是最新版 v3）
2. 從官方範例複製 loadMixamoAnimation.js 到你的專案
3. 載入 FBX 後用這個函式轉換，不要直接播放

代碼：
import { loadMixamoAnimation } from './loadMixamoAnimation';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const fbxLoader = new FBXLoader();

async function loadAnimation(vrm, animationUrl) {
  const fbx = await fbxLoader.loadAsync(animationUrl);
  
  // 關鍵：用官方函式做骨骼映射
  const clip = await loadMixamoAnimation(fbx, vrm);
  
  const mixer = new THREE.AnimationMixer(vrm.scene);
  const action = mixer.clipAction(clip);
  action.play();
  
  return { mixer, action };
}

最常見的錯誤：
1. 沒有用 loadMixamoAnimation 就直接播放 FBX
2. Mixamo 下載時選了 "With Skin" 而不是 "Without Skin"
3. three-vrm 版本太舊（要 v3+）
4. FBXLoader 沒有正確 import

如果還是歪的，檢查：
- VRM 匯出時是不是 T-pose（VRoid Studio 預設就是）
- Mixamo 下載設定是不是 "Without Skin / 30fps"
- @pixiv/three-vrm 版本是不是 3.x

不要自己寫骨骼映射
去這裡抄官方的：
https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm/examples/humanoidAnimation/loadMixamoAnimation.js

整份複製到 lib/vrm/loadMixamoAnimation.ts
然後所有 FBX 動畫載入都經過這個函式