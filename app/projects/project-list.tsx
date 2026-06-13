"use client"

import { Fragment, useMemo, useRef, useState, useTransition } from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ListChecksIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { QuickEditProjectDialog } from "@/components/projects/QuickEditProjectDialog"
import { BatchEditDialog, DeleteProjectDialog } from "./project-dialogs"

type CategoryField = {
  id: string
  name: string
  type: string
  options: string[]
}

type Category = {
  id: string
  name: string
  fields: CategoryField[]
}

type Task = {
  id: string
  title: string
  status: string
  dueDate: Date | null
  assigneeId: string | null
  assignee: { id: string; name: string } | null
}

type Project = {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  category: Category | null
  customFieldValues: Record<string, string> | null
  status: string
  updatedAt: Date
  assignees: { id: string; name: string }[]
  tasks: Task[]
}

type Member = {
  id: string
  name: string
}

type CategoryOption = {
  id: string
  name: string
  fields: { id: string; name: string; type: string; options: string[] }[]
}

const statusLabel: Record<string, string> = {
  not_started: "尚未開始",
  in_progress: "進行中",
  completed: "已結案",
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  not_started: "outline",
  in_progress: "default",
  completed: "secondary",
}

const FILTER_ALL = "__all__"
const FILTER_UNCATEGORIZED = "__uncategorized__"
const FILTER_UNASSIGNED = "__unassigned__"

type Filters = {
  search: string
  status: string
  categoryId: string
  assigneeId: string
  customFieldFilters: Record<string, string>
}

const initialFilters: Filters = {
  search: "",
  status: FILTER_ALL,
  categoryId: FILTER_ALL,
  assigneeId: FILTER_ALL,
  customFieldFilters: {},
}

