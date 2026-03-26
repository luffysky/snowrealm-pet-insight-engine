// ===== 爆款問卷模板定義 =====
// 10 個高傳播性人格/關係/生活風格測驗模板

export interface QuizScoringRule {
  questionKey: string
  optionValue: string
  traitKey: string
  score: number
}

export interface QuizResult {
  resultKey: string
  name: string
  description: string
  emoji: string
  traits: Record<string, [number, number]>
}

export interface QuizConfig {
  traits: string[]
  scoringRules: QuizScoringRule[]
  results: QuizResult[]
}

export interface ViralTemplateQuestion {
  key: string
  type: 'single' | 'multiple' | 'text'
  content: string
  options: Array<{ label: string; value: string; emoji?: string }>
  isRequired: boolean
  route?: string
}

export interface ViralTemplate {
  slug: string
  title: string
  description: string
  icon: string
  category: 'personality' | 'relationship' | 'lifestyle' | 'social'
  theme: string
  coverTitle: string
  coverSubtitle: string
  doneTitle: string
  doneSubtitle: string
  estimatedMinutes: number
  questions: ViralTemplateQuestion[]
  quizConfig?: QuizConfig
}

// ===== Template 1: 你在朋友眼中是什麼人？ =====
const friendPersona: ViralTemplate = {
  slug: 'friend-persona',
  title: '你在朋友眼中是什麼人？',
  description: '透過幾個生活情境，揭開你在朋友心中的真實形象！',
  icon: '👥',
  category: 'social',
  theme: 'candy',
  coverTitle: '你在朋友眼中是什麼人？',
  coverSubtitle: '幾個小問題，揭開你最真實的社交面貌 💫',
  doneTitle: '你的朋友形象揭曉了！',
  doneSubtitle: '分享給朋友，看看他們同不同意？😄',
  estimatedMinutes: 3,
  questions: [
    {
      key: 'q1',
      type: 'single',
      content: '朋友約週末出遊，你通常是？',
      options: [
        { label: '第一個說好、還順手幫大家排行程', value: 'A', emoji: '📋' },
        { label: '笑著說好、但其實有點懶得動', value: 'B', emoji: '😴' },
        { label: '問清楚去哪、幾個人再決定', value: 'C', emoji: '🤔' },
        { label: '說要想想、結果常常臨時取消', value: 'D', emoji: '🙈' },
      ],
      isRequired: true,
    },
    {
      key: 'q2',
      type: 'single',
      content: '朋友遇到感情問題來找你，你的第一反應是？',
      options: [
        { label: '認真聽完、給出分析和建議', value: 'A', emoji: '🧠' },
        { label: '先給大大的擁抱、讓他哭個夠', value: 'B', emoji: '🤗' },
        { label: '幫他想最壞情況怎麼應對', value: 'C', emoji: '💪' },
        { label: '帶他去吃好料轉移注意力', value: 'D', emoji: '🍜' },
      ],
      isRequired: true,
    },
    {
      key: 'q3',
      type: 'single',
      content: '群組裡有人說了個冷笑話，你通常怎麼回應？',
      options: [
        { label: '馬上接梗、越接越歪', value: 'A', emoji: '😂' },
        { label: '傳個笑臉貼圖、默默支持', value: 'B', emoji: '😊' },
        { label: '分析這個笑話的笑點在哪', value: 'C', emoji: '🔍' },
        { label: '沉默是金、繼續滑手機', value: 'D', emoji: '📱' },
      ],
      isRequired: true,
    },
    {
      key: 'q4',
      type: 'single',
      content: '大家要選一家餐廳吃飯，討論了半天沒結果，你會？',
      options: [
        { label: '直接拍板決定一家', value: 'A', emoji: '👊' },
        { label: '說「都好都好」然後跟著走', value: 'B', emoji: '🤷' },
        { label: '列出三個選項讓大家投票', value: 'C', emoji: '📊' },
        { label: '偷偷查 Google 評論再推薦', value: 'D', emoji: '🔎' },
      ],
      isRequired: true,
    },
    {
      key: 'q5',
      type: 'single',
      content: '朋友生日，你送禮的風格是？',
      options: [
        { label: '提前一個月問他想要什麼、用心準備', value: 'A', emoji: '🎁' },
        { label: '傳一段走心的祝福文字比什麼都重要', value: 'B', emoji: '💌' },
        { label: '幾個朋友一起湊錢買一個好的', value: 'C', emoji: '💰' },
        { label: '臨時去便利商店買也沒關係反正心意到了', value: 'D', emoji: '🏪' },
      ],
      isRequired: true,
    },
    {
      key: 'q6',
      type: 'single',
      content: '你覺得自己在朋友圈裡最常扮演什麼角色？',
      options: [
        { label: '帶頭的那個', value: 'A', emoji: '🚀' },
        { label: '說話最好笑的那個', value: 'B', emoji: '🎭' },
        { label: '最冷靜理智的那個', value: 'C', emoji: '🧊' },
        { label: '神秘低調但關鍵時刻都在的那個', value: 'D', emoji: '🌙' },
      ],
      isRequired: true,
    },
  ],
  quizConfig: {
    traits: ['warm', 'funny', 'wise', 'mysterious'],
    scoringRules: [
      { questionKey: 'q1', optionValue: 'A', traitKey: 'warm', score: 2 },
      { questionKey: 'q1', optionValue: 'B', traitKey: 'funny', score: 2 },
      { questionKey: 'q1', optionValue: 'C', traitKey: 'wise', score: 2 },
      { questionKey: 'q1', optionValue: 'D', traitKey: 'mysterious', score: 2 },
      { questionKey: 'q2', optionValue: 'A', traitKey: 'wise', score: 2 },
      { questionKey: 'q2', optionValue: 'B', traitKey: 'warm', score: 2 },
      { questionKey: 'q2', optionValue: 'C', traitKey: 'warm', score: 1 },
      { questionKey: 'q2', optionValue: 'D', traitKey: 'funny', score: 2 },
      { questionKey: 'q3', optionValue: 'A', traitKey: 'funny', score: 3 },
      { questionKey: 'q3', optionValue: 'B', traitKey: 'warm', score: 2 },
      { questionKey: 'q3', optionValue: 'C', traitKey: 'wise', score: 2 },
      { questionKey: 'q3', optionValue: 'D', traitKey: 'mysterious', score: 3 },
      { questionKey: 'q4', optionValue: 'A', traitKey: 'warm', score: 2 },
      { questionKey: 'q4', optionValue: 'B', traitKey: 'funny', score: 1 },
      { questionKey: 'q4', optionValue: 'C', traitKey: 'wise', score: 3 },
      { questionKey: 'q4', optionValue: 'D', traitKey: 'mysterious', score: 2 },
      { questionKey: 'q5', optionValue: 'A', traitKey: 'warm', score: 3 },
      { questionKey: 'q5', optionValue: 'B', traitKey: 'warm', score: 2 },
      { questionKey: 'q5', optionValue: 'C', traitKey: 'wise', score: 2 },
      { questionKey: 'q5', optionValue: 'D', traitKey: 'funny', score: 2 },
      { questionKey: 'q6', optionValue: 'A', traitKey: 'warm', score: 2 },
      { questionKey: 'q6', optionValue: 'B', traitKey: 'funny', score: 3 },
      { questionKey: 'q6', optionValue: 'C', traitKey: 'wise', score: 3 },
      { questionKey: 'q6', optionValue: 'D', traitKey: 'mysterious', score: 3 },
    ],
    results: [
      {
        resultKey: 'warm',
        name: '暖心好友',
        description: '你是那種讓人感到安心的存在。朋友有事第一個想到你，因為你總是用心傾聽、真誠回應。你不是最高調的那個，卻是最不可或缺的那個。',
        emoji: '🌸',
        traits: { warm: [6, 20], funny: [0, 20], wise: [0, 20], mysterious: [0, 20] },
      },
      {
        resultKey: 'funny',
        name: '開心果',
        description: '有你在的地方，氣氛永遠不冷場。你的幽默感是天生的，能在最尷尬的瞬間讓大家笑出來。朋友都說，認識你之後，笑的次數變多了。',
        emoji: '😄',
        traits: { funny: [6, 20], warm: [0, 20], wise: [0, 20], mysterious: [0, 20] },
      },
      {
        resultKey: 'wise',
        name: '智囊',
        description: '遇到難題，大家第一個找的就是你。你邏輯清晰、分析到位，總能看到別人看不到的角度。朋友把你的話當成最可靠的指南針。',
        emoji: '🦉',
        traits: { wise: [6, 20], warm: [0, 20], funny: [0, 20], mysterious: [0, 20] },
      },
      {
        resultKey: 'mysterious',
        name: '神秘感',
        description: '你是朋友圈裡最讓人猜不透的存在。話不多，但每次開口都讓人印象深刻。你有自己的世界，不是所有人都能進來——這反而讓大家更想靠近你。',
        emoji: '🌙',
        traits: { mysterious: [6, 20], warm: [0, 20], funny: [0, 20], wise: [0, 20] },
      },
    ],
  },
}

