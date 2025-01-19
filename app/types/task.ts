export interface Task {
  id: string;
  title: string;
  list: 'queue' | 'today' | 'done';
  createdAt: Date;
  completedAt?: Date;
} 