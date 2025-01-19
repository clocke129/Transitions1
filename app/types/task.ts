export interface Task {
  id: string;
  title: string;
  completed: boolean;
  isTrap: boolean;
  createdAt: Date;
  completedAt?: Date;
}