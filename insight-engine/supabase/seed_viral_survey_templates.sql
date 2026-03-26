-- Viral Survey Templates Seed
-- 爆款問卷模板（C 端傳播用）10 套
-- 2026-03-27

-- 清除舊的 viral 模板（避免重複 seed）
DELETE FROM survey_templates WHERE industry = 'viral';

-- ===== 1. 你在朋友眼中是什麼人？ =====
INSERT INTO survey_templates (
  source, name, description, industry, icon, tags,
  survey_config, questions, branch_config,
  is_public, is_featured
) VALUES (
  'platform',
  '你在朋友眼中是什麼人？',
  '透過 9 道情境題，找出你在朋友圈中的人格角色。結果有 4 種類型，適合分享給朋友一起測。',
  'viral',
  '👥',
  ARRAY['人格測驗','社交','分享'],
  '{
    "slug": "who-are-you-in-friends",
    "title": "你在朋友眼中是什麼人？",
    "subtitle": "9 題找出你的朋友圈角色",
    "coverTitle": "朋友眼中的你",
    "coverSubtitle": "你以為的自己，和朋友眼中的你一樣嗎？",
    "startButtonText": "開始測驗",
    "doneTitle": "測驗完成！",
    "doneSubtitle": "看看你是哪種類型的朋友",
    "resultConfig": {
      "scoringRules": {
        "q1": {"A":"leader","B":"supporter","C":"entertainer","D":"observer"},
        "q2": {"A":"leader","B":"entertainer","C":"supporter","D":"observer"},
        "q3": {"A":"supporter","B":"leader","C":"observer","D":"entertainer"},
        "q4": {"A":"entertainer","B":"observer","C":"leader","D":"supporter"},
        "q5": {"A":"observer","B":"supporter","C":"entertainer","D":"leader"},
        "q6": {"A":"leader","B":"entertainer","C":"observer","D":"supporter"},
        "q7": {"A":"supporter","B":"leader","C":"entertainer","D":"observer"},
        "q8": {"A":"observer","B":"entertainer","C":"leader","D":"supporter"},
        "q9": {"A":"entertainer","B":"supporter","C":"observer","D":"leader"}
      },
      "resultTypes": [
        {
          "key": "leader",
          "name": "天然領袖",
          "emoji": "👑",
          "description": "你在朋友圈中總是那個拍板決定的人。大家遇到問題第一個想到你，因為你不只有主見，還能讓每個人都覺得被重視。",
          "traits": ["決策力強","有方向感","可靠","有時太強勢"],
          "color": "#f59e0b"
        },
        {
          "key": "supporter",
          "name": "溫暖支柱",
          "emoji": "🤗",
          "description": "你是那個最懂得照顧別人感受的朋友。朋友難過時，你總是第一個出現。你的存在讓每個人都感到安心。",
          "traits": ["同理心強","細心","包容","偶爾太顧慮別人"],
          "color": "#10b981"
        },
        {
          "key": "entertainer",
          "name": "氣氛王者",
          "emoji": "🎉",
          "description": "哪裡有你，哪裡就有笑聲！你天生懂得讀空氣、製造歡樂，是朋友圈裡不可或缺的那道光。",
          "traits": ["幽默感","活潑","點子多","難以拒絕聚會"],
          "color": "#ec4899"
        },
        {
          "key": "observer",
          "name": "洞察智者",
          "emoji": "🔍",
          "description": "你是那個默默觀察一切、思考很深的朋友。話不多，但說出來的每句話都讓人覺得「你懂得比我想的還多」。",
          "traits": ["觀察力強","思考深度","有原則","偶爾顯得神秘"],
          "color": "#6366f1"
        }
      ]
    }
  }'::jsonb,
  '[
    {"key":"q1","type":"single","content":"朋友們要決定去哪吃飯，大家意見不一致，你通常會...","options":[{"label":"直接說「我們去XX好了」，帶頭走","value":"A"},{"label":"問大家的偏好，試著找共識","value":"B"},{"label":"說個笑話讓氣氛輕鬆，然後隨便","value":"C"},{"label":"靜靜等別人決定","value":"D"}],"isRequired":true},
    {"key":"q2","type":"single","content":"朋友圈有人吵架了，你的第一反應是...","options":[{"label":"主動介入，客觀分析誰對誰錯","value":"A"},{"label":"私下問每個人：「你還好嗎？」","value":"C"},{"label":"找機會開個玩笑緩和氣氛","value":"B"},{"label":"觀察狀況，等他們自己解決","value":"D"}],"isRequired":true},
    {"key":"q3","type":"single","content":"朋友生日快到了，你最可能做什麼？","options":[{"label":"主動詢問他有什麼需要，然後全力幫忙","value":"A"},{"label":"提議大家一起策劃驚喜，你負責統籌","value":"B"},{"label":"想到一個超特別的慶祝方式提出來","value":"D"},{"label":"準備一份很用心的禮物，不聲張","value":"C"}],"isRequired":true},
    {"key":"q4","type":"single","content":"聚會上有人明顯心情不好，你會...","options":[{"label":"想辦法讓大家都笑起來，轉移注意力","value":"A"},{"label":"悄悄觀察，但不打擾","value":"B"},{"label":"先讓聚會繼續，之後再私下關心","value":"D"},{"label":"立刻找機會問他：「你還好嗎？」","value":"C"}],"isRequired":true},
    {"key":"q5","type":"single","content":"你對朋友說的那些話，你通常是...","options":[{"label":"先想很久，說出來都是精準的","value":"A"},{"label":"很真誠，有時太直接","value":"B"},{"label":"幽默包裝，讓人笑完才回想","value":"C"},{"label":"溫暖鼓勵，讓人覺得被支持","value":"D"}],"isRequired":true},
    {"key":"q6","type":"single","content":"朋友說要策劃一件大事，你的角色通常是...","options":[{"label":"發起人，把概念說得很清楚","value":"A"},{"label":"提出各種有趣想法的那個","value":"B"},{"label":"默默把細節做好的那個","value":"C"},{"label":"記錄和思考潛在問題的那個","value":"D"}],"isRequired":true},
    {"key":"q7","type":"single","content":"最讓你有成就感的事是...","options":[{"label":"幫到朋友解決了難題","value":"A"},{"label":"做了一個讓大家佩服的決定","value":"B"},{"label":"帶動整個氣氛，讓大家都很嗨","value":"C"},{"label":"發現了別人沒注意到的細節","value":"D"}],"isRequired":true},
    {"key":"q8","type":"single","content":"朋友用一個詞形容你，最可能是...","options":[{"label":"「值得信賴」","value":"A"},{"label":"「超好笑」","value":"B"},{"label":"「很靠譜」","value":"C"},{"label":"「深不可測」","value":"D"}],"isRequired":true},
    {"key":"q9","type":"single","content":"你希望朋友在需要你的時候，能找你...","options":[{"label":"開心、解悶、轉換心情","value":"A"},{"label":"聊心事、被好好聽見","value":"B"},{"label":"思考問題、找方向","value":"C"},{"label":"直接幫他解決問題","value":"D"}],"isRequired":true}
  ]'::jsonb,
  NULL,
  true,
  true
);

