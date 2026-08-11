import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TaskItemProps {
  title: string;
  completed: boolean;
  onToggle: () => void;
}

export default function TaskItem({ title, completed, onToggle }: TaskItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
        {completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.title, completed && styles.titleCompleted]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7A9A8B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  checkboxChecked: {
    backgroundColor: '#7A9A8B',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    color: '#2C3E35', // Dark Charcoal
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#A8C3C8', // Sky Blue for completed text
  },
});
