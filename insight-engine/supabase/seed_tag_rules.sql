-- ===== Seed: 將 analyzeResponse.ts 的 hardcoded 規則寫入 tag_rules =====
-- survey_id = MVP 問卷 00000000-0000-0000-0000-000000000001

-- Q1：飼主狀態 (exact match)
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q1', '有，現在正在養', 'exact', 'pet_owner_status', 'current', 0),
  ('00000000-0000-0000-0000-000000000001', 'q1', '曾經養過', 'exact', 'pet_owner_status', 'past', 0),
  ('00000000-0000-0000-0000-000000000001', 'q1', '沒有，但未來想養', 'exact', 'pet_owner_status', 'future', 0),
  ('00000000-0000-0000-0000-000000000001', 'q1', '沒有，也暫時不考慮', 'exact', 'pet_owner_status', 'none', 0),
  ('00000000-0000-0000-0000-000000000001', 'q1', '曾經養過', 'exact', 'loss_status', 'true', 0),
  ('00000000-0000-0000-0000-000000000001', 'q1', '有，現在正在養', 'exact', 'loss_status', 'false', 0),
  ('00000000-0000-0000-0000-000000000001', 'q1', '沒有，但未來想養', 'exact', 'loss_status', 'false', 0),
  ('00000000-0000-0000-0000-000000000001', 'q1', '沒有，也暫時不考慮', 'exact', 'loss_status', 'false', 0)
ON CONFLICT DO NOTHING;

-- Q2 (A路線)：寵物類型 (contains — 多選)
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q2', '狗', 'contains', 'pet_type', 'dog', 0),
  ('00000000-0000-0000-0000-000000000001', 'q2', '貓', 'contains', 'pet_type', 'cat', 0),
  ('00000000-0000-0000-0000-000000000001', 'q2', '倉鼠 / 兔子/小動物', 'contains', 'pet_type', 'small_animal', 0),
  ('00000000-0000-0000-0000-000000000001', 'q2', '鳥類', 'contains', 'pet_type', 'bird', 0),
  ('00000000-0000-0000-0000-000000000001', 'q2', '水族/爬蟲/特殊寵物', 'contains', 'pet_type', 'exotic', 0),
  ('00000000-0000-0000-0000-000000000001', 'q2', '其他', 'contains', 'pet_type', 'other', 0)
ON CONFLICT DO NOTHING;

-- Q3 (A路線)：記錄習慣 — 用 contains 匹配個別選項
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q3', 'IG／FB／社群發文', 'contains', 'record_habit', 'active', 10),
  ('00000000-0000-0000-0000-000000000001', 'q3', '寫文字或日記', 'contains', 'record_habit', 'active', 10),
  ('00000000-0000-0000-0000-000000000001', 'q3', '幾乎沒有特別紀錄', 'contains', 'record_habit', 'low', 5)
ON CONFLICT DO NOTHING;

-- Q4 (A路線)：回看頻率
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q4', '幾乎每天', 'exact', 'revisit_frequency', 'daily', 0),
  ('00000000-0000-0000-0000-000000000001', 'q4', '一週幾次', 'exact', 'revisit_frequency', 'weekly', 0),
  ('00000000-0000-0000-0000-000000000001', 'q4', '偶爾才會', 'exact', 'revisit_frequency', 'occasional', 0),
  ('00000000-0000-0000-0000-000000000001', 'q4', '幾乎不會', 'exact', 'revisit_frequency', 'rare', 0)
ON CONFLICT DO NOTHING;

-- Q5 (A路線)：記憶模糊 → emotion_level
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q5', '常常會', 'exact', 'emotion_level', 'high', 0),
  ('00000000-0000-0000-0000-000000000001', 'q5', '偶爾會', 'exact', 'emotion_level', 'medium', 0),
  ('00000000-0000-0000-0000-000000000001', 'q5', '很少會', 'exact', 'emotion_level', 'low', 0),
  ('00000000-0000-0000-0000-000000000001', 'q5', '幾乎沒想過', 'exact', 'emotion_level', 'low', 0)
ON CONFLICT DO NOTHING;

