import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  isTrap: boolean;
}

interface Transition {
  id: string;
  number: number;
  title?: string;
  tasks: Task[];
  startTime?: Date;
}

interface TaskContextType {
  currentTransition: Transition;
  tasks: Task[];
  addTask: (title: string, isTrap: boolean) => void;
  toggleTask: (taskId: string) => void;
  toggleTrap: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  editTask: (taskId: string, newTitle: string) => void;
  archiveTransition: (elapsedTime: number, title: string) => Promise<void>;
  updateTransitionTitle: (newTitle: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [currentTransition, setCurrentTransition] = useState<Transition>({
    id: Date.now().toString(),
    number: 1,
    title: 'Transition 1',
    tasks: [],
    startTime: new Date()
  });

  useEffect(() => {
    const fetchCurrentTransition = async () => {
      try {
        const transitionRef = doc(db, 'activeTransition', 'current');
        const transitionDoc = await getDoc(transitionRef);
        
        if (transitionDoc.exists()) {
          const data = transitionDoc.data();
          // Ensure each task has the correct structure
          const tasks = data.tasks.map((task: any) => ({
            id: task.id,
            title: task.title,
            completed: !!task.completed,
            isTrap: !!task.isTrap
          }));
          
          setCurrentTransition({
            ...data,
            tasks
          } as Transition);
        } else {
          const initialTransition = {
            id: Date.now().toString(),
            number: 1,
            title: 'Transition 1',
            tasks: [],
            startTime: new Date()
          };
          await setDoc(transitionRef, initialTransition);
          setCurrentTransition(initialTransition);
        }
      } catch (error) {
        console.error('Error fetching current transition:', error);
      }
    };

    fetchCurrentTransition();
  }, []);

  const updateFirebaseTransition = async (transition: Transition) => {
    try {
      const transitionRef = doc(db, 'activeTransition', 'current');
      await setDoc(transitionRef, transition);
    } catch (error) {
      console.error('Error updating transition in Firebase:', error);
    }
  };

  const addTask = async (title: string, isTrap: boolean = false) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      isTrap: isTrap
    };
    setCurrentTransition(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
    await updateFirebaseTransition(currentTransition);
  };

  const toggleTask = async (taskId: string) => {
    const updatedTransition = {
      ...currentTransition,
      tasks: currentTransition.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    };

    setCurrentTransition(updatedTransition);
    await updateFirebaseTransition(updatedTransition);
  };

  const toggleTrap = async (taskId: string) => {
    try {
      const task = currentTransition.tasks.find(t => t.id === taskId);
      if (!task) return;

      // Create a new task object with explicit boolean
      const updatedTask = {
        ...task,
        isTrap: task.isTrap === true ? false : true
      };

      const updatedTransition = {
        ...currentTransition,
        tasks: currentTransition.tasks.map(t =>
          t.id === taskId ? updatedTask : t
        )
      };

      // Update local state
      setCurrentTransition(updatedTransition);
      
      // Update Firebase with explicit data structure
      await setDoc(doc(db, 'activeTransition', 'current'), {
        ...updatedTransition,
        tasks: updatedTransition.tasks.map(t => ({
          id: t.id,
          title: t.title,
          completed: !!t.completed,
          isTrap: !!t.isTrap
        }))
      });
    } catch (error) {
      console.error('Error toggling trap:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    const updatedTransition = {
      ...currentTransition,
      tasks: currentTransition.tasks.filter(task => task.id !== taskId)
    };

    setCurrentTransition(updatedTransition);
    await updateFirebaseTransition(updatedTransition);
  };

  const editTask = async (taskId: string, newTitle: string) => {
    const updatedTransition = {
      ...currentTransition,
      tasks: currentTransition.tasks.map(task =>
        task.id === taskId ? { ...task, title: newTitle } : task
      )
    };

    setCurrentTransition(updatedTransition);
    await updateFirebaseTransition(updatedTransition);
  };

  const archiveTransition = async (elapsedTime: number, title: string) => {
    try {
      // Get the actual current time
      const now = new Date();
      console.log('Current time:', now.toLocaleString());

      const archiveDoc = {
        number: currentTransition.number,
        title: title || `Transition ${currentTransition.number}`,
        tasks: currentTransition.tasks.map(task => ({
          id: task.id,
          title: task.title,
          completed: !!task.completed,
          isTrap: !!task.isTrap
        })),
        startTime: serverTimestamp(), // Use serverTimestamp for consistent timing
        elapsedTime: Number(elapsedTime) || 0,
        createdAt: serverTimestamp(), // Add this for debugging
      };

      // Log the document we're trying to save
      console.log('Archiving document:', archiveDoc);

      // Try to save and immediately verify
      const docRef = await addDoc(collection(db, 'archivedTransitions'), archiveDoc);
      const savedDoc = await getDoc(docRef);
      
      if (savedDoc.exists()) {
        console.log('Verified saved document:', savedDoc.data());
      } else {
        console.error('Document not found after saving');
      }

      // Create new transition
      const newTransition = {
        id: Date.now().toString(),
        number: currentTransition.number + 1,
        title: `Transition ${currentTransition.number + 1}`,
        tasks: [],
        startTime: serverTimestamp()
      };

      await setDoc(doc(db, 'activeTransition', 'current'), newTransition);
      setCurrentTransition(newTransition);
    } catch (error) {
      console.error('Error archiving transition:', error);
    }
  };

  const updateTransitionTitle = async (newTitle: string) => {
    try {
      const updatedTransition = {
        ...currentTransition,
        title: newTitle || `Transition ${currentTransition.number}`
      };
      
      setCurrentTransition(updatedTransition);
      await updateFirebaseTransition(updatedTransition);
    } catch (error) {
      console.error('Error updating transition title:', error);
    }
  };

  return (
    <TaskContext.Provider value={{ 
      currentTransition, 
      tasks: currentTransition.tasks,
      addTask, 
      toggleTask, 
      toggleTrap,
      deleteTask,
      editTask,
      archiveTransition,
      updateTransitionTitle
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