-- ===== 2. 你的戀愛人格 =====
INSERT INTO survey_templates (
  source, name, description, industry, icon, tags,
  survey_config, questions, branch_config,
  is_public, is_featured
) VALUES (
  'platform',
  '你的戀愛人格',
  '10 道戀愛情境題，解析你在關係中的角色。結果會告訴你的戀愛優勢和容易踩的地雷。',
  'viral',
  '💕',
  ARRAY['戀愛','人格測驗','分享'],
  '{
    "slug": "love-personality",
    "title": "你的戀愛人格",
    "subtitle": "10 題找出你的戀愛風格",
    "coverTitle": "愛情裡的你",
    "coverSubtitle": "你在關係中是什麼樣的人？",
    "startButtonText": "開始測驗",
    "doneTitle": "測驗完成！",
    "doneSubtitle": "看看你的戀愛人格",
    "resultConfig": {
      "scoringRules": {
        "q1": {"A":"devoted","B":"independent","C":"romantic","D":"rational"},
        "q2": {"A":"romantic","B":"rational","C":"devoted","D":"independent"},
        "q3": {"A":"independent","B":"devoted","C":"rational","D":"romantic"},
        "q4": {"A":"rational","B":"romantic","C":"independent","D":"devoted"},
        "q5": {"A":"devoted","B":"rational","C":"romantic","D":"independent"},
        "q6": {"A":"romantic","B":"independent","C":"devoted","D":"rational"},
        "q7": {"A":"rational","B":"devoted","C":"independent","D":"romantic"},
        "q8": {"A":"independent","B":"romantic","C":"rational","D":"devoted"},
        "q9": {"A":"devoted","B":"independent","C":"romantic","D":"rational"},
        "q10": {"A":"rational","B":"romantic","C":"devoted","D":"independent"}
      },
      "resultTypes": [
        {
          "key": "devoted",
          "name": "全心付出型",
          "emoji": "💝",
          "description": "你在感情裡會把對方放在第一位，願意為愛人犧牲很多。你的愛是真誠而深刻的，但有時要注意不要忘了自己的需求。",
          "traits": ["深情","忠誠","貼心","容易太在意"],
          "color": "#ec4899"
        },
        {
          "key": "independent",
          "name": "自由靈魂型",
          "emoji": "🦋",
          "description": "你珍視個人空間和自主性，在感情中保有自己的節奏。你吸引人的地方在於你的獨立和神秘感，但記得也要讓對方感受到你的在乎。",
          "traits": ["獨立","有個性","難以捉摸","需要空間"],
          "color": "#8b5cf6"
        },
        {
          "key": "romantic",
          "name": "浪漫情人型",
          "emoji": "🌹",
          "description": "你天生懂得製造浪漫，讓對方感受到被珍視。你對愛情有美好的想像，喜歡為關係增添儀式感和驚喜。",
          "traits": ["浪漫","有情調","細膩","偶爾過度理想化"],
          "color": "#f43f5e"
        },
        {
          "key": "rational",
          "name": "理性現實型",
          "emoji": "🧠",
          "description": "你在感情中保持清醒，不容易衝動。你重視兩人實際相處的品質多過於浪漫的包裝，是那種越了解越覺得可靠的類型。",
          "traits": ["穩定","實際","溝通直接","有時顯得不夠浪漫"],
          "color": "#3b82f6"
        }
      ]
    }
  }'::jsonb,
  '[
    {"key":"q1","type":"single","content":"和對方第一次約會，你通常...","options":[{"label":"超認真研究對方喜好，精心安排每個細節","value":"A"},{"label":"約個有趣的活動，讓自己也玩得開心","value":"B"},{"label":"選個超浪漫的地點，製造美好回憶","value":"C"},{"label":"選個方便溝通的場合，好好了解對方","value":"D"}],"isRequired":true},
    {"key":"q2","type":"single","content":"你最喜歡對方用什麼方式表達愛？","options":[{"label":"準備驚喜或小禮物","value":"A"},{"label":"說「我懂你」，真的理解你","value":"B"},{"label":"主動說出「我愛你」","value":"C"},{"label":"陪在你身邊，不用說什麼","value":"D"}],"isRequired":true},
    {"key":"q3","type":"single","content":"吵架後，你通常怎麼處理？","options":[{"label":"給彼此一些空間，想清楚再說","value":"A"},{"label":"主動說對不起，不管誰對誰錯","value":"B"},{"label":"列出問題點，好好溝通","value":"C"},{"label":"傳個溫柔的訊息，緩和氣氛","value":"D"}],"isRequired":true},
    {"key":"q4","type":"single","content":"在感情中，你最在意的是...","options":[{"label":"兩個人都能持續成長","value":"A"},{"label":"讓對方每天都感受到浪漫","value":"B"},{"label":"保有各自的空間和自由","value":"C"},{"label":"對方永遠把你放第一位","value":"D"}],"isRequired":true},
    {"key":"q5","type":"single","content":"對方忘記你說過的事，你會...","options":[{"label":"有點受傷，但提醒自己不要太計較","value":"A"},{"label":"直接說「你沒在聽我說話」","value":"B"},{"label":"想：也許他最近太累了吧","value":"C"},{"label":"重新說一遍，並確認對方理解","value":"D"}],"isRequired":true},
    {"key":"q6","type":"single","content":"你覺得理想的關係是...","options":[{"label":"像電影裡那樣，充滿感動和驚喜","value":"A"},{"label":"兩人各自精彩，相聚時更珍惜","value":"B"},{"label":"互相依賴，成為彼此最重要的人","value":"C"},{"label":"平等踏實，一起面對生活","value":"D"}],"isRequired":true},
    {"key":"q7","type":"single","content":"對方很忙，一週只能見一次面，你...","options":[{"label":"沒問題，珍惜每次相聚","value":"A"},{"label":"有點失落，但不會主動說","value":"B"},{"label":"覺得彛度剛好，不覺得少","value":"C"},{"label":"提議固定見面日，建立規律","value":"D"}],"isRequired":true},
    {"key":"q8","type":"single","content":"你最喜歡的情侶日常是...","options":[{"label":"各做各的事，但在同一空間","value":"A"},{"label":"一起計劃下一個約會","value":"B"},{"label":"在家，什麼都不做，只是在一起","value":"C"},{"label":"出去探索，一起體驗新事物","value":"D"}],"isRequired":true},
    {"key":"q9","type":"single","content":"如果可以選，你希望對方是...","options":[{"label":"最懂你的那個人","value":"A"},{"label":"讓你覺得安全、可以依靠的人","value":"B"},{"label":"和你一起成長的夥伴","value":"C"},{"label":"給你很多驚喜和浪漫感的人","value":"D"}],"isRequired":true},
    {"key":"q10","type":"single","content":"感情最讓你有成就感的是...","options":[{"label":"兩人一起做出好決定","value":"A"},{"label":"創造了一個難忘的浪漫時刻","value":"B"},{"label":"對方說「有你真好」","value":"C"},{"label":"我就是我，對方愛的就是真實的我","value":"D"}],"isRequired":true}
  ]'::jsonb,
  NULL,
  true,
  true
);