// ===== Template 2: 你的戀愛人格 =====
const lovePersonality: ViralTemplate = {
  slug: 'love-personality',
  title: '你的戀愛人格',
  description: '在愛情裡，你是哪一種人？浪漫派、理性派還是獨立派？',
  icon: '💕',
  category: 'relationship',
  theme: 'sakura',
  coverTitle: '你的戀愛人格是什麼？',
  coverSubtitle: '幾個問題，揭開你在感情中的真實模樣 🌸',
  doneTitle: '你的戀愛人格揭曉！',
  doneSubtitle: '傳給另一半，看看你們合不合拍？💑',
  estimatedMinutes: 3,
  questions: [
    {
      key: 'q1',
      type: 'single',
      content: '剛開始喜歡一個人，你通常會？',
      options: [
        { label: '腦補各種浪漫的相遇場景', value: 'A', emoji: '🌹' },
        { label: '先觀察對方的生活習慣和價值觀', value: 'B', emoji: '🔍' },
        { label: '若無其事、等對方先表示', value: 'C', emoji: '😌' },
        { label: '想辦法多製造相遇機會', value: 'D', emoji: '🎯' },
      ],
      isRequired: true,
    },
    {
      key: 'q2',
      type: 'single',
      content: '在一段關係裡，最重要的是？',
      options: [
        { label: '心動感覺——沒有怦然心動就沒有意義', value: 'A', emoji: '💓' },
        { label: '相互理解——能溝通才能走長遠', value: 'B', emoji: '🤝' },
        { label: '個人空間——再愛也需要自己的時間', value: 'C', emoji: '🌿' },
        { label: '陪伴守護——在對方最需要時出現', value: 'D', emoji: '🛡️' },
      ],
      isRequired: true,
    },
    {
      key: 'q3',
      type: 'single',
      content: '情人節到了，你期待的慶祝方式是？',
      options: [
        { label: '精心策劃的驚喜，越用心越感動', value: 'A', emoji: '🎁' },
        { label: '安靜地在家煮頓飯、好好聊天', value: 'B', emoji: '🍳' },
        { label: '平常心——每天都是情人節', value: 'C', emoji: '😎' },
        { label: '做對方最想做的事，讓他開心就好', value: 'D', emoji: '🌟' },
      ],
      isRequired: true,
    },
    {
      key: 'q4',
      type: 'single',
      content: '和另一半發生爭吵，你的第一反應是？',
      options: [
        { label: '情緒先爆發、事後再和好，但道歉很真誠', value: 'A', emoji: '🌋' },
        { label: '先冷靜、整理思路再好好討論', value: 'B', emoji: '🧊' },
        { label: '需要一個人靜一靜再談', value: 'C', emoji: '🚶' },
        { label: '不管誰對誰錯、先顧好對方的情緒', value: 'D', emoji: '🤍' },
      ],
      isRequired: true,
    },
    {
      key: 'q5',
      type: 'single',
      content: '如果另一半要出差兩週，你會？',
      options: [
        { label: '每天傳長長的訊息、傾訴思念', value: 'A', emoji: '💌' },
        { label: '約好視訊時間、維持固定聯絡', value: 'B', emoji: '📱' },
        { label: '趁機好好過自己的生活，反而挺自在', value: 'C', emoji: '🌈' },
        { label: '默默幫他/她準備回來後的驚喜', value: 'D', emoji: '🎀' },
      ],
      isRequired: true,
    },
    {
      key: 'q6',
      type: 'single',
      content: '你覺得一段健康的感情應該是？',
      options: [
        { label: '像電影一樣有高低起伏才刺激', value: 'A', emoji: '🎬' },
        { label: '建立在誠實和尊重上的平等關係', value: 'B', emoji: '⚖️' },
        { label: '兩個獨立的人選擇在一起', value: 'C', emoji: '🌸' },
        { label: '彼此都是對方最堅強的後盾', value: 'D', emoji: '🏠' },
      ],
      isRequired: true,
    },
  ],
  quizConfig: {
    traits: ['romantic', 'rational', 'independent', 'guardian'],
    scoringRules: [
      { questionKey: 'q1', optionValue: 'A', traitKey: 'romantic', score: 3 },
      { questionKey: 'q1', optionValue: 'B', traitKey: 'rational', score: 3 },
      { questionKey: 'q1', optionValue: 'C', traitKey: 'independent', score: 3 },
      { questionKey: 'q1', optionValue: 'D', traitKey: 'guardian', score: 2 },
      { questionKey: 'q2', optionValue: 'A', traitKey: 'romantic', score: 3 },
      { questionKey: 'q2', optionValue: 'B', traitKey: 'rational', score: 3 },
      { questionKey: 'q2', optionValue: 'C', traitKey: 'independent', score: 3 },
      { questionKey: 'q2', optionValue: 'D', traitKey: 'guardian', score: 3 },
      { questionKey: 'q3', optionValue: 'A', traitKey: 'romantic', score: 3 },
      { questionKey: 'q3', optionValue: 'B', traitKey: 'rational', score: 2 },
      { questionKey: 'q3', optionValue: 'C', traitKey: 'independent', score: 3 },
      { questionKey: 'q3', optionValue: 'D', traitKey: 'guardian', score: 3 },
      { questionKey: 'q4', optionValue: 'A', traitKey: 'romantic', score: 2 },
      { questionKey: 'q4', optionValue: 'B', traitKey: 'rational', score: 3 },
      { questionKey: 'q4', optionValue: 'C', traitKey: 'independent', score: 3 },
      { questionKey: 'q4', optionValue: 'D', traitKey: 'guardian', score: 3 },
      { questionKey: 'q5', optionValue: 'A', traitKey: 'romantic', score: 3 },
      { questionKey: 'q5', optionValue: 'B', traitKey: 'rational', score: 2 },
      { questionKey: 'q5', optionValue: 'C', traitKey: 'independent', score: 3 },
      { questionKey: 'q5', optionValue: 'D', traitKey: 'guardian', score: 3 },
      { questionKey: 'q6', optionValue: 'A', traitKey: 'romantic', score: 3 },
      { questionKey: 'q6', optionValue: 'B', traitKey: 'rational', score: 3 },
      { questionKey: 'q6', optionValue: 'C', traitKey: 'independent', score: 3 },
      { questionKey: 'q6', optionValue: 'D', traitKey: 'guardian', score: 3 },
    ],
    results: [
      {
        resultKey: 'romantic',
        name: '浪漫派',
        description: '你相信愛情是有魔法的。心動的感覺、浪漫的儀式感、情感的濃度——這些對你來說缺一不可。你的愛很熱烈，讓身邊的人感受到被重視。',
        emoji: '🌹',
        traits: { romantic: [8, 20], rational: [0, 20], independent: [0, 20], guardian: [0, 20] },
      },
      {
        resultKey: 'rational',
        name: '理性派',
        description: '你用腦袋愛人，也用腦袋解決問題。這不代表你不投入，而是你認為真正的愛需要溝通和理解做基礎。你是那種讓感情越走越穩的人。',
        emoji: '🧠',
        traits: { rational: [8, 20], romantic: [0, 20], independent: [0, 20], guardian: [0, 20] },
      },
      {
        resultKey: 'independent',
        name: '獨立派',
        description: '你知道愛一個人不等於失去自己。你在感情裡保持清醒和自我，反而讓關係更健康。你不需要另一半時時刻刻陪著你，因為你本身就是完整的。',
        emoji: '🦋',
        traits: { independent: [8, 20], romantic: [0, 20], rational: [0, 20], guardian: [0, 20] },
      },
      {
        resultKey: 'guardian',
        name: '守護派',
        description: '你是那種默默付出、不求回報的人。你喜歡用行動表達愛，在另一半最需要的時候總是出現。你不一定說很多情話，但你的愛讓人感覺最踏實。',
        emoji: '🛡️',
        traits: { guardian: [8, 20], romantic: [0, 20], rational: [0, 20], independent: [0, 20] },
      },
    ],
  },
}

