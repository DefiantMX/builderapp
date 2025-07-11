import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const minutes = await prisma.meetingMinute.findMany({
      orderBy: { date: 'desc' },
      include: { actionItems: true },
    });
    return NextResponse.json(minutes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch meeting minutes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const minute = await prisma.meetingMinute.create({
      data: {
        title: data.title,
        date: data.date ? new Date(data.date) : new Date(),
        content: data.content,
        createdBy: data.createdBy,
      },
    });
    return NextResponse.json(minute);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create meeting minute' }, { status: 500 });
  }
} 