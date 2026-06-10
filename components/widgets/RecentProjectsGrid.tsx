"use client"

import { useRef, useState } from "react"
import { ArrowRight, CalendarDays, Check, Loader2, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DASHBOARD_CATEGORIES,
  DASHBOARD_CATEGORY_LABELS,
  DASHBOARD_CATEGORY_STYLES,
  type DashboardCategory,
} from "@/lib/dashboard-categories"
import type { PinnedDashboardProject } from "@/lib/dashboard-pins"

type GridEntry = { cat: DashboardCategory; project: PinnedDashboardProject | null }
type Candidate = { id: string; title: string }

const FONT_FAMILY = '"Noto Sans TC", var(--font-sans), system-ui, sans-serif'
const CARD_BASE = "flex h-full w-full flex-col gap-2.5 rounded-[22px] p-3.5 text-left"

function CategoryChip({ cat }: { cat: DashboardCategory }) {
  const style = DASHBOARD_CATEGORY_STYLES[cat]
  return (
    <span
      className="inline-flex w-fit items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[11.5px] font-semibold"
      style={{
        background: `linear-gradient(135deg, ${style.a}33, ${style.b}22)`,
        color: style.ink,
        border: `1px solid ${style.a}40`,
      }}
    >
      <span
        className="size-[7px] shrink-0 rounded-full"
        style={{ background: `linear-gradient(135deg, ${style.a}, ${style.b})` }}
      />
      {DASHBOARD_CATEGORY_LABELS[cat]}
    </span>
  )
}

function ProjectCard({
  cat,
  project,
  onManage,
}: {
  cat: DashboardCategory
  project: PinnedDashboardProject
  onManage: () => void
}) {
  const style = DASHBOARD_CATEGORY_STYLES[cat]
  return (
    <button
      type="button"
      onClick={onManage}
      className={cn(CARD_BASE, "transition-transform hover:-translate-y-0.5")}
      style={{
        background: `linear-gradient(150deg, ${style.tint}, rgba(255,255,255,.42))`,
        backdropFilter: "blur(22px) saturate(140%)",
        WebkitBackdropFilter: "blur(22px) saturate(140%)",
        border: "1px solid rgba(255,255,255,.7)",
        boxShadow: "0 10px 34px rgba(70,78,120,.12), inset 0 1px 0 rgba(255,255,255,.6)",
      }}
    >
      <CategoryChip cat={cat} />
      <p className="flex-1 text-[14.5px] leading-[1.3] font-semibold" style={{ color: "#2c3150" }}>
        {project.name}
      </p>
      <div>
        <div
          className="mb-[5px] flex items-center justify-between text-[11.5px] font-medium"
          style={{ color: "rgba(70,78,120,.6)" }}
        >
          <span>進度</span>
          <span className="font-semibold" style={{ color: style.ink }}>
            {project.progress}%
          </span>
        </div>
        <div className="h-[7px] w-full rounded-full" style={{ background: "rgba(120,128,170,.14)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${project.progress}%`,
              background: `linear-gradient(90deg, ${style.a}, ${style.b})`,
            }}
          />
        </div>
      </div>
      {project.nextTask && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(60,66,100,.8)" }}>
          <ArrowRight className="size-3.5 shrink-0" style={{ color: style.dot }} />
          <span className="truncate">{project.nextTask}</span>
        </div>
      )}
      {project.due && (
        <div
          className="flex items-center gap-1.5 text-[11.5px] font-medium"
          style={{ color: "rgba(70,78,120,.55)" }}
        >
          <CalendarDays className="size-[13px] shrink-0" />
          <span>預計 {project.due}</span>
        </div>
      )}
    </button>
  )
}

function EmptyPinCard({
  cat,
  onPin,
  highlighted,
  cardRef,
}: {
  cat: DashboardCategory
  onPin: () => void
  highlighted: boolean
  cardRef: (el: HTMLButtonElement | null) => void
}) {
  const style = DASHBOARD_CATEGORY_STYLES[cat]
  const label = DASHBOARD_CATEGORY_LABELS[cat]
  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onPin}
      className={cn(CARD_BASE, "outline-none transition-shadow", highlighted && "ring-2 ring-offset-2")}
      style={
        {
          border: `1.5px dashed ${style.dot}99`,
          background: `linear-gradient(150deg, ${style.tint}, rgba(255,255,255,.28))`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          "--tw-ring-color": style.dot,
        } as React.CSSProperties
      }
    >
      <CategoryChip cat={cat} />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <span
          className="flex size-[38px] items-center justify-center rounded-full"
          style={{
            background: `linear-gradient(135deg, ${style.a}, ${style.b})`,
            boxShadow: `0 4px 14px ${style.a}66`,
          }}
        >
          <Plus className="size-[22px] text-white" />
        </span>
        <p className="text-[13.5px] font-semibold" style={{ color: style.ink }}>
          釘選{label}專案
        </p>
        <p className="text-[11.5px] leading-[1.4]" style={{ color: "rgba(70,78,120,.6)" }}>
          點擊新增或選取
          <br />
          讓{label}不中斷
        </p>
      </div>
    </button>
  )
}

