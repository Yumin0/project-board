"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { logout } from "@/app/login/actions"
import { QuickEditProjectDialog } from "@/components/projects/QuickEditProjectDialog"
import { getRecentProjects } from "@/lib/recent-projects"

const ACC = { a: "#8aa6e8", b: "#ab92d8" } // 主強調色（藍紫漸層）
const LIFE = { a: "#f0a896", b: "#f6cabb" } // 頭像用（珊瑚橘漸層）
const INK = "#2c3150"

const statusLabel: Record<string, string> = {
  not_started: "尚未開始",
  in_progress: "進行中",
  completed: "已結案",
}

type ProjectSearchResult = {
  id: string
  title: string
  status: string
}

function useProjectSearch(query: string) {
  const [results, setResults] = useState<ProjectSearchResult[]>([])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch(`/api/projects/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data: ProjectSearchResult[]) => setResults(data))
        .catch(() => {})
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query])

  return results
}

export function AppHeader() {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [editProjectId, setEditProjectId] = useState<string | null>(null)
  const [recentProjects, setRecentProjects] = useState<ProjectSearchResult[]>([])
  const results = useProjectSearch(query)
  const list = query.trim() ? results : recentProjects

  useEffect(() => {
    setActiveIndex(-1)
  }, [list])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (pathname === "/login") return null

  function selectProject(project: ProjectSearchResult) {
    setQuery("")
    setOpen(false)
    setEditProjectId(project.id)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || list.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % list.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((prev) => (prev - 1 + list.length) % list.length)
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault()
      selectProject(list[activeIndex])
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

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
          <div ref={containerRef} className="relative" style={{ width: 260 }}>
            <div
              className="flex items-center gap-2 rounded-full"
              style={{
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
                value={query}
                onChange={(event) => {
                  const value = event.target.value
                  setQuery(value)
                  if (!value.trim()) setRecentProjects(getRecentProjects())
                  setOpen(true)
                }}
                onFocus={() => {
                  if (!query.trim()) setRecentProjects(getRecentProjects())
                  setOpen(true)
                }}
                onKeyDown={handleKeyDown}
                placeholder="搜尋專案"
                className="w-full bg-transparent outline-none placeholder:text-[rgba(70,78,120,.6)]"
                style={{ fontSize: 13, color: "rgba(70,78,120,.6)" }}
              />
            </div>

            {open && (query.trim() ? true : recentProjects.length > 0) && (
              <div
                className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl"
                style={{
                  background: "rgba(255,255,255,.85)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,.6)",
                  boxShadow: "0 12px 32px rgba(44,49,80,.18)",
                }}
              >
                {!query.trim() && (
                  <p
                    className="px-4 pt-2.5 pb-1"
                    style={{ fontSize: 11, color: "rgba(70,78,120,.5)" }}
                  >
                    最近瀏覽
                  </p>
                )}
                {list.length === 0 ? (
                  <p
                    className="px-4 py-3"
                    style={{ fontSize: 13, color: "rgba(70,78,120,.6)" }}
                  >
                    找不到符合的專案
                  </p>
                ) : (
                  list.map((project, index) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => selectProject(project)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{
                        fontSize: 13,
                        color: INK,
                        background: index === activeIndex ? "rgba(138,146,216,.16)" : "transparent",
                      }}
                    >
                      <span className="truncate">{project.title}</span>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5"
                        style={{
                          fontSize: 11,
                          color: "rgba(70,78,120,.7)",
                          background: "rgba(70,78,120,.1)",
                        }}
                      >
                        {statusLabel[project.status] ?? project.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

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

      <QuickEditProjectDialog
        projectId={editProjectId}
        onOpenChange={(nextOpen) => !nextOpen && setEditProjectId(null)}
      />
    </header>
  )
}
