export const COLORS = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  light: '#F9FAFB',
  dark: '#111827'
}

export const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#10B981' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' },
  { value: 'critical', label: 'Critical', color: '#DC2626' }
]

export const ROLES = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  member: 'Member',
  viewer: 'Viewer'
}

export const TASK_STATUS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done'
}

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_MOVED: 'task_moved',
  PROJECT_INVITE: 'project_invite',
  DUE_DATE: 'due_date',
  TASK_UPDATED: 'task_updated',
  PROJECT_UPDATED: 'project_updated'
}

export const DEFAULT_COLUMNS = [
  { name: 'To Do', color: '#CBD5E0', order: 0 },
  { name: 'In Progress', color: '#4299E1', order: 1 },
  { name: 'Done', color: '#48BB78', order: 2 }
]