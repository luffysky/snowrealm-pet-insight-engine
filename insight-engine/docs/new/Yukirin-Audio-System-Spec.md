# 雪凜音訊系統 — 完整架構規格書

> 介面音效 + Azure TTS 語音 + STT 語音輸入 + VRM 嘴型同步
> 版本：v1.0 | 日期：2026-03-30

---

## 目錄

1. 介面音效系統
2. Azure TTS 語音（雪凜會說話）
3. VRM 嘴型同步（Lip Sync）
4. STT 語音輸入（用講的問她）
5. 完整對話語音流程
6. 成本控制
7. 技術棧 & 依賴
8. 驗收清單

---

## 一、介面音效系統

### 1.1 音效清單

| 音效 | 觸發場景 | 風格 | 時長 |
|------|---------|------|------|
| tap.mp3 | 按鈕點擊 | 輕柔氣泡音 | 0.1s |
| select.mp3 | 問卷選項選中 | 清脆叮聲 | 0.15s |
| progress.mp3 | 問卷下一題 | 柔和滑動音 | 0.2s |
| complete.mp3 | 問卷完成 | 夢幻達成音（上行琶音） | 0.8s |
| result.mp3 | 結果揭曉 | 華麗展開音 | 1.2s |
| zcoin.mp3 | 獲得 Z 幣 | 硬幣叮噹 + 魔法閃光 | 0.5s |
| share.mp3 | 分享成功 | 歡快短音效 | 0.3s |
| notification.mp3 | 雪凜主動說話 | 可愛提示音 | 0.3s |
| error.mp3 | 操作失敗 | 低沉短音 | 0.2s |
| navigate.mp3 | 頁面跳轉 | 柔和切換音 | 0.3s |
| achievement.mp3 | 解鎖成就 | 勝利號角（可愛版） | 1.0s |
| chat-send.mp3 | 送出訊息 | 氣泡飛出音 | 0.15s |
| chat-receive.mp3 | 收到雪凜回覆 | 氣泡到達音 | 0.15s |

### 1.2 音效風格指引

```
整體風格：柔和、夢幻、有魔法感
- 基調：C Major / F Major（溫暖的大調）
- 音色：鋼片琴、風鈴、豎琴、柔和合成器
- 避免：金屬質感、尖銳音、低頻重音
- 參考：Genshin Impact UI 音效 / Animal Crossing 音效
```

### 1.3 音效來源

免費音效資源：
- Freesound.org（CC0 授權）
- Pixabay Sound Effects（免費商用）
- 自己用 Tone.js 生成（最靈活）

### 1.4 音效管理器

```typescript
// lib/audio/SoundManager.ts
import { Howl, Howler } from 'howler';

type SoundName =
  | 'tap' | 'select' | 'progress' | 'complete' | 'result'
  | 'zcoin' | 'share' | 'notification' | 'error'
  | 'navigate' | 'achievement' | 'chat-send' | 'chat-receive';

class SoundManager {
  private sounds: Map<string, Howl> = new Map();
  private _muted: boolean = false;
  private _volume: number = 0.5;

  constructor() {
    // 從 localStorage 讀取使用者偏好
    if (typeof window !== 'undefined') {
      this._muted = localStorage.getItem('sound_muted') === 'true';
      this._volume = parseFloat(localStorage.getItem('sound_volume') || '0.5');
      Howler.volume(this._volume);
      Howler.mute(this._muted);
    }
  }

  // 預載所有音效
  preload() {
    const soundFiles: Record<SoundName, string> = {
      'tap': '/sounds/tap.mp3',
      'select': '/sounds/select.mp3',
      'progress': '/sounds/progress.mp3',
      'complete': '/sounds/complete.mp3',
      'result': '/sounds/result.mp3',
      'zcoin': '/sounds/zcoin.mp3',
      'share': '/sounds/share.mp3',
      'notification': '/sounds/notification.mp3',
      'error': '/sounds/error.mp3',
      'navigate': '/sounds/navigate.mp3',
      'achievement': '/sounds/achievement.mp3',
      'chat-send': '/sounds/chat-send.mp3',
      'chat-receive': '/sounds/chat-receive.mp3',
    };

    Object.entries(soundFiles).forEach(([name, src]) => {
      this.sounds.set(name, new Howl({
        src: [src],
        preload: true,
        volume: name === 'tap' ? 0.3 : 0.5,  // 點擊音量小一點
      }));
    });
  }

  play(name: SoundName) {
    if (this._muted) return;
    const sound = this.sounds.get(name);
    sound?.play();
  }

  get muted() { return this._muted; }
  set muted(val: boolean) {
    this._muted = val;
    Howler.mute(val);
    localStorage.setItem('sound_muted', String(val));
  }

  get volume() { return this._volume; }
  set volume(val: number) {
    this._volume = val;
    Howler.volume(val);
    localStorage.setItem('sound_volume', String(val));
  }
}

export const soundManager = new SoundManager();
```