// ===== Template 3: 你是哪種動物？ =====
const spiritAnimal: ViralTemplate = {
  slug: 'spirit-animal',
  title: '你是哪種動物？',
  description: '你的性格最像哪種動物？5個問題找出你的靈魂動物！',
  icon: '🦊',
  category: 'personality',
  theme: 'forest',
  coverTitle: '你的靈魂動物是？',
  coverSubtitle: '5 個問題，找出隱藏在你內心的動物原型 🌿',
  doneTitle: '你的靈魂動物出現了！',
  doneSubtitle: '快分享給朋友，看看他們同不同意？🐾',
  estimatedMinutes: 2,
  questions: [
    {
      key: 'q1',
      type: 'single',
      content: '突然有一個假期，你最想做的是？',
      options: [
        { label: '去一個從沒去過的地方冒險', value: 'lion', emoji: '🗺️' },
        { label: '在家研究一件感興趣的事', value: 'owl', emoji: '📚' },
        { label: '計劃一個聰明的小旅行', value: 'fox', emoji: '🧳' },
        { label: '找朋友一起窩在某個舒服的地方', value: 'panda', emoji: '🏡' },
        { label: '去海邊或湖邊享受', value: 'dolphin', emoji: '🌊' },
        { label: '獨自爬山或登高', value: 'eagle', emoji: '🏔️' },
      ],
      isRequired: true,
    },
    {
      key: 'q2',
      type: 'single',
      content: '面對挑戰，你的第一反應是？',
      options: [
        { label: '衝！先做再說，邊做邊調整', value: 'lion', emoji: '💥' },
        { label: '先收集所有資訊再行動', value: 'owl', emoji: '🔍' },
        { label: '找到最聰明的突破口', value: 'fox', emoji: '💡' },
        { label: '找朋友討論，集思廣益', value: 'panda', emoji: '🤝' },
        { label: '用直覺感受、相信水到渠成', value: 'dolphin', emoji: '🌊' },
        { label: '從高處俯瞰全局再決定', value: 'eagle', emoji: '🦅' },
      ],
      isRequired: true,
    },
    {
      key: 'q3',
      type: 'single',
      content: '你的朋友會用哪個詞形容你？',
      options: [
        { label: '霸氣、有領導力', value: 'lion', emoji: '👑' },
        { label: '博學、說話有深度', value: 'owl', emoji: '🎓' },
        { label: '聰明、總有妙計', value: 'fox', emoji: '✨' },
        { label: '可愛、讓人放鬆', value: 'panda', emoji: '🐼' },
        { label: '開朗、充滿活力', value: 'dolphin', emoji: '🐬' },
        { label: '沉穩、視野廣闊', value: 'eagle', emoji: '🦅' },
      ],
      isRequired: true,
    },
    {
      key: 'q4',
      type: 'single',
      content: '你覺得自己最大的優勢是？',
      options: [
        { label: '強大的執行力和意志力', value: 'lion', emoji: '💪' },
        { label: '深度思考和學習能力', value: 'owl', emoji: '🧠' },
        { label: '靈活應變、快速解決問題', value: 'fox', emoji: '⚡' },
        { label: '讓人感到舒適和被接納', value: 'panda', emoji: '💛' },
        { label: '感染力和團隊合作', value: 'dolphin', emoji: '🎵' },
        { label: '大局觀和獨立判斷', value: 'eagle', emoji: '🌅' },
      ],
      isRequired: true,
    },
    {
      key: 'q5',
      type: 'single',
      content: '你在一個陌生的聚會中，通常會？',
      options: [
        { label: '很快成為注意力中心', value: 'lion', emoji: '🌟' },
        { label: '找一個角落安靜觀察', value: 'owl', emoji: '👁️' },
        { label: '觀察後找最有趣的人搭話', value: 'fox', emoji: '🎭' },
        { label: '親和地讓大家都感覺自在', value: 'panda', emoji: '🤗' },
        { label: '帶動氣氛、讓大家玩起來', value: 'dolphin', emoji: '🎉' },
        { label: '保持距離、默默評估', value: 'eagle', emoji: '🦅' },
      ],
      isRequired: true,
    },
  ],
  quizConfig: {
    traits: ['lion', 'owl', 'fox', 'panda', 'dolphin', 'eagle'],
    scoringRules: [
      'q1', 'q2', 'q3', 'q4', 'q5',
    ].flatMap(qKey =>
      ['lion', 'owl', 'fox', 'panda', 'dolphin', 'eagle'].map(trait => ({
        questionKey: qKey,
        optionValue: trait,
        traitKey: trait,
        score: 1,
      }))
    ),
    results: [
      {
        resultKey: 'lion',
        name: '獅子',
        description: '你天生是領導者。充滿行動力、敢於冒險，你的存在本身就有磁場。面對困難你不退縮，反而越戰越勇。',
        emoji: '🦁',
        traits: { lion: [4, 5], owl: [0, 5], fox: [0, 5], panda: [0, 5], dolphin: [0, 5], eagle: [0, 5] },
      },
      {
        resultKey: 'owl',
        name: '貓頭鷹',
        description: '你是思考型的智者。你不急著行動，而是先深入理解。你的話不多，但每次開口都讓人停下來思考。',
        emoji: '🦉',
        traits: { owl: [4, 5], lion: [0, 5], fox: [0, 5], panda: [0, 5], dolphin: [0, 5], eagle: [0, 5] },
      },
      {
        resultKey: 'fox',
        name: '狐狸',
        description: '你聰明、靈活，總能找到別人找不到的出路。你善於觀察人心，也懂得在適當時機出手。',
        emoji: '🦊',
        traits: { fox: [4, 5], lion: [0, 5], owl: [0, 5], panda: [0, 5], dolphin: [0, 5], eagle: [0, 5] },
      },
      {
        resultKey: 'panda',
        name: '熊貓',
        description: '你是大家的療癒系存在。你的笑容有魔法，讓人感到放鬆安心。你不需要爭第一，因為你就是大家心裡最特別的那個。',
        emoji: '🐼',
        traits: { panda: [4, 5], lion: [0, 5], owl: [0, 5], fox: [0, 5], dolphin: [0, 5], eagle: [0, 5] },
      },
      {
        resultKey: 'dolphin',
        name: '海豚',
        description: '你充滿活力和感染力，是群體中的開心果。你擅長團隊合作，用直覺和熱情感染身邊所有人。',
        emoji: '🐬',
        traits: { dolphin: [4, 5], lion: [0, 5], owl: [0, 5], fox: [0, 5], panda: [0, 5], eagle: [0, 5] },
      },
      {
        resultKey: 'eagle',
        name: '老鷹',
        description: '你擁有卓越的大局觀。你看得遠、想得深，不輕易受眼前事物干擾。你的獨立和沉穩，讓人在危急時刻最想依靠你。',
        emoji: '🦅',
        traits: { eagle: [4, 5], lion: [0, 5], owl: [0, 5], fox: [0, 5], panda: [0, 5], dolphin: [0, 5] },
      },
    ],
  },
}

