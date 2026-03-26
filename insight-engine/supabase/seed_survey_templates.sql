-- ============================================================
-- SnowRealm Insight Engine — 問卷模板 Seed Data
-- 執行前請先確認 survey_templates 表已建立
-- ============================================================

-- ===== 🐾 寵物：飼主大調查 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '寵物飼主大調查',
  '了解飼主的養寵習慣、紀錄方式、付費意願，適合寵物平台/寵物店/獸醫院',
  'pet',
  '🐾',
  ARRAY['寵物', '飼主', '市場調查', 'MVP'],
  '{"title":"寵物飼主大調查","subtitle":"幫助我們更了解你和毛孩的故事","coverTitle":"你和毛孩的故事，值得被記住","theme":"forest"}',
  '[
    {"key":"q1","type":"single","content":"你目前有養寵物嗎？","isRequired":true,"route":"all","options":[{"label":"有，現在正在養","value":"有，現在正在養"},{"label":"曾經養過，現在沒有","value":"曾經養過"},{"label":"沒有，但未來想養","value":"沒有但未來想養"},{"label":"沒有，也不考慮","value":"沒有也不考慮"}]},
    {"key":"q2","type":"multiple","content":"你養的是什麼寵物？（可複選）","isRequired":true,"route":"A","options":[{"label":"狗","value":"狗"},{"label":"貓","value":"貓"},{"label":"倉鼠/兔子/小動物","value":"小動物"},{"label":"鳥類","value":"鳥類"},{"label":"水族/爬蟲","value":"水族爬蟲"},{"label":"其他","value":"其他"}]},
    {"key":"q3","type":"multiple","content":"你平常怎麼記錄寵物的生活？（可複選）","isRequired":false,"route":"A","options":[{"label":"手機拍照/影片","value":"手機拍照"},{"label":"社群發文","value":"社群發文"},{"label":"寫日記/筆記","value":"寫日記"},{"label":"幾乎沒有記錄","value":"沒有記錄"},{"label":"其他","value":"其他"}]},
    {"key":"q4","type":"single","content":"你多久會回頭看寵物的照片或影片？","isRequired":true,"route":"A","options":[{"label":"幾乎每天","value":"幾乎每天"},{"label":"一週幾次","value":"一週幾次"},{"label":"偶爾才會","value":"偶爾"},{"label":"幾乎不會","value":"幾乎不會"}]},
    {"key":"q5","type":"single","content":"你擔不擔心跟寵物有關的記憶會慢慢變模糊？","isRequired":true,"route":"A","options":[{"label":"很擔心","value":"很擔心"},{"label":"有點擔心","value":"有點擔心"},{"label":"還好","value":"還好"},{"label":"不擔心","value":"不擔心"}]},
    {"key":"q2b","type":"single","content":"你未來想養什麼寵物？","isRequired":true,"route":"B","options":[{"label":"狗","value":"狗"},{"label":"貓","value":"貓"},{"label":"小動物","value":"小動物"},{"label":"還不確定","value":"還不確定"}]},
    {"key":"q3b","type":"single","content":"你覺得養寵物最重要的是什麼？","isRequired":true,"route":"B","options":[{"label":"陪伴","value":"陪伴"},{"label":"療癒","value":"療癒"},{"label":"責任感","value":"責任感"},{"label":"生活樂趣","value":"生活樂趣"}]},
    {"key":"q6","type":"single","content":"如果有一個地方能幫你整理寵物的一生足跡，你有興趣嗎？","isRequired":true,"route":"all","options":[{"label":"很有興趣","value":"很有興趣"},{"label":"可能會試試","value":"可能會試試"},{"label":"不確定","value":"不確定"},{"label":"沒興趣","value":"沒興趣"}]},
    {"key":"q7","type":"multiple","content":"你最想要哪些功能？（最多選 3 項）","isRequired":true,"route":"all","maxSelections":3,"options":[{"label":"寵物專屬檔案","value":"寵物檔案"},{"label":"足跡時間線","value":"足跡時間線"},{"label":"AI 陪伴互動","value":"AI陪伴"},{"label":"離世紀念空間","value":"紀念空間"},{"label":"社群分享","value":"社群分享"},{"label":"健康紀錄","value":"健康紀錄"}]},
    {"key":"q8","type":"single","content":"你能接受什麼樣的收費方式？","isRequired":true,"route":"all","options":[{"label":"完全免費","value":"免費"},{"label":"部分免費，進階付費","value":"Freemium"},{"label":"月費訂閱","value":"月費"},{"label":"一次買斷","value":"買斷"}]},
    {"key":"q9","type":"text","content":"你最想跟我們說的一句話？","isRequired":false,"route":"all","options":[]}
  ]',
  '{"branchKey":"q1","routes":{"A":["有，現在正在養","曾經養過"],"B":["沒有但未來想養","沒有也不考慮"]}}'
);

