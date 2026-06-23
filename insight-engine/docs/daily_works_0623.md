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

---

# Part 2 — 上傳全格式/附件/拖放 + 整站卡死修復（同日續）

## 📎 上傳
- 影片/音樂 `accept` 改 `video/*` / `audio/*`（手機原生相簿任何格式、含 .mov）。
- `/api/admin/social/messages/upload`：認不出的 MIME 改用大類前綴分類、其餘一律當「附件(file)」→ 支援所有格式、不再 400。
- 編輯器加「📎 上傳附件」(PDF/Word/Excel/PPT/TXT/MD/ZIP…) → 插入下載連結。
- EditorContent 包 onDrop/onPaste → 拖放/貼上任意檔案自動上傳（圖/影/音內嵌、其他插連結）。
- 放寬：移除「影片 120 秒」+ 30/50MB；server 上限 50MB → 500MB（再大需 presigned 直傳避免 OOM）。

## 🚑 整站卡死修復（service worker）
- 症狀：curl 首頁 200/0.18s 很快、瀏覽器每頁卻卡死 → SW 問題。
- 真因：sw.js navigation「network-first 並快取 HTML」；部署後新 HTML 參照新 hash chunk，
  舊快取 HTML 指到已刪除 chunk → 整站在瀏覽器卡死。
- 修：navigation 改 **network-only**（絕不回傳快取 HTML）；CACHE_VERSION v1→v2（activate 自動清舊快取自癒）。
- ⚠️ 既有用戶要等部署 + 重新整理（瀏覽器抓到新 sw.js 才會自癒）；或手動 DevTools→Application→Service Workers→Unregister + Clear storage。

## ✅ 檢查
- tsc 0 / build 綠；DB 連線正常（127 張表、含 _migrations）；本批無新增 schema、無需跑 migration。
