// 10 爆款問卷模板
// 每個模板包含完整的 questions、quiz_config（人格/性格結果）
// 用於 survey_templates 表的平台預設模板

export interface ViralTemplateQuestion {
  key: string
  type: 'single' | 'multiple' | 'text'
  content: string
  options: Array<{ label: string; value: string; emoji?: string }>
  isRequired: boolean
  route?: string
}

export interface ViralTemplateResult {
  resultKey: string
  name: string
  description: string
  emoji: string
  traits: Record<string, [number, number]>
}

export interface ViralTemplateScoringRule {
  questionKey: string
  optionValue: string
  traitKey: string
  score: number
}

export interface ViralTemplateQuizConfig {
  traits: string[]
  scoringRules: ViralTemplateScoringRule[]
  results: ViralTemplateResult[]
}

export interface ViralTemplate {
  slug: string
  name: string
  description: string
  icon: string
  category: string
  theme: string
  coverTitle: string
  coverSubtitle: string
  doneTitle: string
  doneSubtitle: string
  estimatedMinutes: number
  questions: ViralTemplateQuestion[]
  quizConfig?: ViralTemplateQuizConfig
}

export const VIRAL_TEMPLATES: ViralTemplate[] = [
  // ──────────────────────────────────────────────────────
  // 1. 你在朋友眼中是什麼人？
  // ──────────────────────────────────────────────────────
  {
    slug: 'friend-persona',
    name: '你在朋友眼中是什麼人？',
    description: '朋友眼中的你，和你想的一樣嗎？',
    icon: '🪞',
    category: 'personality',
    theme: 'candy',
    coverTitle: '你在朋友眼中是什麼人？',
    coverSubtitle: '只需 2 分鐘，看看朋友怎麼描述你',
    doneTitle: '你的朋友印象分析完成！',
    doneSubtitle: '分享給朋友，看看他們認不認同',
    estimatedMinutes: 2,
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '朋友需要你的時候，你通常是？',
        options: [
          { label: '第一個出現在現場', value: 'A', emoji: '🏃' },
          { label: '默默在背後支持', value: 'B', emoji: '🤲' },
          { label: '給出一堆實用建議', value: 'C', emoji: '💡' },
          { label: '讓他說完再回應', value: 'D', emoji: '👂' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q2',
        type: 'single',
        content: '聚會中你通常是哪種角色？',
        options: [
          { label: '製造話題的那個', value: 'A', emoji: '🎤' },
          { label: '安靜觀察的那個', value: 'B', emoji: '👀' },
          { label: '逗大家笑的那個', value: 'C', emoji: '😂' },
          { label: '主動介紹大家認識的那個', value: 'D', emoji: '🤝' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q3',
        type: 'single',
        content: '朋友說你最大的優點是？',
        options: [
          { label: '說到做到，超可靠', value: 'A', emoji: '💪' },
          { label: '永遠讓人開心', value: 'C', emoji: '😄' },
          { label: '很有自己的想法', value: 'B', emoji: '🧠' },
          { label: '對人特別溫柔', value: 'D', emoji: '💛' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q4',
        type: 'single',
        content: '你最常收到朋友的哪種訊息？',
        options: [
          { label: '「你怎麼看這件事？」', value: 'B', emoji: '💭' },
          { label: '「最近過得怎樣？」', value: 'D', emoji: '💬' },
          { label: '「你有空一起出去嗎？」', value: 'C', emoji: '🎉' },
          { label: '「這件事我需要你幫忙」', value: 'A', emoji: '🆘' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q5',
        type: 'single',
        content: '朋友形容你，最常用哪個詞？',
        options: [
          { label: '暖心', value: 'D', emoji: '🫶' },
          { label: '搞笑', value: 'C', emoji: '🤣' },
          { label: '神秘', value: 'B', emoji: '🌙' },
          { label: '靠譜', value: 'A', emoji: '✅' },
        ],
        isRequired: true,
        route: 'all',
      },
    ],
    quizConfig: {
      traits: ['warmth', 'humor', 'wisdom', 'mystery'],
      scoringRules: [
        { questionKey: 'q1', optionValue: 'A', traitKey: 'warmth', score: 30 },
        { questionKey: 'q1', optionValue: 'B', traitKey: 'warmth', score: 25 },
        { questionKey: 'q1', optionValue: 'C', traitKey: 'wisdom', score: 30 },
        { questionKey: 'q1', optionValue: 'D', traitKey: 'mystery', score: 25 },
        { questionKey: 'q2', optionValue: 'A', traitKey: 'mystery', score: 20 },
        { questionKey: 'q2', optionValue: 'B', traitKey: 'mystery', score: 35 },
        { questionKey: 'q2', optionValue: 'C', traitKey: 'humor', score: 35 },
        { questionKey: 'q2', optionValue: 'D', traitKey: 'warmth', score: 25 },
        { questionKey: 'q3', optionValue: 'A', traitKey: 'wisdom', score: 25 },
        { questionKey: 'q3', optionValue: 'B', traitKey: 'mystery', score: 25 },
        { questionKey: 'q3', optionValue: 'C', traitKey: 'humor', score: 30 },
        { questionKey: 'q3', optionValue: 'D', traitKey: 'warmth', score: 30 },
        { questionKey: 'q4', optionValue: 'A', traitKey: 'warmth', score: 25 },
        { questionKey: 'q4', optionValue: 'B', traitKey: 'mystery', score: 25 },
        { questionKey: 'q4', optionValue: 'C', traitKey: 'humor', score: 25 },
        { questionKey: 'q4', optionValue: 'D', traitKey: 'wisdom', score: 25 },
        { questionKey: 'q5', optionValue: 'A', traitKey: 'warmth', score: 40 },
        { questionKey: 'q5', optionValue: 'B', traitKey: 'mystery', score: 40 },
        { questionKey: 'q5', optionValue: 'C', traitKey: 'humor', score: 40 },
        { questionKey: 'q5', optionValue: 'D', traitKey: 'wisdom', score: 40 },
      ],
      results: [
        {
          resultKey: 'warmth',
          name: '暖心好友',
          description: '你是那種讓人一靠近就覺得安心的人。朋友難過時，你是第一個出現的。你不一定說最多話，但你的陪伴本身就是答案。',
          emoji: '🫶',
          traits: { warmth: [60, 100], humor: [0, 60], wisdom: [0, 60], mystery: [0, 60] },
        },
        {
          resultKey: 'humor',
          name: '開心果',
          description: '你是群體的電池。你的出現讓氣氛立刻升溫，笑聲也跟著來。大家喜歡你，不只因為你好笑，而是你讓人忘記煩惱。',
          emoji: '😄',
          traits: { humor: [60, 100], warmth: [0, 60], wisdom: [0, 60], mystery: [0, 60] },
        },
        {
          resultKey: 'wisdom',
          name: '智囊',
          description: '大家有問題都找你。你的分析清晰，建議務實，不說廢話。朋友不一定說出口，但心裡都知道：有你在，事情搞得定。',
          emoji: '🧠',
          traits: { wisdom: [60, 100], warmth: [0, 60], humor: [0, 60], mystery: [0, 60] },
        },
        {
          resultKey: 'mystery',
          name: '神秘感',
          description: '你讓人想多了解你，卻又不容易完全看透。你說的話不多，但每句都有分量。朋友覺得和你在一起總能看到不一樣的視角。',
          emoji: '🌙',
          traits: { mystery: [60, 100], warmth: [0, 60], humor: [0, 60], wisdom: [0, 60] },
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────
  // 2. 你的戀愛人格
  // ──────────────────────────────────────────────────────
  {
    slug: 'love-personality',
    name: '你的戀愛人格',
    description: '浪漫派還是理性派？3 分鐘測出你的戀愛風格',
    icon: '💕',
    category: 'relationship',
    theme: 'sakura',
    coverTitle: '你的戀愛人格是什麼？',
    coverSubtitle: '了解自己的愛情模式，找到最適合的相處方式',
    doneTitle: '你的戀愛人格揭曉！',
    doneSubtitle: '分享給另一半，看看你們的戀愛人格合不合拍',
    estimatedMinutes: 3,
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '剛開始喜歡一個人，你的第一反應是？',
        options: [
          { label: '腦海裡不斷回放他說的話', value: 'romantic', emoji: '💭' },
          { label: '分析這段關係是否值得發展', value: 'rational', emoji: '📊' },
          { label: '繼續做自己，順其自然', value: 'independent', emoji: '🌿' },
          { label: '想默默保護他、照顧他', value: 'guardian', emoji: '🛡️' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q2',
        type: 'single',
        content: '你理想中的約會是？',
        options: [
          { label: '燭光晚餐，氣氛滿分', value: 'romantic', emoji: '🕯️' },
          { label: '有主題的活動，避免尷尬', value: 'rational', emoji: '🎯' },
          { label: '各自做自己的事，旁邊有人就好', value: 'independent', emoji: '📖' },
          { label: '一起在家，煮飯看電影', value: 'guardian', emoji: '🏠' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q3',
        type: 'single',
        content: '兩個人發生爭執，你的反應是？',
        options: [
          { label: '情緒化，很難立刻冷靜', value: 'romantic', emoji: '😭' },
          { label: '想馬上講清楚、分析問題', value: 'rational', emoji: '🗣️' },
          { label: '需要一點空間冷靜一下', value: 'independent', emoji: '🚶' },
          { label: '先讓步，等他情緒平復', value: 'guardian', emoji: '🤝' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q4',
        type: 'single',
        content: '你最想從感情中得到什麼？',
        options: [
          { label: '強烈的情感連結和浪漫感', value: 'romantic', emoji: '❤️‍🔥' },
          { label: '穩定的未來和共同目標', value: 'rational', emoji: '🎯' },
          { label: '彼此獨立又互相尊重', value: 'independent', emoji: '🕊️' },
          { label: '有人需要我、讓我有被需要的感覺', value: 'guardian', emoji: '🌻' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q5',
        type: 'single',
        content: '你會嫉妒嗎？',
        options: [
          { label: '常常，而且會直說', value: 'romantic', emoji: '🌋' },
          { label: '偶爾，但會先問清楚', value: 'rational', emoji: '❓' },
          { label: '幾乎不會，我相信他', value: 'independent', emoji: '😌' },
          { label: '會，但我會先壓下去', value: 'guardian', emoji: '🫷' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q6',
        type: 'single',
        content: '對方一整天沒回訊息，你的感受是？',
        options: [
          { label: '很擔心，一直在想出了什麼事', value: 'romantic', emoji: '😰' },
          { label: '等到晚上，直接問他怎麼了', value: 'rational', emoji: '📱' },
          { label: '沒差，我自己也很忙', value: 'independent', emoji: '🤷' },
          { label: '擔心，默默傳一則「你還好嗎」', value: 'guardian', emoji: '💌' },
        ],
        isRequired: true,
        route: 'all',
      },
    ],
    quizConfig: {
      traits: ['romantic', 'rational', 'independent', 'guardian'],
      scoringRules: [
        ...['q1','q2','q3','q4','q5','q6'].flatMap(q => [
          { questionKey: q, optionValue: 'romantic', traitKey: 'romantic', score: 25 },
          { questionKey: q, optionValue: 'rational', traitKey: 'rational', score: 25 },
          { questionKey: q, optionValue: 'independent', traitKey: 'independent', score: 25 },
          { questionKey: q, optionValue: 'guardian', traitKey: 'guardian', score: 25 },
        ]),
      ],
      results: [
        {
          resultKey: 'romantic',
          name: '浪漫派',
          description: '你用全心全意愛一個人。感情對你來說是生命中很重要的一部分。你渴望深刻的情感連結，喜歡製造驚喜和浪漫時刻。',
          emoji: '❤️‍🔥',
          traits: { romantic: [50, 100], rational: [0, 50], independent: [0, 50], guardian: [0, 50] },
        },
        {
          resultKey: 'rational',
          name: '理性派',
          description: '你的愛情建立在理解和信任上。你不排斥浪漫，但更相信穩定和溝通。對方知道你愛他，因為你展示在行動裡。',
          emoji: '🧩',
          traits: { rational: [50, 100], romantic: [0, 50], independent: [0, 50], guardian: [0, 50] },
        },
        {
          resultKey: 'independent',
          name: '獨立派',
          description: '你愛得自由。你重視彼此的空間，不喜歡太黏。你的愛方式是：讓對方成為更好的自己，而不是把他留在身邊。',
          emoji: '🕊️',
          traits: { independent: [50, 100], romantic: [0, 50], rational: [0, 50], guardian: [0, 50] },
        },
        {
          resultKey: 'guardian',
          name: '守護派',
          description: '你把愛轉化成行動。你最大的滿足感來自照顧對方、讓他感到安全。你不善言辭，但你的付出是最真實的。',
          emoji: '🛡️',
          traits: { guardian: [50, 100], romantic: [0, 50], rational: [0, 50], independent: [0, 50] },
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────
  // 3. 你是哪種動物？
  // ──────────────────────────────────────────────────────
  {
    slug: 'spirit-animal',
    name: '你是哪種動物？',
    description: '最低門檻的人格測試，5 題揭曉你的精神動物',
    icon: '🐾',
    category: 'personality',
    theme: 'forest',
    coverTitle: '你的精神動物是什麼？',
    coverSubtitle: '5 個問題，找出跟你最像的動物',
    doneTitle: '你的精神動物揭曉！',
    doneSubtitle: '分享給朋友，看看他們是什麼動物',
    estimatedMinutes: 2,
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '你最喜歡的生活節奏是？',
        options: [
          { label: '衝快點，把握每一天', value: 'lion', emoji: '⚡' },
          { label: '有計劃，按部就班', value: 'owl', emoji: '📋' },
          { label: '隨性，走一步算一步', value: 'fox', emoji: '🌀' },
          { label: '輕鬆，只要開心就好', value: 'panda', emoji: '😌' },
          { label: '自由，去任何想去的地方', value: 'dolphin', emoji: '🌊' },
          { label: '目標導向，達成後再說', value: 'eagle', emoji: '🎯' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q2',
        type: 'single',
        content: '面對挑戰時，你通常？',
        options: [
          { label: '直接衝上去，邊做邊學', value: 'lion', emoji: '🦁' },
          { label: '先研究清楚再行動', value: 'owl', emoji: '🦉' },
          { label: '找到最聰明的路走', value: 'fox', emoji: '🦊' },
          { label: '能避就避，和為貴', value: 'panda', emoji: '🐼' },
          { label: '找夥伴一起面對', value: 'dolphin', emoji: '🐬' },
          { label: '從高處看清全局再決定', value: 'eagle', emoji: '🦅' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q3',
        type: 'single',
        content: '朋友眼中的你是？',
        options: [
          { label: '充滿活力，很有領導力', value: 'lion', emoji: '👑' },
          { label: '博學多聞，很有智慧', value: 'owl', emoji: '📚' },
          { label: '聰明機靈，反應快', value: 'fox', emoji: '🧠' },
          { label: '溫柔可愛，不愛計較', value: 'panda', emoji: '🥰' },
          { label: '開朗活潑，善於社交', value: 'dolphin', emoji: '🎉' },
          { label: '有遠見，看問題很準', value: 'eagle', emoji: '🔭' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q4',
        type: 'single',
        content: '你的理想環境是？',
        options: [
          { label: '廣大草原，我是王者', value: 'lion', emoji: '🌅' },
          { label: '安靜書房，獨自思考', value: 'owl', emoji: '🌙' },
          { label: '森林小徑，暗中觀察', value: 'fox', emoji: '🌲' },
          { label: '竹林小屋，悠閒自在', value: 'panda', emoji: '🎋' },
          { label: '蔚藍大海，自由探索', value: 'dolphin', emoji: '🌊' },
          { label: '山頂制高點，俯瞰全局', value: 'eagle', emoji: '🏔️' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q5',
        type: 'single',
        content: '你最大的動力來源是？',
        options: [
          { label: '被別人需要、被尊重', value: 'lion', emoji: '🏆' },
          { label: '不斷學習和理解世界', value: 'owl', emoji: '💡' },
          { label: '解決別人解決不了的問題', value: 'fox', emoji: '🎪' },
          { label: '平靜快樂，少一點壓力', value: 'panda', emoji: '☮️' },
          { label: '連結人與人，讓大家一起快樂', value: 'dolphin', emoji: '🤗' },
          { label: '實現遠大目標，留下影響力', value: 'eagle', emoji: '🚀' },
        ],
        isRequired: true,
        route: 'all',
      },
    ],
    quizConfig: {
      traits: ['lion', 'owl', 'fox', 'panda', 'dolphin', 'eagle'],
      scoringRules: [
        ...['q1','q2','q3','q4','q5'].flatMap(q => [
          { questionKey: q, optionValue: 'lion', traitKey: 'lion', score: 20 },
          { questionKey: q, optionValue: 'owl', traitKey: 'owl', score: 20 },
          { questionKey: q, optionValue: 'fox', traitKey: 'fox', score: 20 },
          { questionKey: q, optionValue: 'panda', traitKey: 'panda', score: 20 },
          { questionKey: q, optionValue: 'dolphin', traitKey: 'dolphin', score: 20 },
          { questionKey: q, optionValue: 'eagle', traitKey: 'eagle', score: 20 },
        ]),
      ],
      results: [
        { resultKey: 'lion', name: '獅子', description: '你天生就是領袖。充滿活力和自信，面對困難毫不退縮。你的存在讓身邊的人感到安心和力量。', emoji: '🦁', traits: { lion: [40, 100] } },
        { resultKey: 'owl', name: '貓頭鷹', description: '你是智者。觀察力敏銳，思考深刻。在做決定前會收集所有資訊。你的建議往往一針見血。', emoji: '🦉', traits: { owl: [40, 100] } },
        { resultKey: 'fox', name: '狐狸', description: '你聰明機靈，擅長找到最省力的方式達成目標。有一種讓人捉摸不透的魅力，卻又真誠待人。', emoji: '🦊', traits: { fox: [40, 100] } },
        { resultKey: 'panda', name: '熊貓', description: '你溫柔可愛，讓人一靠近就想保護你。你不愛爭，但你的存在本身就是一種療癒。', emoji: '🐼', traits: { panda: [40, 100] } },
        { resultKey: 'dolphin', name: '海豚', description: '你開朗活潑，最享受和別人在一起的時光。你的笑聲有感染力，走到哪裡都能帶來歡樂。', emoji: '🐬', traits: { dolphin: [40, 100] } },
        { resultKey: 'eagle', name: '老鷹', description: '你有遠見，目標明確。你不急，但你知道自己要去哪裡。旁人可能低估你，直到你飛起來。', emoji: '🦅', traits: { eagle: [40, 100] } },
      ],
    },
  },

  // ──────────────────────────────────────────────────────
  // 4. 你的未來人生路線
  // ──────────────────────────────────────────────────────
  {
    slug: 'life-path',
    name: '你的未來人生路線',
    description: '自由探索者 vs 穩定建造者，你屬於哪條路？',
    icon: '🔮',
    category: 'lifestyle',
    theme: 'cyber',
    coverTitle: '你的未來人生路線',
    coverSubtitle: '選擇和你最像的答案，找出你的人生軌跡',
    doneTitle: '你的人生路線揭曉！',
    doneSubtitle: '也許這就是你一直在尋找的答案',
    estimatedMinutes: 3,
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '面對未來，你的心態是？',
        options: [
          { label: '充滿未知才有趣，走著看', value: 'explorer', emoji: '🌍' },
          { label: '先打好基礎，再一步步往上', value: 'builder', emoji: '🏗️' },
          { label: '找到還沒人做的事來突破', value: 'innovator', emoji: '💥' },
          { label: '和重要的人一起，去哪都好', value: 'connector', emoji: '🤝' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q2',
        type: 'single',
        content: '你最嚮往的工作方式是？',
        options: [
          { label: '不綁死在一個地方，能遠端就遠端', value: 'explorer', emoji: '💻' },
          { label: '有明確職涯階梯可以爬', value: 'builder', emoji: '📈' },
          { label: '做自己的事業，說了算', value: 'innovator', emoji: '🚀' },
          { label: '能影響到很多人、有溫度的工作', value: 'connector', emoji: '💛' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q3',
        type: 'single',
        content: '你的理想生活是？',
        options: [
          { label: '30 歲前去 5 個不同城市住過', value: 'explorer', emoji: '✈️' },
          { label: '40 歲前買好房子，家庭穩定', value: 'builder', emoji: '🏡' },
          { label: '做出一件讓世界不一樣的事', value: 'innovator', emoji: '🌟' },
          { label: '有一群很深的朋友，一起變老', value: 'connector', emoji: '👥' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q4',
        type: 'single',
        content: '你對金錢的態度是？',
        options: [
          { label: '夠用就好，重要的是體驗', value: 'explorer', emoji: '🎒' },
          { label: '要有足夠儲蓄，才有安全感', value: 'builder', emoji: '🏦' },
          { label: '投資在自己的夢想上', value: 'innovator', emoji: '💡' },
          { label: '分享出去才有意義', value: 'connector', emoji: '🎁' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q5',
        type: 'single',
        content: '你最怕的事是？',
        options: [
          { label: '被困在一個地方出不去', value: 'explorer', emoji: '⛓️' },
          { label: '到老了還沒有穩定的根基', value: 'builder', emoji: '😰' },
          { label: '一輩子都在做別人定的事', value: 'innovator', emoji: '😤' },
          { label: '孤獨，沒有人真正了解我', value: 'connector', emoji: '💔' },
        ],
        isRequired: true,
        route: 'all',
      },
    ],
    quizConfig: {
      traits: ['explorer', 'builder', 'innovator', 'connector'],
      scoringRules: [
        ...['q1','q2','q3','q4','q5'].flatMap(q => [
          { questionKey: q, optionValue: 'explorer', traitKey: 'explorer', score: 25 },
          { questionKey: q, optionValue: 'builder', traitKey: 'builder', score: 25 },
          { questionKey: q, optionValue: 'innovator', traitKey: 'innovator', score: 25 },
          { questionKey: q, optionValue: 'connector', traitKey: 'connector', score: 25 },
        ]),
      ],
      results: [
        { resultKey: 'explorer', name: '自由探索者', description: '你的人生是一場旅程，不是一份計劃。你相信最好的事情往往在計劃之外。邊走邊看，是你的生存哲學。', emoji: '🌍', traits: { explorer: [50, 100] } },
        { resultKey: 'builder', name: '穩定建造者', description: '你相信累積的力量。一磚一瓦，慢慢建起自己的王國。別人看到的結果，是你看不見的努力堆出來的。', emoji: '🏗️', traits: { builder: [50, 100] } },
        { resultKey: 'innovator', name: '創新突破者', description: '你不滿足於現狀。你看世界的方式就是不斷問「為什麼不能這樣？」然後去做。你的人生將改變某些人的生命。', emoji: '💥', traits: { innovator: [50, 100] } },
        { resultKey: 'connector', name: '深度連結者', description: '你的人生核心是關係。你擅長讓不同的人感到被看見、被接納。你留下的不是作品，而是記憶。', emoji: '🤝', traits: { connector: [50, 100] } },
      ],
    },
  },

  // ──────────────────────────────────────────────────────
  // 5. 你在職場的角色
  // ──────────────────────────────────────────────────────
  {
    slug: 'workplace-role',
    name: '你在職場的角色',
    description: '領導者/執行者/創意人/協調者，你是哪種？',
    icon: '💼',
    category: 'lifestyle',
    theme: 'default',
    coverTitle: '你在職場扮演什麼角色？',
    coverSubtitle: '了解自己的工作風格，找到最適合的職場定位',
    doneTitle: '你的職場人格揭曉！',
    doneSubtitle: '分享給同事或主管，讓他們更了解你',
    estimatedMinutes: 3,
    questions: [
      {
        key: 'q1',
        type: 'single',
        content: '開會時，你最常做的事是？',
        options: [
          { label: '主導討論方向', value: 'leader', emoji: '🎯' },
          { label: '認真記錄和整理', value: 'executor', emoji: '📝' },
          { label: '提出新的可能性', value: 'creative', emoji: '💡' },
          { label: '確保大家都有機會說話', value: 'coordinator', emoji: '🤝' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q2',
        type: 'single',
        content: '接到一個新任務，你第一步是？',
        options: [
          { label: '確定目標和時程，分配工作', value: 'leader', emoji: '📊' },
          { label: '列出清單，確認所有細節', value: 'executor', emoji: '✅' },
          { label: '腦力激盪，想各種做法', value: 'creative', emoji: '🧠' },
          { label: '問清楚各方需求，再決定方向', value: 'coordinator', emoji: '❓' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q3',
        type: 'single',
        content: '遇到團隊衝突，你會？',
        options: [
          { label: '直接決定方向，讓大家照做', value: 'leader', emoji: '⚡' },
          { label: '先確認各方立場，分析利弊', value: 'executor', emoji: '⚖️' },
          { label: '提出創意解方，化解對立', value: 'creative', emoji: '🌈' },
          { label: '協調各方，讓大家達成共識', value: 'coordinator', emoji: '🕊️' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q4',
        type: 'single',
        content: '你最有成就感的瞬間是？',
        options: [
          { label: '帶領團隊完成艱難目標', value: 'leader', emoji: '🏆' },
          { label: '把複雜的事情做得零失誤', value: 'executor', emoji: '💯' },
          { label: '想出一個全新的解決方案', value: 'creative', emoji: '✨' },
          { label: '讓一個卡關的團隊重新運轉', value: 'coordinator', emoji: '⚙️' },
        ],
        isRequired: true,
        route: 'all',
      },
      {
        key: 'q5',
        type: 'single',
        content: '你最不喜歡的工作環境是？',
        options: [
          { label: '沒有人聽我的意見', value: 'leader', emoji: '😤' },
          { label: '一直改方向，沒有規則', value: 'executor', emoji: '😵' },
          { label: '照本宣科，沒有發揮空間', value: 'creative', emoji: '🥱' },
          { label: '各做各的，沒有溝通', value: 'coordinator', emoji: '😟' },
        ],
        isRequired: true,
        route: 'all',
      },
    ],
    quizConfig: {
      traits: ['leader', 'executor', 'creative', 'coordinator'],
      scoringRules: [
        ...['q1','q2','q3','q4','q5'].flatMap(q => [
          { questionKey: q, optionValue: 'leader', traitKey: 'leader', score: 25 },
          { questionKey: q, optionValue: 'executor', traitKey: 'executor', score: 25 },
          { questionKey: q, optionValue: 'creative', traitKey: 'creative', score: 25 },
          { questionKey: q, optionValue: 'coordinator', traitKey: 'coordinator', score: 25 },
        ]),
      ],
      results: [
        { resultKey: 'leader', name: '領導者', description: '你天生就該站在前面。你看到目標就想帶人往那個方向走。最好的你，在挑戰最大的時候出現。', emoji: '👑', traits: { leader: [50, 100] } },
        { resultKey: 'executor', name: '執行者', description: '你是讓事情真正發生的人。沒有你，再好的計劃都只是空話。你的細心和可靠是團隊的基石。', emoji: '⚙️', traits: { executor: [50, 100] } },
        { resultKey: 'creative', name: '創意人', description: '你是團隊的新鮮空氣。當大家被困在框框裡，你總能看到框框外的可能性。', emoji: '💡', traits: { creative: [50, 100] } },
        { resultKey: 'coordinator', name: '協調者', description: '你是讓齒輪順暢運轉的潤滑油。你能感受每個人的需求，讓不同個性的人一起往同一個方向走。', emoji: '🤝', traits: { coordinator: [50, 100] } },
      ],
    },
  },

  // ──────────────────────────────────────────────────────
  // 6. 情侶默契測驗
  // ──────────────────────────────────────────────────────
  {
    slug: 'couple-compatibility',
    name: '情侶默契測驗',
    description: '和另一半一起測，看看你們的默契有幾分！',
    icon: '💑',
    category: 'relationship',
    theme: 'sakura',
    coverTitle: '情侶默契大測試',
    coverSubtitle: '一起做，看看你們的默契到底有幾分',
    doneTitle: '測驗完成！',
    doneSubtitle: '把這個傳給另一半一起做，比較答案！',
    estimatedMinutes: 3,
    questions: [
      { key: 'q1', type: 'single', content: '你們通常誰先說「我愛你」？', options: [{ label: '我', value: 'me', emoji: '😊' }, { label: '他/她', value: 'them', emoji: '😍' }, { label: '差不多同時', value: 'same', emoji: '💕' }, { label: '很少說出口', value: 'rarely', emoji: '🤭' }], isRequired: true, route: 'all' },
      { key: 'q2', type: 'single', content: '吵架後，通常誰先道歉？', options: [{ label: '我', value: 'me', emoji: '😅' }, { label: '他/她', value: 'them', emoji: '🥺' }, { label: '互相', value: 'both', emoji: '🤝' }, { label: '冷戰一陣子後自然和好', value: 'natural', emoji: '⏳' }], isRequired: true, route: 'all' },
      { key: 'q3', type: 'single', content: '你們最常的約會模式是？', options: [{ label: '在家追劇宅著', value: 'home', emoji: '🛋️' }, { label: '出門吃東西逛逛', value: 'outside', emoji: '🍽️' }, { label: '一起運動或戶外活動', value: 'active', emoji: '🏃' }, { label: '各自做事，但在一起', value: 'parallel', emoji: '📱' }], isRequired: true, route: 'all' },
      { key: 'q4', type: 'single', content: '你們的訊息頻率是？', options: [{ label: '幾乎不間斷', value: 'constant', emoji: '💬' }, { label: '想到就傳', value: 'casual', emoji: '💭' }, { label: '早晚固定聯絡', value: 'scheduled', emoji: '⏰' }, { label: '見面比傳訊息重要', value: 'inperson', emoji: '🤗' }], isRequired: true, route: 'all' },
      { key: 'q5', type: 'single', content: '對方最讓你感動的是？', options: [{ label: '記得我說過的小事', value: 'memory', emoji: '🧠' }, { label: '在我最差的時候還在', value: 'loyalty', emoji: '💪' }, { label: '讓我做自己', value: 'freedom', emoji: '🌿' }, { label: '每次都能讓我笑', value: 'joy', emoji: '😄' }], isRequired: true, route: 'all' },
      { key: 'q6', type: 'single', content: '你們在一起最像什麼搭檔？', options: [{ label: '互補型：截長補短', value: 'complement', emoji: '🧩' }, { label: '同類型：超有默契', value: 'similar', emoji: '👯' }, { label: '老夫老妻：安穩踏實', value: 'stable', emoji: '🏠' }, { label: '永遠有驚喜：不無聊', value: 'exciting', emoji: '🎊' }], isRequired: true, route: 'all' },
    ],
  },

  // ──────────────────────────────────────────────────────
  // 7. 你的人生價值觀
  // ──────────────────────────────────────────────────────
  {
    slug: 'life-values',
    name: '你的人生價值觀',
    description: '自由、愛、成就、還是意義？找出你最在乎的事',
    icon: '🧭',
    category: 'lifestyle',
    theme: 'ancient',
    coverTitle: '你的人生最重視什麼？',
    coverSubtitle: '6 個選擇，找出你的核心價值觀',
    doneTitle: '你的核心價值觀揭曉！',
    doneSubtitle: '了解自己，才能做出不後悔的選擇',
    estimatedMinutes: 3,
    questions: [
      { key: 'q1', type: 'single', content: '如果只能選一個，你最想要哪種人生？', options: [{ label: '隨心所欲、不受限制的自由', value: 'freedom', emoji: '🕊️' }, { label: '被人深愛、深愛他人', value: 'love', emoji: '❤️' }, { label: '做出讓世界驚嘆的成就', value: 'achievement', emoji: '🏆' }, { label: '活得有意義，幫助了別人', value: 'meaning', emoji: '🌱' }], isRequired: true, route: 'all' },
      { key: 'q2', type: 'single', content: '你最不能忍受哪種狀態？', options: [{ label: '被困住，沒有選擇', value: 'freedom', emoji: '⛓️' }, { label: '孤單，沒人理解我', value: 'love', emoji: '💔' }, { label: '平庸，一事無成', value: 'achievement', emoji: '📉' }, { label: '虛度，沒有留下什麼', value: 'meaning', emoji: '🌫️' }], isRequired: true, route: 'all' },
      { key: 'q3', type: 'single', content: '你最引以為傲的時刻通常是？', options: [{ label: '我做了別人認為不可能的決定', value: 'freedom', emoji: '💪' }, { label: '有人說「有你在真好」', value: 'love', emoji: '🥹' }, { label: '站在台上被人鼓掌', value: 'achievement', emoji: '👏' }, { label: '某個人因為我變得更好了', value: 'meaning', emoji: '🌟' }], isRequired: true, route: 'all' },
      { key: 'q4', type: 'single', content: '給你一大筆錢，你最想做的是？', options: [{ label: '環遊世界，想去哪就去哪', value: 'freedom', emoji: '✈️' }, { label: '用在家人或另一半身上', value: 'love', emoji: '🎁' }, { label: '投資自己，追求更高目標', value: 'achievement', emoji: '📈' }, { label: '捐出去，做有意義的事', value: 'meaning', emoji: '💛' }], isRequired: true, route: 'all' },
      { key: 'q5', type: 'single', content: '老了之後，你希望別人怎麼記住你？', options: [{ label: '那個活得最精彩的人', value: 'freedom', emoji: '🎭' }, { label: '那個讓人感到被愛的人', value: 'love', emoji: '🫂' }, { label: '那個做到別人沒做到的事的人', value: 'achievement', emoji: '🏅' }, { label: '那個改變了別人人生的人', value: 'meaning', emoji: '🌍' }], isRequired: true, route: 'all' },
    ],
    quizConfig: {
      traits: ['freedom', 'love', 'achievement', 'meaning'],
      scoringRules: [
        ...['q1','q2','q3','q4','q5'].flatMap(q => [
          { questionKey: q, optionValue: 'freedom', traitKey: 'freedom', score: 25 },
          { questionKey: q, optionValue: 'love', traitKey: 'love', score: 25 },
          { questionKey: q, optionValue: 'achievement', traitKey: 'achievement', score: 25 },
          { questionKey: q, optionValue: 'meaning', traitKey: 'meaning', score: 25 },
        ]),
      ],
      results: [
        { resultKey: 'freedom', name: '自由是我的答案', description: '對你來說，失去自由就失去一切。你的人生哲學是：寧可少一點安全感，也要活得是自己。', emoji: '🕊️', traits: { freedom: [50, 100] } },
        { resultKey: 'love', name: '愛是我的答案', description: '你的人生以關係為核心。你相信深刻的連結是最珍貴的東西，有愛，其他都可以面對。', emoji: '❤️', traits: { love: [50, 100] } },
        { resultKey: 'achievement', name: '成就是我的答案', description: '你有強烈的驅動力，想證明自己，想突破極限。你的人生觀：做到讓自己驕傲。', emoji: '🏆', traits: { achievement: [50, 100] } },
        { resultKey: 'meaning', name: '意義是我的答案', description: '你不只是為自己活。你需要感受到自己的存在對別人有影響，有了意義，才有動力走下去。', emoji: '🌱', traits: { meaning: [50, 100] } },
      ],
    },
  },

  // ──────────────────────────────────────────────────────
  // 8. 你的隱藏天賦
  // ──────────────────────────────────────────────────────
  {
    slug: 'hidden-talent',
    name: '你的隱藏天賦',
    description: '你還不知道自己有這個天賦！',
    icon: '✨',
    category: 'personality',
    theme: 'game',
    coverTitle: '你的隱藏天賦是什麼？',
    coverSubtitle: '6 題揭曉你可能從未發現的天賦',
    doneTitle: '你的隱藏天賦揭曉！',
    doneSubtitle: '也許是時候讓世界看見你的天賦了',
    estimatedMinutes: 2,
    questions: [
      { key: 'q1', type: 'single', content: '你最享受哪種類型的活動？', options: [{ label: '寫作、說話、表達想法', value: 'verbal', emoji: '✍️' }, { label: '畫畫、攝影、設計', value: 'visual', emoji: '🎨' }, { label: '唱歌、聽音樂、節奏感', value: 'musical', emoji: '🎵' }, { label: '邏輯推理、解題、數字', value: 'logical', emoji: '🔢' }, { label: '和人聊天、了解別人', value: 'interpersonal', emoji: '💬' }, { label: '運動、手作、身體協調', value: 'bodily', emoji: '🏃' }], isRequired: true, route: 'all' },
      { key: 'q2', type: 'single', content: '你小時候最常被稱讚什麼？', options: [{ label: '很會說故事、表達清楚', value: 'verbal', emoji: '🗣️' }, { label: '眼光好、很有美感', value: 'visual', emoji: '👁️' }, { label: '唱歌好聽、很有節奏感', value: 'musical', emoji: '🎤' }, { label: '腦筋好、學東西快', value: 'logical', emoji: '🧩' }, { label: '很貼心、懂得察言觀色', value: 'interpersonal', emoji: '🥰' }, { label: '手很巧、運動神經好', value: 'bodily', emoji: '🙌' }], isRequired: true, route: 'all' },
      { key: 'q3', type: 'single', content: '你覺得自己最擅長哪種思維方式？', options: [{ label: '用故事和比喻解釋複雜的事', value: 'verbal', emoji: '📖' }, { label: '把腦海裡的畫面具體呈現出來', value: 'visual', emoji: '🖼️' }, { label: '感受到節奏和情緒的細微差異', value: 'musical', emoji: '🎼' }, { label: '找規律、建系統、分析因果', value: 'logical', emoji: '📐' }, { label: '感受別人的情緒，知道他需要什麼', value: 'interpersonal', emoji: '🫂' }, { label: '用身體感受和表達想法', value: 'bodily', emoji: '💃' }], isRequired: true, route: 'all' },
      { key: 'q4', type: 'single', content: '你最有可能在哪裡找到靈感？', options: [{ label: '聽一個有趣的故事或演講', value: 'verbal', emoji: '📻' }, { label: '看到一幅畫或一個漂亮的地方', value: 'visual', emoji: '🌅' }, { label: '聽到某首歌的旋律', value: 'musical', emoji: '🎧' }, { label: '看一本邏輯縝密的書', value: 'logical', emoji: '📚' }, { label: '和別人深度對話', value: 'interpersonal', emoji: '☕' }, { label: '動起來：走路、跑步、做事', value: 'bodily', emoji: '🚶' }], isRequired: true, route: 'all' },
      { key: 'q5', type: 'single', content: '如果要你教別人，你最擅長教什麼？', options: [{ label: '怎麼寫出好文章或說清楚一件事', value: 'verbal', emoji: '✒️' }, { label: '怎麼看出設計的美感', value: 'visual', emoji: '🎯' }, { label: '怎麼聽出音樂的細節', value: 'musical', emoji: '🎸' }, { label: '怎麼解決一道難題', value: 'logical', emoji: '🔬' }, { label: '怎麼和別人建立信任', value: 'interpersonal', emoji: '🌿' }, { label: '怎麼做一件需要技巧的事', value: 'bodily', emoji: '🔧' }], isRequired: true, route: 'all' },
    ],
    quizConfig: {
      traits: ['verbal', 'visual', 'musical', 'logical', 'interpersonal', 'bodily'],
      scoringRules: [
        ...['q1','q2','q3','q4','q5'].flatMap(q => [
          { questionKey: q, optionValue: 'verbal', traitKey: 'verbal', score: 20 },
          { questionKey: q, optionValue: 'visual', traitKey: 'visual', score: 20 },
          { questionKey: q, optionValue: 'musical', traitKey: 'musical', score: 20 },
          { questionKey: q, optionValue: 'logical', traitKey: 'logical', score: 20 },
          { questionKey: q, optionValue: 'interpersonal', traitKey: 'interpersonal', score: 20 },
          { questionKey: q, optionValue: 'bodily', traitKey: 'bodily', score: 20 },
        ]),
      ],
      results: [
        { resultKey: 'verbal', name: '語言天才', description: '你天生對語言敏感。你能用最少的話說清楚最複雜的事，也能讓平凡的故事變得動人。寫作、演講、教學——這些都是你的舞台。', emoji: '✍️', traits: { verbal: [40, 100] } },
        { resultKey: 'visual', name: '視覺天才', description: '你用眼睛思考。你能在亂中找到秩序，在平凡中看到美。設計、攝影、藝術——視覺世界是你的語言。', emoji: '🎨', traits: { visual: [40, 100] } },
        { resultKey: 'musical', name: '音樂天才', description: '你對聲音有天然的感應力。你能聽出別人聽不到的細節，感受音樂帶來的情緒波動。這不只是才能，是一種特殊的感知方式。', emoji: '🎵', traits: { musical: [40, 100] } },
        { resultKey: 'logical', name: '邏輯天才', description: '你的腦袋是一台精密的計算機。你能看穿複雜的模式，把混亂整理成清晰的系統。數學、程式、策略——這是你的領域。', emoji: '🔢', traits: { logical: [40, 100] } },
        { resultKey: 'interpersonal', name: '人際天才', description: '你能看透人心。你知道別人在想什麼、需要什麼，而且你知道怎麼讓他們感到被理解。這是最稀缺的天賦之一。', emoji: '💬', traits: { interpersonal: [40, 100] } },
        { resultKey: 'bodily', name: '身體天才', description: '你的天賦藏在你的身體裡。你對動作、手感、節奏有驚人的掌握力。運動、舞蹈、手工藝——你用行動說話。', emoji: '🏃', traits: { bodily: [40, 100] } },
      ],
    },
  },

  // ──────────────────────────────────────────────────────
  // 9. 朋友適合你的程度
  // ──────────────────────────────────────────────────────
  {
    slug: 'friendship-match',
    name: '朋友適合你的程度',
    description: '5 題測出你們的友誼相配度',
    icon: '🤝',
    category: 'relationship',
    theme: 'ocean',
    coverTitle: '你們有多適合做朋友？',
    coverSubtitle: '5 個問題，測出你的友誼風格',
    doneTitle: '你的友誼風格揭曉！',
    doneSubtitle: '把這個傳給你的朋友，看看你們的相配度！',
    estimatedMinutes: 2,
    questions: [
      { key: 'q1', type: 'single', content: '你對友情的期待是？', options: [{ label: '時常聯絡，互相關心', value: 'close', emoji: '📱' }, { label: '不需要常見面，但需要時就在', value: 'steady', emoji: '⚓' }, { label: '一起去冒險和體驗', value: 'adventure', emoji: '🗺️' }, { label: '能深聊，真的懂我', value: 'deep', emoji: '💬' }], isRequired: true, route: 'all' },
      { key: 'q2', type: 'single', content: '好朋友在你心目中最重要的特質是？', options: [{ label: '真誠，不說假話', value: 'deep', emoji: '💎' }, { label: '有趣，在一起不無聊', value: 'adventure', emoji: '🎮' }, { label: '可靠，說到做到', value: 'steady', emoji: '🪨' }, { label: '貼心，懂得關心我', value: 'close', emoji: '🩷' }], isRequired: true, route: 'all' },
      { key: 'q3', type: 'single', content: '朋友難過，你的反應是？', options: [{ label: '馬上出現或打電話', value: 'close', emoji: '🏃' }, { label: '傳訊息關心，讓他知道我在', value: 'steady', emoji: '💌' }, { label: '帶他出去散心', value: 'adventure', emoji: '🌿' }, { label: '陪他說話，說到他好了', value: 'deep', emoji: '🫶' }], isRequired: true, route: 'all' },
      { key: 'q4', type: 'single', content: '你希望朋友怎麼對你？', options: [{ label: '主動找我，讓我知道他記得我', value: 'close', emoji: '🔔' }, { label: '不打擾我，但需要時立刻來', value: 'steady', emoji: '🌊' }, { label: '帶我去新地方、嘗試新事', value: 'adventure', emoji: '🎒' }, { label: '願意聽我說廢話和心裡話', value: 'deep', emoji: '📖' }], isRequired: true, route: 'all' },
      { key: 'q5', type: 'single', content: '你的友情通常是？', options: [{ label: '朋友不多，但很深', value: 'deep', emoji: '💫' }, { label: '認識很多人，跟誰都聊得來', value: 'adventure', emoji: '🎉' }, { label: '幾個固定的老朋友', value: 'steady', emoji: '🌳' }, { label: '只要對上眼，立刻很熟', value: 'close', emoji: '⚡' }], isRequired: true, route: 'all' },
    ],
    quizConfig: {
      traits: ['close', 'steady', 'adventure', 'deep'],
      scoringRules: [
        ...['q1','q2','q3','q4','q5'].flatMap(q => [
          { questionKey: q, optionValue: 'close', traitKey: 'close', score: 25 },
          { questionKey: q, optionValue: 'steady', traitKey: 'steady', score: 25 },
          { questionKey: q, optionValue: 'adventure', traitKey: 'adventure', score: 25 },
          { questionKey: q, optionValue: 'deep', traitKey: 'deep', score: 25 },
        ]),
      ],
      results: [
        { resultKey: 'close', name: '黏著型朋友', description: '你的愛是行動。你喜歡頻繁的互動，讓對方知道你在想他。最適合你的朋友：同樣重視聯絡、不怕被黏的人。', emoji: '🩷', traits: { close: [50, 100] } },
        { resultKey: 'steady', name: '穩定型朋友', description: '你是可以依靠的錨。你不一定常出現，但你一直都在。最適合你的朋友：不需要每天聯絡，但能深信對方不會消失的人。', emoji: '⚓', traits: { steady: [50, 100] } },
        { resultKey: 'adventure', name: '冒險型朋友', description: '你喜歡一起創造回憶。友情對你來說是一段共同的旅程。最適合你的朋友：同樣喜歡新鮮感，一起說走就走的人。', emoji: '🗺️', traits: { adventure: [50, 100] } },
        { resultKey: 'deep', name: '深度型朋友', description: '你寧可一個真的懂你的朋友，也不要一百個點頭之交。最適合你的朋友：願意深聊、不怕被真實面對的人。', emoji: '💫', traits: { deep: [50, 100] } },
      ],
    },
  },

  // ──────────────────────────────────────────────────────
  // 10. 你的壓力應對方式
  // ──────────────────────────────────────────────────────
  {
    slug: 'stress-style',
    name: '你的壓力應對方式',
    description: '行動派？獨處派？測出你的壓力釋放模式',
    icon: '🧘',
    category: 'lifestyle',
    theme: 'noir',
    coverTitle: '你怎麼面對壓力？',
    coverSubtitle: '5 題找出你的壓力應對模式',
    doneTitle: '你的壓力應對風格揭曉！',
    doneSubtitle: '了解自己，是照顧自己的第一步',
    estimatedMinutes: 2,
    questions: [
      { key: 'q1', type: 'single', content: '壓力最大的時候，你第一件想做的事是？', options: [{ label: '開始解決問題，動起來', value: 'action', emoji: '⚡' }, { label: '靜下來想清楚', value: 'thinking', emoji: '💭' }, { label: '找朋友或家人說說', value: 'social', emoji: '🗣️' }, { label: '獨處，需要一點空間', value: 'alone', emoji: '🌙' }], isRequired: true, route: 'all' },
      { key: 'q2', type: 'single', content: '你最有效的紓壓方式是？', options: [{ label: '運動、做家事、或任何身體活動', value: 'action', emoji: '🏋️' }, { label: '寫日記或整理思緒', value: 'thinking', emoji: '📓' }, { label: '和朋友出去吃飯或聊天', value: 'social', emoji: '🍻' }, { label: '一個人看電影或聽音樂', value: 'alone', emoji: '🎧' }], isRequired: true, route: 'all' },
      { key: 'q3', type: 'single', content: '你最不喜歡哪種被關心的方式？', options: [{ label: '叫我冷靜，什麼都不做', value: 'action', emoji: '🚫' }, { label: '不讓我有空間思考', value: 'thinking', emoji: '⛔' }, { label: '叫我自己處理，別找他', value: 'social', emoji: '😤' }, { label: '一直追問怎麼了', value: 'alone', emoji: '😩' }], isRequired: true, route: 'all' },
      { key: 'q4', type: 'single', content: '壓力大的時候，你容易變得？', options: [{ label: '衝動，做事容易出錯', value: 'action', emoji: '💥' }, { label: '鑽牛角尖，想太多', value: 'thinking', emoji: '🌀' }, { label: '急著找人說，停不下來', value: 'social', emoji: '📱' }, { label: '沉默，把自己關起來', value: 'alone', emoji: '🚪' }], isRequired: true, route: 'all' },
      { key: 'q5', type: 'single', content: '壓力過後，你最需要什麼？', options: [{ label: '看到事情解決了的結果', value: 'action', emoji: '✅' }, { label: '搞清楚為什麼，下次改進', value: 'thinking', emoji: '🔍' }, { label: '被朋友說一聲「你很棒」', value: 'social', emoji: '🌟' }, { label: '睡一覺，重新開機', value: 'alone', emoji: '😴' }], isRequired: true, route: 'all' },
    ],
    quizConfig: {
      traits: ['action', 'thinking', 'social', 'alone'],
      scoringRules: [
        ...['q1','q2','q3','q4','q5'].flatMap(q => [
          { questionKey: q, optionValue: 'action', traitKey: 'action', score: 25 },
          { questionKey: q, optionValue: 'thinking', traitKey: 'thinking', score: 25 },
          { questionKey: q, optionValue: 'social', traitKey: 'social', score: 25 },
          { questionKey: q, optionValue: 'alone', traitKey: 'alone', score: 25 },
        ]),
      ],
      results: [
        { resultKey: 'action', name: '行動派', description: '你用行動對抗壓力。停下來讓你更焦慮，動起來才有安全感。你的能量需要出口，問題解決才能真正放鬆。', emoji: '⚡', traits: { action: [50, 100] } },
        { resultKey: 'thinking', name: '思考派', description: '你用理解來化解壓力。你需要先搞懂「為什麼」，才能接受和放下。給自己一點時間，你會找到答案。', emoji: '💭', traits: { thinking: [50, 100] } },
        { resultKey: 'social', name: '社交派', description: '你從連結中找到力量。說出來，讓人理解你，是你的療癒方式。你需要的不一定是建議，只是有人在。', emoji: '🗣️', traits: { social: [50, 100] } },
        { resultKey: 'alone', name: '獨處派', description: '你在安靜中恢復元氣。你需要空間，不被打擾地整理自己。這不是逃避，這是你充電的方式。', emoji: '🌙', traits: { alone: [50, 100] } },
      ],
    },
  },
]

export default VIRAL_TEMPLATES
