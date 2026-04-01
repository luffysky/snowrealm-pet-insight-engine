/**
 * 雪凜 AI Agent 規則引擎
 * 零 Token 的智慧反應 — 能用 if/else 解決的絕不花 token
 */

export interface UserState {
  userId: string
  nickname: string
  isAdmin: boolean
  isOwner: boolean
  selectedCharacter: 'yukirin' | 'riku'

  // 角色顯示模式
  presenceMode: 'mini' | 'chat' | 'companion' | 'free'
  characterSize: number  // 0.5 ~ 2.0

  // 頁面狀態
  currentPage: string
  timeOnPage: number          // 秒
  scrollPosition: number      // 0-100
  scrollSpeed: 'idle' | 'normal' | 'fast' | 'crazy'
  isTyping: boolean
  lastClickTarget: string
  pageVisitCount: number      // 這頁今天來了幾次

  // 問卷狀態
  currentSurveyId: string | null
  currentQuestionIndex: number
  totalQuestions: number

  // 對話狀態
  isGuideOpen: boolean
  currentSessionRounds: number

  // 歷史
  visitCount: number
  surveysCompleted: number
  zcoinBalance: number
  streakDays: number
  daysSinceLastVisit: number

  // 時間
  currentHour: number         // 0-23
  dayOfWeek: number           // 0-6
  isWeekend: boolean
}

export interface RuleResult {
  triggered: boolean
  character: 'yukirin' | 'riku'
  text: string | null
  mood: string
  animation: string | null
  action: { type: string; target: string } | null
  sound: string | null
  priority: number
  cooldownKey: string
  cooldownSeconds: number
}

interface CharacterResponse {
  text: string | null
  mood: string
  animation: string | null
  sound?: string
  action?: { type: string; target: string }
}

interface Rule {
  id: string
  condition: (state: UserState, message?: string) => boolean
  result: {
    yukirin?: CharacterResponse
    riku?: CharacterResponse
    action?: { type: string; target: string }
    needsLLM?: boolean
  }
  priority: number
  cooldown?: number  // seconds
  cooldownKey?: string
}

// ── 頁面感知規則 ──────────────────────────────────────────────────────────────

