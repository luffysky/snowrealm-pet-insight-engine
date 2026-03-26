# SnowRealm Insight V6 — Engineering Execution Blueprint

## 🎯 目標
將 V5 藍圖轉換為「可直接開發」的工程任務系統  
=> 拆成 DB / API / Frontend / AI / 任務清單

---

# 🧱 1. Database Schema（核心資料表）

## 1.1 users
- id (uuid)
- email
- created_at

## 1.2 questionnaires
- id
- user_id
- title
- description
- template_id
- visibility (public/private)
- created_at

## 1.3 questions
- id
- questionnaire_id
- type (choice/text/rating)
- content
- options (json)
- order

## 1.4 responses
- id
- questionnaire_id
- responder_id (nullable)
- created_at

## 1.5 answers
- id
- response_id
- question_id
- answer (json/text)

## 1.6 insights
- id
- questionnaire_id
- ai_summary
- ai_story
- score_data (json)
- created_at

---

# ⚙️ 2. API SPEC

## 2.1 問卷
POST /api/questionnaire/create  
GET /api/questionnaire/:id  
GET /api/questionnaire/list  

## 2.2 回答
POST /api/response/submit  
GET /api/response/:id  

## 2.3 洞察
POST /api/insight/generate  
GET /api/insight/:id  

## 2.4 模板
GET /api/template/list  
POST /api/template/generate  

---

# 🎨 3. Frontend Pages

## 3.1 Dashboard
- 我的問卷
- 建立問卷
- 模板選擇

## 3.2 Builder（核心）
- 問題編輯器
- 拖拉排序
- 預覽模式

## 3.3 Fill Page
- 使用者填寫問卷 UI

## 3.4 Result Page
- 分數分析
- AI故事
- 分享按鈕

---

# 🤖 4. AI Prompt System

## 4.1 問題生成
SYSTEM:
你是一個問卷設計專家

USER:
幫我產生 10 題關於「{主題}」的問題
條件：
- 有趣
- 不冒犯
- 讓人願意回答

---

## 4.2 洞察分析
SYSTEM:
你是一個心理洞察分析師

USER:
根據以下回答生成洞察：
{answers}

輸出：
1. 性格分析
2. 行為模式
3. 一句總結

---

## 4.3 故事生成
SYSTEM:
你是一個敘事作家

USER:
根據以下資料生成故事：
{answers + insight}

風格：
- 溫暖
- 有畫面感

---

# 🧩 5. 核心模組拆解

- Questionnaire Engine
- Response Engine
- Insight Engine
- Story Engine
- Template Engine

---

# 🚀 6. 任務優先順序（Backlog）

## P0（一定要做）
- 建立問卷
- 填寫問卷
- 基本分析
- 分享

## P1（增強）
- AI問題生成
- AI故事
- 模板系統

## P2（成長）
- Z幣系統
- 推廣連結
- 廣告嵌入

---

# ⚠️ 7. 風險

- AI內容不準
- 問卷無人填
- 成本爆炸

---

# 🧠 8. 核心原則

- 不做無聊問卷
- 不靠金錢誘因
- 讓人「想被看見」

---

# 🧨 結論

V6 = 可以直接開發的版本
下一步：拆 Sprint
