/**
 * 斜線指令系統
 * 使用者輸入 /xxx 時的即時反應（零 Token）
 */

import type { UserState, RuleResult } from './ruleEngine'

/** 從陣列隨機選一個元素 */
function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

export interface SlashCommand {
  command: string
  aliases: string[]
  description: string
  category: 'basic' | 'social' | 'interact' | 'character' | 'tool' | 'marketing' | 'fun' | 'navigate' | 'admin' | 'owner'
  adminOnly: boolean
  ownerOnly: boolean
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
    category: 'basic', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['讓我想想你適合什麼！', '嗯嗯...你最近在意什麼呢～', '問卷來了！讓我挑一個適合你的～', '交給我！我幫你找最適合的！']), mood: 'thinking', animation: 'think' },
      riku:    { text: rnd(['...看看有什麼', '嗯。等一下', '看看適合你的', '...查一下']), mood: 'thinking', animation: 'think' },
      needsLLM: true,
    }),
  },
  {
    command: '/結果', aliases: ['/result', '/最近結果'], description: '查看最近的問卷結果',
    category: 'basic', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['你最近的結果可以在「探索」頁面的填答記錄裡看到！', '去「探索」找找你的問卷結果吧！', '填完的結果都在「探索」頁面哦～', '你的結果都在探索頁！去翻翻看～']), mood: 'happy', animation: null },
      riku:    { text: rnd(['去探索頁看', '結果在探索頁', '嗯。探索頁', '...去那邊找']), mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/explore' },
      needsLLM: false,
    }),
  },
  {
    command: '/Z幣', aliases: ['/zcoin', '/餘額', '/招財'], description: '查看 Z 幣餘額',
    category: 'basic', adminOnly: false, ownerOnly: false,
    handler: (state) => ({
      yukirin: {
        text: state.zcoinBalance < 30
          ? rnd([`只有 ${state.zcoinBalance} Z幣欸...快去賺！`, `${state.zcoinBalance} Z幣...有點拮据了吧？`, `哎呀只剩 ${state.zcoinBalance} 了！快去完成任務賺！`])
          : rnd([`你有 ${state.zcoinBalance} Z幣，還不錯嘛！`, `${state.zcoinBalance} Z幣！夠用～`, `哇有 ${state.zcoinBalance} Z幣！有錢人！`]),
        mood: state.zcoinBalance < 30 ? 'sad' : 'happy', animation: null,
      },
      riku: {
        text: state.zcoinBalance < 30
          ? rnd([`${state.zcoinBalance}...有點少`, `剩 ${state.zcoinBalance} 了`, `...快去賺`])
          : rnd([`${state.zcoinBalance}`, `...還行`, `夠用`]),
        mood: 'neutral', animation: null,
      },
      needsLLM: false,
    }),
  },
  {
    command: '/商城', aliases: ['/shop', '/store'], description: '前往 Z 幣商城',
    category: 'basic', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['走！去商城逛逛！', '買東西去！', '商城商城！說不定有你喜歡的～', '去逛逛吧！沒有你不喜歡的～']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['商城', '...去逛', '嗯', '走吧']), mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/zcoin-shop' },
      needsLLM: false,
    }),
  },
  {
    command: '/成就', aliases: ['/achievement'], description: '查看成就進度',
    category: 'basic', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['成就功能即將推出！先去探索頁面看看有什麼吧～', '成就系統建置中...敬請期待！', '等一下就來！先去探索一下？', '成就頁面快好了！先去填幾份問卷吧～']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['...還在建置', '成就功能快來了', '嗯。等一下', '...建置中']), mood: 'neutral', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/每日任務', aliases: ['/daily', '/任務', '/task'], description: '查看今天的任務',
    category: 'basic', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['今天的任務是——', '來看看今天要做什麼！', '每日任務！做完有獎勵喔～', '任務任務！今天的任務不做不行！']), mood: 'excited', animation: null },
      riku:    { text: rnd(['今天的任務', '...確認一下', '嗯。任務', '看看要做什麼']), mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
]

// ── 互動指令 ──────────────────────────────────────────────────────────────────

