import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get the project with events
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        events: {
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([612, 792]) // Letter size

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let yOffset = 750

    // Add title
    page.drawText(`${project.name} - Project Schedule`, {
      x: 50,
      y: yOffset,
      size: 18,
      font: helveticaBold,
    })

    yOffset -= 30

    // Add project summary
    page.drawText("Project Summary", {
      x: 50,
      y: yOffset,
      size: 14,
      font: helveticaBold,
    })

    yOffset -= 20

    const totalEvents = project.events.length
    const completedEvents = project.events.filter(e => e.status === 'Completed').length
    const inProgressEvents = project.events.filter(e => e.status === 'In Progress').length
    const notStartedEvents = project.events.filter(e => e.status === 'Not Started').length

    page.drawText(`Total Events: ${totalEvents}`, {
      x: 50,
      y: yOffset,
      size: 12,
      font: helveticaFont,
    })

    yOffset -= 15

    page.drawText(`Completed: ${completedEvents}`, {
      x: 50,
      y: yOffset,
      size: 12,
      font: helveticaFont,
    })

    yOffset -= 15

    page.drawText(`In Progress: ${inProgressEvents}`, {
      x: 50,
      y: yOffset,
      size: 12,
      font: helveticaFont,
    })

    yOffset -= 15

    page.drawText(`Not Started: ${notStartedEvents}`, {
      x: 50,
      y: yOffset,
      size: 12,
      font: helveticaFont,
    })

    yOffset -= 30

    // Group events by month and year
    const groupedEvents = project.events.reduce((acc: { [key: string]: any[] }, event: any) => {
      const date = new Date(event.startDate)
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' })
      
      if (!acc[monthYear]) {
        acc[monthYear] = []
      }
      acc[monthYear].push(event)
      return acc
    }, {})

    // Add events by month
    Object.entries(groupedEvents).forEach(([monthYear, monthEvents]) => {
      // Check if we need a new page
      if (yOffset < 100) {
        page = pdfDoc.addPage([612, 792])
        yOffset = 750
      }

      // Add month header
      page.drawText(monthYear, {
        x: 50,
        y: yOffset,
        size: 14,
        font: helveticaBold,
      })

      yOffset -= 20

      // Add events for this month
      monthEvents.forEach((event) => {
        if (yOffset < 50) {
          page = pdfDoc.addPage([612, 792])
          yOffset = 750
        }

        // Event title
        page.drawText(event.title, {
          x: 60,
          y: yOffset,
          size: 12,
          font: helveticaBold,
        })

        yOffset -= 15

        // Event details
        const startDate = new Date(event.startDate).toLocaleDateString()
        const endDate = event.endDate ? new Date(event.endDate).toLocaleDateString() : 'Ongoing'
        
        page.drawText(`Start: ${startDate} | End: ${endDate} | Status: ${event.status} | Progress: ${event.percentComplete}%`, {
          x: 60,
          y: yOffset,
          size: 10,
          font: helveticaFont,
        })

        yOffset -= 15

        // Event description if available
        if (event.description) {
          page.drawText(`Description: ${event.description}`, {
            x: 60,
            y: yOffset,
            size: 10,
            font: helveticaFont,
          })
          yOffset -= 15
        }

        yOffset -= 10
      })
    })

    // Add footer to all pages
    const pageCount = pdfDoc.getPageCount()
    for (let i = 0; i < pageCount; i++) {
      const currentPage = pdfDoc.getPage(i)
      currentPage.drawText(`Page ${i + 1} of ${pageCount}`, {
        x: 50,
        y: 30,
        size: 8,
        font: helveticaFont,
      })
      currentPage.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
        x: 400,
        y: 30,
        size: 8,
        font: helveticaFont,
      })
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()

    // Return the PDF as a response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${project.name.toLowerCase().replace(/\s+/g, "-")}-schedule.pdf"`,
      },
    })
  } catch (error) {
    console.error("[SCHEDULE_EXPORT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 