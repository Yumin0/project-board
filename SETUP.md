# Project Board PWA - 開發環境設置指南

這個專案是一個 PWA（漸進式網絡應用）專案管理工具，使用 Next.js、TypeScript、Tailwind CSS、Prisma 和 Neon PostgreSQL。

## 🚀 快速開始

### 1. GitHub 倉庫設置

#### 首次連接到 GitHub：

```bash
# 進入專案目錄
cd /Users/bcigroup/Documents/project-board

# 查看當前 git 狀態
git status

# 配置 git 用戶信息（如果尚未配置）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 建立遠程倉庫連接
# 1. 在 GitHub 上建立新的倉庫 (https://github.com/new)
# 2. 命名為 "project-board"
# 3. 選擇 Public 或 Private
# 4. 不要初始化 README, .gitignore 或 license（已存在）

# 將本地倉庫連接到遠程
git remote add origin https://github.com/YOUR_USERNAME/project-board.git

# 重命名預設分支為 main（如果需要）
git branch -M main

# 推送到 GitHub
git push -u origin main
```

### 2. Neon 資料庫設置

#### 建立 Neon 帳戶和資料庫：

1. 訪問 [Neon Console](https://console.neon.tech)
2. 使用 Google、GitHub 或電子郵件註冊
3. 建立新項目：
   - Project name: `project-board`
   - Database name: `project_board`
   - Region: 選擇靠近你的地區
4. 複製連接字符串（PostgreSQL）

#### 連接本地開發環境：

```bash
# 1. 複製 .env.local.example 到 .env.local
cp .env.local.example .env.local

# 2. 編輯 .env.local，填入 Neon 連接字符串
# 打開編輯器編輯 .env.local
# DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-1.aws.neon.tech/project_board?sslmode=require"

# 3. 驗證連接
npx prisma db execute --stdin < /dev/null
# 或者
npx prisma db push

# 4. 生成 Prisma 客戶端
npx prisma generate
```

### 3. 本地開發

```bash
# 安裝所有依賴（已完成，但如需重新安裝）
npm install

# 本地開發伺服器（開啟熱重載）
npm run dev

# 打開瀏覽器
open http://localhost:3000

# 查看 Prisma Studio（資料庫 GUI）
npx prisma studio
```

### 4. Vercel 部署設置

#### 首次部署：

```bash
# 1. 安裝 Vercel CLI
npm i -g vercel

# 2. 登入 Vercel
vercel login

# 3. 部署到 Vercel
vercel

# 4. 選擇 "project-board" 作為項目名稱
# 5. 連接到 GitHub 倉庫（將提示你授權）
```

#### 在 Vercel 中設置環境變數：

1. 訪問 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的專案
3. 進入 Settings → Environment Variables
4. 添加：
   - **Name**: `DATABASE_URL`
   - **Value**: 你的 Neon 連接字符串
   - **Environments**: Production, Preview, Development

#### 自動部署：

一旦連接了 GitHub 倉庫，每次推送到 `main` 分支時 Vercel 會自動部署。

```bash
# 推送更改以觸發部署
git add .
git commit -m "Your commit message"
git push origin main
```

## 📁 專案結構

```
project-board/
├── app/                      # Next.js App Router
│   ├── page.tsx             # 主頁
│   ├── layout.tsx           # 根佈局
│   └── api/                 # API 路由 (Next.js API Routes)
├── components/              
│   └── ui/                  # shadcn/ui 元件
├── lib/                     
│   └── utils.ts             # 工具函數
├── prisma/
│   └── schema.prisma        # Prisma 資料庫模式
├── public/                  # 靜態資源
├── .env.local.example       # 環境變數模板
├── package.json             # 依賴配置
└── tsconfig.json            # TypeScript 配置
```

## 🛠️ 常用命令

```bash
# 開發
npm run dev                  # 開啟開發伺服器

# 構建
npm run build               # 為生產構建

# 啟動生產版本
npm start                   # 啟動生產伺服器

# Lint 代碼
npm run lint                # 運行 ESLint

# 資料庫遷移
npx prisma migrate dev      # 建立新遷移
npx prisma db push          # 推送 schema 到資料庫
npx prisma studio          # 打開 Prisma Studio GUI

# Vercel 部署
vercel deploy              # 部署到 Vercel
vercel env ls              # 列出環境變數
```

## 📦 已安裝的套件

### 核心框架
- **Next.js 15+**: React 框架
- **React 19+**: UI 庫
- **TypeScript**: 類型安全

### 資料庫 & ORM
- **Prisma**: ORM 和遷移工具
- **@prisma/client**: Prisma 客戶端

### UI & 樣式
- **Tailwind CSS v4**: 原子化 CSS
- **shadcn/ui**: React 元件庫

### 開發工具
- **ESLint**: 代碼檢查
- **TypeScript**: 類型檢查

## 🔐 環境安全

**重要**: 永遠不要提交 `.env.local` 到 Git！

```bash
# .gitignore 應包含：
.env.local
.env.*.local
node_modules/
.next/
```

## 📱 PWA 配置

本專案支持 PWA 功能。要完全配置 PWA：

1. 添加 `manifest.json` 到 `/public` 目錄
2. 添加 Service Worker 配置
3. 配置主屏幕圖標

我稍後可以幫助你配置這些功能。

## 🚀 後續步驟

1. ✅ 環境已建立
2. ⏳ 連接 Neon 資料庫
3. ⏳ 設置 GitHub 倉庫
4. ⏳ 配置 Vercel 部署
5. ⏳ 確認功能需求

完成上述步驟後，請告訴我你想要實現哪些功能！

## 📚 有用的資源

- [Next.js 文檔](https://nextjs.org/docs)
- [Prisma 文檔](https://www.prisma.io/docs/)
- [Neon 文檔](https://neon.tech/docs)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [shadcn/ui 文檔](https://ui.shadcn.com/)
- [Vercel 文檔](https://vercel.com/docs)

有任何問題，隨時告訴我！