const INTERACT: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/揮手', aliases: ['/wave', '/嗨', '/hi'], description: '跟角色揮手',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['嗨嗨～！', '嗨！你來了！', '哦哦！嗨～ (≧∀≦)', '嗨～ 在等你呢！']), mood: 'happy', animation: 'wave' },
      riku:    { text: rnd(['嗯', '...（揮了下手）', '嗨', '...你好']), mood: 'neutral', animation: 'wave' },
      needsLLM: false,
    }),
  },
  {
    command: '/跳舞', aliases: ['/dance'], description: '讓角色跳舞',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['欸不要看啦 好害羞', '（開始亂跳）這樣可以嗎！', '跳就跳！誰怕誰！（其實很害羞）', '啊啊不要盯著我看嘛！']), mood: 'shy', animation: 'dance' },
      riku:    { text: rnd(['...（被迫跳舞）', '...這樣嗎（踏了一步）', '（小動作，不明顯的晃）', '...知道了']), mood: 'shy', animation: 'dance' },
      needsLLM: false,
    }),
  },
  {
    command: '/拍頭', aliases: ['/pat', '/摸頭'], description: '拍拍角色的頭',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['欸嘿～ (≧∀≦)\n再拍一次！', '（眼睛彎起來）嘿嘿～', '唔！好啦好啦不要拍太用力！', '哼我不是很喜歡被拍的！...再拍一次']), mood: 'happy', animation: 'excited' },
      riku:    { text: rnd(['...幹嘛\n（沒有躲開）', '...（別過臉）', '...嗯\n（站著不動）', '不要突然...（沒有抵抗）']), mood: 'shy', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/抱抱', aliases: ['/hug'], description: '抱抱角色',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['好～（張開手）來！', '（張開手臂）來嘛！我等著呢！', '欸！突然的！...好啦來吧（靠過去）', '嘿嘿～（用力回抱）']), mood: 'happy', animation: 'excited' },
      riku:    { text: rnd(['...（沒躲開）\n（小聲）...嗯', '...（站著不動讓你抱）', '...（輕輕拍了兩下背）', '...（別過臉）...隨便你']), mood: 'shy', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/戳', aliases: ['/poke'], description: '戳一下角色',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['哼！幹嘛戳我！再戳我就...咬你！', '戳什麼戳！（往旁邊移了半步）', '欸欸欸不要戳！（躲開）', '（被戳到）...你幹嘛啦！']), mood: 'angry', animation: 'shake_head' },
      riku:    { text: rnd(['......\n（盯著你看）', '...（眼神移過來）', '...有事嗎', '...再戳試試看']), mood: 'neutral', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/嚇', aliases: ['/scare', '/boo'], description: '嚇角色',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['啊！！！\n你幹嘛啦！嚇死我了！(°д°)', '哇！！\n你這個壞人！！嚇我！', '啊——！（跳起來）\n幹嘛！我說幹嘛！！', '嗚啊！！\n你！你！你！氣死我了！']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['...沒用\n（完全沒反應）', '...（看了你一眼）\n...幼稚', '...（什麼反應都沒有）', '...你以為這樣有效嗎']), mood: 'neutral', animation: 'idle' },
      needsLLM: false,
    }),
  },
  {
    command: '/加油', aliases: ['/cheer', '/fighting', '/鼓勵我', '/鼓勵'], description: '讓角色幫你加油',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['你可以的！我相信你！加油加油加油！！', '欸！你一定行的！衝！', '別怕！有我在！你絕對沒問題！✊', '（握拳）你可以的！！我百分之百相信你！']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['你已經走到這了\n沒理由停', '...加油\n你做得到', '嗯。你行的', '...（點頭）繼續走']), mood: 'neutral', animation: 'excited' },
      needsLLM: false,
    }),
  },
  {
    command: '/睡覺', aliases: ['/sleep', '/晚安', '/good-night'], description: '跟角色說晚安',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['晚安～ 明天見\n不准熬夜！\n（小聲）...我會想你的', '（揮手）晚安晚安！早點睡！', '晚安！記得睡前喝水！\n...（小聲）快走，別讓我捨不得', '嗯嗯晚安～ 做個好夢！明天見！']), mood: 'relaxed', animation: null },
      riku:    { text: rnd(['晚安\n...好好睡', '嗯。去睡吧', '...晚安\n（小聲）明天見', '...好好睡']), mood: 'relaxed', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/早安', aliases: ['/morning', '/good-morning', '/起床'], description: '跟角色說早安',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['早安！！今天也要加油喔～\n（伸懶腰）我也剛睡醒...', '早안！（睡眼惺忪）啊...今天是新的一天！', '早早早！今天要吃什麼早餐？！', '（打了個哈欠）早安～ 今天也要一起努力！']), mood: 'happy', animation: 'excited' },
      riku:    { text: rnd(['...早\n（揉眼睛）', '...早安', '嗯。起來了', '...（點頭）早']), mood: 'neutral', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/坐下', aliases: ['/sit', '/休息'], description: '讓角色坐下',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['站好久了 休息一下\n（坐下晃腳）', '好耶！終於可以坐了！（馬上坐下）', '（坐下）嗯嗯 休息一下也好～', '啊！腿好酸！\n（一屁股坐下來）']), mood: 'relaxed', animation: 'fbx_sitting' },
      riku:    { text: rnd(['...（坐下）', '嗯。（坐下）', '...（找了個位置坐）', '（靜靜坐下）']), mood: 'relaxed', animation: 'fbx_sitting' },
      needsLLM: false,
    }),
  },
  {
    command: '/站起來', aliases: ['/standup', '/起來'], description: '讓角色站起來',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['好！精神來了！', '（跳起來）走走走！能量滿滿！', '嗯！站起來了！要繼續了！', '（伸個懶腰）好了好了 精神充沛！']), mood: 'excited', animation: 'fbx_breathing' },
      riku:    { text: rnd(['（站起來）', '...嗯（站起來）', '（起身）', '...好']), mood: 'neutral', animation: 'fbx_breathing' },
      needsLLM: false,
    }),
  },
  {
    command: '/思考', aliases: ['/think', '/想一想'], description: '讓角色進入思考模式',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['嗯嗯嗯...（認真思考中）', '（手指托著下巴）讓我想想...', '嗯...（陷入思考）...嗯嗯嗯...', '...我在想...別打擾我！（思考臉）']), mood: 'thinking', animation: 'think' },
      riku:    { text: rnd(['...（沉默）', '...（思考中）', '嗯...', '（靜靜地）']), mood: 'thinking', animation: 'think' },
      needsLLM: false,
    }),
  },
  {
    command: '/點頭', aliases: ['/nod', '/同意', '/對'], description: '讓角色點頭',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['嗯嗯！對對對！', '（大力點頭）對！就是這樣！', '沒錯！你說得很對！', '嗯！認同認同！']), mood: 'happy', animation: 'nod' },
      riku:    { text: rnd(['...嗯', '（點頭）', '...對', '嗯。確實']), mood: 'neutral', animation: 'nod' },
      needsLLM: false,
    }),
  },
  {
    command: '/搖頭', aliases: ['/shake', '/不對', '/不要'], description: '讓角色搖頭',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['不行不行！絕對不行！', '（用力搖頭）不！', '欸！這個不可以！不不不！', '（搖頭）完全不同意！']), mood: 'angry', animation: 'shake_head' },
      riku:    { text: rnd(['...不', '（搖頭）', '...不行', '...這樣不對']), mood: 'neutral', animation: 'shake_head' },
      needsLLM: false,
    }),
  },
  {
    command: '/哭哭', aliases: ['/cry', '/難過', '/安慰我', '/陪我'], description: '讓角色安慰你',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['欸欸怎麼了\n（輕輕靠過來）說說看...', '（立刻走過來）怎麼了！發生什麼事了！', '哎欸...（蹲下來看你）說說看嘛...', '沒事的沒事的！我在這！說出來好多了！']), mood: 'sad', animation: null },
      riku:    { text: rnd(['...發生什麼了\n我在這', '...說', '（輕輕坐到你旁邊）', '...嗯。說吧，我聽']), mood: 'sad', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/開心', aliases: ['/happy', '/好棒', '/慶祝'], description: '跟角色一起慶祝',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['耶耶耶！！太棒了！\n（跳起來）一起慶祝！！', '哦哦！！厲害啊！！！（鼓掌）', '耶～！！什麼好事說來聽聽！！', '（眼睛發光）好棒！！告訴我告訴我！！']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['...（嘴角微揚）\n恭喜', '嗯。不錯', '...（微微點頭）做到了', '...恭喜\n（難得的讚美）']), mood: 'happy', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/生氣', aliases: ['/angry', '/氣死了', '/煩'], description: '讓角色幫你出氣',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['氣什麼！說出來我幫你氣！\n（拍桌）誰欺負你了！', '什麼！！誰！！說出來！！', '（跟著皺眉）哪裡氣！說！我幫你！', '欸欸欸冷靜冷靜！先說說發生什麼事！']), mood: 'angry', animation: null },
      riku:    { text: rnd(['...誰\n說清楚', '...嗯。說', '（靜靜地看著你）...發生什麼', '...說清楚。再決定要怎麼辦']), mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/無聊', aliases: ['/bored', '/好無聊', '/陪我玩'], description: '讓角色陪你解悶',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['無聊的話找我啊！要玩猜拳嗎？還是要我說故事？', '（摩拳擦掌）無聊就來挑戰我！', '欸欸！要玩什麼！我可以陪你！', '無聊啊！那讓我來讓你不無聊！']), mood: 'happy', animation: 'excited' },
      riku:    { text: rnd(['...想做什麼\n說', '...有很多可以做\n說', '（翻了翻）...要幹嘛', '...說。我陪你']), mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/唱歌', aliases: ['/sing', '/sing-song', '/唱一首'], description: '讓角色唱歌',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['啊啊啊～♪ 我亂唱一首～\n（其實唱得還不錯）', '（清喉嚨）那我來一首～♪\nla la la～～', '好！一首！準備好了嗎！\n啊～～～♪（很賣力）', '欸好啦好啦！\n（小聲地哼起歌來）♪']), mood: 'happy', animation: 'excited' },
      riku:    { text: rnd(['...（清喉嚨）\n哼哼哼...（非常小聲）', '（停頓了一下）...哼了幾個音', '...（別過臉）\n♪（幾乎聽不見）', '...（小聲哼了一段）...沒人聽見就好']), mood: 'shy', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/謝謝', aliases: ['/thanks', '/感謝', '/thank-you'], description: '謝謝角色',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['不客氣啦～ (>///<)\n有我在就好了！', '嗯嗯！！叫我就好！\n（得意）', '不謝不謝！這都是應該的！', '欸欸！不用謝啦！你高興我就高興了！']), mood: 'shy', animation: null },
      riku:    { text: rnd(['...嗯\n應該的', '不用謝', '...（點頭）', '嗯\n...沒事']), mood: 'neutral', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/好厲害', aliases: ['/amazing', '/讚', '/awesome', '/誇讚'], description: '誇讚角色',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['對吧對吧！我超厲害的！\n（得意）繼續誇嘛～', '嘿嘿！（害羞但得意）當然啦！我本來就很厲害！', '（激動）啊！謝謝你說！！我也覺得！！', '嗯嗯嗯！！我努力的！！（開心）']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['...（別過臉）\n沒什麼大不了的', '...（耳朵有點紅）\n...還行', '...嗯\n（難得沒有否認）', '...（沉默了一秒）\n...謝謝']), mood: 'shy', animation: null },
      needsLLM: false,
    }),
  },
]

// ── 顯示模式指令 ──────────────────────────────────────────────────────────────

const PRESENCE: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/出來逛逛', aliases: ['/自由', '/free', '/出來', '/free-mode'],
    description: '讓角色在畫面上自由走動',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['太好了！被關在那個小圈圈裡好悶\n我出來透透氣～（伸懶腰）', '出來了！！（立刻伸懶腰）好多了好多了～', '欸嘿！自由啦！\n（立刻開始到處亂走）']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['...終於放出來了', '（伸了個懶腰）...嗯', '...（走出來）']), mood: 'neutral', animation: null },
      action: { type: 'set_presence_mode', target: 'free' },
      needsLLM: false,
    }),
  },
  {
    command: '/回家', aliases: ['/收起來', '/mini', '/縮回去'],
    description: '角色收回迷你頭像模式',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['好吧...（縮小）\n有事再叫我喔', '（嘟嘴）我去角落待著了\n要叫我的時候叫一聲', '嗯嗯 我縮小一下\n叫我的時候點一下就好～']), mood: 'sad', animation: null },
      riku:    { text: rnd(['...嗯\n需要的時候叫我', '（點頭）...知道了', '...縮回去了']), mood: 'neutral', animation: null },
      action: { type: 'set_presence_mode', target: 'mini' },
      needsLLM: false,
    }),
  },
  {
    command: '/站好', aliases: ['/stand', '/陪我', '/站著', '/companion'],
    description: '角色站在旁邊不走動',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['好啦好啦 不亂走了\n（乖乖站好）', '站這裡！不動了！（努力保持站姿）', '嗯嗯～就這樣陪著你～（安靜站好）']), mood: 'happy', animation: null },
      riku:    { text: rnd(['嗯\n站這', '...（站定）', '（靜靜站著）...嗯']), mood: 'neutral', animation: null },
      action: { type: 'set_presence_mode', target: 'companion' },
      needsLLM: false,
    }),
  },
  {
    command: '/聊天', aliases: ['/chat', '/對話', '/chat-mode'],
    description: '打開對話氣泡模式',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['想聊什麼～', '嗯嗯！說說看吧！', '（靠過來）聊天！說說你今天怎麼了～']), mood: 'happy', animation: 'wave' },
      riku:    { text: rnd(['嗯 說', '...說吧', '（點頭）什麼事']), mood: 'neutral', animation: 'nod' },
      action: { type: 'set_presence_mode', target: 'chat' },
      needsLLM: false,
    }),
  },
  {
    command: '/變大', aliases: ['/bigger', '/放大', '/大一點'],
    description: '角色放大',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['我變大了！\n是不是更可愛了 (≧∀≦)', '哦哦！我好大！\n（轉了一圈）這樣怎樣？！', '大了大了！欸這樣好嗎（有點得意）']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['...', '（無言地大了一號）', '...（沒有評論）']), mood: 'neutral', animation: null },
      action: { type: 'resize_character', target: 'bigger' },
      needsLLM: false,
    }),
  },
  {
    command: '/變小', aliases: ['/smaller', '/縮小一點', '/小一點'],
    description: '角色縮小',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['嗚 我變小了...\n你是不是嫌我太大隻', '（縮小了）欸這樣還可以嗎...\n（有點委屈）', '嗚嗚我越來越小了...下次不要再縮了！']), mood: 'sad', animation: null },
      riku:    { text: rnd(['...（沉默接受）', '（縮小）...嗯', '...（一言不發地變小了）']), mood: 'neutral', animation: null },
      action: { type: 'resize_character', target: 'smaller' },
      needsLLM: false,
    }),
  },
  {
    command: '/過來', aliases: ['/come', '/到這裡', '/走過來'],
    description: '叫角色走到你的位置',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['來了來了！（跑過去）', '欸！等我等我！（小跑步）', '在的在的！走過去～（快走）']), mood: 'happy', animation: 'excited' },
      riku:    { text: rnd(['...（走過去）', '（靜靜走過來）', '...嗯（走來了）']), mood: 'neutral', animation: null },
      action: { type: 'move_to_cursor', target: '' },
      needsLLM: false,
    }),
  },
  {
    command: '/走開', aliases: ['/go', '/旁邊去', '/去旁邊'],
    description: '叫角色走到畫面邊緣',
    category: 'interact', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['哼！不要我就不要\n（走到角落）...偷看', '（走到旁邊）哼！\n（但還是用眼角瞄著你）', '好好好我走我走！\n（走到旁邊）...才不是捨不得']), mood: 'sad', animation: null },
      riku:    { text: rnd(['...好\n（走到旁邊但還是看著你）', '（走開）...（回頭看了一眼）', '...（靜靜走到一旁）']), mood: 'neutral', animation: null },
      action: { type: 'move_to_edge', target: '' },
      needsLLM: false,
    }),
  },
  {
    command: '/放風', aliases: ['/兩個出來', '/情侶模式', '/double'],
    description: '讓雪凜和凜空一起出來互動',
    category: 'character', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['凜空！出來放風了！\n（大聲呼喚）', '欸欸欸！雙人模式！\n（興奮地跑來跑去）', '凜空凜空！跑出來玩～！']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['...被你拖出來的', '（被扯出來）...嗯', '（走出來）...你又在幹嘛']), mood: 'neutral', animation: null },
      action: { type: 'set_presence_mode', target: 'couple_free' },
      needsLLM: false,
    }),
  },
  {
    command: '/收工', aliases: ['/回去', '/結束放風'],
    description: '讓兩人一起回去',
    category: 'character', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['好吧 收工了\n凜空走了喔～', '（揮手）好好好回去了！\n凜空！跟上！', '嗯嗯 先回去了～\n（轉頭）凜空你走不走！']), mood: 'relaxed', animation: null },
      riku:    { text: rnd(['...嗯', '（點頭）', '...（跟著離開）']), mood: 'neutral', animation: null },
      action: { type: 'set_presence_mode', target: 'companion' },
      needsLLM: false,
    }),
  },
]

