import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Task } from '@/app/context/TaskContext';
import { Transition } from '@/app/context/TransitionContext';

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
  updateTransitionTitle: (title: string) => Promise<void>;
}

export function StaticTaskList({ onAddToTransition, currentTransition, updateTransitionTitle }: Props) {
  const [staticTasks, setStaticTasks] = useState<StaticTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [menuTask, setMenuTask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetchStaticTasks();
  }, []);

  useEffect(() => {
    const templatesRef = collection(db, 'staticTemplates');
    const q = query(templatesRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedTemplates: Template[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedTemplates.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate()
        } as Template);
      });
      setTemplates(loadedTemplates);
    });

    return () => unsubscribe();
  }, []);

  const fetchStaticTasks = async () => {
    try {
      const q = query(collection(db, 'staticTasks'));
      const querySnapshot = await getDocs(q);
      const tasks: StaticTask[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          title: doc.data().title,
          isTrap: !!doc.data().isTrap  // Ensure boolean
        });
      });
      setStaticTasks(tasks.sort((a, b) => (a.isTrap === b.isTrap ? 0 : a.isTrap ? 1 : -1)));
    } catch (error) {
      console.error('Error fetching static tasks:', error);
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
      const taskRef = doc(db, 'staticTasks', taskId);
      const task = staticTasks.find(t => t.id === taskId);
      if (!task) return;

      // Update Firebase first
      await updateDoc(taskRef, {
        isTrap: !task.isTrap,
      });

      // Then update local state without sorting
      setStaticTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, isTrap: !t.isTrap } : t)
      );

      // Close menu
      setMenuTask(null);

      // Finally, fetch and sort tasks
      fetchStaticTasks();
    } catch (error) {
      console.error('Error toggling trap:', error);
      fetchStaticTasks();
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
        tasks: currentTransition.tasks.map((task: Task) => ({
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

  const useTemplate = async (template: Template) => {
    console.log('Using template:', template.title);
    try {
      // Update the title first
      await updateTransitionTitle(template.title);
      console.log('Title updated to:', template.title);
      
      // Then add all tasks with UUID
      template.tasks.forEach(task => {
        onAddToTransition({ 
          id: crypto.randomUUID(),
          title: task.title,
          isTrap: task.isTrap 
        });
      });
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuTask(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Quick Add</ThemedText>
      
      <View style={styles.addContainer}>
        <TextInput
          style={styles.input}
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          placeholder="Add to quick list..."
          onSubmitEditing={addStaticTask}
        />
        <Pressable style={styles.addButton} onPress={addStaticTask}>
          <ThemedText style={styles.addButtonText}>Add</ThemedText>
        </Pressable>
      </View>

      {staticTasks.map((task) => (
        <View key={task.id} style={styles.taskItem}>
          <View style={styles.taskContent}>
            <ThemedText style={[styles.taskText, task.isTrap && styles.trapText]}>
              {task.title}
            </ThemedText>
            <View style={styles.actionButtons}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onAddToTransition(task);
                }}
                style={styles.addToTransitionButton}
              >
                <Ionicons name="add-circle-outline" size={24} color="#0a7ea4" />
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setMenuTask(task.id);
                }}
                style={styles.menuButton}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#666" />
              </Pressable>
            </View>
          </View>
          {menuTask === task.id && (
            <Pressable
              style={styles.menuOverlay}
              onPress={(e) => {
                e.stopPropagation();
                setMenuTask(null);
              }}
            >
              <View style={styles.menu}>
                <Pressable 
                  style={styles.menuItem}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleTrap(task.id);
                    setMenuTask(null);
                  }}
                >
                  <ThemedText>Convert to {task.isTrap ? 'Normal' : 'Trap'}</ThemedText>
                </Pressable>
                <Pressable 
                  style={styles.menuItem}
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                    setMenuTask(null);
                  }}
                >
                  <ThemedText style={styles.deleteText}>Delete</ThemedText>
                </Pressable>
              </View>
            </Pressable>
          )}
        </View>
      ))}

      {/* Templates Section */}
      <View style={styles.templatesSection}>
        <ThemedText style={styles.title}>Templates</ThemedText>
        <Pressable 
          style={styles.addTemplateButton}
          onPress={addTemplate}
        >
          <ThemedText style={styles.buttonText}>Add Template</ThemedText>
        </Pressable>

        {templates.map((template) => (
          <View key={template.id} style={styles.templateRow}>
            <ThemedText style={styles.templateTitle}>{template.title}</ThemedText>
            <Pressable 
              style={styles.iconButton}
              onPress={() => useTemplate(template)}
            >
              <Ionicons name="add-circle" size={24} color="#0a7ea4" />
            </Pressable>
          </View>
        ))}
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
  addContainer: {
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
  addButtonText: {
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
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  addToTransitionButton: {
    padding: 8,
    marginLeft: 8,
  },
  trapAddButton: {
    // Additional styles if needed
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
  buttonText: {
    color: 'white',
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  templateTitle: {
    fontSize: 14,
    flex: 1,
  },
  menuOverlay: {
    position: 'absolute',
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menu: {
    minWidth: 150,
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deleteText: {
    color: '#ff4444',
  },
  menuItemLast: {
    borderBottomWidth: 0, // Remove the last border
  },
  trapText: {
    // Additional styles if needed
  },
  menuButton: {
    // Additional styles if needed
  },
});