-- Q6 (A路線)：保留優先 + 紀念需求
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q6', '牠的照片與影片', 'exact', 'preserve_priority', 'media', 0),
  ('00000000-0000-0000-0000-000000000001', 'q6', '和牠發生過的故事', 'exact', 'preserve_priority', 'story', 0),
  ('00000000-0000-0000-0000-000000000001', 'q6', '牠的聲音／互動感', 'exact', 'preserve_priority', 'interaction', 0),
  ('00000000-0000-0000-0000-000000000001', 'q6', '牠的成長過程', 'exact', 'preserve_priority', 'growth', 0),
  ('00000000-0000-0000-0000-000000000001', 'q6', '一種「牠還存在過」的感覺', 'exact', 'preserve_priority', 'existence', 0),
  ('00000000-0000-0000-0000-000000000001', 'q6', '一種「牠還存在過」的感覺', 'exact', 'memorial_need', 'high', 0),
  ('00000000-0000-0000-0000-000000000001', 'q6', '和牠發生過的故事', 'exact', 'memorial_need', 'high', 0)
ON CONFLICT DO NOTHING;

-- Q7 (共用)：平台興趣
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q7', '很有興趣', 'exact', 'platform_interest', 'positive', 0),
  ('00000000-0000-0000-0000-000000000001', 'q7', '可能會試試看', 'exact', 'platform_interest', 'positive', 0),
  ('00000000-0000-0000-0000-000000000001', 'q7', '不確定', 'exact', 'platform_interest', 'neutral', 0),
  ('00000000-0000-0000-0000-000000000001', 'q7', '沒興趣', 'exact', 'platform_interest', 'neutral', 0)
ON CONFLICT DO NOTHING;

-- Q8 (共用 multiple max 3)：功能興趣
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q8', '寵物專屬檔案', 'contains', 'interest_profile', 'true', 0),
  ('00000000-0000-0000-0000-000000000001', 'q8', '足跡時間線／回憶整理', 'contains', 'interest_memory', 'true', 0),
  ('00000000-0000-0000-0000-000000000001', 'q8', 'AI 陪伴／互動', 'contains', 'interest_ai', 'true', 0),
  ('00000000-0000-0000-0000-000000000001', 'q8', '離世紀念空間', 'contains', 'interest_memorial', 'true', 0),
  ('00000000-0000-0000-0000-000000000001', 'q8', '看別人的寵物故事', 'contains', 'interest_social', 'true', 0),
  ('00000000-0000-0000-0000-000000000001', 'q8', '認養／流浪動物資訊', 'contains', 'interest_adoption', 'true', 0),
  ('00000000-0000-0000-0000-000000000001', 'q8', '未來提醒／重要日子紀錄', 'contains', 'interest_reminder', 'true', 0),
  ('00000000-0000-0000-0000-000000000001', 'q8', '離世紀念空間', 'contains', 'memorial_need', 'high', 1)
ON CONFLICT DO NOTHING;

-- Q9 (共用)：付費意願
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q9', '免費使用就好', 'exact', 'payment_intent', 'free_only', 0),
  ('00000000-0000-0000-0000-000000000001', 'q9', '部分免費，進階功能付費', 'exact', 'payment_intent', 'freemium', 0),
  ('00000000-0000-0000-0000-000000000001', 'q9', '一次性付費', 'exact', 'payment_intent', 'one_time', 0),
  ('00000000-0000-0000-0000-000000000001', 'q9', '小額訂閱', 'exact', 'payment_intent', 'subscription', 0),
  ('00000000-0000-0000-0000-000000000001', 'q9', '目前還不確定', 'exact', 'payment_intent', 'unsure', 0)
ON CONFLICT DO NOTHING;