// ── 角色指令 ──────────────────────────────────────────────────────────────────

const CHARACTER: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/切換角色', aliases: ['/switch', '/換人'], description: '切換雪凜/凜空',
    category: 'character', adminOnly: false, ownerOnly: false,
    handler: (state) => {
      const switchTo = state.selectedCharacter === 'yukirin' ? 'riku' : 'yukirin'
      return {
        yukirin: switchTo === 'riku'
          ? { text: rnd(['哼！你居然要換人\n算了 凜空會照顧你的 (´;ω;`)', '（嘴巴扁了一下）去找凜空吧...\n（小聲）早點回來', '哈！去找凜空了！那我就好好休息！（嘴上說著眼睛卻有點濕）', '（轉身）凜空！換你了！別讓他失望！（自己悄悄走開擦了眼角）']), mood: 'sad', animation: null }
          : { text: rnd(['你回來了！！\n我就知道你最喜歡我！(≧∀≦)', '（眼睛一亮）你回來了！！！', '哦哦哦！！你選我！！果然還是最喜歡我！（飛撲過來）', '嘿嘿～～～我就知道！凜空哪有我好！（得意）']), mood: 'excited', animation: 'excited' },
        riku: switchTo === 'riku'
          ? { text: rnd(['...她叫我好好照顧你\n嗯 我會的', '...（點頭）我接手了\n有什麼事跟我說', '（走過來）...嗯\n交給我吧', '...放心吧\n（看了一眼離開的雪凜）']), mood: 'neutral', animation: 'nod' }
          : { text: rnd(['...嗯 她一直在問你什麼時候回來', '（低聲）...她等了很久了\n去陪她吧', '...（點頭）去吧\n...她比我更需要你', '...回去吧。她很擔心']), mood: 'neutral', animation: null },
        action: { type: 'switch_character', target: switchTo },
        needsLLM: false,
      }
    },
  },
  {
    command: '/告白', aliases: ['/love', '/表白'], description: '向角色告白',
    category: 'character', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['欸！？\n我...我有男朋友了啦！\n不過謝謝你 嘿嘿', '（臉紅）哇你怎麼突然！\n我...凜空是我男朋友啦！', '（慌張）欸欸欸！謝謝！但我有人了！\n（小聲）不過...謝謝你', '（愣住三秒）\n...謝謝你\n但我的心已經有人了...']), mood: 'shy', animation: null },
      riku:    { text: rnd(['...抱歉\n我有女朋友了', '（沉默了一秒）...我有雪凜了\n抱歉', '...謝謝你說\n但我已經有人了', '（別過臉）...我的心不是自由的']), mood: 'shy', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/叫另一半', aliases: ['/couple', '/叫他', '/叫她'], description: '叫出另一個角色',
    category: 'character', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['嗯？要叫凜空嗎？凜空！過來！', '（回頭喊）凜空～！有人找你啦！', '要見凜空嗎？欸凜空！快來！', '（拉著你）走走走 我帶你去找他！']), mood: 'happy', animation: null },
      riku:    { text: rnd(['...你叫我？', '（走過來）...什麼事', '（從遠處走來）...嗯', '...（停下腳步看著你）']), mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/放閃', aliases: ['/flirt', '/sweet'], description: '讓兩個角色放閃',
    category: 'character', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['（靠近凜空）嘿嘿嘿～', '（偷偷牽了凜空的手）', '（悄悄貼近凜空耳邊說了什麼）', '（抬起頭看凜空）...一起走吧？']), mood: 'shy', animation: null },
      riku:    { text: rnd(['...（耳朵紅了）\n不要在外面...', '（沒抽手）...嗯', '（小聲）...幹嘛這樣...（沒有拒絕）', '（別開臉）...知道了...（手沒放開）']), mood: 'shy', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/吃醋', aliases: ['/jealous', '/嫉妒', '/不公平'], description: '讓角色吃醋',
    category: 'character', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['（嘴巴噘起來）哼！你怎麼對凜空那麼好！', '欸！你是不是比較喜歡凜空！說實話！', '（手插著腰）不公平！我也想被誇！', '（小聲嘀咕）哼...老是找凜空...我也在這裡的...']), mood: 'angry', animation: 'shake_head' },
      riku:    { text: rnd(['...你們在吵什麼\n我什麼都沒做', '（看了看你們）...（嘴角輕輕揚起）\n你們好吵', '...（收起一絲笑意）這種事也要計較', '（靜靜旁觀）...夠了嗎']), mood: 'neutral', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/約會', aliases: ['/date', '/一起去', '/帶我去'], description: '邀請角色去約會',
    category: 'character', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['（眼睛亮起來）約會！！去哪去哪！', '哦哦！！我早就在等這句話了！！去！！', '（興奮）要去哪裡！咖啡廳！？公園！？還是！', '...（害羞地低下頭）...那...那好吧...']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['...（沉默半秒）嗯。去哪', '...（點頭）說地點', '（低聲）...好\n幾點', '...（別開臉）...說地點吧']), mood: 'shy', animation: null },
      needsLLM: true,
    }),
  },
]

