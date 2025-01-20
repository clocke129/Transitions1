import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Task } from '../types/task';
import { Alert } from 'react-native';

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
  const [currentTransition, setCurrentTransition] = useState<Transition>({
    id: '1',
    number: 1,
    tasks: [],
  });
  const [activeDocRef, setActiveDocRef] = useState<any>(null);

  // Initialize with single document reference
  useEffect(() => {
    const initializeActiveTransition = async () => {
      try {
        const activeRef = collection(db, 'activeTransition');
        const snapshot = await getDocs(activeRef);
        
        if (snapshot.empty) {
          // Create initial active transition
          const newDoc = await addDoc(activeRef, {
            number: 1,
            tasks: [],
            startTime: new Date(),
          });
          setActiveDocRef(newDoc);
          setCurrentTransition({
            id: newDoc.id,
            number: 1,
            tasks: [],
            startTime: new Date(),
          });
        } else {
          // Load existing active transition
          const doc = snapshot.docs[0];
          setActiveDocRef(doc.ref);
          const data = doc.data();
          setCurrentTransition({
            id: doc.id,
            number: data.number,
            tasks: data.tasks || [],
            startTime: data.startTime?.toDate(),
          });
        }
      } catch (error) {
        console.error('Error initializing active transition:', error);
      }
    };

    initializeActiveTransition();
  }, []);

  const addTask = async (title: string, isTrap: boolean = false) => {
    if (!activeDocRef) return;

    try {
      const newTask = {
        id: Date.now().toString(),
        title,
        completed: false,
        isTrap,
        createdAt: new Date(),
      };

      const updatedTasks = [...currentTransition.tasks, newTask]
        .sort((a, b) => a.isTrap === b.isTrap ? 0 : a.isTrap ? 1 : -1);

      // Single update operation
      await updateDoc(activeDocRef, {
        tasks: updatedTasks
      });

      setCurrentTransition(prev => ({
        ...prev,
        tasks: updatedTasks,
      }));
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!activeDocRef) return;

    try {
      const updatedTasks = currentTransition.tasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date() : undefined }
          : task
      );

      await updateDoc(activeDocRef, {
        tasks: updatedTasks
      });

      setCurrentTransition(prev => ({
        ...prev,
        tasks: updatedTasks,
      }));
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const toggleTrap = async (taskId: string) => {
    if (!activeDocRef) return;

    try {
      const updatedTasks = currentTransition.tasks.map(task => 
        task.id === taskId 
          ? { ...task, isTrap: !task.isTrap }
          : task
      ).sort((a, b) => (a.isTrap === b.isTrap ? 0 : a.isTrap ? 1 : -1));

      await updateDoc(activeDocRef, {
        tasks: updatedTasks
      });

      setCurrentTransition(prev => ({
        ...prev,
        tasks: updatedTasks,
      }));
    } catch (error) {
      console.error('Error toggling trap:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const archiveTransition = async (elapsedTime: number) => {
    if (!activeDocRef) {
      console.error('No active document reference');
      return;
    }

    try {
      // 1. Archive current transition
      const archiveData = {
        number: currentTransition.number,
        tasks: currentTransition.tasks,
        elapsedTime,
        completedAt: new Date(),
        startTime: currentTransition.startTime,
      };

      // Simple addDoc to archivedTransitions
      const archivedTransitionsRef = collection(db, 'archivedTransitions');
      const archiveDoc = await addDoc(archivedTransitionsRef, archiveData);
      console.log('Archived transition with ID:', archiveDoc.id);

      // 2. Create new transition
      const newNumber = currentTransition.number + 1;
      const newTransition = {
        number: newNumber,
        tasks: [],
        startTime: new Date(),
      };

      // 3. Update active transition
      await updateDoc(activeDocRef, newTransition);

      // 4. Update local state
      setCurrentTransition({
        id: activeDocRef.id,
        ...newTransition,
      });

    } catch (error) {
      console.error('Error archiving transition:', error);
      Alert.alert('Error', 'Failed to archive transition');
    }
  };

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