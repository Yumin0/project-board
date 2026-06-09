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
    orderBy: { createdAt: 'asc' },
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

  const task = await prisma.task.create({
    data: {
      title,
      status: body.status ?? 'todo',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      assigneeId: body.assigneeId ?? null,
      projectId,
    },
    include: { assignee: { select: { id: true, name: true } } },
  })

  return NextResponse.json(task, { status: 201 })
}
