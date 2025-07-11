import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const minute = await prisma.meetingMinute.findUnique({
      where: { id: params.id },
      include: { actionItems: true },
    });
    if (!minute) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(minute);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch meeting minute' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    const minute = await prisma.meetingMinute.update({
      where: { id: params.id },
      data: {
        title: data.title,
        date: data.date ? new Date(data.date) : undefined,
        content: data.content,
        createdBy: data.createdBy,
      },
    });
    return NextResponse.json(minute);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update meeting minute' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.meetingMinute.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete meeting minute' }, { status: 500 });
  }
} 