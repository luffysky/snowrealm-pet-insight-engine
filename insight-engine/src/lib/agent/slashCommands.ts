/**
 * 斜線指令系統
 * 使用者輸入 /xxx 時的即時反應（零 Token）
 */

import type { UserState, RuleResult } from './ruleEngine'

export interface SlashCommand {
  command: string
  aliases: string[]
  description: string
  category: 'basic' | 'social' | 'interact' | 'character' | 'tool' | 'admin'
  adminOnly: boolean
}

export interface CommandResult {
  yukirin?: { text: string; mood: string; animation: string | null }
  riku?: { text: string; mood: string; animation: string | null }
  action?: { type: string; target: string }
  needsLLM: boolean
}

type CommandHandler = (state: UserState, args?: string) => CommandResult

// ── 基本指令 ──────────────────────────────────────────────────────────────────

const BASIC: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/問卷', aliases: ['/survey', '/推薦'], description: '推薦問卷',
    category: 'basic', adminOnly: false,
    handler: () => ({
      yukirin: { text: '讓我想想你適合什麼...', mood: 'thinking', animation: 'think' },
      riku:    { text: '...看看有什麼', mood: 'thinking', animation: 'think' },
      needsLLM: true,
    }),
  },
  {
    command: '/結果', aliases: ['/result', '/最近結果'], description: '查看最近的問卷結果',
    category: 'basic', adminOnly: false,
    handler: () => ({
      yukirin: { text: '你最近一次的結果在這～', mood: 'happy', animation: null },
      riku:    { text: '最近的結果', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/profile#results' },
      needsLLM: false,
    }),
  },
  {
    command: '/Z幣', aliases: ['/zcoin', '/餘額', '/招財'], description: '查看 Z 幣餘額',
    category: 'basic', adminOnly: false,
    handler: (state) => ({
      yukirin: {
        text: `你有 ${state.zcoinBalance} Z幣\n${state.zcoinBalance < 30 ? '有點少欸...要去賺嗎' : '還不錯嘛'}`,
        mood: state.zcoinBalance < 30 ? 'sad' : 'happy', animation: null,
      },
      riku: {
        text: `${state.zcoinBalance}\n...${state.zcoinBalance < 30 ? '有點少' : '還行'}`,
        mood: 'neutral', animation: null,
      },
      needsLLM: false,
    }),
  },
  {
    command: '/商城', aliases: ['/shop', '/store'], description: '前往商城',
    category: 'basic', adminOnly: false,
    handler: () => ({
      yukirin: { text: '走！去商城逛逛！', mood: 'excited', animation: 'excited' },
      riku:    { text: '商城', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/shop' },
      needsLLM: false,
    }),
  },
  {
    command: '/成就', aliases: ['/achievement'], description: '查看成就進度',
    category: 'basic', adminOnly: false,
    handler: () => ({
      yukirin: { text: '看看你解鎖了什麼！', mood: 'excited', animation: 'excited' },
      riku:    { text: '成就', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/profile#achievements' },
      needsLLM: false,
    }),
  },
  {
    command: '/每日任務', aliases: ['/daily', '/任務', '/task'], description: '查看今天的任務',
    category: 'basic', adminOnly: false,
    handler: () => ({
      yukirin: { text: '今天的任務是——', mood: 'excited', animation: null },
      riku:    { text: '今天的任務', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
]

// ── 互動指令 ──────────────────────────────────────────────────────────────────

const INTERACT: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/揮手', aliases: ['/wave', '/嗨'], description: '跟角色揮手',
    category: 'interact', adminOnly: false,
    handler: () => ({
      yukirin: { text: '嗨嗨～', mood: 'happy', animation: 'wave' },
      riku:    { text: '嗯', mood: 'neutral', animation: 'wave' },
      needsLLM: false,
    }),
  },
  {
    command: '/跳舞', aliases: ['/dance'], description: '讓角色跳舞',
    category: 'interact', adminOnly: false,
    handler: () => ({
      yukirin: { text: '欸不要看啦 好害羞', mood: 'shy', animation: 'dance' },
      riku:    { text: '...（被迫跳舞）', mood: 'shy', animation: 'dance' },
      needsLLM: false,
    }),
  },
  {
    command: '/拍頭', aliases: ['/pat', '/摸頭'], description: '拍拍角色的頭',
    category: 'interact', adminOnly: false,
    handler: () => ({
      yukirin: { text: '欸嘿～ (≧∀≦)\n再拍一次', mood: 'happy', animation: 'excited' },
      riku:    { text: '...幹嘛\n（沒有躲開）', mood: 'shy', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/抱抱', aliases: ['/hug'], description: '抱抱角色',
    category: 'interact', adminOnly: false,
    handler: () => ({
      yukirin: { text: '好～\n（張開手）來！', mood: 'happy', animation: 'excited' },
      riku:    { text: '...（沒躲開）\n（小聲）...嗯', mood: 'shy', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/戳', aliases: ['/poke'], description: '戳一下角色',
    category: 'interact', adminOnly: false,
    handler: () => ({
      yukirin: { text: '哼！幹嘛戳我！\n再戳我就...咬你！', mood: 'angry', animation: 'shake_head' },
      riku:    { text: '......\n（盯著你看）', mood: 'neutral', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/嚇', aliases: ['/scare', '/boo'], description: '嚇角色',
    category: 'interact', adminOnly: false,
    handler: () => ({
      yukirin: { text: '啊！！！\n你幹嘛啦！嚇死我了！(°д°)', mood: 'excited', animation: 'excited' },
      riku:    { text: '...沒用\n（完全沒反應）', mood: 'neutral', animation: 'idle' },
      needsLLM: false,
    }),
  },
  {
    command: '/加油', aliases: ['/cheer', '/fighting'], description: '讓角色幫你加油',
    category: 'interact', adminOnly: false,
    handler: () => ({
      yukirin: { text: '你可以的！我相信你！\n加油加油加油！！', mood: 'excited', animation: 'excited' },
      riku:    { text: '你已經走到這了\n沒理由停', mood: 'neutral', animation: 'excited' },
      needsLLM: false,
    }),
  },
  {
    command: '/睡覺', aliases: ['/sleep', '/晚安'], description: '跟角色說晚安',
    category: 'interact', adminOnly: false,
    handler: () => ({
      yukirin: { text: '晚安～ 明天見\n不准熬夜！\n（小聲）...我會想你的', mood: 'relaxed', animation: null },
      riku:    { text: '晚安\n...好好睡', mood: 'relaxed', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/坐下', aliases: ['/sit', '/休息'], description: '讓角色坐下',
    category: 'interact', adminOnly: false,
    handler: () => ({
      yukirin: { text: '站好久了 休息一下\n（坐下晃腳）', mood: 'relaxed', animation: 'fbx_sitting' },
      riku:    { text: '...（坐下）', mood: 'relaxed', animation: 'fbx_sitting' },
      needsLLM: false,
    }),
  },
  {
    command: '/站起來', aliases: ['/standup', '/起來'], description: '讓角色站起來',
    category: 'interact', adminOnly: false,
    handler: () => ({
      yukirin: { text: '好！精神來了！', mood: 'excited', animation: 'fbx_breathing' },
      riku:    { text: '（站起來）', mood: 'neutral', animation: 'fbx_breathing' },
      needsLLM: false,
    }),
  },
]

// ── 角色指令 ──────────────────────────────────────────────────────────────────

const CHARACTER: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/切換角色', aliases: ['/switch', '/換人'], description: '切換雪凜/凜空',
    category: 'character', adminOnly: false,
    handler: (state) => {
      const switchTo = state.selectedCharacter === 'yukirin' ? 'riku' : 'yukirin'
      return {
        yukirin: switchTo === 'riku'
          ? { text: '哼！你居然要換人\n算了 凜空會照顧你的 (´;ω;`)', mood: 'sad', animation: null }
          : { text: '你回來了！！\n我就知道你最喜歡我！(≧∀≦)', mood: 'excited', animation: 'excited' },
        riku: switchTo === 'riku'
          ? { text: '...她叫我好好照顧你\n嗯 我會的', mood: 'neutral', animation: 'nod' }
          : { text: '...嗯 她一直在問你什麼時候回來', mood: 'neutral', animation: null },
        action: { type: 'switch_character', target: switchTo },
        needsLLM: false,
      }
    },
  },
  {
    command: '/告白', aliases: ['/love', '/表白'], description: '向角色告白',
    category: 'character', adminOnly: false,
    handler: () => ({
      yukirin: { text: '欸！？\n我...我有男朋友了啦！\n不過謝謝你 嘿嘿', mood: 'shy', animation: null },
      riku:    { text: '...抱歉\n我有女朋友了', mood: 'shy', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/叫另一半', aliases: ['/couple', '/叫他', '/叫她'], description: '叫出另一個角色',
    category: 'character', adminOnly: false,
    handler: () => ({ needsLLM: true }),
  },
  {
    command: '/放閃', aliases: ['/flirt', '/sweet'], description: '讓兩個角色放閃',
    category: 'character', adminOnly: false,
    handler: () => ({ needsLLM: true }),
  },
]

// ── 工具指令 ──────────────────────────────────────────────────────────────────

const TOOL: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/設定', aliases: ['/settings', '/偏好'], description: '打開設定',
    category: 'tool', adminOnly: false,
    handler: () => ({
      yukirin: { text: '不要把我的通知關掉喔！', mood: 'sad', animation: null },
      riku:    { text: '設定', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/settings' },
      needsLLM: false,
    }),
  },
  {
    command: '/幫助', aliases: ['/help', '/指令', '/?'], description: '顯示所有指令',
    category: 'tool', adminOnly: false,
    handler: () => ({
      yukirin: { text: '我會的事情很多喔！看看這些指令～', mood: 'happy', animation: null },
      riku:    { text: '指令列表', mood: 'neutral', animation: null },
      action: { type: 'show_command_list', target: '' },
      needsLLM: false,
    }),
  },
  {
    command: '/週報', aliases: ['/weekly', '/report'], description: '查看週報',
    category: 'tool', adminOnly: false,
    handler: () => ({
      yukirin: { text: '你的週報在這～', mood: 'happy', animation: null },
      riku:    { text: '週報', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/profile#weekly-report' },
      needsLLM: false,
    }),
  },
  {
    command: '/創作文章', aliases: ['/write', '/寫文章', '/寫部落格', '/blog'], description: 'AI 協助創作部落格文章（消耗 200 Z幣）',
    category: 'tool', adminOnly: false,
    handler: () => ({
      yukirin: { text: '___BLOG_WRITE_INIT___', mood: 'excited', animation: 'excited' },
      riku:    { text: '___BLOG_WRITE_INIT___', mood: 'neutral', animation: null },
      action: { type: 'blog_write_mode', target: '' },
      needsLLM: false,
    }),
  },
]

// ── 管理員指令 ────────────────────────────────────────────────────────────────

const ADMIN: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/stats', aliases: ['/數據', '/狀態'], description: '即時平台數據',
    category: 'admin', adminOnly: true,
    handler: () => ({
      yukirin: { text: '老闆要看數據！讓我查查...', mood: 'thinking', animation: 'think' },
      riku:    { text: '數據', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/cost', aliases: ['/成本', '/花費'], description: '今日 AI 成本',
    category: 'admin', adminOnly: true,
    handler: () => ({
      yukirin: { text: '讓我算算今天花了多少...', mood: 'thinking', animation: 'think' },
      riku:    { text: '今日成本', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/alerts', aliases: ['/警報', '/告警'], description: '未處理的警報',
    category: 'admin', adminOnly: true,
    handler: () => ({
      yukirin: { text: '讓我看看有什麼狀況...', mood: 'thinking', animation: null },
      riku:    { text: '警報', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/admin/alerts' },
      needsLLM: false,
    }),
  },
]

// ── 對外 API ──────────────────────────────────────────────────────────────────

const ALL_COMMANDS = [...BASIC, ...INTERACT, ...CHARACTER, ...TOOL, ...ADMIN]

/** 處理斜線指令，回傳結果（null = 找不到指令） */
export function handleSlashCommand(
  input: string,
  state: UserState
): CommandResult | null {
  const parts = input.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1).join(' ')

  for (const def of ALL_COMMANDS) {
    if (def.adminOnly && !state.isAdmin) continue
    if (def.command === cmd || def.aliases.some(a => a === cmd)) {
      return def.handler(state, args)
    }
  }
  return null
}

/** 取得指令自動完成清單 */
export function getCommandSuggestions(
  filter: string,
  isAdmin: boolean
): SlashCommand[] {
  const q = filter.toLowerCase()
  return ALL_COMMANDS
    .filter(c => !c.adminOnly || isAdmin)
    .filter(c =>
      c.command.includes(q) ||
      c.aliases.some(a => a.includes(q)) ||
      c.description.includes(q)
    )
    .map(({ command, aliases, description, category, adminOnly }) =>
      ({ command, aliases, description, category, adminOnly })
    )
}

/** 判斷輸入是否是斜線指令 */
export function isSlashCommand(input: string): boolean {
  return input.trimStart().startsWith('/')
}

/** 對外導出指令清單（不含 handler） */
export const SLASH_COMMANDS: SlashCommand[] = ALL_COMMANDS.map(
  ({ command, aliases, description, category, adminOnly }) =>
    ({ command, aliases, description, category, adminOnly })
)
