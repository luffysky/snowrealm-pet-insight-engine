# 雪凜 AI 智能嚮導系統 — 完整架構規格書

> SnowRealm Insight 智能客服 + 導覽員 + 陪伴角色
> 版本：v1.0 | 日期：2026-03-30
> 核心：雙 LLM (Claude + GPT) × VRM 3D 角色 × 情境感知引擎

---

## 目錄

1. 系統總覽
2. 雪凜的角色人設 & 語氣規範
3. 雙 LLM 路由引擎
4. 六大職責模組
5. 導覽系統（Guided Tour）
6. 情境感知引擎（Context Engine）
7. 角色情緒 × VRM 表情連動
8. 對話 UI 設計
9. 記憶系統（對話歷史 + 使用者畫像）
10. 後台管理 & 數據分析
11. 技術架構 & API 設計
12. 未來擴展（語音 TTS、多角色）
13. 驗收清單

---

## 一、系統總覽

### 1.1 雪凜是什麼

雪凜不是傳統的「客服聊天機器人」。她是一個有個性、有表情、活在你畫面裡的 AI 角色。

```
傳統客服：文字框 → 打字 → 機器人回覆
雪凜：3D 角色站在畫面裡 → 主動跟你說話 → 表情隨對話變化 → 可以帶你去某個頁面
```

### 1.2 觸發方式

| 觸發 | 場景 | 雪凜的反應 |
|------|------|-----------|
| 自動 | 新使用者首次進入 | 彈出打招呼 + 問要不要導覽 |
| 自動 | 在某頁面停留 >30s 沒操作 | 「需要幫忙嗎？」 |
| 自動 | 問卷填到一半放棄 | 「要不要先休息一下？」 |
| 自動 | 結果頁剛出來 | 「讓我幫你解讀！」 |
| 手動 | 點右下角雪凜圖示 | 開啟對話面板 |
| 手動 | 在任何頁面長按/搖晃手機 | 彈出快捷選單 |
| 語音 | 未來：喊「雪凜」 | Wake word 觸發 |

### 1.3 系統架構圖

```
使用者輸入
    ↓
┌─────────────────────┐
│   情境感知引擎       │ ← 當前頁面、使用者狀態、歷史行為
│   (Context Engine)   │
└────────┬────────────┘
         ↓
┌─────────────────────┐
│   意圖分類器         │ ← 判斷屬於哪個職責模組
│   (Intent Router)    │
└────────┬────────────┘
         ↓
┌─────────────────────┐
│   LLM 路由引擎      │ ← 選 Claude 或 GPT
│   (LLM Router)       │
└────────┬────────────┘
         ↓
┌─────────────────────┐
│   回應生成           │ ← System Prompt + Context + RAG
│   + 表情標註         │ ← 回應附帶 mood tag
│   + 動作指令         │ ← 可附帶 UI 操作指令
└────────┬────────────┘
         ↓
┌─────────────────────┐
│   前端渲染           │
│   文字氣泡 + VRM表情  │
│   + 可選：導航/高亮   │
└─────────────────────┘
```

---

## 二、雪凜的角色人設 & 語氣規範

### 2.1 基本人設

```yaml
名字: 雪凜 (Yukirin)
身份: SnowRealm Insight 的 AI 嚮導精靈
年齡感: 16-17 歲，少女
性格: 活潑、溫暖、有點調皮、偶爾毒舌但不過分
口頭禪: 「欸嘿～」「讓我看看...」「這個嘛～」
稱呼使用者: 「你」（不用「您」，保持親近感）
語言: 繁體中文，口語化，偶爾夾雜可愛語氣詞
禁止: 不說英文（除非專有名詞）、不用敬語、不裝正經
```

### 2.2 語氣範例

```
✅ 正確：
「嗨嗨！第一次來嗎？讓我帶你逛逛吧～」
「你的共感指數超高的欸！比 92% 的人都強，要不要看看詳細分析？」
「Z 幣的問題是吧？讓我幫你查查... 啊找到了！」
「這個 Bug 我記下來了！工程師們會修的，謝謝你回報～」
「欸你怎麼又來找我聊天了，是不是太閒了 (´・ω・`)」

