import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, UIManager, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeDetail'>;

export default function ChallengeDetailScreen({ route, navigation }: Props) {
  const { challengeId } = route.params;
  const { state, advanceChallengeDay, toggleChallengeSubtask, resetActiveChallenge } = useAppContext();
  
  const activeChallenge = state.activeChallenge;
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  if (!activeChallenge || activeChallenge.id !== challengeId) {
    return (
      <View style={styles.centered}>
        <Text>Nessuna sfida attiva trovata.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tasks = activeChallenge.tasks || [];

  const handleCompleteDay = () => {
    advanceChallengeDay();
    navigation.goBack();
  };

  const toggleExpand = (taskId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleResetChallenge = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("Vuoi davvero azzerare i progressi e ricominciare la sfida dal Giorno 1?")) {
        resetActiveChallenge();
        window.alert("La sfida è stata azzerata!");
        navigation.navigate('MainTabs');
      }
      return;
    }
    Alert.alert(
      "Ricomincia Sfida",
      "Vuoi davvero azzerare i progressi e ricominciare la sfida dal Giorno 1?",
      [
        { text: "Annulla", style: "cancel" },
        { text: "Ricomincia", style: "destructive", onPress: () => {
          resetActiveChallenge();
          Alert.alert("Successo", "La sfida è stata azzerata!");
          navigation.navigate('MainTabs');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A2F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeChallenge.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>
            Giorno {activeChallenge.currentDay} di {activeChallenge.durationDays}
          </Text>
        </View>

        <Text style={styles.encouragementText}>
          Fai del tuo meglio oggi. Se salti un' attività, nessun problema! L'obiettivo è il progresso, non la perfezione.
        </Text>

        <View style={styles.cardsList}>
          {tasks.map((task) => {
            const isExpanded = expandedTasks[task.id];
            const completedCount = task.subtasks.filter(st => st.completed).length;
            const isAllCompleted = completedCount === task.subtasks.length && task.subtasks.length > 0;

            return (
              <View key={task.id} style={styles.card}>
                <TouchableOpacity 
                  style={styles.cardHeader} 
                  onPress={() => toggleExpand(task.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.leftSection}>
                    <View style={[styles.mainCheckbox, isAllCompleted && styles.mainCheckboxCompleted]}>
                      {isAllCompleted && <Feather name="check" size={16} color="#FFFFFF" />}
                    </View>
                    <View>
                      <Text style={[styles.taskTitle, isAllCompleted && styles.taskTitleCompleted]}>
                        {task.title}
                      </Text>
                      <Text style={styles.progressText}>
                        {completedCount} di {task.subtasks.length} completati
                      </Text>
                    </View>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#8A9A9A" />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.subtasksContainer}>
                    {task.subtasks.map(subtask => (
                      <TouchableOpacity 
                        key={subtask.id} 
                        style={styles.subtaskRow}
                        onPress={() => toggleChallengeSubtask(subtask.id)}
                      >
                        <View style={[styles.subCheckbox, subtask.completed && styles.subCheckboxCompleted]}>
                          {subtask.completed && <Feather name="check" size={12} color="#FFFFFF" />}
                        </View>
                        <Text style={[styles.subtaskTitle, subtask.completed && styles.subtaskTitleCompleted]}>
                          {subtask.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {activeChallenge.status !== 'completed' && (
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteDay}>
            <Text style={styles.completeButtonText}>Completa Giorno {activeChallenge.currentDay}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.resetButton} onPress={handleResetChallenge}>
          <Feather name="rotate-ccw" size={16} color="#FF6B6B" style={{ marginRight: 6 }} />
          <Text style={styles.resetButtonText}>Ricomincia dal Giorno 1</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0EAE9' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A2F2F' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginTop: 20, padding: 12, backgroundColor: '#00A3A1', borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },
  container: { padding: 20 },
  dayBadge: { alignSelf: 'flex-start', backgroundColor: '#00A3A1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  dayBadgeText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  encouragementText: { fontSize: 15, color: '#5A6B6B', lineHeight: 22, fontStyle: 'italic', marginBottom: 24 },
  cardsList: { gap: 12, marginBottom: 30 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#D0E3E3', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  mainCheckbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#A8C3C8', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  mainCheckboxCompleted: { backgroundColor: '#00A3A1', borderColor: '#00A3A1' },
  taskTitle: { fontSize: 16, color: '#1A2F2F', fontWeight: '600', flexShrink: 1 },
  taskTitleCompleted: { color: '#8A9A9A' },
  progressText: { fontSize: 13, color: '#8A9A9A', marginTop: 2 },
  subtasksContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E0EAE9', gap: 12 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center' },
  subCheckbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#A8C3C8', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  subCheckboxCompleted: { backgroundColor: '#00A3A1', borderColor: '#00A3A1' },
  subtaskTitle: { fontSize: 15, color: '#5A6B6B', flex: 1 },
  subtaskTitleCompleted: { textDecorationLine: 'line-through', color: '#A8C3C8' },
  completeButton: { backgroundColor: '#00A3A1', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#00A3A1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  completeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  resetButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, padding: 12 },
  resetButtonText: { color: '#FF6B6B', fontSize: 14, fontWeight: '600' }
});
