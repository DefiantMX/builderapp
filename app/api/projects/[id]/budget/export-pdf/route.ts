import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { projectName, budget, divisions, subcategories } = await request.json()
    
    console.log('PDF Export Request:', {
      projectName,
      budgetTotal: budget?.totalAmount,
      divisionCount: budget?.divisionBudgets?.length,
      divisions: Object.keys(divisions || {}).length,
      subcategories: Object.keys(subcategories || {}).length
    })
    
    console.log('Sample division data:', budget?.divisionBudgets?.[0])
    console.log('Sample division subcategories:', budget?.divisionBudgets?.[0]?.subcategories)

    // Create PDF
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(20)
    doc.text('Project Budget Report', 20, 20)
    
    // Add project name
    doc.setFontSize(14)
    doc.text(`Project: ${projectName}`, 20, 35)
    
    // Add date
    doc.setFontSize(12)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45)
    
    // Add total budget
    doc.setFontSize(16)
    doc.text(`Total Budget: $${budget.totalAmount.toLocaleString()}`, 20, 60)
    
    // Create detailed budget table with subcategories
    const tableData = budget.divisionBudgets.map((division: any) => {
      const divisionName = divisions[division.division] || division.division
      const divisionTotal = (division.subcategories || []).reduce((sum: number, sub: any) => sum + (sub.amount || 0), 0)
      
      // Add division header row
      const rows = [
        [
          `${division.division} - ${divisionName}`,
          `$${divisionTotal.toLocaleString()}`,
          'DIVISION TOTAL'
        ]
      ]
      
      // Add subcategory rows if they exist
      console.log(`Processing division ${division.division}:`, division)
      console.log(`Subcategories for division ${division.division}:`, division.subcategories)
      
      if (division.subcategories && division.subcategories.length > 0) {
        division.subcategories.forEach((sub: any) => {
          console.log(`Subcategory:`, sub)
          // If it's a custom subcategory, show the description as the name
          const subcategoryName = sub.subcategory === 'Custom' ? (sub.description || 'Custom Item') : sub.subcategory
          rows.push([
            `  • ${subcategoryName}`,
            `$${sub.amount.toLocaleString()}`,
            sub.subcategory === 'Custom' ? '' : (sub.description || '')
          ])
        })
      } else {
        // If no subcategories, show the division amount as a single item
        console.log(`No subcategories found for division ${division.division}, using General`)
        rows.push([
          `  • General`,
          `$${division.amount.toLocaleString()}`,
          division.description || ''
        ])
      }
      
      // Add empty row for spacing
      rows.push(['', '', ''])
      
      return rows
    }).flat()
    
    // Add detailed table
    autoTable(doc, {
      head: [['Item', 'Amount', 'Description']],
      body: tableData,
      startY: 75,
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { cellWidth: 45, halign: 'right' },
        2: { cellWidth: 60 },
      },
      didParseCell: function(data) {
        // Style division headers
        if (data.row.index === 0 || data.cell.text[0] === data.cell.text[0]?.match(/^\d+ - /)) {
          data.cell.styles.fillColor = [220, 220, 220]
          data.cell.styles.fontStyle = 'bold'
        }
        // Style subcategory items
        if (data.cell.text[0]?.startsWith('  •')) {
          data.cell.styles.fontSize = 9
        }
      }
    })
    
    // Add detailed summary
    const finalY = (doc as any).lastAutoTable?.finalY || 75
    doc.setFontSize(14)
    doc.text('Budget Summary', 20, finalY + 20)
    
    // Calculate statistics
    const totalSubcategories = budget.divisionBudgets.reduce((sum: number, division: any) => {
      return sum + (division.subcategories?.length || 1)
    }, 0)
    
    const divisionsWithSubcategories = budget.divisionBudgets.filter((division: any) => 
      division.subcategories && division.subcategories.length > 0
    ).length
    
    doc.setFontSize(12)
    doc.text(`Total Budget: $${budget.totalAmount.toLocaleString()}`, 20, finalY + 35)
    doc.text(`Number of Divisions: ${budget.divisionBudgets.length}`, 20, finalY + 45)
    doc.text(`Divisions with Subcategories: ${divisionsWithSubcategories}`, 20, finalY + 55)
    doc.text(`Total Subcategories: ${totalSubcategories}`, 20, finalY + 65)
    
    // Add breakdown by division type
    doc.setFontSize(11)
    doc.text('Breakdown by Division Type:', 20, finalY + 85)
    
    let yOffset = finalY + 95
    budget.divisionBudgets.forEach((division: any) => {
      const divisionName = divisions[division.division] || division.division
      const divisionTotal = (division.subcategories || []).reduce((sum: number, sub: any) => sum + (sub.amount || 0), 0)
      const percentage = ((divisionTotal / budget.totalAmount) * 100).toFixed(1)
      
      doc.text(`• ${division.division} - ${divisionName}: $${divisionTotal.toLocaleString()} (${percentage}%)`, 25, yOffset)
      yOffset += 8
    })
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${projectName}-Detailed-Budget.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating budget PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
} 