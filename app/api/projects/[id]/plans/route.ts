import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { writeFile } from "fs/promises"
import path from "path"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First verify that the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get all plans for the project
    const plans = await prisma.plan.findMany({
      where: {
        projectId: parseInt(params.id),
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json(
      { error: "Error fetching plans" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First verify that the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string || file.name
    const description = formData.get("description") as string || ""

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Create a unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    const filepath = path.join(uploadDir, filename)

    // Convert the file to a Buffer and write it
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uint8Array = new Uint8Array(buffer)
    await writeFile(filepath, uint8Array)

    // Create the plan record in the database
    const plan = await prisma.plan.create({
      data: {
        title,
        description,
        fileUrl: `/uploads/${filename}`,
        fileType: file.type,
        projectId: parseInt(params.id),
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error("Error creating plan:", error)
    return NextResponse.json(
      { error: "Error creating plan" },
      { status: 500 }
    )
  }
}

