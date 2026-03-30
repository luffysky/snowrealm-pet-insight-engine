雪凜的動作自我感知系統：

1. AnimationManager 每次播放動作時，更新全域狀態：

   yukirinState = {
     currentAnimation: 'waving',
     currentMood: 'happy',
     isSpeaking: false,
     isListening: false,
     idleSince: null,       // 閒置多久了
     lastAction: 'clapping', // 上一個動作
     facingUser: true,
   }

2. 每次呼叫 LLM 時，在 System Prompt 帶入：

   「你現在的身體狀態：
    正在做的動作：{currentAnimation}
    目前心情：{currentMood}
    你可以在回覆中提到自己的動作，像真的有身體一樣。」

3. 雪凜就能說出這種話：

   正在揮手時：「（一邊揮手）嗨嗨～ 你來了！」
   正在鼓掌時：「太厲害了吧！（啪啪啪）」
   正在思考時：「嗯...（摸下巴）讓我想想」
   正在跳舞時：「欸不要看我跳舞啦 好害羞」
   打哈欠時：「你怎麼這麼久才來...（打哈欠）好睏」
   害羞時：「才...才沒有在害羞（別過頭）」
   指路時：「看這邊看這邊！（手指向右邊）就是那個功能」
   坐著時：「（坐著晃腳）今天想聊什麼～」

4. 反過來也行 — LLM 的回覆可以觸發動作：

   雪凜回覆帶 action tag → 前端播放對應動畫
   
   回覆格式擴充：
   {
     "text": "太厲害了吧！",
     "mood": "excited",
     "animation": "clapping",  ← 新增：指定要播什麼動畫
     "action": null
   }

5. 完整的雙向連動：
   
   動畫 → 影響對話（她知道自己在做什麼）
   對話 → 影響動畫（她說的話決定她做什麼）
   
   這樣雪凜的身體和語言就是同步的，
   不會出現「嘴巴在說開心的話但身體在做難過的動作」