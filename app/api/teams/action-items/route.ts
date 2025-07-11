import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const item = await prisma.actionItem.create({
      data: {
        description: data.description,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completed: !!data.completed,
        meetingMinuteId: data.meetingMinuteId,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create action item' }, { status: 500 });
  }
} 