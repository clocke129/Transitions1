import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTaskContext } from '@/app/context/TaskContext';
import { TaskList } from '../components/TaskList';

export default function TransitionsScreen() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { addTask, currentTransition, archiveTransition } = useTaskContext();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      await archiveTransition(elapsedTime);
      setElapsedTime(0);
      setNewTaskTitle('');
    } else {
      setIsTimerRunning(true);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <ThemedText type="title">Transition {currentTransition.number}</ThemedText>
        </View>

        <TaskList />

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
                addTask(newTaskTitle.trim());
                setNewTaskTitle('');
              }
            }}
          >
            <ThemedText style={styles.buttonText}>Add</ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ThemedText style={styles.timer}>{formatTime(elapsedTime)}</ThemedText>
        <Pressable 
          style={[styles.actionButton, !isTimerRunning ? styles.startButton : styles.stopButton]}
          onPress={handleFinish}
        >
          <ThemedText style={styles.buttonText}>
            {isTimerRunning ? 'Finish' : 'Start'}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.predefinedTasks}>
        <ThemedText type="subtitle">Quick Add</ThemedText>
        {/* Predefined tasks will be rendered here */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
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
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  predefinedTasks: {
    marginTop: 24,
  },
});