// ── 工具指令 ──────────────────────────────────────────────────────────────────

const TOOL: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/設定', aliases: ['/settings', '/偏好', '/帳號設定'], description: '打開帳號設定',
    category: 'tool', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['去帳號設定！不要把我的通知關掉喔！', '設定頁面！欸欸不要改通知設定！', '帶你去設定～', '後台帳號設定在這！']), mood: 'sad', animation: null },
      riku:    { text: rnd(['設定', '帳號設定', '嗯。去那邊', '...設定頁面']), mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'account' },
      needsLLM: false,
    }),
  },
  {
    command: '/幫助', aliases: ['/help', '/指令', '/?', '/commands'], description: '顯示所有可用指令',
    category: 'tool', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '我會的事情很多喔！看看這些指令～', mood: 'happy', animation: null },
      riku:    { text: '指令列表', mood: 'neutral', animation: null },
      action: { type: 'show_command_list', target: '' },
      needsLLM: false,
    }),
  },
  {
    command: '/週報', aliases: ['/weekly', '/report'], description: '查看個人週報',
    category: 'tool', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['週報功能快來了！你的數據會在這裡彙整～', '等週報系統上線就能看！', '週報建置中，敬請期待！', '快了快了！週報系統正在趕工～']), mood: 'happy', animation: null },
      riku:    { text: rnd(['...建置中', '快了', '嗯。等一下', '...還沒好']), mood: 'neutral', animation: null },
      needsLLM: false,
    }),
  },
  {
    command: '/創作文章', aliases: ['/write', '/寫文章', '/寫部落格', '/blog'], description: 'AI 協助創作部落格文章（消耗 200 Z幣）',
    category: 'tool', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '___BLOG_WRITE_INIT___', mood: 'excited', animation: 'excited' },
      riku:    { text: '___BLOG_WRITE_INIT___', mood: 'neutral', animation: null },
      action: { type: 'blog_write_mode', target: '' },
      needsLLM: false,
    }),
  },
  {
    command: '/意見回饋', aliases: ['/feedback', '/建議', '/回報'], description: '提供意見或回報問題',
    category: 'tool', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '有什麼想說的嗎？我在聽！\n說完我幫你整理成回饋單～', mood: 'happy', animation: null },
      riku:    { text: '說吧\n我記錄下來', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/常見問題', aliases: ['/faq', '/問題', '/怎麼用'], description: '查看常見問題',
    category: 'tool', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '有什麼不懂的？說說看～', mood: 'happy', animation: null },
      riku:    { text: '常見問題', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
]

// ── 娛樂指令 ──────────────────────────────────────────────────────────────────