### 1.5 React Hook

```typescript
// hooks/useSound.ts
import { useCallback } from 'react';
import { soundManager } from '@/lib/audio/SoundManager';

export function useSound() {
  const play = useCallback((name: SoundName) => {
    soundManager.play(name);
  }, []);

  return { play, soundManager };
}

// 使用範例：
// const { play } = useSound();
// <button onClick={() => { play('tap'); doSomething(); }}>
```

---

## 二、Azure TTS 語音（雪凜會說話）

### 2.1 推薦聲音

| 聲音名稱 | Voice ID | 特色 | 建議用途 |
|---------|----------|------|---------|
| 曉曉 (Xiaoxiao) | zh-CN-XiaoxiaoNeural | 年輕女性，活潑自然，支援多種情緒風格 | **主力推薦** |
| 曉萱 (Xiaoxuan) | zh-CN-XiaoxuanNeural | 年輕女性，甜美 | 備選 |
| 曉雙 (Xiaoshuang) | zh-CN-XiaoshuangNeural | 兒童音，可愛 | 太幼稚，不推薦 |
| 曉夢 (Xiaomeng) | zh-CN-XiaomengNeural | 年輕女性，溫柔 | 備選 |

**推薦：`zh-CN-XiaoxiaoNeural`**

Xiaoxiao 支援以下 SSML 情緒風格（完美匹配雪凜的個性）：
- `cheerful` — 開心（導覽、結果揭曉）
- `empathetic` — 同理心（Bug 回報、難過時）
- `excited` — 興奮（完成問卷、獲得成就）
- `friendly` — 友善（日常對話）
- `affectionate` — 撒嬌（閒聊）
- `sorry` — 抱歉（出錯時）

### 2.2 繁體中文處理

Azure 的 `zh-CN` 聲音可以正確朗讀繁體中文，但有些台灣用語的發音可能偏大陸腔。

解決方案：
- 在 SSML 裡用 `<phoneme>` 手動修正特定詞的發音
- 或用 `zh-TW` locale 的聲音（`zh-TW-HsiaoChenNeural`），但風格選擇較少
- 建議先用 `zh-CN-XiaoxiaoNeural`，使用者反饋後再調整

### 2.3 後端 API

```typescript
// api/tts/route.ts
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export async function POST(req: Request) {
  const { text, mood } = await req.json();

  // mood → SSML 風格映射
  const styleMap: Record<string, string> = {
    happy: 'cheerful',
    excited: 'excited',
    thinking: 'friendly',
    neutral: 'friendly',
    relaxed: 'affectionate',
    sad: 'sorry',
    wink: 'cheerful',
  };
  const style = styleMap[mood] || 'friendly';

  // 建構 SSML
  const ssml = `
<speak version="1.0"
  xmlns="http://www.w3.org/2001/10/synthesis"
  xmlns:mstts="http://www.w3.org/2001/mstts"
  xml:lang="zh-CN">
  <voice name="zh-CN-XiaoxiaoNeural">
    <mstts:express-as style="${style}" styledegree="1.2">
      ${text}
    </mstts:express-as>
  </voice>