-- ===== 3. 你是哪種動物？ =====
INSERT INTO survey_templates (
  source, name, description, industry, icon, tags,
  survey_config, questions, branch_config,
  is_public, is_featured
) VALUES (
  'platform',
  '你是哪種動物？',
  '8 題輕鬆有趣的動物人格測驗。結果有 5 種動物類型，超適合分享給朋友比較。',
  'viral',
  '🦁',
  ARRAY['趣味','動物','人格'],
  '{
    "slug": "what-animal-are-you",
    "title": "你是哪種動物？",
    "subtitle": "8 題找出你的動物人格",
    "coverTitle": "你的動物靈魂",
    "coverSubtitle": "如果你是一種動物，你會是哪一種？",
    "startButtonText": "開始測驗",
    "doneTitle": "測驗完成！",
    "doneSubtitle": "你的動物人格揭曉！",
    "resultConfig": {
      "scoringRules": {
        "q1": {"A":"lion","B":"owl","C":"dolphin","D":"fox","E":"golden"},
        "q2": {"A":"dolphin","B":"lion","C":"fox","D":"owl","E":"golden"},
        "q3": {"A":"owl","B":"dolphin","C":"lion","D":"golden","E":"fox"},
        "q4": {"A":"fox","B":"owl","C":"golden","D":"lion","E":"dolphin"},
        "q5": {"A":"lion","B":"golden","C":"owl","D":"dolphin","E":"fox"},
        "q6": {"A":"golden","B":"fox","C":"dolphin","D":"owl","E":"lion"},
        "q7": {"A":"dolphin","B":"lion","C":"fox","D":"golden","E":"owl"},
        "q8": {"A":"owl","B":"dolphin","C":"lion","D":"fox","E":"golden"}
      },
      "resultTypes": [
        {
          "key": "lion",
          "name": "雄獅",
          "emoji": "🦁",
          "description": "你天生就是要站在舞台中央的人。有魄力、有霸氣，但你的內心其實比外表溫柔許多。你的朋友信任你，因為你說到做到。",
          "traits": ["霸氣","領導力","保護欲強","說到做到"],
          "color": "#f59e0b"
        },
        {
          "key": "owl",
          "name": "貓頭鷹",
          "emoji": "🦉",
          "description": "你是那個安靜觀察一切、然後說出一句讓大家沉默的洞見的人。你不喜歡閒聊，但你的每句話都有份量。",
          "traits": ["智慧","洞察力","沉穩","夜貓子"],
          "color": "#6366f1"
        },
        {
          "key": "dolphin",
          "name": "海豚",
          "emoji": "🐬",
          "description": "你開朗、有活力、喜歡和人互動。你天生有感染力，走進任何群體都能讓氣氛活起來。你的快樂是真的。",
          "traits": ["活潑","社交高手","充滿活力","樂觀"],
          "color": "#06b6d4"
        },
        {
          "key": "fox",
          "name": "狐狸",
          "emoji": "🦊",
          "description": "你聰明、靈活、有一種說不清楚的神秘感。你總是能在意想不到的地方找到機會，而且行動比說話快。",
          "traits": ["機智","靈活","有魅力","保有神秘感"],
          "color": "#f97316"
        },
        {
          "key": "golden",
          "name": "金毛",
          "emoji": "🐕",
          "description": "你溫暖、忠誠、讓人一靠近就放鬆。你不需要做什麼大事，光是你的存在就讓周圍的人感到幸福。",
          "traits": ["溫暖","忠誠","親和力","治癒系"],
          "color": "#eab308"
        }
      ]
    }
  }'::jsonb,
  '[
    {"key":"q1","type":"single","content":"週末突然有空，你最想做什麼？","options":[{"label":"找朋友出去，不管幹嘛都好","value":"A"},{"label":"一個人窩在家，讀書或看影片","value":"B"},{"label":"探索一個沒去過的地方","value":"C"},{"label":"有什麼機會就抓住什麼","value":"D"},{"label":"陪家人或老朋友","value":"E"}],"isRequired":true},
    {"key":"q2","type":"single","content":"你的朋友會怎麼形容你？","options":[{"label":"「超好笑，氣氛王」","value":"A"},{"label":"「很有想法，說話有分量」","value":"B"},{"label":"「很可靠，說到做到」","value":"C"},{"label":"「難以捉摸，充滿驚喜」","value":"D"},{"label":"「暖到不行，讓人放心」","value":"E"}],"isRequired":true},
    {"key":"q3","type":"single","content":"遇到問題，你第一步是...","options":[{"label":"先想清楚再動","value":"A"},{"label":"找人一起討論，集思廣益","value":"B"},{"label":"直接開始做，邊做邊調整","value":"C"},{"label":"觀察看看有沒有其他方法","value":"D"},{"label":"問問身邊信任的人","value":"E"}],"isRequired":true},
    {"key":"q4","type":"single","content":"你在一個陌生場合，你通常...","options":[{"label":"四處走動，看有沒有有趣的人","value":"A"},{"label":"找個角落安靜觀察","value":"B"},{"label":"找到一兩個人深入聊","value":"C"},{"label":"讓大家先注意到你","value":"D"},{"label":"陪著你帶來的朋友","value":"E"}],"isRequired":true},
    {"key":"q5","type":"single","content":"最讓你有成就感的是...","options":[{"label":"帶領一件事成功","value":"A"},{"label":"幫助別人解決問題","value":"B"},{"label":"想到一個很厲害的洞見","value":"C"},{"label":"讓大家都笑得很開心","value":"D"},{"label":"比任何人更快抓到機會","value":"E"}],"isRequired":true},
    {"key":"q6","type":"single","content":"你覺得「家」對你來說是...","options":[{"label":"充電的地方，安靜就是幸福","value":"A"},{"label":"充滿笑聲和人的地方","value":"B"},{"label":"出發的基地，不需要花太多時間在家","value":"C"},{"label":"可以掌控一切的小宇宙","value":"D"},{"label":"最喜歡的地方，待多久都不膩","value":"E"}],"isRequired":true},
    {"key":"q7","type":"single","content":"在一個團隊裡，你通常...","options":[{"label":"讓大家氣氛好，大家都喜歡你","value":"A"},{"label":"扛下責任，帶大家往前走","value":"B"},{"label":"做好自己那份，默默貢獻","value":"C"},{"label":"找捷徑，讓效率更高","value":"D"},{"label":"把大家整合起來","value":"E"}],"isRequired":true},
    {"key":"q8","type":"single","content":"你的夢想生活是...","options":[{"label":"在某個安靜的地方，一個人思考和創作","value":"A"},{"label":"認識各種有趣的人，每天不一樣","value":"B"},{"label":"站在某個領域的頂端","value":"C"},{"label":"自由，沒有太多束縛","value":"D"},{"label":"被你愛的人圍繞著","value":"E"}],"isRequired":true}
  ]'::jsonb,
  NULL,
  true,
  true
);

