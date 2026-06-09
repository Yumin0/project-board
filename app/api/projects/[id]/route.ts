// app/api/projects/[id]/route.ts
// API route for reading, updating, and deleting a single project

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/projects/[id]'>
) {
  const { id } = await ctx.params

  const project = await prisma.project.findUnique({
    where: { id },
    include: { assignees: true, tasks: true },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/projects/[id]'>
) {
  const { id } = await ctx.params

  try {
    const body = await request.json()

    const data: Prisma.ProjectUpdateInput = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description || null
    if (body.categoryId !== undefined) {
      data.category = body.categoryId
        ? { connect: { id: body.categoryId } }
        : { disconnect: true }
    }
    if (body.customFieldValues !== undefined) {
      data.customFieldValues = body.customFieldValues ?? Prisma.DbNull
    }
    if (body.status !== undefined) data.status = body.status
    if (body.assigneeIds !== undefined) {
      const ids: string[] = Array.isArray(body.assigneeIds) ? body.assigneeIds : []
      data.assignees = { set: ids.map((id) => ({ id })) }
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    })

    return NextResponse.json(project)
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/projects/[id]'>
) {
  const { id } = await ctx.params

  try {
    await prisma.project.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