</speak>`;

  // Azure Speech SDK
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY!,
    process.env.AZURE_SPEECH_REGION!  // e.g. 'eastasia'
  );
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

  return new Promise<Response>((resolve) => {
    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        synthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const audioBuffer = Buffer.from(result.audioData);
          resolve(new Response(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': String(audioBuffer.length),
            },
          }));
        } else {
          resolve(new Response('TTS failed', { status: 500 }));
        }
      },
      (err) => {
        synthesizer.close();
        resolve(new Response(err, { status: 500 }));
      }
    );
  });
}
```

### 2.4 帶 Viseme 的 TTS（嘴型資料）

```typescript
// api/tts-with-viseme/route.ts
// 回傳音訊 + viseme 時間軸（用於 VRM 嘴型同步）

export async function POST(req: Request) {
  const { text, mood } = await req.json();
  const style = styleMap[mood] || 'friendly';

  // SSML 加上 viseme 請求
  const ssml = `
<speak version="1.0"
  xmlns="http://www.w3.org/2001/10/synthesis"
  xmlns:mstts="http://www.w3.org/2001/mstts"
  xml:lang="zh-CN">
  <voice name="zh-CN-XiaoxiaoNeural">
    <mstts:viseme type="redlips_front"/>
    <mstts:express-as style="${style}">
      ${text}
    </mstts:express-as>
  </voice>
</speak>`;

  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY!,
    process.env.AZURE_SPEECH_REGION!
  );

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

  // 收集 viseme 事件
  const visemes: Array<{ time: number; visemeId: number }> = [];

  synthesizer.visemeReceived = (_, e) => {
    visemes.push({
      time: e.audioOffset / 10000,  // 100ns → ms
      visemeId: e.visemeId,
    });
  };

  return new Promise<Response>((resolve) => {
    synthesizer.speakSsmlAsync(ssml, (result) => {
      synthesizer.close();
      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        // 回傳音訊 + viseme 資料
        const audioBase64 = Buffer.from(result.audioData).toString('base64');
        resolve(Response.json({
          audio: audioBase64,
          visemes,
          duration: result.audioDuration / 10000, // ms
        }));
      } else {
        resolve(Response.json({ error: 'TTS failed' }, { status: 500 }));
      }
    });
  });
}
```

### 2.5 前端播放 + 串流

```typescript
// hooks/useYukirinVoice.ts

export function useYukirinVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, mood: string) => {
    setIsSpeaking(true);

    try {
      const res = await fetch('/api/tts-with-viseme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mood }),
      });

      const data = await res.json();

      // 播放音訊
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

      // 回傳 viseme 資料給 lip sync 系統
      return {
        audio,
        visemes: data.visemes,
        duration: data.duration,
      };
    } catch (err) {
      setIsSpeaking(false);
      console.error('TTS error:', err);
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
```

---

## 三、VRM 嘴型同步（Lip Sync）

### 3.1 方案 A：Viseme ID → VRM BlendShape（推薦）

Azure TTS 回傳 22 種 viseme ID，映射到 VRM 的母音 BlendShape：

