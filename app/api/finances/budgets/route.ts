import { NextResponse } from "next/server"

// This is a mock budget database. In a real application, you'd use a proper database.
const budgets: any[] = [
  {
    projectId: 1,
    totalBudget: 1500000,
    totalSpent: 450000,
    divisions: [
      { id: "01", name: "General Requirements", budget: 75000, spent: 25000 },
      { id: "02", name: "Existing Conditions", budget: 50000, spent: 15000 },
      { id: "03", name: "Concrete", budget: 200000, spent: 80000 },
      { id: "05", name: "Metals", budget: 150000, spent: 30000 },
      { id: "07", name: "Thermal and Moisture Protection", budget: 100000, spent: 40000 },
      { id: "09", name: "Finishes", budget: 120000, spent: 35000 },
      { id: "22", name: "Plumbing", budget: 80000, spent: 25000 },
      { id: "23", name: "HVAC", budget: 200000, spent: 60000 },
      { id: "26", name: "Electrical", budget: 180000, spent: 50000 },
    ],
  },
  {
    projectId: 2,
    totalBudget: 800000,
    totalSpent: 200000,
    divisions: [
      { id: "01", name: "General Requirements", budget: 40000, spent: 15000 },
      { id: "03", name: "Concrete", budget: 120000, spent: 50000 },
      { id: "06", name: "Wood, Plastics, and Composites", budget: 80000, spent: 30000 },
      { id: "09", name: "Finishes", budget: 90000, spent: 25000 },
      { id: "22", name: "Plumbing", budget: 60000, spent: 20000 },
      { id: "26", name: "Electrical", budget: 100000, spent: 30000 },
    ],
  },
  {
    projectId: 3,
    totalBudget: 2000000,
    totalSpent: 800000,
    divisions: [
      { id: "01", name: "General Requirements", budget: 100000, spent: 40000 },
      { id: "03", name: "Concrete", budget: 250000, spent: 100000 },
      { id: "05", name: "Metals", budget: 300000, spent: 120000 },
      { id: "07", name: "Thermal and Moisture Protection", budget: 150000, spent: 60000 },
      { id: "08", name: "Openings", budget: 120000, spent: 50000 },
      { id: "09", name: "Finishes", budget: 180000, spent: 70000 },
      { id: "22", name: "Plumbing", budget: 100000, spent: 40000 },
      { id: "23", name: "HVAC", budget: 250000, spent: 100000 },
      { id: "26", name: "Electrical", budget: 220000, spent: 90000 },
      { id: "27", name: "Communications", budget: 80000, spent: 30000 },
    ],
  },
]

export async function GET() {
  return NextResponse.json(budgets)
}

