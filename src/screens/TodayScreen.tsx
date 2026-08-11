import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TimerWidget from '../components/TimerWidget';
import { useAppContext } from '../context/AppContext';

interface Props {
  navigation: NativeStackNavigationProp<any, any>;
}

export default function TodayScreen({ navigation }: Props) {
  const { state, toggleTask, postponeTaskToFriday } = useAppContext();
  
  const formatter = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateString = formatter.format(new Date()).toUpperCase();
  const dayName = new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(new Date());

  const focusTask = state.weeklyTasks.find(t => t.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
  const completedDailyTasksCount = state.dailyTasks.filter(t => t.completed).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Custom Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>T</Text>
            </View>
            <Text style={styles.appName}>Tzerachìa</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.dateText}>{dateString}</Text>

        <TimerWidget />

        {/* Daily Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Tasks</Text>
          <Text style={styles.sectionSubtitle}>{5 - completedDailyTasksCount} da completare</Text>
        </View>

        <View style={styles.tasksList}>
          {state.dailyTasks.map(task => (
            <TouchableOpacity 
              key={task.id} 
              style={styles.taskCard} 
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                {task.completed && <Feather name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                {task.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Focus del Giorno */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Focus del giorno</Text>
        
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Ionicons name="sparkles-outline" size={16} color="#8A7B66" />
            <Text style={styles.focusDayName}>{dayName.toUpperCase()}</Text>
          </View>
          {focusTask && !focusTask.postponed ? (
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
              onPress={() => toggleTask(focusTask.id)}
              activeOpacity={0.7}
            >
              <View style={[
                { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C0B3A0', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
                focusTask.completed && { backgroundColor: '#00A3A1', borderColor: '#00A3A1' }
              ]}>
                {focusTask.completed && <Feather name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.focusTitle, focusTask.completed && { textDecorationLine: 'line-through', color: '#8A9A9A' }]}>
                {focusTask.title}
              </Text>
              {focusTask.completed && (
                <View style={{ backgroundColor: '#E0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 12 }}>
                  <Text style={{ color: '#00A3A1', fontSize: 10, fontWeight: 'bold' }}>Completato</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.focusTitle}>{focusTask ? focusTask.title : 'Solo Daily Tasks'}</Text>
          )}

          <Text style={styles.focusDescription}>
            {focusTask ? (
              focusTask.completed 
                ? 'Ottimo lavoro! Hai completato il focus di oggi.'
                : `Focus di oggi: ${focusTask.title}. Esegui le pulizie mirate.`
            ) : 'Oggi è giorno di riposo, mantieni solo la base.'}
          </Text>

          {focusTask && (
            <View>
              {focusTask.postponed ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAEAEA', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, marginTop: 12 }}>
                  <Ionicons name="calendar-outline" size={14} color="#5A6B6B" />
                  <Text style={{ fontSize: 14, color: '#5A6B6B', fontWeight: '500', marginLeft: 8 }}>Rimandato al Venerdì</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.guideCard} 
                    onPress={() => navigation.navigate('GuidesStack')}
                  >
                    <View style={styles.guideCheckbox} />
                    <Text style={styles.guideText}>Apri guida: {focusTask.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#8A7B66" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                  
                  {!focusTask.completed && focusTask.dayOfWeek?.toLowerCase() !== 'venerdì' && focusTask.dayOfWeek?.toLowerCase() !== 'domenica' && (
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 10, backgroundColor: '#F0F4F4', borderRadius: 16, borderWidth: 1, borderColor: '#E0EAE9' }}
                      onPress={() => postponeTaskToFriday(focusTask.id)}
                    >
                      <Ionicons name="time-outline" size={16} color="#5A6B6B" />
                      <Text style={{ fontSize: 14, color: '#5A6B6B', fontWeight: '600', marginLeft: 6 }}>Rimanda a Venerdì</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F9', // Light grayish cyan
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A3A1', // Teal
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2F2F',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B6B',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F2F',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#5A6B6B',
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0E3E3', // Light Teal Outline
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#A8C3C8',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#00A3A1',
    borderColor: '#00A3A1',
  },
  taskTitle: {
    fontSize: 16,
    color: '#1A2F2F',
    fontWeight: '500',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  focusCard: {
    backgroundColor: '#F3E8D6', // Beige
    borderRadius: 20,
    padding: 20,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  focusDayName: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8A7B66',
    letterSpacing: 0.5,
  },
  focusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A2E1A',
    marginBottom: 6,
  },
  focusDescription: {
    fontSize: 14,
    color: '#5C4E3A',
    lineHeight: 20,
    marginBottom: 16,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8DFCC',
  },
  guideCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C0B3A0',
    marginRight: 10,
  },
  guideText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2F2F',
  },
});
