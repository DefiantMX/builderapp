import { NextResponse } from "next/server"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// This is a mock database. In a real application, you'd use a proper database.
const measurements: any[] = []

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Get all takeoffs for the project
    const takeoffs = await prisma.takeoff.findMany({
      where: {
        projectId: parseInt(params.id),
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(takeoffs)
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/takeoff:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    const json = await request.json()
    const { title, description, category } = json

    const takeoff = await prisma.takeoff.create({
      data: {
        title,
        description,
        category,
        status: 'In Progress',
        projectId: parseInt(params.id),
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json(takeoff, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/projects/[id]/takeoff:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

