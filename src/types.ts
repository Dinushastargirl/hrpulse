import { Timestamp } from 'firebase/firestore';

export type UserRole = 'employee' | 'admin';

export interface UserProfile {
  uid: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  profilePic?: string;
  mustResetPassword?: boolean;
  leaveBalance: number;
  createdAt: Timestamp;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id?: string;
  userId: string;
  userName: string;
  leaveType: string;
  reason: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: LeaveStatus;
  isUrgent?: boolean;
  createdAt: Timestamp;
}

export interface AttendanceRecord {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn: Timestamp;
  checkOut?: Timestamp;
}

export interface Task {
  id?: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp;
}

export interface Holiday {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'public' | 'company';
}
