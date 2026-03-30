/**
 * contrastColor.ts — WCAG 對比色自動偵測工具
 *
 * 用法一：已知 CSS class 名稱
 *   import { textColorForBg } from '@/lib/contrastColor'
 *   <p className={textColorForBg('lg-lavender-sharp')}>文字</p>
 *   // → "text-[#3d3155]"  (深色文字 on 淺色玻璃)
 *
 * 用法二：直接傳 RGBA / Hex 顏色字串
 *   import { textColorForRgb } from '@/lib/contrastColor'
 *   textColorForRgb('rgba(248,245,255,0.12)')  // → 'dark'
 *
 * 用法三：React hook，runtime 自動偵測 DOM 背景色
 *   import { useAutoTextColor } from '@/lib/contrastColor'
 *   const { ref, textClass } = useAutoTextColor()
 *   <div ref={ref}><p className={textClass}>...</p></div>
 */

import { useEffect, useRef, useState } from 'react'

// ─── WCAG 核心計算 ─────────────────────────────────────────────────────────────

/**
 * 將 0-255 的 sRGB 值轉成線性光值（WCAG 2.1 公式）
 */
function linearize(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/**
 * 計算相對亮度 (0=純黑, 1=純白)
 * @param r 0-255
 * @param g 0-255
 * @param b 0-255
 */
export function getLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/**
 * 計算對比比例 (1:1 ~ 21:1)
 */
export function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * 根據亮度決定要用深色還是淺色文字
 * threshold 0.35: 亮度 > 0.35 時用深色文字（比 0.5 更寬鬆，對淡玻璃更準確）
 */
export function pickTextTone(luminance: number, threshold = 0.35): 'dark' | 'light' {
  return luminance > threshold ? 'dark' : 'light'
}

// ─── 解析顏色字串 ─────────────────────────────────────────────────────────────

/**
 * 解析 rgba(r,g,b,a) 或 rgb(r,g,b)，回傳 { r, g, b, a }
 * alpha 通道會影響感知亮度（over white = 白底合成）
 */
export function parseRgba(color: string): { r: number; g: number; b: number; a: number } | null {
  const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (!m) return null
  return {
    r: parseFloat(m[1]),
    g: parseFloat(m[2]),
    b: parseFloat(m[3]),
    a: m[4] !== undefined ? parseFloat(m[4]) : 1,
  }
}

/**
 * 解析 #rrggbb 或 #rgb hex
 */
export function parseHex(color: string): { r: number; g: number; b: number; a: number } | null {
  const hex = color.replace('#', '')
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: 1,
    }
  }
  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    }
  }
  return null
}

/**
 * 解析任意顏色字串（rgba / rgb / hex），回傳 luminance
 * 若有 alpha < 1，假設疊在白色背景上（適合玻璃態 UI）
 */
export function colorStringToLuminance(color: string): number | null {
  let parsed = parseRgba(color) ?? parseHex(color)
  if (!parsed) return null

  const { r, g, b, a } = parsed

  if (a < 1) {
    // Alpha 合成到白色底 (255,255,255)
    const blendedR = r * a + 255 * (1 - a)
    const blendedG = g * a + 255 * (1 - a)
    const blendedB = b * a + 255 * (1 - a)
    return getLuminance(blendedR, blendedG, blendedB)
  }

  return getLuminance(r, g, b)
}

/**
 * 根據顏色字串直接回傳 'dark' | 'light'
 */
export function textColorForRgb(color: string, threshold = 0.35): 'dark' | 'light' {
  const lum = colorStringToLuminance(color)
  if (lum === null) return 'light' // 預設淺色文字（深色背景）
  return pickTextTone(lum, threshold)
}

// ─── CSS 類別對照表 ────────────────────────────────────────────────────────────
//
// 把本專案常用的背景 class 對應到其主色調的亮度判斷
// 格式：'class-name': 'dark' | 'light'
//
// dark  → 背景偏深  → 用淺色文字（text-white / text-white/80 等）
// light → 背景偏淺  → 用深色文字（text-[#3d3155] 等）

