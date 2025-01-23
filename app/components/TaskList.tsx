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
          {editingTask === task.id ? (
            <TextInput
              style={styles.editInput}
              value={editingTitle}
              onChangeText={setEditingTitle}
              onBlur={() => {
                editTask(task.id, editingTitle);
                setEditingTask(null);
              }}
              autoFocus
            />
          ) : (
            <Pressable 
              style={styles.taskContent}
              onPress={(e) => {
                e.stopPropagation();
                setMenuTask(task.id);
              }}
            >
              <ThemedText style={styles.taskText}>{task.title}</ThemedText>
              <View style={styles.actionButtons}>
                <Pressable 
                  style={[
                    styles.checkbox, 
                    task.completed && styles.checkboxChecked,
                    task.isTrap && styles.trapBox,
                    task.isTrap && task.completed && styles.trapBoxCompleted
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
                  }}>
                  {task.completed && !task.isTrap && <Ionicons name="checkmark" size={16} color="#fff" />}
                  {task.isTrap && <ThemedText style={[styles.trapMinus, task.completed && styles.trapMinusCompleted]}>-</ThemedText>}
                </Pressable>
              </View>
            </Pressable>
          )}

          {menuTask === task.id && (
            <View style={styles.menuOverlay}>
              <View style={styles.menu}>
                <Pressable 
                  style={styles.menuItem}
                  onPress={(e) => {
                    e.stopPropagation();
                    setEditingTitle(task.title);
                    setEditingTask(task.id);
                    setMenuTask(null);
                  }}>
                  <ThemedText>Rename</ThemedText>
                </Pressable>
                <Pressable 
                  style={styles.menuItem}
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                    setMenuTask(null);
                  }}>
                  <ThemedText style={styles.deleteText}>Delete</ThemedText>
                </Pressable>
                <Pressable 
                  style={[styles.menuItem, styles.menuItemLast]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleTrap(task.id);
                  }}>
                  <ThemedText>Convert to {task.isTrap ? 'Normal' : 'Trap'}</ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskText: {
    flex: 1,
    marginRight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#666',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#ff4444',
  },
  trapBox: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
    borderRadius: 50,
  },
  trapBoxCompleted: {
    backgroundColor: '#ff8888',
    borderColor: '#ff8888',
  },
  trapMinus: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
  trapMinusCompleted: {
    color: '#eee',
  }
}); 