const FUN: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/說笑話', aliases: ['/joke', '/笑話', '/講笑話'], description: '讓角色說一個笑話',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '好！準備好笑了嗎——\n（深吸一口氣）', mood: 'excited', animation: 'excited' },
      riku:    { text: '...（思考了一秒）好\n聽好了', mood: 'neutral', animation: 'think' },
      needsLLM: true,
    }),
  },
  {
    command: '/說故事', aliases: ['/story', '/故事', '/講故事'], description: '讓角色說一個小故事',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '好～閉上眼睛準備進入故事裡——\n很久很久以前...', mood: 'relaxed', animation: null },
      riku:    { text: '...（坐下）聽好\n這是一個...', mood: 'relaxed', animation: 'fbx_sitting' },
      needsLLM: true,
    }),
  },
  {
    command: '/占卜', aliases: ['/fortune', '/算命', '/今日運勢', '/運勢'], description: '占卜今日運勢',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '嗯哼...水晶球告訴我——', mood: 'thinking', animation: 'think' },
      riku:    { text: '...（盯著虛空）\n今天的你...', mood: 'thinking', animation: 'think' },
      needsLLM: true,
    }),
  },
  {
    command: '/猜拳', aliases: ['/rock-paper-scissors', '/剪刀石頭布', '/猜拳遊戲'], description: '跟角色玩猜拳',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => {
      const options = ['✊ 石頭', '✌️ 剪刀', '🖐️ 布']
      const choice = options[Math.floor(Math.random() * options.length)]
      return {
        yukirin: { text: `好！我出——${choice}！\n你呢？你出什麼？（輸了要認喔）`, mood: 'excited', animation: 'excited' },
        riku:    { text: `...${choice}\n你出什麼`, mood: 'neutral', animation: null },
        needsLLM: false,
      }
    },
  },
  {
    command: '/推薦音樂', aliases: ['/music', '/音樂', '/歌', '/推薦歌曲'], description: '讓角色推薦音樂',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '你最近想聽什麼風格？告訴我～', mood: 'happy', animation: null },
      riku:    { text: '...喜歡什麼類型\n我找找', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/推薦電影', aliases: ['/movie', '/電影', '/看片'], description: '讓角色推薦電影',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '想看什麼類型？愛情？動作？還是懸疑？', mood: 'happy', animation: null },
      riku:    { text: '...說說你的喜好\n我給你找', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/推薦書', aliases: ['/book', '/書', '/看書', '/讀書'], description: '讓角色推薦書籍',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '要推薦什麼類型的書？小說？商業？自我成長？', mood: 'happy', animation: null },
      riku:    { text: '...你想看什麼類型', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/翻譯', aliases: ['/translate', '/翻成', '/幫我翻'], description: '請角色幫你翻譯文字',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '要翻什麼？說！我中英日韓都會！（還行啦）', mood: 'excited', animation: null },
      riku:    { text: '...說要翻什麼\n目標語言', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/計算', aliases: ['/calc', '/算', '/算算', '/計算機'], description: '請角色幫你計算',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '要算什麼？說數字！我的數學還不錯的！', mood: 'excited', animation: null },
      riku:    { text: '...說算式', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/問問題', aliases: ['/ask', '/問', '/問一個', '/qa'], description: '問角色任何問題',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '問吧！什麼都可以問！\n我知道很多事情的！（可能啦）', mood: 'happy', animation: null },
      riku:    { text: '說', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/文字遊戲', aliases: ['/word-game', '/接龍', '/造句'], description: '跟角色玩文字遊戲',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '要玩接龍嗎？還是造句？還是文字謎？你說！', mood: 'excited', animation: 'excited' },
      riku:    { text: '...選一個\n接龍 / 造句 / 謎語', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/腦筋急轉彎', aliases: ['/riddle', '/謎語', '/猜謎'], description: '請角色出謎語',
    category: 'fun', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '好！準備好被難倒了嗎！\n（摩拳擦掌）', mood: 'excited', animation: 'excited' },
      riku:    { text: '...聽題\n（沉默是確認）', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
]

// ── 導航指令 ──────────────────────────────────────────────────────────────────

const NAVIGATE: Array<SlashCommand & { handler: CommandHandler }> = [
  {
    command: '/首頁', aliases: ['/home', '/回首頁', '/主頁'], description: '前往首頁',
    category: 'navigate', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '回首頁！走吧～', mood: 'happy', animation: null },
      riku:    { text: '首頁', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/' },
      needsLLM: false,
    }),
  },
  {
    command: '/個人檔案', aliases: ['/profile', '/我的頁面', '/個人頁'], description: '前往個人頁面',
    category: 'navigate', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['個人頁面功能快來了！', '你的個人頁建置中～敬請期待！', '快好了！個人頁面正在趕工～', '個人頁面快到啦！先去探索逛逛？']), mood: 'happy', animation: null },
      riku:    { text: rnd(['...建置中', '快了', '嗯。等一下', '...還沒好']), mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/explore' },
      needsLLM: false,
    }),
  },
  {
    command: '/我的文章', aliases: ['/my-articles', '/我的部落格', '/文章列表'], description: '查看自己的文章',
    category: 'navigate', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['去部落格看看你寫的文章！', '你的文章都在這裡～', '去「部落格」找你的文章吧！', '帶你去看你的文章～']), mood: 'happy', animation: null },
      riku:    { text: rnd(['部落格', '...你的文章', '嗯。去那裡找', '...去看']), mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/blogs' },
      needsLLM: false,
    }),
  },
  {
    command: '/收藏', aliases: ['/favorites', '/我的收藏', '/已收藏'], description: '查看收藏的文章',
    category: 'navigate', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['收藏功能快來了！先去探索找有趣的文章吧～', '收藏頁面建置中！敬請期待～', '快了！現在先去探索一下？', '收藏系統快好了～先去探索頁面逛逛！']), mood: 'happy', animation: null },
      riku:    { text: rnd(['...建置中', '快了', '嗯。先等', '...還沒好']), mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/explore' },
      needsLLM: false,
    }),
  },
  {
    command: '/探索', aliases: ['/explore', '/瀏覽', '/發現', '/看看'], description: '探索平台內容',
    category: 'navigate', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去探索一下！說不定有你喜歡的～', mood: 'excited', animation: 'excited' },
      riku:    { text: '探索頁面', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/explore' },
      needsLLM: false,
    }),
  },
]

// ── 管理員指令 ────────────────────────────────────────────────────────────────

const ADMIN: Array<SlashCommand & { handler: CommandHandler }> = [
  // ── 數據查詢 ──
  {
    command: '/stats', aliases: ['/數據', '/狀態', '/dashboard'], description: '即時問卷數據總覽',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '幫你看看現在的數據！', mood: 'thinking', animation: 'think' },
      riku:    { text: '數據', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/cost', aliases: ['/成本', '/花費', '/ai-usage'], description: '今日 AI Token 消耗',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '讓我算算今天花了多少...', mood: 'thinking', animation: 'think' },
      riku:    { text: '今日成本', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/alerts', aliases: ['/警報', '/告警', '/異常'], description: '未處理的異常警報',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '讓我看看有什麼狀況...', mood: 'thinking', animation: null },
      riku:    { text: '警報', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'panel' },
      needsLLM: false,
    }),
  },
  // ── 管理導航 ──
  {
    command: '/後台', aliases: ['/admin', '/管理後台', '/後台首頁'], description: '前往管理後台',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去後台！', mood: 'happy', animation: null },
      riku:    { text: '後台', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: '' },
      needsLLM: false,
    }),
  },
  {
    command: '/問卷管理', aliases: ['/surveys', '/問卷列表', '/管理問卷'], description: '前往問卷管理',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去問卷管理頁面！', mood: 'happy', animation: null },
      riku:    { text: '問卷管理', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'surveys' },
      needsLLM: false,
    }),
  },
  {
    command: '/填答記錄', aliases: ['/responses', '/回覆', '/填答列表'], description: '前往填答記錄',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去看填答記錄！', mood: 'happy', animation: null },
      riku:    { text: '填答記錄', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'responses' },
      needsLLM: false,
    }),
  },
  {
    command: '/AI洞察', aliases: ['/insight', '/ai-insight', '/報告'], description: '前往 AI 洞察報告',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去看 AI 洞察報告！', mood: 'happy', animation: null },
      riku:    { text: 'AI 洞察', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'insight' },
      needsLLM: false,
    }),
  },
  {
    command: '/標籤分析', aliases: ['/tags', '/標籤', '/用戶標籤'], description: '前往標籤分析',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去看標籤分析！', mood: 'happy', animation: null },
      riku:    { text: '標籤分析', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'tags' },
      needsLLM: false,
    }),
  },
  {
    command: '/漏斗分析', aliases: ['/funnel', '/漏斗', '/棄卷率'], description: '前往漏斗分析',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去看漏斗分析！哪一題棄卷最多？', mood: 'thinking', animation: null },
      riku:    { text: '漏斗分析', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'funnel' },
      needsLLM: false,
    }),
  },
  {
    command: '/LINE推播', aliases: ['/broadcast', '/推播', '/line-push'], description: '前往 LINE 推播',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去 LINE 推播頁面！', mood: 'happy', animation: null },
      riku:    { text: 'LINE 推播', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'broadcast' },
      needsLLM: false,
    }),
  },
  {
    command: '/LINE設定', aliases: ['/line-settings', '/line設定', '/line-config'], description: '前往 LINE 設定',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去 LINE 設定！', mood: 'happy', animation: null },
      riku:    { text: 'LINE 設定', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'line-settings' },
      needsLLM: false,
    }),
  },
  {
    command: '/AI設定', aliases: ['/ai-settings', '/api-key', '/ai金鑰'], description: '前往 AI 設定（API Key）',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去 AI 設定！記得設 Key 喔～', mood: 'happy', animation: null },
      riku:    { text: 'AI 設定', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'ai-settings' },
      needsLLM: false,
    }),
  },
  {
    command: '/團隊管理', aliases: ['/team', '/成員', '/管理員列表'], description: '前往團隊管理',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '去看團隊成員！', mood: 'happy', animation: null },
      riku:    { text: '團隊管理', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'team' },
      needsLLM: false,
    }),
  },
  {
    command: '/生成問卷', aliases: ['/ai-survey', '/ai生成', '/ai問卷', '/自動生成'], description: 'AI 幫你生成問卷',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '要用 AI 幫你生成問卷嗎！說主題！', mood: 'excited', animation: 'excited' },
      riku:    { text: '...說主題\n我幫你生成', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/今日填答', aliases: ['/today-responses', '/今天回覆', '/今天填答幾筆'], description: '查看今日填答數量',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: '今天有多少人填問卷？讓我查查～', mood: 'thinking', animation: 'think' },
      riku:    { text: '今日填答', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/模板庫', aliases: ['/templates', '/問卷模板', '/template'], description: '前往問卷模板庫',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['去模板庫找靈感！', '問卷模板在這！一鍵套用！', '模板庫！說不定有你想要的！', '去挑個模板！省時省力～']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['模板庫', '...去選', '嗯。模板', '...挑一個']), mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'survey-templates' },
      needsLLM: false,
    }),
  },
  {
    command: '/部落格管理', aliases: ['/blog-admin', '/文章管理後台', '/部落格後台'], description: '前往部落格管理後台',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['去部落格後台！管理你的文章～', '部落格管理在這！', '去看你的文章列表！', '帶你去部落格管理頁～']), mood: 'happy', animation: null },
      riku:    { text: rnd(['部落格後台', '...管理頁', '嗯。去那邊', '...文章管理']), mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'blog' },
      needsLLM: false,
    }),
  },
  {
    command: '/寫文章', aliases: ['/editor', '/寫作', '/new-article', '/新文章'], description: '前往部落格寫作編輯器',
    category: 'admin', adminOnly: true, ownerOnly: false,
    handler: () => ({
      yukirin: { text: rnd(['去部落格寫文章！', '部落格編輯器開起來！', '去寫文章吧！！', '創作時間！帶你去部落格編輯器～']), mood: 'excited', animation: 'excited' },
      riku:    { text: rnd(['部落格', '...去寫', '嗯。寫吧', '...開始']), mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'blog' },
      needsLLM: false,
    }),
  },
]

