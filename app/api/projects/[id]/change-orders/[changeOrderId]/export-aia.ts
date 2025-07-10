import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; changeOrderId: string } }
) {
  try {
    // Auth (optional, since export is public)
    // const session = await getServerSession(authConfig)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Fetch change order, project, and (optionally) company info
    const changeOrder = await prisma.changeOrder.findUnique({
      where: { id: params.changeOrderId },
    });
    if (!changeOrder) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Load logo (SVG or JPG)
    let logoBytes = null;
    const logoPathJpg = path.join(process.cwd(), 'public', 'images', 'viking-builder-logo.jpg');
    const logoPathSvg = path.join(process.cwd(), 'public', 'images', 'viking-builder-logo.svg');
    if (fs.existsSync(logoPathJpg)) {
      logoBytes = fs.readFileSync(logoPathJpg);
    } else if (fs.existsSync(logoPathSvg)) {
      logoBytes = fs.readFileSync(logoPathSvg);
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Draw logo
    if (logoBytes) {
      try {
        const img = logoPathJpg.endsWith('.jpg')
          ? await pdfDoc.embedJpg(logoBytes)
          : await pdfDoc.embedPng(logoBytes);
        page.drawImage(img, {
          x: 40,
          y: height - 80,
          width: 80,
          height: 60,
        });
      } catch {}
    }

    // Header
    page.drawText('SAMPLE - Print Your Company Name Here', {
      x: 140, y: height - 50, size: 16, font: fontBold, color: rgb(1, 0, 0)
    });
    page.drawText('Document 710', {
      x: 140, y: height - 70, size: 16, font: fontBold, color: rgb(1, 0, 0)
    });
    page.drawText('Change Order - Subcontractor', {
      x: 40, y: height - 100, size: 14, font: fontBold, color: rgb(0, 0, 0)
    });

    // Project/Change Order Info
    page.drawText(`PROJECT: ${project.name}`, { x: 40, y: height - 130, size: 10, font });
    page.drawText(`CHANGE ORDER NUMBER: ${changeOrder.id.slice(-6)}`, { x: 320, y: height - 130, size: 10, font });
    page.drawText(`DATE: ${changeOrder.date ? new Date(changeOrder.date).toLocaleDateString() : ''}`, { x: 320, y: height - 145, size: 10, font });
    page.drawText(`SUBCONTRACTOR:`, { x: 40, y: height - 145, size: 10, font });
    page.drawText(`CONTRACT DATE:`, { x: 320, y: height - 160, size: 10, font });
    page.drawText(`CONTRACT FOR:`, { x: 320, y: height - 175, size: 10, font });

    // Change description
    page.drawText('The Contract is changed as follows:', { x: 40, y: height - 200, size: 10, fontBold });
    page.drawText(changeOrder.description || '', { x: 60, y: height - 215, size: 10, font, maxWidth: 500 });

    // Financials
    const yStart = height - 250;
    page.drawText('The original (Contract Sum) (Guaranteed Maximum Price) was', { x: 40, y: yStart, size: 10, font });
    page.drawText(`$${(0).toFixed(2)}`, { x: 500, y: yStart, size: 10, font });
    page.drawText('The net change by previously authorized Change Orders', { x: 40, y: yStart - 15, size: 10, font });
    page.drawText(`$${(0).toFixed(2)}`, { x: 500, y: yStart - 15, size: 10, font });
    page.drawText('The Contract Sum (Guaranteed Maximum Price) prior to this Change Order was', { x: 40, y: yStart - 30, size: 10, font });
    page.drawText(`$${(0).toFixed(2)}`, { x: 500, y: yStart - 30, size: 10, font });
    page.drawText('The Contract Sum (Maximum Price) will be increased / decreased / unchanged', { x: 40, y: yStart - 45, size: 10, font });
    page.drawText('by this Change Order in the amount of', { x: 40, y: yStart - 60, size: 10, font });
    page.drawText(`$${changeOrder.amount.toFixed(2)}`, { x: 500, y: yStart - 60, size: 10, font });
    page.drawText('The new (contract Sum) (guaranteed Maximum Price) including this Change Order will be', { x: 40, y: yStart - 75, size: 10, font });
    page.drawText(`$${changeOrder.amount.toFixed(2)}`, { x: 500, y: yStart - 75, size: 10, font });
    page.drawText('The TIME of the project has (Increased / Decreased) by 0 days.', { x: 40, y: yStart - 90, size: 10, font });

    // Signature lines
    page.drawText('NOT VALID UNTIL SIGNED BY THE SUBCONTRACTOR AND CONTRACTOR.', { x: 100, y: yStart - 120, size: 10, fontBold });
    page.drawText('SUBCONTRACTOR (Firm name)', { x: 40, y: yStart - 150, size: 10, font });
    page.drawText('CONTRACTOR (Firm name)', { x: 320, y: yStart - 150, size: 10, font });
    page.drawText('ADDRESS', { x: 40, y: yStart - 165, size: 10, font });
    page.drawText('ADDRESS', { x: 320, y: yStart - 165, size: 10, font });
    page.drawText('BY (Signature)', { x: 40, y: yStart - 180, size: 10, font });
    page.drawText('BY (Signature)', { x: 320, y: yStart - 180, size: 10, font });
    page.drawText('(Typed Name)', { x: 40, y: yStart - 195, size: 10, font });
    page.drawText('(Typed Name)', { x: 320, y: yStart - 195, size: 10, font });
    page.drawText('DATE', { x: 40, y: yStart - 210, size: 10, font });
    page.drawText('DATE', { x: 320, y: yStart - 210, size: 10, font });

    // Finalize PDF
    const pdfBytes = await pdfDoc.save();
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="AIA-Change-Order-${changeOrder.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating AIA PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
} 