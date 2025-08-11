import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DIVISIONS, DIVISION_SUBCATEGORIES } from '@/lib/constants';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    const { format, measurements } = await request.json();

    // Get all measurements for this project if not provided
    const allMeasurements = measurements || await prisma.measurement.findMany({
      where: {
        plan: {
          projectId: params.id
        }
      },
      include: {
        plan: true
      }
    });

    // Parse points for each measurement
    const parsedMeasurements = allMeasurements.map(m => ({
      ...m,
      points: typeof m.points === 'string' ? JSON.parse(m.points) : m.points
    }));

    // Calculate totals by division
    const totalsByDivision = parsedMeasurements.reduce((acc, m) => {
      const division = DIVISIONS[m.division as keyof typeof DIVISIONS] || m.division;
      if (!acc[division]) {
        acc[division] = { 
          line: 0, 
          area: 0, 
          count: 0, 
          text: 0,
          items: [] 
        };
      }
      
      if (m.type === "line") acc[division].line += m.value;
      else if (m.type === "area") acc[division].area += m.value;
      else if (m.type === "count") acc[division].count += m.value;
      else if (m.type === "text") acc[division].text += 1;
      
      acc[division].items.push(m);
      return acc;
    }, {} as Record<string, { line: number; area: number; count: number; text: number; items: any[] }>);

    // Generate export based on format
    let exportData: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        exportData = generateCSV(parsedMeasurements, totalsByDivision, project);
        contentType = 'text/csv';
        filename = `takeoff-${project.name}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'excel':
        exportData = generateExcel(parsedMeasurements, totalsByDivision, project);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `takeoff-${project.name}-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      
      case 'pdf':
      default:
        exportData = generatePDF(parsedMeasurements, totalsByDivision, project);
        contentType = 'application/pdf';
        filename = `takeoff-${project.name}-${new Date().toISOString().split('T')[0]}.pdf`;
        break;
    }

    return new NextResponse(exportData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in takeoff export:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

function generateCSV(measurements: any[], totalsByDivision: any, project: any): string {
  const headers = [
    'Division',
    'Subcategory',
    'Type',
    'Label',
    'Value',
    'Unit',
    'Layer',
    'Material Type',
    'Price Per Unit',
    'Total Price',
    'Notes',
    'Plan',
    'Created Date'
  ];

  const rows = measurements.map(m => [
    DIVISIONS[m.division as keyof typeof DIVISIONS] || m.division,
    m.subcategory,
    m.type,
    m.label,
    m.value,
    m.unit,
    m.layer,
    m.materialType || '',
    m.pricePerUnit || '',
    (m.value * (m.pricePerUnit || 0)).toFixed(2),
    m.notes || '',
    m.plan?.title || '',
    new Date(m.createdAt).toLocaleDateString()
  ]);

  // Add summary rows
  rows.push([]);
  rows.push(['SUMMARY BY DIVISION']);
  rows.push([]);

  Object.entries(totalsByDivision).forEach(([division, totals]) => {
    rows.push([division]);
    if (totals.line > 0) rows.push(['', '', 'Linear', '', totals.line.toFixed(2), 'ft']);
    if (totals.area > 0) rows.push(['', '', 'Area', '', totals.area.toFixed(2), 'sq ft']);
    if (totals.count > 0) rows.push(['', '', 'Count', '', totals.count, 'ea']);
    if (totals.text > 0) rows.push(['', '', 'Notes', '', totals.text, '']);
    rows.push([]);
  });

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function generateExcel(measurements: any[], totalsByDivision: any, project: any): string {
  // For now, return CSV format as Excel (you can implement proper Excel generation with a library like xlsx)
  return generateCSV(measurements, totalsByDivision, project);
}

function generatePDF(measurements: any[], totalsByDivision: any, project: any): string {
  // Generate a simple HTML-based PDF report
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Takeoff Report - ${project.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .project-info { margin-bottom: 30px; }
        .summary { margin-bottom: 30px; }
        .division { margin-bottom: 20px; page-break-inside: avoid; }
        .division h3 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
        .measurement { margin: 5px 0; padding: 5px; background: #f8fafc; }
        .totals { font-weight: bold; background: #e2e8f0; padding: 10px; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f1f5f9; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Takeoff Report</h1>
        <h2>${project.name}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="project-info">
        <h3>Project Information</h3>
        <p><strong>Project Name:</strong> ${project.name}</p>
        <p><strong>Description:</strong> ${project.description || 'No description provided'}</p>
        <p><strong>Total Measurements:</strong> ${measurements.length}</p>
      </div>

      <div class="summary">
        <h3>Summary by Division</h3>
        <table>
          <thead>
            <tr>
              <th>Division</th>
              <th>Linear (ft)</th>
              <th>Area (sq ft)</th>
              <th>Count (ea)</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(totalsByDivision).map(([division, totals]) => `
              <tr>
                <td>${division}</td>
                <td>${totals.line.toFixed(2)}</td>
                <td>${totals.area.toFixed(2)}</td>
                <td>${totals.count}</td>
                <td>${totals.text}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${Object.entries(totalsByDivision).map(([division, totals]) => `
        <div class="division">
          <h3>${division}</h3>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Label</th>
                <th>Value</th>
                <th>Unit</th>
                <th>Layer</th>
                <th>Material</th>
                <th>Price/Unit</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              ${totals.items.map(m => `
                <tr>
                  <td>${m.type}</td>
                  <td>${m.label}</td>
                  <td>${m.value.toFixed(2)}</td>
                  <td>${m.unit}</td>
                  <td>${m.layer}</td>
                  <td>${m.materialType || ''}</td>
                  <td>$${(m.pricePerUnit || 0).toFixed(2)}</td>
                  <td>$${(m.value * (m.pricePerUnit || 0)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <strong>Division Totals:</strong>
            ${totals.line > 0 ? ` Linear: ${totals.line.toFixed(2)} ft` : ''}
            ${totals.area > 0 ? ` Area: ${totals.area.toFixed(2)} sq ft` : ''}
            ${totals.count > 0 ? ` Count: ${totals.count} ea` : ''}
            ${totals.text > 0 ? ` Notes: ${totals.text}` : ''}
          </div>
        </div>
      `).join('')}

      <div class="page-break"></div>
      
      <div class="header">
        <h3>Measurement Details</h3>
      </div>

      ${measurements.map(m => `
        <div class="measurement">
          <strong>${m.label}</strong> (${m.type})<br>
          Value: ${m.value.toFixed(2)} ${m.unit}<br>
          Division: ${DIVISIONS[m.division as keyof typeof DIVISIONS] || m.division}<br>
          Layer: ${m.layer}<br>
          ${m.notes ? `Notes: ${m.notes}<br>` : ''}
          Plan: ${m.plan?.title || 'Unknown'}<br>
          Created: ${new Date(m.createdAt).toLocaleDateString()}
        </div>
      `).join('')}
    </body>
    </html>
  `;

  return html;
}
