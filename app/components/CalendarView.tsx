import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { format, startOfDay, endOfDay } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  duration: number; // in seconds
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    isTrap: boolean;
  }>;
}

const TIME_SLOTS = [
  '12 AM', '2 AM', '4 AM', '6 AM', '8 AM', '10 AM', 
  '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'
];

const BLOCK_HEIGHT = 80;

export function CalendarView({ selectedDate }: { selectedDate: Date }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const getTimeSlot = (date: Date) => {
    const hour = date.getHours();
    // Return actual hour instead of forcing into 6 AM or 2 AM slots
    return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
  };

  const renderEvent = (event: CalendarEvent) => {
    const formattedDuration = new Date(event.duration * 1000)
      .toISOString()
      .substr(11, 8);

    return (
      <View key={event.id} style={styles.event}>
        <ThemedText style={styles.eventTitle}>
          {event.title} ({formattedDuration})
        </ThemedText>
        <ThemedText style={styles.eventTime}>
          {format(event.startTime, 'h:mm a')}
        </ThemedText>
      </View>
    );
  };

  const fetchTransitions = async () => {
    try {
      // Use local timezone dates
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      console.log('Fetching transitions for:', {
        start: dayStart.toLocaleString(),
        end: dayEnd.toLocaleString()
      });

      const transitionsRef = collection(db, 'archivedTransitions');
      const q = query(
        transitionsRef,
        where('startTime', '>=', dayStart),
        where('startTime', '<=', dayEnd),
        orderBy('startTime', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const transitionEvents: CalendarEvent[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const startTime = data.startTime?.toDate();
        
        if (startTime) {
          console.log('Event time:', {
            title: data.title,
            time: startTime.toLocaleString(),
            hour: startTime.getHours()
          });

          transitionEvents.push({
            id: doc.id,
            title: data.title || `Transition ${data.number}`,
            startTime,
            duration: Number(data.elapsedTime) || 0,
            tasks: Array.isArray(data.tasks) ? data.tasks : []
          });
        }
      });

      setEvents(transitionEvents);
    } catch (error) {
      console.error('Error fetching transitions:', error);
    }
  };

  const getEventsForTimeSlot = (slotIndex: number) => {
    const slotStart = slotIndex * 2;
    const slotEnd = slotStart + 2;
    
    return events.filter(event => {
      const hour = event.startTime.getHours();
      return hour >= slotStart && hour < slotEnd;
    });
  };

  useEffect(() => {
    fetchTransitions();
  }, [selectedDate]);

  return (
    <>
      <ScrollView style={styles.container}>
        {TIME_SLOTS.map((timeSlot, index) => (
          <View key={timeSlot} style={styles.timeSlot}>
            <View style={styles.timeLabel}>
              <ThemedText style={styles.timeLabelText}>{timeSlot}</ThemedText>
            </View>
            <View style={styles.eventContainer}>
              {getEventsForTimeSlot(index).map(event => (
                <Pressable
                  key={event.id}
                  style={styles.event}
                  onPress={() => setSelectedEvent(event)}
                >
                  {renderEvent(event)}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={!!selectedEvent}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              {selectedEvent?.title}
            </ThemedText>
            <ThemedText style={styles.modalTime}>
              {selectedEvent && `Duration: ${new Date(selectedEvent.duration * 1000).toISOString().substr(11, 8)}`}
            </ThemedText>
            <ScrollView style={styles.taskList}>
              {selectedEvent?.tasks.map(task => (
                <View key={task.id} style={styles.taskItem}>
                  <ThemedText style={[styles.taskTitle, task.completed && styles.completedTask]}>
                    {task.title}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
            <Pressable 
              style={styles.closeButton}
              onPress={() => setSelectedEvent(null)}
            >
              <ThemedText>Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: BLOCK_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeLabel: {
    width: 60,
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingLeft: 8,
    backgroundColor: '#f5f5f5',
  },
  timeLabelText: {
    fontSize: 12,
    color: '#666',
  },
  eventContainer: {
    flex: 1,
    padding: 4,
    gap: 4,
  },
  event: {
    backgroundColor: '#0a7ea4',
    borderRadius: 4,
    padding: 8,
    minHeight: 40,
  },
  eventTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventTime: {
    color: '#666',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalTime: {
    color: '#666',
    marginBottom: 16,
  },
  taskList: {
    maxHeight: 300,
  },
  taskItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskTitle: {
    fontSize: 14,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  closeButton: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    alignItems: 'center',
  },
}); 