// ===== Template 4: 你的未來人生路線 =====
const lifePath: ViralTemplate = {
  slug: 'life-path',
  title: '你的未來人生路線',
  description: '你的選擇透露了你最適合走的人生道路！',
  icon: '🛤️',
  category: 'lifestyle',
  theme: 'cyber',
  coverTitle: '你會走哪條人生路線？',
  coverSubtitle: '6 個選擇，看見你未來的方向 ⚡',
  doneTitle: '你的人生路線揭曉！',
  doneSubtitle: '這條路，你準備好了嗎？分享給同路人吧！',
  estimatedMinutes: 3,
  questions: [
    {
      key: 'q1',
      type: 'single',
      content: '你最嚮往的生活狀態是？',
      options: [
        { label: '每天都不一樣、充滿新鮮感', value: 'A', emoji: '🌍' },
        { label: '有規律、有目標，一步步往上走', value: 'B', emoji: '📈' },
        { label: '做自己熱愛的事、改變世界', value: 'C', emoji: '⚡' },
        { label: '有深度的人際連結、真正懂我的人', value: 'D', emoji: '🤍' },
      ],
      isRequired: true,
    },
    {
      key: 'q2',
      type: 'single',
      content: '如果可以選，你的工作環境是？',
      options: [
        { label: '隨時可以換地點的遠端工作', value: 'A', emoji: '🌐' },
        { label: '大公司或知名機構，有系統有資源', value: 'B', emoji: '🏢' },
        { label: '自己創業或小而美的新創', value: 'C', emoji: '🚀' },
        { label: '非營利、教育或幫助人的領域', value: 'D', emoji: '💚' },
      ],
      isRequired: true,
    },
    {
      key: 'q3',
      type: 'single',
      content: '你對「成功」的定義是？',
      options: [
        { label: '去過最多地方、體驗最豐富的人生', value: 'A', emoji: '🗺️' },
        { label: '財務自由、有能力給家人最好的', value: 'B', emoji: '💰' },
        { label: '做出真正改變世界的東西', value: 'C', emoji: '🌟' },
        { label: '身邊都是真正在乎彼此的人', value: 'D', emoji: '👥' },
      ],
      isRequired: true,
    },
    {
      key: 'q4',
      type: 'single',
      content: '面對未知，你的態度是？',
      options: [
        { label: '興奮！未知就是可能性', value: 'A', emoji: '🎲' },
        { label: '謹慎準備、把風險降到最低', value: 'B', emoji: '🛡️' },
        { label: '把未知當成創新的機會', value: 'C', emoji: '💡' },
        { label: '只要和重要的人一起，什麼都能面對', value: 'D', emoji: '🤝' },
      ],
      isRequired: true,
    },
    {
      key: 'q5',
      type: 'single',
      content: '十年後，你最希望在哪裡？',
      options: [
        { label: '不確定——那才是最棒的答案', value: 'A', emoji: '🌈' },
        { label: '在一個我努力搭建的穩固基地', value: 'B', emoji: '🏠' },
        { label: '站在某個我親手打造的舞台上', value: 'C', emoji: '🎭' },
        { label: '和最重要的人在一起，地方不重要', value: 'D', emoji: '💛' },
      ],
      isRequired: true,
    },
    {
      key: 'q6',
      type: 'single',
      content: '你最欣賞哪種人？',
      options: [
        { label: '放下一切出走、活得自由的人', value: 'A', emoji: '🦅' },
        { label: '十年磨一劍、終於成功的人', value: 'B', emoji: '⚔️' },
        { label: '用一個想法改變了一個行業的人', value: 'C', emoji: '💥' },
        { label: '默默影響了很多人生命的人', value: 'D', emoji: '🌱' },
      ],
      isRequired: true,
    },
  ],
  quizConfig: {
    traits: ['explorer', 'builder', 'innovator', 'connector'],
    scoringRules: [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6',
    ].flatMap(qKey =>
      [
        { value: 'A', trait: 'explorer' },
        { value: 'B', trait: 'builder' },
        { value: 'C', trait: 'innovator' },
        { value: 'D', trait: 'connector' },
      ].map(({ value, trait }) => ({
        questionKey: qKey,
        optionValue: value,
        traitKey: trait,
        score: 3,
      }))
    ),
    results: [
      {
        resultKey: 'explorer',
        name: '自由探索者',
        description: '你的人生字典裡沒有「一成不變」。你需要自由、渴望多元體驗，每一段旅程都是你的養分。你最怕的不是失敗，而是停下來不動。',
        emoji: '🌍',
        traits: { explorer: [12, 18], builder: [0, 18], innovator: [0, 18], connector: [0, 18] },
      },
      {
        resultKey: 'builder',
        name: '穩定建造者',
        description: '你相信積累的力量。你不追求一夜爆紅，而是把每一塊磚都砌好。時間是你最好的朋友，十年後回頭看，你建的東西會讓所有人驚歎。',
        emoji: '🏗️',
        traits: { builder: [12, 18], explorer: [0, 18], innovator: [0, 18], connector: [0, 18] },
      },
      {
        resultKey: 'innovator',
        name: '創新突破者',
        description: '你看到的世界和別人不一樣。你在別人看到問題的地方，看到機會。你的想法可能太超前，但正因為如此，你才有機會真正改變什麼。',
        emoji: '⚡',
        traits: { innovator: [12, 18], explorer: [0, 18], builder: [0, 18], connector: [0, 18] },
      },
      {
        resultKey: 'connector',
        name: '深度連結者',
        description: '你知道人才是一切的核心。你對關係投入深、也收穫深。你的影響力不是靠名氣，而是一個一個真實的連結——而這種影響，往往是最持久的。',
        emoji: '🤍',
        traits: { connector: [12, 18], explorer: [0, 18], builder: [0, 18], innovator: [0, 18] },
      },
    ],
  },
}

// ===== Template 5: 你在職場的角色 =====
const workplaceRole: ViralTemplate = {
  slug: 'workplace-role',
  title: '你在職場的角色',
  description: '你是領導者、執行者、創意人還是協調者？',
  icon: '💼',
  category: 'lifestyle',
  theme: 'default',
  coverTitle: '你在職場扮演什麼角色？',
  coverSubtitle: '6 個問題，看清你的工作人格 📊',
  doneTitle: '你的職場角色揭曉！',
  doneSubtitle: '分享給同事，看看他們認同嗎？😄',
  estimatedMinutes: 3,
  questions: [
    {
      key: 'q1',
      type: 'single',
      content: '開會時，你通常是？',
      options: [
        { label: '主導討論方向、做最後決定', value: 'A', emoji: '🎯' },
        { label: '認真做筆記、回去按時完成', value: 'B', emoji: '📝' },
        { label: '提出大家沒想到的角度', value: 'C', emoji: '💡' },
        { label: '確保每個人都有機會說話', value: 'D', emoji: '🤝' },
      ],
      isRequired: true,
    },
    {
      key: 'q2',
      type: 'single',
      content: '拿到一個新專案，你的第一步是？',
      options: [
        { label: '確認目標、分配任務、訂 deadline', value: 'A', emoji: '📋' },
        { label: '把自己負責的部分研究透徹', value: 'B', emoji: '🔍' },
        { label: '先腦暴一堆可能的方向', value: 'C', emoji: '🌈' },
        { label: '確認團隊成員的狀態和分工', value: 'D', emoji: '👥' },
      ],
      isRequired: true,
    },
    {
      key: 'q3',
      type: 'single',
      content: '專案遇到瓶頸，你會？',
      options: [
        { label: '快速決策、調整方向', value: 'A', emoji: '⚡' },
        { label: '深入分析原因、找出問題根源', value: 'B', emoji: '🔬' },
        { label: '想一個完全不同的解法', value: 'C', emoji: '🎨' },
        { label: '召集大家一起想辦法', value: 'D', emoji: '🤗' },
      ],
      isRequired: true,
    },
    {
      key: 'q4',
      type: 'single',
      content: '最讓你有成就感的是？',
      options: [
        { label: '看到團隊超越目標', value: 'A', emoji: '🏆' },
        { label: '把一件事做到極致、完美交付', value: 'B', emoji: '✅' },
        { label: '一個想法從無到有變成現實', value: 'C', emoji: '🚀' },
        { label: '幫助同事解決困難', value: 'D', emoji: '💛' },
      ],
      isRequired: true,
    },
    {
      key: 'q5',
      type: 'single',
      content: '理想的工作日是？',
      options: [
        { label: '高強度、高節奏，充滿決策和挑戰', value: 'A', emoji: '🔥' },
        { label: '專注深入地完成一件重要的事', value: 'B', emoji: '🎯' },
        { label: '自由探索、嘗試新的東西', value: 'C', emoji: '🌟' },
        { label: '和不同的人互動、解決各種問題', value: 'D', emoji: '🌐' },
      ],
      isRequired: true,
    },
    {
      key: 'q6',
      type: 'single',
      content: '如果你是一個工具，你會是？',
      options: [
        { label: '指南針——指引方向', value: 'A', emoji: '🧭' },
        { label: '精密儀器——精準可靠', value: 'B', emoji: '⚙️' },
        { label: '畫筆——創造無限可能', value: 'C', emoji: '🖌️' },
        { label: '橋梁——連接彼此', value: 'D', emoji: '🌉' },
      ],
      isRequired: true,
    },
  ],
  quizConfig: {
    traits: ['leader', 'executor', 'creative', 'coordinator'],
    scoringRules: [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6',
    ].flatMap(qKey =>
      [
        { value: 'A', trait: 'leader' },
        { value: 'B', trait: 'executor' },
        { value: 'C', trait: 'creative' },
        { value: 'D', trait: 'coordinator' },
      ].map(({ value, trait }) => ({
        questionKey: qKey,
        optionValue: value,
        traitKey: trait,
        score: 3,
      }))
    ),
    results: [
      {
        resultKey: 'leader',
        name: '領導者',
        description: '你天生有帶人的格局。你看的是全局、管的是方向、在乎的是結果。你不一定事事親自做，但有你在，團隊就有主心骨。',
        emoji: '👑',
        traits: { leader: [12, 18], executor: [0, 18], creative: [0, 18], coordinator: [0, 18] },
      },
      {
        resultKey: 'executor',
        name: '執行者',
        description: '你是那種說到做到、讓人放心的人。你不只有想法，更有能力把事情做完、做好。你的可靠性是整個團隊最強的資產之一。',
        emoji: '⚙️',
        traits: { executor: [12, 18], leader: [0, 18], creative: [0, 18], coordinator: [0, 18] },
      },
      {
        resultKey: 'creative',
        name: '創意人',
        description: '你的腦袋裡永遠有別人想不到的東西。你在框架之外思考，讓平凡的問題有了不平凡的解法。有你在，團隊的天花板高了不止一截。',
        emoji: '🎨',
        traits: { creative: [12, 18], leader: [0, 18], executor: [0, 18], coordinator: [0, 18] },
      },
      {
        resultKey: 'coordinator',
        name: '協調者',
        description: '你是讓團隊順暢運作的關鍵齒輪。你懂人、懂關係，能在衝突中找到共識、在混亂中建立秩序。少了你，團隊會少掉很多溫度和效率。',
        emoji: '🌉',
        traits: { coordinator: [12, 18], leader: [0, 18], executor: [0, 18], creative: [0, 18] },
      },
    ],
  },
}

