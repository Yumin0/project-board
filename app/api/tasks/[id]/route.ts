import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/tasks/[id]'>
) {
  const { id } = await ctx.params

  try {
    const body = await request.json()

    const data: Prisma.TaskUpdateInput = {}
    if (body.title !== undefined) data.title = String(body.title).trim()
    if (body.status !== undefined) {
      data.status = body.status
      data.completedAt = body.status === 'done' ? new Date() : null
    }
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.assigneeId !== undefined) {
      data.assignee = body.assigneeId
        ? { connect: { id: body.assigneeId } }
        : { disconnect: true }
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: { assignee: { select: { id: true, name: true } } },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/tasks/[id]'>
) {
  const { id } = await ctx.params

  try {
    await prisma.task.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
