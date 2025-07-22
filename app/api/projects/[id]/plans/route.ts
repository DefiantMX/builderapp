import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { writeFile } from "fs/promises"
import path from "path"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('Plans API called with params:', params)
  try {
    const session = await auth()
    console.log('Session in plans API:', session ? 'Found' : 'Not found')
    
    if (!session || !session.user) {
      console.log('No session or user, returning 401')
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const projectId = params.id

    // Verify project ownership
    const project = await db.project.findUnique({
      where: {
        id: projectId,
        userId
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Get plans for this project
    const plans = await db.plan.findMany({
      where: {
        projectId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const projectId = params.id

    // Verify project ownership
    const project = await db.project.findUnique({
      where: {
        id: projectId,
        userId
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Parse request body
    const { title, description, fileUrl, fileType } = await req.json()

    // Validate required fields
    if (!title || !fileUrl || !fileType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create new plan
    const plan = await db.plan.create({
      data: {
        title,
        description,
        fileUrl,
        fileType,
        projectId
      }
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error("Error creating plan:", error)
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    )
  }
}

