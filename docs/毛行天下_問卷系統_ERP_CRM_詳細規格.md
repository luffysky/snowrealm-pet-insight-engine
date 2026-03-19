# 毛行天下問卷系統 + ERP + CRM 詳細規格書

版本：v1.0  
定位：獨立專案，可部署至 Zeabur，作為毛行天下前期市場驗證、資料收集、用戶分群與營運分析入口。

---

## 一、專案目標

這個專案不是單純做一份問卷，而是建立一個可持續運作的「資料收集與營運洞察系統」。

核心目的有四個：

1. 驗證毛行天下的第一批真實需求，而不是只靠想像做產品。
2. 透過問卷收集早期用戶資料，建立基礎 CRM 標籤。
3. 讓後台可以直接看數據、看分佈、看趨勢，而不是人工整理表單。
4. 為未來毛行天下主站、會員系統、社群系統、商城、彩虹國與足跡系統鋪資料基礎。

一句話定義：

> 這是一套以問卷為入口、以 CRM 為中樞、以 ERP 洞察為管理層的前期驗證引擎。

---

## 二、專案定位

### 1. 為什麼要獨立成專案

問卷專案建議獨立，不直接綁進毛行天下主站，原因如下：

- 可快速部署，不拖慢主站開發。
- 可快速改版，不影響正式產品。
- 可獨立測試流量與投放來源。
- 可用於未來其他 SnowRealm 子專案。
- 可單獨建立資料模型與後台，不污染主系統。

### 2. 使用場景

- 問卷連結發布到 IG、FB 社團、Dcard、Line 群、朋友轉發。
- 受訪者填寫問卷。
- 系統自動儲存答案。
- 系統自動分析答案並打標籤。
- 後台即時查看數據。
- 後續把高價值受眾導流到毛行天下主站、候補名單或封測名單。

---

## 三、產品核心策略

你的策略是：**主 B 副 A**。

翻譯成產品原則就是：

### 第一優先：B
- 問卷能順利填寫。
- 資料能穩定送出。
- 後台能即時看數據。
- 系統能上線。
- 網址能丟出去開始收資料。

### 第二優先：A
- UI 有品牌感。
- 問卷有體驗感。
- 後台乾淨好看。
- 互動流暢，但不影響開發速度。

也就是說：

> 先活，再帥。先收資料，再優化藝術。

---

## 四、整體系統架構

```txt
[流量來源]
IG / Dcard / 社團 / 群組 / 私訊 / 主站導流
        ↓
[Survey 問卷前台]
封面頁 → 題目頁 → 提交 → 完成頁
        ↓
[API / 分析層]
儲存答案 → 分析邏輯 → 產生 tags → 寫入資料庫
        ↓
[CRM 層]
使用者標籤 / 分群 / 行為分類 / 興趣分類 / 情感分類
        ↓
[ERP / Admin Dashboard]
總填寫數 / 完成率 / 題目統計 / 標籤分佈 / 投放來源 / 明細查詢
        ↓
[後續應用]
毛行天下封測名單 / 行銷分群 / 產品優先級決策 / 功能驗證
```

---

## 五、技術選型

### 建議技術棧

- Frontend：Next.js（App Router）
- Backend：Next.js Route Handlers / API Routes
- Database：Supabase PostgreSQL
- Auth：先不強制登入，後台再做簡易保護
- Charts：Recharts
- Styling：Tailwind CSS 或 CSS Modules
- Deploy：Zeabur

### 技術原則

- 一個 repo 完成前後台，不拆微服務。
- 先不用複雜 RBAC。
- 先不用 AI 分析模型。
- 先用規則式標籤邏輯。
- 先確保可部署、可提交、可看數據。

---

## 六、資訊架構（IA）

### 前台頁面

#### 1. `/`
可作為導流首頁或直接當問卷封面頁。

內容：
- 核心標題
- 鉤子文案
- 開始按鈕
- 簡短說明（1~2 句）

#### 2. `/survey`
正式問卷流程頁。

功能：
- 一題一頁
- 單選 / 多選 / 開放題
- 進度條
- 自動保存目前 step（可選）
- 送出後跳完成頁

#### 3. `/done`
問卷完成頁。