// ===== Template 6: 情侶默契測驗 =====
const coupleCompatibility: ViralTemplate = {
  slug: 'couple-compatibility',
  title: '情侶默契測驗',
  description: '你們有多了解彼此？8個問題測出真實默契！',
  icon: '💑',
  category: 'relationship',
  theme: 'sakura',
  coverTitle: '你們的默契有幾分？',
  coverSubtitle: '兩個人各自填、再來對答案 💕',
  doneTitle: '你的答案填好了！',
  doneSubtitle: '讓另一半也來填，然後對照答案看看默契幾分 😄',
  estimatedMinutes: 3,
  questions: [
    {
      key: 'q1',
      type: 'single',
      content: '你們最常吵架的原因是？',
      options: [
        { label: '溝通不良、說了對方聽不懂', value: 'A', emoji: '💬' },
        { label: '生活習慣不一樣', value: 'B', emoji: '🏠' },
        { label: '時間和陪伴', value: 'C', emoji: '⏰' },
        { label: '金錢觀念不同', value: 'D', emoji: '💰' },
        { label: '其實很少吵架', value: 'E', emoji: '😊' },
      ],
      isRequired: true,
    },
    {
      key: 'q2',
      type: 'single',
      content: '另一半最常說你哪一點需要改進？',
      options: [
        { label: '太粗心、常常忘東忘西', value: 'A', emoji: '🙈' },
        { label: '說話太直、有時會傷人', value: 'B', emoji: '💬' },
        { label: '情緒管理需要加強', value: 'C', emoji: '😤' },
        { label: '太獨立、有時不讓對方參與', value: 'D', emoji: '🚪' },
        { label: '其實沒什麼需要改進的', value: 'E', emoji: '😇' },
      ],
      isRequired: true,
    },
    {
      key: 'q3',
      type: 'single',
      content: '你們在一起最享受的時光是？',
      options: [
        { label: '一起出去玩、探索新地方', value: 'A', emoji: '🗺️' },
        { label: '在家窩著、什麼都不做', value: 'B', emoji: '🛋️' },
        { label: '一起吃好吃的東西', value: 'C', emoji: '🍽️' },
        { label: '深夜聊天、說各種心裡話', value: 'D', emoji: '🌙' },
        { label: '一起做一個共同的興趣', value: 'E', emoji: '🎮' },
      ],
      isRequired: true,
    },
    {
      key: 'q4',
      type: 'single',
      content: '另一半最讓你感動的地方是？',
      options: [
        { label: '在你最低落時，默默陪在旁邊', value: 'A', emoji: '🤍' },
        { label: '記得你說過的每一個小細節', value: 'B', emoji: '💛' },
        { label: '總是讓你先、願意為你犧牲', value: 'C', emoji: '🌸' },
        { label: '讓你做自己、從不試圖改變你', value: 'D', emoji: '🦋' },
        { label: '在別人面前維護你、讓你有安全感', value: 'E', emoji: '🛡️' },
      ],
      isRequired: true,
    },
    {
      key: 'q5',
      type: 'single',
      content: '你們的愛情，你覺得最像？',
      options: [
        { label: '溫水——平靜但越來越暖', value: 'A', emoji: '☕' },
        { label: '煙火——激烈燦爛', value: 'B', emoji: '🎆' },
        { label: '樹木——紮根、穩定成長', value: 'C', emoji: '🌳' },
        { label: '海浪——有起伏但一直在', value: 'D', emoji: '🌊' },
      ],
      isRequired: true,
    },
    {
      key: 'q6',
      type: 'single',
      content: '如果你們的愛情是一首歌，曲風會是？',
      options: [
        { label: '抒情情歌，悠遠深情', value: 'A', emoji: '🎵' },
        { label: '輕快流行，陽光活潑', value: 'B', emoji: '🎶' },
        { label: '爵士，有質感有深度', value: 'C', emoji: '🎷' },
        { label: '搖滾，充滿能量和熱情', value: 'D', emoji: '🎸' },
      ],
      isRequired: true,
    },
    {
      key: 'q7',
      type: 'single',
      content: '你覺得你們在一起，讓你最成長的是？',
      options: [
        { label: '學會更好地表達自己的感受', value: 'A', emoji: '💬' },
        { label: '變得更有耐心和包容', value: 'B', emoji: '🌿' },
        { label: '更了解自己真正想要什麼', value: 'C', emoji: '🔍' },
        { label: '更敢去追求自己的夢想', value: 'D', emoji: '🚀' },
      ],
      isRequired: true,
    },
    {
      key: 'q8',
      type: 'single',
      content: '你們的未來，你最期待的是？',
      options: [
        { label: '一起去還沒去過的地方旅行', value: 'A', emoji: '✈️' },
        { label: '建立一個真正屬於我們的家', value: 'B', emoji: '🏡' },
        { label: '一起實現某個共同的夢想', value: 'C', emoji: '⭐' },
        { label: '就這樣慢慢變老、陪著彼此', value: 'D', emoji: '👫' },
      ],
      isRequired: true,
    },
  ],
}

