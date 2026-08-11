import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'EditSchedule'>;

export default function EditScheduleModal({ navigation }: Props) {
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
    navigation.goBack();
  };

  const handleReset = () => {
    resetWeeklySchedule();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1A2F2F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifica Calendario</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Salva</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
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

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Ripristina Calendario Predefinito</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F9F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0EAE9', backgroundColor: '#FFFFFF' },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A2F2F' },
  saveText: { fontSize: 16, fontWeight: 'bold', color: '#00A3A1' },
  container: { padding: 20, paddingBottom: 40 },
  description: { fontSize: 14, color: '#5A6B6B', marginBottom: 24, lineHeight: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#1A2F2F', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0EAE9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1A2F2F' },
  resetBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF6B6B', alignItems: 'center' },
  resetBtnText: { color: '#FF6B6B', fontSize: 16, fontWeight: 'bold' }
});