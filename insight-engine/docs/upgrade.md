# Insight Engine（毛行天下問卷系統）— 可以升級的地方

> 2026-08-18 寫。作者讀過 `src/`、`supabase/migrations/`、`middleware.ts`
> 與資料存取層之後的判斷，不是複述 README。
>
> 對照組是 `D:\SnowRealmRebirth\1page`。

---

## 一、這個專案在做什麼、現在到哪裡

「以問卷為入口、以 CRM 為中樞、以 ERP 洞察為管理層」的驗證引擎。
規模比名字聽起來大得多：

```text
114 個頁面、272 個 API route、590 個 TS/TSX 檔、27 份 migration、58 張表
問卷流程、洞察引擎、CRM、LINE 官方帳號整合（bot / notify / LIFF）、
社群 DM、廣告引擎、每日任務、自動化引擎、TipTap 編輯器、
3D VRM、影片處理（ffmpeg）、Puppeteer 截圖、satori OG 圖
```

**寫得好的部分要先講**，因為它決定了下面的判斷：

```text
資料存取     src/lib/db.ts 用 pg Pool + **參數化查詢**。
             全專案 0 處字串拼接的 SQL——272 個 route 沒有一個踩注入
後台驗證     middleware 用 JWT + httpOnly cookie，還有自動續期與速率限制
```

那 0 處字串拼接不是運氣。有人一開始就把 `query(text, params)` 包好了，
而且 272 個 route 都照著用。

**問題出在另一層。**

---

## 二、最該先修的三件事

### 1. 🔴 58 張表，**一條 RLS 都沒有**——而 anon key 是 `NEXT_PUBLIC_`

27 份 migration 裡，`enable row level security` 出現 **0 次**。

同時 `src/lib/supabase.ts` 讀 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，
而 `NEXT_PUBLIC_` 前綴的意思就是：**它被編進每一個訪客載入的 JS**。

這兩件事加起來的後果是具體的。這個 Supabase 實例掛在
`snowrealm-pet-insight-engine.zeabur.app`——一個公開網域。
自架 Supabase 的 PostgREST 預設就在 `/rest/v1/` 對外。
如果那個端點對外通，那麼：

```text
任何人打開 devtools 拿到 anon key
→ 直接打 /rest/v1/<任何一張表>
→ 沒有 RLS 擋，58 張表全部可讀可寫
```

而那 58 張表裡有**問卷填答**——那是別人填給你的個人資料。

middleware 的 JWT 完全幫不上忙：它守的是 Next.js 的路由，
不是資料庫。攻擊者根本不會經過你的應用程式。

**⚠️ 這一條要你自己先確認再修**（我沒有去打那個線上端點）：

```bash
# 用 .env.local.example 裡那把 anon key 打自己的實例
curl "https://<你的 supabase 網域>/rest/v1/survey_responses?select=id&limit=1" \
  -H "apikey: <anon key>" -H "Authorization: Bearer <anon key>"
```

回 200 加一筆資料 = 現在就是外洩狀態，要立刻處理。
回 404 / 401 = PostgREST 沒對外，風險降一級，但下面的修法還是要做。

**修法，兩個方向，建議都做**：

```text
A. 拔掉那把用不到的鑰匙（今天就能做，成本近乎零）
   getSupabase()（anon client）在整個 src 裡**只有定義，沒有任何呼叫點**。
   應用程式實際走的是 pg Pool 直連。
   也就是說：你把一把「拿到就能存取整個資料庫」的鑰匙
   發給每一位訪客，而自己一次都沒用過它。
   刪掉 src/lib/supabase.ts，把 NEXT_PUBLIC_SUPABASE_ANON_KEY
   從環境變數移除。曝光面直接歸零。

B. 補 RLS（正確但要花時間）
   58 張表逐一決定。大多數應該是「只有 service_role 能碰」——
   因為應用程式本來就走伺服器端直連。那種表的 policy 是：
     alter table <t> enable row level security;
   （啟用但不建 policy，等於除了 service_role 誰都碰不到）
   刻意要對外開放的（例如問卷本身的題目）才寫 policy，並寫下理由。
```

⚠️ A 是止血，B 是治本。**只做 A 的話**，哪天有人為了做即時功能
把 anon client 加回來，洞就一起回來了——所以 A 做完要加一條守衛：
`NEXT_PUBLIC_SUPABASE_ANON_KEY` 不得出現在 `src/`。

### 2. 🔴 `.env.local.example` 用的是 Supabase 自架版的**示範金鑰**

