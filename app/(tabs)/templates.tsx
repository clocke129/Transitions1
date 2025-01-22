import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTaskContext } from '@/app/context/TaskContext';

interface Template {
  id: string;
  title: string;
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    isTrap: boolean;
  }>;
  createdAt: Date;
}

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const { addTask } = useTaskContext();

  useEffect(() => {
    console.log('Templates screen mounted');
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      console.log('Fetching templates...');
      const q = query(collection(db, 'staticTemplates'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const loadedTemplates: Template[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Template data:', data);
        loadedTemplates.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() // Convert Firestore timestamp to Date
        } as Template);
      });
      console.log('Loaded templates:', loadedTemplates);
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const useTemplate = (template: Template) => {
    template.tasks.forEach(task => {
      addTask(task.title);
    });
  };

  return (
    <ScrollView style={styles.container}>
      {templates.map((template) => (
        <View key={template.id} style={styles.templateRow}>
          <ThemedText style={styles.templateTitle}>{template.title}</ThemedText>
          <Pressable 
            style={styles.addButton}
            onPress={() => useTemplate(template)}
          >
            <Ionicons name="add-circle" size={24} color="#0a7ea4" />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  templateTitle: {
    fontSize: 16,
    flex: 1,
  },
  addButton: {
    padding: 4,
  },
}); 