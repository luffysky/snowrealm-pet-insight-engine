**submit route 防跨問卷汙染** — 需要改 `src/app/api/surveys/submit/route.ts`，在使用 `progressResponseId` 前加檢查：

```typescript
// 如果 progressResponseId 的 survey_id 跟當前問卷不一致，就忽略它
if (progressResponseId) {
  const existing = await queryOne('SELECT survey_id FROM responses WHERE id = $1', [progressResponseId])
  if (existing && existing.survey_id !== surveyId) {
    progressResponseId = undefined  // 不匹配，建新的
  }
}
```



**ai_usage_logs constraint** — 不是程式碼，是在 Supabase 跑 SQL：

```sql
ALTER TABLE ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_action_check;
ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_check
  CHECK (action IN ('generate','regenerate','generate_meta','regenerate_meta','chat','insight','story','sentiment'));
```

所以你現在要做的：
1. 讓 Cursor 改 submit route 加 survey_id 檢查
2. 去 Supabase 跑那段 ALTER TABLE SQL