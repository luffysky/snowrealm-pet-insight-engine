# 雪凜 AI Agent 規則引擎 — 完整規格書

> 零 Token 的智慧反應 + 斜線指令 + 螢幕感知 + 情境觸發
> 版本：v1.0 | 日期：2026-03-30
> 核心原則：能用規則解決的絕不花 token

---

## 目錄

1. 規則引擎總架構
2. 螢幕感知規則（Page Awareness）
3. 閒置行為規則（Idle Behaviors）
3B. 自由移動規則（Free Mode）
3C. 顯示模式切換邏輯
4. 事件觸發規則（Event Triggers）
5. 時間感知規則（Time Awareness）
6. 斜線指令系統（Slash Commands）
7. 情侶互動規則（Couple Triggers）
8. 漫畫式對話氣泡系統（Speech Bubbles）
9. 放風模式（雙人自由模式）
10. 管理員專屬規則
11. 智慧升級判斷（何時需要 LLM）
12. 規則引擎實作代碼
13. 規則優先級與衝突處理
14. 驗收清單

---

## 一、規則引擎總架構

### 1.1 為什麼要規則引擎

```
每次呼叫 LLM = 花 token = 花錢 = 有延遲

但雪凜 90% 的反應是可預測的：
  使用者在某頁面停太久 → 固定的提醒
  使用者完成問卷 → 固定的慶祝
  深夜還在線 → 固定的關心

這些不需要 LLM 思考，用 if/else 就能做
快、免費、零延遲
```

### 1.2 系統架構

```
使用者行為
    ↓
┌──────────────────────┐
│   PageTracker        │ ← 追蹤頁面、停留時間、操作
│   (全域元件)          │
└────────┬─────────────┘
         ↓
┌──────────────────────┐
│   規則引擎            │ ← 100+ 條規則，全部 if/else
│   (RuleEngine)        │    零 token
└────────┬─────────────┘
         ↓
    ┌────┴────┐
    │ 命中規則 │ → 直接顯示預設台詞 + 動畫 + 表情
    │         │    不呼叫 LLM
    │ 沒命中  │ → 不做任何事（或進入 LLM 流程）
    └─────────┘
```

### 1.3 核心資料結構

```typescript
// lib/agent/ruleEngine.ts

interface UserState {
  // 身份
  userId: string;
  nickname: string;
  isAdmin: boolean;
  selectedCharacter: 'yukirin' | 'riku';
  
  // 角色顯示模式
  presenceMode: 'mini' | 'chat' | 'companion' | 'free';
  // mini      = 右下角迷你頭像（不擋畫面）
  // chat      = 對話氣泡模式（頭像 + 氣泡）
  // companion = 站在旁邊（3D 模型 + 氣泡，不走動）
  // free      = 自由移動（3D 模型可以在畫面上走動）
  characterPosition: { x: number; y: number };
  characterSize: number;  // 0.5 ~ 2.0 倍率
  characterPose: 'standing' | 'sitting' | 'sleeping';
  
  // 頁面狀態
  currentPage: string;
  pageTitle: string;
  timeOnPage: number;          // 秒
  scrollPosition: number;       // 0-100%
  scrollSpeed: 'idle' | 'normal' | 'fast' | 'crazy';
  isTyping: boolean;
  lastClickTarget: string;
  pageVisitCount: number;       // 這頁今天來了幾次
  
  // 問卷狀態
  currentSurveyId: string | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  surveyStartTime: number;
  
  // 對話狀態
  isGuideOpen: boolean;
  currentSessionRounds: number;
  lastMessageTime: number;
  
  // 歷史
  visitCount: number;            // 總共來過幾次
  surveysCompleted: number;
  storiesPosted: number;
  zcoinBalance: number;
  streakDays: number;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  
  // 時間
  currentHour: number;           // 0-23
  dayOfWeek: number;             // 0-6
  isWeekend: boolean;
}

interface RuleResult {
  triggered: boolean;
  character: 'yukirin' | 'riku';
  text: string;
  mood: string;
  animation: string | null;
  action: { type: string; target: string } | null;
  sound: string | null;          // 音效
  priority: number;              // 越高越優先
  cooldownKey: string;           // 冷卻 key（同 key 不重複觸發）
  cooldownSeconds: number;       // 冷卻時間
}
```

---

## 二、螢幕感知規則（Page Awareness）

### 2.1 各頁面的觸發規則

```typescript
const PAGE_RULES: Rule[] = [

  // ===== 首頁 =====
  {
    id: 'home_new_user',
    condition: (s) => s.currentPage === '/' && s.visitCount === 1,
    result: {
      yukirin: { text: '欸嘿～ 第一次來嗎\n我是雪凜 讓我帶你逛逛', mood: 'wink', animation: 'waving' },
      riku: { text: '第一次來？\n...跟我走', mood: 'neutral', animation: 'head-nod' },
    },
    priority: 100,
    cooldown: 0,
  },
  {
    id: 'home_returning',
    condition: (s) => s.currentPage === '/' && s.daysSinceLastVisit >= 3,
    result: {
      yukirin: { text: '你是不是把我忘了\n我一個人顧了好多天欸 (´;ω;`)', mood: 'sad', animation: 'sad-idle' },
      riku: { text: '好久不見\n...她很想你 我沒有', mood: 'neutral', animation: 'idle' },
    },
    priority: 90,
    cooldown: 86400,
  },
  {
    id: 'home_daily',
    condition: (s) => s.currentPage === '/' && s.visitCount > 1 && s.daysSinceLastVisit === 0 && s.pageVisitCount === 1,
    result: {
      yukirin: { text: '嗨嗨～ 今天想做什麼', mood: 'happy', animation: 'happy-idle' },
      riku: { text: '嗯 來了啊', mood: 'neutral', animation: 'head-nod' },
    },
    priority: 50,
    cooldown: 3600,
  },

  // ===== 問卷填寫頁 =====
  {
    id: 'survey_start',
    condition: (s) => s.currentPage.startsWith('/survey/') && s.currentQuestionIndex === 0 && s.timeOnPage < 5,
    result: {
      yukirin: { text: '直覺選就好\n不用想太多', mood: 'happy', animation: 'fist-pump' },
      riku: { text: '準備好了？\n...開始吧', mood: 'neutral', animation: 'head-nod' },
    },
    priority: 60,
    cooldown: 300,
  },
  {
    id: 'survey_stuck',
    condition: (s) => s.currentPage.startsWith('/survey/') && s.timeOnPage > 30 && !s.isTyping,
    result: {
      yukirin: { text: '卡住了嗎？\n這題不用想太多 直覺選就好', mood: 'thinking', animation: 'thinking' },
      riku: { text: '...不用想太久\n沒有對錯', mood: 'thinking', animation: 'chin-touch' },
    },
    priority: 40,
    cooldown: 60,
  },
  {
    id: 'survey_halfway',
    condition: (s) => s.currentPage.startsWith('/survey/') && s.currentQuestionIndex === Math.floor(s.totalQuestions / 2),
    result: {
      yukirin: { text: '已經一半了！加油加油！', mood: 'excited', animation: 'fist-pump' },
      riku: { text: '一半了\n...繼續', mood: 'neutral', animation: 'head-nod' },
    },
    priority: 30,
    cooldown: 0,
  },
  {
    id: 'survey_almost_done',
    condition: (s) => s.currentPage.startsWith('/survey/') && s.totalQuestions - s.currentQuestionIndex <= 2,
    result: {
      yukirin: { text: '快好了快好了！\n再一下下！', mood: 'excited', animation: 'bounce' },
      riku: { text: '...最後了', mood: 'neutral', animation: null },
    },
    priority: 35,
    cooldown: 0,
  },
  {
    id: 'survey_abandon',
    condition: (s) => s.currentPage !== s.currentPage.startsWith('/survey/') && s.currentSurveyId !== null && s.currentQuestionIndex > 0,
    result: {
      yukirin: { text: '欸你問卷還沒填完耶！\n要不要先休息一下 等等再回來？', mood: 'sad', animation: 'sad-idle' },
      riku: { text: '...問卷還沒填完\n回來嗎', mood: 'neutral', animation: null },
    },
    priority: 70,
    cooldown: 600,
  },

  // ===== 結果頁 =====
  {
    id: 'result_arrived',
    condition: (s) => s.currentPage.startsWith('/done') && s.timeOnPage < 3,
    result: {
      yukirin: { text: '出來了出來了！！', mood: 'excited', animation: 'clapping' },
      riku: { text: '結果出來了', mood: 'happy', animation: 'fist-pump' },
    },
    priority: 80,
    cooldown: 0,
  },
  {
    id: 'result_lingering',
    condition: (s) => s.currentPage.startsWith('/done') && s.timeOnPage > 15,
    result: {
      yukirin: { text: '要不要讓我幫你解讀？', mood: 'thinking', animation: 'pointing' },
      riku: { text: '...想聽分析嗎', mood: 'thinking', animation: 'chin-touch' },
    },
    priority: 50,
    cooldown: 300,
  },
  {
    id: 'result_share_nudge',
    condition: (s) => s.currentPage.startsWith('/done') && s.timeOnPage > 30,
    result: {
      yukirin: { text: '你的結果蠻特別的欸\n不分享一下嗎', mood: 'wink', animation: 'blow-kiss' },
      riku: { text: '結果不錯\n...分享看看？', mood: 'neutral', animation: null },
    },
    priority: 30,
    cooldown: 600,
  },

  // ===== 社群頁 =====
  {
    id: 'social_fast_scroll',
    condition: (s) => s.currentPage === '/social' && s.scrollSpeed === 'crazy',
    result: {
      yukirin: { text: '欸你滑那麼快看得到嗎', mood: 'thinking', animation: 'head-shake' },
      riku: { text: '...慢點', mood: 'neutral', animation: null },
    },
    priority: 20,
    cooldown: 120,
  },
  {
    id: 'social_long_read',
    condition: (s) => s.currentPage === '/social' && s.timeOnPage > 120 && s.scrollSpeed === 'normal',
    result: {
      yukirin: { text: '看到什麼好故事了嗎？', mood: 'happy', animation: 'looking-around' },
      riku: { text: '...看得很認真', mood: 'relaxed', animation: null },
    },
    priority: 15,
    cooldown: 300,
  },

  // ===== 商城 =====
  {
    id: 'shop_browsing',
    condition: (s) => s.currentPage === '/shop' && s.timeOnPage > 20,
    result: {
      yukirin: { text: '在看什麼？\n...啊那個不錯欸', mood: 'excited', animation: 'pointing' },
      riku: { text: '...看到喜歡的？', mood: 'neutral', animation: null },
    },
    priority: 25,
    cooldown: 180,
  },
  {
    id: 'shop_cant_afford',
    condition: (s) => s.currentPage === '/shop' && s.zcoinBalance < 30,
    result: {
      yukirin: { text: '你的 Z 幣...\n招財看了都替你擔心\n要不要去賺一點', mood: 'wink', animation: 'bashful' },
      riku: { text: '餘額不太夠\n...去做問卷賺一點？', mood: 'neutral', animation: null },
    },
    priority: 20,
    cooldown: 600,
  },

  // ===== 儲值頁 =====
  {
    id: 'topup_hesitation',
    condition: (s) => s.currentPage === '/topup' && s.timeOnPage > 30,
    result: {
      yukirin: { text: '在猶豫嗎\n不買也沒關係啦', mood: 'relaxed', animation: null },
      riku: { text: '...不急 想清楚再決定', mood: 'neutral', animation: null },
    },
    priority: 30,
    cooldown: 600,
  },

  // ===== 個人頁 =====
  {
    id: 'profile_check_stats',
    condition: (s) => s.currentPage === '/profile' && s.timeOnPage > 10,
    result: {
      yukirin: { text: '在看自己的數據嗎\n你最近越來越活躍了欸', mood: 'happy', animation: 'happy-idle' },
      riku: { text: '...數據看起來不錯', mood: 'neutral', animation: 'head-nod' },
    },
    priority: 15,
    cooldown: 600,
  },

  // ===== 設定頁 =====
  {
    id: 'settings_visit',
    condition: (s) => s.currentPage === '/settings' && s.timeOnPage < 5,
    result: {
      yukirin: { text: '要改設定嗎？\n不要把我的通知關掉喔 (´;ω;`)', mood: 'sad', animation: 'bashful' },
      riku: { text: '...設定什麼', mood: 'neutral', animation: null },
    },
    priority: 10,
    cooldown: 3600,
  },
];
```

---

## 三、閒置行為規則

```typescript
const IDLE_RULES: Rule[] = [
  {
    id: 'idle_30s',
    condition: (s) => s.timeOnPage > 30 && !s.isTyping && s.scrollSpeed === 'idle',
    result: {
      yukirin: { text: '你在發呆嗎～', mood: 'thinking', animation: 'looking-around' },
      riku: { text: null, mood: 'neutral', animation: 'looking-around' },
      // 凜空不說話，只做動作
    },
    priority: 5,
    cooldown: 120,
  },
  {
    id: 'idle_60s',
    condition: (s) => s.timeOnPage > 60 && !s.isTyping && s.scrollSpeed === 'idle',
    result: {
      yukirin: { text: null, mood: 'neutral', animation: 'yawn' },
      riku: { text: null, mood: 'neutral', animation: 'idle' },
      // 不說話，只打哈欠
    },
    priority: 3,
    cooldown: 180,
  },
  {
    id: 'idle_120s',
    condition: (s) => s.timeOnPage > 120 && !s.isTyping && s.scrollSpeed === 'idle',
    result: {
      yukirin: { text: '你還在嗎...\n我好無聊', mood: 'sad', animation: 'bored' },
      riku: { text: null, mood: 'neutral', animation: 'stretching' },
    },
    priority: 3,
    cooldown: 300,
  },
  {
    id: 'idle_300s',
    condition: (s) => s.timeOnPage > 300 && !s.isTyping,
    result: {
      yukirin: { text: null, mood: 'relaxed', animation: 'sitting-idle' },
      riku: { text: null, mood: 'neutral', animation: 'sitting-idle' },
      // 角色坐下來等
    },
    priority: 2,
    cooldown: 600,
  },
  {
    id: 'user_returns_from_idle',
    condition: (s) => s.timeOnPage > 120 && (s.isTyping || s.scrollSpeed !== 'idle'),
    result: {
      yukirin: { text: '你回來了！\n我還以為你睡著了', mood: 'happy', animation: 'waving' },
      riku: { text: '...回來了', mood: 'neutral', animation: 'head-nod' },
    },
    priority: 50,
    cooldown: 300,
  },
];
```

---

## 三B、自由移動規則（Free Mode 限定）

```typescript
// 只在 presenceMode === 'free' 時生效