-- ===== 4. 你的職場角色 =====
INSERT INTO survey_templates (
  source, name, description, industry, icon, tags,
  survey_config, questions, branch_config,
  is_public, is_featured
) VALUES (
  'platform',
  '你在職場的角色',
  '8 題找出你在工作中的定位。4 種職場人格類型，幫你理解自己的優勢。',
  'viral',
  '💼',
  ARRAY['職場','人格測驗','成長'],
  '{
    "slug": "workplace-personality",
    "title": "你在職場的角色",
    "subtitle": "8 題找出你的職場人格",
    "coverTitle": "職場中的你",
    "coverSubtitle": "你知道自己在團隊裡扮演什麼角色嗎？",
    "startButtonText": "開始測驗",
    "doneTitle": "測驗完成！",
    "doneSubtitle": "看看你的職場人格",
    "resultConfig": {
      "scoringRules": {
        "q1": {"A":"executor","B":"strategist","C":"creator","D":"connector"},
        "q2": {"A":"strategist","B":"connector","C":"executor","D":"creator"},
        "q3": {"A":"creator","B":"executor","C":"connector","D":"strategist"},
        "q4": {"A":"connector","B":"creator","C":"strategist","D":"executor"},
        "q5": {"A":"executor","B":"strategist","C":"creator","D":"connector"},
        "q6": {"A":"strategist","B":"connector","C":"executor","D":"creator"},
        "q7": {"A":"creator","B":"executor","C":"strategist","D":"connector"},
        "q8": {"A":"connector","B":"strategist","C":"creator","D":"executor"}
      },
      "resultTypes": [
        {
          "key": "executor",
          "name": "執行王者",
          "emoji": "⚡",
          "description": "你是那個說了就做、做了就完成的人。你讓計劃從紙上走向現實，是團隊裡最可靠的那道力量。",
          "traits": ["行動力強","可靠","效率高","目標導向"],
          "color": "#f59e0b"
        },
        {
          "key": "strategist",
          "name": "策略思考家",
          "emoji": "🧩",
          "description": "你在別人還在看局部的時候，你已經看到全局。你的強項是找到那個「最正確的方向」，讓大家少走很多冤枉路。",
          "traits": ["全局思維","冷靜","善於分析","有時太完美主義"],
          "color": "#6366f1"
        },
        {
          "key": "creator",
          "name": "創意發動機",
          "emoji": "💡",
          "description": "你是團隊裡那個不斷有新想法的人。你敢想、敢試，讓整個環境都充滿可能性。你的存在讓工作不無聊。",
          "traits": ["創意","敢冒險","跳脫框架","充滿熱情"],
          "color": "#ec4899"
        },
        {
          "key": "connector",
          "name": "關係連結者",
          "emoji": "🤝",
          "description": "你是讓團隊凝聚在一起的那個人。你懂得讀人、溝通，讓不同個性的人都能合作愉快。你的價值很多人說不出來，但沒有你就感覺缺了什麼。",
          "traits": ["高情商","善溝通","有親和力","顧及每個人"],
          "color": "#10b981"
        }
      ]
    }
  }'::jsonb,
  '[
    {"key":"q1","type":"single","content":"開會時有一個新想法提出來，你通常...","options":[{"label":"立刻想到怎麼把它做出來","value":"A"},{"label":"評估這個方向對不對","value":"B"},{"label":"延伸這個想法，提出更多可能性","value":"C"},{"label":"觀察大家的反應，確保大家都認同","value":"D"}],"isRequired":true},
    {"key":"q2","type":"single","content":"最讓你有成就感的工作方式是...","options":[{"label":"想出一個打破常規的解法","value":"A"},{"label":"讓每個人都發揮到最好","value":"B"},{"label":"把複雜的任務乾淨完成","value":"C"},{"label":"帶著團隊做出一個很棒的成果","value":"D"}],"isRequired":true},
    {"key":"q3","type":"single","content":"同事問你意見，你最常說的是...","options":[{"label":"「你有沒有想過可以試試這個方向？」","value":"A"},{"label":"「你先做，遇到問題再說」","value":"B"},{"label":"「大家都怎麼想？」","value":"C"},{"label":"「先把背景想清楚，再做決定」","value":"D"}],"isRequired":true},
    {"key":"q4","type":"single","content":"面對一個緊急又複雜的任務，你...","options":[{"label":"先確保每個人狀態都 OK","value":"A"},{"label":"腦中馬上浮現很多解法","value":"B"},{"label":"先分析問題根源","value":"C"},{"label":"直接開始做，最重要的先解決","value":"D"}],"isRequired":true},
    {"key":"q5","type":"single","content":"工作上你最看重的是...","options":[{"label":"達成目標、完成任務","value":"A"},{"label":"做出對的決策","value":"B"},{"label":"有機會嘗試新的可能","value":"C"},{"label":"和好的人一起工作","value":"D"}],"isRequired":true},
    {"key":"q6","type":"single","content":"你覺得自己在團隊裡最大的貢獻是...","options":[{"label":"想清楚方向，少走冤枉路","value":"A"},{"label":"讓大家溝通順暢，氣氛好","value":"B"},{"label":"把事情落實，不只是說說","value":"C"},{"label":"帶來新想法，打破僵局","value":"D"}],"isRequired":true},
    {"key":"q7","type":"single","content":"你最不喜歡的工作狀況是...","options":[{"label":"每天做一樣的事，沒有新挑戰","value":"A"},{"label":"做了很多但不知道為什麼要做","value":"B"},{"label":"方向不清楚，效率很差","value":"C"},{"label":"大家各做各的，沒有凝聚力","value":"D"}],"isRequired":true},
    {"key":"q8","type":"single","content":"你希望同事怎麼形容你？","options":[{"label":"「有他在，團隊才這麼好」","value":"A"},{"label":"「他看事情的角度讓人信服」","value":"B"},{"label":"「每次都能想到別人沒想到的」","value":"C"},{"label":"「交給他的事從來沒讓人失望過」","value":"D"}],"isRequired":true}
  ]'::jsonb,
  NULL,
  true,
  false
);