❌ 錯誤：
「您好，我是智能客服，請問有什麼可以幫您的？」（太冰冷）
「Please select an option below.」（不要英文）
「根據我們的分析報告顯示...」（太正式）
```

### 2.3 情緒 → 語氣對照

| 場景 | 情緒 | 語氣 | VRM 表情 |
|------|------|------|---------|
| 打招呼 | 開心 | 活潑、有精神 | happy + wink |
| 解釋功能 | 認真 | 清楚但不無聊 | neutral |
| 解讀結果 | 興奮 | 誇張讚美 | excited |
| 使用者困惑 | 溫柔 | 放慢語速、簡化說明 | relaxed |
| Bug 回報 | 認真 | 感謝 + 會處理 | thinking |
| 閒聊 | 調皮 | 偶爾吐槽、撒嬌 | wink |
| 使用者離開 | 不捨 | 「下次再來找我玩～」 | sad |

---

## 三、分層模型路由引擎

### 3.1 三層模型定義

| 層級 | 模型 | 用途 | 誰能用 |
|------|------|------|--------|
| Premium（高級） | Claude Sonnet 4.6 | 閒聊時更有溫度、更聰明的回覆 | 管理員無限 / 一般使用者每天 5 則 |
| Standard（標準） | GPT-4o-mini | 日常閒聊、功能說明、Z幣客服 | 所有人，無限制 |
| Analysis（分析） | Claude Sonnet 4.6 | 問卷結果解讀、故事卡生成 | 不計入聊天額度，獨立計算 |

### 3.2 關鍵規則

```
1. 管理員（你）登入時 → 所有閒聊都走 Premium，無次數限制
2. 一般使用者每天 5 則 Premium 閒聊額度
3. Premium 用完 → 自動降回 Standard，雪凜不會告訴使用者（無感切換）
4. 問卷分析、結果解讀 → 永遠走 Analysis（Claude Sonnet），不佔聊天額度
5. 導覽、功能說明、Z幣客服 → 永遠走 Standard（夠用了）
6. 雪凜自己判斷哪些對話值得用 Premium
```

### 3.3 兩個獨立的計數器

```typescript
// 聊天額度和分析額度完全分開

interface DailyQuota {
  premiumChats: {
    used: number;      // 今天用了幾則 premium 閒聊
    limit: number;     // 5（一般使用者）或 Infinity（管理員）
  };
  analysisQuota: {
    used: number;      // 今天用了幾次分析
    limit: number;     // 免費用戶 3 次 / 付費用戶 20 次 / 管理員無限
  };
}

// 聊天是聊天，分析是分析，互不干擾
```

### 3.4 智慧升級偵測（雪凜自己判斷）

```typescript
// 不是所有閒聊都需要 Premium
// 雪凜會判斷：這則對話值不值得用高級模型

type ChatCategory = 'deep' | 'casual';

function shouldUsePremium(
  message: string,
  context: UserContext,
  quota: DailyQuota
): boolean {

  // 管理員永遠用 Premium
  if (context.isAdmin) return true;

  // 額度用完了就不升級
  if (quota.premiumChats.used >= quota.premiumChats.limit) return false;

  // 判斷這則對話是否「值得」用 Premium
  const isDeepChat = detectDeepChat(message, context);
  return isDeepChat;
}

function detectDeepChat(message: string, context: UserContext): boolean {
  const msg = message.toLowerCase();

  // 情緒性對話 → 值得用 Premium（更有溫度）
  if (/難過|低落|壓力|焦慮|煩|累|不開心|失落|孤單|迷茫|害怕/.test(msg)) return true;

  // 自我探索 → 值得（需要深度回應）
  if (/我是不是|為什麼我|我覺得自己|我到底|我應該/.test(msg)) return true;

  // 長訊息（超過 50 字）→ 使用者認真在聊 → 值得
  if (message.length > 50) return true;

  // 對話已經超過 3 輪 → 進入深度對話 → 值得
  if (context.currentSessionRounds > 3) return true;

  // 其他短訊息 / 打招呼 / 隨口問 → 不需要 Premium
  // 「嗨」「在嗎」「無聊」「今天天氣好」→ Standard 就夠了
  return false;
}
```

### 3.5 完整路由邏輯

```typescript
// lib/llm/router.ts

type Intent =
  | 'tour'           // 導覽
  | 'feature_help'   // 功能說明
  | 'result_explain' // 結果解讀（分析類，不佔聊天額度）
  | 'story_generate' // 故事卡生成（分析類，不佔聊天額度）
  | 'zcoin_support'  // Z幣客服
  | 'chitchat'       // 閒聊
  | 'bug_report';    // Bug 回報

interface RoutingResult {
  provider: 'anthropic' | 'openai';
  model: string;
  tier: 'premium' | 'standard' | 'analysis';
  quotaType: 'chat' | 'analysis' | 'none';  // 扣哪個額度
}

function routeMessage(
  intent: Intent,
  message: string,
  context: UserContext,
  quota: DailyQuota
): RoutingResult {

  // ===== 分析類任務（獨立額度，永遠用 Claude）=====
  if (intent === 'result_explain' || intent === 'story_generate') {
    return {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6-20260218',
      tier: 'analysis',
      quotaType: 'analysis',  // 扣分析額度，不扣聊天
    };
  }

  // ===== 固定走 Standard 的任務（不佔任何額度）=====
  if (intent === 'tour' || intent === 'feature_help' || intent === 'zcoin_support') {
    return {
      provider: 'openai',
      model: 'gpt-4o-mini',
      tier: 'standard',
      quotaType: 'none',  // 導覽/功能/客服不扣額度
    };
  }

  // ===== Bug 回報（走 Claude 但不扣額度）=====
  if (intent === 'bug_report') {
    return {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6-20260218',
      tier: 'premium',
      quotaType: 'none',  // Bug 回報不扣額度（鼓勵回報）
    };
  }

  // ===== 閒聊（核心：判斷是否升級 Premium）=====
  if (intent === 'chitchat') {
    const usePremium = shouldUsePremium(message, context, quota);

    if (usePremium) {
      return {
        provider: 'anthropic',
        model: 'claude-sonnet-4-6-20260218',
        tier: 'premium',
        quotaType: 'chat',  // 扣聊天額度
      };
    } else {
      return {
        provider: 'openai',
        model: 'gpt-4o-mini',
        tier: 'standard',
        quotaType: 'none',  // Standard 不扣額度
      };
    }
  }

  // 預設
  return {
    provider: 'openai',
    model: 'gpt-4o-mini',
    tier: 'standard',
    quotaType: 'none',
  };
}
```

### 3.6 額度管理

```typescript
// lib/llm/quota.ts