功能：
- 感謝填答
- 情緒收尾文案
- CTA 導流（關注毛行天下、留下 email、加入候補）

### 後台頁面

#### 4. `/admin`
後台總覽頁。

功能：
- 總填寫數
- 完成率
- 今日填寫數
- 最近 7 天趨勢
- 各題分佈
- 主要 tags 分佈
- 投放來源概覽（若有 UTM）

#### 5. `/admin/responses`
填答列表頁。

功能：
- 列表瀏覽
- 時間排序
- 篩選條件
- 點入單筆詳情

#### 6. `/admin/responses/[id]`
單筆填答詳情頁。

功能：
- 原始答案
- 分析後 tags
- 來源資訊
- 基本摘要

#### 7. `/admin/tags`
標籤統計頁。

功能：
- 各 tag 分佈
- 可看情感層、寵物類型、付費傾向等

#### 8. `/admin/utm`
來源分析頁（第二階段）。

功能：
- 各流量來源填寫數
- 各來源完成率
- 哪個平台來的人最有價值

---

## 七、問卷 UI / UX 設計規格

### 設計方向：微科技液態玻璃風（FlowLight Glass）

這套問卷風格不是為了炫，而是為了三件事：

1. 降低「被填表」的壓力。
2. 提升完成率。
3. 建立毛行天下 / SnowRealm 的世界觀印象。

### 視覺氣質

- 安靜
- 溫柔
- 未來感
- 半透明
- 有流光感但不刺眼

### 視覺元素

#### 背景
- 深藍、深紫、深青藍漸層
- 可有低強度粒子飄動
- 不要高頻動畫，不要像夜店

#### 問卷主卡
- 半透明玻璃卡片
- backdrop blur
- 淡淡邊框
- 大圓角
- 微弱發光

#### 選項卡片
- 卡片式按鈕
- hover 微亮
- selected 狀態更明顯
- 支援手機大拇指操作

#### 進度條
- 頂部細長條
- 顯示目前進度
- 不必誇張動畫，但要清楚

### UX 原則

1. 一題一頁。
2. 題數控制在 10~12 題內。
3. 單選題點選即前進。
4. 多選題才保留下一步按鈕。
5. 開放題可選填或放最後。
6. 問卷節奏先輕後深，不要第一題就戳心臟。

### 推薦流程

```txt
封面頁
→ Q1 基本狀態
→ Q2 寵物類型
→ Q3 紀錄習慣
→ Q4 回看頻率
→ Q5 情感擔憂
→ Q6 真正害怕什麼
→ Q7 平台興趣
→ Q8 付費意願
→ Q9 功能偏好
→ Q10 使用頻率
→ Q11 開放題
→ Q12 開放題
→ 完成頁
```

### 封面文案

主標題：

> 如果有一天牠不在了，你還能留下什麼？

副標：

> 我們正在設計一個真正能留下寵物足跡的地方。這份問卷不長，但你的回答，可能會幫助更多人留下重要的回憶。

開始按鈕文字：
- 開始留下足跡
- 開始填寫

### 完成頁文案

標題：

> 你已經為牠留下了第一個足跡。

補充：

> 謝謝你的回答。毛行天下想做的，不只是紀錄，而是讓那些重要的存在，不那麼容易被時間沖淡。

CTA：
- 關注毛行天下
- 等待平台上線
- 加入封測名單（第二階段）

---

## 八、問卷內容設計（MVP）

### A. 基本資料層

#### Q1. 你目前是否有飼養寵物？
- 有
- 曾經有（已離世）
- 沒有但未來想養
- 沒有且暫時不考慮

#### Q2. 你的寵物類型是？（可複選）
- 狗
- 貓
- 倉鼠 / 小動物
- 鳥類
- 水族
- 爬蟲
- 其他

### B. 行為層

#### Q3. 你平常會怎麼記錄寵物生活？（可複選）
- 拍照存在手機
- 發 IG / FB / 社群
- 寫日記 / 筆記
- 存在雲端相簿
- 幾乎不記錄

#### Q4. 你多久會回頭看一次寵物照片或影片？
- 幾乎每天
- 一週幾次
- 偶爾
- 幾乎不會

### C. 情感層

#### Q5. 你是否曾經擔心，未來會忘記與寵物的重要回憶？
- 非常擔心
- 有點擔心
- 沒想過
- 不太在意

