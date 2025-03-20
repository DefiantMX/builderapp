import { NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

// Mock draws data - in a real app, you would fetch this from your database
const draws: any[] = [
  {
    id: 1,
    projectId: 1,
    drawNumber: 1,
    date: "2023-06-15",
    amount: 125000,
    status: "Paid",
    description: "Initial foundation work and site preparation",
    fileUrl: null,
    createdAt: "2023-06-15T12:00:00Z",
    invoices: [
      {
        id: 1,
        projectId: 1,
        invoiceNumber: "INV-001",
        vendor: "ABC Concrete",
        amount: 45000,
        division: "03",
        date: "2023-06-01",
      },
      {
        id: 2,
        projectId: 1,
        invoiceNumber: "INV-002",
        vendor: "XYZ Excavation",
        amount: 80000,
        division: "31",
        date: "2023-06-10",
      },
    ],
  },
  {
    id: 2,
    projectId: 1,
    drawNumber: 2,
    date: "2023-07-15",
    amount: 175000,
    status: "Paid",
    description: "Framing and electrical rough-in",
    fileUrl: null,
    createdAt: "2023-07-15T12:00:00Z",
    invoices: [
      {
        id: 3,
        projectId: 1,
        invoiceNumber: "INV-003",
        vendor: "Framing Co",
        amount: 95000,
        division: "06",
        date: "2023-07-05",
      },
      {
        id: 4,
        projectId: 1,
        invoiceNumber: "INV-004",
        vendor: "Electric Masters",
        amount: 80000,
        division: "26",
        date: "2023-07-10",
      },
    ],
  },
]

// Mock projects data
const projects = [
  {
    id: 1,
    name: "Downtown Office Complex",
    description: "A modern office complex in the heart of downtown",
    status: "In Progress",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    contractSum: 1500000,
  },
]

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const drawId = Number.parseInt(params.id, 10)
    const draw = draws.find((d) => d.id === drawId)

    if (!draw) {
      return new NextResponse("Draw not found", { status: 404 })
    }

    const project = projects.find((p) => p.id === draw.projectId)

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()

    // Add a page
    const page = pdfDoc.addPage([612, 792]) // Letter size

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Draw AIA G702 style header
    page.drawText("APPLICATION AND CERTIFICATE FOR PAYMENT", {
      x: 150,
      y: 750,
      size: 16,
      font: helveticaBold,
    })

    // Draw document information
    page.drawText("AIA Document G702", {
      x: 50,
      y: 720,
      size: 10,
      font: helveticaFont,
    })

    // Draw borders
    page.drawRectangle({
      x: 50,
      y: 600,
      width: 512,
      height: 100,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    })

    // Project info
    page.drawText("PROJECT:", {
      x: 60,
      y: 680,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(project.name, {
      x: 120,
      y: 680,
      size: 10,
      font: helveticaFont,
    })

    // Application info
    page.drawText("APPLICATION NO:", {
      x: 60,
      y: 650,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(draw.drawNumber.toString(), {
      x: 160,
      y: 650,
      size: 10,
      font: helveticaFont,
    })

    page.drawText("APPLICATION DATE:", {
      x: 60,
      y: 630,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(new Date(draw.date).toLocaleDateString(), {
      x: 160,
      y: 630,
      size: 10,
      font: helveticaFont,
    })

    // Draw the main content - Invoice summary
    page.drawText("CONTRACTOR'S APPLICATION FOR PAYMENT", {
      x: 50,
      y: 580,
      size: 12,
      font: helveticaBold,
    })

    // Table header
    const tableTop = 550
    const colWidths = [150, 90, 90, 90, 90]
    const startX = 50

    page.drawRectangle({
      x: startX,
      y: tableTop - 15,
      width: colWidths.reduce((sum, w) => sum + w, 0),
      height: 15,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    })

    const headers = ["DESCRIPTION", "SCHEDULED VALUE", "PREVIOUS APPLICATIONS", "THIS APPLICATION", "BALANCE TO FINISH"]

    headers.forEach((header, i) => {
      let xPos = startX
      for (let j = 0; j < i; j++) {
        xPos += colWidths[j]
      }

      page.drawText(header, {
        x: xPos + 5,
        y: tableTop - 10,
        size: 8,
        font: helveticaBold,
      })

      // Draw vertical line after each column except the last
      if (i < headers.length - 1) {
        page.drawLine({
          start: { x: xPos + colWidths[i], y: tableTop },
          end: { x: xPos + colWidths[i], y: tableTop - 15 },
          thickness: 1,
          color: rgb(0, 0, 0),
        })
      }
    })

    // Group invoices by division
    const divisionTotals: Record<string, number> = {}

    draw.invoices.forEach((invoice: any) => {
      if (divisionTotals[invoice.division]) {
        divisionTotals[invoice.division] += invoice.amount
      } else {
        divisionTotals[invoice.division] = invoice.amount
      }
    })

    // Constants for division names
    const DIVISIONS: Record<string, string> = {
      "01": "General Requirements",
      "02": "Existing Conditions",
      "03": "Concrete",
      "04": "Masonry",
      "05": "Metals",
      "06": "Wood, Plastics, and Composites",
      "07": "Thermal and Moisture Protection",
      "08": "Openings",
      "09": "Finishes",
      "10": "Specialties",
      "11": "Equipment",
      "12": "Furnishings",
      "13": "Special Construction",
      "14": "Conveying Equipment",
      "21": "Fire Suppression",
      "22": "Plumbing",
      "23": "Heating, Ventilating, and Air Conditioning",
      "26": "Electrical",
      "27": "Communications",
      "28": "Electronic Safety and Security",
      "31": "Earthwork",
      "32": "Exterior Improvements",
      "33": "Utilities",
    }

    // Draw rows for each division
    let yPos = tableTop - 30
    const totalScheduledValue = project.contractSum
    let totalThisApplication = 0
    let totalPreviousApplications = 0

    // Get previous applications total
    const previousDraws = draws
      .filter((d) => d.projectId === project.id && d.drawNumber < draw.drawNumber)
      .reduce((sum, d) => sum + d.amount, 0)

    totalPreviousApplications = previousDraws
    totalThisApplication = draw.amount

    // Calculate remaining balance
    const balanceToFinish = totalScheduledValue - totalPreviousApplications - totalThisApplication

    Object.entries(divisionTotals).forEach(([division, amount], index) => {
      // Draw horizontal line
      page.drawLine({
        start: { x: startX, y: yPos + 15 },
        end: { x: startX + colWidths.reduce((sum, w) => sum + w, 0), y: yPos + 15 },
        thickness: 1,
        color: rgb(0, 0, 0),
      })

      // Division name and amount
      page.drawText(`${division} - ${DIVISIONS[division] || "Other"}`, {
        x: startX + 5,
        y: yPos,
        size: 9,
        font: helveticaFont,
      })

      // Calculate division percentage of total
      const divisionPercentage = (amount / totalThisApplication) * 100
      const divisionScheduledValue = (divisionPercentage / 100) * totalScheduledValue
      const divisionBalance = divisionScheduledValue - amount

      // Draw division amounts
      page.drawText(`$${divisionScheduledValue.toLocaleString()}`, {
        x: startX + colWidths[0] + 5,
        y: yPos,
        size: 9,
        font: helveticaFont,
      })

      page.drawText("$0", {
        x: startX + colWidths[0] + colWidths[1] + 5,
        y: yPos,
        size: 9,
        font: helveticaFont,
      })

      page.drawText(`$${amount.toLocaleString()}`, {
        x: startX + colWidths[0] + colWidths[1] + colWidths[2] + 5,
        y: yPos,
        size: 9,
        font: helveticaFont,
      })

      page.drawText(`$${divisionBalance.toLocaleString()}`, {
        x: startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5,
        y: yPos,
        size: 9,
        font: helveticaFont,
      })

      // Update position for next row
      yPos -= 20

      // Add a new page if we're running out of space
      if (yPos < 100) {
        // Add a new page
        const newPage = pdfDoc.addPage([612, 792])
        yPos = 750
      }
    })

    // Draw total row
    page.drawLine({
      start: { x: startX, y: yPos + 15 },
      end: { x: startX + colWidths.reduce((sum, w) => sum + w, 0), y: yPos + 15 },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    page.drawLine({
      start: { x: startX, y: yPos - 5 },
      end: { x: startX + colWidths.reduce((sum, w) => sum + w, 0), y: yPos - 5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    page.drawText("GRAND TOTAL", {
      x: startX + 5,
      y: yPos,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(`$${totalScheduledValue.toLocaleString()}`, {
      x: startX + colWidths[0] + 5,
      y: yPos,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(`$${totalPreviousApplications.toLocaleString()}`, {
      x: startX + colWidths[0] + colWidths[1] + 5,
      y: yPos,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(`$${totalThisApplication.toLocaleString()}`, {
      x: startX + colWidths[0] + colWidths[1] + colWidths[2] + 5,
      y: yPos,
      size: 10,
      font: helveticaBold,
    })

    page.drawText(`$${balanceToFinish.toLocaleString()}`, {
      x: startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5,
      y: yPos,
      size: 10,
      font: helveticaBold,
    })

    // Draw signatures section
    yPos -= 80

    page.drawText("ARCHITECT'S CERTIFICATE FOR PAYMENT", {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaBold,
    })

    yPos -= 20

    page.drawText("ARCHITECT:", {
      x: 60,
      y: yPos,
      size: 10,
      font: helveticaBold,
    })

    page.drawLine({
      start: { x: 130, y: yPos - 2 },
      end: { x: 350, y: yPos - 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })

    yPos -= 20

    page.drawText("By:", {
      x: 60,
      y: yPos,
      size: 10,
      font: helveticaBold,
    })

    page.drawLine({
      start: { x: 80, y: yPos - 2 },
      end: { x: 250, y: yPos - 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })

    page.drawText("Date:", {
      x: 280,
      y: yPos,
      size: 10,
      font: helveticaBold,
    })

    page.drawLine({
      start: { x: 310, y: yPos - 2 },
      end: { x: 450, y: yPos - 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })

    // Generate the PDF
    const pdfBytes = await pdfDoc.save()

    // Return the PDF with proper headers
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Draw_${draw.drawNumber}_AIA_G702.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating AIA document:", error)
    return new NextResponse("Error generating AIA document", { status: 500 })
  }
}

