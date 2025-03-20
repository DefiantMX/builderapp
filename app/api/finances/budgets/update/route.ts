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

// Construction divisions
const DIVISIONS = {
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

export async function POST(request: Request) {
  try {
    const invoice = await request.json()
    const { projectId, division, amount } = invoice

    // Find the budget for this project
    let budget = budgets.find((b) => b.projectId === projectId)

    // If no budget exists for this project, create one
    if (!budget) {
      budget = {
        projectId,
        totalBudget: 0,
        totalSpent: 0,
        divisions: [],
      }
      budgets.push(budget)
    }

    // Update the total spent
    budget.totalSpent += amount

    // Find the division
    let divisionBudget = budget.divisions.find((d: any) => d.id === division)

    // If division doesn't exist in the budget, create it
    if (!divisionBudget) {
      divisionBudget = {
        id: division,
        name: DIVISIONS[division as keyof typeof DIVISIONS] || `Division ${division}`,
        budget: 0,
        spent: 0,
      }
      budget.divisions.push(divisionBudget)
    }

    // Update the division spent
    divisionBudget.spent += amount

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating budget:", error)
    return NextResponse.json({ message: "An error occurred while updating the budget" }, { status: 500 })
  }
}