// ── 老闆專屬指令（ownerOnly，只有 platform_unlimited = true 的帳號能用）────────

const OWNER: Array<SlashCommand & { handler: CommandHandler }> = [
  // ── 平台總覽 ──
  {
    command: '/全平台', aliases: ['/platform', '/overview', '/總覽'], description: '全平台租戶與用戶總覽',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '老闆要看全平台！讓我查...', mood: 'thinking', animation: 'think' },
      riku:    { text: '...查詢中', mood: 'neutral', animation: 'think' },
      action: { type: 'fetch_owner_data', target: 'platform' },
      needsLLM: false,
    }),
  },
  {
    command: '/財報', aliases: ['/revenue', '/income', '/營收'], description: 'Z幣收支與平台營收',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '讓我算算平台的錢...', mood: 'thinking', animation: 'think' },
      riku:    { text: '...算帳中', mood: 'neutral', animation: 'think' },
      action: { type: 'fetch_owner_data', target: 'revenue' },
      needsLLM: false,
    }),
  },
  {
    command: '/今日報告', aliases: ['/today', '/日報', '/daily-report'], description: '今日平台活躍、問卷、AI 消耗彙整',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '今天的報告馬上來！', mood: 'happy', animation: null },
      riku:    { text: '...整理中', mood: 'neutral', animation: 'think' },
      action: { type: 'fetch_owner_data', target: 'today' },
      needsLLM: false,
    }),
  },
  {
    command: '/AI成本', aliases: ['/ai-cost', '/token成本', '/燒了多少'], description: '今日/本月 AI Token 消耗與成本',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '讓我算算燒了多少 Token...', mood: 'thinking', animation: 'think' },
      riku:    { text: '...計算中', mood: 'neutral', animation: 'think' },
      action: { type: 'fetch_owner_data', target: 'ai-cost' },
      needsLLM: false,
    }),
  },
  // ── 租戶/用戶管理 ──
  {
    command: '/租戶', aliases: ['/tenants', '/組織列表'], description: '查看所有租戶組織',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '所有的組織在這裡～', mood: 'happy', animation: null },
      riku:    { text: '租戶列表', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/snowrealm-insight-ctrl' },
      needsLLM: false,
    }),
  },
  {
    command: '/用戶', aliases: ['/users', '/用戶列表', '/會員'], description: '查看平台用戶列表',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '讓我查看所有用戶...', mood: 'thinking', animation: 'think' },
      riku:    { text: '用戶列表', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/snowrealm-insight-ctrl' },
      needsLLM: false,
    }),
  },
  {
    command: '/發Z幣', aliases: ['/give-zcoin', '/給Z幣', '/zcoin-grant'], description: '給指定用戶發放 Z 幣',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '老闆大方撒錢！要給誰多少？', mood: 'excited', animation: 'excited' },
      riku:    { text: '...發放 Z 幣，說明用戶和數量', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/禮遇', aliases: ['/platform-unlimited', '/設禮遇', '/grant-unlimited'], description: '設定/取消用戶的平台禮遇',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '要給誰開啟平台禮遇？說用戶名稱～', mood: 'happy', animation: null },
      riku:    { text: '平台禮遇管理，說明目標用戶', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  // ── 系統 & 部署 ──
  {
    command: '/系統狀態', aliases: ['/system', '/health', '/健康狀況'], description: '查看系統健康狀況',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '讓我看看系統跑得怎樣...', mood: 'thinking', animation: 'think' },
      riku:    { text: '系統狀態', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/insight-admin/panel' },
      needsLLM: false,
    }),
  },
  {
    command: '/部署', aliases: ['/deploy', '/deployment', '/最新部署'], description: '查看最新部署記錄',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '部署相關要去 Zeabur 面板看！帶你去總後台～', mood: 'happy', animation: null },
      riku:    { text: '...去系統健康面板', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/snowrealm-insight-ctrl/health' },
      needsLLM: false,
    }),
  },
  {
    command: '/錯誤日誌', aliases: ['/logs', '/errors', '/error-log'], description: '查看最新錯誤記錄',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '錯誤日誌在審計紀錄裡！帶你去看～', mood: 'happy', animation: null },
      riku:    { text: '...審計紀錄', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/snowrealm-insight-ctrl/audit' },
      needsLLM: false,
    }),
  },
  // ── 內容/通知管理 ──
  {
    command: '/公告', aliases: ['/announce', '/broadcast-all', '/全體通知'], description: '發送平台公告給所有用戶',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '老闆要發公告！去通知中心設定！', mood: 'excited', animation: 'excited' },
      riku:    { text: '平台公告', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/snowrealm-insight-ctrl/notifications' },
      needsLLM: false,
    }),
  },
  {
    command: '/提示詞', aliases: ['/prompts', '/人設', '/ai-persona'], description: '調整雪凜與凜空的 AI 人設',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '老闆要改我的人設嗎...？可以但要對我好一點！', mood: 'shy', animation: null },
      riku:    { text: '...去改吧', mood: 'neutral', animation: null },
      action: { type: 'navigate', target: '/snowrealm-insight-ctrl/ai-prompt' },
      needsLLM: false,
    }),
  },
  {
    command: '/清記憶', aliases: ['/forget', '/reset-memory', '/清除記憶'], description: '清除所有用戶的 AI 對話記憶',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '等等...老闆你確定要清記憶嗎？這個要去後台操作喔！', mood: 'surprised', animation: null },
      riku:    { text: '這個需要謹慎', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  // ── 數據 & 問卷 ──
  {
    command: '/問卷總覽', aliases: ['/all-surveys', '/survey-overview'], description: '所有租戶的問卷與回覆總量',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '所有問卷的數據，馬上來！', mood: 'thinking', animation: 'think' },
      riku:    { text: '...查詢中', mood: 'neutral', animation: 'think' },
      action: { type: 'fetch_owner_data', target: 'surveys' },
      needsLLM: false,
    }),
  },
  {
    command: '/週趨勢', aliases: ['/weekly-trend', '/weekly-stats', '/本週趨勢'], description: '本週平台整體趨勢分析',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '來看看這週的趨勢！', mood: 'happy', animation: null },
      riku:    { text: '...整理中', mood: 'neutral', animation: 'think' },
      action: { type: 'fetch_owner_data', target: 'weekly' },
      needsLLM: false,
    }),
  },
  // ── 部落格 & 創作 ──
  {
    command: '/文章管理', aliases: ['/blogs', '/blog-list', '/部落格管理'], description: '前往部落格文章管理',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '去看看文章列表！', mood: 'happy', animation: null },
      riku:    { text: '文章管理', mood: 'neutral', animation: null },
      action: { type: 'navigate_admin', target: 'blog' },
      needsLLM: false,
    }),
  },
  // ── 雜項 ──
  {
    command: '/模擬登入', aliases: ['/impersonate', '/sudo', '/以身分登入'], description: '以某租戶身分進入後台（模擬）',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: () => ({
      yukirin: { text: '要模擬哪個組織的管理員？說組織名稱～', mood: 'thinking', animation: 'think' },
      riku:    { text: '模擬登入，說組織 slug', mood: 'neutral', animation: null },
      needsLLM: true,
    }),
  },
  {
    command: '/老闆模式', aliases: ['/boss-mode', '/boss', '/主宰模式'], description: '進入老闆模式（顯示所有隱藏資訊）',
    category: 'owner', adminOnly: true, ownerOnly: true,
    handler: (state) => ({
      yukirin: { text: `老闆好！歡迎回來 🌟\n\n你是這個平台的創造者\n有什麼想知道的，儘管說吧`, mood: 'excited', animation: 'excited' },
      riku:    { text: '...（微微一鞠躬）老闆', mood: 'neutral', animation: 'nod' },
      needsLLM: false,
    }),
  },
]