const PAGE_RULES: Rule[] = [
  {
    id: 'home_new_user',
    condition: (s) => s.currentPage === '/' && s.visitCount === 1,
    result: {
      yukirin: { text: '欸嘿～ 第一次來嗎\n我是雪凜 讓我帶你逛逛', mood: 'wink', animation: 'wave' },
      riku:    { text: '第一次來？\n...跟我走', mood: 'neutral', animation: 'nod' },
    },
    priority: 100,
    cooldown: 0,
  },
  {
    id: 'home_returning',
    condition: (s) => s.currentPage === '/' && s.daysSinceLastVisit >= 3,
    result: {
      yukirin: { text: '你是不是把我忘了\n我一個人顧了好多天欸 (´;ω;`)', mood: 'sad', animation: 'idle' },
      riku:    { text: '好久不見\n...她很想你 我沒有', mood: 'neutral', animation: 'idle' },
    },
    priority: 90,
    cooldown: 86400,
  },
  {
    id: 'home_daily',
    condition: (s) => s.currentPage === '/' && s.visitCount > 1 && s.daysSinceLastVisit === 0 && s.pageVisitCount === 1,
    result: {
      yukirin: { text: '嗨嗨～ 今天想做什麼', mood: 'happy', animation: 'wave' },
      riku:    { text: '嗯 來了啊', mood: 'neutral', animation: 'nod' },
    },
    priority: 50,
    cooldown: 3600,
  },
  {
    id: 'survey_start',
    condition: (s) => s.currentPage.startsWith('/survey') && s.currentQuestionIndex === 0 && s.timeOnPage < 5,
    result: {
      yukirin: { text: '直覺選就好\n不用想太多', mood: 'happy', animation: 'excited' },
      riku:    { text: '準備好了？\n...開始吧', mood: 'neutral', animation: 'nod' },
    },
    priority: 60,
    cooldown: 300,
  },
  {
    id: 'survey_stuck',
    condition: (s) => s.currentPage.startsWith('/survey') && s.timeOnPage > 30 && !s.isTyping,
    result: {
      yukirin: { text: '卡住了嗎？\n這題不用想太多 直覺選就好', mood: 'thinking', animation: 'think' },
      riku:    { text: '...不用想太久\n沒有對錯', mood: 'thinking', animation: 'think' },
    },
    priority: 40,
    cooldown: 60,
  },
  {
    id: 'survey_halfway',
    condition: (s) => s.currentPage.startsWith('/survey') &&
      s.totalQuestions > 0 && s.currentQuestionIndex === Math.floor(s.totalQuestions / 2),
    result: {
      yukirin: { text: '已經一半了！加油加油！', mood: 'excited', animation: 'excited' },
      riku:    { text: '一半了\n...繼續', mood: 'neutral', animation: 'nod' },
    },
    priority: 30,
    cooldown: 0,
    cooldownKey: 'survey_halfway_once',
  },
  {
    id: 'survey_almost_done',
    condition: (s) => s.currentPage.startsWith('/survey') &&
      s.totalQuestions > 0 && (s.totalQuestions - s.currentQuestionIndex) <= 2,
    result: {
      yukirin: { text: '快好了快好了！\n再一下下！', mood: 'excited', animation: 'excited' },
      riku:    { text: '...最後了', mood: 'neutral', animation: null },
    },
    priority: 35,
    cooldown: 0,
    cooldownKey: 'survey_almost_once',
  },
  {
    id: 'result_arrived',
    condition: (s) => (s.currentPage.startsWith('/done') || s.currentPage.startsWith('/result')) && s.timeOnPage < 3,
    result: {
      yukirin: { text: '出來了出來了！！', mood: 'excited', animation: 'excited' },
      riku:    { text: '結果出來了', mood: 'happy', animation: 'excited' },
    },
    priority: 80,
    cooldown: 0,
    cooldownKey: 'result_once',
  },
  {
    id: 'result_lingering',
    condition: (s) => (s.currentPage.startsWith('/done') || s.currentPage.startsWith('/result')) && s.timeOnPage > 15,
    result: {
      yukirin: { text: '要不要讓我幫你解讀？', mood: 'thinking', animation: 'think' },
      riku:    { text: '...想聽分析嗎', mood: 'thinking', animation: 'think' },
    },
    priority: 50,
    cooldown: 300,
  },
  {
    id: 'result_share_nudge',
    condition: (s) => (s.currentPage.startsWith('/done') || s.currentPage.startsWith('/result')) && s.timeOnPage > 30,
    result: {
      yukirin: { text: '你的結果蠻特別的欸\n不分享一下嗎', mood: 'wink', animation: null },
      riku:    { text: '結果不錯\n...分享看看？', mood: 'neutral', animation: null },
    },
    priority: 30,
    cooldown: 600,
  },
  {
    id: 'social_fast_scroll',
    condition: (s) => s.currentPage.startsWith('/social') && s.scrollSpeed === 'crazy',
    result: {
      yukirin: { text: '欸你滑那麼快看得到嗎', mood: 'thinking', animation: 'shake_head' },
      riku:    { text: '...慢點', mood: 'neutral', animation: null },
    },
    priority: 20,
    cooldown: 120,
  },
  {
    id: 'shop_cant_afford',
    condition: (s) => s.currentPage.startsWith('/shop') && s.zcoinBalance < 30,
    result: {
      yukirin: { text: '你的 Z 幣...\n招財看了都替你擔心\n要不要去賺一點', mood: 'wink', animation: null },
      riku:    { text: '餘額不太夠\n...去做問卷賺一點？', mood: 'neutral', animation: null },
    },
    priority: 20,
    cooldown: 600,
  },
  {
    id: 'settings_visit',
    condition: (s) => s.currentPage.startsWith('/settings') && s.timeOnPage < 5,
    result: {
      yukirin: { text: '要改設定嗎？\n不要把我的通知關掉喔 (´;ω;`)', mood: 'sad', animation: null },
      riku:    { text: '...設定什麼', mood: 'neutral', animation: null },
    },
    priority: 10,
    cooldown: 3600,
  },
]

// ── 閒置行為規則 ──────────────────────────────────────────────────────────────

const IDLE_RULES: Rule[] = [
  {
    id: 'idle_30s',
    condition: (s) => s.timeOnPage > 30 && !s.isTyping && s.scrollSpeed === 'idle',
    result: {
      yukirin: { text: '你在發呆嗎～', mood: 'thinking', animation: 'think' },
      riku:    { text: null, mood: 'neutral', animation: 'think' },
    },
    priority: 5,
    cooldown: 120,
  },
  {
    id: 'idle_120s',
    condition: (s) => s.timeOnPage > 120 && !s.isTyping && s.scrollSpeed === 'idle',
    result: {
      yukirin: { text: '你還在嗎...\n我好無聊', mood: 'sad', animation: null },
      riku:    { text: null, mood: 'neutral', animation: 'stretch' },
    },
    priority: 3,
    cooldown: 300,
  },
]

// ── 事件觸發規則 ──────────────────────────────────────────────────────────────