export default function RecentProjectsGrid({ initialGrid }: { initialGrid: GridEntry[] }) {
  const [grid, setGrid] = useState(initialGrid)
  const [activeCat, setActiveCat] = useState<DashboardCategory | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [highlightCat, setHighlightCat] = useState<DashboardCategory | null>(null)
  const cardRefs = useRef<Partial<Record<DashboardCategory, HTMLButtonElement | null>>>({})

  const activeEntry = grid.find((g) => g.cat === activeCat)
  const activeLabel = activeCat ? DASHBOARD_CATEGORY_LABELS[activeCat] : ""

  function closePicker() {
    setActiveCat(null)
    setCandidates([])
  }

  async function openPicker(cat: DashboardCategory) {
    setActiveCat(cat)
    setCandidates([])
    setLoadingCandidates(true)
    try {
      const res = await fetch(`/api/dashboard/pins/${cat}`)
      const data: Candidate[] = await res.json()
      setCandidates(data)
    } finally {
      setLoadingCandidates(false)
    }
  }

  function focusNextEmpty(newGrid: GridEntry[], justHandled: DashboardCategory) {
    const next = DASHBOARD_CATEGORIES.filter((cat) => cat !== justHandled)
      .map((cat) => newGrid.find((g) => g.cat === cat)!)
      .find((g) => g.project === null)

    if (!next) return
    setHighlightCat(next.cat)
    requestAnimationFrame(() => cardRefs.current[next.cat]?.focus())
    setTimeout(() => setHighlightCat((c) => (c === next.cat ? null : c)), 1600)
  }

  async function handlePin(projectId: string) {
    if (!activeCat) return
    setPendingId(projectId)
    try {
      await fetch(`/api/dashboard/pins/${activeCat}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })
      const res = await fetch("/api/dashboard/pins")
      const newGrid: GridEntry[] = await res.json()
      const justHandled = activeCat
      setGrid(newGrid)
      closePicker()
      focusNextEmpty(newGrid, justHandled)
    } finally {
      setPendingId(null)
    }
  }

  async function handleUnpin() {
    if (!activeCat) return
    setPendingId("unpin")
    try {
      await fetch(`/api/dashboard/pins/${activeCat}`, { method: "DELETE" })
      const res = await fetch("/api/dashboard/pins")
      setGrid(await res.json())
      closePicker()
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div style={{ fontFamily: FONT_FAMILY }}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap"
        precedence="default"
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {grid.map(({ cat, project }) =>
          project ? (
            <ProjectCard key={cat} cat={cat} project={project} onManage={() => openPicker(cat)} />
          ) : (
            <EmptyPinCard
              key={cat}
              cat={cat}
              onPin={() => openPicker(cat)}
              highlighted={highlightCat === cat}
              cardRef={(el) => {
                cardRefs.current[cat] = el
              }}
            />
          )
        )}
      </div>

      <Dialog open={activeCat !== null} onOpenChange={(open) => !open && closePicker()}>
        <DialogContent style={{ fontFamily: FONT_FAMILY }}>
          <DialogHeader>
            <DialogTitle>選擇要釘選的{activeLabel}專案</DialogTitle>
            <DialogDescription>從進行中的{activeLabel}專案中選擇一項，釘選後會顯示在首頁。</DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto">
            {loadingCandidates && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                載入中…
              </div>
            )}
            {!loadingCandidates && candidates.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">目前沒有進行中的{activeLabel}專案</p>
            )}
            {!loadingCandidates &&
              candidates.map((c) => {
                const isPinned = c.id === activeEntry?.project?.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={pendingId !== null || isPinned}
                    onClick={() => handlePin(c.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      isPinned
                        ? "border-primary/30 bg-primary/5 font-medium"
                        : "border-transparent hover:bg-muted disabled:opacity-50"
                    )}
                  >
                    <span className="truncate">{c.title}</span>
                    {isPinned ? (
                      <Check className="size-4 shrink-0 text-primary" />
                    ) : (
                      pendingId === c.id && <Loader2 className="size-4 shrink-0 animate-spin" />
                    )}
                  </button>
                )
              })}
          </div>

          {activeEntry?.project && (
            <DialogFooter>
              <Button type="button" variant="ghost" disabled={pendingId !== null} onClick={handleUnpin}>
                取消釘選
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
