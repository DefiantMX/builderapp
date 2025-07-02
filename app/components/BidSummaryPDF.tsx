"use client"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Download } from "lucide-react"

type Bid = {
  id: string
  title: string
  description: string | null
  contractorName: string
  contractorEmail: string
  amount: number
  division: string
  status: string
  submissionDate: string
  validUntil: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

type BidSummaryPDFProps = {
  selectedBids: Bid[]
  divisions: { [key: string]: string }
  projectId: string
  projectName: string
}

export default function BidSummaryPDF({ selectedBids, divisions, projectId, projectName }: BidSummaryPDFProps) {
  const generatePDF = () => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(20)
    doc.text(`${projectName} - Selected Bids Summary`, 14, 20)
    doc.setFontSize(12)

    // Group bids by division
    const bidsByDivision = selectedBids.reduce((acc: { [key: string]: Bid[] }, bid: Bid) => {
      if (!acc[bid.division]) {
        acc[bid.division] = []
      }
      acc[bid.division].push(bid)
      return acc
    }, {})

    let yOffset = 40

    // Add division tables
    Object.entries(bidsByDivision).forEach(([division, bids]) => {
      // Add division header
      doc.setFontSize(14)
      doc.text(`Division ${division} - ${divisions[division]}`, 14, yOffset)
      doc.setFontSize(12)

      // Calculate division total
      const divisionTotal = bids.reduce((sum, bid) => sum + bid.amount, 0)

      // Create table data
      const tableData = bids.map((bid) => [
        bid.title,
        bid.contractorName,
        bid.contractorEmail,
        `$${bid.amount.toLocaleString()}`,
        new Date(bid.submissionDate).toLocaleDateString(),
        bid.status,
        bid.description || "-",
        bid.notes || "-",
      ])

      // Add table
      autoTable(doc, {
        startY: yOffset + 5,
        head: [["Title", "Contractor", "Contractor Email", "Amount", "Submission Date", "Status", "Description", "Notes"]],
        body: tableData,
        foot: [["Division Total", `$${divisionTotal.toLocaleString()}`, "", "", "", "", "", ""]],
        theme: "striped",
        headStyles: { fillColor: [66, 66, 66] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      })

      yOffset = (doc as any).lastAutoTable.finalY + 20

      // Add new page if needed
      if (yOffset > 250) {
        doc.addPage()
        yOffset = 20
      }
    })

    // Add total of all selected bids
    const totalAmount = selectedBids.reduce((sum, bid) => sum + bid.amount, 0)
    doc.setFontSize(14)
    doc.text(`Total Selected Bids: $${totalAmount.toLocaleString()}`, 14, yOffset)

    // Save the PDF
    doc.save(`${projectName.toLowerCase().replace(/\s+/g, "-")}-bid-summary.pdf`)
  }

  return (
    <button
      onClick={generatePDF}
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
    >
      <Download className="h-5 w-5 mr-2" />
      Export Selected Bids
    </button>
  )
}

