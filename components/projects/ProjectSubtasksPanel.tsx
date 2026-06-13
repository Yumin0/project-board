"use client"

import { useRef, useState, useTransition } from "react"
import { CheckIcon, GripVertical, PlusIcon, Trash2Icon } from "lucide-react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Input } from "@/components/ui/input"
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

function SortableTaskRow({
  task,
  isEditing,
  editingTitle,
  editingInputRef,
  onToggle,
  onDelete,
  onStartEdit,
  onEditingTitleChange,
  onSaveEdit,
  onCancelEdit,
}: {
  task: Task
  isEditing: boolean
  editingTitle: string
  editingInputRef: React.RefObject<HTMLInputElement | null>
  onToggle: () => void
  onDelete: () => void
  onStartEdit: () => void
  onEditingTitleChange: (value: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const isDone = task.status === "done"

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 px-3.5 py-2.5",
        isDragging && "z-10 rounded-lg bg-white/70 opacity-90 shadow-md"
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className="flex shrink-0 touch-none items-center justify-center text-[rgba(70,78,120,.3)] active:cursor-grabbing"
        style={{ cursor: "grab" }}
        aria-label="拖曳調整順序"
      >
        <GripVertical className="size-4" />
      </span>
      <button
        type="button"
        onClick={onToggle}
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
      {isEditing ? (
        <Input
          ref={editingInputRef}
          value={editingTitle}
          onChange={(event) => onEditingTitleChange(event.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onSaveEdit()
            } else if (event.key === "Escape") {
              onCancelEdit()
            }
          }}
          className="h-7 flex-1 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
        />
      ) : (
        <span
          onClick={onStartEdit}
          className={cn("flex-1 cursor-text text-sm", isDone && "line-through")}
          style={{ color: isDone ? DONE_TEXT : INK }}
        >
          {task.title}
        </span>
      )}
      {(task.dueDate || task.assignee) && (
        <span className="shrink-0 text-xs tabular-nums" style={{ color: SUBTLE }}>
          {task.dueDate &&
            new Intl.DateTimeFormat("zh-TW", { dateStyle: "short" }).format(new Date(task.dueDate))}
          {task.dueDate && task.assignee && " · "}
          {task.assignee?.name}
        </span>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="hidden size-5 shrink-0 items-center justify-center rounded text-[rgba(70,78,120,.4)] hover:text-destructive group-hover:flex"
        aria-label="刪除任務"
      >
        <Trash2Icon className="size-3.5" />
      </button>
    </div>
  )
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [, startTransition] = useTransition()
  const addInputRef = useRef<HTMLInputElement>(null)
  const editingInputRef = useRef<HTMLInputElement>(null)
  const dragSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

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

  function startEditingTask(task: Task) {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
    setTimeout(() => editingInputRef.current?.focus(), 50)
  }

  function cancelEditingTask() {
    setEditingTaskId(null)
    setEditingTitle("")
  }

  async function saveTaskEdit() {
    const taskId = editingTaskId
    if (!taskId) return
    const title = editingTitle.trim()
    const original = tasks.find((t) => t.id === taskId)
    setEditingTaskId(null)
    if (!original || !title || title === original.title) return

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, title } : t)))
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tasks.findIndex((t) => t.id === active.id)
    const newIndex = tasks.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(tasks, oldIndex, newIndex)
    setTasks(reordered)
    try {
      await fetch(`/api/projects/${projectId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: reordered.map((t) => t.id) }),
      })
    } catch {
      // silently fail
    }
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
        {tasks.length > 0 && (
          <DndContext sensors={dragSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  isEditing={editingTaskId === task.id}
                  editingTitle={editingTitle}
                  editingInputRef={editingInputRef}
                  onToggle={() => toggleTaskStatus(task)}
                  onDelete={() => deleteTask(task.id)}
                  onStartEdit={() => startEditingTask(task)}
                  onEditingTitleChange={setEditingTitle}
                  onSaveEdit={saveTaskEdit}
                  onCancelEdit={cancelEditingTask}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
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