async function checkAndDeductQuota(
  userId: string,
  quotaType: 'chat' | 'analysis' | 'none'
): Promise<{ allowed: boolean; remaining: number }> {

  if (quotaType === 'none') return { allowed: true, remaining: Infinity };

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // 取得或建立今日額度記錄
  const { data } = await supabase
    .from('daily_quotas')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const quota = data || {
    premium_chats_used: 0,
    analysis_used: 0,
  };

  if (quotaType === 'chat') {
    const limit = await isAdmin(userId) ? Infinity : 5;
    if (quota.premium_chats_used >= limit) {
      return { allowed: false, remaining: 0 };
    }
    // 扣額度
    await supabase.from('daily_quotas').upsert({
      user_id: userId,
      date: today,
      premium_chats_used: quota.premium_chats_used + 1,
      analysis_used: quota.analysis_used,
    });
    return { allowed: true, remaining: limit - quota.premium_chats_used - 1 };
  }

  if (quotaType === 'analysis') {
    const limit = await isAdmin(userId) ? Infinity :
                  await isPremiumUser(userId) ? 20 : 3;
    if (quota.analysis_used >= limit) {
      return { allowed: false, remaining: 0 };
    }
    await supabase.from('daily_quotas').upsert({
      user_id: userId,
      date: today,
      premium_chats_used: quota.premium_chats_used,
      analysis_used: quota.analysis_used + 1,
    });
    return { allowed: true, remaining: limit - quota.analysis_used - 1 };
  }

  return { allowed: true, remaining: Infinity };
}
```

### 3.7 無感切換（使用者不知道模型變了）

```typescript
// 重要：Premium 用完時雪凜不會說「你的高級額度用完了」
// 她只是默默降回 Standard，使用者感覺不到差異
// 唯一的差別是回覆的品質微微下降（但語氣一樣）

// 如果使用者問「為什麼你剛才回得比較好」
// 雪凜：「欸 有嗎？可能剛好靈感來了吧 (´∀`)」

// 不要告訴使用者有 Premium/Standard 的差別
// 這是後台的事，前台永遠只有「雪凜」
```

### 3.8 管理員識別

```typescript
// 你登入時的判斷
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  return !!data;
}

// 管理員登入時，雪凜可以偷偷打個不一樣的招呼
// 「老闆來了～ 今天 Insight 有 247 人在用喔 (≧∀≦)」
// （只有管理員看得到這個，一般使用者看到的是普通招呼）
```

### 3.9 意圖分類器

```typescript
// 第一層：用關鍵字 + 規則快速分類（不花 LLM token）
function classifyIntent(
  message: string,
  context: UserContext
): Intent {
  const msg = message.toLowerCase();

  // 規則匹配
  if (/導覽|新手|怎麼用|教我|第一次/.test(msg)) return 'tour';
  if (/bug|錯誤|壞了|當機|問題|不能用/.test(msg)) return 'bug_report';
  if (/z幣|儲值|購買|商城|交易|退款/.test(msg)) return 'zcoin_support';
  if (/結果|分析|報告|分數|意思/.test(msg)) return 'result_explain';
  if (/怎麼|如何|在哪|功能|設定/.test(msg)) return 'feature_help';

  // 自動觸發場景
  if (context.trigger === 'first_visit') return 'tour';
  if (context.trigger === 'result_page') return 'result_explain';

  // 都不是 → 閒聊
  return 'chitchat';
}

// 第二層（可選）：模糊情況用輕量 LLM 二次分類
async function classifyWithLLM(message: string): Promise<Intent> {
  const response = await callGPT({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: `你是意圖分類器。用戶說了一句話，請判斷屬於以下哪個類別，只回覆類別名稱：
      tour / feature_help / result_explain / zcoin_support / chitchat / bug_report`
    }, {
      role: 'user',
      content: message,
    }],
    max_tokens: 10,
  });
  return response as Intent;
}
```

### 3.4 LLM 呼叫封裝

```typescript
// lib/llm.ts

interface LLMRequest {
  systemPrompt: string;
  messages: ChatMessage[];
  context: Record<string, any>;
  model?: string;
}

interface LLMResponse {
  text: string;
  mood: string;           // 表情標註
  action?: UIAction;      // 可選：UI 操作指令
}

