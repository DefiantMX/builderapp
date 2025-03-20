export enum UserRole {
  Admin = "admin",
  ProjectManager = "project_manager",
  Contractor = "contractor",
  Subcontractor = "subcontractor",
  Client = "client",
  ReadOnly = "read_only",
}

// Define permissions for each feature
export enum Permission {
  ViewProjects = "view_projects",
  CreateProjects = "create_projects",
  EditProjects = "edit_projects",
  DeleteProjects = "delete_projects",

  ViewTasks = "view_tasks",
  CreateTasks = "create_tasks",
  EditTasks = "edit_tasks",
  DeleteTasks = "delete_tasks",

  ViewFinances = "view_finances",
  ManageFinances = "manage_finances",

  ViewSchedule = "view_schedule",
  ManageSchedule = "manage_schedule",

  ViewDailyLogs = "view_daily_logs",
  CreateDailyLogs = "create_daily_logs",

  ManageUsers = "manage_users",
  InviteUsers = "invite_users",
}

// Define which permissions each role has
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.Admin]: Object.values(Permission), // Admins have all permissions

  [UserRole.ProjectManager]: [
    Permission.ViewProjects,
    Permission.CreateProjects,
    Permission.EditProjects,
    Permission.ViewTasks,
    Permission.CreateTasks,
    Permission.EditTasks,
    Permission.DeleteTasks,
    Permission.ViewFinances,
    Permission.ManageFinances,
    Permission.ViewSchedule,
    Permission.ManageSchedule,
    Permission.ViewDailyLogs,
    Permission.CreateDailyLogs,
    Permission.InviteUsers,
  ],

  [UserRole.Contractor]: [
    Permission.ViewProjects,
    Permission.ViewTasks,
    Permission.CreateTasks,
    Permission.EditTasks,
    Permission.ViewFinances,
    Permission.ViewSchedule,
    Permission.ViewDailyLogs,
    Permission.CreateDailyLogs,
  ],

  [UserRole.Subcontractor]: [
    Permission.ViewProjects,
    Permission.ViewTasks,
    Permission.ViewSchedule,
    Permission.ViewDailyLogs,
    Permission.CreateDailyLogs,
  ],

  [UserRole.Client]: [Permission.ViewProjects, Permission.ViewSchedule, Permission.ViewDailyLogs],

  [UserRole.ReadOnly]: [
    Permission.ViewProjects,
    Permission.ViewTasks,
    Permission.ViewSchedule,
    Permission.ViewDailyLogs,
  ],
}

// Helper function to check if a user has a specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) || false
}

// Mock user data with roles
export const users = [
  { id: 1, username: "admin", email: "admin@example.com", role: UserRole.Admin, verified: true },
  { id: 2, username: "manager", email: "manager@example.com", role: UserRole.ProjectManager, verified: true },
  { id: 3, username: "contractor", email: "contractor@example.com", role: UserRole.Contractor, verified: true },
  { id: 4, username: "client", email: "client@example.com", role: UserRole.Client, verified: true },
]

// Mock invitations
export const invitations = [
  {
    id: 1,
    email: "newuser@example.com",
    role: UserRole.Contractor,
    projectId: 1,
    token: "abc123",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