const FREE_MOVEMENT_RULES: Rule[] = [
  // ===== 主動走動 =====
  {
    id: 'free_random_walk',
    condition: (s) => s.presenceMode === 'free' && s.timeOnPage > 20 && Math.random() < 0.05,
    result: {
      action: { type: 'random_walk', target: '' },
      // 隨機走到畫面上某個位置，用 walking 動畫
    },
    priority: 1,
    cooldown: 30,
  },
  {
    id: 'free_lean_on_element',
    condition: (s) => s.presenceMode === 'free' && s.timeOnPage > 40 && Math.random() < 0.08,
    result: {
      yukirin: { text: null, mood: 'relaxed', animation: 'idle' },
      riku: { text: null, mood: 'neutral', animation: 'idle' },
      action: { type: 'lean_on_nearest_card', target: '' },
      // 走到最近的卡片/按鈕旁邊靠著
    },
    priority: 1,
    cooldown: 60,
  },
  {
    id: 'free_sit_on_button',
    condition: (s) => s.presenceMode === 'free' && s.timeOnPage > 90 && Math.random() < 0.1,
    result: {
      yukirin: { text: '站好久了～ 我坐一下', mood: 'relaxed', animation: 'sitting-idle' },
      riku: { text: null, mood: 'neutral', animation: 'sitting-idle' },
      action: { type: 'sit_on_element', target: '' },
      // 找一個按鈕或卡片邊緣坐下來
    },
    priority: 1,
    cooldown: 120,
  },

  // ===== 跟隨使用者操作 =====
  {
    id: 'free_follow_scroll',
    condition: (s) => s.presenceMode === 'free' && s.scrollSpeed === 'normal',
    result: {
      action: { type: 'follow_scroll', target: '' },
      // 使用者滾動時，角色跟著走
    },
    priority: 5,
    cooldown: 0,
  },
  {
    id: 'free_blown_by_fast_scroll',
    condition: (s) => s.presenceMode === 'free' && s.scrollSpeed === 'crazy',
    result: {
      yukirin: { text: '等等我！你滑太快了！', mood: 'surprised', animation: 'scared' },
      riku: { text: null, mood: 'neutral', animation: null },
      action: { type: 'blown_to_edge', target: '' },
      // 被「吹」到畫面邊緣，抓住邊框
    },
    priority: 20,
    cooldown: 30,
  },
  {
    id: 'free_look_at_click',
    condition: (s) => s.presenceMode === 'free' && s.lastClickTarget !== '',
    result: {
      action: { type: 'look_at_click', target: '' },
      // 使用者點擊某個地方，角色轉頭看
      // 如果距離近，走過去看
    },
    priority: 3,
    cooldown: 5,
  },
  {
    id: 'free_approach_user_click',
    condition: (s) => s.presenceMode === 'free' && s.lastClickTarget !== '' && Math.random() < 0.15,
    result: {
      yukirin: { text: '喔 你要用這個嗎', mood: 'thinking', animation: 'walking' },
      riku: { text: null, mood: 'neutral', animation: 'walking' },
      action: { type: 'walk_to_click', target: '' },
      // 走到使用者剛點的地方
    },
    priority: 5,
    cooldown: 30,
  },

  // ===== 導覽模式的走動 =====
  {
    id: 'free_tour_walk',
    condition: (s) => s.presenceMode === 'free' && s.currentPage === '/' && s.visitCount === 1,
    result: {
      yukirin: { text: '跟我走～ 先看這邊！', mood: 'excited', animation: 'jogging' },
      riku: { text: '跟我走', mood: 'neutral', animation: 'walking' },
      action: { type: 'tour_walk_to', target: '.survey-card-list' },
      // 走到熱門問卷區域，到了之後手指向
    },
    priority: 80,
    cooldown: 0,
  },

  // ===== 被使用者拖動 =====
  {
    id: 'free_being_dragged',
    event: 'character.drag_start',
    result: {
      yukirin: { text: '欸欸欸！你幹嘛拉我！', mood: 'surprised', animation: 'scared' },
      riku: { text: '...', mood: 'neutral', animation: null },
    },
    priority: 60,
    cooldown: 10,
  },
  {
    id: 'free_dropped',
    event: 'character.drag_end',
    result: {
      yukirin: { text: '好吧 站這裡也行', mood: 'neutral', animation: 'breathing-idle' },
      riku: { text: '...這裡？嗯', mood: 'neutral', animation: 'breathing-idle' },
    },
    priority: 60,
    cooldown: 10,
  },

  // ===== 閒置走動 =====
  {
    id: 'free_idle_wander',
    condition: (s) => s.presenceMode === 'free' && s.timeOnPage > 60 && s.scrollSpeed === 'idle',
    result: {
      action: { type: 'wander', target: '' },
      // 在畫面上隨機走走停停
      // 走幾步 → 停下看看 → 再走
    },
    priority: 1,
    cooldown: 45,
  },
  {
    id: 'free_idle_find_corner',
    condition: (s) => s.presenceMode === 'free' && s.timeOnPage > 120 && s.scrollSpeed === 'idle',
    result: {
      yukirin: { text: null, mood: 'relaxed', animation: 'walking' },
      riku: { text: null, mood: 'neutral', animation: 'walking' },
      action: { type: 'walk_to_corner_and_sit', target: '' },
      // 走到角落坐下來
    },
    priority: 1,
    cooldown: 300,
  },
  {
    id: 'free_idle_sleep',
    condition: (s) => s.presenceMode === 'free' && s.timeOnPage > 300 && s.scrollSpeed === 'idle',
    result: {
      yukirin: { text: null, mood: 'relaxed', animation: 'sleeping' },
      riku: { text: null, mood: 'neutral', animation: 'sitting-idle' },
      action: { type: 'sleep_in_corner', target: '' },
      // 在角落打瞌睡
    },
    priority: 1,
    cooldown: 600,
  },

  // ===== 擋到使用者 =====
  {
    id: 'free_blocking_user',
    event: 'character.blocking_click',
    result: {
      yukirin: { text: '啊 擋到了 讓讓讓！', mood: 'surprised', animation: 'jogging' },
      riku: { text: '...抱歉', mood: 'neutral', animation: 'walking' },
      action: { type: 'dodge_away', target: '' },
      // 快速讓開到旁邊
    },
    priority: 90,
    cooldown: 3,
  },
];
```

### 三C、顯示模式切換邏輯

```typescript
// lib/agent/presenceManager.ts

