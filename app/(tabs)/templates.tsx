import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';

export default function TemplatesScreen() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Templates</ThemedText>
      {/* Template content will go here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
}); 