export function ProjectList({
  projects,
  members,
  categories,
  initialSearch,
}: {
  projects: Project[]
  members: Member[]
  categories: CategoryOption[]
  initialSearch?: string
}) {
  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialFilters,
    search: initialSearch ?? "",
  }))
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchEditOpen, setBatchEditOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [tasksByProject, setTasksByProject] = useState<Record<string, Task[]>>({})
  const [addingTaskForProject, setAddingTaskForProject] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [, startTransition] = useTransition()
  const addInputRef = useRef<HTMLInputElement>(null)

  const filterableFields = useMemo(() => {
    if (filters.categoryId === FILTER_ALL || filters.categoryId === FILTER_UNCATEGORIZED) {
      return []
    }
    const category = categories.find((item) => item.id === filters.categoryId)
    return category?.fields.filter((field) => field.type === "select") ?? []
  }, [categories, filters.categoryId])

  const filteredProjects = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return projects.filter((project) => {
      if (query) {
        const matchesTitle = project.title.toLowerCase().includes(query)
        const matchesDescription = (project.description ?? "").toLowerCase().includes(query)
        if (!matchesTitle && !matchesDescription) return false
      }

      if (filters.status !== FILTER_ALL && project.status !== filters.status) {
        return false
      }

      if (filters.categoryId === FILTER_UNCATEGORIZED) {
        if (project.categoryId) return false
      } else if (filters.categoryId !== FILTER_ALL && project.categoryId !== filters.categoryId) {
        return false
      }

      if (filters.assigneeId === FILTER_UNASSIGNED) {
        if (project.assignees.length > 0) return false
      } else if (
        filters.assigneeId !== FILTER_ALL &&
        !project.assignees.some((a) => a.id === filters.assigneeId)
      ) {
        return false
      }

      for (const [fieldId, value] of Object.entries(filters.customFieldFilters)) {
        if (!value || value === FILTER_ALL) continue
        if ((project.customFieldValues?.[fieldId] ?? "") !== value) return false
      }

      return true
    })
  }, [projects, filters])

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.status !== FILTER_ALL ||
    filters.categoryId !== FILTER_ALL ||
    filters.assigneeId !== FILTER_ALL ||
    Object.values(filters.customFieldFilters).some((value) => value && value !== FILTER_ALL)

  const allFilteredSelected =
    filteredProjects.length > 0 && filteredProjects.every((project) => selectedIds.has(project.id))

  const selectedProjects = useMemo(
    () => projects.filter((project) => selectedIds.has(project.id)),
    [projects, selectedIds]
  )

  function updateFilters(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function toggleSelectionMode() {
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set())
      return !prev
    })
  }

  function toggleProjectSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filteredProjects.forEach((project) => next.delete(project.id))
      } else {
        filteredProjects.forEach((project) => next.add(project.id))
      }
      return next
    })
  }

  function handleBatchEditSuccess() {
    setBatchEditOpen(false)
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  function getProjectTasks(project: Project): Task[] {
    return tasksByProject[project.id] ?? project.tasks
  }

  async function toggleExpand(project: Project) {
    const next = new Set(expandedIds)
    if (next.has(project.id)) {
      next.delete(project.id)
      setExpandedIds(next)
      return
    }
    next.add(project.id)
    setExpandedIds(next)
    // Refresh tasks from server when opening
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks`)
      if (res.ok) {
        const tasks: Task[] = await res.json()
        setTasksByProject((prev) => ({ ...prev, [project.id]: tasks }))
      }
    } catch {
      // keep stale data from SSR
    }
  }

  async function toggleTaskStatus(projectId: string, task: Task) {
    const newStatus = task.status === "done" ? "todo" : "done"
    // Optimistic update
    setTasksByProject((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] ?? []).map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t
      ),
    }))
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      // revert on error
      setTasksByProject((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] ?? []).map((t) =>
          t.id === task.id ? { ...t, status: task.status } : t
        ),
      }))
    }
  }

  async function deleteTask(projectId: string, taskId: string) {
    setTasksByProject((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] ?? []).filter((t) => t.id !== taskId),
    }))
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
  }

  async function submitNewTask(projectId: string) {
    const title = newTaskTitle.trim()
    if (!title) { setAddingTaskForProject(null); setNewTaskTitle(""); return }
    setAddingTaskForProject(null)
    setNewTaskTitle("")
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        const task: Task = await res.json()
        setTasksByProject((prev) => ({
          ...prev,
          [projectId]: [...(prev[projectId] ?? []), task],
        }))
      }
    } catch {
      // silently fail
    }
  }

  function startAddingTask(projectId: string) {
    setAddingTaskForProject(projectId)
    setNewTaskTitle("")
    startTransition(() => {
      setTimeout(() => addInputRef.current?.focus(), 50)
    })
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">還沒有任何專案</p>
        <p className="text-sm text-muted-foreground">
          點擊「新增專案」開始把 Notion 裡的內容搬過來吧
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="搜尋標題或描述"
              className="pl-8"
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(value) => updateFilters({ status: value ?? FILTER_ALL })}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="狀態">
                {(value: string) =>
                  value === FILTER_ALL ? "全部狀態" : (statusLabel[value] ?? value)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>全部狀態</SelectItem>
              <SelectItem value="not_started">尚未開始</SelectItem>
              <SelectItem value="in_progress">進行中</SelectItem>
              <SelectItem value="completed">已結案</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.categoryId}
            onValueChange={(value) =>
              updateFilters({ categoryId: value ?? FILTER_ALL, customFieldFilters: {} })
            }
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="類型">
                {(value: string) => {
                  if (value === FILTER_ALL) return "全部類型"
                  if (value === FILTER_UNCATEGORIZED) return "未分類"
                  return categories.find((category) => category.id === value)?.name ?? "全部類型"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>全部類型</SelectItem>
              <SelectItem value={FILTER_UNCATEGORIZED}>未分類</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.assigneeId}
            onValueChange={(value) => updateFilters({ assigneeId: value ?? FILTER_ALL })}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="負責人">
                {(value: string) => {
                  if (value === FILTER_ALL) return "全部負責人"
                  if (value === FILTER_UNASSIGNED) return "未指派"
                  return members.find((member) => member.id === value)?.name ?? "全部負責人"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>全部負責人</SelectItem>
              <SelectItem value={FILTER_UNASSIGNED}>未指派</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filterableFields.map((field) => (
            <Select
              key={field.id}
              value={filters.customFieldFilters[field.id] ?? FILTER_ALL}
              onValueChange={(value) =>
                updateFilters({
                  customFieldFilters: {
                    ...filters.customFieldFilters,
                    [field.id]: value ?? FILTER_ALL,
                  },
                })
              }
            >
              <SelectTrigger className="w-fit">
                <SelectValue placeholder={field.name}>
                  {(value: string) => (value === FILTER_ALL ? `全部${field.name}` : value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>全部{field.name}</SelectItem>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={() => setFilters(initialFilters)}>
              <XIcon data-icon="inline-start" />
              清除篩選
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            符合 {filteredProjects.length} / {projects.length} 個專案
          </span>
          <div className="flex items-center gap-2">
            {selectionMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                disabled={filteredProjects.length === 0}
              >
                {allFilteredSelected ? "取消全選" : "全選篩選結果"}
              </Button>
            )}
            <Button
              variant={selectionMode ? "secondary" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
            >
              <ListChecksIcon data-icon="inline-start" />
              {selectionMode ? "結束批次編輯" : "批次編輯"}
            </Button>
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">沒有符合篩選條件的專案</p>
          <p className="text-sm text-muted-foreground">
            試著調整篩選條件，或清除篩選看看全部專案
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
            {filteredProjects.map((project) => {
              const filledCustomFields = (project.category?.fields ?? []).flatMap((field) => {
                const value = project.customFieldValues?.[field.id]
                return value ? [{ field, value }] : []
              })
              const isSelected = selectedIds.has(project.id)

              return (
                <Card
                  key={project.id}
                  className={cn(
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <CardHeader>
                    <span className="font-mono text-xs text-muted-foreground">#{project.id}</span>
                    <CardTitle>{project.title}</CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-3">
                        {project.description}
                      </CardDescription>
                    )}
                    <CardAction className="flex items-center gap-1">
                      {selectionMode ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProjectSelection(project.id)}
                          aria-label={`選取「${project.title}」`}
                        />
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditingProjectId(project.id)}
                          >
                            <PencilIcon />
                            <span className="sr-only">編輯「{project.title}」</span>
                          </Button>
                          <DeleteProjectDialog project={project} />
                        </>
                      )}
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={statusVariant[project.status] ?? "default"}>
                      {statusLabel[project.status] ?? project.status}
                    </Badge>
                    {project.category && (
                      <Badge variant="outline">{project.category.name}</Badge>
                    )}
                    {filledCustomFields.map(({ field, value }) => (
                      <Badge key={field.id} variant="secondary">
                        {field.name}：{value}
                      </Badge>
                    ))}
                    {project.assignees.length > 0 && (
                      <Badge variant="outline">
                        負責人：{project.assignees.map((a) => a.name).join("、")}
                      </Badge>
                    )}
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    {(() => {
                      const t = getProjectTasks(project)
                      const done = t.filter((x) => x.status === "done").length
                      return t.length > 0 ? `${done}/${t.length} 項任務` : "無任務"
                    })()} · 更新於{" "}
                    {new Intl.DateTimeFormat("zh-TW", {
                      dateStyle: "medium",
                    }).format(project.updatedAt)}
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border lg:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>標題</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>類型／欄位</TableHead>
                  <TableHead>負責人</TableHead>
                  <TableHead className="text-right">任務</TableHead>
                  <TableHead>更新於</TableHead>
                  <TableHead className="w-20 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const filledCustomFields = (project.category?.fields ?? []).flatMap((field) => {
                    const value = project.customFieldValues?.[field.id]
                    return value ? [{ field, value }] : []
                  })
                  const isSelected = selectedIds.has(project.id)

                  const tasks = getProjectTasks(project)
                  const doneCount = tasks.filter((t) => t.status === "done").length
                  const isExpanded = expandedIds.has(project.id)

                  return (
                    <Fragment key={project.id}>
                      <TableRow data-state={isSelected ? "selected" : undefined}>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleExpand(project)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={isExpanded ? "收起任務" : "展開任務"}
                            >
                              {isExpanded
                                ? <ChevronDownIcon className="size-3.5" />
                                : <ChevronRightIcon className="size-3.5" />}
                            </button>
                            {project.id}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{project.title}</span>
                            {project.description && (
                              <span className="line-clamp-1 text-xs text-muted-foreground">
                                {project.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[project.status] ?? "default"}>
                            {statusLabel[project.status] ?? project.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <div className="flex flex-wrap items-center gap-1">
                            {project.category && (
                              <Badge variant="outline">{project.category.name}</Badge>
                            )}
                            {filledCustomFields.map(({ field, value }) => (
                              <Badge key={field.id} variant="secondary">
                                {field.name}：{value}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {project.assignees.length > 0
                            ? project.assignees.map((a) => a.name).join("、")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {tasks.length > 0 ? (
                            <span className={cn(doneCount === tasks.length && "text-green-600 dark:text-green-500")}>
                              {doneCount}/{tasks.length}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("zh-TW", {
                            dateStyle: "medium",
                          }).format(project.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-0.5">
                            {selectionMode ? (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleProjectSelection(project.id)}
                                aria-label={`選取「${project.title}」`}
                              />
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setEditingProjectId(project.id)}
                                >
                                  <PencilIcon />
                                  <span className="sr-only">編輯「{project.title}」</span>
                                </Button>
                                <DeleteProjectDialog project={project} />
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={8} className="p-0">
                            <div className="border-t bg-muted/30 px-4 py-2">
                              {tasks.length === 0 && addingTaskForProject !== project.id && (
                                <p className="py-2 text-xs text-muted-foreground">尚無任務</p>
                              )}
                              <div className="flex flex-col divide-y divide-border/50">
                                {tasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="group flex items-center gap-3 py-1.5 pl-6"
                                  >
                                    <button
                                      onClick={() => toggleTaskStatus(project.id, task)}
                                      className={cn(
                                        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                                        task.status === "done"
                                          ? "border-green-600 bg-green-600 text-white dark:border-green-500 dark:bg-green-500"
                                          : "border-muted-foreground/40 hover:border-muted-foreground"
                                      )}
                                      aria-label={task.status === "done" ? "標記為未完成" : "標記為完成"}
                                    >
                                      {task.status === "done" && <CheckIcon className="size-2.5 stroke-[3]" />}
                                    </button>
                                    <span className={cn(
                                      "flex-1 text-sm",
                                      task.status === "done" && "text-muted-foreground line-through"
                                    )}>
                                      {task.title}
                                    </span>
                                    {task.dueDate && (
                                      <span className="text-xs text-muted-foreground tabular-nums">
                                        {new Intl.DateTimeFormat("zh-TW", { dateStyle: "short" }).format(new Date(task.dueDate))}
                                      </span>
                                    )}
                                    {task.assignee && (
                                      <span className="text-xs text-muted-foreground">
                                        {task.assignee.name}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => deleteTask(project.id, task.id)}
                                      className="hidden size-5 items-center justify-center rounded text-muted-foreground/50 hover:text-destructive group-hover:flex"
                                      aria-label="刪除任務"
                                    >
                                      <Trash2Icon className="size-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              {addingTaskForProject === project.id ? (
                                <div className="flex items-center gap-2 py-1.5 pl-6">
                                  <div className="size-4 shrink-0 rounded-full border border-muted-foreground/40" />
                                  <input
                                    ref={addInputRef}
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") submitNewTask(project.id)
                                      if (e.key === "Escape") { setAddingTaskForProject(null); setNewTaskTitle("") }
                                    }}
                                    onBlur={() => submitNewTask(project.id)}
                                    placeholder="輸入任務名稱，按 Enter 確認"
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={() => startAddingTask(project.id)}
                                  className="mt-1 flex items-center gap-1.5 py-1 pl-6 text-xs text-muted-foreground/60 hover:text-muted-foreground"
                                >
                                  <PlusIcon className="size-3" />
                                  新增任務
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {selectionMode && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-xl border bg-popover px-4 py-2.5 text-sm shadow-lg ring-1 ring-foreground/10">
            <span>已選取 {selectedIds.size} 個專案</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              取消選取
            </Button>
            <Button size="sm" onClick={() => setBatchEditOpen(true)}>
              批次編輯
            </Button>
          </div>
        </div>
      )}

      <BatchEditDialog
        open={batchEditOpen}
        onOpenChange={setBatchEditOpen}
        selectedProjects={selectedProjects.map((project) => ({
          id: project.id,
          categoryId: project.categoryId,
          status: project.status,
          assigneeIds: project.assignees.map((a) => a.id),
          customFieldValues: project.customFieldValues ?? {},
        }))}
        members={members}
        categories={categories}
        onSuccess={handleBatchEditSuccess}
      />

      <QuickEditProjectDialog
        projectId={editingProjectId}
        onOpenChange={(open) => !open && setEditingProjectId(null)}
      />
    </div>
  )
}