// ===== Template 7: 你的人生價值觀 =====
const lifeValues: ViralTemplate = {
  slug: 'life-values',
  title: '你的人生價值觀',
  description: '你最在乎什麼？揭開驅動你人生的核心價值！',
  icon: '🌟',
  category: 'lifestyle',
  theme: 'ancient',
  coverTitle: '你的人生價值觀是什麼？',
  coverSubtitle: '6 個選擇，看見你最深處的在乎 🏯',
  doneTitle: '你的核心價值觀揭曉！',
  doneSubtitle: '了解自己，是最重要的事。分享給也在探索的朋友吧。',
  estimatedMinutes: 3,
  questions: [
    {
      key: 'q1',
      type: 'single',
      content: '如果你只能追求一件事，你會選？',
      options: [
        { label: '自由——隨心所欲地活著', value: 'freedom', emoji: '🕊️' },
        { label: '成就——做出真正有意義的事', value: 'achievement', emoji: '🏆' },
        { label: '愛——深刻的連結和歸屬感', value: 'love', emoji: '❤️' },
        { label: '智慧——真正理解這個世界', value: 'wisdom', emoji: '📜' },
      ],
      isRequired: true,
    },
    {
      key: 'q2',
      type: 'single',
      content: '你最無法接受的是？',
      options: [
        { label: '被束縛、被控制', value: 'freedom', emoji: '⛓️' },
        { label: '碌碌無為、虛度光陰', value: 'achievement', emoji: '⏳' },
        { label: '孤獨、與世界失去連結', value: 'love', emoji: '🌑' },
        { label: '無知、人云亦云', value: 'wisdom', emoji: '🙈' },
      ],
      isRequired: true,
    },
    {
      key: 'q3',
      type: 'single',
      content: '在你心中，一個完整的人生必須包含？',
      options: [
        { label: '足夠的選擇和冒險', value: 'freedom', emoji: '🌍' },
        { label: '留下一些有價值的東西', value: 'achievement', emoji: '🗿' },
        { label: '深刻愛過、也被愛過', value: 'love', emoji: '💞' },
        { label: '真正理解過幾件重要的事', value: 'wisdom', emoji: '🎓' },
      ],
      isRequired: true,
    },
    {
      key: 'q4',
      type: 'single',
      content: '面對一個艱難的人生決定，你最看重什麼？',
      options: [
        { label: '這個選擇讓我更自由還是更受限？', value: 'freedom', emoji: '🔓' },
        { label: '這個選擇能不能讓我成長？', value: 'achievement', emoji: '📈' },
        { label: '這個選擇對我在乎的人有什麼影響？', value: 'love', emoji: '🤲' },
        { label: '這個選擇符不符合我的內心？', value: 'wisdom', emoji: '🪞' },
      ],
      isRequired: true,
    },
    {
      key: 'q5',
      type: 'single',
      content: '如果可以留下一句話給後人，你希望是？',
      options: [
        { label: '「勇敢地活出自己。」', value: 'freedom', emoji: '🦅' },
        { label: '「用你的存在讓世界更好一點。」', value: 'achievement', emoji: '🌟' },
        { label: '「好好愛你身邊的人。」', value: 'love', emoji: '💛' },
        { label: '「持續思考，不要停止追問。」', value: 'wisdom', emoji: '🔍' },
      ],
      isRequired: true,
    },
    {
      key: 'q6',
      type: 'single',
      content: '你覺得人生最大的遺憾通常是？',
      options: [
        { label: '沒有勇氣做那些想做的事', value: 'freedom', emoji: '😔' },
        { label: '沒有把潛力完全發揮出來', value: 'achievement', emoji: '💭' },
        { label: '沒有好好珍惜重要的人', value: 'love', emoji: '🥺' },
        { label: '活了一輩子卻沒有真正認識自己', value: 'wisdom', emoji: '🌫️' },
      ],
      isRequired: true,
    },
  ],
  quizConfig: {
    traits: ['freedom', 'achievement', 'love', 'wisdom'],
    scoringRules: [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6',
    ].flatMap(qKey =>
      ['freedom', 'achievement', 'love', 'wisdom'].map(trait => ({
        questionKey: qKey,
        optionValue: trait,
        traitKey: trait,
        score: 3,
      }))
    ),
    results: [
      {
        resultKey: 'freedom',
        name: '自由主義者',
        description: '你最深層的渴望是：做自己，活在自己的規則裡。你害怕的不是失敗，而是被框住。你的人生是一場持續的自我解放之旅。',
        emoji: '🕊️',
        traits: { freedom: [12, 18], achievement: [0, 18], love: [0, 18], wisdom: [0, 18] },
      },
      {
        resultKey: 'achievement',
        name: '成就驅動者',
        description: '你活著是為了留下一點什麼。你有強烈的使命感，不甘心平庸，想讓自己的存在有分量。你是那種會用一生去追一個夢的人。',
        emoji: '🏆',
        traits: { achievement: [12, 18], freedom: [0, 18], love: [0, 18], wisdom: [0, 18] },
      },
      {
        resultKey: 'love',
        name: '連結主義者',
        description: '對你來說，人生最真實的意義存在於關係之中。你深知人與人之間的連結是最珍貴的東西，你給出的愛也是最深沉的那種。',
        emoji: '❤️',
        traits: { love: [12, 18], freedom: [0, 18], achievement: [0, 18], wisdom: [0, 18] },
      },
      {
        resultKey: 'wisdom',
        name: '智慧探求者',
        description: '你一直在問「為什麼」。你不滿足於表面，想要真正理解事物的本質。你的人生是一場永不結束的探索之旅。',
        emoji: '📜',
        traits: { wisdom: [12, 18], freedom: [0, 18], achievement: [0, 18], love: [0, 18] },
      },
    ],
  },
}

// ===== Template 8: 你的隱藏天賦 =====
const hiddenTalent: ViralTemplate = {
  slug: 'hidden-talent',
  title: '你的隱藏天賦',
  description: '你真正的天賦是什麼？也許連你自己都不知道！',
  icon: '🌠',
  category: 'personality',
  theme: 'game',
  coverTitle: '你隱藏的天賦是什麼？',
  coverSubtitle: '6 個問題，解鎖你的隱藏屬性 🎮',
  doneTitle: '你的隱藏天賦解鎖了！',
  doneSubtitle: '分享給朋友，看看他們發現了什麼天賦！',
  estimatedMinutes: 3,
  questions: [
    {
      key: 'q1',
      type: 'single',
      content: '小時候，你最常做的事是？',
      options: [
        { label: '講故事給其他小朋友聽', value: 'language', emoji: '📖' },
        { label: '畫畫、做手工、搭樂高', value: 'visual', emoji: '🎨' },
        { label: '哼歌、學各種聲音', value: 'music', emoji: '🎵' },
        { label: '玩數學遊戲或解謎', value: 'logic', emoji: '🧩' },
        { label: '當朋友之間的和事佬', value: 'social', emoji: '🤝' },
        { label: '喜歡跑跳、肢體活動', value: 'physical', emoji: '⚽' },
      ],
      isRequired: true,
    },
    {
      key: 'q2',
      type: 'single',
      content: '別人向你求助，你最拿手的是？',
      options: [
        { label: '幫他們用文字表達想說的話', value: 'language', emoji: '✍️' },
        { label: '幫他們設計或美化東西', value: 'visual', emoji: '🖌️' },
        { label: '推薦適合的音樂或場景', value: 'music', emoji: '🎧' },
        { label: '幫他們理清邏輯和問題', value: 'logic', emoji: '💡' },
        { label: '幫他們處理人際關係', value: 'social', emoji: '💬' },
        { label: '教他們一個動作或技巧', value: 'physical', emoji: '🏃' },
      ],
      isRequired: true,
    },
    {
      key: 'q3',
      type: 'single',
      content: '你最容易進入「心流」狀態的是？',
      options: [
        { label: '寫作、閱讀、辯論', value: 'language', emoji: '📝' },
        { label: '拍照、排版、佈置空間', value: 'visual', emoji: '📸' },
        { label: '聽音樂、演奏、哼歌', value: 'music', emoji: '🎼' },
        { label: '解題、寫程式、分析數據', value: 'logic', emoji: '💻' },
        { label: '和人聊天、幫助他人', value: 'social', emoji: '🌟' },
        { label: '運動、跳舞、手作', value: 'physical', emoji: '💃' },
      ],
      isRequired: true,
    },
    {
      key: 'q4',
      type: 'single',
      content: '別人最常稱讚你？',
      options: [
        { label: '「你說話/寫作真的很有力量」', value: 'language', emoji: '🗣️' },
        { label: '「你的美感好好，什麼都好看」', value: 'visual', emoji: '👁️' },
        { label: '「你對音樂的感受力超強」', value: 'music', emoji: '🎤' },
        { label: '「你分析問題真的很厲害」', value: 'logic', emoji: '🔬' },
        { label: '「和你說話感覺很被理解」', value: 'social', emoji: '💛' },
        { label: '「你的協調性和肢體感超好」', value: 'physical', emoji: '🤸' },
      ],
      isRequired: true,
    },
    {
      key: 'q5',
      type: 'single',
      content: '如果要你學一個新技能，你最想學？',
      options: [
        { label: '寫劇本或出版一本書', value: 'language', emoji: '📚' },
        { label: '學插畫或學電影剪輯', value: 'visual', emoji: '🎬' },
        { label: '學一種樂器或學唱歌', value: 'music', emoji: '🎹' },
        { label: '學 AI 應用或學統計分析', value: 'logic', emoji: '🤖' },
        { label: '學教練技術或心理學', value: 'social', emoji: '🧠' },
        { label: '學一種武術或學瑜珈', value: 'physical', emoji: '🧘' },
      ],
      isRequired: true,
    },
    {
      key: 'q6',
      type: 'single',
      content: '哪種成就讓你最有自豪感？',
      options: [
        { label: '用一段話讓別人眼睛一亮', value: 'language', emoji: '✨' },
        { label: '創作出一個讓自己滿意的作品', value: 'visual', emoji: '🖼️' },
        { label: '在人群面前表演，感受共鳴', value: 'music', emoji: '🎭' },
        { label: '解開一個別人解不了的問題', value: 'logic', emoji: '🏆' },
        { label: '幫助一個人走出困境', value: 'social', emoji: '🌈' },
        { label: '用身體做到一件困難的事', value: 'physical', emoji: '🥇' },
      ],
      isRequired: true,
    },
  ],
  quizConfig: {
    traits: ['language', 'visual', 'music', 'logic', 'social', 'physical'],
    scoringRules: [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6',
    ].flatMap(qKey =>
      ['language', 'visual', 'music', 'logic', 'social', 'physical'].map(trait => ({
        questionKey: qKey,
        optionValue: trait,
        traitKey: trait,
        score: 1,
      }))
    ),
    results: [
      {
        resultKey: 'language',
        name: '語言天才',
        description: '你有操控文字和語言的天賦。你能用精準的詞彙表達複雜的感受，讓人聽了心有戚戚焉。你的筆或你的口，都是改變人心的武器。',
        emoji: '📖',
        traits: { language: [5, 6], visual: [0, 6], music: [0, 6], logic: [0, 6], social: [0, 6], physical: [0, 6] },
      },
      {
        resultKey: 'visual',
        name: '視覺天才',
        description: '你看世界的方式和別人不一樣。你對顏色、構圖、空間有天生的敏感，能把平凡的東西變成藝術。你的眼睛比任何鏡頭都更會取景。',
        emoji: '🎨',
        traits: { visual: [5, 6], language: [0, 6], music: [0, 6], logic: [0, 6], social: [0, 6], physical: [0, 6] },
      },
      {
        resultKey: 'music',
        name: '音樂天才',
        description: '你的靈魂和音符之間有直接的連線。你能感受到音樂裡的情感層次，也能用聲音表達語言無法傳遞的東西。',
        emoji: '🎵',
        traits: { music: [5, 6], language: [0, 6], visual: [0, 6], logic: [0, 6], social: [0, 6], physical: [0, 6] },
      },
      {
        resultKey: 'logic',
        name: '邏輯天才',
        description: '你的大腦是一台精密的分析機器。你能快速找出規律、識破矛盾，在複雜的系統中看到別人看不到的結構。',
        emoji: '🧩',
        traits: { logic: [5, 6], language: [0, 6], visual: [0, 6], music: [0, 6], social: [0, 6], physical: [0, 6] },
      },
      {
        resultKey: 'social',
        name: '人際天才',
        description: '你天生懂人心。你能感受到別人說不出口的需求，讓每個人都感覺被看見、被理解。你走過的地方，人與人之間的距離都會縮短。',
        emoji: '💛',
        traits: { social: [5, 6], language: [0, 6], visual: [0, 6], music: [0, 6], logic: [0, 6], physical: [0, 6] },
      },
      {
        resultKey: 'physical',
        name: '身體天才',
        description: '你的身體是你最精準的表達工具。你有卓越的協調性和空間感，能用肢體做到讓人嘆為觀止的事。你活在當下，完全投入每一個動作。',
        emoji: '🤸',
        traits: { physical: [5, 6], language: [0, 6], visual: [0, 6], music: [0, 6], logic: [0, 6], social: [0, 6] },
      },
    ],
  },
}

