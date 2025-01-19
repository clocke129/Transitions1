import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTaskContext } from '@/app/context/TaskContext';

export default function TransitionsScreen() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { addTask } = useTaskContext();
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Current Transition</ThemedText>
        <ThemedText type="subtitle">00:00</ThemedText>
      </View>

      <View style={styles.card}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Add a task to this transition..."
          />
          <Pressable 
            style={styles.addButton}
            onPress={() => {
              if (newTaskTitle.trim()) {
                addTask(newTaskTitle.trim(), 'today');
                setNewTaskTitle('');
              }
            }}
          >
            <ThemedText style={styles.buttonText}>Add</ThemedText>
          </Pressable>
        </View>

        <View style={styles.taskList}>
          {/* Tasks will be rendered here */}
        </View>

        <View style={styles.cardActions}>
          <Pressable 
            style={[styles.actionButton, !isTimerRunning ? styles.startButton : styles.stopButton]}
            onPress={() => setIsTimerRunning(!isTimerRunning)}
          >
            <ThemedText style={styles.buttonText}>
              {isTimerRunning ? 'Finish' : 'Start'}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.predefinedTasks}>
        <ThemedText type="subtitle">Quick Add</ThemedText>
        {/* Predefined tasks will be rendered here */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
    gap: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: 'bold',
  },
  taskList: {
    marginBottom: 16,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  predefinedTasks: {
    marginTop: 24,
  },
});
