// app/api/projects/route.ts
// API route for listing and creating projects

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        assignees: true,
        tasks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        title: body.title.trim(),
        description: body.description || null,
        categoryId: body.categoryId || null,
        customFieldValues: body.customFieldValues ?? Prisma.DbNull,
        status: body.status || undefined,
        assignees: body.assigneeIds?.length
          ? { connect: (body.assigneeIds as string[]).map((id: string) => ({ id })) }
          : undefined,
      },
    })
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
