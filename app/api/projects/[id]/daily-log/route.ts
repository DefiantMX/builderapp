import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        dailyLogs: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    return NextResponse.json(project.dailyLogs)
  } catch (error) {
    console.error("[DAILY_LOG_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const content = formData.get("content") as string
    const author = formData.get("author") as string
    const currentConditions = formData.get("currentConditions") as string
    const incidentReport = formData.get("incidentReport") as string
    const image = formData.get("image") as File | null

    if (!content || !author || !currentConditions) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Verify project ownership
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Handle image upload if present
    let imageUrl: string | undefined
    if (image) {
      // TODO: Implement image upload to storage service
      // For now, we'll just store the image name
      imageUrl = `/uploads/${image.name}`
    }

    // Create the daily log entry
    const dailyLog = await db.dailyLog.create({
      data: {
        content,
        author,
        currentConditions,
        incidentReport,
        imageUrl,
        date: new Date(),
        projectId: params.id
      }
    })

    return NextResponse.json(dailyLog)
  } catch (error) {
    console.error("[DAILY_LOG_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

