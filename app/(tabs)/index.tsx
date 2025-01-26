import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTaskContext } from '@/app/context/TaskContext';
import { TaskList } from '../components/TaskList';
import { StaticTaskList } from '../components/StaticTaskList';
import { Ionicons } from '@expo/vector-icons';

export default function TransitionsScreen() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { addTask, currentTransition, archiveTransition, updateTransitionTitle } = useTaskContext();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showStaticList, setShowStaticList] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

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

  const handleAddFromStatic = (staticTask: { title: string; isTrap: boolean }) => {
    if (staticTask.title) {
      addTask(staticTask.title, staticTask.isTrap);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.toggleButton} 
          onPress={() => setShowStaticList(!showStaticList)}
        >
          <Ionicons 
            name={showStaticList ? "menu" : "menu-outline"} 
            size={24} 
            color="#0a7ea4" 
          />
        </Pressable>
      </View>
      
      <View style={styles.content}>
        {showStaticList && (
          <StaticTaskList 
            onAddToTransition={handleAddFromStatic}
            currentTransition={currentTransition}
            updateTransitionTitle={updateTransitionTitle}
          />
        )}
        <View style={styles.transitionContainer}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                {isEditingTitle ? (
                  <View style={styles.titleEditContainer}>
                    <TextInput
                      style={styles.titleInput}
                      value={editTitle}
                      onChangeText={setEditTitle}
                      onBlur={() => {
                        updateTransitionTitle(editTitle);
                        setIsEditingTitle(false);
                      }}
                      autoFocus
                    />
                  </View>
                ) : (
                  <Pressable 
                    style={styles.titleContainer} 
                    onPress={() => {
                      setEditTitle(currentTransition.title || `Transition ${currentTransition.number}`);
                      setIsEditingTitle(true);
                    }}
                  >
                    <ThemedText type="title">{currentTransition.title || `Transition ${currentTransition.number}`}</ThemedText>
                    <Ionicons name="pencil-outline" size={20} color="#666" />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Add a task to this transition..."
                onSubmitEditing={() => {
                  if (newTaskTitle.trim()) {
                    addTask(newTaskTitle.trim());
                    setNewTaskTitle('');
                  }
                }}
                returnKeyType="enter"
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

            <TaskList />
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
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f5f5f5',
  },
  toggleButton: {
    padding: 12,
    marginRight: 20,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 2,
  },
  transitionContainer: {
    flex: 1,
    padding: 16,
    minWidth: 0,
    overflow: 'auto',
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  titleEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    minWidth: 200,
    backgroundColor: '#fff',
  },
});
