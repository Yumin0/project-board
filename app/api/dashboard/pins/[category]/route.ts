// app/api/dashboard/pins/[category]/route.ts
// API route for managing the pinned project of a single dashboard category

import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import {
  ProjectCategoryMismatchError,
  ProjectNotFoundError,
  clearPin,
  createAndPinProject,
  getPinnableProjects,
  isDashboardCategory,
  setPin,
} from "@/lib/dashboard-pins"

// GET: list the projects in this category that can be pinned
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/dashboard/pins/[category]">
) {
  const { category } = await ctx.params
  if (!isDashboardCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 })
  }

  const projects = await getPinnableProjects(category)
  return NextResponse.json(projects)
}

// PUT: pin a project to this category, replacing any existing pin
export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/dashboard/pins/[category]">
) {
  const { category } = await ctx.params
  if (!isDashboardCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 })
  }

  const body = await request.json()
  const projectId = body?.projectId
  if (typeof projectId !== "string" || !projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  try {
    await setPin(category, projectId)
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    if (error instanceof ProjectCategoryMismatchError) {
      return NextResponse.json(
        { error: "Project does not belong to this dashboard category" },
        { status: 400 }
      )
    }
    console.error("Error setting dashboard pin:", error)
    return NextResponse.json({ error: "Failed to set dashboard pin" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// POST: create a new in-progress project in this category and pin it
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/dashboard/pins/[category]">
) {
  const { category } = await ctx.params
  if (!isDashboardCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 })
  }

  const body = await request.json()
  const title = typeof body?.title === "string" ? body.title.trim() : ""
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "title is too long" }, { status: 400 })
  }

  const project = await createAndPinProject(category, title)
  revalidatePath("/projects")

  return NextResponse.json({ ok: true, project })
}

// DELETE: clear whatever project is pinned to this category
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/dashboard/pins/[category]">
) {
  const { category } = await ctx.params
  if (!isDashboardCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 })
  }

  await clearPin(category)
  return NextResponse.json({ ok: true })
}
