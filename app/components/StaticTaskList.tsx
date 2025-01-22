import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Task } from '@/app/context/TaskContext';
import { Transition } from '../context/TransitionContext';

interface StaticTask {
  id: string;
  title: string;
  isTrap: boolean;
}

interface Template {
  id: string;
  title: string;
  tasks: Task[];
  createdAt: Date;
}

interface Props {
  onAddToTransition: (task: StaticTask) => void;
  currentTransition: Transition;
}

export function StaticTaskList({ onAddToTransition, currentTransition }: Props) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [staticTasks, setStaticTasks] = useState<StaticTask[]>([]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetchStaticTasks();
    fetchTemplates();
  }, []);

  const fetchStaticTasks = async () => {
    try {
      const q = query(collection(db, 'staticTasks'));
      const querySnapshot = await getDocs(q);
      const tasks: StaticTask[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as StaticTask);
      });
      setStaticTasks(tasks.sort((a, b) => (a.isTrap === b.isTrap ? 0 : a.isTrap ? 1 : -1)));
    } catch (error) {
      console.error('Error fetching static tasks:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const q = query(collection(db, 'staticTemplates'));
      const querySnapshot = await getDocs(q);
      const loadedTemplates: Template[] = [];
      querySnapshot.forEach((doc) => {
        loadedTemplates.push({ id: doc.id, ...doc.data() } as Template);
      });
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const addStaticTask = async () => {
    if (newTaskTitle.trim()) {
      try {
        const docRef = await addDoc(collection(db, 'staticTasks'), {
          title: newTaskTitle.trim(),
          isTrap: false,
          createdAt: new Date(),
        });
        
        const newTask = {
          id: docRef.id,
          title: newTaskTitle.trim(),
          isTrap: false,
        };
        
        setStaticTasks([newTask, ...staticTasks]);
        setNewTaskTitle('');
      } catch (error) {
        console.error('Error adding static task:', error);
      }
    }
  };

  const toggleTrap = async (taskId: string) => {
    try {
      const task = staticTasks.find(t => t.id === taskId);
      if (!task) return;

      await updateDoc(doc(db, 'staticTasks', taskId), {
        isTrap: !task.isTrap,
      });

      setStaticTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, isTrap: !t.isTrap } : t)
           .sort((a, b) => (a.isTrap === b.isTrap ? 0 : a.isTrap ? 1 : -1))
      );
    } catch (error) {
      console.error('Error toggling trap:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'staticTasks', taskId));
      setStaticTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const editTask = async (taskId: string, newTitle: string) => {
    try {
      await updateDoc(doc(db, 'staticTasks', taskId), {
        title: newTitle,
      });
      setStaticTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, title: newTitle } : t)
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Error editing task:', error);
    }
  };

  const addTemplate = async () => {
    try {
      const templateData = {
        title: currentTransition.title || `Transition ${currentTransition.number}`,
        tasks: currentTransition.tasks.map(task => ({
          id: task.id,
          title: task.title,
          completed: task.completed,
          isTrap: task.isTrap
        })),
        createdAt: new Date()  // Let Firestore handle the timestamp conversion
      };
      
      console.log('Template data:', templateData);
      const docRef = await addDoc(collection(db, 'staticTemplates'), templateData);
      console.log('Template added with ID: ', docRef.id);
      
      Alert.alert('Success', 'Template saved successfully!');
    } catch (error) {
      console.error('Error adding template:', error);
      Alert.alert('Error', 'Failed to save template');
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Quick Add</ThemedText>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          placeholder="Add to quick list..."
        />
        <Pressable style={styles.addButton} onPress={addStaticTask}>
          <ThemedText style={styles.buttonText}>Add</ThemedText>
        </Pressable>
      </View>

      {staticTasks.map((task) => (
        <View key={task.id} style={styles.taskItem}>
          {editingTask === task.id ? (
            <TextInput
              style={styles.editInput}
              value={task.title}
              onChangeText={(newTitle) => {
                setStaticTasks(prev =>
                  prev.map(t => t.id === task.id ? { ...t, title: newTitle } : t)
                );
              }}
              onBlur={() => editTask(task.id, task.title)}
              autoFocus
            />
          ) : (
            <ThemedText style={styles.taskText}>{task.title}</ThemedText>
          )}
          
          <View style={styles.actionButtons}>
            <Pressable
              style={styles.iconButton}
              onPress={() => toggleTrap(task.id)}>
              <Ionicons 
                name="skull-outline" 
                size={20} 
                color={task.isTrap ? '#000' : '#ccc'} 
              />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => setEditingTask(task.id)}>
              <Ionicons name="pencil" size={20} color="#666" />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => {
                Alert.alert(
                  'Delete Task',
                  'Are you sure you want to delete this task?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', onPress: () => deleteTask(task.id), style: 'destructive' }
                  ]
                );
              }}>
              <Ionicons name="trash" size={20} color="#ff4444" />
            </Pressable>
            <Pressable
              style={styles.addToTransitionButton}
              onPress={() => onAddToTransition(task)}>
              <Ionicons name="add-circle" size={24} color="#0a7ea4" />
            </Pressable>
          </View>
        </View>
      ))}

      {/* Templates Section */}
      <View style={styles.templatesSection}>
        <ThemedText style={styles.title}>Templates</ThemedText>
        <Pressable 
          style={styles.addTemplateButton}
          onPress={() => {
            console.log('Button pressed'); // Debug log
            addTemplate();
          }}
        >
          <ThemedText style={styles.buttonText}>Add Template</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '30%',
    minWidth: 200,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
  },
  addToTransitionButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 4,
    marginRight: 8,
  },
  templatesSection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  addTemplateButton: {
    backgroundColor: '#0a7ea4',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});