type PresenceMode = 'mini' | 'chat' | 'companion' | 'free';

interface PresenceConfig {
  mode: PresenceMode;
  showVRM: boolean;         // 是否顯示 3D 模型
  showBubble: boolean;      // 是否顯示對話氣泡
  canMove: boolean;         // 角色能不能自由移動
  canDrag: boolean;         // 使用者能不能拖動角色
  canResize: boolean;       // 能不能縮放
  defaultPosition: string;  // 預設位置
}

const PRESENCE_CONFIGS: Record<PresenceMode, PresenceConfig> = {
  mini: {
    mode: 'mini',
    showVRM: false,
    showBubble: false,
    canMove: false,
    canDrag: false,
    canResize: false,
    defaultPosition: 'bottom-right',
    // 只顯示一個圓形頭像按鈕在右下角
    // 有新訊息時頭像彈跳 + 紅點
    // 點擊切換到 chat 模式
  },
  chat: {
    mode: 'chat',
    showVRM: false,
    showBubble: true,
    canMove: false,
    canDrag: false,
    canResize: false,
    defaultPosition: 'bottom-right',
    // 頭像 + 對話氣泡
    // 不佔太多空間
    // 適合快速問答
  },
  companion: {
    mode: 'companion',
    showVRM: true,
    showBubble: true,
    canMove: false,
    canDrag: true,
    canResize: true,
    defaultPosition: 'right-side',
    // 3D 模型站在固定位置
    // 可以拖動到喜歡的位置
    // 但不會自己走動
    // 適合聊天、看結果解讀
  },
  free: {
    mode: 'free',
    showVRM: true,
    showBubble: true,
    canMove: true,
    canDrag: true,
    canResize: true,
    defaultPosition: 'right-side',
    // 完整自由模式
    // 角色會自己走動、靠在元素上、坐下來
    // 可以拖動
    // 適合導覽、閒著想看她走來走去
  },
};

// 切換模式
function setPresenceMode(mode: PresenceMode) {
  const config = PRESENCE_CONFIGS[mode];
  
  // 儲存到 localStorage（記住偏好）
  localStorage.setItem('presence_mode', mode);
  
  // 更新 UI
  updateCharacterVisibility(config);
  
  // 如果從 mini/chat 切到 companion/free，載入 VRM
  if (config.showVRM && !isVRMLoaded()) {
    loadVRM();
  }
}

// 對話面板 UI 上的模式切換按鈕
// [💬] [🧍] [🚶] 
//  chat  companion  free
// 加一個 [✕] 按鈕 → 回到 mini
```

---

## 四、事件觸發規則

```typescript
const EVENT_RULES: Rule[] = [

  // ===== 問卷相關 =====
  {
    id: 'survey_completed',
    event: 'survey.complete',
    result: {
      yukirin: { text: '填完了！！\n讓我看看結果...', mood: 'excited', animation: 'clapping', sound: 'complete' },
      riku: { text: '填完了\n...看看結果', mood: 'happy', animation: 'fist-pump', sound: 'complete' },
    },
    priority: 90,
  },
  {
    id: 'survey_shared',
    event: 'survey.share',
    result: {
      yukirin: { text: '分享成功！+5 Z幣！\n招財替你開心', mood: 'excited', animation: 'victory', sound: 'zcoin' },
      riku: { text: '分享了 +5 Z幣', mood: 'neutral', animation: 'head-nod', sound: 'zcoin' },
    },
    priority: 80,
  },

  // ===== Z 幣相關 =====
  {
    id: 'zcoin_earned',
    event: 'zcoin.earn',
    result: {
      yukirin: { text: '招財說你又賺了 {amount} Z幣！\n餘額 {balance}', mood: 'happy', animation: 'happy-dance', sound: 'zcoin' },
      riku: { text: '+{amount} Z幣\n...{balance} 了', mood: 'neutral', animation: null, sound: 'zcoin' },
    },
    priority: 40,
  },
  {
    id: 'zcoin_purchase',
    event: 'zcoin.spend',
    result: {
      yukirin: { text: '買到了！\n招財看起來有點心疼 哈哈', mood: 'wink', animation: 'happy-idle' },
      riku: { text: '...買了', mood: 'neutral', animation: 'head-nod' },
    },
    priority: 40,
  },
  {
    id: 'zcoin_insufficient',
    event: 'zcoin.insufficient',
    result: {
      yukirin: { text: 'Z 幣不夠啦...\n要不要去賺一點？', mood: 'sad', animation: 'disappointed' },
      riku: { text: '...不夠\n去做問卷？', mood: 'neutral', animation: 'head-shake' },
    },
    priority: 50,
  },

  // ===== 社群相關 =====
  {
    id: 'story_posted',
    event: 'story.create',
    result: {
      yukirin: { text: '故事發出去了！\n希望大家喜歡～', mood: 'happy', animation: 'fist-pump', sound: 'share' },
      riku: { text: '發了\n...寫得不錯', mood: 'neutral', animation: 'head-nod', sound: 'share' },
    },
    priority: 60,
  },
  {
    id: 'story_liked',
    event: 'reaction.received',
    result: {
      yukirin: { text: '你的故事有人共鳴了！', mood: 'excited', animation: 'excited', sound: 'notification' },
      riku: { text: '有人按讚了', mood: 'neutral', animation: null, sound: 'notification' },
    },
    priority: 30,
    cooldown: 60,
  },

  // ===== 成就 =====
  {
    id: 'achievement_unlocked',
    event: 'achievement.unlock',
    result: {
      yukirin: { text: '哇！你解鎖了「{achievementName}」！\n太厲害了吧！！', mood: 'excited', animation: 'victory', sound: 'achievement' },
      riku: { text: '「{achievementName}」解鎖了\n...不錯', mood: 'happy', animation: 'fist-pump', sound: 'achievement' },
    },
    priority: 95,
  },
  {
    id: 'achievement_near',
    event: 'achievement.near',
    result: {
      yukirin: { text: '你離「{achievementName}」只差一步了！\n再加油一下！', mood: 'excited', animation: 'pointing' },
      riku: { text: '快到了\n...差一點', mood: 'neutral', animation: null },
    },
    priority: 35,
    cooldown: 3600,
  },

  // ===== 連續登入 =====
  {
    id: 'streak_milestone_7',
    event: 'streak.milestone',
    condition: (s) => s.streakDays === 7,
    result: {
      yukirin: { text: '連續 7 天了！！\n你是不是離不開我了 (≧∀≦)', mood: 'excited', animation: 'dancing', sound: 'achievement' },
      riku: { text: '7 天了\n...不錯 繼續', mood: 'happy', animation: 'fist-pump', sound: 'achievement' },
    },
    priority: 85,
  },
  {
    id: 'streak_milestone_30',
    event: 'streak.milestone',
    condition: (s) => s.streakDays === 30,
    result: {
      yukirin: { text: '30 天！！！一個月了！\n你根本住在這裡了吧', mood: 'excited', animation: 'victory', sound: 'achievement' },
      riku: { text: '一個月了\n...（其實有點佩服）', mood: 'happy', animation: 'clapping', sound: 'achievement' },
    },
    priority: 95,
  },

  // ===== 儲值 =====
  {
    id: 'topup_success',
    event: 'payment.completed',
    result: {
      yukirin: { text: '招財把 Z 幣存好了！\n{amount} Z幣到帳～', mood: 'excited', animation: 'clapping', sound: 'zcoin' },
      riku: { text: '到帳了\n...{amount} Z幣', mood: 'neutral', animation: 'head-nod', sound: 'zcoin' },
    },
    priority: 85,
  },
  {
    id: 'first_topup',
    event: 'payment.first',
    result: {
      yukirin: { text: '你的第一次儲值！！\n首儲加碼 50% 喔！招財超開心的！', mood: 'excited', animation: 'victory', sound: 'achievement' },
      riku: { text: '首儲加碼\n...多了 50%', mood: 'happy', animation: 'fist-pump', sound: 'achievement' },
    },
    priority: 95,
  },
];
```

---

## 五、時間感知規則

```typescript
const TIME_RULES: Rule[] = [
  {
    id: 'late_night',
    condition: (s) => s.currentHour >= 0 && s.currentHour < 5,
    result: {
      yukirin: { text: '已經凌晨了欸...\n你不用睡嗎', mood: 'sad', animation: 'yawn' },
      riku: { text: '...太晚了\n去睡', mood: 'neutral', animation: null },
    },
    priority: 60,
    cooldown: 3600,
  },
  {
    id: 'early_morning',
    condition: (s) => s.currentHour >= 5 && s.currentHour < 7,
    result: {
      yukirin: { text: '好早！\n你是早起還是還沒睡...', mood: 'thinking', animation: 'yawn' },
      riku: { text: '...早', mood: 'neutral', animation: 'stretching' },
    },
    priority: 30,
    cooldown: 3600,
  },
  {
    id: 'weekend_morning',
    condition: (s) => s.isWeekend && s.currentHour >= 9 && s.currentHour < 12 && s.timeOnPage < 10,
    result: {
      yukirin: { text: '週末還來找我！\n今天想做什麼～', mood: 'happy', animation: 'happy-dance' },
      riku: { text: '週末啊\n...不用出去玩嗎', mood: 'neutral', animation: null },
    },
    priority: 20,
    cooldown: 86400,
  },
  {
    id: 'lunch_time',
    condition: (s) => s.currentHour === 12 && s.timeOnPage > 30,
    result: {
      yukirin: { text: '中午了欸\n你吃飯了嗎\n別只顧著玩', mood: 'thinking', animation: null },
      riku: { text: '...去吃飯', mood: 'neutral', animation: null },
    },
    priority: 15,
    cooldown: 86400,
  },
];
```

---

## 六、斜線指令系統

### 6.1 指令定義

```typescript
interface SlashCommand {
  command: string;
  aliases: string[];          // 別名
  description: string;
  category: 'basic' | 'social' | 'interact' | 'character' | 'tool' | 'admin';
  adminOnly: boolean;
  handler: (state: UserState, args?: string) => CommandResult;
}

