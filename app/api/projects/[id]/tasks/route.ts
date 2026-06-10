import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/projects/[id]/tasks'>
) {
  const { id } = await ctx.params

  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    include: { assignee: { select: { id: true, name: true } } },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(tasks)
}

export async function POST(
  request: Request,
  ctx: RouteContext<'/api/projects/[id]/tasks'>
) {
  const { id: projectId } = await ctx.params

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const body = await request.json()
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const last = await prisma.task.findFirst({
    where: { projectId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  const task = await prisma.task.create({
    data: {
      title,
      status: body.status ?? 'todo',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      assigneeId: body.assigneeId ?? null,
      order: (last?.order ?? -1) + 1,
      projectId,
    },
    include: { assignee: { select: { id: true, name: true } } },
  })

  return NextResponse.json(task, { status: 201 })
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/projects/[id]/tasks'>
) {
  const { id: projectId } = await ctx.params

  const body = await request.json()
  const taskIds = body.taskIds
  if (!Array.isArray(taskIds) || taskIds.some((taskId) => typeof taskId !== 'string')) {
    return NextResponse.json({ error: 'taskIds must be an array of strings' }, { status: 400 })
  }

  await prisma.$transaction(
    taskIds.map((taskId, index) =>
      prisma.task.update({
        where: { id: taskId, projectId },
        data: { order: index },
      })
    )
  )

  return new NextResponse(null, { status: 204 })
}
