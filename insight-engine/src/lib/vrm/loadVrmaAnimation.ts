/**
 * VRMA（VRM Animation）格式載入器
 * 使用 @pixiv/three-vrm-animation 官方套件
 *
 * VRMA 是 VRM Hub 上大量免費動作動畫的格式：
 *   https://hub.vroid.com/en/animations
 *
 * 用法：
 *   const clip = await loadVrmaAnimation('/animations/dance.vrma', vrm)
 *   const action = mixer.clipAction(clip)
 *   action.play()
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation'
import type { VRM } from '@pixiv/three-vrm'

let _loader: GLTFLoader | null = null

function getLoader(): GLTFLoader {
  if (!_loader) {
    _loader = new GLTFLoader()
    _loader.register((parser) => new VRMAnimationLoaderPlugin(parser))
  }
  return _loader
}

/**
 * 載入 .vrma 動畫並轉換成 Three.js AnimationClip
 * @param url      VRMA 檔案路徑（放在 /public/animations/ 下）
 * @param vrm      目標 VRM 模型實例
 * @returns        可直接塞入 AnimationMixer.clipAction() 的 AnimationClip
 */
export async function loadVrmaAnimation(url: string, vrm: VRM): Promise<THREE.AnimationClip> {
  const loader = getLoader()
  const gltf = await loader.loadAsync(url)
  const vrmAnimation = gltf.userData.vrmAnimations?.[0]
  if (!vrmAnimation) throw new Error(`[loadVrmaAnimation] 找不到 VRM Animation：${url}`)
  return createVRMAnimationClip(vrmAnimation, vrm)
}

/**
 * 批量預載多個 VRMA 動畫，回傳 Record<name, clip>
 * 載入失敗的動畫會被跳過（不中斷整體流程）
 */
export async function preloadVrmaAnimations(
  entries: Array<[name: string, url: string]>,
  vrm: VRM,
): Promise<Record<string, THREE.AnimationClip>> {
  const clips: Record<string, THREE.AnimationClip> = {}
  await Promise.all(
    entries.map(([name, url]) =>
      loadVrmaAnimation(url, vrm)
        .then((clip) => { clips[name] = clip })
        .catch((err) => console.warn(`[preloadVrmaAnimations] 跳過 ${name}：`, err)),
    ),
  )
  return clips
}
