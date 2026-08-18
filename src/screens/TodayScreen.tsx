import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TimerWidget from '../components/TimerWidget';
import { useAppContext } from '../context/AppContext';
import { t } from '../i18n';
import { getTodayStr, getLastNDays, formatDateForPicker } from '../utils/dateUtils';

interface Props {
  navigation: NativeStackNavigationProp<any, any>;
}

export default function TodayScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { 
    state, 
    toggleTask, 
    postponeTaskToFriday, 
    addCustomTask, 
    toggleCustomTask, 
    deleteCustomTask,
    setSelectedDate 
  } = useAppContext();
  
  const [newCustomTask, setNewCustomTask] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const todayStr = getTodayStr();
  const selectedDate = state.selectedDate || todayStr;
  const isTodaySelected = selectedDate === todayStr;

  const past15Days = getLastNDays(15);
  
  const formatter = new Intl.DateTimeFormat(state.language === 'it' ? 'it-IT' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateString = formatter.format(new Date(selectedDate + 'T00:00:00')).toUpperCase();
  const dayName = new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(new Date());

  const focusTask = state.weeklyTasks.find(t => t.dayOfWeek?.toLowerCase() === dayName.toLowerCase());

  // Derive daily task completions for the selected date
  const selectedDateCompletedIds = isTodaySelected
    ? state.dailyTasks.filter(t => t.completed).map(t => t.id)
    : (state.dailyTasksCompletionsByDate[selectedDate] || []);

  const completedDailyTasksCount = state.dailyTasks.filter(t => selectedDateCompletedIds.includes(t.id)).length;
  const todaysCustomTasks = state.customTasks.filter(t => t.date === selectedDate);

  const handleAddCustomTask = () => {
    if (newCustomTask.trim()) {
      addCustomTask(newCustomTask.trim(), selectedDate);
      setNewCustomTask('');
      setIsAddingCustom(false);
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 40, paddingBottom: insets.bottom || 20 }]}>
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

        {/* 15-Day Date Selector Bar */}
        <View style={styles.datePickerContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datePickerScroll}
          >
            {past15Days.map(dateStr => {
              const isSelected = dateStr === selectedDate;
              const formatted = formatDateForPicker(dateStr, state.language);

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.datePill, isSelected && styles.datePillActive]}
                  onPress={() => setSelectedDate(dateStr)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.datePillLabel, isSelected && styles.datePillLabelActive]}>
                    {formatted.label}
                  </Text>
                  <Text style={[styles.datePillSublabel, isSelected && styles.datePillSublabelActive]}>
                    {formatted.sublabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Date Header Banner if historical */}
        {!isTodaySelected && (
          <TouchableOpacity 
            style={styles.historyBanner}
            onPress={() => setSelectedDate(todayStr)}
          >
            <Ionicons name="time-outline" size={16} color="#00A3A1" />
            <Text style={styles.historyBannerText}>
              {state.language === 'it' ? 'Storico del ' : 'History: '} {dateString}
            </Text>
            <View style={styles.historyReturnBtn}>
              <Text style={styles.historyReturnText}>{state.language === 'it' ? 'Torna a Oggi' : 'Back to Today'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {isTodaySelected && <Text style={styles.dateText}>{dateString}</Text>}

        {isTodaySelected && <TimerWidget />}

        {/* Daily Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('daily_tasks', state.language)}</Text>
          <Text style={styles.sectionSubtitle}>{5 - completedDailyTasksCount} da completare</Text>
        </View>

        <View style={styles.tasksList}>
          {state.dailyTasks.map(task => {
            const isCompleted = selectedDateCompletedIds.includes(task.id);
            return (
              <TouchableOpacity 
                key={task.id} 
                style={styles.taskCard} 
                onPress={() => toggleTask(task.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
                  {isCompleted && <Feather name="check" size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            );
          })}
          {todaysCustomTasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                onPress={() => toggleCustomTask(task.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                  {task.completed && <Feather name="check" size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                  {task.title} <Text style={{ fontSize: 12, color: '#8A7B66' }}>(Extra)</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteCustomTask(task.id)} style={{ padding: 4 }}>
                <Feather name="trash-2" size={18} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {isAddingCustom ? (
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={{ flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D0E3E3', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 }}
              placeholder="Nuova attività extra..."
              value={newCustomTask}
              onChangeText={setNewCustomTask}
              onSubmitEditing={handleAddCustomTask}
              autoFocus
            />
            <TouchableOpacity onPress={handleAddCustomTask} style={{ backgroundColor: '#00A3A1', padding: 12, borderRadius: 16 }}>
              <Feather name="check" size={16} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsAddingCustom(false)} style={{ backgroundColor: '#F0F4F4', padding: 12, borderRadius: 16, marginLeft: 8 }}>
              <Feather name="x" size={16} color="#5A6B6B" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }} onPress={() => setIsAddingCustom(true)}>
            <Feather name="plus" size={16} color="#00A3A1" />
            <Text style={{ marginLeft: 6, color: '#00A3A1', fontWeight: '600' }}>Aggiungi attività</Text>
          </TouchableOpacity>
        )}

        {/* Focus del Giorno (Show on Today) */}
        {isTodaySelected && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>{t('weekly_focus', state.language)}</Text>
            
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
                      <Text style={{ color: '#00A3A1', fontSize: 10, fontWeight: 'bold' }}>{t('completed', state.language)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.focusTitle}>{focusTask ? focusTask.title : t('no_tasks_today', state.language)}</Text>
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
                      <Text style={{ fontSize: 14, color: '#5A6B6B', fontWeight: '500', marginLeft: 8 }}>{t('postponed', state.language)}</Text>
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
                          <Text style={{ fontSize: 14, color: '#5A6B6B', fontWeight: '600', marginLeft: 6 }}>{t('postpone_to_friday', state.language)}</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F9',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A3A1',
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
  datePickerContainer: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  datePickerScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0E3E3',
    alignItems: 'center',
    minWidth: 70,
  },
  datePillActive: {
    backgroundColor: '#00A3A1',
    borderColor: '#00A3A1',
  },
  datePillLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5A6B6B',
  },
  datePillLabelActive: {
    color: '#FFFFFF',
  },
  datePillSublabel: {
    fontSize: 10,
    color: '#8A9A9A',
    marginTop: 2,
  },
  datePillSublabelActive: {
    color: '#E0F0F0',
  },
  historyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F4',
    borderWidth: 1,
    borderColor: '#B0DFDE',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  historyBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006665',
    marginLeft: 6,
    flex: 1,
  },
  historyReturnBtn: {
    backgroundColor: '#00A3A1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyReturnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
    borderColor: '#D0E3E3',
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
    backgroundColor: '#F3E8D6',
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
