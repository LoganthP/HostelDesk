export type Role = 'student' | 'warden' | 'maintenance';
export type ComplaintStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Category = 'plumbing' | 'electrical' | 'carpentry' | 'cleaning' | 'wifi' | 'furniture' | 'pest_control' | 'other';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  rollNumber?: string;
  specialization?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface UserLite {
  _id: string;
  name: string;
  email?: string;
  rollNumber?: string;
  phone?: string;
  specialization?: string;
}

export interface RoomLite {
  _id: string;
  block: string;
  floor: number;
  roomNumber: string;
}

export interface Bed {
  label: string;
  occupant: { allocationId: string; startDate: string; student: UserLite } | null;
}

export interface Room extends RoomLite {
  beds: Bed[];
  occupiedCount: number;
}

export interface Allocation {
  _id: string;
  studentId: UserLite;
  roomId: RoomLite;
  bedLabel: string;
  status: 'active' | 'ended';
  startDate: string;
  endDate?: string;
  endReason?: 'transfer' | 'checkout';
}

export interface AvailableBed {
  roomId: string;
  block: string;
  floor: number;
  roomNumber: string;
  bedLabel: string;
}

export interface StudentRow extends User {
  currentAllocation: { _id: string; roomId: RoomLite; bedLabel: string; startDate: string } | null;
}

export interface Technician extends User {
  openJobs: number;
}

export interface ComplaintLocation {
  kind: 'room' | 'shared';
  roomId?: string;
  block: string;
  floor?: number;
  roomNumber?: string;
  bedLabel?: string;
  area?: string;
}

export interface HistoryEntry {
  from: ComplaintStatus | null;
  to: ComplaintStatus;
  action: string;
  note?: string;
  byName?: string;
  byRole?: Role;
  at: string;
}

export interface Note {
  _id: string;
  text: string;
  byName?: string;
  byRole?: Role;
  at: string;
}

export interface Complaint {
  _id: string;
  studentId: UserLite | null;
  location: ComplaintLocation;
  category: Category;
  title: string;
  description: string;
  details?: Record<string, string>;
  priority: Priority;
  status: ComplaintStatus;
  assignedTo?: UserLite | null;
  assignedAt?: string;
  statusHistory?: HistoryEntry[];
  notes?: Note[];
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  rooms: number;
  beds: number;
  occupied: number;
  available: number;
  students: number;
  technicians: number;
  complaints: {
    byStatus: Partial<Record<ComplaintStatus, number>>;
    total: number;
    open: number;
    needsAssignment: number;
    urgentOpen: number;
  };
}
