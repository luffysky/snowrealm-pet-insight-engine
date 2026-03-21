/**
 * 寵物人格分析系統
 * 根據問卷回答產生寵物人格類型 + 描述
 */

interface AnswerRecord {
  content: string
  type: string
  options: { label: string; value: string }[]
  answer: string | string[] | null
}

export interface PersonalityResult {
  /** 寵物頭像 emoji */
  avatar: string
  /** 人格類型標題，例如 "忠誠犬系冒險王" */
  title: string
  /** 人格描述 */
  description: string
  /** 標籤 badges */
  badges: { icon: string; label: string }[]
}

interface PersonalityArchetype {
  avatar: string
  title: string
  description: string
}

// 6 大寵物人格原型
const ARCHETYPES: Record<string, PersonalityArchetype> = {
  loyal_dog: {
    avatar: '🐕',
    title: '忠誠犬系冒險王',
    description: '你熱情、忠誠、充滿行動力！帶著你的毛夥伴，一起探索每一個角落吧！',
  },
  curious_cat: {
    avatar: '🐈',
    title: '好奇貓系探索家',
    description: '你獨立、敏銳、充滿好奇心！每一個細微的瞬間，你都不會錯過。',
  },
  gentle_rabbit: {
    avatar: '🐹',
    title: '溫柔小動物守護者',
    description: '你溫暖、細膩、充滿耐心！小小的生命在你手中，都會被好好守護。',
  },
  free_bird: {
    avatar: '🐦',
    title: '自由鳥系旅行家',
    description: '你自由、浪漫、嚮往遠方！和毛孩一起，飛向每一個美好的明天。',
  },
  deep_ocean: {
    avatar: '🐠',
    title: '深海系神秘觀察者',
    description: '你沉穩、內斂、觀察入微！在你的世界裡，每個生命都有獨特的光芒。',
  },
  dreamer: {
    avatar: '💭',
    title: '夢想系毛孩憧憬者',
    description: '你充滿想像、溫柔、期待未來！也許某天你會遇見命中注定的那個毛孩。',
  },
  memory_keeper: {
    avatar: '📖',
    title: '記憶系時光收藏家',
    description: '你重情、珍惜每一刻！那些和毛孩共度的日子，都被你細心收藏。',
  },
  passionate_explorer: {
    avatar: '🌟',
    title: '熱血系全能冒險者',
    description: '你積極、熱情、什麼都想嘗試！你的人生冒險清單上，毛孩絕對佔有一席之地。',
  },
}

function getFirstAnswer(records: AnswerRecord[], keyword: string): string | null {
  const q = records.find(r => r.content.includes(keyword))
  if (!q || !q.answer) return null
  return Array.isArray(q.answer) ? q.answer[0] : q.answer
}

function getAnswer(records: AnswerRecord[], keyword: string): string | string[] | null {
  const q = records.find(r => r.content.includes(keyword))
  return q?.answer ?? null
}

export function analyzePersonality(records: AnswerRecord[]): PersonalityResult {
  // 1. 判斷寵物類型 → 基底人格
  const petType = getFirstAnswer(records, '什麼類型的孩子')
  const hasPet = getFirstAnswer(records, '現在有養寵物')
  const mostWant = getFirstAnswer(records, '最想留下')

  // 2. 根據寵物類型選基底
  let archetype: PersonalityArchetype

  if (petType === '狗') {
    archetype = ARCHETYPES.loyal_dog
  } else if (petType === '貓') {
    archetype = ARCHETYPES.curious_cat
  } else if (petType?.includes('倉鼠') || petType?.includes('兔子')) {
    archetype = ARCHETYPES.gentle_rabbit
  } else if (petType === '鳥類') {
    archetype = ARCHETYPES.free_bird
  } else if (petType?.includes('水族') || petType?.includes('爬蟲')) {
    archetype = ARCHETYPES.deep_ocean
  } else if (hasPet?.includes('沒有，但未來想養') || hasPet?.includes('曾經養過')) {
    archetype = ARCHETYPES.dreamer
  } else if (mostWant?.includes('照片') || mostWant?.includes('故事') || mostWant?.includes('成長')) {
    archetype = ARCHETYPES.memory_keeper
  } else {
    archetype = ARCHETYPES.passionate_explorer
  }

  // 3. 生成 badges
  const badges: { icon: string; label: string }[] = []

  // 冒險完成者 — 完成問卷
  badges.push({ icon: '🏆', label: '冒險完成者' })

  // 記憶守護者 — 常回顧照片
  const reviewFreq = getFirstAnswer(records, '多久會回頭看')
  if (reviewFreq === '幾乎每天' || reviewFreq === '一週幾次') {
    badges.push({ icon: '📸', label: '記憶守護者' })
  }

  // 溫柔先鋒 — 認為寵物很重要
  const petImportant = getFirstAnswer(records, '寵物對某些人')
  if (petImportant === '很認同') {
    badges.push({ icon: '💛', label: '溫柔先鋒' })
  }

  // 功能探索家 — 對功能感興趣
  const features = getAnswer(records, '哪些功能')
  if (Array.isArray(features) && features.length >= 3) {
    badges.push({ icon: '🔍', label: '功能探索家' })
  }

  // 時光守望者 — 在意成長紀錄
  const careGrowth = getFirstAnswer(records, '在意.*成長')
  if (careGrowth === '很在意') {
    badges.push({ icon: '🕰️', label: '時光守望者' })
  }

  // 問卷先鋒 — 有留下文字回答
  const textAnswer = records.find(r => r.type === 'text' && r.answer && String(r.answer).trim().length > 0)
  if (textAnswer) {
    badges.push({ icon: '📝', label: '問卷先鋒' })
  }

  // 全成就達成 — milestone >= 4
  // (this is checked externally using gameStats.milestoneCount)

  return {
    avatar: archetype.avatar,
    title: archetype.title,
    description: archetype.description,
    badges,
  }
}
