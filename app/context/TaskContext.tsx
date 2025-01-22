import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
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
  archiveTransition: (elapsedTime: number) => Promise<void>;
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
          setCurrentTransition(transitionDoc.data() as Transition);
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
      id: Date.now().toString(),
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
    const updatedTransition = {
      ...currentTransition,
      tasks: currentTransition.tasks.map(task =>
        task.id === taskId ? { ...task, isTrap: !task.isTrap } : task
      )
    };

    setCurrentTransition(updatedTransition);
    await updateFirebaseTransition(updatedTransition);
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

  const archiveTransition = async (elapsedTime: number) => {
    try {
      const archiveData = {
        id: currentTransition.id,
        number: currentTransition.number,
        tasks: currentTransition.tasks,
        startTime: currentTransition.startTime,
        completedAt: new Date(),
        elapsedTime
      };
      
      await addDoc(collection(db, 'archivedTransitions'), archiveData);
      
      const newTransition = {
        id: Date.now().toString(),
        number: currentTransition.number + 1,
        tasks: [],
        startTime: new Date()
      };

      const activeTransitionRef = doc(db, 'activeTransition', 'current');
      await setDoc(activeTransitionRef, newTransition);
      
      setCurrentTransition(newTransition);
    } catch (error) {
      console.error('Error archiving transition:', error);
      Alert.alert('Error', 'Failed to archive transition');
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