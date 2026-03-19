# 毛行天下問卷系統 — Insight Engine

> 以問卷為入口、以 CRM 為中樞、以 ERP 洞察為管理層的前期驗證引擎。

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.local.example` 為 `.env.local`，填入 Supabase 與 Admin 的 key：

```bash
cp .env.local.example .env.local
```

### 3. 初始化資料庫

到 Supabase Dashboard → SQL Editor，貼上 `supabase/migration.sql` 並執行。

### 4. 啟動開發伺服器

```bash
npm run dev
```

- 前台：http://localhost:3000
- 後台：http://localhost:3000/admin

### 5. 後台存取

設定 `ADMIN_SECRET` 環境變數後，訪問後台需帶 token：

```
http://localhost:3000/admin?token=你設定的ADMIN_SECRET
```

首次驗證後會設定 cookie，後續無需再帶 token。

## 專案結構

```
src/
├── app/
│   ├── (public)/          # 前台頁面
│   │   ├── page.tsx       # 封面頁
│   │   ├── survey/        # 問卷流程
│   │   └── done/          # 完成頁
│   ├── (admin)/           # 後台頁面
│   │   └── admin/
│   │       ├── page.tsx         # Dashboard
│   │       ├── responses/       # 填答列表與詳情
│   │       └── tags/            # 標籤統計
│   └── api/               # API Routes
│       ├── surveys/       # 問卷 API
│       └── admin/         # 後台 API
├── components/
│   ├── survey/            # 問卷 UI 元件
│   └── admin/             # 後台 UI 元件
├── hooks/                 # React Hooks
├── lib/                   # 業務邏輯與服務
├── types/                 # 型別定義
├── constants/             # 常數
└── middleware.ts          # 後台權限保護
```

## 技術棧

- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Backend**: Next.js Route Handlers
- **Database**: Supabase PostgreSQL
- **Charts**: Recharts
- **Deploy**: Zeabur

## 部署到 Zeabur

1. Push 到 GitHub
2. 在 Zeabur 匯入 repo
3. 設定環境變數（見 `.env.local.example`）
4. 部署完成
