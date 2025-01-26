import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { CalendarView } from '../components/CalendarView';

export default function StatisticsScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({
    totalTransitions: 0,
    totalTime: 0,
    trapsRatio: { avoided: 0, total: 0 }
  });
  const [activeView, setActiveView] = useState<'stats' | 'calendar'>('stats');

  const fetchDayStats = async (date: Date) => {
    try {
      // Set time range from 2 AM to 2 AM next day
      const dayStart = new Date(date);
      dayStart.setHours(2, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const transitionsRef = collection(db, 'archivedTransitions');
      const q = query(
        transitionsRef,
        where('startTime', '>=', dayStart),
        where('startTime', '<', dayEnd)
      );

      const querySnapshot = await getDocs(q);
      let transitions = 0;
      let totalSeconds = 0;
      let trapsAvoided = 0;
      let totalTraps = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transitions++;
        
        // Handle the duration properly
        if (data.elapsedTime) {
          totalSeconds += Number(data.elapsedTime);
        } else if (data.duration) {
          totalSeconds += Number(data.duration);
        }
        
        data.tasks?.forEach((task: any) => {
          if (task.isTrap) {
            totalTraps++;
            if (!task.completed) {
              trapsAvoided++;
            }
          }
        });
      });

      console.log('Total seconds:', totalSeconds); // For debugging

      setStats({
        totalTransitions: transitions,
        totalTime: totalSeconds,
        trapsRatio: { avoided: trapsAvoided, total: totalTraps }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchDayStats(selectedDate);
  }, [selectedDate]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateSelector}>
        <Pressable onPress={() => setSelectedDate(prev => subDays(prev, 1))}>
          <Ionicons name="chevron-back" size={24} color="#0a7ea4" />
        </Pressable>
        
        <ThemedText style={styles.dateText}>
          {format(selectedDate, 'EEEE, M/d/yyyy')}
        </ThemedText>
        
        <Pressable onPress={() => setSelectedDate(prev => addDays(prev, 1))}>
          <Ionicons name="chevron-forward" size={24} color="#0a7ea4" />
        </Pressable>
      </View>

      <View style={styles.viewToggle}>
        <Pressable 
          style={[styles.toggleButton, activeView === 'stats' && styles.activeToggle]} 
          onPress={() => setActiveView('stats')}
        >
          <ThemedText style={activeView === 'stats' ? styles.activeText : styles.toggleText}>
            Stats
          </ThemedText>
        </Pressable>
        <Pressable 
          style={[styles.toggleButton, activeView === 'calendar' && styles.activeToggle]}
          onPress={() => setActiveView('calendar')}
        >
          <ThemedText style={activeView === 'calendar' ? styles.activeText : styles.toggleText}>
            Calendar
          </ThemedText>
        </Pressable>
      </View>

      {activeView === 'stats' ? (
        <ScrollView style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText style={styles.label}>Total Transitions</ThemedText>
            <ThemedText style={styles.value}>{stats.totalTransitions}</ThemedText>
          </View>

          <View style={styles.statItem}>
            <ThemedText style={styles.label}>Total Time</ThemedText>
            <ThemedText style={styles.value}>{formatTime(stats.totalTime)}</ThemedText>
          </View>

          <View style={styles.statItem}>
            <ThemedText style={styles.label}>Traps Avoided</ThemedText>
            <ThemedText style={styles.value}>
              {`${stats.trapsRatio.avoided}/${stats.trapsRatio.total} (${
                stats.trapsRatio.total === 0 
                  ? '0' 
                  : Math.round((stats.trapsRatio.avoided / stats.trapsRatio.total) * 100)
              }%)`}
            </ThemedText>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.calendarContainer}>
          <CalendarView selectedDate={selectedDate} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calendarContainer: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  activeToggle: {
    backgroundColor: '#0a7ea4',
  },
  statsContainer: {
    gap: 16,
  },
  statItem: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#666',
  },
  activeText: {
    color: 'white',
  },
}); 