```typescript
// utils/lipSync.ts

// Azure Viseme ID → VRM 母音表情
const VISEME_TO_VRM: Record<number, { shape: string; weight: number }> = {
  0:  { shape: 'neutral', weight: 0 },     // 閉嘴
  1:  { shape: 'aa', weight: 0.3 },        // æ, ə
  2:  { shape: 'aa', weight: 0.8 },        // ɑ
  3:  { shape: 'oh', weight: 0.6 },        // ɔ
  4:  { shape: 'oh', weight: 0.4 },        // ɛ, ʌ
  5:  { shape: 'ee', weight: 0.5 },        // ɝ
  6:  { shape: 'ee', weight: 0.8 },        // j, i, ɪ
  7:  { shape: 'ou', weight: 0.6 },        // w, u, ʊ
  8:  { shape: 'oh', weight: 0.5 },        // o
  9:  { shape: 'aa', weight: 0.4 },        // aʊ
  10: { shape: 'oh', weight: 0.3 },        // ɔɪ
  11: { shape: 'aa', weight: 0.5 },        // aɪ
  12: { shape: 'ee', weight: 0.3 },        // h
  13: { shape: 'ee', weight: 0.2 },        // ɹ
  14: { shape: 'ih', weight: 0.3 },        // l
  15: { shape: 'aa', weight: 0.2 },        // s, z
  16: { shape: 'ee', weight: 0.3 },        // ʃ, tʃ
  17: { shape: 'oh', weight: 0.2 },        // θ, ð
  18: { shape: 'ou', weight: 0.2 },        // f, v
  19: { shape: 'aa', weight: 0.1 },        // d, t, n
  20: { shape: 'aa', weight: 0.1 },        // k, g
  21: { shape: 'aa', weight: 0.15 },       // p, b, m
};

export class LipSyncController {
  private vrm: VRM;
  private visemes: Array<{ time: number; visemeId: number }> = [];
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private currentShape: string = 'neutral';

  constructor(vrm: VRM) {
    this.vrm = vrm;
  }

  start(visemes: Array<{ time: number; visemeId: number }>) {
    this.visemes = visemes;
    this.startTime = performance.now();
    this.isPlaying = true;
  }

  stop() {
    this.isPlaying = false;
    // 回到閉嘴
    this.resetMouth();
  }

  // 每幀呼叫
  update() {
    if (!this.isPlaying || !this.vrm.expressionManager) return;

    const elapsed = performance.now() - this.startTime;

    // 找到當前時間對應的 viseme
    let currentViseme = 0;
    for (let i = this.visemes.length - 1; i >= 0; i--) {
      if (elapsed >= this.visemes[i].time) {
        currentViseme = this.visemes[i].visemeId;
        break;
      }
    }

    // 檢查是否超過最後一個 viseme
    if (this.visemes.length > 0) {
      const lastViseme = this.visemes[this.visemes.length - 1];
      if (elapsed > lastViseme.time + 200) {
        this.stop();
        return;
      }
    }

    const target = VISEME_TO_VRM[currentViseme] || { shape: 'neutral', weight: 0 };

    // 平滑過渡（lerp）
    const shapes = ['aa', 'ee', 'ih', 'oh', 'ou'];
    shapes.forEach(shape => {
      const currentVal = this.vrm.expressionManager!.getValue(shape) || 0;
      const targetVal = shape === target.shape ? target.weight : 0;
      const newVal = currentVal + (targetVal - currentVal) * 0.3; // lerp factor
      this.vrm.expressionManager!.setValue(shape, newVal);
    });
  }

  private resetMouth() {
    if (!this.vrm.expressionManager) return;
    ['aa', 'ee', 'ih', 'oh', 'ou'].forEach(shape => {
      this.vrm.expressionManager!.setValue(shape, 0);
    });
  }
}
```

### 3.2 方案 B：簡易嘴型（不用 Viseme，Fallback）

如果 Viseme 資料不可用（或想省成本），用簡單的音量驅動嘴型：

```typescript
// 從音訊音量驅動嘴巴開合
function simpleLipSync(audio: HTMLAudioElement, vrm: VRM) {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaElementSource(audio);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function tick() {
    if (audio.paused || audio.ended) {
      vrm.expressionManager?.setValue('aa', 0);
      return;
    }
    requestAnimationFrame(tick);
    analyser.getByteFrequencyData(dataArray);

    // 取平均音量
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const mouthOpen = Math.min(avg / 128, 1) * 0.6; // 0~0.6

    vrm.expressionManager?.setValue('aa', mouthOpen);
  }
  tick();
}
```

---

## 四、STT 語音輸入（用講的問她）

### 4.1 方案選擇

| 方案 | 成本 | 準確度 | 延遲 | 中文支援 |
|------|------|--------|------|---------|
| Web Speech API | 免費 | 好 | 低 | Chrome/Edge 支援 |
| Azure Speech STT | 付費 | 最好 | 低 | 完整支援 |
| Whisper API | 付費 | 很好 | 中 | 完整支援 |

**建議：先用 Web Speech API（免費），不夠好再升級 Azure STT。**

### 4.2 Web Speech API 實作

