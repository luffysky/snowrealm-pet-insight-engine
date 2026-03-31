/**
 * 平台預設問卷模板定義
 * 每個模板包含完整的 survey_config + questions + branch_config
 * 可透過 scripts/seed-templates.ts 寫入 DB
 */

export interface TemplateQuestion {
  key: string
  type: 'single' | 'multiple' | 'text'
  content: string
  options: { label: string; value: string; emoji?: string }[]
  isRequired: boolean
  maxSelections?: number
  route?: string
}

export interface SurveyTemplateDefinition {
  name: string
  description: string
  industry: string
  icon: string
  tags: string[]
  survey_config: {
    title: string
    subtitle: string
    coverTitle: string
    coverSubtitle: string
    startButtonText: string
    doneTitle: string
    doneSubtitle: string
    theme?: string
  }
  questions: TemplateQuestion[]
  branch_config?: Record<string, unknown>
}

export const TEMPLATE_INDUSTRIES = [
  { key: 'all',        label: '全部',    icon: '📋' },
  { key: 'general',   label: '通用',    icon: '⭐' },
  { key: 'pet',       label: '寵物',    icon: '🐾' },
  { key: 'restaurant',label: '餐飲',    icon: '🍽️' },
  { key: 'ecommerce', label: '電商',    icon: '🛍️' },
  { key: 'saas',      label: 'SaaS',   icon: '🚀' },
  { key: 'education', label: '教育',    icon: '📚' },
  { key: 'hr',        label: '人資',    icon: '👥' },
] as const

