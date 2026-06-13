"use client"

import { useEffect, useState } from "react"
import {
  DASHBOARD_CATEGORIES,
  DASHBOARD_CATEGORY_LABELS,
  DASHBOARD_CATEGORY_STYLES,
} from "@/lib/dashboard-categories"
import { SUBTASKS_UPDATED_EVENT, type WeeklySubtaskStats } from "@/lib/weekly-subtasks-shared"

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(150deg, rgba(255,255,255,0.62), rgba(255,255,255,0.40))",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "22px",
  boxShadow: "0 10px 34px rgba(70,78,120,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
  padding: "18px 16px",
}

export default function WeeklySubtasksCard({ initialStats }: { initialStats: WeeklySubtaskStats }) {
  const [stats, setStats] = useState(initialStats)

  useEffect(() => {
    function refetch() {
      fetch("/api/stats/weekly-subtasks?week=current")
        .then((res) => (res.ok ? res.json() : null))
        .then((data: WeeklySubtaskStats | null) => {
          if (data) setStats(data)
        })
        .catch(() => {})
    }

    window.addEventListener(SUBTASKS_UPDATED_EVENT, refetch)
    return () => window.removeEventListener(SUBTASKS_UPDATED_EVENT, refetch)
  }, [])

  return (
    <div style={cardStyle}>
      <div className="flex items-baseline justify-between">
        <p className="text-[15px] font-semibold" style={{ color: "#2c3150" }}>
          本週完成子任務
        </p>
        <p className="text-[13px]" style={{ color: "rgba(70,78,120,.5)" }}>
          <span className="text-[15px] font-bold" style={{ color: "#2c3150" }}>
            {stats.total}
          </span>{" "}
          項
        </p>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {DASHBOARD_CATEGORIES.map((cat) => (
          <div key={cat} className="flex flex-col items-center gap-1.5">
            <span
              className="text-[32px] leading-none font-bold tabular-nums"
              style={{ color: DASHBOARD_CATEGORY_STYLES[cat].dot }}
            >
              {stats.counts[cat]}
            </span>
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "rgba(70,78,120,.6)" }}>
              <span
                className="size-[7px] shrink-0 rounded-full"
                style={{ background: DASHBOARD_CATEGORY_STYLES[cat].dot }}
              />
              {DASHBOARD_CATEGORY_LABELS[cat]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