// ===== Template 9: 朋友適合你的程度 =====
const friendshipMatch: ViralTemplate = {
  slug: 'friendship-match',
  title: '朋友適合你的程度',
  description: '測測你和某位朋友到底合不合拍！',
  icon: '🤜🤛',
  category: 'social',
  theme: 'ocean',
  coverTitle: '你們有多合拍？',
  coverSubtitle: '5 個問題，測出你的理想友誼模式 🌊',
  doneTitle: '你的友誼類型揭曉！',
  doneSubtitle: '傳給你的好朋友，看看他們的結果一不一樣！',
  estimatedMinutes: 2,
  questions: [
    {
      key: 'q1',
      type: 'single',
      content: '你最理想的朋友相處模式是？',
      options: [
        { label: '時常聯繫、互相關心、什麼都分享', value: 'A', emoji: '💌' },
        { label: '不一定常聯絡，但見面就像沒斷過', value: 'B', emoji: '🔮' },
        { label: '一起做事、共同目標讓我們更緊密', value: 'C', emoji: '🤝' },
        { label: '什麼話都能說，不用維持形象', value: 'D', emoji: '🛋️' },
        { label: '各自生活，但永遠知道對方在', value: 'E', emoji: '⭐' },
      ],
      isRequired: true,
    },
    {
      key: 'q2',
      type: 'single',
      content: '朋友最重要的特質是？',
      options: [
        { label: '誠實——就算話難聽也願意說真話', value: 'A', emoji: '🎯' },
        { label: '忠誠——在你最難的時候還在', value: 'B', emoji: '🛡️' },
        { label: '趣味——在一起就會開心', value: 'C', emoji: '😂' },
        { label: '理解——不用解釋就懂你', value: 'D', emoji: '🌊' },
        { label: '成長——相互激勵、一起變更好', value: 'E', emoji: '🌱' },
      ],
      isRequired: true,
    },
    {
      key: 'q3',
      type: 'single',
      content: '你害怕友誼中的哪種情況？',
      options: [
        { label: '朋友突然疏遠、不知道哪裡出了問題', value: 'A', emoji: '❓' },
        { label: '漸漸變成只有表面的客套', value: 'B', emoji: '😶' },
        { label: '朋友遇到困難卻不告訴你', value: 'C', emoji: '😔' },
        { label: '被誤解、說了也沒辦法解釋清楚', value: 'D', emoji: '🌧️' },
        { label: '感覺自己在這段友誼裡付出比較多', value: 'E', emoji: '⚖️' },
      ],
      isRequired: true,
    },
    {
      key: 'q4',
      type: 'single',
      content: '一個好朋友在你低潮時，你最希望他/她怎麼做？',
      options: [
        { label: '主動聯繫，問你還好嗎', value: 'A', emoji: '📞' },
        { label: '默默陪著你，不需要說什麼', value: 'B', emoji: '🤗' },
        { label: '帶你出去、讓你暫時忘記煩惱', value: 'C', emoji: '🎉' },
        { label: '認真聽你說話、不急著給建議', value: 'D', emoji: '👂' },
        { label: '給你一個直接、有用的建議', value: 'E', emoji: '💡' },
      ],
      isRequired: true,
    },
    {
      key: 'q5',
      type: 'single',
      content: '你覺得一段友誼最終的試金石是？',
      options: [
        { label: '時間——能不能越走越久', value: 'A', emoji: '⏰' },
        { label: '危難——在你最差的時候還不離開', value: 'B', emoji: '🌩️' },
        { label: '成長——讓彼此都變得更好', value: 'C', emoji: '🌿' },
        { label: '真實——在對方面前可以完全做自己', value: 'D', emoji: '🪞' },
        { label: '快樂——每次見面都覺得值得', value: 'E', emoji: '✨' },
      ],
      isRequired: true,
    },
  ],
  quizConfig: {
    traits: ['intimate', 'loyal', 'fun', 'deep', 'growth'],
    scoringRules: [
      { questionKey: 'q1', optionValue: 'A', traitKey: 'intimate', score: 3 },
      { questionKey: 'q1', optionValue: 'B', traitKey: 'loyal', score: 3 },
      { questionKey: 'q1', optionValue: 'C', traitKey: 'growth', score: 3 },
      { questionKey: 'q1', optionValue: 'D', traitKey: 'deep', score: 3 },
      { questionKey: 'q1', optionValue: 'E', traitKey: 'loyal', score: 2 },
      { questionKey: 'q2', optionValue: 'A', traitKey: 'deep', score: 2 },
      { questionKey: 'q2', optionValue: 'B', traitKey: 'loyal', score: 3 },
      { questionKey: 'q2', optionValue: 'C', traitKey: 'fun', score: 3 },
      { questionKey: 'q2', optionValue: 'D', traitKey: 'deep', score: 3 },
      { questionKey: 'q2', optionValue: 'E', traitKey: 'growth', score: 3 },
      { questionKey: 'q3', optionValue: 'A', traitKey: 'intimate', score: 3 },
      { questionKey: 'q3', optionValue: 'B', traitKey: 'deep', score: 3 },
      { questionKey: 'q3', optionValue: 'C', traitKey: 'loyal', score: 3 },
      { questionKey: 'q3', optionValue: 'D', traitKey: 'deep', score: 2 },
      { questionKey: 'q3', optionValue: 'E', traitKey: 'intimate', score: 2 },
      { questionKey: 'q4', optionValue: 'A', traitKey: 'intimate', score: 3 },
      { questionKey: 'q4', optionValue: 'B', traitKey: 'loyal', score: 3 },
      { questionKey: 'q4', optionValue: 'C', traitKey: 'fun', score: 3 },
      { questionKey: 'q4', optionValue: 'D', traitKey: 'deep', score: 3 },
      { questionKey: 'q4', optionValue: 'E', traitKey: 'growth', score: 3 },
      { questionKey: 'q5', optionValue: 'A', traitKey: 'loyal', score: 3 },
      { questionKey: 'q5', optionValue: 'B', traitKey: 'loyal', score: 3 },
      { questionKey: 'q5', optionValue: 'C', traitKey: 'growth', score: 3 },
      { questionKey: 'q5', optionValue: 'D', traitKey: 'deep', score: 3 },
      { questionKey: 'q5', optionValue: 'E', traitKey: 'fun', score: 3 },
    ],
    results: [
      {
        resultKey: 'intimate',
        name: '黏膩型好友',
        description: '你需要的是那種常聯絡、什麼都分享的緊密友誼。你全力投入每段關係，對你來說，真正的朋友就是生活的一部分。',
        emoji: '💌',
        traits: { intimate: [6, 15], loyal: [0, 15], fun: [0, 15], deep: [0, 15], growth: [0, 15] },
      },
      {
        resultKey: 'loyal',
        name: '生死之交型',
        description: '你在乎的是那種無論多久沒聯絡、再次見面都像昨天的友誼。你選擇朋友不多，但一旦認定，就是一輩子的事。',
        emoji: '🛡️',
        traits: { loyal: [6, 15], intimate: [0, 15], fun: [0, 15], deep: [0, 15], growth: [0, 15] },
      },
      {
        resultKey: 'fun',
        name: '快樂夥伴型',
        description: '你最看重的是在一起的時光有多開心。你不需要多深沉，只要在一起就充電、就快樂——這對你來說就是最好的友誼。',
        emoji: '🎉',
        traits: { fun: [6, 15], intimate: [0, 15], loyal: [0, 15], deep: [0, 15], growth: [0, 15] },
      },
      {
        resultKey: 'deep',
        name: '靈魂連結型',
        description: '你需要的是那種能深入彼此靈魂的友誼。膚淺的交流讓你疲倦，你要的是那種能說出心底話、彼此真正理解的人。',
        emoji: '🌊',
        traits: { deep: [6, 15], intimate: [0, 15], loyal: [0, 15], fun: [0, 15], growth: [0, 15] },
      },
      {
        resultKey: 'growth',
        name: '共同成長型',
        description: '你最看重的友誼是能讓彼此變得更好的關係。你珍視那些挑戰你、激勵你、讓你不斷進步的朋友。',
        emoji: '🌱',
        traits: { growth: [6, 15], intimate: [0, 15], loyal: [0, 15], fun: [0, 15], deep: [0, 15] },
      },
    ],
  },
}