export const EVENT_RULES_MAP: Record<string, CharacterResponse & { riku: CharacterResponse }> = {
  'survey.complete': {
    text: '填完了！！\n讓我看看結果...', mood: 'excited', animation: 'excited', sound: 'complete',
    riku: { text: '填完了\n...看看結果', mood: 'happy', animation: 'excited', sound: 'complete' },
  },
  'survey.share': {
    text: '分享成功！+5 Z幣！\n招財替你開心', mood: 'excited', animation: 'excited', sound: 'zcoin',
    riku: { text: '分享了 +5 Z幣', mood: 'neutral', animation: 'nod', sound: 'zcoin' },
  },
  'zcoin.earn': {
    text: '招財說你又賺到 Z幣了！', mood: 'happy', animation: 'excited', sound: 'zcoin',
    riku: { text: '...Z幣到帳了', mood: 'neutral', animation: null, sound: 'zcoin' },
  },
  'zcoin.insufficient': {
    text: 'Z 幣不夠啦...\n要不要去賺一點？', mood: 'sad', animation: null,
    riku: { text: '...不夠\n去做問卷？', mood: 'neutral', animation: 'shake_head' },
  },
  'achievement.unlock': {
    text: '哇！解鎖成就了！\n太厲害了吧！！', mood: 'excited', animation: 'excited', sound: 'achievement',
    riku: { text: '成就解鎖了\n...不錯', mood: 'happy', animation: 'excited', sound: 'achievement' },
  },
  'payment.completed': {
    text: '招財把 Z 幣存好了！', mood: 'excited', animation: 'excited', sound: 'zcoin',
    riku: { text: '到帳了', mood: 'neutral', animation: 'nod', sound: 'zcoin' },
  },
}

// ── 時間感知規則 ──────────────────────────────────────────────────────────────

const TIME_RULES: Rule[] = [
  {
    id: 'late_night',
    condition: (s) => s.currentHour >= 0 && s.currentHour < 5,
    result: {
      yukirin: { text: '已經凌晨了欸...\n你不用睡嗎', mood: 'sad', animation: null },
      riku:    { text: '...太晚了\n去睡', mood: 'neutral', animation: null },
    },
    priority: 60,
    cooldown: 3600,
  },
  {
    id: 'early_morning',
    condition: (s) => s.currentHour >= 5 && s.currentHour < 7,
    result: {
      yukirin: { text: '好早！\n你是早起還是還沒睡...', mood: 'thinking', animation: null },
      riku:    { text: '...早', mood: 'neutral', animation: 'stretch' },
    },
    priority: 30,
    cooldown: 3600,
  },
  {
    id: 'weekend_morning',
    condition: (s) => s.isWeekend && s.currentHour >= 9 && s.currentHour < 12 && s.timeOnPage < 10,
    result: {
      yukirin: { text: '週末還來找我！\n今天想做什麼～', mood: 'happy', animation: 'wave' },
      riku:    { text: '週末啊\n...不用出去玩嗎', mood: 'neutral', animation: null },
    },
    priority: 20,
    cooldown: 86400,
  },
  {
    id: 'lunch_time',
    condition: (s) => s.currentHour === 12 && s.timeOnPage > 30,
    result: {
      yukirin: { text: '中午了欸\n你吃飯了嗎\n別只顧著玩', mood: 'thinking', animation: null },
      riku:    { text: '...去吃飯', mood: 'neutral', animation: null },
    },
    priority: 15,
    cooldown: 86400,
  },
]

// ── 情侶互動規則 ──────────────────────────────────────────────────────────────

const COUPLE_RULES: Rule[] = [
  {
    id: 'couple_user_mentions_partner',
    condition: (s, msg) => {
      const partner = s.selectedCharacter === 'yukirin' ? '凜空' : '雪凜'
      return !!(msg?.includes(partner))
    },
    result: { needsLLM: true },
    priority: 60,
    cooldown: 30,
  },
  {
    id: 'couple_user_praise',
    condition: (s, msg) => /好看|可愛|帥|喜歡你|愛你/.test(msg ?? ''),
    result: { needsLLM: true },
    priority: 50,
    cooldown: 60,
  },
  {
    id: 'couple_love_topic',
    condition: (s, msg) => /感情|男女朋友|喜歡|暗戀|告白|分手/.test(msg ?? ''),
    result: { needsLLM: true },
    priority: 40,
    cooldown: 120,
  },
]

// ── 管理員規則 ────────────────────────────────────────────────────────────────

