// app/api/projects/search/route.ts
// API route for the header search dropdown: quick project lookup by title/description

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const RESULT_LIMIT = 6

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (!q) {
    return NextResponse.json([])
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, title: true, status: true },
    orderBy: { updatedAt: 'desc' },
    take: RESULT_LIMIT,
  })

  return NextResponse.json(projects)
}
