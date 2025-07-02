"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Download, Server } from "lucide-react"

type Event = {
  id: string
  title: string
  description?: string | null
  startDate: Date
  endDate?: Date | null
  status: string
  percentComplete: number
  priority?: number
}

type ScheduleExportPDFProps = {
  events: Event[]
  projectName: string
  projectId: string
}

export default function ScheduleExportPDF({ events, projectName, projectId }: ScheduleExportPDFProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isServerExporting, setIsServerExporting] = useState(false)
  const generatePDF = () => {
    setIsExporting(true)
    
    try {
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(20)
      doc.text(`${projectName} - Project Schedule`, 14, 20)
      doc.setFontSize(12)

    // Sort events by start date
    const sortedEvents = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    // Group events by month and year
    const groupedEvents = sortedEvents.reduce((acc: { [key: string]: Event[] }, event: Event) => {
      const date = new Date(event.startDate)
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' })
      
      if (!acc[monthYear]) {
        acc[monthYear] = []
      }
      acc[monthYear].push(event)
      return acc
    }, {})

    let yOffset = 40

    // Add project summary
    doc.setFontSize(14)
    doc.text("Project Summary", 14, yOffset)
    doc.setFontSize(12)
    yOffset += 10

    const totalEvents = events.length
    const completedEvents = events.filter(e => e.status === 'Completed').length
    const inProgressEvents = events.filter(e => e.status === 'In Progress').length
    const notStartedEvents = events.filter(e => e.status === 'Not Started').length

    doc.text(`Total Events: ${totalEvents}`, 14, yOffset)
    yOffset += 7
    doc.text(`Completed: ${completedEvents}`, 14, yOffset)
    yOffset += 7
    doc.text(`In Progress: ${inProgressEvents}`, 14, yOffset)
    yOffset += 7
    doc.text(`Not Started: ${notStartedEvents}`, 14, yOffset)
    yOffset += 15

    // Add events by month
    Object.entries(groupedEvents).forEach(([monthYear, monthEvents]) => {
      // Add month header
      doc.setFontSize(14)
      doc.text(monthYear, 14, yOffset)
      doc.setFontSize(12)
      yOffset += 5

      // Create table data for this month
      const tableData = monthEvents.map((event) => [
        event.title,
        new Date(event.startDate).toLocaleDateString(),
        event.endDate ? new Date(event.endDate).toLocaleDateString() : '-',
        event.status,
        `${event.percentComplete}%`,
        event.priority ? `P${event.priority}` : '-',
        event.description || '-'
      ])

      // Add table
      autoTable(doc, {
        startY: yOffset,
        head: [["Event", "Start Date", "End Date", "Status", "Progress", "Priority", "Description"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 }, // Event title
          1: { cellWidth: 25 }, // Start date
          2: { cellWidth: 25 }, // End date
          3: { cellWidth: 25 }, // Status
          4: { cellWidth: 20 }, // Progress
          5: { cellWidth: 15 }, // Priority
          6: { cellWidth: 35 }  // Description
        }
      })

      yOffset = (doc as any).lastAutoTable.finalY + 10

      // Add new page if needed
      if (yOffset > 250) {
        doc.addPage()
        yOffset = 20
      }
    })

    // Add timeline view
    if (yOffset > 200) {
      doc.addPage()
      yOffset = 20
    }

    doc.setFontSize(14)
    doc.text("Timeline Overview", 14, yOffset)
    doc.setFontSize(12)
    yOffset += 10

    // Create a simple timeline table
    const timelineData = sortedEvents.map((event) => [
      event.title,
      new Date(event.startDate).toLocaleDateString(),
      event.endDate ? new Date(event.endDate).toLocaleDateString() : '-',
      event.status
    ])

    autoTable(doc, {
      startY: yOffset,
      head: [["Event", "Start Date", "End Date", "Status"]],
      body: timelineData,
      theme: "grid",
      headStyles: { fillColor: [66, 66, 66] },
      styles: { fontSize: 9 }
    })

    // Add footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10)
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10)
    }

      // Save the PDF
      doc.save(`${projectName.toLowerCase().replace(/\s+/g, "-")}-schedule.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const generateServerPDF = async () => {
    setIsServerExporting(true)
    
    try {
      const response = await fetch(`/api/projects/${projectId}/schedule/export`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to export schedule')
      }

      // Get the blob from the response
      const blob = await response.blob()
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary link element
      const link = document.createElement('a')
      link.href = url
      link.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-schedule.pdf`
      
      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the URL
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting schedule:', error)
    } finally {
      setIsServerExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={generatePDF}
        disabled={isExporting}
        className="bg-green-500 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-2 px-4 rounded flex items-center"
      >
        <Download className="h-5 w-5 mr-2" />
        {isExporting ? 'Generating...' : 'Export (Client)'}
      </button>
      
      <button
        onClick={generateServerPDF}
        disabled={isServerExporting}
        className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded flex items-center"
      >
        <Server className="h-5 w-5 mr-2" />
        {isServerExporting ? 'Generating...' : 'Export (Server)'}
      </button>
    </div>
  )
} 