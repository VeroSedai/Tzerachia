import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { confirmAction, showAlert } from '../utils/alertUtils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const { state, advanceChallengeDay, toggleChallengeSubtask, resetActiveChallenge } = useAppContext();
  
  const activeChallenge = state.activeChallenge;
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  if (!activeChallenge || activeChallenge.id !== challengeId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Nessuna sfida attiva trovata.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tasks = activeChallenge.tasks || [];

  const handleCompleteDay = () => {
    advanceChallengeDay();
    router.back();
  };

  const toggleExpand = (taskId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleResetChallenge = () => {
    confirmAction(
      "Ricomincia Sfida",
      "Vuoi davvero azzerare i progressi e ricominciare la sfida dal Giorno 1?",
      () => {
        resetActiveChallenge();
        showAlert("Successo", "La sfida è stata azzerata!");
        router.replace('/(tabs)/challenges');
      },
      "Ricomincia"
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A2F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeChallenge.title}</Text>
        <TouchableOpacity onPress={handleResetChallenge} style={styles.iconBtn}>
          <Feather name="rotate-ccw" size={18} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.dayProgressCard}>
          <View>
            <Text style={styles.dayProgressTitle}>Giorno {activeChallenge.currentDay} di {activeChallenge.durationDays}</Text>
            <Text style={styles.dayProgressSubtitle}>Completa i task del giorno per avanzare</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{Math.round((activeChallenge.currentDay / activeChallenge.durationDays) * 100)}%</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>TASK DI OGGI</Text>

        {tasks.map(task => {
          const isExpanded = !!expandedTasks[task.id];
          const completedSubtasks = task.subtasks.filter(st => st.completed).length;
          const totalSubtasks = task.subtasks.length;
          const isAllDone = totalSubtasks > 0 && completedSubtasks === totalSubtasks;

          return (
            <View key={task.id} style={styles.taskCard}>
              <TouchableOpacity 
                style={styles.taskHeader} 
                onPress={() => toggleExpand(task.id)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, isAllDone && styles.taskTitleDone]}>{task.title}</Text>
                  <Text style={styles.taskSub}>{completedSubtasks}/{totalSubtasks} completati</Text>
                </View>
                <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#7A9A8B" />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.subtasksList}>
                  {task.subtasks.map(subtask => (
                    <TouchableOpacity 
                      key={subtask.id} 
                      style={styles.subtaskRow}
                      onPress={() => toggleChallengeSubtask(subtask.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, subtask.completed && styles.checkboxCompleted]}>
                        {subtask.completed && <Feather name="check" size={14} color="#FFFFFF" />}
                      </View>
                      <Text style={[styles.subtaskTitle, subtask.completed && styles.subtaskDone]}>
                        {subtask.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.completeDayBtn} onPress={handleCompleteDay} activeOpacity={0.85}>
          <Text style={styles.completeDayText}>Completa Giorno {activeChallenge.currentDay} 🎉</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0EAE9',
    backgroundColor: '#FFFFFF',
  },
  iconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F2F',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  dayProgressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0E3E3',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  dayProgressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginBottom: 4,
  },
  dayProgressSubtitle: {
    fontSize: 13,
    color: '#8A9A9A',
  },
  badge: {
    backgroundColor: '#00A3A1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8A9A9A',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0E3E3',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2F2F',
    marginBottom: 2,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  taskSub: {
    fontSize: 12,
    color: '#8A9A9A',
  },
  subtasksList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F4',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#A8C3C8',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#00A3A1',
    borderColor: '#00A3A1',
  },
  subtaskTitle: {
    fontSize: 14,
    color: '#1A2F2F',
    flex: 1,
  },
  subtaskDone: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  completeDayBtn: {
    backgroundColor: '#00A3A1',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#00A3A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  completeDayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F6F9F9',
  },
  emptyText: {
    fontSize: 16,
    color: '#5A6B6B',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#00A3A1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
