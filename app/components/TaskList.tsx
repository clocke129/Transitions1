import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTaskContext } from '@/app/context/TaskContext';
import { Ionicons } from '@expo/vector-icons';

export function TaskList() {
  const { tasks, toggleTask, toggleTrap } = useTaskContext();

  return (
    <View style={styles.container}>
      {tasks.map((task) => (
        <View key={task.id} style={styles.taskItem}>
          <ThemedText style={styles.taskText}>{task.title}</ThemedText>
          <View style={styles.actionContainer}>
            <Pressable
              style={[styles.trapIcon, task.isTrap && styles.trapIconActive]}
              onPress={() => toggleTrap(task.id)}>
              <Ionicons 
                name="skull-outline" 
                size={20} 
                color={task.isTrap ? '#000' : '#ccc'} 
              />
            </Pressable>
            <Pressable 
              style={[styles.checkbox, task.completed && styles.checkboxChecked]}
              onPress={() => toggleTask(task.id)}>
              {task.completed && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
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
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trapIcon: {
    padding: 4,
  },
  trapIconActive: {
    opacity: 1,
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