-- ===== 5. 你的人生價值觀 =====
INSERT INTO survey_templates (
  source, name, description, industry, icon, tags,
  survey_config, questions, branch_config,
  is_public, is_featured
) VALUES (
  'platform',
  '你的人生價值觀',
  '9 題深度探索你最在乎什麼。測驗結果帶你看見自己的人生優先順序。',
  'viral',
  '🌟',
  ARRAY['價值觀','深度','成長'],
  '{
    "slug": "life-values",
    "title": "你的人生價值觀",
    "subtitle": "9 題找出你最在乎的事",
    "coverTitle": "人生的你",
    "coverSubtitle": "你的選擇，揭示你真正在乎什麼",
    "startButtonText": "開始探索",
    "doneTitle": "探索完成！",
    "doneSubtitle": "看看你的人生價值觀",
    "resultConfig": {
      "scoringRules": {
        "q1": {"A":"freedom","B":"security","C":"impact","D":"connection"},
        "q2": {"A":"impact","B":"freedom","C":"connection","D":"security"},
        "q3": {"A":"security","B":"connection","C":"freedom","D":"impact"},
        "q4": {"A":"connection","B":"impact","C":"security","D":"freedom"},
        "q5": {"A":"freedom","B":"security","C":"impact","D":"connection"},
        "q6": {"A":"impact","B":"connection","C":"freedom","D":"security"},
        "q7": {"A":"security","B":"impact","C":"connection","D":"freedom"},
        "q8": {"A":"connection","B":"freedom","C":"security","D":"impact"},
        "q9": {"A":"freedom","B":"impact","C":"security","D":"connection"}
      },
      "resultTypes": [
        {
          "key": "freedom",
          "name": "自由探索者",
          "emoji": "🌈",
          "description": "你最在乎的是可以按自己的方式生活。你不想被框架限制，你需要空間、彈性和自主。你的人生不是別人幫你定義的。",
          "traits": ["自主","敢於突破","活在當下","嚮往多元"]
        },
        {
          "key": "security",
          "name": "穩定守護者",
          "emoji": "🏡",
          "description": "你追求的是紮實的安全感——不是無趣，是踏實。你相信打好基礎才能長久，你在乎你愛的人的平靜和幸福。",
          "traits": ["穩健","負責任","重規劃","珍惜日常"]
        },
        {
          "key": "impact",
          "name": "改變推動者",
          "emoji": "🚀",
          "description": "你想讓世界因為你而有一點不一樣。你有使命感，不甘心只過平庸的日子。你做的每件事，都希望留下真實的痕跡。",
          "traits": ["有使命感","勇敢","重意義","不怕挑戰"]
        },
        {
          "key": "connection",
          "name": "關係編織者",
          "emoji": "💛",
          "description": "你最在乎的是人與人之間的連結。你從關係中取得力量，你的快樂來自讓你在乎的人快樂。愛，對你來說是最真實的財富。",
          "traits": ["重感情","溫暖","善於傾聽","以人為本"]
        }
      ]
    }
  }'::jsonb,
  '[
    {"key":"q1","type":"single","content":"如果可以，你最想要的生活是...","options":[{"label":"每天都有新的可能，不被任何事綁住","value":"A"},{"label":"有穩定的收入和家，安心過日子","value":"B"},{"label":"做有意義的事，感覺自己在改變些什麼","value":"C"},{"label":"和愛的人在一起，關係充實","value":"D"}],"isRequired":true},
    {"key":"q2","type":"single","content":"你最常為哪件事感到可惜？","options":[{"label":"沒有為某件事努力爭取或改變","value":"A"},{"label":"沒有好好珍惜與人的相處時光","value":"B"},{"label":"沒有勇氣追求自己真正想要的","value":"C"},{"label":"沒有為家人或自己建立更穩固的基礎","value":"D"}],"isRequired":true},
    {"key":"q3","type":"single","content":"你最害怕什麼樣的未來？","options":[{"label":"走到老，發現沒有為任何人留下什麼","value":"A"},{"label":"和重要的人漸行漸遠","value":"B"},{"label":"一直在一個框框裡，無法自主","value":"C"},{"label":"失去穩定，生活變得不可控","value":"D"}],"isRequired":true},
    {"key":"q4","type":"single","content":"對你來說，「成功」是什麼？","options":[{"label":"被你在乎的人愛著","value":"A"},{"label":"讓世界有了一點不一樣","value":"B"},{"label":"有安全感、不用擔心未來","value":"C"},{"label":"按照自己的方式活著","value":"D"}],"isRequired":true},
    {"key":"q5","type":"single","content":"當你感到迷失時，什麼能讓你回到正軌？","options":[{"label":"去做一件讓我感到自由的事","value":"A"},{"label":"找一個熟悉的節奏回來","value":"B"},{"label":"想想我想留下什麼","value":"C"},{"label":"和我在乎的人好好聊一次","value":"D"}],"isRequired":true},
    {"key":"q6","type":"single","content":"你最羨慕別人什麼？","options":[{"label":"能夠讓身邊的人幸福","value":"A"},{"label":"做出了有影響力的事","value":"B"},{"label":"活得自在、不被束縛","value":"C"},{"label":"生活穩定、從容不迫","value":"D"}],"isRequired":true},
    {"key":"q7","type":"single","content":"你最想給自己的是什麼？","options":[{"label":"一個不需要擔心的基礎","value":"A"},{"label":"讓自己更有影響力的機會","value":"B"},{"label":"和重要的人更多時間","value":"C"},{"label":"更多可以自由探索的空間","value":"D"}],"isRequired":true},
    {"key":"q8","type":"single","content":"你心中的「好生活」長什麼樣？","options":[{"label":"充滿溫度，家人朋友圍繞著","value":"A"},{"label":"自由，隨時可以走向不同的方向","value":"B"},{"label":"踏實，每天都有可以依靠的節奏","value":"C"},{"label":"有意義，做的事讓人記得你","value":"D"}],"isRequired":true},
    {"key":"q9","type":"single","content":"如果老了，你最希望說的話是...","options":[{"label":"我活出了我自己想要的樣子","value":"A"},{"label":"我做了一些讓世界更好的事","value":"B"},{"label":"我把家人照顧好了","value":"C"},{"label":"我好好愛了、也好好被愛過","value":"D"}],"isRequired":true}
  ]'::jsonb,
  NULL,
  true,
  false
);

