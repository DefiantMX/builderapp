export type Project = {
  id: number
  name: string
  status: string
  description: string
  startDate: string
  endDate: string
}

// Initial static projects
export const staticProjects: Project[] = [
  {
    id: 1,
    name: "Downtown Office Complex",
    description: "A modern office complex in the heart of downtown",
    status: "In Progress",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
  },
  {
    id: 2,
    name: "Riverside Apartments",
    description: "Luxury apartment complex with riverside views",
    status: "Planning",
    startDate: "2024-03-01",
    endDate: "2025-06-30",
  },
  {
    id: 3,
    name: "Tech Innovation Center",
    description: "State-of-the-art technology innovation hub",
    status: "In Progress",
    startDate: "2024-02-15",
    endDate: "2024-11-30",
  },
]

// Store for dynamic projects
export const projectStore = {
  dynamicProjects: [] as Project[],

  addProject(project: Omit<Project, "id">) {
    const newProject = {
      ...project,
      id: this.getNextId(),
    }
    this.dynamicProjects.push(newProject)
    return newProject
  },

  getProject(id: number) {
    return staticProjects.find((p) => p.id === id) || this.dynamicProjects.find((p) => p.id === id)
  },

  getAllProjects() {
    return [...staticProjects, ...this.dynamicProjects]
  },

  getNextId() {
    const maxStaticId = Math.max(...staticProjects.map((p) => p.id))
    const maxDynamicId = this.dynamicProjects.length > 0 ? Math.max(...this.dynamicProjects.map((p) => p.id)) : 0
    return Math.max(maxStaticId, maxDynamicId) + 1
  },
}

