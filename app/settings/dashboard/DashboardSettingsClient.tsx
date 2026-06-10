"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GripVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Widget = {
  id: string
  widgetType: string
  title: string | null
  position: number
  enabled: boolean
}

type RegistryEntry = {
  widgetType: string
  label: string
  defaultTitle: string
}

export default function DashboardSettingsClient({
  initialWidgets,
  registry,
}: {
  initialWidgets: Widget[]
  registry: readonly RegistryEntry[]
}) {
  const [widgets, setWidgets] = useState(
    [...initialWidgets].sort((a, b) => a.position - b.position)
  )
  const [dragging, setDragging] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const labelOf = (type: string) =>
    registry.find((r) => r.widgetType === type)?.label ?? type

  const defaultTitleOf = (type: string) =>
    registry.find((r) => r.widgetType === type)?.defaultTitle ?? type

  function toggleEnabled(widgetType: string) {
    setWidgets((prev) =>
      prev.map((w) => (w.widgetType === widgetType ? { ...w, enabled: !w.enabled } : w))
    )
  }

  function setTitle(widgetType: string, title: string) {
    setWidgets((prev) =>
      prev.map((w) => (w.widgetType === widgetType ? { ...w, title } : w))
    )
  }

  function onDragStart(widgetType: string) {
    setDragging(widgetType)
  }

  function onDragOver(e: React.DragEvent, targetType: string) {
    e.preventDefault()
    if (!dragging || dragging === targetType) return
    setWidgets((prev) => {
      const from = prev.findIndex((w) => w.widgetType === dragging)
      const to = prev.findIndex((w) => w.widgetType === targetType)
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next.map((w, i) => ({ ...w, position: i }))
    })
  }

  function onDragEnd() {
    setDragging(null)
  }

  function save() {
    startTransition(async () => {
      await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          widgets.map((w) => ({
            widgetType: w.widgetType,
            position: w.position,
            enabled: w.enabled,
            title: w.title,
          }))
        ),
      })
      router.push("/")
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">拖拉調整順序，切換開關控制是否顯示在首頁</p>
      <div className="flex flex-col gap-2">
        {widgets.map((w) => (
          <Card
            key={w.widgetType}
            draggable
            onDragStart={() => onDragStart(w.widgetType)}
            onDragOver={(e) => onDragOver(e, w.widgetType)}
            onDragEnd={onDragEnd}
            className={dragging === w.widgetType ? "opacity-40" : ""}
          >
            <CardContent className="flex flex-col gap-2.5 py-3">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{labelOf(w.widgetType)}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={w.enabled}
                  onClick={() => toggleEnabled(w.widgetType)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    w.enabled ? "bg-primary" : "bg-input"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${
                      w.enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-2 pl-7">
                <Label htmlFor={`title-${w.widgetType}`} className="shrink-0 text-xs text-muted-foreground">
                  顯示標題
                </Label>
                <Input
                  id={`title-${w.widgetType}`}
                  value={w.title ?? ""}
                  placeholder={defaultTitleOf(w.widgetType)}
                  onChange={(e) => setTitle(w.widgetType, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" nativeButton={false} onClick={() => router.back()}>
          取消
        </Button>
        <Button onClick={save} disabled={isPending}>
          {isPending ? "儲存中..." : "儲存"}
        </Button>
      </div>
    </div>
  )
}