// ── 行銷助手指令 ──────────────────────────────────────────────────────────────

const MARKETING: Array<SlashCommand & { handler: CommandHandler }> = [
  // ── 社群貼文 ──
  {
    command: '/寫貼文', aliases: ['/post', '/social', '/社群貼文', '/ig', '/fb'],
    description: '為社群媒體（IG / FB / LINE / Twitter）生成貼文文案與 hashtag',
    category: 'marketing', adminOnly: false, ownerOnly: false,
    handler: (_, args) => ({
      yukirin: {
        text: args
          ? `好！幫你寫「${args}」的社群貼文～\n\n告訴我：哪個平台？（IG / FB / LINE / Twitter）目標受眾是誰？要什麼語氣？（活潑/專業/感性）`
          : rnd([
              '行銷助手模式開啟！✍️\n\n告訴我你要宣傳什麼？（產品/活動/文章/品牌故事）\n我幫你寫各平台貼文 + hashtag 組合！',
              '社群文案交給我！📱\n\n什麼主題？哪個平台？還有…你希望什麼感覺？（溫暖/霸氣/可愛）',
              '貼文生成中～✨\n\n先告訴我：要宣傳什麼？主力在哪個平台？',
            ]),
        mood: 'excited', animation: 'excited',
      },
      riku: {
        text: rnd(['說說你要宣傳什麼', '平台？主題？風格？', '...告訴我細節']),
        mood: 'thinking', animation: 'think',
      },
      needsLLM: true,
    }),
  },
  {
    command: '/廣告文案', aliases: ['/ad', '/ads', '/廣告', '/文案'],
    description: '生成廣告標題、內文、CTA（A/B 變體）',
    category: 'marketing', adminOnly: false, ownerOnly: false,
    handler: (_, args) => ({
      yukirin: {
        text: args
          ? `幫你做「${args}」的廣告文案！\n\n一次給你 3 種版本（理性/感性/急迫感），你挑最順眼的！`
          : rnd([
              '廣告文案生成！🎯\n\n告訴我：賣什麼？TA 是誰？要跑哪個平台廣告？\n我給你 A/B/C 三個版本！',
              '文案交給我！📣\n\n產品名稱？主要賣點？還有預算有限制嗎？（影響用詞急迫感）',
            ]),
        mood: 'excited', animation: 'wave',
      },
      riku: {
        text: rnd(['說說產品和TA', '...需要哪類文案', '賣點？平台？']),
        mood: 'thinking', animation: 'think',
      },
      needsLLM: true,
    }),
  },
  // ── SEO / 內容行銷 ──
  {
    command: '/SEO', aliases: ['/seo', '/關鍵字', '/搜尋優化', '/meta'],
    description: '生成 SEO 標題、meta description、關鍵字建議',
    category: 'marketing', adminOnly: false, ownerOnly: false,
    handler: (_, args) => ({
      yukirin: {
        text: args
          ? `幫你分析「${args}」的 SEO！\n\n給我你的目標關鍵字或文章主題，我來生成 meta title、description 和 H1 建議！`
          : rnd([
              'SEO 優化開始！🔍\n\n貼上你的文章標題或主題，我幫你：\n① 最佳化 meta title（60 字以內）\n② 寫 meta description（150 字以內）\n③ 建議 5 個長尾關鍵字',
              '搜尋優化交給我！✨\n\n你想優化哪篇文章？或者想針對哪個關鍵字做排名？',
            ]),
        mood: 'thinking', animation: 'think',
      },
      riku: {
        text: rnd(['文章主題？', '...關鍵字是什麼', '說說要優化什麼']),
        mood: 'thinking', animation: 'think',
      },
      needsLLM: true,
    }),
  },
  {
    command: '/內容策略', aliases: ['/content', '/內容規劃', '/行銷計畫', '/editorial'],
    description: '生成一週/一個月的內容行銷排程與主題規劃',
    category: 'marketing', adminOnly: false, ownerOnly: false,
    handler: (_, args) => ({
      yukirin: {
        text: args
          ? `幫你規劃「${args}」的內容策略！\n\n要幾週的計畫？主力平台是哪些？`
          : rnd([
              '內容行銷策略規劃！📅\n\n告訴我：\n① 你的品牌/產品是什麼？\n② 主力平台（IG/部落格/LINE）？\n③ 想規劃幾週？\n\n我幫你做完整主題排程！',
              '幫你排行銷日曆！🗓️\n\n品牌定位？目標族群？最近有沒有特定活動要配合？',
            ]),
        mood: 'excited', animation: 'excited',
      },
      riku: {
        text: rnd(['品牌？平台？週期？', '...說說行銷目標', '規劃幾週？']),
        mood: 'thinking', animation: 'think',
      },
      needsLLM: true,
    }),
  },
  // ── Email 行銷 ──
  {
    command: '/電子報', aliases: ['/newsletter', '/email行銷', '/email', '/信件'],
    description: '生成電子報、促銷信件、活動邀請函草稿',
    category: 'marketing', adminOnly: false, ownerOnly: false,
    handler: (_, args) => ({
      yukirin: {
        text: args
          ? `幫你寫「${args}」的電子報！\n\n是促銷信？活動通知？還是定期週報？給我主題我來起草！`
          : rnd([
              '電子報撰寫模式！📧\n\n告訴我：\n① 這封信的目的（促銷/活動通知/週報/召回信）\n② 收件者是誰？\n③ 最重要想傳達的一件事？\n\n我幫你寫主旨 + 內文 + CTA！',
              '信件文案來了！✉️\n\n什麼類型的信？（歡迎信/促銷/活動/流失召回）給我主題！',
            ]),
        mood: 'happy', animation: null,
      },
      riku: {
        text: rnd(['信件類型？主題？', '...要給誰的信', '說說目的']),
        mood: 'neutral', animation: null,
      },
      needsLLM: true,
    }),
  },
  // ── 數據分析 ──
  {
    command: '/行銷分析', aliases: ['/analytics', '/數據', '/成效分析', '/marketing-report'],
    description: '解讀行銷數據、提供改善建議',
    category: 'marketing', adminOnly: false, ownerOnly: false,
    handler: (_, args) => ({
      yukirin: {
        text: args
          ? `幫你分析「${args}」！\n\n貼上你的數據或描述現況，我來解讀 + 給出行動建議！`
          : rnd([
              '行銷數據分析！📊\n\n貼上你的數字（點擊率/轉換率/開信率/ROAS 等），或者描述你遇到的問題，我來幫你診斷 + 提供改善方向！',
              '數據解讀交給我！🔍\n\n你有什麼數字想搞懂？還是某個指標一直不理想？說說看！',
            ]),
        mood: 'thinking', animation: 'think',
      },
      riku: {
        text: rnd(['貼上你的數據', '...什麼指標有問題', '說說現況']),
        mood: 'thinking', animation: 'think',
      },
      needsLLM: true,
    }),
  },
  // ── 競品分析 ──
  {
    command: '/競品分析', aliases: ['/competitor', '/競爭對手', '/市場分析'],
    description: '分析競爭對手行銷策略，找出差異化機會',
    category: 'marketing', adminOnly: false, ownerOnly: false,
    handler: (_, args) => ({
      yukirin: {
        text: args
          ? `分析「${args}」的行銷策略！\n\n告訴我更多背景，我幫你找出差異化機會點！`
          : rnd([
              '競品分析開始！🕵️\n\n告訴我：\n① 你的競爭對手是誰？\n② 你們的產品/服務大概是什麼？\n③ 你覺得他們哪裡比你強？\n\n我幫你找出差距和機會！',
              '研究競爭對手！🔬\n\n競品名稱？他們主要在哪個平台活躍？你想超越他們的哪個面向？',
            ]),
        mood: 'thinking', animation: 'think',
      },
      riku: {
        text: rnd(['競品是誰？', '...說說對手', '你想超越哪個面向？']),
        mood: 'thinking', animation: 'think',
      },
      needsLLM: true,
    }),
  },
  // ── 品牌聲音 ──
  {
    command: '/品牌定位', aliases: ['/branding', '/品牌', '/定位', '/brand'],
    description: '釐清品牌定位、目標受眾、獨特價值主張（UVP）',
    category: 'marketing', adminOnly: false, ownerOnly: false,
    handler: () => ({
      yukirin: {
        text: rnd([
          '品牌定位工作坊！🎨\n\n我問你答，一起釐清你的品牌！\n\n第一題：你的產品/服務幫什麼人解決什麼問題？（一句話）',
          '幫你想清楚品牌！💡\n\n很多人說不清楚自己的差異化，沒關係！\n我來問，你來答，最後我整理成一份品牌定位摘要！\n\n先說：你的產品是什麼？',
        ]),
        mood: 'excited', animation: 'excited',
      },
      riku: {
        text: rnd(['產品是什麼？', '...說說你的品牌', '解決什麼問題？']),
        mood: 'thinking', animation: 'think',
      },
      needsLLM: true,
    }),
  },
  // ── 口碑行銷 ──
  {
    command: '/KOL企劃', aliases: ['/kol', '/網紅', '/influencer', '/口碑行銷'],
    description: '設計 KOL / 網紅行銷企劃、合作提案',
    category: 'marketing', adminOnly: false, ownerOnly: false,
    handler: (_, args) => ({
      yukirin: {
        text: args
          ? `幫你做「${args}」的 KOL 行銷企劃！\n\n預算範圍？希望合作的 KOL 規模（奈米/微型/中型/大型）？`
          : rnd([
              'KOL 合作企劃！🌟\n\n告訴我：\n① 你的品牌/產品\n② 預算大概多少？\n③ 目標是曝光還是轉換？\n\n我幫你設計合作方案 + 寄出的提案模板！',
              '網紅行銷企劃！✨\n\n想找 KOL 合作嗎？說說你的品牌和目標，我幫你規劃策略！',
            ]),
        mood: 'happy', animation: 'wave',
      },
      riku: {
        text: rnd(['品牌？預算？目標？', '...找什麼規模的KOL', '說說合作目標']),
        mood: 'thinking', animation: 'think',
      },
      needsLLM: true,
    }),
  },
  // ── 活動企劃 ──
  {
    command: '/活動企劃', aliases: ['/event', '/活動', '/campaign', '/企劃'],
    description: '生成行銷活動企劃、促銷方案設計',
    category: 'marketing', adminOnly: false, ownerOnly: false,
    handler: (_, args) => ({
      yukirin: {
        text: args
          ? `幫你設計「${args}」的活動企劃！\n\n規模大嗎？線上線下？預算？時間點？`
          : rnd([
              '活動企劃時間！🎉\n\n什麼類型的活動？（週年慶/新品上市/節日促銷/品牌體驗）\n線上還是線下？預算大概多少？\n我幫你從主題到執行細節全部規劃！',
              '一起做活動！🎊\n\n有什麼想辦的活動或促銷嗎？說說你的想法，我來幫你充實成完整企劃！',
            ]),
        mood: 'excited', animation: 'excited',
      },
      riku: {
        text: rnd(['活動類型？規模？', '...線上還是線下', '說說你的想法']),
        mood: 'thinking', animation: 'think',
      },
      needsLLM: true,
    }),
  },
]