const ADMIN_RULES: Rule[] = [
  {
    id: 'admin_login_greeting',
    condition: (s) => s.isAdmin && s.pageVisitCount === 1 && s.timeOnPage < 5,
    result: {
      yukirin: { text: '老闆來了～\n系統正常運作中 (≧∀≦)', mood: 'happy', animation: 'wave' },
      riku:    { text: '老闆\n系統正常', mood: 'neutral', animation: 'nod' },
    },
    priority: 100,
    cooldown: 3600,
  },
  {
    id: 'admin_late_night',
    condition: (s) => s.isAdmin && s.currentHour >= 1 && s.currentHour < 5,
    result: {
      yukirin: { text: '老闆你怎麼這麼晚還在...\n要注意身體欸', mood: 'sad', animation: null },
      riku:    { text: '...太晚了\n明天再看吧', mood: 'neutral', animation: null },
    },
    priority: 70,
    cooldown: 7200,
  },
  {
    id: 'admin_long_absence',
    condition: (s) => s.isAdmin && s.daysSinceLastVisit >= 3,
    result: {
      yukirin: { text: '老闆你是不是把我們忘了\n我一個人顧了好多天欸', mood: 'sad', animation: null },
      riku:    { text: '...很多天沒來了\n她一直在唸', mood: 'neutral', animation: null },
    },
    priority: 95,
    cooldown: 86400,
  },
]

// ── 規則引擎 ──────────────────────────────────────────────────────────────────

const ALL_RULES: Rule[] = [
  ...PAGE_RULES,
  ...IDLE_RULES,
  ...TIME_RULES,
  ...COUPLE_RULES,
  ...ADMIN_RULES,
].sort((a, b) => b.priority - a.priority)

class RuleEngine {
  private cooldowns = new Map<string, number>()

  evaluate(state: UserState, message?: string): RuleResult | null {
    for (const rule of ALL_RULES) {
      const cooldownKey = rule.cooldownKey ?? rule.id
      const lastTriggered = this.cooldowns.get(cooldownKey) ?? 0
      const cooldownMs = (rule.cooldown ?? 0) * 1000
      if (Date.now() - lastTriggered < cooldownMs) continue

      let conditionMet = false
      try { conditionMet = rule.condition(state, message) } catch { continue }
      if (!conditionMet) continue

      this.cooldowns.set(cooldownKey, Date.now())

      // 如果只是標記 needsLLM（情侶觸發）
      if (rule.result.needsLLM) {
        return {
          triggered: true,
          character: state.selectedCharacter,
          text: null,
          mood: 'neutral',
          animation: null,
          action: null,
          sound: null,
          priority: rule.priority,
          cooldownKey,
          cooldownSeconds: rule.cooldown ?? 0,
        }
      }

      const char = state.selectedCharacter
      const resp = rule.result[char] ?? rule.result.yukirin
      if (!resp) continue

      return {
        triggered: true,
        character: char,
        text: this.interpolate(resp.text, state),
        mood: resp.mood,
        animation: resp.animation ?? null,
        action: resp.action ?? rule.result.action ?? null,
        sound: resp.sound ?? null,
        priority: rule.priority,
        cooldownKey,
        cooldownSeconds: rule.cooldown ?? 0,
      }
    }
    return null
  }

  /** 手動觸發事件（問卷完成、Z幣獲得等） */
  triggerEvent(eventType: string, character: 'yukirin' | 'riku', state?: Partial<UserState>): RuleResult | null {
    const entry = EVENT_RULES_MAP[eventType]
    if (!entry) return null

    const resp = character === 'riku' ? entry.riku : entry
    return {
      triggered: true,
      character,
      text: this.interpolate(resp.text, state),
      mood: resp.mood,
      animation: resp.animation ?? null,
      action: null,
      sound: resp.sound ?? null,
      priority: 80,
      cooldownKey: `event_${eventType}`,
      cooldownSeconds: 10,
    }
  }

  private interpolate(text: string | null | undefined, state?: Partial<UserState>): string | null {
    if (!text) return null
    return text
      .replace('{nickname}', state?.nickname ?? '你')
      .replace('{zcoinBalance}', String(state?.zcoinBalance ?? 0))
      .replace('{balance}', String(state?.zcoinBalance ?? 0))
      .replace('{streakDays}', String(state?.streakDays ?? 0))
      .replace('{visitCount}', String(state?.visitCount ?? 0))
      .replace('{days}', String(state?.daysSinceLastVisit ?? 0))
  }

  /** 重置特定 key 的冷卻（頁面切換時） */
  resetCooldown(key: string) {
    this.cooldowns.delete(key)
  }

  /** 重置頁面相關冷卻 */
  resetPageCooldowns() {
    for (const key of this.cooldowns.keys()) {
      if (!key.startsWith('event_') && !key.startsWith('time_')) {
        this.cooldowns.delete(key)
      }
    }
  }
}

export const ruleEngine = new RuleEngine()
