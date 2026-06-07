export interface User {
  id: string;
  name: string;
  role: 'admin' | 'collector';
  email: string;
  phone: string;
}

export interface Box {
  id: string;
  name: string;
  boxNumber: number;
  donorName: string;
  donorPhone: string;
  address: string;
  mapLink?: string;
  qrCodeData: string;
  status: 'active' | 'inactive' | 'maintenance';
  assignedCollectorId?: string;
  createdAt: string;
}

export interface Collector {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  status: 'active' | 'inactive';
  createdAt: string;
  username?: string;
  password?: string;
  firstLogin?: boolean;
}

export interface Collection {
  id: string;
  boxId: string;
  collectorId: string;
  amount: number;
  notes?: string;
  collectionDate: string;
  createdAt: string;
}

export type ScheduleType = 'daily' | 'weekly' | 'monthly';

export interface Assignment {
  id: string;
  collectorId: string;
  boxId: string;
  schedule: ScheduleType;
  scheduleDay?: number; // 0-6 for weekly (Sun-Sat), 1-31 for monthly
  status: 'pending' | 'collected' | 'overdue';
  lastCollected?: string;
  createdAt: string;
}

export type ExpenseType = 'transport' | 'food' | 'phone_balance' | 'other';

export interface Expense {
  id: string;
  collectorId: string;
  type: ExpenseType;
  amount: number;
  description: string;
  date: string;
  receiptUrl?: string;
  createdAt: string;
}

export type IssueType = 'box_damaged' | 'box_stolen' | 'location_changed' | 'box_full' | 'other';
export type IssueStatus = 'reported' | 'under_review' | 'resolved';
export type UrgencyLevel = 'normal' | 'urgent';

export interface Complaint {
  id: string;
  collectorId: string;
  boxId: string;
  issueType: IssueType;
  description: string;
  photoUrl?: string;
  urgency: UrgencyLevel;
  status: IssueStatus;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: 'collection' | 'box_added' | 'collector_added' | 'complaint' | 'assignment';
  description: string;
  timestamp: string;
  relatedId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface TwilioSettings {
  enabled: boolean;
  accountSid: string;
  authToken: string;
  fromNumber: string;
  messageTemplate: string;
  updatedAt?: string;
}

