import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let y = height - 50;

    page.drawText('Meeting Minutes', { x: 40, y, size: 20, font: fontBold, color: rgb(0,0,0) });
    y -= 30;
    page.drawText(`Title: ${minute.title || ''}`, { x: 40, y, size: 14, font });
    y -= 20;
    page.drawText(`Date: ${minute.date ? new Date(minute.date).toLocaleDateString() : ''}`, { x: 40, y, size: 12, font });
    y -= 18;
    page.drawText(`Created by: ${minute.createdBy || ''}`, { x: 40, y, size: 12, font });
    y -= 24;
    page.drawText('Content:', { x: 40, y, size: 12, font: fontBold });
    y -= 18;
    const contentLines = (minute.content || '').split('\n');
    for (const line of contentLines) {
      if (y < 60) { y = height - 50; page = pdfDoc.addPage([612, 792]); }
      page.drawText(line, { x: 50, y, size: 12, font });
      y -= 16;
    }
    y -= 10;
    page.drawText('Action Items:', { x: 40, y, size: 12, font: fontBold });
    y -= 18;
    if (!minute.actionItems || minute.actionItems.length === 0) {
      page.drawText('No action items.', { x: 50, y, size: 12, font, color: rgb(0.5,0.5,0.5) });
    } else {
      for (const item of minute.actionItems) {
        let line = `- ${item.description || ''}`;
        if (item.assignedTo) line += ` (Assigned to: ${item.assignedTo})`;
        if (item.dueDate) {
          let dueDateStr = '';
          if (typeof item.dueDate === 'string') {
            dueDateStr = item.dueDate.slice(0, 10);
          } else if (item.dueDate instanceof Date) {
            dueDateStr = item.dueDate.toISOString().slice(0, 10);
          } else if (typeof item.dueDate === 'object' && item.dueDate !== null && 'toISOString' in item.dueDate) {
            dueDateStr = item.dueDate.toISOString().slice(0, 10);
          }
          if (dueDateStr) line += ` (Due: ${dueDateStr})`;
        }
        if (item.completed) line += ' [Completed]';
        if (y < 60) { y = height - 50; page = pdfDoc.addPage([612, 792]); }
        page.drawText(line, { x: 50, y, size: 12, font });
        y -= 16;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Meeting-Minutes-${minute.id}.pdf`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF', details: error?.message || error }, { status: 500 });
  }
} 