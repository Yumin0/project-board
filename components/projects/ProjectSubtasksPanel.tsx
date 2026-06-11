"use client"

import { useRef, useState, useTransition } from "react"
import { CheckIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

const INK = "#2c3150"
const ACCENT_INK = "#4a5a96"
const SUBTLE = "rgba(70,78,120,.5)"
const DONE_TEXT = "rgba(70,78,120,.42)"
const DIVIDER = "rgba(120,128,170,.15)"
const CIRCLE_BORDER = "rgba(120,128,170,.35)"

type Task = {
  id: string
  title: string
  status: string
  dueDate: Date | string | null
  assigneeId: string | null
  assignee: { id: string; name: string } | null
}

export function ProjectSubtasksPanel({
  projectId,
  tasks: initialTasks,
}: {
  projectId: string
  tasks: Task[]
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [adding, setAdding] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [, startTransition] = useTransition()
  const addInputRef = useRef<HTMLInputElement>(null)

  const total = tasks.length
  const done = tasks.filter((task) => task.status === "done").length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  async function toggleTaskStatus(task: Task) {
    const newStatus = task.status === "done" ? "todo" : "done"
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    )
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      )
    }
  }

  async function deleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
  }

  async function submitNewTask() {
    const title = newTaskTitle.trim()
    if (!title) {
      setAdding(false)
      setNewTaskTitle("")
      return
    }
    setAdding(false)
    setNewTaskTitle("")
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        const task: Task = await res.json()
        setTasks((prev) => [...prev, task])
      }
    } catch {
      // silently fail
    }
  }

  function startAddingTask() {
    setAdding(true)
    setNewTaskTitle("")
    startTransition(() => {
      setTimeout(() => addInputRef.current?.focus(), 50)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-2xl border p-4"
        style={{
          background: "linear-gradient(150deg, rgba(138,166,232,.11), rgba(255,255,255,.32))",
          borderColor: "rgba(138,166,232,.15)",
        }}
      >
        <div className="flex items-baseline justify-between">
          <p className="flex items-baseline gap-1">
            <span className="text-[25px] leading-none font-semibold" style={{ color: INK }}>
              {done}
            </span>
            <span className="text-[13px]" style={{ color: SUBTLE }}>
              / {total} 已完成
            </span>
          </p>
          <span className="text-sm font-bold tabular-nums" style={{ color: ACCENT_INK }}>
            {percent}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(120,128,170,.16)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${percent}%`, background: "linear-gradient(90deg,#5cb98c,#7fd0a8)" }}
          />
        </div>
      </div>

      <div
        className="flex flex-col divide-y rounded-2xl border divide-[rgba(120,128,170,.15)]"
        style={{ background: "rgba(255,255,255,.45)", borderColor: DIVIDER }}
      >
        {tasks.length === 0 && !adding && (
          <p className="px-3.5 py-4 text-center text-sm" style={{ color: SUBTLE }}>
            尚無任務
          </p>
        )}
        {tasks.map((task) => {
          const isDone = task.status === "done"
          return (
            <div key={task.id} className="group flex items-center gap-3 px-3.5 py-2.5">
              <button
                type="button"
                onClick={() => toggleTaskStatus(task)}
                className="flex size-[21px] shrink-0 items-center justify-center rounded-full transition-colors"
                style={
                  isDone
                    ? { background: "linear-gradient(135deg,#5cb98c,#7fd0a8)" }
                    : { border: `1.6px solid ${CIRCLE_BORDER}` }
                }
                aria-label={isDone ? "標記為未完成" : "標記為完成"}
              >
                {isDone && <CheckIcon className="size-3 stroke-[3] text-white" />}
              </button>
              <span
                className={cn("flex-1 text-sm", isDone && "line-through")}
                style={{ color: isDone ? DONE_TEXT : INK }}
              >
                {task.title}
              </span>
              {(task.dueDate || task.assignee) && (
                <span className="shrink-0 text-xs tabular-nums" style={{ color: SUBTLE }}>
                  {task.dueDate &&
                    new Intl.DateTimeFormat("zh-TW", { dateStyle: "short" }).format(
                      new Date(task.dueDate)
                    )}
                  {task.dueDate && task.assignee && " · "}
                  {task.assignee?.name}
                </span>
              )}
              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                className="hidden size-5 shrink-0 items-center justify-center rounded text-[rgba(70,78,120,.4)] hover:text-destructive group-hover:flex"
                aria-label="刪除任務"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          )
        })}
        {adding ? (
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <div className="size-[21px] shrink-0 rounded-full" style={{ border: `1.6px solid ${CIRCLE_BORDER}` }} />
            <input
              ref={addInputRef}
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitNewTask()
                if (event.key === "Escape") {
                  setAdding(false)
                  setNewTaskTitle("")
                }
              }}
              onBlur={submitNewTask}
              placeholder="輸入任務名稱，按 Enter 確認"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: INK }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={startAddingTask}
            className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-colors"
            style={{ color: ACCENT_INK }}
          >
            <span
              className="flex size-[21px] shrink-0 items-center justify-center rounded-full"
              style={{ border: "1.6px dashed #8aa6e8" }}
            >
              <PlusIcon className="size-3" style={{ color: "#8aa6e8" }} />
            </span>
            新增任務
          </button>
        )}
      </div>
    </div>
  )
}
