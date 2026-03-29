/**
 * SoundManager — 介面音效系統（Howler.js）
 * 13 種柔和夢幻音效，C Major / F Major 大調風格
 */

type SoundName =
  | 'tap' | 'select' | 'progress' | 'complete' | 'result'
  | 'zcoin' | 'share' | 'notification' | 'error' | 'navigate'
  | 'achievement' | 'chat-send' | 'chat-receive'

interface SoundConfig {
  src: string[]
  volume: number
}

const SOUND_CONFIG: Record<SoundName, SoundConfig> = {
  'tap':           { src: ['/sounds/tap.mp3'],           volume: 0.4 },
  'select':        { src: ['/sounds/select.mp3'],        volume: 0.5 },
  'progress':      { src: ['/sounds/progress.mp3'],      volume: 0.4 },
  'complete':      { src: ['/sounds/complete.mp3'],      volume: 0.7 },
  'result':        { src: ['/sounds/result.mp3'],        volume: 0.8 },
  'zcoin':         { src: ['/sounds/zcoin.mp3'],         volume: 0.6 },
  'share':         { src: ['/sounds/share.mp3'],         volume: 0.5 },
  'notification':  { src: ['/sounds/notification.mp3'],  volume: 0.5 },
  'error':         { src: ['/sounds/error.mp3'],         volume: 0.4 },
  'navigate':      { src: ['/sounds/navigate.mp3'],      volume: 0.3 },
  'achievement':   { src: ['/sounds/achievement.mp3'],   volume: 0.8 },
  'chat-send':     { src: ['/sounds/chat-send.mp3'],     volume: 0.35 },
  'chat-receive':  { src: ['/sounds/chat-receive.mp3'],  volume: 0.35 },
}

class SoundManager {
  private sounds = new Map<SoundName, Howl>()
  private _muted = false
  private _volume = 0.7
  private initialized = false

  /** 預載所有音效（在用戶第一次互動後呼叫）*/
  async preload(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return

    try {
      // 動態載入 Howler（避免 SSR 問題）
      const { Howl } = await import('howler')
      this.initialized = true

      // 從 localStorage 讀取設定
      const savedMuted = localStorage.getItem('snow_sound_muted')
      const savedVolume = localStorage.getItem('snow_sound_volume')
      if (savedMuted !== null) this._muted = savedMuted === 'true'
      if (savedVolume !== null) this._volume = parseFloat(savedVolume)

      for (const [name, config] of Object.entries(SOUND_CONFIG)) {
        this.sounds.set(name as SoundName, new Howl({
          src: config.src,
          volume: config.volume * this._volume,
          preload: false, // lazy load，首次播放才下載
        }))
      }
    } catch {
      // Howler 載入失敗靜默處理
    }
  }

  play(name: SoundName): void {
    if (this._muted || !this.initialized) return
    this.sounds.get(name)?.play()
  }

  get muted(): boolean { return this._muted }
  set muted(value: boolean) {
    this._muted = value
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('snow_sound_muted', String(value))
    }
  }

  get volume(): number { return this._volume }
  set volume(value: number) {
    this._volume = Math.min(1, Math.max(0, value))
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('snow_sound_volume', String(this._volume))
    }
    // 更新所有音效音量
    for (const [name, config] of Object.entries(SOUND_CONFIG)) {
      this.sounds.get(name as SoundName)?.volume(config.volume * this._volume)
    }
  }

  toggle(): void { this.muted = !this._muted }
}

// 單例
export const soundManager = new SoundManager()
export type { SoundName }
