import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTaskContext } from '@/app/context/TaskContext';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export function TaskList() {
  const { tasks, toggleTask, toggleTrap, deleteTask, editTask } = useTaskContext();
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [menuTask, setMenuTask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.isTrap === b.isTrap ? 0 : a.isTrap ? 1 : -1));
  }, [tasks]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleClickOutside = () => {
        setSelectedTask(null);
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, []);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedTask ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [selectedTask]);

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleTrap = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      await toggleTrap(taskId);
      setMenuTask(null);
    } catch (error) {
      console.error('Error toggling trap:', error);
    }
  };

  const handleEdit = (taskId: string, newTitle: string) => {
    editTask(taskId, newTitle);
    setEditingTask(null);
  };

  return (
    <View style={styles.container}>
      {sortedTasks.map((task) => (
        <View 
          key={task.id} 
          style={[
            styles.taskItem,
            selectedTask === task.id && styles.selectedRow
          ]}
        >
          <View style={styles.taskContent}>
            <Pressable 
              style={styles.checkbox} 
              onPress={() => toggleTask(task.id)}
            >
              {task.completed ? (
                <Ionicons 
                  name={task.isTrap ? "remove-circle" : "checkmark-circle"} 
                  size={24} 
                  color={task.isTrap ? "#ff4444" : "#0a7ea4"} 
                />
              ) : (
                <Ionicons 
                  name={task.isTrap ? "remove-circle-outline" : "ellipse-outline"} 
                  size={24} 
                  color="#666" 
                />
              )}
            </Pressable>
            <Pressable
              style={styles.taskTextContainer}
              onPress={() => setSelectedTask(task.id === selectedTask ? null : task.id)}
            >
              <ThemedText style={styles.taskText}>
                {task.title}
              </ThemedText>
              {selectedTask === task.id && (
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
                      setEditingTitle(task.title);
                      setEditingTask(task.id);
                    }}
                  >
                    <Ionicons name="pencil-outline" size={20} color="#666" />
                  </Pressable>
                  <Pressable 
                    style={styles.iconButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleTrap(task.id);
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
                      handleDelete(task.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </Pressable>
                </Animated.View>
              )}
            </Pressable>
          </View>
        </View>
      ))}
      
      {menuTask && (
        <Pressable
          style={[
            styles.menuOverlay,
            {
              top: tasks.findIndex(t => t.id === menuTask) * 45 + 45, // Approximate task height
              right: 12,
            }
          ]}
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
                setEditingTitle(tasks.find(t => t.id === menuTask)?.title || '');
                setEditingTask(menuTask);
                setMenuTask(null);
              }}
            >
              <ThemedText>Rename</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.menuItem}
              onPress={(e) => {
                e.stopPropagation();
                handleToggleTrap(menuTask);
                setMenuTask(null);
              }}
            >
              <ThemedText>Convert to {tasks.find(t => t.id === menuTask)?.isTrap ? 'Normal' : 'Trap'}</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.menuItem}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(menuTask);
                setMenuTask(null);
              }}
            >
              <ThemedText style={styles.deleteText}>Delete</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  taskItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  taskTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    gap: 16,
  },
  taskText: {
    fontSize: 16,
  },
  trapText: {
    color: '#ff4444',
  },
  menuButton: {
    padding: 8,
  },
  menuOverlay: {
    position: 'absolute',
    zIndex: 1000,
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
  },
  menu: {
    minWidth: 150,
    backgroundColor: 'white',
  },
  menuItem: {
    padding: 12,
  },
  deleteText: {
    color: '#ff4444',
  },
  editInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  checkbox: {
    padding: 8,
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
  selectedRow: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
}); 