檔案裡那兩把 key 解出來是：

```json
anon    {"role":"anon",        "iss":"supabase-demo", ...}
service {"role":"service_role","iss":"supabase-demo", ...}
```

`iss: supabase-demo` 是 Supabase 官方 docker-compose 附的**示範金鑰**，
而簽它們的 JWT secret 是**公開文件裡寫死的那一串**。

意思是：如果線上實例還在用預設的 `JWT_SECRET`，
**任何人都可以自己簽一張 `service_role` 的 token**——不需要偷你的 key，
照著官方文件簽就好。而 service_role 繞過所有 RLS，
所以第 1 點就算補完也擋不住。

`ADMIN_SECRET` 那一串 64 位十六進位看起來像真的值，也一起換掉。

好消息是 `.env.local.example` **沒有進版控**（`git ls-files` 查過），
所以不是 repo 洩漏。但檔案裡放真值仍然是壞習慣——
1page 那邊的做法是 `.env.example` 只放 key 的**名字**與一行說明，
值一律留空，由使用者自己填。

⚠️ **這一條要你自己做**：換 Zeabur 上那個 Supabase 實例的
`JWT_SECRET`，重新產生 anon / service_role，然後更新所有用到的地方。
順序是先產新的、再換服務、最後才作廢舊的。

### 3. 零測試——590 個檔案、272 個 route，一條測試都沒有

`package.json` 裡沒有任何測試框架。而這個專案裡有：

```text
insightEngine.ts / cognitiveGapEngine.ts   分析引擎，輸出會影響給客戶的結論
automationEngine.ts / dailyTaskEngine.ts   會自己觸發動作的東西
lineBotEngine.ts / lineNotify.ts           會真的把訊息送到別人手機上
adEngine.ts                                廣告
```

第三組最該先測：**一個會自己發訊息的引擎，改壞的方式是「發錯人」或
「發十次」**，而那兩件事都不會報錯。

⚠️ 不要從覆蓋率開始。從**這一條**開始：

```text
給定一組已知的填答 → insightEngine 產出的結論是預期的那一個
```

因為那是這個產品賣的東西。它安靜地算錯的話，
客戶拿到的是一份看起來很專業的錯結論。

---

## 三、可以從 1page 搬過去的（已經驗證過，不是想法）

```text
「反過來問」型的守衛      anon client 那件事就是典型：
                         不要問「有沒有人用它」，要問
                         「宣告了的東西裡有沒有哪一個沒人用」。
                         1page 靠這個形狀的守衛抓過六次
表級接線稽核             58 張表幾乎一定有孤兒。問
                         「這張表名有沒有在原始碼裡出現過」
RLS 邊界測試             不經過任何前端程式碼，直接拿 anon key 打 REST，
                         斷言「讀得到零筆」。1page 的 tests/db/rls.test.ts
                         就是這個。**這種測試不可以靜默跳過**——
                         安全測試被跳過比沒有測試更危險
.env.example 只放名字     值一律留空，附一行說明從哪裡拿。
                         範例檔放真值遲早會被複製到別的地方
故意改壞驗守衛           每加一個守衛就把程式改壞一次
```

---

## 四、不建議做的事

```text
❌ 把 pg 直連換成 Supabase client   現在這個做法是對的，而且參數化做得徹底。
                                   換過去只會多一層抽象，還會把
                                   「RLS 沒開」這件事從明顯變成隱藏

❌ 大重構 / 拆模組                  590 個檔案看起來該拆，但在有測試之前
                                   拆任何東西都是在賭。先有安全網

❌ 現在做 SSO                       見 SnowRealm-Platform 的規劃。
                                   而且這個專案的 auth 是自己的 JWT，
                                   不是 GoTrue——遷移成本要另外算

❌ 補 CI                            在有測試之前，CI 只會跑 lint。
                                   先有值得跑的東西
```

---

## 五、順序

```text
第一步   確認 PostgREST 對外通不通（上面那條 curl）
第二步   刪掉 src/lib/supabase.ts 與 NEXT_PUBLIC_SUPABASE_ANON_KEY
         ——它沒有任何呼叫點，拔掉就少一整個攻擊面
第三步   換掉 supabase-demo 的 JWT_SECRET 與 ADMIN_SECRET
第四步   58 張表補 RLS（大多數只要 enable，不必寫 policy）
第五步   一條 insightEngine 的測試，故意改壞驗過
```

第二步是這五步裡唯一「今天就做得完、而且立刻有效」的，先做它。
