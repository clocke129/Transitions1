import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTaskContext } from '@/app/context/TaskContext';
import { Ionicons } from '@expo/vector-icons';

export function TaskList() {
  const { tasks, toggleTask, toggleTrap, deleteTask, editTask } = useTaskContext();
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [menuTask, setMenuTask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuTask(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  return (
    <View style={styles.container}>
      {tasks.map((task) => (
        <View key={task.id} style={styles.taskItem}>
          <View style={styles.taskContent}>
            <Pressable 
              style={styles.checkbox} 
              onPress={(e) => {
                e.stopPropagation();
                toggleTask(task.id);
              }}
            >
              {task.completed ? (
                <Ionicons name="checkmark-circle" size={24} color="#0a7ea4" />
              ) : (
                <Ionicons name="ellipse-outline" size={24} color="#666" />
              )}
            </Pressable>
            <View style={styles.taskTextContainer}>
              <ThemedText style={[styles.taskText, task.isTrap && styles.trapText]}>
                {task.title}
              </ThemedText>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setMenuTask(task.id);
                }}
                style={styles.menuButton}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
              </Pressable>
            </View>
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
  },
  taskTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  taskText: {
    fontSize: 16,
  },
  trapText: {
    color: '#ff4444',
  },
  menuButton: {
    padding: 4,
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
    marginRight: 12,
  },
}); 