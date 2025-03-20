export interface Document {
  id: string
  title: string
  description?: string | null
  fileUrl: string
  fileType: string
  category: "CONTRACT" | "SUBMITTAL" | "RFI" | "CHANGE_ORDER"
  status: string
  createdAt: Date
  updatedAt: Date
  projectId: string
  userId: string
}

export type DocumentList = Document[] 