-- ===== 🐾 寵物：離世紀念回饋 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '寵物離世紀念回饋',
  '溫柔地了解失去毛孩的飼主需要什麼樣的紀念服務',
  'pet',
  '🌈',
  ARRAY['寵物', '彩虹橋', '紀念', '情感'],
  '{"title":"給牠的最後一封信","subtitle":"謝謝你願意分享這段故事","coverTitle":"有些告別，值得被好好記住","theme":"sakura"}',
  '[
    {"key":"q1","type":"single","content":"你的寵物離開多久了？","isRequired":true,"route":"all","options":[{"label":"不到 1 個月","value":"1個月內"},{"label":"1-6 個月","value":"半年內"},{"label":"半年到 1 年","value":"1年內"},{"label":"超過 1 年","value":"超過1年"}]},
    {"key":"q2","type":"single","content":"你現在最想做的事是什麼？","isRequired":true,"route":"all","options":[{"label":"好好整理牠的照片和回憶","value":"整理回憶"},{"label":"找一個地方紀念牠","value":"紀念空間"},{"label":"跟有同樣經歷的人聊聊","value":"找同伴"},{"label":"暫時不想面對","value":"暫時不想"}]},
    {"key":"q3","type":"multiple","content":"你希望紀念空間有什麼功能？（可複選）","isRequired":false,"route":"all","options":[{"label":"照片/影片時間線","value":"照片時間線"},{"label":"寫信給牠","value":"寫信"},{"label":"點一盞燈/種一棵樹","value":"象徵紀念"},{"label":"看其他飼主的故事","value":"社群故事"},{"label":"AI 模擬對話","value":"AI對話"}]},
    {"key":"q4","type":"scale","content":"你有多想念牠？","isRequired":true,"route":"all","min":1,"max":10,"options":[]},
    {"key":"q5","type":"text","content":"如果可以再跟牠說一句話，你想說什麼？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 🍽️ 餐飲：顧客滿意度調查 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '餐廳顧客滿意度調查',
  '收集顧客對餐廳的整體評價、改善方向、回訪意願',
  'restaurant',
  '🍽️',
  ARRAY['餐飲', '滿意度', 'NPS', '回饋'],
  '{"title":"用餐體驗回饋","subtitle":"你的意見是我們進步的動力","coverTitle":"今天的餐點還滿意嗎？","theme":"candy"}',
  '[
    {"key":"q1","type":"rating","content":"整體用餐體驗評分","isRequired":true,"route":"all","min":1,"max":5,"options":[]},
    {"key":"q2","type":"multiple","content":"你最滿意的部分是？（可複選）","isRequired":true,"route":"all","options":[{"label":"口味","value":"口味"},{"label":"服務態度","value":"服務"},{"label":"用餐環境","value":"環境"},{"label":"價格合理","value":"價格"},{"label":"出餐速度","value":"速度"},{"label":"份量","value":"份量"},{"label":"擺盤","value":"擺盤"}]},
    {"key":"q3","type":"multiple","content":"有什麼地方可以改善？（可複選）","isRequired":false,"route":"all","options":[{"label":"口味偏鹹/偏淡","value":"口味調整"},{"label":"等待時間太長","value":"等待太長"},{"label":"環境太吵","value":"太吵"},{"label":"服務態度","value":"服務態度"},{"label":"價格偏高","value":"價格高"},{"label":"菜單選擇太少","value":"選擇少"},{"label":"沒有特別要改善的","value":"沒有"}]},
    {"key":"q4","type":"single","content":"你今天點的主餐是？","isRequired":false,"route":"all","options":[{"label":"牛排/肉類","value":"肉類"},{"label":"海鮮","value":"海鮮"},{"label":"義大利麵/飯類","value":"麵飯"},{"label":"沙拉/輕食","value":"輕食"},{"label":"套餐","value":"套餐"},{"label":"其他","value":"其他"}]},
    {"key":"q5","type":"single","content":"你會推薦朋友來嗎？","isRequired":true,"route":"all","options":[{"label":"一定會！","value":"一定會"},{"label":"應該會","value":"應該會"},{"label":"不確定","value":"不確定"},{"label":"可能不會","value":"不會"}]},
    {"key":"q6","type":"single","content":"你多久來一次？","isRequired":true,"route":"all","options":[{"label":"第一次來","value":"第一次"},{"label":"一週一次以上","value":"每週"},{"label":"一個月幾次","value":"每月"},{"label":"偶爾來","value":"偶爾"}]},
    {"key":"q7","type":"single","content":"你是怎麼知道我們的？","isRequired":false,"route":"all","options":[{"label":"朋友推薦","value":"朋友"},{"label":"Google 搜尋","value":"Google"},{"label":"社群媒體","value":"社群"},{"label":"路過看到","value":"路過"},{"label":"外送平台","value":"外送"}]},
    {"key":"q8","type":"text","content":"還有什麼想跟我們說的？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 🍽️ 餐飲：新品試吃回饋 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '新品試吃回饋',
  '收集新菜單/新品的顧客第一印象和改善建議',
  'restaurant',
  '🧪',
  ARRAY['餐飲', '新品', '試吃', '口味'],
  '{"title":"新品試吃回饋","subtitle":"你的味蕾是最好的評審","coverTitle":"搶先嘗鮮！告訴我們你的感覺","theme":"candy"}',
  '[
    {"key":"q1","type":"rating","content":"這道新品的整體評分","isRequired":true,"route":"all","min":1,"max":5,"options":[]},
    {"key":"q2","type":"single","content":"口味你覺得如何？","isRequired":true,"route":"all","options":[{"label":"非常好吃","value":"非常好吃"},{"label":"不錯","value":"不錯"},{"label":"普通","value":"普通"},{"label":"不太喜歡","value":"不太喜歡"}]},
    {"key":"q3","type":"multiple","content":"哪些方面你覺得可以調整？（可複選）","isRequired":false,"route":"all","options":[{"label":"偏鹹","value":"偏鹹"},{"label":"偏淡","value":"偏淡"},{"label":"太甜","value":"太甜"},{"label":"份量太少","value":"份量少"},{"label":"份量太多","value":"份量多"},{"label":"口感可以更好","value":"口感"},{"label":"完美不用改","value":"完美"}]},
    {"key":"q4","type":"single","content":"如果正式上架，你願意花多少錢買？","isRequired":true,"route":"all","options":[{"label":"$100 以下","value":"100以下"},{"label":"$100-200","value":"100-200"},{"label":"$200-300","value":"200-300"},{"label":"$300 以上","value":"300以上"},{"label":"不會購買","value":"不會買"}]},
    {"key":"q5","type":"single","content":"你會推薦給朋友嗎？","isRequired":true,"route":"all","options":[{"label":"一定會","value":"一定會"},{"label":"看情況","value":"看情況"},{"label":"不會","value":"不會"}]},
    {"key":"q6","type":"text","content":"還有什麼建議想跟主廚說？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 🛍️ 電商：購物體驗調查 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '購物體驗調查',
  '了解顧客的購買流程、物流體驗、售後滿意度',
  'ecommerce',
  '🛍️',
  ARRAY['電商', '購物', '物流', 'NPS'],
  '{"title":"購物體驗調查","subtitle":"幫助我們給你更好的購物體驗","coverTitle":"你的購物體驗還好嗎？","theme":"cyber"}',
  '[
    {"key":"q1","type":"rating","content":"整體購物體驗評分","isRequired":true,"route":"all","min":1,"max":5,"options":[]},
    {"key":"q2","type":"single","content":"你這次購買的商品類別是？","isRequired":true,"route":"all","options":[{"label":"服飾配件","value":"服飾"},{"label":"3C 電子","value":"3C"},{"label":"食品飲料","value":"食品"},{"label":"居家生活","value":"居家"},{"label":"美妝保養","value":"美妝"},{"label":"其他","value":"其他"}]},
    {"key":"q3","type":"multiple","content":"購物過程中你最滿意的部分？（可複選）","isRequired":true,"route":"all","options":[{"label":"商品品質","value":"品質"},{"label":"價格實惠","value":"價格"},{"label":"出貨速度","value":"出貨快"},{"label":"包裝用心","value":"包裝"},{"label":"客服回應快","value":"客服"},{"label":"網站好找","value":"網站好用"}]},
    {"key":"q4","type":"multiple","content":"有什麼地方需要改善？（可複選）","isRequired":false,"route":"all","options":[{"label":"商品跟圖片有差","value":"圖文不符"},{"label":"出貨太慢","value":"出貨慢"},{"label":"包裝太簡陋","value":"包裝差"},{"label":"退換貨麻煩","value":"退換貨"},{"label":"客服回應慢","value":"客服慢"},{"label":"運費太貴","value":"運費貴"},{"label":"都很好","value":"都很好"}]},
    {"key":"q5","type":"single","content":"你會再回來購買嗎？","isRequired":true,"route":"all","options":[{"label":"一定會","value":"一定會"},{"label":"應該會","value":"應該會"},{"label":"看情況","value":"看情況"},{"label":"不太會","value":"不太會"}]},
    {"key":"q6","type":"scale","content":"你有多大可能推薦我們給朋友？（0=不會，10=一定會）","isRequired":true,"route":"all","min":0,"max":10,"options":[]},
    {"key":"q7","type":"text","content":"有什麼話想跟我們說？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 🚀 SaaS：PMF 產品市場適配度 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  'PMF 產品市場適配度',
  'Sean Ellis 40% 測試 + 功能優先級 + 用戶分群，適合驗證產品市場契合度',
  'saas',
  '🚀',
  ARRAY['SaaS', 'PMF', '產品', '用戶研究'],
  '{"title":"產品使用回饋","subtitle":"幫助我們打造你真正需要的產品","coverTitle":"你的回饋，決定我們的方向","theme":"default"}',
  '[
    {"key":"q1","type":"single","content":"如果這個產品明天消失了，你會有什麼感覺？","isRequired":true,"route":"all","options":[{"label":"非常失望","value":"非常失望"},{"label":"有點失望","value":"有點失望"},{"label":"不太在意","value":"不太在意"},{"label":"完全不影響","value":"不影響"}]},
    {"key":"q2","type":"text","content":"這個產品帶給你最大的價值是什麼？","isRequired":true,"route":"all","options":[]},
    {"key":"q3","type":"single","content":"你多久使用一次？","isRequired":true,"route":"all","options":[{"label":"每天","value":"每天"},{"label":"每週幾次","value":"每週"},{"label":"每月幾次","value":"每月"},{"label":"很少用","value":"很少"}]},
    {"key":"q4","type":"multiple","content":"你最常用哪些功能？（可複選）","isRequired":true,"route":"all","options":[{"label":"核心功能 A","value":"功能A"},{"label":"核心功能 B","value":"功能B"},{"label":"核心功能 C","value":"功能C"},{"label":"進階功能 D","value":"功能D"},{"label":"其他","value":"其他"}]},
    {"key":"q5","type":"multiple","content":"你最希望我們新增什麼功能？（最多選 3）","isRequired":false,"route":"all","maxSelections":3,"options":[{"label":"更好的報表","value":"報表"},{"label":"行動版 App","value":"App"},{"label":"API 串接","value":"API"},{"label":"團隊協作","value":"協作"},{"label":"自動化","value":"自動化"},{"label":"AI 輔助","value":"AI"}]},
    {"key":"q6","type":"single","content":"你覺得目前的定價如何？","isRequired":true,"route":"all","options":[{"label":"很划算","value":"划算"},{"label":"合理","value":"合理"},{"label":"偏貴但值得","value":"偏貴值得"},{"label":"太貴了","value":"太貴"}]},
    {"key":"q7","type":"text","content":"你會怎麼跟朋友介紹這個產品？（用一句話）","isRequired":false,"route":"all","options":[]},
    {"key":"q8","type":"text","content":"最想跟我們說的一件事？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 🚀 SaaS：功能需求優先級 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '功能需求優先級調查',
  '讓用戶排序最想要的新功能，幫助產品團隊決定開發順序',
  'saas',
  '📊',
  ARRAY['SaaS', '功能', '需求', '排序'],
  '{"title":"功能需求調查","subtitle":"你的需求決定我們的開發順序","coverTitle":"幫我們排個優先級吧！","theme":"default"}',
  '[
    {"key":"q1","type":"single","content":"你的角色是？","isRequired":true,"route":"all","options":[{"label":"創辦人/老闆","value":"創辦人"},{"label":"產品經理","value":"PM"},{"label":"工程師","value":"工程師"},{"label":"行銷人員","value":"行銷"},{"label":"一般使用者","value":"使用者"}]},
    {"key":"q2","type":"multiple","content":"以下功能你最需要哪些？（最多選 3）","isRequired":true,"route":"all","maxSelections":3,"options":[{"label":"數據儀表板","value":"儀表板"},{"label":"自動化工作流","value":"自動化"},{"label":"API 開放平台","value":"API"},{"label":"AI 智慧分析","value":"AI"},{"label":"多語言支援","value":"多語言"},{"label":"行動版 App","value":"App"},{"label":"團隊權限管理","value":"權限"},{"label":"Webhook 整合","value":"Webhook"}]},
    {"key":"q3","type":"single","content":"目前最困擾你的問題是什麼？","isRequired":true,"route":"all","options":[{"label":"功能不夠用","value":"功能不足"},{"label":"操作太複雜","value":"太複雜"},{"label":"速度太慢","value":"太慢"},{"label":"價格太高","value":"太貴"},{"label":"缺少整合","value":"缺整合"}]},
    {"key":"q4","type":"scale","content":"你對目前產品的滿意度？","isRequired":true,"route":"all","min":1,"max":10,"options":[]},
    {"key":"q5","type":"text","content":"如果只能改一個東西，你希望改什麼？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 📚 教育：課程滿意度 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '課程滿意度調查',
  '收集學生/學員對課程的評價、學習效果、改善建議',
  'education',
  '📚',
  ARRAY['教育', '課程', '滿意度', '教學'],
  '{"title":"課程回饋問卷","subtitle":"你的回饋幫助我們做得更好","coverTitle":"這門課，你覺得如何？","theme":"ocean"}',
  '[
    {"key":"q1","type":"rating","content":"課程整體評分","isRequired":true,"route":"all","min":1,"max":5,"options":[]},
    {"key":"q2","type":"single","content":"課程內容的難度對你來說？","isRequired":true,"route":"all","options":[{"label":"太簡單","value":"太簡單"},{"label":"剛好適中","value":"適中"},{"label":"有點難但跟得上","value":"有點難"},{"label":"太難了","value":"太難"}]},
    {"key":"q3","type":"multiple","content":"你最喜歡課程的哪些部分？（可複選）","isRequired":true,"route":"all","options":[{"label":"老師講解清楚","value":"講解清楚"},{"label":"實作練習","value":"實作"},{"label":"案例分享","value":"案例"},{"label":"互動討論","value":"互動"},{"label":"教材品質","value":"教材"},{"label":"同學交流","value":"同學"}]},
    {"key":"q4","type":"multiple","content":"有什麼可以改善的？（可複選）","isRequired":false,"route":"all","options":[{"label":"講太快","value":"太快"},{"label":"內容太淺","value":"太淺"},{"label":"缺少實作","value":"缺實作"},{"label":"時間太長","value":"太長"},{"label":"教材需要更新","value":"教材舊"},{"label":"都很好","value":"都很好"}]},
    {"key":"q5","type":"single","content":"學完這門課後，你覺得自己的能力有提升嗎？","isRequired":true,"route":"all","options":[{"label":"提升很多","value":"很多"},{"label":"有一些提升","value":"一些"},{"label":"不太確定","value":"不確定"},{"label":"沒什麼改變","value":"沒改變"}]},
    {"key":"q6","type":"single","content":"你會推薦這門課給朋友嗎？","isRequired":true,"route":"all","options":[{"label":"一定會","value":"一定會"},{"label":"應該會","value":"應該會"},{"label":"不確定","value":"不確定"},{"label":"不會","value":"不會"}]},
    {"key":"q7","type":"text","content":"你最希望老師補充什麼內容？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 🎤 教育：活動/講座回饋 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '活動/講座回饋',
  '活動結束後收集參與者的滿意度和改善建議',
  'education',
  '🎤',
  ARRAY['活動', '講座', '回饋', '研討會'],
  '{"title":"活動回饋問卷","subtitle":"感謝你的參與！","coverTitle":"今天的活動你覺得怎麼樣？","theme":"default"}',
  '[
    {"key":"q1","type":"rating","content":"活動整體評分","isRequired":true,"route":"all","min":1,"max":5,"options":[]},
    {"key":"q2","type":"single","content":"活動內容符合你的期待嗎？","isRequired":true,"route":"all","options":[{"label":"超出期待","value":"超出"},{"label":"符合期待","value":"符合"},{"label":"還好","value":"還好"},{"label":"不太符合","value":"不符合"}]},
    {"key":"q3","type":"single","content":"講者的表現如何？","isRequired":true,"route":"all","options":[{"label":"非常精彩","value":"精彩"},{"label":"內容充實","value":"充實"},{"label":"普通","value":"普通"},{"label":"有待加強","value":"待加強"}]},
    {"key":"q4","type":"multiple","content":"你覺得哪些部分最有收穫？（可複選）","isRequired":false,"route":"all","options":[{"label":"專業知識","value":"專業知識"},{"label":"實務經驗","value":"實務"},{"label":"人脈交流","value":"人脈"},{"label":"新的靈感","value":"靈感"},{"label":"工具/資源","value":"工具"}]},
    {"key":"q5","type":"single","content":"你會參加我們下次的活動嗎？","isRequired":true,"route":"all","options":[{"label":"一定會","value":"一定會"},{"label":"看主題決定","value":"看主題"},{"label":"不確定","value":"不確定"},{"label":"不會","value":"不會"}]},
    {"key":"q6","type":"text","content":"你希望下次活動聊什麼主題？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 👥 HR：員工滿意度調查 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '員工滿意度調查',
  '匿名了解員工的工作滿意度、管理評價、離職風險',
  'hr',
  '👥',
  ARRAY['HR', '員工', '滿意度', 'eNPS'],
  '{"title":"員工滿意度調查","subtitle":"你的聲音很重要（本問卷完全匿名）","coverTitle":"讓我們一起打造更好的工作環境","theme":"ocean"}',
  '[
    {"key":"q1","type":"scale","content":"整體而言，你對目前工作的滿意度？（1=非常不滿意，10=非常滿意）","isRequired":true,"route":"all","min":1,"max":10,"options":[]},
    {"key":"q2","type":"single","content":"你覺得目前的工作量如何？","isRequired":true,"route":"all","options":[{"label":"太多，常常加班","value":"太多"},{"label":"剛好適中","value":"適中"},{"label":"有點輕鬆","value":"輕鬆"},{"label":"太少，想做更多","value":"太少"}]},
    {"key":"q3","type":"multiple","content":"你最重視工作中的哪些因素？（最多選 3）","isRequired":true,"route":"all","maxSelections":3,"options":[{"label":"薪資福利","value":"薪資"},{"label":"工作彈性","value":"彈性"},{"label":"成長機會","value":"成長"},{"label":"團隊氛圍","value":"團隊"},{"label":"主管管理","value":"主管"},{"label":"公司願景","value":"願景"},{"label":"工作內容","value":"內容"}]},
    {"key":"q4","type":"single","content":"你的直屬主管給你足夠的支持嗎？","isRequired":true,"route":"all","options":[{"label":"非常支持","value":"非常支持"},{"label":"大部分時候有","value":"大部分有"},{"label":"偶爾","value":"偶爾"},{"label":"幾乎沒有","value":"沒有"}]},
    {"key":"q5","type":"single","content":"你覺得公司有提供足夠的成長和學習機會嗎？","isRequired":true,"route":"all","options":[{"label":"非常充足","value":"充足"},{"label":"還可以","value":"還可以"},{"label":"不太夠","value":"不太夠"},{"label":"完全沒有","value":"沒有"}]},
    {"key":"q6","type":"scale","content":"你有多大可能推薦朋友來這裡工作？（0=不會，10=一定會）","isRequired":true,"route":"all","min":0,"max":10,"options":[]},
    {"key":"q7","type":"single","content":"接下來半年，你有考慮離開嗎？","isRequired":true,"route":"all","options":[{"label":"完全沒有","value":"沒有"},{"label":"偶爾會想","value":"偶爾"},{"label":"正在考慮","value":"正在考慮"},{"label":"已經在找了","value":"已在找"}]},
    {"key":"q8","type":"text","content":"如果你能改變公司一件事，你會改什麼？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 🤝 HR：面試體驗回饋 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '面試體驗回饋',
  '收集候選人面試後的體驗回饋，提升雇主品牌',
  'hr',
  '🤝',
  ARRAY['HR', '面試', '候選人', '雇主品牌'],
  '{"title":"面試體驗回饋","subtitle":"感謝你來面試！不管結果如何，你的回饋都很重要","coverTitle":"面試過程還順利嗎？","theme":"default"}',
  '[
    {"key":"q1","type":"rating","content":"面試整體體驗評分","isRequired":true,"route":"all","min":1,"max":5,"options":[]},
    {"key":"q2","type":"single","content":"面試流程清楚嗎？","isRequired":true,"route":"all","options":[{"label":"非常清楚","value":"非常清楚"},{"label":"大致清楚","value":"大致清楚"},{"label":"有些混亂","value":"混亂"},{"label":"完全不清楚","value":"不清楚"}]},
    {"key":"q3","type":"single","content":"面試官給你的感覺如何？","isRequired":true,"route":"all","options":[{"label":"專業友善","value":"專業友善"},{"label":"還不錯","value":"不錯"},{"label":"普通","value":"普通"},{"label":"不太友善","value":"不友善"}]},
    {"key":"q4","type":"single","content":"等待時間合理嗎？","isRequired":true,"route":"all","options":[{"label":"很準時","value":"準時"},{"label":"等了一下但可以接受","value":"可接受"},{"label":"等太久了","value":"太久"}]},
    {"key":"q5","type":"single","content":"面試後你對這家公司的印象？","isRequired":true,"route":"all","options":[{"label":"更想加入了","value":"更想加入"},{"label":"維持不變","value":"不變"},{"label":"有點猶豫","value":"猶豫"},{"label":"不太想了","value":"不想了"}]},
    {"key":"q6","type":"text","content":"有什麼建議想給我們的面試流程？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== ⭐ 通用：NPS 淨推薦分數 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  'NPS 淨推薦分數',
  '標準 NPS 問卷（0-10 推薦度 + 開放題），適用任何行業',
  'general',
  '⭐',
  ARRAY['NPS', '推薦', '通用', '滿意度'],
  '{"title":"NPS 調查","subtitle":"一個簡單的問題","coverTitle":"你會推薦我們嗎？","theme":"default"}',
  '[
    {"key":"q1","type":"scale","content":"你有多大可能把我們推薦給朋友或同事？（0=完全不會，10=一定會）","isRequired":true,"route":"all","min":0,"max":10,"options":[]},
    {"key":"q2","type":"text","content":"最主要的原因是什麼？","isRequired":true,"route":"all","options":[]},
    {"key":"q3","type":"text","content":"有什麼我們可以做得更好的？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 📝 通用：活動報名表 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '活動報名表',
  '收集報名者的基本資訊、偏好、特殊需求',
  'general',
  '📝',
  ARRAY['報名', '活動', '通用', '表單'],
  '{"title":"活動報名","subtitle":"填寫以下資訊完成報名","coverTitle":"歡迎參加！","theme":"default"}',
  '[
    {"key":"q1","type":"text","content":"你的姓名","isRequired":true,"route":"all","options":[]},
    {"key":"q2","type":"text","content":"聯絡 Email","isRequired":true,"route":"all","options":[]},
    {"key":"q3","type":"text","content":"聯絡電話（選填）","isRequired":false,"route":"all","options":[]},
    {"key":"q4","type":"single","content":"你想參加哪個場次？","isRequired":true,"route":"all","options":[{"label":"第一場（上午）","value":"上午場"},{"label":"第二場（下午）","value":"下午場"},{"label":"都可以","value":"都可以"}]},
    {"key":"q5","type":"single","content":"你是怎麼知道這個活動的？","isRequired":false,"route":"all","options":[{"label":"朋友推薦","value":"朋友"},{"label":"社群媒體","value":"社群"},{"label":"Email 通知","value":"Email"},{"label":"網站","value":"網站"},{"label":"其他","value":"其他"}]},
    {"key":"q6","type":"text","content":"有什麼特殊需求或想問的問題？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 💬 通用：快速意見回饋 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '快速意見回饋',
  '最簡單的回饋問卷（3 題），適合嵌入任何場景',
  'general',
  '💬',
  ARRAY['回饋', '建議', '通用', '簡單', '快速'],
  '{"title":"意見回饋","subtitle":"只要 30 秒","coverTitle":"你的意見很重要！","theme":"default"}',
  '[
    {"key":"q1","type":"rating","content":"整體滿意度","isRequired":true,"route":"all","min":1,"max":5,"options":[]},
    {"key":"q2","type":"single","content":"你覺得最需要改善的是？","isRequired":true,"route":"all","options":[{"label":"產品品質","value":"品質"},{"label":"服務態度","value":"服務"},{"label":"價格","value":"價格"},{"label":"速度","value":"速度"},{"label":"都很好","value":"都很好"}]},
    {"key":"q3","type":"text","content":"還有什麼想說的？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 💚 醫療：看診體驗回饋 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '看診體驗回饋',
  '收集患者對診所/醫院的看診體驗、等候時間、服務滿意度',
  'health',
  '💚',
  ARRAY['醫療', '診所', '看診', '滿意度'],
  '{"title":"看診體驗回饋","subtitle":"你的回饋幫助我們提供更好的醫療服務","coverTitle":"今天的看診還順利嗎？","theme":"ocean"}',
  '[
    {"key":"q1","type":"rating","content":"整體看診體驗評分","isRequired":true,"route":"all","min":1,"max":5,"options":[]},
    {"key":"q2","type":"single","content":"等候時間你覺得如何？","isRequired":true,"route":"all","options":[{"label":"很快，幾乎沒等","value":"很快"},{"label":"合理範圍內","value":"合理"},{"label":"有點久","value":"有點久"},{"label":"等太久了","value":"太久"}]},
    {"key":"q3","type":"single","content":"醫師的說明清楚嗎？","isRequired":true,"route":"all","options":[{"label":"非常清楚，很有耐心","value":"非常清楚"},{"label":"大致清楚","value":"大致清楚"},{"label":"有些地方聽不懂","value":"不太清楚"},{"label":"幾乎沒解釋","value":"沒解釋"}]},
    {"key":"q4","type":"single","content":"護理人員的服務態度？","isRequired":true,"route":"all","options":[{"label":"非常親切","value":"親切"},{"label":"還不錯","value":"不錯"},{"label":"普通","value":"普通"},{"label":"需要加強","value":"需加強"}]},
    {"key":"q5","type":"single","content":"掛號流程方便嗎？","isRequired":true,"route":"all","options":[{"label":"非常方便","value":"方便"},{"label":"還可以","value":"還可以"},{"label":"有點麻煩","value":"麻煩"},{"label":"很不方便","value":"不方便"}]},
    {"key":"q6","type":"single","content":"你會推薦親友來這裡看診嗎？","isRequired":true,"route":"all","options":[{"label":"一定會","value":"一定會"},{"label":"應該會","value":"應該會"},{"label":"不確定","value":"不確定"},{"label":"不會","value":"不會"}]},
    {"key":"q7","type":"text","content":"有什麼建議想跟我們說？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 🏋️ 健身：會員滿意度 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '健身房會員滿意度',
  '了解會員對健身房設備、教練、環境的滿意度',
  'fitness',
  '🏋️',
  ARRAY['健身', '會員', '滿意度', '運動'],
  '{"title":"會員滿意度調查","subtitle":"幫助我們打造更好的運動空間","coverTitle":"你的健身體驗還好嗎？","theme":"forest"}',
  '[
    {"key":"q1","type":"rating","content":"整體滿意度","isRequired":true,"route":"all","min":1,"max":5,"options":[]},
    {"key":"q2","type":"single","content":"你多久來一次？","isRequired":true,"route":"all","options":[{"label":"每天","value":"每天"},{"label":"一週 3-5 次","value":"3-5次"},{"label":"一週 1-2 次","value":"1-2次"},{"label":"偶爾","value":"偶爾"}]},
    {"key":"q3","type":"multiple","content":"你最常使用哪些設施？（可複選）","isRequired":true,"route":"all","options":[{"label":"重訓區","value":"重訓"},{"label":"有氧區","value":"有氧"},{"label":"團體課程","value":"團課"},{"label":"瑜伽/伸展區","value":"瑜伽"},{"label":"淋浴/更衣室","value":"淋浴"},{"label":"私人教練","value":"私教"}]},
    {"key":"q4","type":"multiple","content":"哪些地方可以改善？（可複選）","isRequired":false,"route":"all","options":[{"label":"設備太舊","value":"設備舊"},{"label":"太擁擠","value":"擁擠"},{"label":"清潔度","value":"清潔"},{"label":"教練不夠專業","value":"教練"},{"label":"營業時間","value":"時間"},{"label":"停車不方便","value":"停車"},{"label":"都很好","value":"都好"}]},
    {"key":"q5","type":"single","content":"你會續約嗎？","isRequired":true,"route":"all","options":[{"label":"一定會","value":"一定會"},{"label":"看情況","value":"看情況"},{"label":"正在考慮其他選擇","value":"考慮中"},{"label":"不會","value":"不會"}]},
    {"key":"q6","type":"text","content":"有什麼話想跟我們說？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- ===== 🏠 房地產：看屋體驗回饋 =====
INSERT INTO survey_templates (source, name, description, industry, icon, tags, survey_config, questions, branch_config) VALUES (
  'platform',
  '看屋體驗回饋',
  '收集看屋客戶的回饋、購屋意願、最在意的因素',
  'realestate',
  '🏠',
  ARRAY['房地產', '看屋', '購屋', '回饋'],
  '{"title":"看屋體驗回饋","subtitle":"謝謝你今天來看屋！","coverTitle":"這間房子你覺得如何？","theme":"default"}',
  '[
    {"key":"q1","type":"rating","content":"今天看屋的整體體驗","isRequired":true,"route":"all","min":1,"max":5,"options":[]},
    {"key":"q2","type":"single","content":"這間房子符合你的需求嗎？","isRequired":true,"route":"all","options":[{"label":"非常符合","value":"非常符合"},{"label":"大致符合","value":"大致符合"},{"label":"有些差距","value":"有差距"},{"label":"完全不符合","value":"不符合"}]},
    {"key":"q3","type":"multiple","content":"你最在意的購屋因素是？（最多選 3）","isRequired":true,"route":"all","maxSelections":3,"options":[{"label":"價格","value":"價格"},{"label":"地段","value":"地段"},{"label":"坪數格局","value":"格局"},{"label":"採光通風","value":"採光"},{"label":"交通便利","value":"交通"},{"label":"學區","value":"學區"},{"label":"社區管理","value":"管理"},{"label":"屋齡","value":"屋齡"}]},
    {"key":"q4","type":"single","content":"你目前的購屋計畫是？","isRequired":true,"route":"all","options":[{"label":"近期要買","value":"近期"},{"label":"半年內","value":"半年"},{"label":"一年內","value":"一年"},{"label":"只是先看看","value":"先看看"}]},
    {"key":"q5","type":"single","content":"業務人員的服務如何？","isRequired":true,"route":"all","options":[{"label":"非常專業親切","value":"專業親切"},{"label":"還不錯","value":"不錯"},{"label":"普通","value":"普通"},{"label":"需要加強","value":"需加強"}]},
    {"key":"q6","type":"text","content":"有什麼問題或建議想跟我們說？","isRequired":false,"route":"all","options":[]}
  ]',
  NULL
);

-- 將 NPS、活動報名、快速回饋設為精選
UPDATE survey_templates SET is_featured = true WHERE name IN ('NPS 淨推薦分數', '活動報名表', '快速意見回饋');
