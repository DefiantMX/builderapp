import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; drawId: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get the draw with related data
    const draw = await db.draw.findUnique({
      where: {
        id: params.drawId,
        projectId: params.id
      },
      include: {
        project: {
          include: {
            budget: true,
            draws: {
              include: {
                invoices: true
              }
            }
          }
        },
        invoices: true
      }
    })

    if (!draw) {
      return new NextResponse("Draw not found", { status: 404 })
    }

    // Verify project ownership
    if (draw.project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Letter size

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Calculate totals
    const contractSum = draw.project.budget?.totalAmount || 0
    const previousDrawsTotal = draw.project.draws
      .filter(d => d.id !== draw.id && new Date(d.date) < new Date(draw.date))
      .reduce((sum, d) => sum + d.amount, 0)
    const currentDrawAmount = draw.amount
    const totalCompletedToDate = previousDrawsTotal + currentDrawAmount
    const balanceToFinish = contractSum - totalCompletedToDate
    const retainage = totalCompletedToDate * 0.1 // 10% retainage

    // Draw header
    page.drawText("APPLICATION AND CERTIFICATE FOR PAYMENT", {
      x: 156,
      y: 750,
      size: 16,
      font: helveticaBold,
    })

    page.drawText("AIA Document G702", {
      x: 50,
      y: 730,
      size: 10,
      font: helveticaFont,
    })

    // Project information
    page.drawText("TO OWNER:", {
      x: 50,
      y: 700,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(draw.project.name, {
      x: 120,
      y: 700,
      size: 10,
      font: helveticaFont,
    })

    // Application information
    page.drawText("APPLICATION NO:", {
      x: 50,
      y: 680,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(draw.drawNumber.toString(), {
      x: 150,
      y: 680,
      size: 10,
      font: helveticaFont,
    })

    page.drawText("APPLICATION DATE:", {
      x: 250,
      y: 680,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(new Date(draw.date).toLocaleDateString(), {
      x: 350,
      y: 680,
      size: 10,
      font: helveticaFont,
    })

    // Contract information
    page.drawText("CONTRACT FOR:", {
      x: 50,
      y: 660,
      size: 10,
      font: helveticaBold,
    })

    page.drawText("Construction", {
      x: 150,
      y: 660,
      size: 10,
      font: helveticaFont,
    })

    // Draw summary table
    const tableTop = 600
    const lineHeight = 20

    // Table headers
    page.drawText("DESCRIPTION", {
      x: 50,
      y: tableTop,
      size: 10,
      font: helveticaBold,
    })

    page.drawText("AMOUNT", {
      x: 450,
      y: tableTop,
      size: 10,
      font: helveticaBold,
    })

    // Table rows
    let currentY = tableTop - lineHeight

    // 1. Original Contract Sum
    page.drawText("1. ORIGINAL CONTRACT SUM", {
      x: 50,
      y: currentY,
      size: 10,
      font: helveticaFont,
    })

    page.drawText(`$${contractSum.toLocaleString()}`, {
      x: 450,
      y: currentY,
      size: 10,
      font: helveticaFont,
    })

    currentY -= lineHeight

    // 2. Total Completed to Date
    page.drawText("2. TOTAL COMPLETED TO DATE", {
      x: 50,
      y: currentY,
      size: 10,
      font: helveticaFont,
    })

    page.drawText(`$${totalCompletedToDate.toLocaleString()}`, {
      x: 450,
      y: currentY,
      size: 10,
      font: helveticaFont,
    })

    currentY -= lineHeight

    // 3. Retainage
    page.drawText("3. RETAINAGE (10%)", {
      x: 50,
      y: currentY,
      size: 10,
      font: helveticaFont,
    })

    page.drawText(`$${retainage.toLocaleString()}`, {
      x: 450,
      y: currentY,
      size: 10,
      font: helveticaFont,
    })

    currentY -= lineHeight

    // 4. Total Earned Less Retainage
    const totalEarnedLessRetainage = totalCompletedToDate - retainage
    page.drawText("4. TOTAL EARNED LESS RETAINAGE", {
      x: 50,
      y: currentY,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(`$${totalEarnedLessRetainage.toLocaleString()}`, {
      x: 450,
      y: currentY,
      size: 10,
      font: helveticaBold,
    })

    currentY -= lineHeight

    // 5. Previous Payments
    page.drawText("5. PREVIOUS PAYMENTS", {
      x: 50,
      y: currentY,
      size: 10,
      font: helveticaFont,
    })

    page.drawText(`$${previousDrawsTotal.toLocaleString()}`, {
      x: 450,
      y: currentY,
      size: 10,
      font: helveticaFont,
    })

    currentY -= lineHeight

    // 6. Current Payment Due
    page.drawText("6. CURRENT PAYMENT DUE", {
      x: 50,
      y: currentY,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(`$${currentDrawAmount.toLocaleString()}`, {
      x: 450,
      y: currentY,
      size: 10,
      font: helveticaBold,
    })

    currentY -= lineHeight

    // 7. Balance to Finish
    page.drawText("7. BALANCE TO FINISH", {
      x: 50,
      y: currentY,
      size: 10,
      font: helveticaFont,
    })

    page.drawText(`$${balanceToFinish.toLocaleString()}`, {
      x: 450,
      y: currentY,
      size: 10,
      font: helveticaFont,
    })

    // Certification
    currentY -= lineHeight * 2
    page.drawText("CONTRACTOR'S CERTIFICATION", {
      x: 50,
      y: currentY,
      size: 10,
      font: helveticaBold,
    })

    currentY -= lineHeight
    const certificationText = "The undersigned Contractor certifies that to the best of the Contractor's knowledge, information and belief the Work covered by this Application for Payment has been completed in accordance with the Contract Documents, that all amounts have been paid by the Contractor for Work for which previous Certificates for Payment were issued and payments received from the Owner, and that current payment shown herein is now due."
    
    // Word wrap the certification text
    const words = certificationText.split(' ')
    let line = ''
    let certY = currentY
    
    for (const word of words) {
      const testLine = line + word + ' '
      const textWidth = helveticaFont.widthOfTextAtSize(testLine, 10)
      
      if (textWidth > 500) {
        page.drawText(line, {
          x: 50,
          y: certY,
          size: 10,
          font: helveticaFont,
        })
        certY -= 15
        line = word + ' '
      } else {
        line = testLine
      }
    }
    
    if (line) {
      page.drawText(line, {
        x: 50,
        y: certY,
        size: 10,
        font: helveticaFont,
      })
    }

    // Signature lines
    currentY = certY - lineHeight * 3
    
    page.drawLine({
      start: { x: 50, y: currentY },
      end: { x: 250, y: currentY },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    page.drawText("CONTRACTOR SIGNATURE", {
      x: 50,
      y: currentY - 15,
      size: 8,
      font: helveticaFont,
    })

    page.drawLine({
      start: { x: 350, y: currentY },
      end: { x: 550, y: currentY },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    page.drawText("DATE", {
      x: 350,
      y: currentY - 15,
      size: 8,
      font: helveticaFont,
    })

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()

    // Return the PDF as a response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="draw-${draw.drawNumber}-aia.pdf"`,
      },
    })
  } catch (error) {
    console.error("[DRAW_EXPORT_AIA]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 