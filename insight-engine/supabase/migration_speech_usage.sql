-- YukiBoard 語音辨識（Azure）的每人每日用量
CREATE TABLE IF NOT EXISTS speech_usage (
  user_id TEXT NOT NULL,
  day DATE NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
