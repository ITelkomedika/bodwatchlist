
export enum TaskStatus {
  ON_TRACK = 'ON TRACK',
  IN_PROGRESS = 'IN PROGRESS',
  STAGNANT = 'STAGNANT',
  PENDING = 'PENDING',
  PENDING_CLOSING = 'PENDING CLOSING',
  CLOSED = 'CLOSED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export type UserRole = 'SECRETARY' | 'UNIT';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  avatar_seed: string;
  photoUrl?: string; // Optional URL for leader's photo
  division?: string; // Optional division name for display
}

export interface Notification {
  id: string;
  targetUserId: string;
  fromUser: User;
  message: string;
  taskId: string;
  taskTitle: string;
  createdAt: string;
  isRead: boolean;
}

export interface RACIMatrix {
  accountable: User;
  responsible: User[];
  consulted: User[];
  informed: User[];
}

export interface TaskUpdate {
  id: number;
  date: string;
  content: string;
  user: User;
  mentions: string[]; 
  suggestedStatus?: TaskStatus;
  evidenceBase64?: string;
  evidenceFileName?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  raci: RACIMatrix;
  priority: TaskPriority;
  status: TaskStatus;
  meetingDate: string;
  dueDate: string;
  originalDueDate: string;
  createdAt: string;
  createdBy: User;
  updates: TaskUpdate[];
  requiresEvidence: boolean;
}
