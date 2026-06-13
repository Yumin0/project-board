# CLAUDE.md

這份文件提供給 Claude Code（claude.ai/code）在這個 repository 中工作時的指引說明。

@AGENTS.md

## 與使用者對話的語言（重要，務必遵守）

跟使用者輸出的**所有文字**一律使用繁體中文，不論使用者輸入的語言為何，
也不論這段文字看起來是不是「正式回覆」。這包含但不限於：

- 規劃、提問、任務完成後的摘要
- 執行工具前的簡短說明（例如「接下來要修改 XXX」、「現在來確認 lint 有沒有過」這類
  一句話的進度敘述），不要寫成「Now let's...」「Let's verify...」之類的英文
- 錯誤訊息、警告、後續建議

只有以下內容維持原樣，不需要翻譯：程式碼本身、檔案路徑、變數 / 函式 / 元件名稱、
指令（command）、log 輸出、commit message（除非使用者要求中文 commit message）。

這跟下方「UI 慣例」裡 app 本身的文案規定是兩件事——這條規則是給 Claude Code
自己說話用的。

## 這是什麼專案

一個個人用的專案管理 PWA（「Project Board」），用來追蹤專案、任務（Task）、成員
（Member），以及一個簡易的內部記帳系統（帳戶之間的收入 / 轉帳），還有一個可自訂的
首頁儀表板，分成四個固定象限：主業 / 副業 / 生活 / 學習（main / side / life / learn）。

## 技術棧

Next.js 16（App Router）+ React 19 + TypeScript、Tailwind CSS v4 + shadcn/ui（底層是
`@base-ui/react`，不是 Radix）、Prisma 7 + Neon Postgres（透過 `@prisma/adapter-pg`）、
拖曳排序使用 dnd-kit。

## 常用指令

```bash
npm run dev      # 開發伺服器 (http://localhost:3000)
npm run build    # 正式環境建置
npm run lint     # ESLint (eslint-config-next)

npx prisma migrate dev --name <change>   # 修改 schema.prisma 後，建立並套用 migration
npx prisma generate                       # 重新產生 Prisma client（postinstall 也會跑）
npx prisma studio                         # 資料庫 GUI
```

這個 repo 目前**沒有**設定任何測試框架 / 測試指令。

必要的環境變數（見 `.env.local.example`）：`DATABASE_URL`（Neon Postgres）、
`SITE_PASSWORD` 與 `SESSION_SECRET`（單一共用密碼登入機制，見下方）。

## 登入機制（Auth）

這個專案沒有「使用者帳號」，整個網站只靠**一組共用密碼**保護：

- `proxy.ts`（這是 Next.js 16 取代 `middleware.ts` 的新檔名，匯出的函式叫
  `proxy` 而不是 `middleware`）會檢查每個請求是否帶有合法的 session cookie，
  `/login` 跟靜態資源除外；沒有就導向 `/login?from=...`。
- `lib/auth.ts` 負責產生 / 驗證用 `SESSION_SECRET` 簽名的 cookie（`pb_session`），
  並用 timing-safe 的方式比對使用者輸入的密碼跟 `SITE_PASSWORD`。
- `app/login/actions.ts` 是驗證密碼、設定 cookie 的 server action。

## 資料模型（`prisma/schema.prisma`）

所有 ID 都是「以字串儲存的連續整數」（`@default(dbgenerated("nextval('<table>_id_seq')::text"))`），
不是 cuid / uuid —— 之後新增 model 時，也要在 migration 裡用同樣方式建立對應的 sequence。

- **Member** —— 可以被指派到專案 / 任務的人。
- **Project** —— `status`（not_started / in_progress / completed）、多對多的
  `assignees`（Member）、以及 `tasks`、`incomeRecords`、`transfers`。
  - `category` / `categoryId` 對應到 **Category**，每個 Category 可以有自訂欄位
    **CategoryField**（text / number / date / select）。每個專案實際填的值存在
    `Project.customFieldValues`（JSON，key 是 `CategoryField.id`）。
  - `dashboardCategory`（`main` / `side` / `life` / `learn`，定義在
    `lib/dashboard-categories.ts`）跟上面的 `category` 是**不同的東西** ——
    它代表這個專案屬於首頁儀表板的哪一個象限。
