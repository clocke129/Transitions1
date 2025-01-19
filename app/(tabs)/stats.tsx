import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export default function StatisticsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <ThemedText style={styles.title}>Statistics</ThemedText>
        
        <View style={styles.statCard}>
          <ThemedText style={styles.statLabel}>Total Transitions</ThemedText>
          <ThemedText style={styles.statValue}>0</ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statLabel}>Total Time</ThemedText>
          <ThemedText style={styles.statValue}>00:00</ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statLabel}>Tasks Completed</ThemedText>
          <ThemedText style={styles.statValue}>0</ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statLabel}>Traps Avoided</ThemedText>
          <ThemedText style={styles.statValue}>0</ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
}); 