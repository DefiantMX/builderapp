import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(params.id) }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    if (project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    // Create unique filename
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = Date.now() + "-" + file.name.replace(/\s+/g, "-")
    const uploadDir = path.join(process.cwd(), "public/uploads")
    const filepath = path.join(uploadDir, filename)

    // Save file using Uint8Array
    await writeFile(filepath, new Uint8Array(buffer))
    const fileUrl = `/uploads/${filename}`

    // Create document record
    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileUrl,
        fileType: file.type,
        category,
        status: "pending",
        projectId: Number(params.id),
        userId: session.user.id,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error in document upload:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(params.id) },
      include: {
        documents: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    if (project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    return NextResponse.json(project.documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 