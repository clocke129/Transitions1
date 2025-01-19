import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Task } from '../types/task';

interface Transition {
  id: string;
  number: number;
  tasks: Task[];
  startTime?: Date;
}

interface TaskContextType {
  currentTransition: Transition;
  tasks: Task[];
  addTask: (title: string) => void;
  toggleTask: (taskId: string) => void;
  toggleTrap: (taskId: string) => void;
  archiveTransition: (elapsedTime: number) => Promise<void>;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [transitionCount, setTransitionCount] = useState(1);
  const [currentTransition, setCurrentTransition] = useState<Transition>({
    id: '1',
    number: 1,
    tasks: [],
  });

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
          completed: data.completed || false,
          isTrap: data.isTrap || false,
          createdAt: data.createdAt.toDate(),
          completedAt: data.completedAt ? data.completedAt.toDate() : undefined,
        });
      });
      setCurrentTransition(prev => ({
        ...prev,
        tasks: fetchedTasks,
      }));
    };

    fetchTasks();
  }, []);

  const addTask = async (title: string) => {
    try {
      const newTask: Task = {
        id: Date.now().toString(),
        title,
        completed: false,
        isTrap: false,
        createdAt: new Date(),
      };

      // Add to Firestore first
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...newTask,
        transitionNumber: currentTransition.number,
      });

      // Then update local state
      setCurrentTransition(prev => ({
        ...prev,
        tasks: [...prev.tasks, { ...newTask, id: docRef.id }],
      }));
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = (taskId: string) => {
    setCurrentTransition(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const toggleTrap = (taskId: string) => {
    setCurrentTransition(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, isTrap: !task.isTrap } : task
      ).sort((a, b) => (a.isTrap === b.isTrap ? 0 : a.isTrap ? 1 : -1)),
    }));
  };

  const archiveTransition = async (elapsedTime: number) => {
    try {
      const completedTasks = currentTransition.tasks.filter(task => task.completed);
      const traps = completedTasks.filter(task => task.isTrap);
      
      // Archive the transition
      await addDoc(collection(db, 'archivedTransitions'), {
        number: currentTransition.number,
        completedTasks: completedTasks.map(task => ({
          title: task.title,
          isTrap: task.isTrap,
        })),
        elapsedTime,
        timestamp: new Date(),
        trapCount: traps.length,
      });

      // Create new transition
      const newNumber = transitionCount + 1;
      setTransitionCount(newNumber);
      setCurrentTransition({
        id: newNumber.toString(),
        number: newNumber,
        tasks: [],
      });
    } catch (error) {
      console.error('Error archiving transition:', error);
    }
  };

  // Add useEffect to fetch tasks for the current transition
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const q = query(
          collection(db, 'tasks'),
          where('transitionNumber', '==', currentTransition.number),
          orderBy('createdAt')
        );
        const querySnapshot = await getDocs(q);
        const fetchedTasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTasks.push({
            id: doc.id,
            title: data.title,
            completed: data.completed,
            isTrap: data.isTrap,
            createdAt: data.createdAt.toDate(),
          });
        });
        setCurrentTransition(prev => ({
          ...prev,
          tasks: fetchedTasks,
        }));
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [currentTransition.number]);

  return (
    <TaskContext.Provider value={{
      currentTransition,
      tasks: currentTransition.tasks,
      addTask,
      toggleTask,
      toggleTrap,
      archiveTransition,
    }}>
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