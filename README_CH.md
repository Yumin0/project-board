# 📋 Project Board PWA

一個現代化的專案管理 PWA，用 Next.js + TypeScript + Tailwind CSS 構建，支持 Neon PostgreSQL 資料庫。

## ✨ 特性

- ⚡ **Next.js 15** - 最新的 React 框架
- 🎨 **Tailwind CSS + shadcn/ui** - 美觀的 UI 元件
- 🗄️ **Prisma + Neon** - 強大的資料庫管理
- 📱 **PWA 就緒** - 離線支持和安裝功能
- 🔐 **TypeScript** - 類型安全開發
- 🚀 **Vercel 部署** - 一鍵部署
- 📦 **API Routes** - 內置後端支持

## 🛠️ 技術棧

### 前端
- React 19+
- Next.js 15+
- TypeScript
- Tailwind CSS v4
- shadcn/ui

### 後端 & 資料庫
- Next.js API Routes
- Prisma ORM
- Neon PostgreSQL
- Vercel 部署

### 開發工具
- ESLint
- Git 版本控制

## 📦 快速開始

### 環境要求
- Node.js 18+
- npm 或 yarn
- Git

### 本地開發

```bash
# 1. 複製環境變數模板
cp .env.local.example .env.local

# 2. 編輯 .env.local，填入你的 Neon 連接字符串

# 3. 安裝依賴
npm install

# 4. 推送資料庫模式到 Neon
npx prisma db push

# 5. 啟動開發伺服器
npm run dev

# 6. 打開 http://localhost:3000
```

## 📁 專案結構

```
project-board/
├── app/
│   ├── api/                 # API 路由
│   │   └── projects/        # 項目 API
│   ├── page.tsx             # 主頁
│   ├── layout.tsx           # 根佈局
│   └── globals.css          # 全局樣式
├── components/
│   └── ui/                  # shadcn/ui 元件
├── lib/
│   └── utils.ts             # 工具函數
├── prisma/
│   ├── schema.prisma        # 資料庫模式
│   └── seed.ts              # 種子資料（可選）
├── public/                  # 靜態資源
├── .env.local.example       # 環境變數模板
├── SETUP.md                 # 詳細設置指南
├── MIGRATION.md             # 數據遷移指南
└── package.json             # 依賴配置
```

## 🗄️ 資料庫模式

目前支持的模型：

### Projects（項目）
- `id` - 唯一識別符
- `title` - 項目名稱
- `description` - 項目描述
- `status` - 狀態（active/archived）
- `createdAt` - 建立時間
- `updatedAt` - 更新時間

### Tasks（任務）
- `id` - 唯一識別符
- `title` - 任務標題
- `description` - 任務描述
- `status` - 狀態（todo/in_progress/done）
- `priority` - 優先級（low/medium/high）
- `dueDate` - 截止日期
- `projectId` - 所屬項目
- `createdAt` - 建立時間
- `updatedAt` - 更新時間

## 📚 常用命令

```bash
# 開發
npm run dev                  # 啟動開發伺服器
npm run build               # 構建生產版本
npm start                   # 啟動生產伺服器

# 代碼質量
npm run lint                # 運行 ESLint

# 資料庫
npx prisma studio          # 打開 Prisma Studio GUI
npx prisma db push         # 推送模式到資料庫
npx prisma migrate dev      # 建立新遷移

# Vercel
vercel deploy              # 部署到 Vercel
vercel env ls              # 列出環境變數
```

## 🚀 部署

### Vercel（推薦）

```bash
# 1. 推送到 GitHub
git push origin main

# 2. 連接 Vercel
# - 訪問 vercel.com
# - 導入你的 GitHub 倉庫
# - 選擇 project-board
# - 設置 DATABASE_URL 環境變數

# 3. 自動部署
# 每次推送到 main 時自動部署
```

## 📖 文檔

- [SETUP.md](./SETUP.md) - 詳細的環境設置指南
- [MIGRATION.md](./MIGRATION.md) - Notion 到 Neon 的資料遷移指南
- [Next.js 文檔](https://nextjs.org/docs)
- [Prisma 文檔](https://www.prisma.io/docs/)
- [Neon 文檔](https://neon.tech/docs)

## 🤝 後續功能

根據你的需求，我可以幫助實現：

- [ ] PWA 完整配置（離線支持、通知）
- [ ] 認證系統（登入/註冊）
- [ ] 用戶權限管理
- [ ] 任務分配和協作
- [ ] 時間跟蹤
- [ ] 文件上傳
- [ ] 即時通知
- [ ] 報表和統計
- [ ] Notion 資料遷移

請告訴我你想要實現哪些功能！

## 📝 環境設置

要開始開發，請參考 [SETUP.md](./SETUP.md) 中的詳細說明。

### 快速檢查清單

- [ ] 複製 `.env.local.example` 到 `.env.local`
- [ ] 填入 Neon 資料庫連接字符串
- [ ] 運行 `npm install`
- [ ] 運行 `npx prisma db push`
- [ ] 運行 `npm run dev`
- [ ] 訪問 http://localhost:3000

## 🆘 故障排除

### 資料庫連接失敗
- 檢查 `.env.local` 中的 `DATABASE_URL`
- 確認 Neon 資料庫正在運行
- 運行 `npx prisma db push` 以同步模式

### Prisma 錯誤
```bash
# 重新生成 Prisma 客戶端
npx prisma generate

# 重置資料庫（谨慎！會刪除所有數據）
npx prisma migrate reset
```

### 開發伺服器無法啟動
```bash
# 清除 .next 緩存
rm -rf .next

# 重新安裝依賴
rm -rf node_modules
npm install

# 重新啟動
npm run dev
```

## 📞 聯繫方式

有任何問題或建議，請隨時告訴我！

---

Made with ❤️ using Next.js + Prisma + Neon