```typescript
// hooks/useVoiceInput.ts

interface UseVoiceInputOptions {
  language?: string;
  continuous?: boolean;
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const {
    language = 'zh-TW',
    continuous = false,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('你的瀏覽器不支援語音輸入');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = true;   // 即時顯示辨識中的文字

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      const currentText = finalText || interimText;
      setTranscript(currentText);
      onResult?.(currentText, !!finalText);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      onError?.(event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, language, continuous, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
  };
}
```

### 4.3 語音輸入 UI

```
對話輸入框的右邊加一個麥克風按鈕：
- 閒置狀態：灰色麥克風 icon
- 錄音中：紫色脈衝動畫 + "雪凜在聽..."
- 辨識完成：自動填入文字框

┌──────────────────┬─────┬─────┐
│ 輸入訊息...       │ 🎙️  │  →  │
└──────────────────┴─────┴─────┘

長按麥克風按鈕 = 開始錄音
放開 = 停止錄音並送出
```

### 4.4 錄音中雪凜的反應

```typescript
// 使用者說話時，雪凜做「認真聽」的動作
function onUserSpeaking(vrm: VRM, animManager: AnimationManager) {
  // 表情：專注（微微歪頭，嘴巴閉著）
  transitionExpression(vrm, currentMood, 'neutral', 200);

  // 動畫：歪頭聽
  const head = vrm.humanoid?.getNormalizedBoneNode('head');
  if (head) {
    head.rotation.z = 0.1; // 微歪頭
  }
}

// 使用者說完時
function onUserStopSpeaking(vrm: VRM) {
  // 表情切到 thinking（準備回答）
  transitionExpression(vrm, 'neutral', 'thinking', 300);
}
```

---

## 五、完整對話語音流程

### 5.1 流程圖

```
使用者（文字或語音輸入）
        ↓
[STT 轉文字]（如果是語音）
        ↓
[AI Guide 系統] → LLM 回覆 { text, mood, action }
        ↓
[同時進行]
├── 文字氣泡顯示（打字機效果）
├── Azure TTS 生成語音 + viseme
├── VRM 表情切換（mood）
├── Mixamo 動畫播放（mood）
└── UI Action 執行（navigate / highlight）
        ↓
[TTS 音訊開始播放]
├── VRM 嘴型同步（viseme 驅動）
├── 雪凜眨眼暫停（說話時不眨眼）
└── 音訊結束 → 嘴巴關閉 → 恢復自動眨眼
```

### 5.2 整合代碼

```typescript
// 核心：處理一輪對話
async function handleGuideResponse(
  responseData: { text: string; mood: string; action?: UIAction },
  vrm: VRM,
  animManager: AnimationManager,
  lipSync: LipSyncController,
  voice: ReturnType<typeof useYukirinVoice>,
  soundManager: SoundManager,
) {
  const { text, mood, action } = responseData;

  // 1. 播放收到訊息音效
  soundManager.play('chat-receive');

  // 2. 切換表情和動畫
  applyMood(mood, animManager, vrm);

  // 3. 同時請求 TTS
  const ttsPromise = voice.speak(text, mood);

  // 4. 顯示文字氣泡（打字機效果，不等 TTS）
  await typewriterDisplay(text);

  // 5. 執行 UI Action
  if (action) executeAction(action);

  // 6. TTS 就緒後開始播放 + 嘴型同步
  const ttsResult = await ttsPromise;
  if (ttsResult) {
    lipSync.start(ttsResult.visemes);

    // 等音訊播完
    await new Promise<void>(resolve => {
      ttsResult.audio.onended = () => {
        lipSync.stop();
        resolve();
      };
    });
  }

  // 7. 回到 idle 狀態
  animManager.play('idle');
}
```

### 5.3 語音開關 UI

```typescript
// 設定頁面要有語音開關
interface VoiceSettings {
  uiSoundsEnabled: boolean;     // 介面音效
  yukirinVoiceEnabled: boolean;  // 雪凜語音
  voiceInputEnabled: boolean;    // 語音輸入
  volume: number;                // 0-1
}

// 預設值
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  uiSoundsEnabled: true,
  yukirinVoiceEnabled: true,
  voiceInputEnabled: false,      // 預設關，使用者手動開
  volume: 0.5,
};
```

---

## 六、成本控制

### 6.1 Azure TTS 定價

