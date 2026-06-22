# Daily Works — 2026-06-23（Insight Engine）

董事長林董。雪鑰值班。跨專案同步：ai-island-web 與 insight-engine 部落格都要能放圖/影/音。

## 📝 部落格編輯器：新增「上傳音樂」
- `BlogTipTapEditor.tsx`：
  - 新增 **AudioExtension**（Node、`<audio controls>`、parseHTML `audio[src]`、setAudio 命令），mirror 既有 VideoExtension。
  - 註冊進 extensions。
  - 新增 `uploadAudio()`（≤30MB、走既有 `/api/admin/social/messages/upload`，該 route 已支援 audio MIME 自動辨識）。
  - 媒體下拉新增「🎵 上傳音樂」選項（圖片/影片/YouTube 旁邊）。
- 公開文章 render 直接吃 HTML（video 本就能播、audio 同理）→ 不需改 sanitizer。
- 驗證：`tsc --noEmit` 對 BlogTipTapEditor 0 錯。

## 📋 待辦
- 另出 `docs/TODO_2026-06.md`：現況 + 技術債 + 升級方向（slug 即時查重、問卷題型擴充、AI 洞察排程、e2e 等）。

> 對應 ai-island-web 同日：部落格自訂 slug + 圖/影/音上傳、沙盒 Judge0/C# 中文/檔名/終端、Wandbox 自動更新、Telegram webhook 修復。
