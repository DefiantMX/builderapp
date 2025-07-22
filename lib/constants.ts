export const DIVISIONS = {
  "00": "Project Soft Costs",
  "01": "General Requirements",
  "02": "Site Construction",
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
  "15": "HVAC and Plumbing",
  "16": "Electrical",
  "17": "Allowances",
  "21": "Fire Suppression",
  "22": "Plumbing",
  "23": "Heating, Ventilating, and Air Conditioning",
  "26": "Electrical",
  "27": "Communications",
  "28": "Electronic Safety and Security",
  "31": "Earthwork",
  "32": "Exterior Improvements",
  "33": "Utilities",
} as const

// Subcategories for each division
export const DIVISION_SUBCATEGORIES = {
  "00": {
    name: "Project Soft Costs",
    subcategories: [
      "Permits",
      "Architectural Fees", 
      "Engineering",
      "Staking",
      "Designer Fees",
      "Interest",
      "Workmans Comp"
    ]
  },
  "01": {
    name: "General Requirements",
    subcategories: [
      "Supervision",
      "Overhead",
      "General Labor",
      "Liability Insurance",
      "Equipment",
      "General Condition and Misc",
      "Building Final Clean",
      "Winter Heating",
      "Radon"
    ]
  },
  "02": {
    name: "Site Construction",
    subcategories: [
      "Excavation",
      "Water and Sewer",
      "Site Required",
      "Landscape"
    ]
  },
  "03": {
    name: "Concrete",
    subcategories: [
      "Foundation",
      "Sidewalks",
      "Site Concrete",
      "Patio"
    ]
  },
  "04": {
    name: "Masonry",
    subcategories: [
      "Stone",
      "Brick",
      "Block",
      "Masonry Accessories"
    ]
  },
  "05": {
    name: "Metals",
    subcategories: [
      "Steel",
      "Decorative Brackets",
      "Structural Steel",
      "Metal Fabrications"
    ]
  },
  "06": {
    name: "Wood, Plastics, and Composites",
    subcategories: [
      "Framing",
      "Lumber Package",
      "Truss Package",
      "Cedar Decorative Truss",
      "Cedar Window",
      "Misc (hold downs, Bolts, Etc..)",
      "Trim",
      "Trim Install",
      "House Wrap",
      "Misc (House Wrap, Rough Timber, etc.)"
    ]
  },
  "07": {
    name: "Thermal and Moisture Protection",
    subcategories: [
      "Roofing",
      "Waterproofing",
      "Insulation",
      "Air Barriers"
    ]
  },
  "08": {
    name: "Openings",
    subcategories: [
      "Doors",
      "Windows",
      "Glazing",
      "Hardware"
    ]
  },
  "09": {
    name: "Finishes",
    subcategories: [
      "Drywall",
      "Painting",
      "Flooring",
      "Ceilings",
      "Wall Coverings"
    ]
  },
  "10": {
    name: "Specialties",
    subcategories: [
      "Cabinets",
      "Countertops",
      "Appliances",
      "Specialty Items"
    ]
  },
  "11": {
    name: "Equipment",
    subcategories: [
      "Kitchen Equipment",
      "HVAC Equipment",
      "Plumbing Equipment",
      "Electrical Equipment"
    ]
  },
  "12": {
    name: "Furnishings",
    subcategories: [
      "Furniture",
      "Window Treatments",
      "Accessories"
    ]
  },
  "13": {
    name: "Special Construction",
    subcategories: [
      "Specialty Systems",
      "Specialty Structures"
    ]
  },
  "14": {
    name: "Conveying Equipment",
    subcategories: [
      "Elevators",
      "Escalators",
      "Moving Walks"
    ]
  },
  "15": {
    name: "HVAC and Plumbing",
    subcategories: [
      "HVAC Systems",
      "Plumbing Systems",
      "Mechanical Equipment",
      "Piping"
    ]
  },
  "16": {
    name: "Electrical",
    subcategories: [
      "Electrical Systems",
      "Lighting",
      "Power Distribution",
      "Communications"
    ]
  },
  "17": {
    name: "Allowances",
    subcategories: [
      "Contingency",
      "Owner Allowances",
      "Design Allowances"
    ]
  },
  "21": {
    name: "Fire Suppression",
    subcategories: [
      "Sprinkler Systems",
      "Fire Alarms",
      "Fire Protection"
    ]
  },
  "22": {
    name: "Plumbing",
    subcategories: [
      "Plumbing Fixtures",
      "Plumbing Systems",
      "Water Systems"
    ]
  },
  "23": {
    name: "Heating, Ventilating, and Air Conditioning",
    subcategories: [
      "HVAC Equipment",
      "Ductwork",
      "Controls",
      "Ventilation"
    ]
  },
  "26": {
    name: "Electrical",
    subcategories: [
      "Electrical Systems",
      "Lighting",
      "Power Distribution",
      "Communications"
    ]
  },
  "27": {
    name: "Communications",
    subcategories: [
      "Telecommunications",
      "Data Systems",
      "Audio/Video"
    ]
  },
  "28": {
    name: "Electronic Safety and Security",
    subcategories: [
      "Security Systems",
      "Access Control",
      "Surveillance"
    ]
  },
  "31": {
    name: "Earthwork",
    subcategories: [
      "Excavation",
      "Grading",
      "Drainage",
      "Site Preparation"
    ]
  },
  "32": {
    name: "Exterior Improvements",
    subcategories: [
      "Paving",
      "Landscaping",
      "Site Furnishings",
      "Exterior Lighting"
    ]
  },
  "33": {
    name: "Utilities",
    subcategories: [
      "Water Utilities",
      "Sewer Utilities",
      "Electrical Utilities",
      "Gas Utilities"
    ]
  }
} as const 