#### Q6. 如果寵物離開，你最害怕的是什麼？
- 回憶慢慢變模糊
- 沒有地方好好紀念
- 身邊沒人理解這種感受
- 突然失去生活重心
- 其他（開放填寫）

### D. 核心需求驗證層

#### Q7. 如果有一個平台可以保存寵物的一生紀錄，甚至在某種程度上延續互動，你會有興趣嗎？
- 非常有興趣
- 可能會試試
- 不確定
- 沒興趣

#### Q8. 對這種服務，你比較可能接受哪種付費方式？
- 月費訂閱
- 一次性付費
- 免費基本版 + 進階付費
- 不確定
- 不會付費

#### Q9. 以下功能你最有興趣的是哪些？（最多選 3 個）
- 寵物成長紀錄
- 足跡時間線
- AI 寵物互動
- 彩虹國紀念空間
- 寵物社群交流
- 認養 / 流浪動物資訊
- 商城 / 周邊

#### Q10. 如果毛行天下是一個平台，你會多常使用？
- 每天
- 每週
- 偶爾
- 可能只用幾次
- 幾乎不會用

### E. 開放題

#### Q11. 你覺得現在記錄寵物生活最大的問題是什麼？
文字回答

#### Q12. 如果只能留下與牠有關的一樣東西，你會選擇留下什麼？
文字回答

---

## 九、CRM 設計

### CRM 的定位

這裡的 CRM 不是拿來管業務客戶，而是拿來理解問卷受眾。

也就是：

> 這是一套以「受眾標籤化」為核心的用戶理解系統。

### CRM 目標

- 建立使用者基礎輪廓
- 建立情感分群
- 建立產品興趣分群
- 建立潛在付費傾向分群
- 建立後續導流依據

### 標籤類型

#### 1. 基本類
- pet_owner_status = current / past / future / none
- pet_type = dog / cat / hamster / bird / etc

#### 2. 情感類
- emotion_level = high / medium / low
- loss_status = true / false
- memorial_need = high / medium / low

#### 3. 行為類
- record_habit = active / medium / low
- revisit_frequency = daily / weekly / occasional / rare

#### 4. 產品興趣類
- interest_memory = true / false
- interest_ai = true / false
- interest_social = true / false
- interest_adoption = true / false
- interest_shop = true / false

#### 5. 商業傾向類
- payment_intent = subscription / one_time / freemium / unsure / no
- engagement_potential = high / medium / low

### 標籤生成規則（MVP 先寫死）

範例：

- 若 Q5 = 非常擔心 → emotion_level = high
- 若 Q1 = 曾經有（已離世） → loss_status = true
- 若 Q9 有選彩虹國 → interest_memory = true 且 memorial_need = high
- 若 Q10 = 每天 / 每週 → engagement_potential = high / medium
- 若 Q8 = 月費訂閱 → payment_intent = subscription

### CRM 可延伸功能

- 匯出 CSV
- 篩選高情感高付費群
- 找出最適合做第一波封測邀請的受眾
- 後續串接 email 名單或社群名單

---

## 十、ERP / Admin 後台設計

### ERP 在這個專案的真正意義

這裡的 ERP 不是傳統企業資源規劃全模組，而是「營運管理後台」。

也就是：

> 用來統整問卷營運數據、來源數據、分群數據與早期決策依據的管理層。

### 核心模組

#### 1. 總覽 Dashboard
顯示：
- 問卷總提交數
- 完整填寫數
- 完成率
- 今日填寫數
- 最近 7 日趨勢
- 前三大高興趣功能
- 主要情感分佈

#### 2. 問題統計模組
顯示每題分佈：
- 單選題比例
- 多選題次數
- 開放題列表

#### 3. CRM 標籤模組
顯示：
- 各 tag 數量
- 情感型受眾比例
- 付費意願比例
- 離世寵物經驗比例

#### 4. 填答明細模組
顯示：
- 單筆回答
- 時間
- 來源
- tags
- 是否完整填寫

#### 5. 流量來源模組（第二階段）
顯示：
- utm_source
- utm_medium
- utm_campaign
- 哪個來源完成率較高
- 哪個來源情感分數較高