// ── 對外 API ──────────────────────────────────────────────────────────────────

const ALL_COMMANDS = [...BASIC, ...INTERACT, ...PRESENCE, ...CHARACTER, ...TOOL, ...MARKETING, ...FUN, ...NAVIGATE, ...ADMIN, ...OWNER]

/** 處理斜線指令，回傳結果（null = 找不到指令） */
export function handleSlashCommand(
  input: string,
  state: UserState
): CommandResult | null {
  const parts = input.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1).join(' ')

  for (const def of ALL_COMMANDS) {
    if (def.ownerOnly && !state.isOwner) continue
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
  isAdmin: boolean,
  isOwner?: boolean
): SlashCommand[] {
  const q = filter.toLowerCase()
  const results = ALL_COMMANDS
    .filter(c => !c.ownerOnly || isOwner)
    .filter(c => !c.adminOnly || isAdmin)
    .filter(c =>
      c.command.includes(q) ||
      c.aliases.some(a => a.includes(q)) ||
      c.description.includes(q)
    )
    .map(({ command, aliases, description, category, adminOnly, ownerOnly }) =>
      ({ command, aliases, description, category, adminOnly, ownerOnly })
    )
  // 老闆指令優先顯示在最前面
  if (isOwner) {
    results.sort((a, b) => {
      if (a.ownerOnly && !b.ownerOnly) return -1
      if (!a.ownerOnly && b.ownerOnly) return 1
      if (a.adminOnly && !b.adminOnly) return -1
      if (!a.adminOnly && b.adminOnly) return 1
      return 0
    })
  }
  return results
}

/** 判斷輸入是否是斜線指令 */
export function isSlashCommand(input: string): boolean {
  return input.trimStart().startsWith('/')
}

/** 對外導出指令清單（不含 handler） */
export const SLASH_COMMANDS: SlashCommand[] = ALL_COMMANDS.map(
  ({ command, aliases, description, category, adminOnly, ownerOnly }) =>
    ({ command, aliases, description, category, adminOnly, ownerOnly })
)
