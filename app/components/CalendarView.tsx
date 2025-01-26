import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  duration: number;
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    isTrap: boolean;
  }>;
}

const HOUR_HEIGHT = 60;
const MIN_EVENT_HEIGHT = 40;
const TIME_LABELS_WIDTH = 50;

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  const renderTimeLabels = () => {
    const labels = [];
    for (let hour = 5; hour <= 24; hour++) {
      const displayHour = hour <= 12 ? hour : hour - 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      labels.push(
        <View key={hour} style={styles.timeSlot}>
          <ThemedText style={styles.timeLabel}>
            {`${displayHour}${ampm}`}
          </ThemedText>
        </View>
      );
    }
    return labels;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.calendarContainer}>
        <View style={styles.timeLabelColumn}>
          {renderTimeLabels()}
        </View>
        <View style={styles.eventsContainer}>
          {/* Events will be rendered here */}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  timeLabelColumn: {
    width: TIME_LABELS_WIDTH,
    backgroundColor: '#f5f5f5',
  },
  timeSlot: {
    height: HOUR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 