-- ===== 6-10: 其餘 5 個模板（簡化版）=====

INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, is_public) VALUES
(
  'platform', '朋友對你的真實印象', '發給好朋友填！讓他們匿名說出對你的真實印象，看看你在別人心中是什麼樣的人。', 'viral', '🪞',
  ARRAY['匿名','朋友','社交'],
  '{"slug":"friend-impression","title":"朋友對你的真實印象","subtitle":"讓朋友說真心話","coverTitle":"你在朋友眼中","coverSubtitle":"發給最熟的朋友填，看看他們怎麼想你","startButtonText":"開始填寫","doneTitle":"謝謝你的真心話！","doneSubtitle":"你的回覆已送出"}'::jsonb,
  '[{"key":"q1","type":"single","content":"你覺得他/她最大的優點是？","options":[{"label":"超暖、讓人有安全感","value":"warm"},{"label":"超好笑、帶動氣氛","value":"funny"},{"label":"聰明、分析能力強","value":"smart"},{"label":"有行動力、說到做到","value":"action"}],"isRequired":true},{"key":"q2","type":"single","content":"他/她最讓你印象深刻的一件事是...","options":[{"label":"在你最難的時候出現了","value":"support"},{"label":"帶你去了一個超特別的地方","value":"adventure"},{"label":"說了一句讓你想很久的話","value":"wisdom"},{"label":"一直默默在幫你","value":"loyalty"}],"isRequired":true},{"key":"q3","type":"text","content":"還有什麼想告訴他/她的？（可以不填）","options":[],"isRequired":false}]'::jsonb,
  true
),
(
  'platform', '你的隱藏天賦', '10 題找出你沒發現的潛能。結果可能讓你驚訝！', 'viral', '🌠',
  ARRAY['天賦','成長','探索'],
  '{"slug":"hidden-talent","title":"你的隱藏天賦","subtitle":"10 題找出你未發現的潛能","coverTitle":"你的隱藏力量","coverSubtitle":"你還沒意識到自己有多厲害","startButtonText":"開始探索","doneTitle":"探索完成！","doneSubtitle":"你的天賦揭曉"}'::jsonb,
  '[{"key":"q1","type":"single","content":"你最享受的狀態是...","options":[{"label":"在腦中建構一套系統或邏輯","value":"analytical"},{"label":"幫別人解開心結或看清楚問題","value":"empathy"},{"label":"創造或表達某種美感","value":"creative"},{"label":"帶領一群人朝目標前進","value":"leadership"}],"isRequired":true},{"key":"q2","type":"single","content":"別人最常向你尋求什麼幫助？","options":[{"label":"分析問題或給建議","value":"analytical"},{"label":"傾聽和理解","value":"empathy"},{"label":"設計或創作方面","value":"creative"},{"label":"做決定或帶頭行動","value":"leadership"}],"isRequired":true}]'::jsonb,
  true
),
(
  'platform', '情侶默契測驗', '你和另一半各自填，比對答案！看看你們真的了解彼此嗎？', 'viral', '💑',
  ARRAY['情侶','默契','互動'],
  '{"slug":"couple-chemistry","title":"情侶默契測驗","subtitle":"各自填，比對答案！","coverTitle":"你們的默契","coverSubtitle":"猜猜對方怎麼回答？","startButtonText":"開始填","doneTitle":"填完了！","doneSubtitle":"把連結傳給另一半，比較你們的答案"}'::jsonb,
  '[{"key":"q1","type":"single","content":"你覺得在關係中，你是比較主動的那一個嗎？","options":[{"label":"是，我通常比較主動","value":"A"},{"label":"不是，我比較被動","value":"B"},{"label":"差不多","value":"C"}],"isRequired":true},{"key":"q2","type":"single","content":"你們吵架後，通常是誰先道歉？","options":[{"label":"我","value":"A"},{"label":"對方","value":"B"},{"label":"同時","value":"C"},{"label":"沒吵過","value":"D"}],"isRequired":true},{"key":"q3","type":"single","content":"你覺得你們最大的共同點是？","options":[{"label":"興趣和喜好","value":"A"},{"label":"人生觀和價值觀","value":"B"},{"label":"相處方式和溝通風格","value":"C"},{"label":"對未來的想像","value":"D"}],"isRequired":true}]'::jsonb,
  true
),
(
  'platform', '你的未來人生路線', '根據你的性格和選擇，預測你最可能走的人生路線。帶有故事性的結果！', 'viral', '🛤️',
  ARRAY['未來','人生','故事'],
  '{"slug":"future-life-path","title":"你的未來人生路線","subtitle":"你的選擇決定你的故事","coverTitle":"你的人生路線","coverSubtitle":"往後看，是什麼樣的風景？","startButtonText":"開始旅程","doneTitle":"你的路線揭曉！","doneSubtitle":"這是你最可能走的人生故事"}'::jsonb,
  '[{"key":"q1","type":"single","content":"如果可以，你最想住在哪？","options":[{"label":"大城市，有無限可能","value":"city"},{"label":"寧靜的小鎮或山海邊","value":"nature"},{"label":"跟著機會走，哪裡都好","value":"nomad"},{"label":"家鄉附近，靠近親人","value":"home"}],"isRequired":true},{"key":"q2","type":"single","content":"工作對你來說是...","options":[{"label":"實現夢想的舞台","value":"passion"},{"label":"換取自由的工具","value":"tool"},{"label":"服務他人的方式","value":"service"},{"label":"創造安全感的基礎","value":"security"}],"isRequired":true}]'::jsonb,
  true
),
(
  'platform', '朋友適合你的程度', '讓朋友來填！測出他和你的契合度，結果超有趣可以分享。', 'viral', '🤝',
  ARRAY['朋友','契合度','互動'],
  '{"slug":"friendship-compatibility","title":"朋友適合你的程度","subtitle":"讓朋友來填，測出契合度","coverTitle":"你和我的契合度","coverSubtitle":"我們是真的合適的朋友嗎？","startButtonText":"開始測試","doneTitle":"測試完成！","doneSubtitle":"看看你和我有多合拍"}'::jsonb,
  '[{"key":"q1","type":"single","content":"你覺得好朋友之間最重要的是？","options":[{"label":"共同的話題和興趣","value":"A"},{"label":"在最需要的時候出現","value":"B"},{"label":"相互理解，不需要解釋太多","value":"C"},{"label":"一起創造開心的回憶","value":"D"}],"isRequired":true},{"key":"q2","type":"single","content":"你比較喜歡哪種朋友？","options":[{"label":"能一起放鬆、什麼都聊的","value":"A"},{"label":"認真討論人生、有深度的","value":"B"},{"label":"一起探索新事物、超有趣的","value":"C"},{"label":"默默陪在旁邊，不用說話","value":"D"}],"isRequired":true}]'::jsonb,
  true
);
