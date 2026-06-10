"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DASHBOARD_CATEGORIES,
  DASHBOARD_CATEGORY_LABELS,
  DASHBOARD_CATEGORY_STYLES,
  type DashboardCategory,
} from "@/lib/dashboard-categories"
import type { MonthLogs } from "@/lib/work-log"

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(150deg, rgba(255,255,255,0.62), rgba(255,255,255,0.40))",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "22px",
  boxShadow: "0 10px 34px rgba(70,78,120,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
  padding: "18px 16px",
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"]

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

function getCalendarCells(year: number, month: number): (number | null)[] {
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function MonthlyCalendarGrid({
  initialYear,
  initialMonth,
  initialLogs,
}: {
  initialYear: number
  initialMonth: number
  initialLogs: MonthLogs
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)
  const [logs, setLogs] = useState<MonthLogs>(initialLogs)
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [pendingCategory, setPendingCategory] = useState<DashboardCategory | null>(null)

  const cells = getCalendarCells(viewYear, viewMonth)
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() + 1 === viewMonth
  const selectedKey = selectedDay !== null ? dateKey(viewYear, viewMonth, selectedDay) : null

  async function changeMonth(delta: number) {
    let newYear = viewYear
    let newMonth = viewMonth + delta
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    } else if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }
    setViewYear(newYear)
    setViewMonth(newMonth)
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/worklog?month=${newYear}-${pad(newMonth)}`)
      setLogs(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function toggleCategory(category: DashboardCategory) {
    if (!selectedKey) return
    const current = logs[selectedKey] ?? []
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category]
    setLogs((prev) => ({ ...prev, [selectedKey]: next }))
    setPendingCategory(category)
    try {
      const res = await fetch("/api/dashboard/worklog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedKey, category }),
      })
      const data: { categories: DashboardCategory[] } = await res.json()
      setLogs((prev) => ({ ...prev, [selectedKey]: data.categories }))
    } finally {
      setPendingCategory(null)
    }
  }

  return (
    <div style={cardStyle}>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold" style={{ color: "#2c3150" }}>
          {viewYear} 年 {viewMonth} 月
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            disabled={loading}
            className="flex size-7 items-center justify-center rounded-full text-[rgba(70,78,120,.6)] transition-colors hover:bg-[rgba(120,128,170,.12)] disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            disabled={loading}
            className="flex size-7 items-center justify-center rounded-full text-[rgba(70,78,120,.6)] transition-colors hover:bg-[rgba(120,128,170,.12)] disabled:opacity-50"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[12px] font-medium" style={{ color: "rgba(70,78,120,.45)" }}>
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />
          const key = dateKey(viewYear, viewMonth, day)
          const cats = logs[key] ?? []
          const isToday = isCurrentMonth && today.getDate() === day

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDay(day)}
              className="flex flex-col items-center gap-1 py-0.5"
            >
              <span
                className="flex size-7 items-center justify-center rounded-full text-[14px] font-medium transition-colors"
                style={
                  isToday
                    ? {
                        background: "linear-gradient(135deg, #8aa6e8, #ab92d8)",
                        color: "#fff",
                        fontWeight: 600,
                      }
                    : { color: "#2c3150" }
                }
              >
                {day}
              </span>
              <span className="flex h-[6px] items-center justify-center gap-[3px]">
                {cats.map((cat) => (
                  <span
                    key={cat}
                    className="size-[5px] shrink-0 rounded-full"
                    style={{ background: DASHBOARD_CATEGORY_STYLES[cat].dot }}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3" style={{ borderColor: "rgba(120,128,170,.14)" }}>
        {DASHBOARD_CATEGORIES.map((cat) => (
          <div key={cat} className="flex items-center gap-1.5 text-[12px]" style={{ color: "rgba(70,78,120,.6)" }}>
            <span className="size-[7px] shrink-0 rounded-full" style={{ background: DASHBOARD_CATEGORY_STYLES[cat].dot }} />
            {DASHBOARD_CATEGORY_LABELS[cat]}
          </div>
        ))}
      </div>

      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewYear} 年 {viewMonth} 月 {selectedDay} 日
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-1">
            {DASHBOARD_CATEGORIES.map((cat) => {
              const checked = selectedKey ? (logs[selectedKey] ?? []).includes(cat) : false
              return (
                <label
                  key={cat}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                  style={{ borderColor: "rgba(120,128,170,.14)" }}
                >
                  <Checkbox
                    checked={checked}
                    disabled={pendingCategory === cat}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <span className="size-[9px] shrink-0 rounded-full" style={{ background: DASHBOARD_CATEGORY_STYLES[cat].dot }} />
                  <span className="font-medium">{DASHBOARD_CATEGORY_LABELS[cat]}</span>
                </label>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
