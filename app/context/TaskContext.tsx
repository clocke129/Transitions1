import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Task } from '@/types/task';

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string, list: 'queue' | 'today') => Promise<void>;
  moveTask: (taskId: string, toList: 'queue' | 'today' | 'done') => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Fetch tasks when component mounts
  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const fetchedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTasks.push({
          id: doc.id,
          title: data.title,
          list: data.list,
          createdAt: data.createdAt.toDate(),
          completedAt: data.completedAt ? data.completedAt.toDate() : undefined,
        });
      });
      setTasks(fetchedTasks);
    };

    fetchTasks();
  }, []);

  const addTask = async (title: string, list: 'queue' | 'today') => {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        title,
        list,
        createdAt: new Date(),
      });

      const newTask: Task = {
        id: docRef.id,
        title,
        list,
        createdAt: new Date(),
      };

      setTasks([...tasks, newTask]);
    } catch (error) {
      console.error('Error adding task: ', error);
    }
  };

  const moveTask = async (taskId: string, toList: 'queue' | 'today' | 'done') => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        list: toList,
        ...(toList === 'done' ? { completedAt: new Date() } : {}),
      });

      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, list: toList, ...(toList === 'done' ? { completedAt: new Date() } : {}) }
          : task
      ));
    } catch (error) {
      console.error('Error moving task: ', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task: ', error);
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, moveTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}; 