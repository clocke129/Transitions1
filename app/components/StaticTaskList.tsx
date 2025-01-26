import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, Animated, ScrollView, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
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

const TaskRow = ({ 
  task, 
  onAddToTransition, 
  onEdit, 
  onToggleTrap, 
  onDelete 
}: {
  task: any;
  onAddToTransition: (task: any) => void;
  onEdit: (id: string, title: string | null) => void;
  onToggleTrap: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [selectedTask, setSelectedTask] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedTask ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [selectedTask]);

  return (
    <Pressable
      style={[styles.taskRow, selectedTask && styles.selectedRow]}
      onPress={() => setSelectedTask(!selectedTask)}
    >
      <View style={styles.taskContent}>
        <Pressable
          style={styles.addToTransitionButton}
          onPress={(e) => {
            e.stopPropagation();
            onAddToTransition(task);
          }}
        >
          <Ionicons 
            name={task.isTrap ? "remove-circle-outline" : "add-circle-outline"}
            size={24} 
            color="#0a7ea4" 
          />
        </Pressable>
        <ThemedText style={styles.taskText}>{task.title}</ThemedText>
      </View>
      {selectedTask && (
        <Animated.View
          style={[
            styles.actionIcons,
            {
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                })
              }],
              opacity: slideAnim
            }
          ]}
        >
          <Pressable 
            style={styles.iconButton}
            onPress={(e) => {
              e.stopPropagation();
              onEdit(task.id, task.title);
            }}
          >
            <Ionicons name="pencil-outline" size={20} color="#666" />
          </Pressable>
          <Pressable 
            style={styles.iconButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleTrap(task.id);
            }}
          >
            <Ionicons 
              name={task.isTrap ? "remove-circle-outline" : "checkmark-circle-outline"} 
              size={20} 
              color="#666" 
            />
          </Pressable>
          <Pressable 
            style={styles.iconButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#666" />
          </Pressable>
        </Animated.View>
      )}
    </Pressable>
  );
};

const TemplateRow = ({ 
  template, 
  onPress, 
  onDelete, 
  onEdit,
  selectedTemplate,
  setSelectedTemplate 
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedTemplate === template.id ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [selectedTemplate]);

  return (
    <View 
      style={[
        styles.taskItem,
        selectedTemplate === template.id && styles.selectedRow
      ]}
    >
      <View style={styles.taskContent}>
        <Pressable
          style={styles.circleIconContainer}
          onPress={onPress}
        >
          <Ionicons 
            name="add-circle-outline"
            size={24} 
            color="#0a7ea4" 
          />
        </Pressable>
        <Pressable
          style={styles.taskTextContainer}
          onPress={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
        >
          <ThemedText style={styles.taskText}>
            {template.title}
          </ThemedText>
          {selectedTemplate === template.id && (
            <Animated.View
              style={[
                styles.actionIcons,
                {
                  transform: [{
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    })
                  }],
                  opacity: slideAnim
                }
              ]}
            >
              <Pressable 
                style={styles.iconButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit(template.id, template.title);
                }}
              >
                <Ionicons name="pencil-outline" size={20} color="#666" />
              </Pressable>
              <Pressable 
                style={styles.iconButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete(template.id);
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#666" />
              </Pressable>
            </Animated.View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export function StaticTaskList({ onAddToTransition, currentTransition, updateTransitionTitle }: Props) {
  const [staticTasks, setStaticTasks] = useState<StaticTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [menuTask, setMenuTask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editingTemplateTitle, setEditingTemplateTitle] = useState('');

  const icons = {
    edit: "pencil",           // or "pencil-outline"
    delete: "trash-bin",      // or "trash-bin-outline"
    normalTask: "checkmark-circle-outline",
    trapTask: "remove-circle-outline"
  }

  const windowWidth = Dimensions.get('window').width;
  const isMobileWidth = windowWidth < 768;
  
  const sidebarWidth = isMobileWidth 
    ? Math.min(Math.max(300, windowWidth * 0.75), 400)
    : '30%';

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

  const handleEdit = (taskId: string, newTitle: string | null) => {
    setEditingTask(taskId);
    setEditingTitle(newTitle || '');
  };

  const handleToggleTrap = (taskId: string) => {
    toggleTrap(taskId);
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteDoc(doc(db, 'staticTemplates', templateId));
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleEditTemplate = async (templateId: string, newTitle: string) => {
    try {
      await updateDoc(doc(db, 'staticTemplates', templateId), {
        title: newTitle,
      });
      setEditingTemplate(null);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error editing template:', error);
    }
  };

  const handleTestReset = async () => {
    try {
      const transitionRef = doc(db, 'activeTransition', 'current');
      const currentData = (await getDoc(transitionRef)).data();

      if (currentData) {
        // Keep existing tasks but reset transition number
        const updatedTransition = {
          ...currentData,
          number: 1,
          title: 'Transition 1',
          lastResetDate: new Date().toDateString()
        };

        await setDoc(transitionRef, updatedTransition);
        // Force reload the page to reflect changes
        window.location.reload();
      }
    } catch (error) {
      console.error('Error handling test reset:', error);
    }
  };

  return (
    <View style={[
      styles.container,
      { width: sidebarWidth },
      isMobileWidth && styles.mobileContainer
    ]}>
      <View style={styles.innerContainer}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
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
              <TaskRow
                key={task.id}
                task={task}
                onAddToTransition={onAddToTransition}
                onEdit={handleEdit}
                onToggleTrap={handleToggleTrap}
                onDelete={handleDelete}
              />
            ))}

            <ThemedText style={styles.sectionTitle}>Templates</ThemedText>
            
            <Pressable 
              style={styles.addTemplateButton}
              onPress={addTemplate}
            >
              <ThemedText style={styles.addTemplateText}>Add Template</ThemedText>
            </Pressable>

            {templates.map((template) => (
              <TemplateRow
                key={template.id}
                template={template}
                onPress={() => useTemplate(template)}
                onDelete={handleDeleteTemplate}
                onEdit={(id) => {
                  setEditingTemplateTitle(template.title);
                  setEditingTemplate(id);
                }}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
              />
            ))}

            <View style={styles.footer}>
              <Pressable 
                style={styles.resetButton}
                onPress={handleTestReset}
              >
                <ThemedText style={styles.resetButtonText}>Test Reset</ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 400, // Increased fixed width
    minWidth: 400, // Ensure it doesn't shrink
    flexShrink: 0, // Prevent shrinking when space is tight
    height: '100%',
    backgroundColor: '#f5f5f5',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  innerContainer: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  mobileContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
    width: '100%', // Ensure content takes full width
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
    width: '100%', // Ensure full width
  },
  input: {
    flex: 1,
    minWidth: 0, // Allow input to shrink if needed
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
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    flex: 1,
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addToTransitionButton: {
    padding: 8,
  },
  trapAddButton: {
    // Additional styles if needed
  },
  editInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
  },
  templatesSection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  addTemplateButton: {
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  addTemplateText: {
    color: 'white',
    fontWeight: '500',
  },
  buttonText: {
    color: 'white',
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  templateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  circleIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  selectedRow: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 16,
  },
  iconButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  taskTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    gap: 16,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    backgroundColor: '#ff9999',  // Light red to indicate it's for testing
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#555',
    fontWeight: '500',
  },
});