-- Q10 (共用)：平台定位願景
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q10', '幫我整理寵物足跡的地方', 'exact', 'platform_vision', 'record_tool', 0),
  ('00000000-0000-0000-0000-000000000001', 'q10', '可以紀念牠的地方', 'exact', 'platform_vision', 'memorial_space', 0),
  ('00000000-0000-0000-0000-000000000001', 'q10', '可以認識別人家寵物的地方', 'exact', 'platform_vision', 'social_platform', 0),
  ('00000000-0000-0000-0000-000000000001', 'q10', '可以陪伴我與牠日常的地方', 'exact', 'platform_vision', 'companion_product', 0),
  ('00000000-0000-0000-0000-000000000001', 'q10', '還不確定，但願意看看', 'exact', 'platform_vision', 'exploring', 0)
ON CONFLICT DO NOTHING;

-- B路線 Q2B：未來記錄意願
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q2b', '發社群', 'contains', 'future_record_intent', 'active', 10),
  ('00000000-0000-0000-0000-000000000001', 'q2b', '寫文字或日記', 'contains', 'future_record_intent', 'active', 10),
  ('00000000-0000-0000-0000-000000000001', 'q2b', '可能不太會特別記錄', 'contains', 'future_record_intent', 'low', 5),
  ('00000000-0000-0000-0000-000000000001', 'q2b', '還沒想過', 'contains', 'future_record_intent', 'low', 5)
ON CONFLICT DO NOTHING;

-- B路線 Q3B：記憶意識
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q3b', '會', 'exact', 'memory_awareness', 'high', 0),
  ('00000000-0000-0000-0000-000000000001', 'q3b', '有一點', 'exact', 'memory_awareness', 'high', 0)
ON CONFLICT DO NOTHING;

-- B路線 Q4B：成長紀錄關注
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q4b', '很在意', 'exact', 'growth_record_care', 'positive', 0),
  ('00000000-0000-0000-0000-000000000001', 'q4b', '還不錯', 'exact', 'growth_record_care', 'positive', 0)
ON CONFLICT DO NOTHING;

-- B路線 Q5B：足跡興趣
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q5b', '很有興趣', 'exact', 'footprint_interest_b', 'positive', 0),
  ('00000000-0000-0000-0000-000000000001', 'q5b', '可能會試試看', 'exact', 'footprint_interest_b', 'positive', 0)
ON CONFLICT DO NOTHING;

-- C路線 Q2C：不養寵物原因 (multiple)
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q2c', '時間不夠', 'contains', 'no_pet_reason', 'time', 0),
  ('00000000-0000-0000-0000-000000000001', 'q2c', '經濟因素', 'contains', 'no_pet_reason', 'finance', 0),
  ('00000000-0000-0000-0000-000000000001', 'q2c', '居住環境不適合', 'contains', 'no_pet_reason', 'environment', 0),
  ('00000000-0000-0000-0000-000000000001', 'q2c', '沒有特別興趣', 'contains', 'no_pet_reason', 'no_interest', 0),
  ('00000000-0000-0000-0000-000000000001', 'q2c', '曾經有不好的經驗', 'contains', 'no_pet_reason', 'bad_experience', 0),
  ('00000000-0000-0000-0000-000000000001', 'q2c', '其他', 'contains', 'no_pet_reason', 'other', 0)
ON CONFLICT DO NOTHING;

-- C路線 Q3C：寵物親近度
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q3c', '有，而且很親近', 'exact', 'pet_proximity', 'close', 0),
  ('00000000-0000-0000-0000-000000000001', 'q3c', '有，但沒有特別接觸', 'exact', 'pet_proximity', 'distant', 0)
ON CONFLICT DO NOTHING;

-- C路線 Q4C：寵物重要性認同
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q4c', '很認同', 'exact', 'pet_importance_agree', 'positive', 0),
  ('00000000-0000-0000-0000-000000000001', 'q4c', '還算認同', 'exact', 'pet_importance_agree', 'positive', 0)
ON CONFLICT DO NOTHING;

-- C路線 Q5C：故事意義
INSERT INTO tag_rules (survey_id, question_key, answer_value, match_mode, tag_key, tag_value, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'q5c', '很有意義', 'exact', 'story_meaning_c', 'positive', 0),
  ('00000000-0000-0000-0000-000000000001', 'q5c', '還不錯', 'exact', 'story_meaning_c', 'positive', 0)
ON CONFLICT DO NOTHING;
