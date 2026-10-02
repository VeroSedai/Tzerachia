import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

export default function EditScheduleModal() {
  const router = useRouter();
  const { state, updateWeeklySchedule, resetWeeklySchedule } = useAppContext();
  
  // Create local state array of inputs matching monday-thursday and saturday
  // Exclude Friday (catch-all) and Sunday (daily tasks only)
  const editableTasks = state.weeklyTasks.filter(
    t => t.dayOfWeek && t.dayOfWeek !== 'Venerdì' && t.dayOfWeek !== 'Domenica'
  );

  const [taskInputs, setTaskInputs] = useState(
    editableTasks.reduce((acc, t) => {
      acc[t.id] = t.title;
      return acc;
    }, {} as Record<string, string>)
  );

  const handleSave = () => {
    const updates = editableTasks.map(t => ({
      id: t.id,
      title: taskInputs[t.id] || t.title
    }));
    updateWeeklySchedule(updates);
    router.back();
  };

  const handleReset = () => {
    resetWeeklySchedule();
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1A2F2F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifica Calendario</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Salva</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            Personalizza i task settimanali. Il Venerdì (Catch-all) e la Domenica (Riposo) sono fissi.
          </Text>

          {editableTasks.map(task => (
            <View key={task.id} style={styles.inputGroup}>
              <Text style={styles.label}>{task.dayOfWeek}</Text>
              <TextInput
                style={styles.input}
                value={taskInputs[task.id]}
                onChangeText={(text) => setTaskInputs(prev => ({ ...prev, [task.id]: text }))}
                placeholder={`Task per ${task.dayOfWeek}`}
                placeholderTextColor="#8A9A9A"
              />
            </View>
          ))}

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Ripristina Predefiniti</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0EAE9',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F2F',
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00A3A1',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    color: '#5A6B6B',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0E3E3',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A2F2F',
  },
  resetButton: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF0F0',
  },
  resetButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
