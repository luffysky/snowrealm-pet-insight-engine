// 雪凜備用對話腳本 — AI 未連線時的兜底回應
// 依關鍵字比對，回傳與 GuideResponse 相同格式

import type { GuideMood } from './guideEngine'

interface FallbackResponse {
  text: string
  mood: GuideMood
  quickReplies?: string[]
}

// ── 關鍵字 → 回應 映射 ───────────────────────────────────────────────────────

const FALLBACK_RULES: { pattern: RegExp; responses: FallbackResponse[] }[] = [
  // 導覽 / 新手
  {
    pattern: /帶我逛|導覽|新手|第一次|怎麼開始|介紹一下/,
    responses: [
      {
        text: '欸嘿～歡迎歡迎！這裡是 SnowRealm Insight，簡單說就是「超聰明的問卷平台」啦！你可以建問卷、收回覆、然後讓 AI 幫你分析數據～要我從哪裡開始帶你逛？',
        mood: 'excited',
        quickReplies: ['建立問卷', '查看分析', '了解Z幣'],
      },
      {
        text: '好好好，我來帶路！Insight 的核心流程是：建問卷 → 發出去收回覆 → AI 分析報告。聽起來很厲害對吧，因為它本來就很厲害啊哈哈',
        mood: 'wink',
        quickReplies: ['怎麼建問卷', '分析功能', '問卷模板'],
      },
    ],
  },

  // 問卷建立
  {
    pattern: /建問卷|怎麼建|新問卷|創問卷|建立問卷/,
    responses: [
      {
        text: '建問卷超簡單！去後台點「問卷管理」→「新增問卷」，然後你可以自己加題目，或是讓 AI 幫你出題（推薦！省超多時間）',
        mood: 'happy',
        quickReplies: ['AI出題怎麼用', '問卷模板', '分流是什麼'],
      },
    ],
  },

  // 功能怎麼用
  {
    pattern: /功能怎麼用|怎麼用|如何|怎樣|在哪|哪裡/,
    responses: [
      {
        text: '讓我看看～你在問哪個功能呀？Insight 有問卷建立、AI 分析、Z幣、LINE 整合……功能有點多，說清楚一點我比較好幫你！',
        mood: 'thinking',
        quickReplies: ['問卷相關', 'AI分析', 'Z幣怎麼用'],
      },
      {
        text: '欸這個問題很廣欸。你是在問問卷填答、後台設定、還是 AI 分析那塊？說詳細一點我才能幫你找到正確位置～',
        mood: 'neutral',
        quickReplies: ['問卷填答', '後台設定', 'AI相關'],
      },
    ],
  },

  // AI 分析 / 洞察報告
  {
    pattern: /AI分析|洞察報告|AI報告|結果分析|報告|分析/,
    responses: [
      {
        text: '哦這個我最愛了！問卷收到回覆後，去後台的「AI 洞察報告」，點一下「產生報告」，AI 就會幫你整理出重點發現、建議行動這些～等個幾秒就好',
        mood: 'excited',
        quickReplies: ['怎麼看報告', '數據在哪', '可以分享嗎'],
      },
    ],
  },

  // Z幣
  {
    pattern: /z幣|zcoin|點數|儲值|商城|兌換|獎勵/,
    responses: [
      {
        text: '欸嘿 Z幣！填問卷可以賺 Z幣，然後去商城換貼圖或禮物。不能提現喔（我知道你想問），但換貼圖很好用啦～',
        mood: 'wink',
        quickReplies: ['怎麼賺Z幣', '商城在哪', '還能換什麼'],
      },
      {
        text: '喔喔 Z幣我懂！每填完一份問卷就有，分享結果也有額外獎勵。你現在有多少 Z幣我不知道欸，去帳號頁面查看一下？',
        mood: 'happy',
        quickReplies: ['去看餘額', '怎麼賺更多', '可以換什麼'],
      },
    ],
  },

  // 問題 / 錯誤
  {
    pattern: /bug|錯誤|壞了|當機|問題|不能用|無法|失敗|怪怪|奇怪/,
    responses: [
      {
        text: '啊不好意思你遇到問題了嗚嗚。可以描述一下是哪個頁面、做了什麼、然後出現什麼情況嗎？這樣我才能幫你查～',
        mood: 'thinking',
        quickReplies: ['是登入問題', '是問卷問題', '是其他問題'],
      },
    ],
  },

  // 分享 / 故事卡片
  {
    pattern: /分享|故事|卡片|限動|IG|LINE分享/,
    responses: [
      {
        text: '分享功能！填完問卷後可以直接生成個人故事卡片，分享到 LINE 或 IG 都很適合～而且分享還會多賺 Z幣哦',
        mood: 'excited',
        quickReplies: ['怎麼生成卡片', '可以自訂嗎', '分享到LINE'],
      },
    ],
  },

  // LINE / 綁定
  {
    pattern: /line|綁定|line填答|用line/,
    responses: [
      {
        text: '哦 LINE 整合！加 Official Bot 為好友後，可以直接在 LINE 裡填問卷，不用跳到網頁，超方便的。而且填完還會推送結果給你！',
        mood: 'happy',
        quickReplies: ['怎麼加好友', '用LINE填答', 'LINE綁定'],
      },
    ],
  },

  // 聊天 / 打招呼
  {
    pattern: /你好|嗨|哈囉|hello|hi|安安|嘿/,
    responses: [
      {
        text: '嗨嗨！我是雪凜，Insight 的 AI 嚮導精靈～有什麼我可以幫你的嗎？',
        mood: 'happy',
        quickReplies: ['帶我逛逛', '功能怎麼用', '找我聊天'],
      },
      {
        text: '欸嘿～你好你好！今天心情怎樣？需要我幫你找什麼功能嗎？',
        mood: 'wink',
        quickReplies: ['帶我導覽', '有問題想問', '隨便聊聊'],
      },
    ],
  },

  // 誇雪凜
  {
    pattern: /你好可愛|好萌|好棒|謝謝你|謝謝|你真的很棒/,
    responses: [
      {
        text: '欸嘿～你說什麼！(害羞) 謝謝你這樣說，那我要更認真幫你了哈哈！有需要隨時來找我～',
        mood: 'wink',
        quickReplies: ['再問你一個', '帶我逛逛', '掰掰'],
      },
    ],
  },

  // 再見
  {
    pattern: /掰掰|bye|再見|晚安|拜拜/,
    responses: [
      {
        text: '掰掰～有需要我再叫我！希望你用 Insight 很順利 💛',
        mood: 'happy',
        quickReplies: ['等等再問', '謝謝你', '再見'],
      },
    ],
  },

  // 隨便聊聊
  {
    pattern: /聊天|無聊|沒事|閒聊|說說話/,
    responses: [
      {
        text: '哦你想聊天！好啊好啊，我很閒的。話說你有在用 Insight 的問卷功能嗎？還是剛來？',
        mood: 'relaxed',
        quickReplies: ['剛來探索', '已經在用了', '隨便問問'],
      },
      {
        text: '欸嘿閒聊我喜歡！不過我腦袋裡都是問卷和 AI 的東西啦哈哈，你要聊什麼？',
        mood: 'wink',
        quickReplies: ['聊Insight', '聊功能', '隨便'],
      },
    ],
  },
]