const BG_CLASS_TONE: Record<string, 'dark' | 'light'> = {
  // ── 液態玻璃系列 ──────────────────────────────
  'lg-dark': 'dark',
  'lg-dark-sharp': 'dark',
  'lg-lavender': 'light',
  'lg-lavender-sharp': 'light',
  'lg-sm': 'dark',
  'lg-shimmer': 'dark', // 通常搭 dark，但實際由父層決定

  // ── Tailwind 深色背景 ─────────────────────────
  'bg-slate-950': 'dark',
  'bg-slate-900': 'dark',
  'bg-slate-800': 'dark',
  'bg-gray-900': 'dark',
  'bg-zinc-950': 'dark',
  'bg-black': 'dark',
  'bg-neutral-950': 'dark',

  // ── Tailwind 中間色 ───────────────────────────
  'bg-slate-700': 'dark',
  'bg-slate-600': 'dark',
  'bg-purple-900': 'dark',
  'bg-purple-800': 'dark',
  'bg-indigo-900': 'dark',
  'bg-violet-900': 'dark',

  // ── Tailwind 淺色背景 ─────────────────────────
  'bg-white': 'light',
  'bg-gray-50': 'light',
  'bg-slate-50': 'light',
  'bg-purple-50': 'light',
  'bg-lavender': 'light',

  // ── 半透明 amber（錢包卡片）─────────────────────
  // amber/15 over 深色背景 → 整體仍偏深 → 用淺色文字
  'from-amber-600/15': 'dark',
  'to-amber-400/5': 'dark',
}

// ─── 推薦文字顏色 class ───────────────────────────────────────────────────────
//
// 本專案的設計 token:
//   深色文字 → text-[#3d3155] (深紫羅蘭)
//   淺色文字 → text-white
//   次要深色 → text-[#6b5fa8]
//   次要淺色 → text-white/70

const TEXT_CLASSES = {
  dark: {
    primary: 'text-[#3d3155]',
    secondary: 'text-[#6b5fa8]',
    muted: 'text-[#8a7ca8]',
  },
  light: {
    primary: 'text-white',
    secondary: 'text-white/80',
    muted: 'text-white/50',
  },
}

/**
 * 根據 CSS class 名稱回傳適合的 Tailwind 文字顏色 class
 *
 * @param bgClass  背景 class，可以是空格分隔的多個 class
 * @param variant  'primary' | 'secondary' | 'muted'
 */
export function textColorForBg(
  bgClass: string,
  variant: 'primary' | 'secondary' | 'muted' = 'primary'
): string {
  const classes = bgClass.split(/\s+/)

  for (const cls of classes) {
    const tone = BG_CLASS_TONE[cls]
    if (tone) return TEXT_CLASSES[tone][variant]
  }

  // 未知 class → 預設深色背景 → 淺色文字
  return TEXT_CLASSES['light'][variant]
}

/**
 * 根據已知背景 class，回傳完整的 {primary, secondary, muted} 文字顏色
 */
export function textColorsForBg(bgClass: string) {
  const classes = bgClass.split(/\s+/)
  for (const cls of classes) {
    const tone = BG_CLASS_TONE[cls]
    if (tone) return TEXT_CLASSES[tone]
  }
  return TEXT_CLASSES['light']
}

// ─── React Hook：runtime 自動偵測 ─────────────────────────────────────────────

/**
 * useAutoTextColor — 自動偵測容器背景色，回傳合適的文字顏色 class
 *
 * @example
 * const { ref, textClass, mutedClass } = useAutoTextColor()
 * <div ref={ref} className="lg-lavender-sharp">
 *   <p className={textClass}>主要文字</p>
 *   <span className={mutedClass}>次要說明</span>
 * </div>
 */
export function useAutoTextColor() {
  const ref = useRef<HTMLElement | null>(null)
  const [tone, setTone] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // 用 getComputedStyle 讀取渲染後的背景色
    const style = window.getComputedStyle(el)
    const bg = style.backgroundColor

    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      const detected = textColorForRgb(bg)
      setTone(detected)
    } else {
      // 背景透明時，往父元素尋找
      let parent = el.parentElement
      while (parent) {
        const parentBg = window.getComputedStyle(parent).backgroundColor
        if (parentBg && parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
          setTone(textColorForRgb(parentBg))
          break
        }
        parent = parent.parentElement
      }
    }
  }, [])

  return {
    ref,
    tone,
    textClass: TEXT_CLASSES[tone].primary,
    secondaryClass: TEXT_CLASSES[tone].secondary,
    mutedClass: TEXT_CLASSES[tone].muted,
  }
}