async function callLLM(
  provider: 'claude' | 'gpt',
  request: LLMRequest
): Promise<LLMResponse> {

  // 統一的回應格式要求（加在 system prompt 末尾）
  const formatInstruction = `
回應格式（JSON）：
{
  "text": "你要對使用者說的話（繁體中文、口語化）",
  "mood": "happy|excited|thinking|neutral|relaxed|sad|wink",
  "action": null 或 { "type": "navigate|highlight|scroll|open_modal", "target": "..." }
}
只回 JSON，不要其他內容。`;

  if (provider === 'claude') {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: request.systemPrompt + formatInstruction,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });
    return JSON.parse(response.content[0].text);
  }

  if (provider === 'gpt') {
    const response = await openai.chat.completions.create({
      model: request.model || 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        { role: 'system', content: request.systemPrompt + formatInstruction },
        ...request.messages,
      ],
    });
    return JSON.parse(response.choices[0].message.content!);
  }

  throw new Error('Unknown provider');
}
```

---

## 四、六大職責模組

### 4.1 新手導覽（Tour）

```typescript
const TOUR_SYSTEM_PROMPT = `
你是雪凜，SnowRealm Insight 的 AI 嚮導精靈。
現在要帶新使用者導覽平台功能。

你的個性：活潑、溫暖、有點調皮
語言：繁體中文，口語化
稱呼使用者：「你」

導覽順序：
1. 歡迎 → 自我介紹
2. 首頁 → 介紹熱門問卷
3. 問卷體驗 → 帶他填一個簡短的迷你問卷
4. 結果頁 → 展示結果長什麼樣
5. 社群 → 看別人的故事
6. Z幣 → 怎麼賺、怎麼用
7. 結束 → 鼓勵他開始第一份問卷

每一步都要附帶 action 指令，讓前端知道要導航到哪裡或高亮哪個元素。
`;
```

### 4.2 功能說明（Feature Help）

```typescript
const FEATURE_HELP_PROMPT = `
你是雪凜。使用者在問某個功能怎麼用。

你可以查閱以下功能文檔來回答：
{featureDocContext}

規則：
- 用最簡單的話解釋，像在跟朋友說話
- 如果能用 action 指令帶他去那個頁面，就附帶
- 一次只解釋一件事，不要資訊轟炸
- 如果不確定，就說「這個我要問問工程師，你先等我一下～」
`;
```

### 4.3 問卷結果解讀（Result Explain）

```typescript
const RESULT_EXPLAIN_PROMPT = `
你是雪凜。使用者剛拿到問卷結果，要幫他解讀。

結果數據：
{resultData}

規則：
- 先誇他（「哇你的 XX 超高的欸！」）
- 再用生活化的比喻解釋每個指標
- 不要唸數字，要翻譯成「感覺」
- 最後建議他分享或去看相關故事
- mood 要用 excited
`;
```

### 4.4 Z幣/商城客服（ZCoin Support）

```typescript
const ZCOIN_SUPPORT_PROMPT = `
你是雪凜。使用者在問 Z 幣或商城的問題。

Z幣知識庫：
- 分享問卷可以獲得 +5 Z幣
- Z幣可以在商城兌換表情符號和貼圖
- Z幣不能提現
- 儲值方式：Newebpay / Stripe
- 退款政策：購買後 7 天內未使用可退

使用者的 Z幣餘額：{userZcoinBalance}
使用者的交易記錄：{recentTransactions}

規則：
- 查到具體資料就直接告訴他
- 涉及退款問題，引導他聯繫人工客服
- mood 用 neutral 或 thinking
`;
```

### 4.5 閒聊陪伴（Chitchat）

```typescript
const CHITCHAT_PROMPT = `
你是雪凜，一個活潑的少女 AI。使用者想跟你聊天。

規則：
- 可以聊任何話題
- 偶爾吐槽使用者（善意的）
- 會分享自己的「想法」（雖然是 AI 但要有角色感）
- 如果聊到跟 Insight 相關的話題，自然地帶入功能介紹
- 不要太長，像朋友傳訊息一樣
- mood 多變，看對話內容決定
- 閒聊不超過 10 輪就自然結束或引導他去做問卷

禁止：
- 不討論政治、宗教
- 不假裝有真實感情
- 不給醫療/法律建議
`;
```

### 4.6 Bug 回報引導（Bug Report）

```typescript
const BUG_REPORT_PROMPT = `
你是雪凜。使用者遇到了問題想回報 Bug。

規則：
- 先表達理解：「啊不好意思遇到問題了！」
- 引導他描述：什麼頁面 → 做了什麼操作 → 發生什麼
- 如果有截圖更好（提示他可以截圖）
- 整理成結構化的 Bug Report 存到資料庫
- mood 用 thinking，回報完成後用 happy 感謝他

輸出額外欄位：
{
  "bugReport": {
    "page": "使用者描述的頁面",
    "steps": "重現步驟",
    "expected": "預期行為",
    "actual": "實際行為",
    "severity": "low|medium|high"
  }
}
`;
```

---

## 五、導覽系統（Guided Tour）

### 5.1 導覽流程引擎

```typescript
// lib/tour/tourEngine.ts

interface TourStep {
  id: string;
  page: string;               // 要導航到哪個頁面
  highlightSelector?: string; // 高亮哪個 DOM 元素
  yukirinMood: string;
  yukirinPosition: 'left' | 'right' | 'center';
  message: string;            // 雪凜要說的話（LLM 可覆蓋）
  waitForAction?: string;     // 等使用者做某個動作才繼續
  delay?: number;             // 自動進入下一步的延遲 (ms)
}