```
標準語音：每 100 萬字元 $16 USD
每個中文字 = 2 字元

雪凜一句話平均 30 字 = 60 字元
每次對話平均 5 輪 = 300 字元
每天 1000 個使用者 × 5 輪 = 300,000 字元/天

月成本：300,000 × 30 / 1,000,000 × $16 ≈ $144 USD/月

省錢策略：
- 短句（< 10 字）不用 TTS，只用文字
- 快取重複句子（「嗨嗨！」「下次再來～」）
- 使用者可以關閉語音
```

### 6.2 快取常用語句

```typescript
// 預先生成常用句子的音訊，存在 CDN
const CACHED_PHRASES: Record<string, string> = {
  'greeting': '/voice-cache/greeting.mp3',          // 「嗨嗨！」
  'tour_start': '/voice-cache/tour-start.mp3',      // 「讓我帶你逛逛～」
  'bye': '/voice-cache/bye.mp3',                    // 「下次再來找我玩～」
  'zcoin_earned': '/voice-cache/zcoin.mp3',          // 「恭喜獲得 Z 幣！」
  'thinking': '/voice-cache/thinking.mp3',           // 「讓我想想...」
};

function getVoice(text: string, mood: string) {
  // 先查快取
  for (const [key, url] of Object.entries(CACHED_PHRASES)) {
    if (text.includes(key) || text === CACHED_PHRASES_TEXT[key]) {
      return { cached: true, url };
    }
  }
  // 沒有快取 → 呼叫 Azure TTS
  return { cached: false };
}
```

---

## 七、技術棧 & 依賴

```bash
# 音效播放
npm install howler

# Azure TTS（後端用）
npm install microsoft-cognitiveservices-speech-sdk

# 環境變數
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_REGION=eastasia     # 選離台灣近的：eastasia (香港) 或 japaneast
```

### 檔案結構

```
src/
├── lib/
│   └── audio/
│       ├── SoundManager.ts          # 介面音效管理
│       └── LipSyncController.ts     # VRM 嘴型同步
├── hooks/
│   ├── useSound.ts                  # 音效 hook
│   ├── useYukirinVoice.ts           # TTS hook
│   └── useVoiceInput.ts             # STT hook
├── app/
│   └── api/
│       ├── tts/route.ts             # 基本 TTS
│       └── tts-with-viseme/route.ts # TTS + 嘴型資料
└── public/
    ├── sounds/                      # 介面音效 MP3
    │   ├── tap.mp3
    │   ├── select.mp3
    │   ├── complete.mp3
    │   └── ... (13 個音效檔)
    └── voice-cache/                 # 預錄常用語句
        ├── greeting.mp3
        ├── tour-start.mp3
        └── ...
```

---

## 八、驗收清單

### 介面音效
- [ ] 13 個音效檔準備好
- [ ] SoundManager 預載正常
- [ ] 各觸發點正確播放對應音效
- [ ] 靜音開關正常
- [ ] 音量調節正常
- [ ] localStorage 記住偏好

### Azure TTS
- [ ] Azure Speech 帳號設定完成
- [ ] API 正確回傳音訊
- [ ] SSML 情緒風格正確套用
- [ ] 繁體中文朗讀自然
- [ ] 串流播放不卡頓
- [ ] 延遲 < 2 秒

### VRM 嘴型同步
- [ ] Viseme ID 正確映射到 VRM BlendShape
- [ ] 嘴型動作平滑（lerp 過渡）
- [ ] 語音結束後嘴巴正確關閉
- [ ] 說話時暫停自動眨眼
- [ ] 說完恢復自動眨眼

### STT 語音輸入
- [ ] Web Speech API 正常啟動
- [ ] 中文辨識準確率 > 85%
- [ ] 即時顯示辨識中文字
- [ ] 錄音中雪凜做「聽」的動作
- [ ] 不支援的瀏覽器顯示提示

### 整合
- [ ] 完整對話流程（文字→LLM→TTS→嘴型→動畫）串通
- [ ] 語音和文字可以切換
- [ ] 設定頁面三個開關正常
- [ ] 手機端語音功能正常
- [ ] 成本追蹤面板可用