export const PLATFORM_TEMPLATES: SurveyTemplateDefinition[] = [
  // ─── 通用 ───────────────────────────────────────────────
  {
    name: 'NPS 淨推薦分數',
    description: '測量顧客對品牌/服務的推薦意願，業界標準 NPS 問卷',
    industry: 'general',
    icon: '⭐',
    tags: ['NPS', '顧客滿意度', '通用'],
    survey_config: {
      title: 'NPS 調查',
      subtitle: '幫助我們持續進步',
      coverTitle: '你願意推薦我們嗎？',
      coverSubtitle: '只需 2 分鐘，告訴我們你的想法',
      startButtonText: '開始填寫',
      doneTitle: '感謝你的回覆！',
      doneSubtitle: '你的意見對我們非常重要',
    },
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '你有多大可能向朋友或同事推薦我們？（0 = 完全不可能，10 = 極有可能）',
        isRequired: true,
        options: Array.from({ length: 11 }, (_, i) => ({
          label: String(i),
          value: String(i),
          emoji: i >= 9 ? '😍' : i >= 7 ? '😊' : i >= 5 ? '😐' : '😞',
        })),
      },
      {
        key: 'q2',
        type: 'text',
        content: '你給這個分數的主要原因是什麼？',
        isRequired: false,
        options: [],
      },
      {
        key: 'q3',
        type: 'text',
        content: '你最希望我們改進什麼？',
        isRequired: false,
        options: [],
      },
    ],
  },
  {
    name: '意見回饋表',
    description: '收集使用者對產品、服務或活動的整體回饋',
    industry: 'general',
    icon: '💬',
    tags: ['意見回饋', '通用', '滿意度'],
    survey_config: {
      title: '意見回饋',
      subtitle: '你的聲音很重要',
      coverTitle: '告訴我們你的想法',
      coverSubtitle: '幫助我們做得更好',
      startButtonText: '開始填寫',
      doneTitle: '謝謝你的回饋！',
      doneSubtitle: '我們會認真參考每一則意見',
    },
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '整體滿意度如何？',
        isRequired: true,
        options: [
          { label: '非常滿意', value: '5', emoji: '😍' },
          { label: '滿意', value: '4', emoji: '😊' },
          { label: '普通', value: '3', emoji: '😐' },
          { label: '不滿意', value: '2', emoji: '😕' },
          { label: '非常不滿意', value: '1', emoji: '😞' },
        ],
      },
      {
        key: 'q2',
        type: 'multiple',
        content: '你最喜歡哪些部分？（可複選）',
        isRequired: false,
        maxSelections: 3,
        options: [
          { label: '操作簡單', value: 'easy', emoji: '✅' },
          { label: '功能豐富', value: 'feature', emoji: '🛠️' },
          { label: '客服優質', value: 'support', emoji: '💬' },
          { label: '價格合理', value: 'price', emoji: '💰' },
          { label: '速度快', value: 'speed', emoji: '⚡' },
        ],
      },
      {
        key: 'q3',
        type: 'text',
        content: '有什麼想對我們說的嗎？',
        isRequired: false,
        options: [],
      },
    ],
  },

  // ─── 餐飲 ───────────────────────────────────────────────
  {
    name: '顧客用餐體驗調查',
    description: '了解顧客對菜色、服務、環境的滿意度',
    industry: 'restaurant',
    icon: '🍽️',
    tags: ['餐飲', '顧客滿意度', '用餐體驗'],
    survey_config: {
      title: '用餐體驗調查',
      subtitle: '讓我們為你做得更好',
      coverTitle: '今天的用餐如何？',
      coverSubtitle: '3 分鐘，分享你的體驗',
      startButtonText: '開始填寫',
      doneTitle: '感謝你的評價！',
      doneSubtitle: '我們會持續提升用餐品質',
    },
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '今天的菜色如何？',
        isRequired: true,
        options: [
          { label: '非常好吃', value: '5', emoji: '😍' },
          { label: '還不錯', value: '4', emoji: '😊' },
          { label: '普通', value: '3', emoji: '😐' },
          { label: '不太好', value: '2', emoji: '😕' },
          { label: '難以下嚥', value: '1', emoji: '😞' },
        ],
      },
      {
        key: 'q2',
        type: 'single',
        content: '服務人員的態度如何？',
        isRequired: true,
        options: [
          { label: '非常親切', value: '5', emoji: '😊' },
          { label: '還算友善', value: '4', emoji: '🙂' },
          { label: '普通', value: '3', emoji: '😐' },
          { label: '態度冷漠', value: '2', emoji: '😕' },
          { label: '非常差', value: '1', emoji: '😠' },
        ],
      },
      {
        key: 'q3',
        type: 'single',
        content: '等待時間是否合理？',
        isRequired: true,
        options: [
          { label: '等待很短，非常滿意', value: 'very_fast', emoji: '⚡' },
          { label: '合理範圍內', value: 'ok', emoji: '✅' },
          { label: '稍長但可接受', value: 'bit_long', emoji: '🙂' },
          { label: '等太久了', value: 'too_long', emoji: '😤' },
        ],
      },
      {
        key: 'q4',
        type: 'text',
        content: '有任何建議或特別想說的嗎？',
        isRequired: false,
        options: [],
      },
    ],
  },

  // ─── 電商 ───────────────────────────────────────────────
  {
    name: '購物體驗調查',
    description: '了解購買流程、物流、商品滿意度',
    industry: 'ecommerce',
    icon: '🛍️',
    tags: ['電商', '購物', '顧客體驗'],
    survey_config: {
      title: '購物體驗調查',
      subtitle: '告訴我們你的購物感受',
      coverTitle: '這次購物如何？',
      coverSubtitle: '幫助我們提升你的購物體驗',
      startButtonText: '開始填寫',
      doneTitle: '感謝評價！',
      doneSubtitle: '你的回饋將讓我們做得更好',
    },
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '商品是否符合你的期待？',
        isRequired: true,
        options: [
          { label: '完全符合，超乎預期', value: 'exceed', emoji: '🎉' },
          { label: '符合', value: 'match', emoji: '✅' },
          { label: '差一點點', value: 'almost', emoji: '🙂' },
          { label: '不符合描述', value: 'mismatch', emoji: '😕' },
        ],
      },
      {
        key: 'q2',
        type: 'single',
        content: '物流配送速度如何？',
        isRequired: true,
        options: [
          { label: '非常快', value: 'very_fast', emoji: '⚡' },
          { label: '正常', value: 'normal', emoji: '✅' },
          { label: '稍慢', value: 'slow', emoji: '🐢' },
          { label: '非常慢', value: 'very_slow', emoji: '😤' },
        ],
      },
      {
        key: 'q3',
        type: 'multiple',
        content: '你是如何發現我們的？（可複選）',
        isRequired: false,
        maxSelections: 3,
        options: [
          { label: 'Google 搜尋', value: 'google', emoji: '🔍' },
          { label: 'Instagram', value: 'ig', emoji: '📸' },
          { label: 'Facebook', value: 'fb', emoji: '👍' },
          { label: '朋友推薦', value: 'friend', emoji: '🤝' },
          { label: '其他網站', value: 'other', emoji: '🌐' },
        ],
      },
      {
        key: 'q4',
        type: 'text',
        content: '任何想補充的意見？',
        isRequired: false,
        options: [],
      },
    ],
  },

  // ─── SaaS ───────────────────────────────────────────────
  {
    name: 'PMF 產品市場適配度',
    description: '測量用戶對產品的黏著度與核心價值感知',
    industry: 'saas',
    icon: '🚀',
    tags: ['SaaS', 'PMF', '產品', '用戶研究'],
    survey_config: {
      title: 'PMF 調查',
      subtitle: '幫助我們找到產品方向',
      coverTitle: '你有多需要這個產品？',
      coverSubtitle: '誠實回答，幫助我們做出更好的產品',
      startButtonText: '開始調查',
      doneTitle: '感謝你的寶貴意見！',
      doneSubtitle: '你的回饋將直接影響產品方向',
    },
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '如果我們的產品明天消失，你會有什麼感受？',
        isRequired: true,
        options: [
          { label: '非常失望，這是我必須用的工具', value: 'very_disappointed', emoji: '😢' },
          { label: '有點失望，但能找到替代品', value: 'disappointed', emoji: '😕' },
          { label: '無所謂，不太影響', value: 'no_impact', emoji: '😐' },
        ],
      },
      {
        key: 'q2',
        type: 'single',
        content: '你最常用我們的哪個功能？',
        isRequired: true,
        options: [
          { label: '數據分析', value: 'analytics', emoji: '📊' },
          { label: 'AI 問卷生成', value: 'ai_gen', emoji: '🤖' },
          { label: 'LINE 整合', value: 'line', emoji: '💬' },
          { label: '報告分享', value: 'share', emoji: '📤' },
          { label: '其他', value: 'other', emoji: '🔧' },
        ],
      },
      {
        key: 'q3',
        type: 'text',
        content: '如果你要向朋友介紹我們，你會怎麼描述這個產品？',
        isRequired: true,
        options: [],
      },
      {
        key: 'q4',
        type: 'text',
        content: '目前最讓你困擾的是什麼？',
        isRequired: false,
        options: [],
      },
    ],
  },

  // ─── 教育 ───────────────────────────────────────────────
  {
    name: '課程滿意度調查',
    description: '收集學員對課程內容、講師、學習效果的評價',
    industry: 'education',
    icon: '📚',
    tags: ['教育', '課程', '學員滿意度'],
    survey_config: {
      title: '課程滿意度調查',
      subtitle: '你的學習體驗如何？',
      coverTitle: '課程結束了，說說你的感受',
      coverSubtitle: '幫助我們打造更好的學習體驗',
      startButtonText: '開始填寫',
      doneTitle: '感謝你的回饋！',
      doneSubtitle: '你的意見將讓課程更加進步',
    },
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '課程內容的實用性如何？',
        isRequired: true,
        options: [
          { label: '非常實用，已經開始應用', value: '5', emoji: '🌟' },
          { label: '實用', value: '4', emoji: '✅' },
          { label: '還可以', value: '3', emoji: '🙂' },
          { label: '不太實用', value: '2', emoji: '😕' },
        ],
      },
      {
        key: 'q2',
        type: 'single',
        content: '講師的教學方式如何？',
        isRequired: true,
        options: [
          { label: '講解清晰，引人入勝', value: 'excellent', emoji: '👏' },
          { label: '清楚易懂', value: 'good', emoji: '✅' },
          { label: '普通', value: 'ok', emoji: '😐' },
          { label: '難以理解', value: 'poor', emoji: '😕' },
        ],
      },
      {
        key: 'q3',
        type: 'multiple',
        content: '課程中你最喜歡哪些部分？（可複選）',
        isRequired: false,
        maxSelections: 3,
        options: [
          { label: '實作練習', value: 'practice', emoji: '💻' },
          { label: '案例分析', value: 'case', emoji: '📋' },
          { label: '小組討論', value: 'group', emoji: '👥' },
          { label: '講師互動', value: 'interaction', emoji: '💬' },
          { label: '課程材料', value: 'material', emoji: '📚' },
        ],
      },
      {
        key: 'q4',
        type: 'text',
        content: '你希望下次課程加入什麼內容？',
        isRequired: false,
        options: [],
      },
    ],
  },

  // ─── 人資 ───────────────────────────────────────────────
  {
    name: '員工滿意度調查',
    description: '了解員工對工作環境、薪酬、管理的滿意度',
    industry: 'hr',
    icon: '👥',
    tags: ['人資', '員工滿意度', '組織文化'],
    survey_config: {
      title: '員工滿意度調查',
      subtitle: '匿名填寫，真實回饋',
      coverTitle: '說說你的工作感受',
      coverSubtitle: '你的意見將幫助改善工作環境',
      startButtonText: '開始填寫',
      doneTitle: '感謝你的參與！',
      doneSubtitle: '所有回答均匿名處理',
    },
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '整體來說，你對現在工作的滿意度如何？',
        isRequired: true,
        options: [
          { label: '非常滿意', value: '5', emoji: '😍' },
          { label: '滿意', value: '4', emoji: '😊' },
          { label: '普通', value: '3', emoji: '😐' },
          { label: '不太滿意', value: '2', emoji: '😕' },
          { label: '非常不滿意', value: '1', emoji: '😞' },
        ],
      },
      {
        key: 'q2',
        type: 'multiple',
        content: '以下哪些是你認為公司做得好的地方？（可複選）',
        isRequired: false,
        maxSelections: 3,
        options: [
          { label: '薪酬福利', value: 'pay', emoji: '💰' },
          { label: '工作環境', value: 'env', emoji: '🏢' },
          { label: '主管領導', value: 'mgmt', emoji: '👤' },
          { label: '團隊氛圍', value: 'team', emoji: '👥' },
          { label: '成長空間', value: 'growth', emoji: '📈' },
          { label: '彈性工時', value: 'flexible', emoji: '🕐' },
        ],
      },
      {
        key: 'q3',
        type: 'single',
        content: '你是否會考慮在公司服務超過 2 年？',
        isRequired: true,
        options: [
          { label: '是，很樂意繼續', value: 'yes', emoji: '✅' },
          { label: '可能，取決於發展', value: 'maybe', emoji: '🤔' },
          { label: '不太確定', value: 'unsure', emoji: '😐' },
          { label: '可能不會', value: 'no', emoji: '😕' },
        ],
      },
      {
        key: 'q4',
        type: 'text',
        content: '你希望公司改善的最重要一件事是什麼？',
        isRequired: false,
        options: [],
      },
    ],
  },

  // ─── 寵物 ───────────────────────────────────────────────
  {
    name: '寵物飼主需求調查',
    description: '了解飼主的養寵習慣、痛點與數位服務需求',
    industry: 'pet',
    icon: '🐾',
    tags: ['寵物', '飼主', '需求研究'],
    survey_config: {
      title: '寵物飼主調查',
      subtitle: '了解你和毛孩的生活',
      coverTitle: '說說你和毛孩的故事',
      coverSubtitle: '幫助我們打造更好的寵物服務',
      startButtonText: '開始填寫',
      doneTitle: '感謝你的分享！',
      doneSubtitle: '你的回饋將讓我們服務更多毛孩',
    },
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '你目前養了幾隻寵物？',
        isRequired: true,
        options: [
          { label: '1 隻', value: '1', emoji: '🐾' },
          { label: '2 隻', value: '2', emoji: '🐾🐾' },
          { label: '3 隻以上', value: '3+', emoji: '🐾🐾🐾' },
          { label: '目前沒有，但有計劃', value: 'planning', emoji: '💭' },
        ],
      },
      {
        key: 'q2',
        type: 'multiple',
        content: '你養的是哪種寵物？（可複選）',
        isRequired: false,
        maxSelections: 5,
        options: [
          { label: '狗', value: 'dog', emoji: '🐕' },
          { label: '貓', value: 'cat', emoji: '🐈' },
          { label: '兔子', value: 'rabbit', emoji: '🐰' },
          { label: '鳥類', value: 'bird', emoji: '🦜' },
          { label: '魚', value: 'fish', emoji: '🐠' },
          { label: '其他', value: 'other', emoji: '🐾' },
        ],
      },
      {
        key: 'q3',
        type: 'multiple',
        content: '養寵物最常遇到的困擾？（可複選，最多 3 項）',
        isRequired: false,
        maxSelections: 3,
        options: [
          { label: '健康/醫療費用高', value: 'health_cost', emoji: '💊' },
          { label: '外出旅行的安置問題', value: 'travel', emoji: '✈️' },
          { label: '找到合適的食品或用品', value: 'product', emoji: '🛒' },
          { label: '行為訓練問題', value: 'training', emoji: '🎓' },
          { label: '記錄成長與回憶', value: 'memory', emoji: '📷' },
          { label: '醫療紀錄管理', value: 'medical', emoji: '📋' },
        ],
      },
      {
        key: 'q4',
        type: 'text',
        content: '如果有一個 App 可以記錄你和毛孩的所有回憶，你最希望它有什麼功能？',
        isRequired: false,
        options: [],
      },
    ],
  },
]
