import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; measurementId: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // First verify that the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Get the measurement and verify it belongs to a plan in this project
    const measurement = await prisma.measurement.findFirst({
      where: {
        id: params.measurementId,
        plan: {
          projectId: params.id
        }
      }
    })

    if (!measurement) {
      return new NextResponse('Measurement not found', { status: 404 })
    }

    // Delete the measurement
    await prisma.measurement.delete({
      where: {
        id: params.measurementId
      }
    })

    return new NextResponse('Measurement deleted successfully', { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/takeoff/[measurementId]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; measurementId: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // First verify that the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Get the measurement and verify it belongs to a plan in this project
    const measurement = await prisma.measurement.findFirst({
      where: {
        id: params.measurementId,
        plan: {
          projectId: params.id
        }
      }
    })

    if (!measurement) {
      return new NextResponse('Measurement not found', { status: 404 })
    }

    const updates = await request.json()
    
    // If points are included in the update, stringify them
    if (updates.points) {
      updates.points = JSON.stringify(updates.points)
    }

    // Update the measurement
    const updatedMeasurement = await prisma.measurement.update({
      where: {
        id: params.measurementId
      },
      data: {
        ...updates,
        // Ensure we're not overwriting points if they weren't included in the update
        points: updates.points || measurement.points
      }
    })

    // Parse points back to array before sending response
    return NextResponse.json({
      ...updatedMeasurement,
      points: JSON.parse(updatedMeasurement.points)
    })
  } catch (error) {
    console.error('Error in PATCH /api/projects/[id]/takeoff/[measurementId]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 