#### 6. 封測名單模組（第三階段）
若未來加 email 或聯絡方式，可做：
- 高價值名單列表
- 封測邀請清單
- 願意接受通知的用戶清單

---

## 十一、資料庫設計

### 1. surveys

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| title | text | 問卷標題 |
| slug | text | 路由識別 |
| status | text | draft / published / archived |
| created_at | timestamptz | 建立時間 |
| updated_at | timestamptz | 更新時間 |

### 2. questions

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| survey_id | uuid | 所屬問卷 |
| key | text | 題目 key，例如 q1 |
| type | text | single / multiple / text |
| content | text | 題目內容 |
| options | jsonb | 選項資料 |
| order_index | int | 排序 |
| is_required | boolean | 是否必填 |
| created_at | timestamptz | 建立時間 |

### 3. responses

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| survey_id | uuid | 所屬問卷 |
| session_id | text | 匿名 session |
| user_id | uuid nullable | 若未來串會員 |
| status | text | in_progress / completed |
| source | text | 來源平台 |
| utm_source | text | UTM source |
| utm_medium | text | UTM medium |
| utm_campaign | text | UTM campaign |
| started_at | timestamptz | 開始時間 |
| submitted_at | timestamptz | 提交時間 |
| created_at | timestamptz | 建立時間 |

### 4. answers

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| response_id | uuid | 所屬填答 |
| question_id | uuid | 題目 |
| question_key | text | 題目代碼 |
| value | jsonb | 答案內容 |
| created_at | timestamptz | 建立時間 |

### 5. user_tags

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| response_id | uuid | 對應填答 |
| user_id | uuid nullable | 若未來串會員 |
| tag_key | text | 標籤名稱 |
| tag_value | text | 標籤值 |
| created_at | timestamptz | 建立時間 |

### 6. admin_users（可選）

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid | 主鍵 |
| email | text | 後台登入帳號 |
| role | text | admin |
| created_at | timestamptz | 建立時間 |

---

## 十二、API 設計

### 1. 取得問卷
`GET /api/surveys/:slug`

用途：
- 前台載入問卷題目

### 2. 提交問卷
`POST /api/surveys/submit`

用途：
- 接收整份回答
- 寫入 responses
- 寫入 answers
- 執行 analyzeResponse
- 寫入 user_tags

請求 body 範例：

```json
{
  "survey_slug": "maoxingtianxia-mvp-survey",
  "answers": [
    { "question_key": "q1", "value": "有" },
    { "question_key": "q5", "value": "非常擔心" }
  ],
  "utm": {
    "source": "instagram",
    "medium": "story",
    "campaign": "mvp-test-1"
  }
}
```

### 3. 取得後台統計
`GET /api/admin/stats`

用途：
- Dashboard 資料

### 4. 取得題目統計
`GET /api/admin/questions`

用途：
- 各題回答分佈

### 5. 取得填答列表
`GET /api/admin/responses`

用途：
- 列表、分頁、篩選

### 6. 取得單筆填答
`GET /api/admin/responses/:id`

用途：
- 看單筆答案與 tags

### 7. 取得 tag 分佈
`GET /api/admin/tags`

用途：
- 看 CRM 分群

---

## 十三、分析引擎設計

### analyzeResponse() 的角色

這個函式是系統靈魂之一。

它負責把「答案」轉成「標籤」。

### MVP 原則

- 不用 AI
- 不做 NLP
- 先用規則式 if/else

### 範例規則

```ts
if (q1 === '曾經有（已離世）') {
  tags.push({ key: 'loss_status', value: 'true' })
}

if (q5 === '非常擔心') {
  tags.push({ key: 'emotion_level', value: 'high' })
}

if (q8 === '月費訂閱') {
  tags.push({ key: 'payment_intent', value: 'subscription' })
}

if (q10 === '每天') {
  tags.push({ key: 'engagement_potential', value: 'high' })
}
```

### 後續進階方向

- 開放題做關鍵字分類
- AI 協助生成情感摘要
- 自動推薦封測名單

---

## 十四、後台視覺設計原則

後台不需要液態玻璃搞到眼花。

建議風格：
- 深色系或霧面淺色系
- 乾淨卡片
- 清楚數字
- 圖表直觀
- 易讀優先