// ── 萬用兜底 ─────────────────────────────────────────────────────────────────

const DEFAULT_FALLBACKS: FallbackResponse[] = [
  {
    text: '讓我看看...（其實我現在腦袋空空，AI 剛好有點忙）你說的是什麼功能呀？我盡量幫你！',
    mood: 'thinking',
    quickReplies: ['帶我逛逛', '功能怎麼用', '找我聊天'],
  },
  {
    text: '欸這個嘛～讓我想想。（偷偷說：AI 訊號有點弱，但我還是可以回答基本問題啦！）',
    mood: 'neutral',
    quickReplies: ['問卷相關', 'Z幣相關', '其他問題'],
  },
  {
    text: '嗯嗯，我聽到了！不過我現在用的是「備用腦袋」模式，如果答不清楚請見諒哦～有什麼我可以幫你？',
    mood: 'relaxed',
    quickReplies: ['帶我導覽', '功能怎麼用', '找我聊天'],
  },
]

// ── 主函式 ───────────────────────────────────────────────────────────────────

let _fallbackCounter = 0

/** 根據使用者輸入，回傳備用腳本回應（不需要 AI） */
export function getFallbackResponse(message: string): FallbackResponse {
  const msg = message.toLowerCase()

  for (const rule of FALLBACK_RULES) {
    if (rule.pattern.test(msg)) {
      const variants = rule.responses
      return variants[Math.floor(Math.random() * variants.length)]
    }
  }

  // 萬用兜底（輪流使用，避免重複）
  const response = DEFAULT_FALLBACKS[_fallbackCounter % DEFAULT_FALLBACKS.length]
  _fallbackCounter++
  return response
}
