export type NoteSummary = {
  id: string
  title: string
  created_at: string
  excerpt?: string
  is_pinned?: boolean
}

export type NoteSummaryWithFolder = NoteSummary & {
  folder_id: string | null
}