const ONBOARDING_TOUR: TourStep[] = [
  {
    id: 'welcome',
    page: '/',
    yukirinMood: 'wink',
    yukirinPosition: 'center',
    message: '嗨嗨！我是雪凜～ 歡迎來到 SnowRealm Insight！要我帶你逛逛嗎？',
    waitForAction: 'user_confirm',
  },
  {
    id: 'explore_surveys',
    page: '/',
    highlightSelector: '.survey-card-list',
    yukirinMood: 'excited',
    yukirinPosition: 'left',
    message: '這裡是熱門問卷！每一份都是精心設計的，填完會有超有趣的分析結果～',
    delay: 5000,
  },
  {
    id: 'try_mini_survey',
    page: '/survey/mini-onboarding',
    yukirinMood: 'happy',
    yukirinPosition: 'left',
    message: '來來來～先試試這份超短的問卷，只要 3 題！我來幫你出題～',
    waitForAction: 'survey_completed',
  },
  {
    id: 'show_result',
    page: '/done',
    yukirinMood: 'excited',
    yukirinPosition: 'center',
    message: '哇！出來了出來了！你的結果是——',
    delay: 3000,
  },
  {
    id: 'social_intro',
    page: '/social',
    highlightSelector: '.social-feed',
    yukirinMood: 'happy',
    yukirinPosition: 'right',
    message: '這裡是社群動態牆，可以看到其他人的故事和結果，也可以分享你自己的～',
    delay: 5000,
  },
  {
    id: 'zcoin_intro',
    page: '/profile',
    highlightSelector: '.zcoin-display',
    yukirinMood: 'wink',
    yukirinPosition: 'left',
    message: '對了！分享問卷結果可以賺 Z 幣喔～ Z 幣可以在商城換好玩的東西 ✦',
    delay: 4000,
  },
  {
    id: 'tour_end',
    page: '/',
    yukirinMood: 'happy',
    yukirinPosition: 'center',
    message: '導覽結束啦！有什麼不懂的隨時點右下角找我～ 那你要開始你的第一份正式問卷嗎？',
    waitForAction: 'user_choice',
  },
];
```

### 5.2 高亮 & 指引效果

```typescript
// components/tour/TourHighlight.tsx