- **DashboardPin** —— 每個 `dashboardCategory` 最多釘選（pin）一個專案
  （`category` 欄位有 unique 限制）。相關邏輯在 `lib/dashboard-pins.ts`
  （`getDashboardGrid`、`setPin`、`clearPin`、`createAndPinProject`）。
- **DashboardWidget** —— 首頁可設定的元件（`position`、`enabled`、`title`）。
  所有可用的 widget 類型統一定義在 `app/api/dashboard/route.ts` 的
  `WIDGET_REGISTRY`，新增 widget 時要記得同步更新 `app/page.tsx` 裡的
  `WIDGET_COMPONENTS`。
- **WorkLog** —— 每天 / 每個 dashboardCategory 一筆「今天有沒有投入時間」的打卡紀錄，
  用來驅動首頁的月曆元件（`lib/work-log.ts`）。
- **Account / IncomeRecord / Transfer** —— 簡易的內部記帳。`IncomeRecord` 是
  「外部資金進到某個 Account」（可選擇關聯到一個 Project）。`Transfer` 是
  「在兩個 Account 之間搬移等額金額」（例如把已完成專案的收入，從總收入帳戶
  分到負責人 / 介紹人帳戶）—— 內部資金搬移**不要**用 `IncomeRecord`。
- **Task** —— 屬於某個 `Project`，可選擇 `assignee`（Member），有
  `status` / `priority` / `order`（拖曳排序，使用 dnd-kit）。

## 資料存取的兩種寫法（目前並存）

- 較新的功能模組（`app/projects`、`app/accounts`、`app/categories`、
  `app/members`、`app/login`）都是用每個路由底下的 `actions.ts` 寫
  **Server Actions**：開頭 `"use server"`、用 zod 驗證、呼叫 `prisma`、
  寫完後 `revalidatePath(...)`，回傳格式是
  `{ status: "idle"|"success"|"error", fieldErrors?, error? }`，
  搭配 `useActionState` 在前端使用。
- 較舊的 `app/api/**/route.ts` 則是傳統的 REST JSON API（例如
  `app/api/projects`、`app/api/tasks/[id]`、`app/api/dashboard/*`），
  目前是給 dashboard 跟前端互動用的。如果要動 dashboard 或任務看板相關功能，
  先確認該邏輯是不是應該走這些既有的 API route，而不是另外寫一個 server action。
- 共用的 server 端邏輯（`lib/dashboard-pins.ts`、`lib/work-log.ts`、
  `lib/dashboard-categories.ts`）會同時被 API route 跟 server component 使用 ——
  優先擴充這些檔案，而不是到處重複寫一樣的 Prisma 查詢。

## UI 慣例

- `components/ui/*` 是基於 `@base-ui/react` 的 shadcn 元件，**不是 Radix** ——
  要做組合（composition）時用 `render={<Link href="..." />}` 跟
  `nativeButton={false}`，不是 `asChild`。
- Tailwind v4 的主題變數（oklch 色彩、`--radius` 尺度）定義在 `app/globals.css`
  的 `@theme inline` 區塊；變體樣式統一用 `class-variance-authority`，可參考
  `components/ui/button.tsx` 的寫法。
- 所有面向使用者的文案都是繁體中文 —— 新增文字時請保持一致。
- `scripts/*.mjs` 是一次性的「Notion → Postgres」資料匯入腳本，不是 app 本身的一部分。

## 寫 App Router 程式碼之前

這個專案用的 Next.js 16 跟（你訓練資料裡的）舊版本相比有不少 breaking changes
（例如用 `proxy.ts` 取代 `middleware.ts`）。如果要用到不確定是否還適用的 App Router
API，先去看 `node_modules/next/dist/docs/01-app/` 裡對應的文件。
