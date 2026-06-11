// app/api/projects/[id]/edit-data/route.ts
// Bundles a project plus the members/categories needed to render its edit
// form, for the header search's quick-edit popup (usable from any page).

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/projects/[id]/edit-data'>
) {
  const { id } = await ctx.params

  const [project, members, categories] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        assignees: { select: { id: true, name: true } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            assigneeId: true,
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { order: "asc" },
        },
      },
    }),
    prisma.member.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      include: { fields: { orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json({ project, members, categories })
}