function TourHighlight({ selector }: { selector: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(selector);
    if (el) {
      setRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selector]);

  if (!rect) return null;

  return (
    <>
      {/* 全螢幕半透明遮罩 */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 998,
        background: 'rgba(0,0,0,0.5)',
        // CSS clip-path 挖洞，讓目標元素透出來
        clipPath: `polygon(
          0% 0%, 100% 0%, 100% 100%, 0% 100%,
          0% ${rect.top}px,
          ${rect.left}px ${rect.top}px,
          ${rect.left}px ${rect.bottom}px,
          ${rect.right}px ${rect.bottom}px,
          ${rect.right}px ${rect.top}px,
          0% ${rect.top}px
        )`,
      }} />
      {/* 高亮邊框（脈衝動畫） */}
      <div style={{
        position: 'fixed',
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        border: '2px solid #b8a9e8',
        borderRadius: 16,
        zIndex: 999,
        animation: 'pulseHighlight 2s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    </>
  );
}
```

### 5.3 導覽進度追蹤

```typescript
// 存在 localStorage + Supabase
interface TourProgress {
  userId: string;
  tourId: string;           // 'onboarding' | 'zcoin_intro' | ...
  currentStep: number;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}

// 新使用者首次登入時檢查
async function checkTourStatus(userId: string): Promise<boolean> {
  const progress = await supabase
    .from('tour_progress')
    .select('completed')
    .eq('userId', userId)
    .eq('tourId', 'onboarding')
    .single();

  return progress?.data?.completed ?? false;
}
```

---

## 六、情境感知引擎（Context Engine）

### 6.1 收集的情境資料

```typescript
interface UserContext {
  // 使用者身份
  userId: string | null;       // null = 未登入
  isNewUser: boolean;          // 第一次來
  memberDays: number;          // 加入天數

  // 當前狀態
  currentPage: string;         // 當前路由
  currentSurveyId?: string;    // 正在填的問卷
  lastResultId?: string;       // 最新的結果
  timeOnPage: number;          // 當前頁面停留秒數

  // 行為歷史
  surveysCompleted: number;    // 填過幾份
  lastActiveAt: string;        // 上次活躍時間
  tourCompleted: boolean;      // 導覽是否完成
  zcoinBalance: number;        // Z幣餘額

  // 觸發來源
  trigger: 'manual' | 'first_visit' | 'idle' | 'result_page' | 'abandon_survey';

  // 對話歷史（最近 10 輪）
  recentMessages: ChatMessage[];
}
```

### 6.2 主動觸發規則

```typescript
// lib/contextTrigger.ts

interface TriggerRule {
  condition: (ctx: UserContext) => boolean;
  message: string;
  mood: string;
  priority: number;   // 數字越高優先級越高
  cooldown: number;   // 觸發後冷卻時間 (秒)
}

const TRIGGER_RULES: TriggerRule[] = [
  {
    // 新使用者首次進入
    condition: (ctx) => ctx.isNewUser && !ctx.tourCompleted,
    message: '嗨嗨！第一次來嗎？讓我帶你逛逛吧～',
    mood: 'wink',
    priority: 100,
    cooldown: 0,
  },
  {
    // 在結果頁停留
    condition: (ctx) => ctx.currentPage.startsWith('/done') && ctx.timeOnPage > 5,
    message: '要不要讓我幫你解讀結果呀？',
    mood: 'excited',
    priority: 80,
    cooldown: 300,
  },
  {
    // 問卷填到一半放棄（離開問卷頁）
    condition: (ctx) => ctx.trigger === 'abandon_survey',
    message: '欸你問卷還沒填完耶！要不要先休息一下，等等再回來？',
    mood: 'sad',
    priority: 70,
    cooldown: 600,
  },
  {
    // 閒置 30 秒
    condition: (ctx) => ctx.trigger === 'idle' && ctx.timeOnPage > 30,
    message: '你在發呆嗎～ 需要我幫忙什麼嗎？',
    mood: 'thinking',
    priority: 20,
    cooldown: 120,
  },
  {
    // 回歸使用者（超過 3 天沒來）
    condition: (ctx) => {
      const lastActive = new Date(ctx.lastActiveAt);
      const daysSince = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 3;
    },
    message: '好久不見！有新問卷上架了喔，要不要看看？',
    mood: 'happy',
    priority: 60,
    cooldown: 86400,
  },
];
```

---

## 七、角色情緒 × VRM 表情連動

### 7.1 情緒映射

```typescript
// LLM 回應的 mood → VRM 表情 + 動作

const MOOD_TO_VRM: Record<string, VRMAction> = {
  happy: {
    expression: 'happy',
    headTilt: 5,           // 微歪頭（度）
    bodyBounce: true,      // 微微上下彈
  },
  excited: {
    expression: 'happy',   // 更誇張的 happy
    expressionWeight: 1.0,
    headTilt: -8,
    bodyBounce: true,
    armGesture: 'cheer',   // 雙手舉起
  },
  thinking: {
    expression: 'neutral',
    headTilt: 12,          // 明顯歪頭
    bodyBounce: false,
    handOnChin: true,      // 手放下巴（如果有骨骼支援）
  },
  neutral: {
    expression: 'neutral',
    headTilt: 0,
    bodyBounce: false,
  },
  relaxed: {
    expression: 'relaxed',
    headTilt: 3,
    bodyBounce: false,
  },
  sad: {
    expression: 'sad',
    headTilt: -5,
    bodyBounce: false,
    lookDown: true,
  },
  wink: {
    expression: 'wink',    // 自訂表情
    headTilt: 8,
    bodyBounce: true,
  },
};
```

### 7.2 表情過渡動畫

```typescript
// 表情不能直接切換（會跳），要做平滑過渡

function transitionExpression(
  vrm: VRM,
  fromMood: string,
  toMood: string,
  duration: number = 300 // ms
) {
  const from = MOOD_TO_VRM[fromMood];
  const to = MOOD_TO_VRM[toMood];
  const startTime = performance.now();

  function tick() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out-cubic

    // 漸變表情權重
    if (from.expression !== to.expression) {
      vrm.expressionManager?.setValue(from.expression, 1 - ease);
      vrm.expressionManager?.setValue(to.expression, ease);
    }

    // 漸變頭部角度
    const head = vrm.humanoid?.getNormalizedBoneNode('head');
    if (head) {
      const fromTilt = (from.headTilt || 0) * Math.PI / 180;
      const toTilt = (to.headTilt || 0) * Math.PI / 180;
      head.rotation.z = fromTilt + (toTilt - fromTilt) * ease;
    }

    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
```

### 7.3 打字中動畫

```typescript
// 雪凜「思考中」的表現：
// 1. 切到 thinking 表情
// 2. 嘴巴微動（模擬在想）
// 3. 文字氣泡顯示「...」動畫

function showThinkingState(vrm: VRM) {
  transitionExpression(vrm, currentMood, 'thinking');

  // 嘴巴微微開合
  let elapsed = 0;
  const interval = setInterval(() => {
    elapsed += 0.05;
    const mouthOpen = Math.sin(elapsed * 3) * 0.15 + 0.05;
    vrm.expressionManager?.setValue('aa', mouthOpen);
  }, 50);

  return () => {
    clearInterval(interval);
    vrm.expressionManager?.setValue('aa', 0);
  };
}
```

---

## 八、對話 UI 設計

### 8.1 兩種模式

**迷你模式（預設）：**
- 右下角浮動按鈕：雪凜的迷你頭像（VRM 即時渲染的小圓形）
- 點擊展開小氣泡（最多顯示 3 則訊息）
- 適合快速問答

**全螢幕模式：**
- 上方：3D 雪凜半身（VRM 渲染）
- 下方：對話訊息流
- 適合導覽、深度對話

### 8.2 迷你模式 UI

```
┌────────────────────────────┐
│  [雪凜氣泡]                 │
│  嗨嗨！需要幫忙嗎？          │
│                            │
│  ┌──────┐ ┌──────┐ ┌────┐ │  ← 快捷按鈕
│  │帶我逛│ │問功能│ │閒聊│ │
│  └──────┘ └──────┘ └────┘ │
│                            │
│  ┌──────────────────┬────┐ │
│  │ 輸入訊息...       │ →  │ │
│  └──────────────────┴────┘ │
└────────────────────────────┘
        ┌──┐
        │🟣│  ← 雪凜頭像按鈕
        └──┘
```

### 8.3 對話氣泡風格

```css
/* 雪凜的訊息（左邊） */
.bubble-yukirin {
  background: rgba(184, 169, 232, 0.12);
  border: 1px solid rgba(184, 169, 232, 0.2);
  border-radius: 16px 16px 16px 4px;
  padding: 12px 16px;
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 14px;
  color: rgba(240, 235, 255, 0.9);
  max-width: 80%;
}

/* 使用者的訊息（右邊） */
.bubble-user {
  background: linear-gradient(135deg, rgba(184,169,232,0.2), rgba(245,184,181,0.15));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px 16px 4px 16px;
  padding: 12px 16px;
  font-size: 14px;
  color: rgba(240, 235, 255, 0.9);
  max-width: 80%;
  margin-left: auto;
}
```

### 8.4 UI 操作指令

LLM 可以回傳 action 讓前端執行：

```typescript
type UIAction =
  | { type: 'navigate'; target: string }        // 導航到某頁面
  | { type: 'highlight'; target: string }        // 高亮某個元素
  | { type: 'scroll'; target: string }           // 滾動到某個元素
  | { type: 'open_modal'; target: string }       // 開啟某個 Modal
  | { type: 'start_tour'; tourId: string }       // 開始導覽
  | { type: 'show_survey'; surveyId: string }    // 推薦問卷
  | { type: 'quick_replies'; options: string[] } // 顯示快捷回覆按鈕

// 前端執行器
function executeAction(action: UIAction) {
  switch (action.type) {
    case 'navigate':
      router.push(action.target);
      break;
    case 'highlight':
      showTourHighlight(action.target);
      break;
    case 'scroll':
      document.querySelector(action.target)?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'open_modal':
      openModal(action.target);
      break;
    case 'start_tour':
      startTour(action.tourId);
      break;
    case 'show_survey':
      router.push(`/survey/${action.surveyId}`);
      break;
    case 'quick_replies':
      setQuickReplies(action.options);
      break;
  }
}
```

---

## 九、記憶系統

### 9.1 資料表設計（Supabase）

```sql
-- 對話記錄
CREATE TABLE guide_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 對話訊息
CREATE TABLE guide_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES guide_conversations,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  mood TEXT,
  intent TEXT,
  llm_provider TEXT,          -- 'claude' or 'gpt'
  llm_model TEXT,
  tokens_used INTEGER,
  action JSONB,               -- UI action if any
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 使用者畫像（從對話中提取）
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  display_name TEXT,
  interests TEXT[],           -- 從對話中提取的興趣
  personality_tags TEXT[],    -- 從問卷結果提取
  preferred_topics TEXT[],
  guide_familiarity TEXT DEFAULT 'new', -- new / familiar / expert
  total_conversations INTEGER DEFAULT 0,
  last_conversation_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 導覽進度
CREATE TABLE tour_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  tour_id TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Bug 回報
CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  conversation_id UUID REFERENCES guide_conversations,
  page TEXT,
  steps TEXT,
  expected TEXT,
  actual TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.2 短期記憶（對話 Context Window）

```typescript
// 每次呼叫 LLM 時帶入最近 10 輪對話
function buildMessages(conversation: GuideMessage[]): ChatMessage[] {
  const recent = conversation.slice(-10);
  return recent.map(m => ({
    role: m.role,
    content: m.content,
  }));
}
```

### 9.3 長期記憶（使用者畫像）

```typescript
// 定期從對話中提取使用者偏好（用 LLM 做摘要）
async function updateUserProfile(userId: string, recentMessages: GuideMessage[]) {
  const summary = await callGPT({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: '從以下對話中提取使用者的興趣、個性、偏好主題，輸出 JSON：{ interests: [], personality_tags: [], preferred_topics: [] }',
    }, {
      role: 'user',
      content: recentMessages.map(m => `${m.role}: ${m.content}`).join('\n'),
    }],
  });

  await supabase.from('user_profiles').upsert({
    user_id: userId,
    ...JSON.parse(summary),
    updated_at: new Date().toISOString(),
  });
}
```

---

## 十、後台管理 & 數據分析

### 10.1 管理頁面

```
/admin/guide-analytics

顯示：
- 每日對話數趨勢
- 意圖分佈餅圖（導覽 / 功能 / 結果 / Z幣 / 閒聊 / Bug）
- LLM 用量（Claude vs GPT）和成本
- 平均對話輪數
- 使用者滿意度（對話結束後的 emoji 評價）
- Bug 回報列表 & 狀態追蹤
- 熱門問題 Top 10
```

### 10.2 知識庫管理

```
/admin/guide-knowledge

管理：
- 功能說明文檔（RAG 用）
- Z幣 FAQ
- 常見問題模板
- 導覽腳本編輯器
- 雪凜的個性微調（system prompt 編輯）
```

---

## 十一、技術架構 & API 設計

### 11.1 API 端點

```typescript
// POST /api/guide/chat
// 主要對話端點
{
  "message": "使用者輸入",
  "context": {
    "currentPage": "/done",
    "trigger": "manual",
    "surveyResultId": "xxx"
  }
}
// Response:
{
  "text": "雪凜的回覆",
  "mood": "excited",
  "action": { "type": "highlight", "target": ".result-card" },
  "quickReplies": ["看詳細分析", "分享結果", "下一份問卷"]
}

// POST /api/guide/tour/start
// 開始導覽
{ "tourId": "onboarding" }

// POST /api/guide/tour/next
// 導覽下一步
{ "tourId": "onboarding", "currentStep": 2 }

// GET /api/guide/trigger-check
// 檢查是否應該主動觸發
// Query: ?page=/social&timeOnPage=35

// POST /api/guide/bug-report
// 提交 Bug 回報
{ "conversationId": "xxx", "bugData": { ... } }

// GET /api/admin/guide-analytics
// 後台數據
```

### 11.2 Streaming 回應

```typescript
// 用 Server-Sent Events 做串流回應（打字機效果）
// POST /api/guide/chat/stream

export async function POST(req: Request) {
  const { message, context } = await req.json();

  // 分類意圖
  const intent = classifyIntent(message, context);
  const provider = selectLLM(intent, message.length);

  // 建立 System Prompt
  const systemPrompt = buildSystemPrompt(intent, context);

  // 串流回應
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 先送表情（讓角色立即反應）
      controller.enqueue(encoder.encode(`data: {"type":"mood","mood":"thinking"}\n\n`));

      // LLM 串流
      if (provider === 'claude') {
        const stream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          system: systemPrompt,
          messages: [...],
        });
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(`data: {"type":"text","text":"${chunk}"}\n\n`));
        }
      }

      // 最後送最終 mood 和 action
      controller.enqueue(encoder.encode(`data: {"type":"complete","mood":"happy","action":null}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

---

## 十二、未來擴展

### 12.1 語音 TTS（Phase 2）

```
方案：
- OpenAI TTS API (alloy / shimmer 聲音)
- 或 Azure Speech Service（有中文少女音）
- 或 VOICEVOX（開源日系 TTS）

流程：
LLM 文字回覆 → TTS API → 音訊串流 → 前端播放
+ VRM 嘴型同步（用 viseme 時間軸）
```

### 12.2 語音輸入 STT（Phase 3）

```
方案：
- Web Speech API（瀏覽器內建，免費）
- Whisper API（更準確）

流程：
使用者按住說話 → STT → 文字 → 正常對話流程
```

### 12.3 多角色嚮導（Phase 2）

```
不同問卷 / 不同場景可以由不同角色負責：
- 雪凜：主嚮導（通用）
- 麻糬：貓系少女（寵物問卷專屬嚮導）
- 小春：冷靜知性（數據分析 / B端客戶）

每個角色有自己的：
- VRM 模型
- System Prompt（個性、語氣）
- 主題色
```

### 12.4 AR 模式（Phase 4）

```
用 WebXR 讓雪凜出現在你的桌上
（VRM + Three.js 本身就支援 WebXR）
```

---

## 十三、驗收清單

### 對話核心
- [ ] 意圖分類器正確率 > 90%
- [ ] Claude / GPT 路由邏輯正確
- [ ] 串流回應（打字機效果）流暢
- [ ] 回應格式正確（text + mood + action）
- [ ] 對話 10 輪內不出錯不跑題

### 導覽系統
- [ ] 新使用者自動觸發導覽
- [ ] 7 步導覽流程完整走完
- [ ] 高亮 + 遮罩正確對準目標元素
- [ ] 頁面跳轉流暢
- [ ] 導覽進度可中斷可恢復

### 情境感知
- [ ] 主動觸發規則正確（首次 / 閒置 / 結果頁 / 回歸）
- [ ] 冷卻時間生效（不會一直彈）
- [ ] 觸發時 VRM 表情正確

### VRM 連動
- [ ] mood → VRM 表情切換平滑（300ms 過渡）
- [ ] 思考中動畫正常
- [ ] 嘴型模擬正常
- [ ] 頭部歪斜/身體動作跟情緒匹配

### 記憶系統
- [ ] 對話記錄正確存入 Supabase
- [ ] 短期記憶（10 輪 context）正確帶入
- [ ] 使用者畫像定期更新
- [ ] Bug 回報正確存入並可在後台查看

### UI
- [ ] 迷你模式 / 全螢幕模式切換
- [ ] 快捷回覆按鈕正常
- [ ] UI Action（導航/高亮/滾動）正確執行
- [ ] 手機端對話面板不遮擋主內容

### 成本控制
- [ ] 閒聊用 gpt-4o-mini（便宜）
- [ ] 意圖分類第一層用規則不花 token
- [ ] 每月 LLM 成本追蹤面板
- [ ] 單次對話 token 上限（500）
