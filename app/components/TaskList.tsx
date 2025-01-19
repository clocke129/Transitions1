import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTaskContext } from '@/app/context/TaskContext';

interface TaskListProps {
  title: string;
  listType: 'queue' | 'today' | 'done';
}

export function TaskList({ title, listType }: TaskListProps) {
  const { tasks } = useTaskContext();
  const filteredTasks = tasks.filter(task => task.list === listType);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <ThemedText>{item.title}</ThemedText>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  taskItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginVertical: 4,
  }
}); 