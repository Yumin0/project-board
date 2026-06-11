"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { logout } from "@/app/login/actions"

const ACC = { a: "#8aa6e8", b: "#ab92d8" } // 主強調色（藍紫漸層）
const LIFE = { a: "#f0a896", b: "#f6cabb" } // 頭像用（珊瑚橘漸層）
const INK = "#2c3150"

export function AppHeader() {
  const pathname = usePathname()
  if (pathname === "/login") return null

  return (
    <header>
      <div
        className="mx-auto flex w-full max-w-6xl items-center justify-between"
        style={{ padding: "18px 32px" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          {/* TODO: 之後替換為品牌 Logo 圖檔 */}
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-[10px]"
            style={{
              background: `linear-gradient(135deg, ${ACC.a}, ${ACC.b})`,
              boxShadow: "0 4px 14px rgba(138,146,216,.5)",
            }}
          >
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: 18 }}
            >
              dashboard
            </span>
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, color: INK }}>
            Project Board
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <form
            action="/projects"
            method="GET"
            className="flex items-center gap-2 rounded-full"
            style={{
              width: 260,
              padding: "8px 16px",
              background: "rgba(255,255,255,.5)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,.6)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: "rgba(70,78,120,.6)" }}
            >
              search
            </span>
            <input
              type="search"
              name="q"
              placeholder="搜尋專案"
              className="w-full bg-transparent outline-none placeholder:text-[rgba(70,78,120,.6)]"
              style={{ fontSize: 13, color: "rgba(70,78,120,.6)" }}
            />
          </form>

          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
            style={{
              background: `linear-gradient(135deg, ${LIFE.a}, ${LIFE.b})`,
              boxShadow: "0 4px 12px rgba(236,155,134,.5)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Y
          </span>

          <form action={logout}>
            <Button type="submit" variant="ghost" size="icon" aria-label="登出">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                logout
              </span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
