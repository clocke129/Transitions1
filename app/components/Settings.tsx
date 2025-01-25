import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Modal, Text } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Colors } from '../constants/Colors';

export function Settings({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  const { resetTime, updateResetTime } = useTaskContext();
  const [time, setTime] = useState(resetTime);

  const handleSave = () => {
    updateResetTime(time);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.title}>Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.label}>Daily Reset Time</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 500,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  settingItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  button: {
    backgroundColor: Colors.light.secondary,
    padding: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  cancelButton: {
    backgroundColor: Colors.light.accent,
  },
  buttonText: {
    color: '#555',
    fontWeight: '500',
  },
}); 