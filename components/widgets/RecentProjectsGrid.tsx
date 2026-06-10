"use client"

import { useRef, useState } from "react"
import { ArrowRight, CalendarDays, Check, GripVertical, Loader2, Pin, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
type DashboardTask = { id: string; title: string; status: string; dueDate: string | null; order: number }

const FONT_FAMILY = '"Noto Sans TC", var(--font-sans), system-ui, sans-serif'
const CARD_BASE = "flex h-full w-full flex-col gap-2.5 rounded-[22px] p-3.5 text-left"

function formatDue(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${mm} / ${dd}`
}

/** Mirrors the server-side progress/next-task derivation in lib/dashboard-pins.ts. */
function computeProjectStats(tasks: DashboardTask[]) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === "done").length
  const progress = total === 0 ? 0 : Math.round((done / total) * 100)

  const next = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })[0]

  return {
    progress,
    nextTask: next?.title ?? null,
    due: formatDue(next?.dueDate ?? null),
  }
}

/** Sorts incomplete tasks first (in manual order) with completed tasks last. */
function sortTasksForDisplay(tasks: DashboardTask[]) {
  return [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1
    if (a.status !== "done" && b.status === "done") return -1
    return a.order - b.order
  })
}

/** Moves the dragged task to the position of the target task within the list. */
function reorderTasks(tasks: DashboardTask[], draggedId: string, targetId: string) {
  if (draggedId === targetId) return tasks
  const draggedIndex = tasks.findIndex((t) => t.id === draggedId)
  const targetIndex = tasks.findIndex((t) => t.id === targetId)
  if (draggedIndex === -1 || targetIndex === -1) return tasks
  const next = [...tasks]
  const [dragged] = next.splice(draggedIndex, 1)
  next.splice(targetIndex, 0, dragged)
  return next.map((t, i) => ({ ...t, order: i }))
}

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
  onOpenTasks,
  onManage,
}: {
  cat: DashboardCategory
  project: PinnedDashboardProject
  onOpenTasks: () => void
  onManage: () => void
}) {
  const style = DASHBOARD_CATEGORY_STYLES[cat]
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenTasks}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpenTasks()
        }
      }}
      className={cn(CARD_BASE, "relative cursor-pointer transition-transform hover:-translate-y-0.5")}
      style={{
        background: `linear-gradient(150deg, ${style.tint}, rgba(255,255,255,.42))`,
        backdropFilter: "blur(22px) saturate(140%)",
        WebkitBackdropFilter: "blur(22px) saturate(140%)",
        border: "1px solid rgba(255,255,255,.7)",
        boxShadow: "0 10px 34px rgba(70,78,120,.12), inset 0 1px 0 rgba(255,255,255,.6)",
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onManage()
        }}
        className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full transition-colors hover:bg-white/60"
        style={{ color: "rgba(70,78,120,.45)" }}
        aria-label="更換或取消釘選專案"
      >
        <Pin className="size-3.5" />
      </button>
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
    </div>
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
  const [newTitle, setNewTitle] = useState("")
  const [creatingPin, setCreatingPin] = useState(false)
  const [highlightCat, setHighlightCat] = useState<DashboardCategory | null>(null)
  const cardRefs = useRef<Partial<Record<DashboardCategory, HTMLButtonElement | null>>>({})

  const [taskDialogCat, setTaskDialogCat] = useState<DashboardCategory | null>(null)
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const newTaskInputRef = useRef<HTMLInputElement | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const editingInputRef = useRef<HTMLInputElement | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)

  const activeEntry = grid.find((g) => g.cat === activeCat)
  const activeLabel = activeCat ? DASHBOARD_CATEGORY_LABELS[activeCat] : ""

  const taskDialogEntry = grid.find((g) => g.cat === taskDialogCat)
  const taskDialogProject = taskDialogEntry?.project ?? null
  const sortedTasks = sortTasksForDisplay(tasks)

  function closePicker() {
    setActiveCat(null)
    setCandidates([])
    setNewTitle("")
  }

  async function openPicker(cat: DashboardCategory) {
    setActiveCat(cat)
    setCandidates([])
    setNewTitle("")
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

  function applyProjectStats(cat: DashboardCategory, stats: ReturnType<typeof computeProjectStats>) {
    setGrid((prev) =>
      prev.map((g) => (g.cat === cat && g.project ? { ...g, project: { ...g.project, ...stats } } : g))
    )
  }

  function closeTaskDialog() {
    setTaskDialogCat(null)
    setTasks([])
    setAddingTask(false)
    setNewTaskTitle("")
  }

  async function openTaskDialog(cat: DashboardCategory) {
    const entry = grid.find((g) => g.cat === cat)
    if (!entry?.project) return
    setTaskDialogCat(cat)
    setTasks([])
    setAddingTask(false)
    setNewTaskTitle("")
    setLoadingTasks(true)
    try {
      const res = await fetch(`/api/projects/${entry.project.id}/tasks`)
      const data: DashboardTask[] = await res.json()
      setTasks(data)
    } finally {
      setLoadingTasks(false)
    }
  }

  async function toggleTask(task: DashboardTask) {
    if (!taskDialogCat) return
    const previousTasks = tasks
    const newStatus = task.status === "done" ? "todo" : "done"
    const newTasks = tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))

    setTasks(newTasks)
    applyProjectStats(taskDialogCat, computeProjectStats(newTasks))
    setTogglingTaskId(task.id)
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      setTasks(previousTasks)
      applyProjectStats(taskDialogCat, computeProjectStats(previousTasks))
    } finally {
      setTogglingTaskId(null)
    }
  }

  function startAddingTask() {
    setAddingTask(true)
    setNewTaskTitle("")
    setTimeout(() => newTaskInputRef.current?.focus(), 50)
  }

  async function submitNewTask() {
    if (!taskDialogCat || !taskDialogProject) return
    const title = newTaskTitle.trim()
    if (!title) {
      setAddingTask(false)
      setNewTaskTitle("")
      return
    }
    setAddingTask(false)
    setNewTaskTitle("")
    try {
      const res = await fetch(`/api/projects/${taskDialogProject.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        const task: DashboardTask = await res.json()
        const newTasks = [...tasks, task]
        setTasks(newTasks)
        applyProjectStats(taskDialogCat, computeProjectStats(newTasks))
      }
    } catch {
      // silently fail
    }
  }

  function startEditingTask(task: DashboardTask) {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
    setTimeout(() => editingInputRef.current?.focus(), 50)
  }

  function cancelEditingTask() {
    setEditingTaskId(null)
    setEditingTitle("")
  }

  async function saveTaskEdit() {
    if (!taskDialogCat || !editingTaskId) return
    const taskId = editingTaskId
    const title = editingTitle.trim()
    const original = tasks.find((t) => t.id === taskId)
    setEditingTaskId(null)
    if (!original || !title || title === original.title) return

    const newTasks = tasks.map((t) => (t.id === taskId ? { ...t, title } : t))
    setTasks(newTasks)
    applyProjectStats(taskDialogCat, computeProjectStats(newTasks))
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
    } catch {
      // silently fail
    }
  }

  function handleTaskDragEnd() {
    setDraggedTaskId(null)
    setDragOverTaskId(null)
  }

  async function handleTaskDrop(targetTaskId: string) {
    const sourceTaskId = draggedTaskId
    setDraggedTaskId(null)
    setDragOverTaskId(null)
    if (!sourceTaskId || !taskDialogProject || sourceTaskId === targetTaskId) return

    const reordered = reorderTasks(sortedTasks, sourceTaskId, targetTaskId)
    setTasks(reordered)
    try {
      await fetch(`/api/projects/${taskDialogProject.id}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: reordered.map((t) => t.id) }),
      })
    } catch {
      // silently fail
    }
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

  async function handleCreateAndPin() {
    if (!activeCat) return
    const title = newTitle.trim()
    if (!title) return

    setCreatingPin(true)
    try {
      await fetch(`/api/dashboard/pins/${activeCat}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      const res = await fetch("/api/dashboard/pins")
      const newGrid: GridEntry[] = await res.json()
      const justHandled = activeCat
      setGrid(newGrid)
      closePicker()
      focusNextEmpty(newGrid, justHandled)
    } finally {
      setCreatingPin(false)
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
            <ProjectCard
              key={cat}
              cat={cat}
              project={project}
              onOpenTasks={() => openTaskDialog(cat)}
              onManage={() => openPicker(cat)}
            />
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

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateAndPin()
            }}
            className="flex items-center gap-2 border-t pt-3"
          >
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={`新增${activeLabel}專案…`}
              disabled={creatingPin}
            />
            <Button type="submit" size="sm" disabled={creatingPin || newTitle.trim() === ""}>
              {creatingPin ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              新增並釘選
            </Button>
          </form>

          {activeEntry?.project && (
            <DialogFooter>
              <Button type="button" variant="ghost" disabled={pendingId !== null} onClick={handleUnpin}>
                取消釘選
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogCat !== null} onOpenChange={(open) => !open && closeTaskDialog()}>
        <DialogContent style={{ fontFamily: FONT_FAMILY }}>
          <DialogHeader>
            <DialogTitle>{taskDialogProject?.name ?? ""}</DialogTitle>
            <DialogDescription>勾選任務即可標記完成，進度與下一步會即時更新。</DialogDescription>
          </DialogHeader>

          {taskDialogCat && taskDialogProject && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <CategoryChip cat={taskDialogCat} />
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: DASHBOARD_CATEGORY_STYLES[taskDialogCat].ink }}
                >
                  {taskDialogProject.progress}% 完成
                </span>
              </div>
              <div className="h-[7px] w-full rounded-full" style={{ background: "rgba(120,128,170,.14)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${taskDialogProject.progress}%`,
                    background: `linear-gradient(90deg, ${DASHBOARD_CATEGORY_STYLES[taskDialogCat].a}, ${DASHBOARD_CATEGORY_STYLES[taskDialogCat].b})`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex max-h-[40vh] flex-col gap-0.5 overflow-y-auto py-1">
            {loadingTasks && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                載入中…
              </div>
            )}
            {!loadingTasks && sortedTasks.length === 0 && !addingTask && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                還沒有任務，新增第一個作為下一步吧
              </p>
            )}
            {!loadingTasks &&
              sortedTasks.map((task) => {
                const isDone = task.status === "done"
                const due = formatDue(task.dueDate)
                const style = taskDialogCat ? DASHBOARD_CATEGORY_STYLES[taskDialogCat] : null
                const isEditing = editingTaskId === task.id
                return (
                  <div
                    key={task.id}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (dragOverTaskId !== task.id) setDragOverTaskId(task.id)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleTaskDrop(task.id)
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-md py-1.5 transition-colors",
                      draggedTaskId === task.id && "opacity-40",
                      dragOverTaskId === task.id && draggedTaskId !== task.id && "bg-muted/60"
                    )}
                  >
                    <span
                      draggable
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onDragEnd={handleTaskDragEnd}
                      className="flex shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 hover:text-muted-foreground/70 active:cursor-grabbing"
                      aria-label="拖曳調整順序"
                    >
                      <GripVertical className="size-3.5" />
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      disabled={togglingTaskId === task.id}
                      className={cn(
                        "flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
                        !isDone && "border-[rgba(120,128,170,.35)] hover:border-[rgba(120,128,170,.6)]"
                      )}
                      style={isDone && style ? { background: `linear-gradient(135deg, ${style.a}, ${style.b})`, borderColor: style.a } : undefined}
                      aria-label={isDone ? "標記為未完成" : "標記為完成"}
                    >
                      {togglingTaskId === task.id ? (
                        <Loader2 className="size-2.5 animate-spin text-white" />
                      ) : (
                        isDone && <Check className="size-2.5 stroke-[3] text-white" />
                      )}
                    </button>
                    {isEditing ? (
                      <Input
                        ref={editingInputRef}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={saveTaskEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            saveTaskEdit()
                          } else if (e.key === "Escape") {
                            cancelEditingTask()
                          }
                        }}
                        className="h-7 flex-1 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                      />
                    ) : (
                      <span
                        onClick={() => startEditingTask(task)}
                        className={cn(
                          "flex-1 cursor-text text-sm",
                          isDone && "text-muted-foreground line-through"
                        )}
                        style={{ color: isDone ? undefined : "#2c3150" }}
                      >
                        {task.title}
                      </span>
                    )}
                    {due && <span className="text-xs text-muted-foreground tabular-nums">{due}</span>}
                  </div>
                )
              })}
          </div>

          <div className="border-t pt-2.5">
            {addingTask ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  submitNewTask()
                }}
                className="flex items-center gap-2"
              >
                <div className="size-[18px] shrink-0 rounded-full border border-[rgba(120,128,170,.35)]" />
                <Input
                  ref={newTaskInputRef}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onBlur={submitNewTask}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setAddingTask(false)
                      setNewTaskTitle("")
                    }
                  }}
                  placeholder="輸入任務名稱，按 Enter 確認"
                  className="h-8 flex-1 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={startAddingTask}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground"
              >
                <Plus className="size-3.5" />
                新增任務
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