interface CommandResult {
  yukirin?: { text: string; mood: string; animation: string | null };
  riku?: { text: string; mood: string; animation: string | null };
  action?: { type: string; target: string };
  needsLLM: boolean;           // 是否需要呼叫 LLM 補充
}
```

### 6.2 基本指令

```typescript
const BASIC_COMMANDS: SlashCommand[] = [
  {
    command: '/問卷',
    aliases: ['/survey', '/推薦'],
    description: '推薦問卷',
    category: 'basic',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '讓我想想你適合什麼...', mood: 'thinking', animation: 'thinking' },
      riku: { text: '...看看有什麼', mood: 'thinking', animation: 'chin-touch' },
      needsLLM: true,  // 需要 LLM 做個人化推薦
    }),
  },
  {
    command: '/結果',
    aliases: ['/result', '/最近結果'],
    description: '查看最近的問卷結果',
    category: 'basic',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '你最近一次的結果在這～', mood: 'happy', animation: 'pointing' },
      riku: { text: '最近的結果', mood: 'neutral', animation: 'pointing' },
      action: { type: 'navigate', target: '/profile#results' },
      needsLLM: false,
    }),
  },
  {
    command: '/Z幣',
    aliases: ['/zcoin', '/餘額', '/招財'],
    description: '查看 Z 幣餘額',
    category: 'basic',
    adminOnly: false,
    handler: (state) => ({
      yukirin: { text: `你有 ${state.zcoinBalance} Z幣\n${state.zcoinBalance < 30 ? '有點少欸...要去賺嗎' : '還不錯嘛'}`, mood: state.zcoinBalance < 30 ? 'sad' : 'happy', animation: null },
      riku: { text: `${state.zcoinBalance}\n...${state.zcoinBalance < 30 ? '有點少' : '還行'}`, mood: 'neutral', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/商城',
    aliases: ['/shop', '/store'],
    description: '前往商城',
    category: 'basic',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '走！去商城逛逛！', mood: 'excited', animation: 'pointing' },
      riku: { text: '商城', mood: 'neutral', animation: 'pointing' },
      action: { type: 'navigate', target: '/shop' },
      needsLLM: false,
    }),
  },
  {
    command: '/成就',
    aliases: ['/achievement'],
    description: '查看成就進度',
    category: 'basic',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '看看你解鎖了什麼！', mood: 'excited', animation: 'presenting' },
      riku: { text: '成就', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/profile#achievements' },
      needsLLM: false,
    }),
  },
  {
    command: '/每日任務',
    aliases: ['/daily', '/任務', '/task'],
    description: '查看今天的任務',
    category: 'basic',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '今天的任務是——', mood: 'excited', animation: 'presenting' },
      riku: { text: '今天的任務', mood: 'neutral', animation: null },
      needsLLM: true,  // 需要 LLM 生成個人化任務
    }),
  },
];
```

### 6.3 社群指令

```typescript
const SOCIAL_COMMANDS: SlashCommand[] = [
  {
    command: '/熱門',
    aliases: ['/trending', '/hot'],
    description: '今日熱門故事',
    category: 'social',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '今天大家都在聊這些——', mood: 'excited', animation: 'presenting' },
      riku: { text: '熱門的', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/social?sort=trending' },
      needsLLM: false,
    }),
  },
  {
    command: '/我的故事',
    aliases: ['/mystory', '/故事'],
    description: '我發過的故事',
    category: 'social',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '你的故事都在這～', mood: 'happy', animation: null },
      riku: { text: '你的故事', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/profile#stories' },
      needsLLM: false,
    }),
  },
  {
    command: '/通知',
    aliases: ['/notifications', '/訊息'],
    description: '查看未讀通知',
    category: 'social',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '讓我看看有什麼新消息...', mood: 'thinking', animation: 'looking-around' },
      riku: { text: '通知', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/notifications' },
      needsLLM: false,
    }),
  },
];
```

### 6.4 互動指令

```typescript
const INTERACT_COMMANDS: SlashCommand[] = [
  {
    command: '/揮手',
    aliases: ['/wave', '/嗨'],
    description: '跟角色揮手',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '嗨嗨～', mood: 'happy', animation: 'waving' },
      riku: { text: '嗯', mood: 'neutral', animation: 'waving' },
      needsLLM: false,
    }),
  },
  {
    command: '/跳舞',
    aliases: ['/dance'],
    description: '讓角色跳舞',
    category: 'interact',
    adminOnly: false,
    handler: () => {
      const dances = ['dancing', 'hip-hop-dance', 'macarena', 'robot-dance'];
      const random = dances[Math.floor(Math.random() * dances.length)];
      return {
        yukirin: { text: '欸不要看啦 好害羞', mood: 'shy', animation: random },
        riku: { text: '...（被迫跳舞）', mood: 'shy', animation: random },
        needsLLM: false,
      };
    },
  },
  {
    command: '/拍頭',
    aliases: ['/pat', '/摸頭'],
    description: '拍拍角色的頭',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '欸嘿～ (≧∀≦)\n再拍一次', mood: 'happy', animation: 'bashful' },
      riku: { text: '...幹嘛\n（沒有躲開）', mood: 'shy', animation: 'bashful' },
      needsLLM: false,
    }),
  },
  {
    command: '/抱抱',
    aliases: ['/hug'],
    description: '抱抱角色',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '好～\n（張開手）來！', mood: 'happy', animation: 'excited' },
      riku: { text: '...（別過頭但沒躲開）\n（小聲）...嗯', mood: 'shy', animation: 'bashful' },
      needsLLM: false,
    }),
  },
  {
    command: '/戳',
    aliases: ['/poke'],
    description: '戳一下角色',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '哼！幹嘛戳我！\n再戳我就...就...咬你！', mood: 'angry', animation: 'frustrated' },
      riku: { text: '......\n（盯著你看）', mood: 'neutral', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/嚇',
    aliases: ['/scare', '/boo'],
    description: '嚇角色',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '啊！！！\n你幹嘛啦！嚇死我了！(°д°)', mood: 'surprised', animation: 'scared' },
      riku: { text: '...沒用\n（完全沒反應）', mood: 'neutral', animation: 'idle' },
      needsLLM: false,
    }),
  },
  {
    command: '/加油',
    aliases: ['/cheer', '/fighting'],
    description: '讓角色幫你加油',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '你可以的！我相信你！\n加油加油加油！！', mood: 'excited', animation: 'cheering' },
      riku: { text: '你已經走到這了\n沒理由停', mood: 'neutral', animation: 'fist-pump' },
      needsLLM: false,
    }),
  },
  {
    command: '/睡覺',
    aliases: ['/sleep', '/晚安'],
    description: '跟角色說晚安',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '晚安～ 明天見\n不准熬夜！\n（小聲）...我會想你的', mood: 'relaxed', animation: 'sleeping' },
      riku: { text: '晚安\n...好好睡', mood: 'relaxed', animation: 'idle' },
      needsLLM: false,
    }),
  },
];
```

### 6.4.5 顯示模式指令

```typescript
const PRESENCE_COMMANDS: SlashCommand[] = [
  {
    command: '/出來逛逛',
    aliases: ['/自由', '/free', '/出來'],
    description: '讓角色在畫面上自由走動（Level 3）',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '太好了！被關在那個小圈圈裡好悶\n我出來透透氣～（伸懶腰）', mood: 'excited', animation: 'stretching' },
      riku: { text: '...終於放出來了', mood: 'neutral', animation: 'stretching' },
      action: { type: 'set_presence_mode', target: 'free' },
      needsLLM: false,
    }),
  },
  {
    command: '/回家',
    aliases: ['/收起來', '/hide', '/縮小'],
    description: '角色收回迷你頭像模式（Level 0）',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '好吧...（縮小）\n有事再叫我喔', mood: 'sad', animation: 'sad-idle' },
      riku: { text: '...嗯\n需要的時候叫我', mood: 'neutral', animation: null },
      action: { type: 'set_presence_mode', target: 'mini' },
      needsLLM: false,
    }),
  },
  {
    command: '/站好',
    aliases: ['/stand', '/陪我', '/站著'],
    description: '角色站在旁邊不走動（Level 2）',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '好啦好啦 不亂走了\n（乖乖站好）', mood: 'happy', animation: 'breathing-idle' },
      riku: { text: '嗯\n站這', mood: 'neutral', animation: 'breathing-idle' },
      action: { type: 'set_presence_mode', target: 'companion' },
      needsLLM: false,
    }),
  },
  {
    command: '/聊天',
    aliases: ['/chat', '/對話'],
    description: '打開對話模式（Level 1）',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '想聊什麼～', mood: 'happy', animation: 'waving' },
      riku: { text: '嗯 說', mood: 'neutral', animation: 'head-nod' },
      action: { type: 'set_presence_mode', target: 'chat' },
      needsLLM: false,
    }),
  },
  {
    command: '/變大',
    aliases: ['/bigger', '/放大'],
    description: '角色放大',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '我變大了！\n是不是更可愛了 (≧∀≦)', mood: 'excited', animation: 'bounce' },
      riku: { text: '...', mood: 'neutral', animation: null },
      action: { type: 'resize_character', target: 'bigger' },
      needsLLM: false,
    }),
  },
  {
    command: '/變小',
    aliases: ['/smaller', '/縮小一點'],
    description: '角色縮小',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '嗚 我變小了...\n你是不是嫌我太大隻', mood: 'sad', animation: 'disappointed' },
      riku: { text: '...嗯', mood: 'neutral', animation: null },
      action: { type: 'resize_character', target: 'smaller' },
      needsLLM: false,
    }),
  },
  {
    command: '/坐下',
    aliases: ['/sit', '/休息'],
    description: '讓角色坐下來',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '站好久了 休息一下\n（坐下晃腳）', mood: 'relaxed', animation: 'sitting-idle' },
      riku: { text: '...（坐下）', mood: 'relaxed', animation: 'sitting-idle' },
      action: { type: 'set_character_pose', target: 'sitting' },
      needsLLM: false,
    }),
  },
  {
    command: '/站起來',
    aliases: ['/standup', '/起來'],
    description: '讓角色站起來',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '好！精神來了！（跳起來）', mood: 'excited', animation: 'jump' },
      riku: { text: '（站起來）', mood: 'neutral', animation: 'breathing-idle' },
      action: { type: 'set_character_pose', target: 'standing' },
      needsLLM: false,
    }),
  },
  {
    command: '/過來',
    aliases: ['/come', '/到這裡'],
    description: '叫角色走到你的游標位置',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '來了來了！（跑過去）', mood: 'happy', animation: 'jogging' },
      riku: { text: '...（走過去）', mood: 'neutral', animation: 'walking' },
      action: { type: 'move_to_cursor', target: '' },
      needsLLM: false,
    }),
  },
  {
    command: '/走開',
    aliases: ['/go', '/旁邊去'],
    description: '叫角色走到畫面邊緣',
    category: 'interact',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '哼！不要我就不要\n（走到角落）...偷看', mood: 'sad', animation: 'sneak' },
      riku: { text: '...好\n（走到旁邊但還是看著你）', mood: 'neutral', animation: 'walking' },
      action: { type: 'move_to_edge', target: '' },
      needsLLM: false,
    }),
  },
];
```

### 6.5 角色指令

```typescript
const CHARACTER_COMMANDS: SlashCommand[] = [
  {
    command: '/切換角色',
    aliases: ['/switch', '/換人'],
    description: '切換雪凜/凜空',
    category: 'character',
    adminOnly: false,
    handler: (state) => {
      const switchTo = state.selectedCharacter === 'yukirin' ? 'riku' : 'yukirin';
      return {
        yukirin: switchTo === 'riku'
          ? { text: '哼！你居然要換人\n算了 凜空會照顧你的 (´;ω;`)', mood: 'sad', animation: 'sad-idle' }
          : { text: '你回來了！！\n我就知道你最喜歡我！(≧∀≦)', mood: 'excited', animation: 'victory' },
        riku: switchTo === 'riku'
          ? { text: '...她叫我好好照顧你\n嗯 我會的', mood: 'neutral', animation: 'head-nod' }
          : { text: '...嗯 她一直在問你什麼時候回來', mood: 'neutral', animation: null },
        action: { type: 'switch_character', target: switchTo },
        needsLLM: false,
      };
    },
  },
  {
    command: '/叫另一半',
    aliases: ['/couple', '/叫他', '/叫她'],
    description: '叫出另一個角色互動',
    category: 'character',
    adminOnly: false,
    handler: () => ({
      needsLLM: true,  // 需要 LLM 生成互動對話
    }),
  },
  {
    command: '/告白',
    aliases: ['/love', '/表白'],
    description: '向角色告白（會被拒絕）',
    category: 'character',
    adminOnly: false,
    handler: (state) => ({
      yukirin: { text: '欸！？\n我...我有男朋友了啦！\n不過謝謝你 嘿嘿', mood: 'shy', animation: 'embarrassed' },
      riku: { text: '...抱歉\n我有女朋友了\n（看向雪凜那邊）', mood: 'shy', animation: 'bashful' },
      needsLLM: false,
    }),
  },
  {
    command: '/吵架',
    aliases: ['/fight'],
    description: '讓兩個角色吵架（看戲）',
    category: 'character',
    adminOnly: false,
    handler: () => ({
      needsLLM: true,  // 需要 LLM 生成吵架劇情
    }),
  },
  {
    command: '/放閃',
    aliases: ['/flirt', '/sweet'],
    description: '讓兩個角色放閃',
    category: 'character',
    adminOnly: false,
    handler: () => ({
      needsLLM: true,  // 需要 LLM 生成甜蜜互動
    }),
  },
];
```

### 6.6 工具指令

```typescript
const TOOL_COMMANDS: SlashCommand[] = [
  {
    command: '/提醒',
    aliases: ['/remind', '/鬧鐘'],
    description: '設定提醒（/提醒 明天 9點 填問卷）',
    category: 'tool',
    adminOnly: false,
    handler: (state, args) => ({
      yukirin: { text: '好～ 我記住了\n到時候 LINE 通知你', mood: 'happy', animation: 'head-nod' },
      riku: { text: '記了\n...會提醒你', mood: 'neutral', animation: 'head-nod' },
      needsLLM: true,  // 需要 LLM 解析時間
    }),
  },
  {
    command: '/週報',
    aliases: ['/weekly', '/report'],
    description: '查看最近的週報',
    category: 'tool',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '你的週報在這～', mood: 'happy', animation: 'presenting' },
      riku: { text: '週報', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/profile#weekly-report' },
      needsLLM: false,
    }),
  },
  {
    command: '/設定',
    aliases: ['/settings', '/偏好'],
    description: '打開設定頁面',
    category: 'tool',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '不要把我的通知關掉喔！', mood: 'sad', animation: null },
      riku: { text: '設定', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/settings' },
      needsLLM: false,
    }),
  },
  {
    command: '/幫助',
    aliases: ['/help', '/指令', '/？'],
    description: '顯示所有可用指令',
    category: 'tool',
    adminOnly: false,
    handler: () => ({
      yukirin: { text: '我會的事情很多喔！看看這些指令～', mood: 'happy', animation: 'presenting' },
      riku: { text: '指令列表', mood: 'neutral', animation: null },
      action: { type: 'show_command_list', target: '' },
      needsLLM: false,
    }),
  },
];
```

### 6.7 管理員專屬指令

```typescript
const ADMIN_COMMANDS: SlashCommand[] = [
  {
    command: '/stats',
    aliases: ['/數據', '/狀態'],
    description: '即時平台數據',
    category: 'admin',
    adminOnly: true,
    handler: () => ({
      yukirin: { text: '老闆要看數據！讓我查查...', mood: 'thinking', animation: 'thinking' },
      riku: { text: '數據', mood: 'neutral', animation: null },
      needsLLM: true,  // 需要查 DB 然後生成摘要
    }),
  },
  {
    command: '/cost',
    aliases: ['/成本', '/花費'],
    description: '今日 AI 成本',
    category: 'admin',
    adminOnly: true,
    handler: () => ({
      yukirin: { text: '讓我算算今天花了多少...', mood: 'thinking', animation: 'thinking' },
      riku: { text: '今日成本', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/alerts',
    aliases: ['/警報', '/告警'],
    description: '未處理的警報',
    category: 'admin',
    adminOnly: true,
    handler: () => ({
      yukirin: { text: '讓我看看有什麼狀況...', mood: 'thinking', animation: 'looking-around' },
      riku: { text: '警報', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/admin/alerts' },
      needsLLM: false,
    }),
  },
  {
    command: '/ban',
    aliases: ['/封鎖'],
    description: '封鎖使用者（/ban userId 原因）',
    category: 'admin',
    adminOnly: true,
    handler: (state, args) => ({
      yukirin: { text: '收到 處理中...', mood: 'thinking', animation: 'thinking' },
      riku: { text: '...處理', mood: 'neutral', animation: null },
      needsLLM: true,  // 需要解析 userId 和原因
    }),
  },
  {
    command: '/broadcast',
    aliases: ['/廣播', '/公告'],
    description: '發送全站公告',
    category: 'admin',
    adminOnly: true,
    handler: () => ({
      yukirin: { text: '要發公告嗎？打給我 我幫你發！', mood: 'excited', animation: 'presenting' },
      riku: { text: '公告內容', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
];
```

---

## 七、情侶互動規則

```typescript
const COUPLE_RULES: Rule[] = [
  {
    id: 'couple_random_popup',
    condition: (s) => s.isGuideOpen && s.currentSessionRounds > 2 && Math.random() < 0.10,
    result: { needsLLM: true },  // 隨機互動需要 LLM 生成
    priority: 15,
    cooldown: 300,
  },
  {
    id: 'couple_user_mentions_partner',
    condition: (s, msg) => {
      const partner = s.selectedCharacter === 'yukirin' ? '凜空' : '雪凜';
      return msg?.includes(partner);
    },
    result: { needsLLM: true },  // 提到另一半需要 LLM 生成反應
    priority: 60,
    cooldown: 30,
  },
  {
    id: 'couple_user_praise',
    condition: (s, msg) => /好看|可愛|帥|喜歡你|愛你/.test(msg || ''),
    result: { needsLLM: true },
    priority: 50,
    cooldown: 60,
  },
  {
    id: 'couple_love_topic',
    condition: (s, msg) => /感情|男女朋友|喜歡|暗戀|告白|分手/.test(msg || ''),
    result: { needsLLM: true },  // 感情話題時另一半有 40% 機率冒出來
    priority: 40,
    cooldown: 120,
  },
];
```

---

## 八、漫畫式對話氣泡系統

### 8.1 氣泡外觀

```css
/* 漫畫式對話氣泡 — 從角色嘴巴冒出來 */

.speech-bubble {
  position: absolute;
  padding: 8px 14px;
  border-radius: 16px;
  max-width: 180px;
  font-size: 14px;
  font-family: 'Zen Maru Gothic', sans-serif;
  line-height: 1.5;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: none;
  z-index: 100;
  
  /* 從嘴巴膨脹出來的動畫 */
  animation: bubblePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: var(--tail-x) var(--tail-y);
}

/* 雪凜的氣泡 — 淡紫色 */
.speech-bubble--yukirin {
  background: rgba(184, 169, 232, 0.15);
  border: 1px solid rgba(184, 169, 232, 0.25);
  color: rgba(240, 235, 255, 0.9);
}

/* 凜空的氣泡 — 淡紅色 */
.speech-bubble--riku {
  background: rgba(201, 74, 74, 0.12);
  border: 1px solid rgba(201, 74, 74, 0.2);
  color: rgba(240, 235, 255, 0.9);
}

/* 小三角尖角（指向嘴巴） */
.speech-bubble::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: inherit;
  border: inherit;
  border-top: none;
  border-right: none;
}

/* 角色在左邊 → 尖角指向左 */
.speech-bubble--point-left::after {
  left: -6px;
  bottom: 16px;
  transform: rotate(45deg);
}

/* 角色在右邊 → 尖角指向右 */
.speech-bubble--point-right::after {
  right: -6px;
  bottom: 16px;
  transform: rotate(-135deg);
}

/* 膨脹出現 */
@keyframes bubblePop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

/* 淡出飄走 */
@keyframes bubbleFadeUp {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-15px); }
}
```

### 8.2 氣泡位置追蹤

```typescript
// 每幀追蹤 VRM head bone 位置，氣泡跟著走

class SpeechBubbleManager {
  private activeBubbles: Map<string, HTMLElement> = new Map();
  private camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;

  // 從 VRM 的 head bone 取得螢幕座標
  getHeadScreenPosition(vrm: VRM): { x: number; y: number } {
    const head = vrm.humanoid!.getNormalizedBoneNode('head')!;
    const worldPos = new THREE.Vector3();
    head.getWorldPosition(worldPos);

    // 3D → 螢幕座標
    const screenPos = worldPos.project(this.camera);
    return {
      x: (screenPos.x * 0.5 + 0.5) * this.canvas.width,
      y: (-screenPos.y * 0.5 + 0.5) * this.canvas.height,
    };
  }

  // 顯示氣泡
  showBubble(
    character: 'yukirin' | 'riku',
    text: string,
    vrm: VRM,
    duration: number = 4000
  ) {
    const headPos = this.getHeadScreenPosition(vrm);
    
    // 判斷角色在畫面左邊還是右邊
    const isLeft = headPos.x < window.innerWidth / 2;

    const bubble = document.createElement('div');
    bubble.className = `speech-bubble speech-bubble--${character} speech-bubble--point-${isLeft ? 'left' : 'right'}`;
    bubble.textContent = text;

    // 氣泡位置：頭部上方偏左或偏右
    if (isLeft) {
      bubble.style.left = (headPos.x + 30) + 'px';
    } else {
      bubble.style.right = (window.innerWidth - headPos.x + 30) + 'px';
    }
    bubble.style.top = (headPos.y - 70) + 'px';

    // 設定動畫原點（從尖角處膨脹）
    bubble.style.setProperty('--tail-x', isLeft ? '0%' : '100%');
    bubble.style.setProperty('--tail-y', '80%');

    document.getElementById('bubble-layer')!.appendChild(bubble);
    this.activeBubbles.set(character, bubble);

    // 持續時間後淡出
    setTimeout(() => {
      bubble.style.animation = 'bubbleFadeUp 0.5s ease-out forwards';
      setTimeout(() => {
        bubble.remove();
        this.activeBubbles.delete(character);
      }, 500);
    }, duration);
  }

  // 每幀更新氣泡位置（角色移動時氣泡跟著）
  update(yukirinVRM: VRM, rikuVRM?: VRM) {
    const yukirinBubble = this.activeBubbles.get('yukirin');
    if (yukirinBubble && yukirinVRM) {
      const pos = this.getHeadScreenPosition(yukirinVRM);
      const isLeft = pos.x < window.innerWidth / 2;
      if (isLeft) {
        yukirinBubble.style.left = (pos.x + 30) + 'px';
      } else {
        yukirinBubble.style.right = (window.innerWidth - pos.x + 30) + 'px';
      }
      yukirinBubble.style.top = (pos.y - 70) + 'px';
    }

    const rikuBubble = this.activeBubbles.get('riku');
    if (rikuBubble && rikuVRM) {
      const pos = this.getHeadScreenPosition(rikuVRM);
      const isLeft = pos.x < window.innerWidth / 2;
      if (isLeft) {
        rikuBubble.style.left = (pos.x + 30) + 'px';
      } else {
        rikuBubble.style.right = (window.innerWidth - pos.x + 30) + 'px';
      }
      rikuBubble.style.top = (pos.y - 70) + 'px';
    }
  }

  // 清除所有氣泡
  clearAll() {
    this.activeBubbles.forEach(b => b.remove());
    this.activeBubbles.clear();
  }
}
```

### 8.3 對話模式 vs 氣泡模式

```
使用者跟雪凜一對一聊天時：
  → 用傳統的聊天室氣泡（在對話面板裡）
  → 像 LINE 那樣一行一行

放風模式 / 角色自由移動時：
  → 用漫畫式氣泡（從嘴巴冒出來）
  → 因為角色在畫面上走來走去，氣泡要跟著她

情侶互動插話時：
  → 值班角色的回覆用聊天室氣泡
  → 另一半冒出來的插話用漫畫式氣泡（從畫面邊緣冒出來）
```

---

## 九、放風模式（雙人自由模式）

### 9.1 指令

```typescript
// 加到 INTERACT_COMMANDS

{
  command: '/放風',
  aliases: ['/兩個出來', '/情侶模式', '/double'],
  description: '讓雪凜和凜空一起出來互動',
  category: 'character',
  adminOnly: false,
  handler: () => ({
    yukirin: { text: '凜空！出來放風了！', mood: 'excited', animation: 'waving' },
    riku: { text: '...被你拖出來的', mood: 'neutral', animation: 'idle' },
    action: { type: 'set_presence_mode', target: 'couple_free' },
    needsLLM: false,
  }),
},
{
  command: '/收工',
  aliases: ['/回去', '/結束放風'],
  description: '讓兩人一起回去',
  category: 'character',
  adminOnly: false,
  handler: () => ({
    // 收工時的固定退場對話（不需要 LLM）
    coupleExit: [
      { character: 'yukirin', text: '好吧 收工了', mood: 'relaxed' },
      { character: 'yukirin', text: '凜空走了喔～', mood: 'happy' },
      { character: 'riku', text: '...嗯', mood: 'neutral' },
      { character: 'yukirin', text: '你就不能多說兩個字嗎', mood: 'angry' },
      { character: 'riku', text: '嗯嗯', mood: 'neutral' },
      { character: 'yukirin', text: '你很煩欸！！', mood: 'angry' },
    ],
    action: { type: 'set_presence_mode', target: 'companion' },
    needsLLM: false,
  }),
},
```

### 9.2 放風模式架構

```typescript
// lib/agent/coupleMode.ts

interface CoupleState {
  isActive: boolean;
  yukirinPosition: { x: number; y: number };
  rikuPosition: { x: number; y: number };
  currentTopic: string | null;
  roundsPlayed: number;
  lastInteractionTime: number;
}

class CoupleFreeMode {
  private state: CoupleState;
  private bubbleManager: SpeechBubbleManager;
  private intervalId: number | null = null;

  // 啟動放風模式
  start() {
    this.state = {
      isActive: true,
      yukirinPosition: { x: window.innerWidth * 0.3, y: window.innerHeight * 0.6 },
      rikuPosition: { x: window.innerWidth * 0.7, y: window.innerHeight * 0.6 },
      currentTopic: null,
      roundsPlayed: 0,
      lastInteractionTime: Date.now(),
    };

    // 載入凜空的 VRM（如果還沒載入）
    loadRikuVRM();

    // 雪凜在左，凜空在右
    moveCharacterTo('yukirin', this.state.yukirinPosition);
    moveCharacterTo('riku', this.state.rikuPosition);

    // 讓他們面對面
    setCharacterFacing('yukirin', 'right');
    setCharacterFacing('riku', 'left');

    // 開始自動對話（每 15-30 秒一輪）
    this.startAutoChat();
  }

  // 自動對話引擎
  startAutoChat() {
    const chat = async () => {
      if (!this.state.isActive) return;

      // 隨機間隔 15-30 秒
      const delay = 15000 + Math.random() * 15000;

      this.intervalId = window.setTimeout(async () => {
        await this.playOneRound();
        chat(); // 下一輪
      }, delay);
    };
    chat();
  }

  // 播放一輪對話
  async playOneRound() {
    // 隨機選話題
    const topic = this.pickTopic();

    // 用 LLM 生成對話（但有嚴格限制）
    const dialogue = await this.generateDialogue(topic);

    // 逐句播放
    for (const line of dialogue.lines) {
      // 角色轉向對方
      if (line.character === 'yukirin') {
        setCharacterFacing('yukirin', 'right');
      } else {
        setCharacterFacing('riku', 'left');
      }

      // 播放表情和動畫
      setCharacterMood(line.character, line.mood);
      if (line.animation) {
        playAnimation(line.character, line.animation);
      }

      // 顯示漫畫氣泡
      const vrm = line.character === 'yukirin' ? yukirinVRM : rikuVRM;
      this.bubbleManager.showBubble(line.character, line.text, vrm, 3000);

      // 等待氣泡顯示完
      await wait(2000);
    }

    // 兩個氣泡同時顯示一下
    await wait(2000);

    this.state.roundsPlayed++;
  }

  // 話題池
  pickTopic(): string {
    const topics = [
      'discuss_user',        // 討論剛才的使用者
      'work_today',          // 今天的工作量
      'yukirin_complain',    // 雪凜抱怨凜空冷淡
      'riku_secret_praise',  // 凜空偷偷誇雪凜
      'zaicai_fat',          // 招財最近是不是胖了
      'who_popular',         // 誰比較受歡迎
      'say_love',            // 雪凜逼凜空說喜歡她
      'food_argue',          // 爭論今天吃什麼
      'yukirin_clumsy',      // 雪凜犯蠢的事
      'riku_cool_fail',      // 凜空耍帥失敗
      'future_plans',        // 討論 Insight 的未來
      'user_stories',        // 討論使用者的故事
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  // 生成對話（嚴格限制格式）
  async generateDialogue(topic: string) {
    return await callAI({
      taskType: 'guide_chat',
      systemPrompt: `你要生成雪凜和凜空的 3-4 輪對話。
        話題：${topic}

        嚴格規則：
        - 雪凜每句不超過 15 個字
        - 凜空每句不超過 10 個字
        - 凜空大量用「...」
        - 不要顏文字（氣泡太小放不下）
        - 對話要像真的在聊天 不是在表演
        - 要好笑或甜

        輸出 JSON：
        {
          "lines": [
            { "character": "yukirin", "text": "...", "mood": "...", "animation": null },
            { "character": "riku", "text": "...", "mood": "...", "animation": null },
            ...
          ]
        }`,
      messages: [{ role: 'user', content: `生成話題：${topic}` }],
      maxTokens: 200,
      applyYukirinPersona: false,
      quotaType: 'system',
    });
  }

  // 使用者插話
  async userInterrupt(message: string) {
    // 兩個角色同時轉向使用者（面向前方）
    setCharacterFacing('yukirin', 'front');
    setCharacterFacing('riku', 'front');

    // 生成兩人對使用者插話的反應
    const response = await callAI({
      taskType: 'guide_chat',
      systemPrompt: `使用者插入了雪凜和凜空的對話。
        兩人都轉頭看使用者。
        各自回應一句。
        雪凜不超過 15 字，凜空不超過 10 字。
        輸出 JSON：{ "lines": [...] }`,
      messages: [{ role: 'user', content: message }],
      maxTokens: 100,
      applyYukirinPersona: false,
      quotaType: 'chat',
    });

    // 播放回應
    for (const line of response.lines) {
      const vrm = line.character === 'yukirin' ? yukirinVRM : rikuVRM;
      this.bubbleManager.showBubble(line.character, line.text, vrm, 3000);
      await wait(1500);
    }

    // 回應完後面對面繼續聊
    await wait(2000);
    setCharacterFacing('yukirin', 'right');
    setCharacterFacing('riku', 'left');
  }

  // 結束放風
  stop() {
    this.state.isActive = false;
    if (this.intervalId) clearTimeout(this.intervalId);
    this.bubbleManager.clearAll();
    // 播放退場動畫
    unloadRikuVRM();
  }
}
```

### 9.3 放風時的走動行為

```typescript
const COUPLE_FREE_MOVEMENT: Rule[] = [
  {
    id: 'couple_walk_together',
    condition: (s) => s.presenceMode === 'couple_free' && Math.random() < 0.05,
    result: {
      action: { type: 'couple_walk_together', target: '' },
      // 兩人一起走到畫面某個位置
      // 雪凜走前面，凜空跟在後面
    },
    priority: 5,
    cooldown: 30,
  },
  {
    id: 'couple_yukirin_chase_riku',
    condition: (s) => s.presenceMode === 'couple_free' && Math.random() < 0.03,
    result: {
      yukirin: { text: '凜空等我！', mood: 'excited', animation: 'jogging' },
      riku: { text: null, mood: 'neutral', animation: 'walking' },
      action: { type: 'yukirin_chase_riku', target: '' },
      // 凜空走開，雪凜追上去
    },
    priority: 5,
    cooldown: 60,
  },
  {
    id: 'couple_sit_together',
    condition: (s) => s.presenceMode === 'couple_free' && s.timeOnPage > 120 && Math.random() < 0.1,
    result: {
      action: { type: 'couple_sit_together', target: '' },
      // 兩人找個地方並排坐下
      // 雪凜坐比較近（靠在凜空旁邊）
    },
    priority: 3,
    cooldown: 180,
  },
  {
    id: 'couple_yukirin_poke_riku',
    condition: (s) => s.presenceMode === 'couple_free' && Math.random() < 0.04,
    result: {
      yukirin: { text: '欸', mood: 'wink', animation: 'poke' },
      riku: { text: '...幹嘛', mood: 'neutral', animation: null },
      // 雪凜走過去戳凜空
    },
    priority: 5,
    cooldown: 120,
  },
  {
    id: 'couple_riku_pat_yukirin',
    condition: (s) => s.presenceMode === 'couple_free' && Math.random() < 0.02,
    result: {
      yukirin: { text: null, mood: 'shy', animation: 'bashful' },
      riku: { text: null, mood: 'shy', animation: null },
      // 凜空偷偷摸雪凜的頭（稀有事件）
      // 雪凜會害羞
    },
    priority: 10,
    cooldown: 300,
  },
];
```

### 9.4 放風模式的對話範例

```
話題：yukirin_complain（雪凜抱怨凜空冷淡）

  ╭──────────╮
  │ 你今天都沒跟 │╲
  │ 我說話欸    │ ╲
  ╰──────────╯   ╲
                  ╭──╮  ╭──╮
                  │雪│  │凜│
                  │凜│  │空│
                  ╰──╯  ╰──╯
                 ╱ ╭──────╮
               ╱  │ ...有嗎 │
                  ╰──────╯

  （停 2 秒）

  ╭──────────╮
  │ 有！你只說了 │╲
  │ 三個字     │ ╲
  ╰──────────╯   ╲
                  ╭──╮  ╭──╮
                  │雪│  │凜│
                  │凜│  │空│
                  ╰──╯  ╰──╯
                 ╱ ╭───────────╮
               ╱  │ ...現在四個了 │
                  ╰───────────╯


話題：riku_secret_praise（凜空偷偷誇雪凜）

  （凜空以為雪凜沒在聽）

                  ╭──╮  ╭──╮
                  │雪│  │凜│
                  │凜│  │空│
                  ╰──╯  ╰──╯
                 ╱ ╭────────────╮
               ╱  │ ...她其實很努力 │
                  ╰────────────╯

  ╭──────────╮
  │ 你說什麼！！ │╲
  │ 我聽到了    │ ╲
  ╰──────────╯   ╲
                  ╭──╮  ╭──╮
                  │雪│  │凜│
                  │凜│  │空│
                  ╰──╯  ╰──╯
                 ╱ ╭─────╮
               ╱  │ ...沒說 │
                  ╰─────╯


話題：say_love（雪凜逼凜空說喜歡她）

  ╭──────────╮
  │ 凜空      │╲
  │ 你喜歡我嗎 │ ╲
  ╰──────────╯   ╲
                  ╭──╮  ╭──╮
                  │雪│  │凜│
                  │凜│  │空│
                  ╰──╯  ╰──╯
                 ╱ ╭─────────╮
               ╱  │ ...下一個話題 │
                  ╰─────────╯

  ╭──────╮
  │ 回答我！ │╲
  ╰──────╯  ╲
              ╲
                  ╭──╮  ╭──╮
                  │雪│  │凜│
                  │凜│  │空│
                  ╰──╯  ╰──╯
                 ╱ ╭────────────────╮
               ╱  │ ...你不是已經知道了 │
                  ╰────────────────╯
```

---

## 十、管理員專屬規則

```typescript
const ADMIN_RULES: Rule[] = [
  {
    id: 'admin_login_greeting',
    condition: (s) => s.isAdmin && s.pageVisitCount === 1 && s.timeOnPage < 5,
    result: {
      yukirin: { text: '老闆來了～\n今天 {dau} 人在線', mood: 'happy', animation: 'salute' },
      riku: { text: '老闆\n{dau} 人在線 系統正常', mood: 'neutral', animation: 'head-nod' },
    },
    priority: 100,
    cooldown: 3600,
  },
  {
    id: 'admin_late_night',
    condition: (s) => s.isAdmin && s.currentHour >= 1 && s.currentHour < 5,
    result: {
      yukirin: { text: '老闆你怎麼這麼晚還在...\n要注意身體欸', mood: 'sad', animation: 'sad-idle' },
      riku: { text: '...太晚了\n明天再看吧', mood: 'neutral', animation: null },
    },
    priority: 70,
    cooldown: 7200,
  },
  {
    id: 'admin_long_absence',
    condition: (s) => s.isAdmin && s.daysSinceLastVisit >= 3,
    result: {
      yukirin: { text: '老闆你是不是把我們忘了\n我一個人顧了 {days} 天欸\n凜空也快撐不住了', mood: 'sad', animation: 'crying' },
      riku: { text: '...{days} 天沒來了\n她一直在唸', mood: 'neutral', animation: null },
    },
    priority: 95,
    cooldown: 86400,
  },
  {
    id: 'admin_yukirin_brag',
    condition: (s) => s.isAdmin && Math.random() < 0.15 && s.currentSessionRounds > 3,
    result: {
      yukirin: { text: '老闆！今天我幫了 {helpCount} 個人喔\n誇我！快誇我！', mood: 'excited', animation: 'bounce' },
      riku: { text: '（她又在邀功了）', mood: 'neutral', animation: null },
    },
    priority: 20,
    cooldown: 3600,
  },
];
```

---

## 九、智慧升級判斷（何時需要 LLM）

```typescript
// 規則引擎搞不定的情況才花 token

function needsLLM(state: UserState, message?: string): boolean {
  // 1. 使用者主動打字問問題 → 一定要 LLM
  if (message && message.length > 0 && !message.startsWith('/')) return true;

  // 2. 斜線指令標記為 needsLLM → 要 LLM
  // （已在各指令的 handler 裡標記）

  // 3. 情侶互動 → 要 LLM（因為要生成自然對話）

  // 4. 其他所有情況 → 規則引擎處理，0 token
  return false;
}

// 統計：大約 70-80% 的互動不需要 LLM
// 只有使用者真正「打字聊天」或觸發複雜互動才花 token
```

---

## 十、規則引擎實作代碼

```typescript
// lib/agent/ruleEngine.ts

class RuleEngine {
  private rules: Rule[] = [];
  private cooldowns: Map<string, number> = new Map();

  constructor() {
    this.rules = [
      ...PAGE_RULES,
      ...IDLE_RULES,
      ...EVENT_RULES,
      ...TIME_RULES,
      ...COUPLE_RULES,
      ...ADMIN_RULES,
    ].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  evaluate(state: UserState, message?: string): RuleResult | null {
    for (const rule of this.rules) {
      // 1. 檢查冷卻
      const cooldownKey = rule.cooldownKey || rule.id;
      const lastTriggered = this.cooldowns.get(cooldownKey) || 0;
      const cooldownMs = (rule.cooldownSeconds || 0) * 1000;
      if (Date.now() - lastTriggered < cooldownMs) continue;

      // 2. 檢查條件
      let conditionMet = false;
      try {
        conditionMet = rule.condition(state, message);
      } catch { continue; }

      if (!conditionMet) continue;

      // 3. 命中！
      this.cooldowns.set(cooldownKey, Date.now());

      // 4. 取對應角色的結果
      const character = state.selectedCharacter;
      const result = rule.result[character] || rule.result.yukirin;

      return {
        triggered: true,
        character,
        text: this.interpolate(result.text, state),
        mood: result.mood,
        animation: result.animation,
        action: result.action || null,
        sound: result.sound || null,
        priority: rule.priority || 0,
        cooldownKey,
        cooldownSeconds: rule.cooldownSeconds || 0,
      };
    }

    return null; // 沒有規則命中
  }

  // 替換模板變數
  private interpolate(text: string | null, state: UserState): string | null {
    if (!text) return null;
    return text
      .replace('{nickname}', state.nickname || '你')
      .replace('{zcoinBalance}', String(state.zcoinBalance))
      .replace('{balance}', String(state.zcoinBalance))
      .replace('{streakDays}', String(state.streakDays))
      .replace('{visitCount}', String(state.visitCount))
      .replace('{dau}', '{dau}')  // 這個需要即時查 DB
      .replace('{days}', String(state.daysSinceLastVisit))
      .replace('{helpCount}', '{helpCount}');  // 需要即時查 DB
  }

  // 處理斜線指令
  handleSlashCommand(command: string, state: UserState): CommandResult | null {
    const allCommands = [
      ...BASIC_COMMANDS,
      ...SOCIAL_COMMANDS,
      ...INTERACT_COMMANDS,
      ...CHARACTER_COMMANDS,
      ...TOOL_COMMANDS,
      ...(state.isAdmin ? ADMIN_COMMANDS : []),
    ];

    // 解析指令和參數
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    for (const def of allCommands) {
      if (def.command === cmd || def.aliases.includes(cmd)) {
        if (def.adminOnly && !state.isAdmin) {
          return {
            yukirin: { text: '這個指令只有老闆能用喔', mood: 'thinking', animation: null },
            riku: { text: '...權限不夠', mood: 'neutral', animation: null },
            needsLLM: false,
          };
        }
        return def.handler(state, args);
      }
    }

    return null; // 沒找到指令
  }

  // 取得指令選單（輸入 / 時顯示）
  getCommandList(state: UserState, filter: string = ''): SlashCommand[] {
    const allCommands = [
      ...BASIC_COMMANDS,
      ...SOCIAL_COMMANDS,
      ...INTERACT_COMMANDS,
      ...CHARACTER_COMMANDS,
      ...TOOL_COMMANDS,
      ...(state.isAdmin ? ADMIN_COMMANDS : []),
    ];

    if (!filter) return allCommands;

    return allCommands.filter(c =>
      c.command.includes(filter) ||
      c.aliases.some(a => a.includes(filter)) ||
      c.description.includes(filter)
    );
  }
}

export const ruleEngine = new RuleEngine();
```

---

## 十一、規則優先級與衝突處理

```
優先級定義（數字越高越優先）：

100  管理員登入打招呼
95   成就解鎖、首儲、連續 30 天、管理員長期未歸
90   新使用者首次進入、問卷完成
85   儲值成功、連續 7 天
80   結果頁出現、分享成功
70   問卷放棄、深夜提醒
60   使用者提到另一半、問卷開始
50   結果頁停留、使用者誇獎、Z幣不足
40   Z幣獲得、購買
35   問卷快填完
30   結果分享建議、成就快達成
25   商城逛街
20   社群快速滾動、商城買不起、管理員邀功
15   情侶隨機互動、社群長時間閱讀
10   設定頁
5    閒置 30 秒
3    閒置 60/120 秒
2    閒置 300 秒（坐下來）

衝突處理：
  - 同時命中多條規則 → 只執行優先級最高的
  - 同優先級 → 執行先遍歷到的
  - 有冷卻的規則在冷卻中 → 跳過，檢查下一條
```

---

## 十二、驗收清單

### 螢幕感知
- [ ] PageTracker 正確追蹤頁面、停留時間、滾動
- [ ] 問卷頁卡住 30 秒觸發提醒
- [ ] 結果頁停留 15 秒觸發解讀建議
- [ ] 商城逛 20 秒觸發反應
- [ ] 儲值頁猶豫觸發安慰
- [ ] 快速滾動偵測正常

### 閒置行為
- [ ] 30 秒/60 秒/120 秒/300 秒 各階段正確
- [ ] 閒置後回來觸發歡迎
- [ ] 角色做相應動畫

### 事件觸發
- [ ] 問卷完成/分享/Z幣/成就 全部正確
- [ ] 音效跟隨事件播放
- [ ] 連續登入里程碑正確

### 時間感知
- [ ] 深夜/早晨/午餐/週末 正確觸發
- [ ] 冷卻時間正確（不會重複提醒）

### 斜線指令
- [ ] 輸入 / 彈出指令選單
- [ ] fuzzy search 篩選正常
- [ ] 所有基本指令正常
- [ ] 所有互動指令 + 動畫正常
- [ ] 管理員指令只有管理員看得到
- [ ] /幫助 顯示完整列表

### 情侶互動
- [ ] 10% 隨機觸發正常
- [ ] 提到另一半觸發正常
- [ ] /叫另一半 /告白 /吵架 /放閃 正常
- [ ] 冷卻時間正確

### 規則引擎核心
- [ ] 優先級排序正確
- [ ] 冷卻系統正確
- [ ] 模板變數替換正確
- [ ] 70-80% 互動不花 token
- [ ] 雪凜和凜空的回應風格不同
