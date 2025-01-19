import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTaskContext } from '@/app/context/TaskContext';
import { Ionicons } from '@expo/vector-icons';

export function TaskList() {
  const { tasks, toggleTask, toggleTrap, deleteTask, editTask } = useTaskContext();
  const [editingTask, setEditingTask] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {tasks.map((task) => (
        <View key={task.id} style={styles.taskItem}>
          {editingTask === task.id ? (
            <TextInput
              style={styles.editInput}
              value={task.title}
              onChangeText={(newTitle) => editTask(task.id, newTitle)}
              onBlur={() => setEditingTask(null)}
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
              style={[styles.checkbox, task.completed && styles.checkboxChecked]}
              onPress={() => toggleTask(task.id)}>
              {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  taskText: {
    flex: 1,
    fontSize: 16,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0a7ea4',
  },
}); 