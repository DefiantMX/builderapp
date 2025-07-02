import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Authentication required', { status: 401 })
    }

    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const file = formData.get('file') as File

    if (!title || !category || !file) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // TODO: Upload file to storage service (e.g., S3)
    // For now, we'll just use a placeholder URL
    const fileUrl = '/placeholder.pdf'
    const fileType = file.type || 'application/pdf'

    // Create document in database
    const document = await db.document.create({
      data: {
        title,
        description,
        category,
        fileUrl,
        fileType,
        status: 'pending',
        projectId: params.id
      }
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error creating document:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Authentication required', { status: 401 })
    }

    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        documents: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    return NextResponse.json(project.documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 