// ===== Template 10: 你的壓力應對方式 =====
const stressStyle: ViralTemplate = {
  slug: 'stress-style',
  title: '你的壓力應對方式',
  description: '壓力來的時候，你是哪種人？行動派、思考派還是獨處派？',
  icon: '🌪️',
  category: 'lifestyle',
  theme: 'noir',
  coverTitle: '壓力來了，你怎麼辦？',
  coverSubtitle: '5 個問題，了解你的解壓模式 🖤',
  doneTitle: '你的壓力應對風格揭曉！',
  doneSubtitle: '了解自己如何面對壓力，是照顧自己的第一步。',
  estimatedMinutes: 2,
  questions: [
    {
      key: 'q1',
      type: 'single',
      content: '壓力很大的時候，你最先出現的反應是？',
      options: [
        { label: '立刻找事情做，動起來就不會亂想', value: 'action', emoji: '⚡' },
        { label: '在腦袋裡反覆分析，找出問題根源', value: 'thinking', emoji: '🧠' },
        { label: '想找個人說說話、被聽見就會好多了', value: 'social', emoji: '💬' },
        { label: '需要一個人靜一靜，不想被打擾', value: 'solitude', emoji: '🌙' },
      ],
      isRequired: true,
    },
    {
      key: 'q2',
      type: 'single',
      content: '你最有效的解壓方式是？',
      options: [
        { label: '運動、打掃、做點體力活', value: 'action', emoji: '🏃' },
        { label: '寫日記、列清單、整理思緒', value: 'thinking', emoji: '📓' },
        { label: '找朋友出去玩或訴苦', value: 'social', emoji: '🍻' },
        { label: '一個人聽音樂、看電影、發呆', value: 'solitude', emoji: '🎧' },
      ],
      isRequired: true,
    },
    {
      key: 'q3',
      type: 'single',
      content: '壓力累積了一陣子，你通常會怎麼顯現？',
      options: [
        { label: '開始做很多事，忙到不知道在幹嘛', value: 'action', emoji: '🌀' },
        { label: '越想越多，晚上睡不著', value: 'thinking', emoji: '💭' },
        { label: '特別需要人陪、怕一個人', value: 'social', emoji: '🤗' },
        { label: '把自己關起來，不想見任何人', value: 'solitude', emoji: '🚪' },
      ],
      isRequired: true,
    },
    {
      key: 'q4',
      type: 'single',
      content: '朋友也在壓力大，你會怎麼幫他/她？',
      options: [
        { label: '帶他去做點什麼，行動最有效', value: 'action', emoji: '🏋️' },
        { label: '幫他分析問題、想出解決方案', value: 'thinking', emoji: '💡' },
        { label: '陪他說話、讓他說個夠', value: 'social', emoji: '👂' },
        { label: '尊重他需要的空間，讓他自己消化', value: 'solitude', emoji: '🌿' },
      ],
      isRequired: true,
    },
    {
      key: 'q5',
      type: 'single',
      content: '壓力消解之後，你通常的感受是？',
      options: [
        { label: '「還好我沒有停下來，做就對了」', value: 'action', emoji: '💪' },
        { label: '「我想清楚了，知道怎麼做了」', value: 'thinking', emoji: '✅' },
        { label: '「說出來真的好多了，謝謝你聽我說」', value: 'social', emoji: '💛' },
        { label: '「一個人靜一靜真的很重要」', value: 'solitude', emoji: '🌸' },
      ],
      isRequired: true,
    },
  ],
  quizConfig: {
    traits: ['action', 'thinking', 'social', 'solitude'],
    scoringRules: [
      'q1', 'q2', 'q3', 'q4', 'q5',
    ].flatMap(qKey =>
      ['action', 'thinking', 'social', 'solitude'].map(trait => ({
        questionKey: qKey,
        optionValue: trait,
        traitKey: trait,
        score: 3,
      }))
    ),
    results: [
      {
        resultKey: 'action',
        name: '行動派',
        description: '你的身體比腦袋更快知道怎麼應對壓力。動起來就是你的解藥——不管是運動、整理還是投入工作，消耗能量讓你感到掌控感。',
        emoji: '⚡',
        traits: { action: [10, 15], thinking: [0, 15], social: [0, 15], solitude: [0, 15] },
      },
      {
        resultKey: 'thinking',
        name: '思考派',
        description: '你用腦袋消化壓力。在搞清楚「為什麼」和「怎麼辦」之前，你很難真正放鬆。一旦想通了，壓力就自然消散。',
        emoji: '🧠',
        traits: { thinking: [10, 15], action: [0, 15], social: [0, 15], solitude: [0, 15] },
      },
      {
        resultKey: 'social',
        name: '社交派',
        description: '你在人與人的連結中充電。說出來、被聽見、被支持——這是你最有效的解壓方式。有人陪著你，再大的壓力都變得可以承受。',
        emoji: '💬',
        traits: { social: [10, 15], action: [0, 15], thinking: [0, 15], solitude: [0, 15] },
      },
      {
        resultKey: 'solitude',
        name: '獨處派',
        description: '你需要安靜和空間來恢復。獨處不是逃避，而是你充電的方式。一個人靜下來之後，你往往能找到最清晰的答案。',
        emoji: '🌙',
        traits: { solitude: [10, 15], action: [0, 15], thinking: [0, 15], social: [0, 15] },
      },
    ],
  },
}

// ===== 匯出所有模板 =====
export const VIRAL_TEMPLATES: ViralTemplate[] = [
  friendPersona,
  lovePersonality,
  spiritAnimal,
  lifePath,
  workplaceRole,
  coupleCompatibility,
  lifeValues,
  hiddenTalent,
  friendshipMatch,
  stressStyle,
]