### Dashboard 區塊建議

#### 第一排：KPI 卡片
- 總填寫數
- 完成率
- 今日新增
- 高情感比例

#### 第二排：趨勢圖
- 最近 7 天填寫趨勢

#### 第三排：功能偏好
- Q9 前三大興趣功能

#### 第四排：標籤分佈
- emotion_level
- payment_intent
- loss_status

#### 第五排：最近填答
- 最新 10 筆摘要

---

## 十五、專案目錄建議

```txt
/app
  /(public)
    /page.tsx
    /survey/page.tsx
    /done/page.tsx
  /(admin)
    /admin/page.tsx
    /admin/responses/page.tsx
    /admin/responses/[id]/page.tsx
    /admin/tags/page.tsx

/components
  survey/
    SurveyShell.tsx
    SurveyCard.tsx
    ProgressBar.tsx
    QuestionSingle.tsx
    QuestionMultiple.tsx
    QuestionText.tsx
  admin/
    StatCard.tsx
    ChartBlock.tsx
    ResponseTable.tsx
    TagChart.tsx

/lib
  supabase.ts
  analyzeResponse.ts
  surveyConfig.ts
  stats.ts

/app/api
  /surveys/[slug]/route.ts
  /surveys/submit/route.ts
  /admin/stats/route.ts
  /admin/questions/route.ts
  /admin/responses/route.ts
  /admin/responses/[id]/route.ts
  /admin/tags/route.ts
```

---

## 十六、開發順序建議

### Phase 1：先活（1~2 天）

目標：能填、能送、能部署

內容：
- 問卷前台頁
- 題目寫死
- submit API
- Supabase 寫入
- Zeabur 部署

### Phase 2：能看（1~2 天）

目標：後台有最基本洞察

內容：
- /admin dashboard
- 總填寫數
- 完成率
- 每題統計
- 最近填答列表

### Phase 3：能分群（1 天）

目標：CRM 開始有用

內容：
- analyzeResponse
- user_tags
- tag 統計頁

### Phase 4：能投放（1 天）

目標：知道哪裡來的人比較值錢

內容：
- UTM 參數帶入
- source 儲存
- 來源統計頁

### Phase 5：能轉化（第二階段）

目標：收名單、導流主站

內容：
- 完成頁 CTA
- 封測候補名單
- email / 社群追蹤收集

---

## 十七、Zeabur 部署規劃

### 專案形式

- 單一 Next.js 專案
- GitHub repo 連接 Zeabur
- 使用環境變數接 Supabase

### 必要環境變數

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SECRET=
```

### 部署步驟

1. 建立 GitHub repo
2. push 程式
3. 到 Zeabur 建立新專案
4. 匯入 GitHub repo
5. 設定環境變數
6. 部署
7. 取得網址
8. 測試前台填寫與後台讀取

---

## 十八、權限與安全

### 前台
- 匿名可填
- 前台 API 必須做基本驗證
- 限制欄位格式
- 可加簡單 rate limit（第二階段）

### 後台
- 至少做簡單 admin 保護
- 可先用 middleware + ADMIN_SECRET
- 第二階段再改為正式登入

### 資料層
- 不存過多敏感資訊
- 先不收身份證、地址、電話
- 若收 email，需加明確用途說明

---

## 十九、KPI 與成功指標

### 第一階段 KPI
- 成功部署上線
- 問卷可正常提交
- 後台可正常讀數
- 收到第一份有效資料

### 第二階段 KPI
- 50 份問卷
- 完成率 ≥ 30%
- 看出前三大功能需求
- 看出主要情感受眾比例

### 第三階段 KPI
- 100 份問卷
- 有明確高價值受眾輪廓
- 知道哪個來源最有效
- 能支撐毛行天下 MVP 優先順序判斷

---

## 二十、這套系統真正的價值

這套系統的價值，不只是問卷。

它真正的價值是：

1. 把「感覺」變成「數據」。
2. 把「使用者故事」變成「分群」。
3. 把「你腦中的產品想像」變成「可驗證的決策」。
4. 幫毛行天下在正式上線前，就先知道誰會留下、誰會付費、誰最在意足跡與紀念。

換句話說：

> 這是毛行天下在正式出征前的前哨站，不華麗，但很致命。

