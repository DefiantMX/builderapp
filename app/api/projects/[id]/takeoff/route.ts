import { NextResponse } from "next/server"
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Measurement } from '@prisma/client'

type Plan = {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
}

type MeasurementWithPlan = Measurement & {
  plan: Plan;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
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

    // Get all measurements for plans in this project
    const measurements = await prisma.measurement.findMany({
      where: {
        plan: {
          projectId: parseInt(params.id)
        }
      }
    })

    // Parse points for each measurement
    const parsedMeasurements = measurements.map(m => ({
      ...m,
      points: JSON.parse(m.points)
    }))

    return NextResponse.json(parsedMeasurements)
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/takeoff:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
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

    const data = await request.json()
    
    // Stringify points before saving
    const measurement = await prisma.measurement.create({
      data: {
        ...data,
        points: JSON.stringify(data.points)
      }
    })

    // Parse points back to array before sending response
    return NextResponse.json({
      ...measurement,
      points: JSON.parse(measurement.points)
    })
  } catch (error) {
    console.error('Error in POST /api/projects/[id]/takeoff:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get measurementId from query params
    const { searchParams } = new URL(request.url)
    const measurementId = searchParams.get('measurementId')

    if (!measurementId) {
      return new NextResponse('Measurement ID is required', { status: 400 })
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

    // Delete the measurement
    await prisma.measurement.delete({
      where: {
        id: parseInt(measurementId)
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/takeoff:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

