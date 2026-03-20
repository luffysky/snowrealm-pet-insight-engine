-- Phase 12: 題目章節系統 (chapter/scene)
-- 為 questions 表新增 chapter、emoji、narrative 欄位
-- 支援遊戲化問卷的場景敘事功能

ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS emoji TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS narrative TEXT;

-- 更新 MVP 問卷的章節資料
UPDATE questions SET chapter = '序章', emoji = '🐾', narrative = '每段旅程的開始，都從一個簡單的問題開始⋯⋯'
WHERE key = 'q1';

-- A 路線 (有養/曾養)
UPDATE questions SET chapter = '第一章 · 相遇', emoji = '🐶', narrative = '讓我們聊聊你和毛孩的故事吧。'
WHERE key = 'q2';
UPDATE questions SET chapter = '第一章 · 相遇', emoji = '📸', narrative = '每張照片都是一段被保存的時光。'
WHERE key = 'q3';
UPDATE questions SET chapter = '第二章 · 回憶', emoji = '🖼️', narrative = '那些照片和影片，你還記得最後一次翻看是什麼時候嗎？'
WHERE key = 'q4';
UPDATE questions SET chapter = '第二章 · 回憶', emoji = '💭', narrative = '有些事情不說出來，慢慢就會模糊了⋯⋯'
WHERE key = 'q5';

-- B 路線 (沒養但考慮)
UPDATE questions SET chapter = '第一章 · 想像', emoji = '✨', narrative = '雖然還沒有毛孩，但你的心裡一定有個畫面。'
WHERE key = 'q2b';
UPDATE questions SET chapter = '第一章 · 想像', emoji = '📝', narrative = '生活裡很多珍貴的瞬間，其實不經意就溜走了。'
WHERE key = 'q3b';
UPDATE questions SET chapter = '第二章 · 期待', emoji = '🌱', narrative = '如果有一天牠來到你身邊⋯⋯'
WHERE key = 'q4b';
UPDATE questions SET chapter = '第二章 · 期待', emoji = '🏡', narrative = '一個能好好記住牠的地方，你覺得呢？'
WHERE key = 'q5b';

-- C 路線 (沒養也不考慮)
UPDATE questions SET chapter = '第一章 · 理解', emoji = '🤔', narrative = '沒關係，每個人都有自己的考量。'
WHERE key = 'q2c';
UPDATE questions SET chapter = '第一章 · 理解', emoji = '👋', narrative = '也許你身邊有人很在乎牠們的毛孩。'
WHERE key = 'q3c';
UPDATE questions SET chapter = '第二章 · 共鳴', emoji = '💕', narrative = '即使沒有養過，你也能感受到那份連結嗎？'
WHERE key = 'q4c';
UPDATE questions SET chapter = '第二章 · 共鳴', emoji = '📖', narrative = '一段關於毛孩一生的故事⋯⋯'
WHERE key = 'q5c';

-- 共用題
UPDATE questions SET chapter = '第三章 · 足跡', emoji = '🗺️', narrative = '如果可以把牠的一生，變成一段可以回頭的旅程⋯⋯'
WHERE key = 'q6';
UPDATE questions SET chapter = '第三章 · 足跡', emoji = '👣', narrative = '一個慢慢整理牠一生的地方，聽起來如何？'
WHERE key = 'q7';
UPDATE questions SET chapter = '第四章 · 未來', emoji = '⭐', narrative = '你的選擇，將決定我們優先打造什麼。'
WHERE key = 'q8';
UPDATE questions SET chapter = '第四章 · 未來', emoji = '💎', narrative = '如果這個地方真的做得很好⋯⋯'
WHERE key = 'q9';
UPDATE questions SET chapter = '終章', emoji = '🏠', narrative = '最後一個問題。你心目中的毛行天下，是什麼樣子？'
WHERE key = 'q10';
UPDATE questions SET chapter = '終章', emoji = '✉️', narrative = '如果你願意，留下一句話給我們和牠。'
WHERE key = 'q11';
