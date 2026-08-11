import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { t } from '../i18n';
import { guides as defaultGuides } from '../data/guidesAndRecipes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const DAYS = [
  { short: 'LUN', key: 'Lunedì' },
  { short: 'MAR', key: 'Martedì' },
  { short: 'MER', key: 'Mercoledì' },
  { short: 'GIO', key: 'Giovedì' },
  { short: 'VEN', key: 'Venerdì' },
  { short: 'SAB', key: 'Sabato' },
  { short: 'DOM', key: 'Domenica' },
];

interface Props {
  navigation: NativeStackNavigationProp<any, any>;
}

// Memoized Task Item Component
const TaskItem = React.memo(({ item, dayInfo, isSunday, isCatchAllDay, pastMissedTasks, language, toggleTask, postponeTaskToFriday }: any) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardHeader} 
        onPress={() => { if (!isSunday) toggleTask(item.id); }}
        activeOpacity={isSunday ? 1 : 0.7}
      >
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
            onPress={() => { if (!isSunday) toggleTask(item.id); }}
            activeOpacity={isSunday ? 1 : 0.7}
          >
            {item.completed && <Feather name="check" size={14} color="#FFFFFF" />}
          </TouchableOpacity>
          <View>
            <Text style={styles.dayLabel}>{item.day.toUpperCase()}</Text>
            <Text style={[styles.taskTitle, item.completed && styles.taskCompleted]}>{item.taskName}</Text>
          </View>
        </View>

        {item.completed ? (
          <View style={styles.badgeCompleted}>
            <Text style={styles.badgeCompletedText}>{t('completed', language)}</Text>
          </View>
        ) : item.postponed ? (
          <View style={[styles.badgePending, { backgroundColor: '#E0EAE9' }]}>
            <Text style={[styles.badgePendingText, { color: '#5A6B6B' }]}>{t('postponed', language)}</Text>
          </View>
        ) : (
          <View style={styles.badgePending}>
            <Text style={styles.badgePendingText}>{t('in_progress', language)}</Text>
          </View>
        )}
      </TouchableOpacity>

      {!item.completed && !item.postponed && !isSunday && !isCatchAllDay && (
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F0F4F4', borderRadius: 12, alignSelf: 'flex-start' }}
          onPress={() => postponeTaskToFriday(item.id)}
        >
          <Feather name="clock" size={14} color="#5A6B6B" />
          <Text style={{ fontSize: 12, color: '#5A6B6B', fontWeight: 'bold', marginLeft: 6 }}>{t('postpone_to_friday', language)}</Text>
        </TouchableOpacity>
      )}

      {isCatchAllDay && (
        <View style={styles.catchAllContainer}>
          <View style={styles.catchAllHeader}>
            <Feather name="inbox" size={16} color="#8A7B66" />
            <Text style={styles.catchAllTitle}>{t('catch_all_friday', language)}</Text>
          </View>
          <Text style={styles.catchAllSubtitle}>{t('catch_all_subtitle', language)}</Text>

          {pastMissedTasks && pastMissedTasks.length > 0 ? (
            pastMissedTasks.map((task: any) => (
              <View key={`catchall-${task.id}`} style={styles.catchAllItem}>
                <Text style={styles.catchAllItemText}>• {task.title} ({task.dayOfWeek})</Text>
              </View>
            ))
          ) : (
            <Text style={styles.catchAllEmpty}>{t('no_missed_tasks', language)}</Text>
          )}
        </View>
      )}
    </View>
  );
});

export default function ScheduleScreen({ navigation }: Props) {
  const { state, toggleTask, postponeTaskToFriday, toggleMonthlyTask, resetMonthlyTasks } = useAppContext();
  
  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; 
  const [selectedDay, setSelectedDay] = useState(currentDayIndex);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  const monthlyGuideIds: Record<string, string> = {
    'm1': 'filtri-aria',
    'm2': 'lampadari-ventilatori',
    'm3': 'muri-interruttori',
    'm4': 'materasso-sanitize',
    'm5': 'macchina-caffe'
  };

  const handleOpenMonthlyGuide = useCallback((taskId: string) => {
    const guideId = monthlyGuideIds[taskId];
    if (guideId) {
      const guide = defaultGuides.find(g => g.id === guideId);
      if (guide) {
        navigation.navigate('GuidesStack', { 
          screen: 'GuideDetail', 
          params: { item: guide, type: 'guide' } 
        });
      }
    }
  }, [navigation]);

  const pastMissedTasks = useMemo(() => state.weeklyTasks.filter(t => {
    if (t.completed || t.type === 'catch-all') return false;
    const taskDayIndex = DAYS.findIndex(d => d.key.toLowerCase() === t.dayOfWeek?.toLowerCase());
    return taskDayIndex !== -1 && taskDayIndex < 4;
  }), [state.weeklyTasks]);

  const weeklyData = useMemo(() => {
    return DAYS.map(dayInfo => {
      const isCatchAllDay = dayInfo.key === 'Venerdì';
      const isSunday = dayInfo.key === 'Domenica';
      const dayTasks = state.weeklyTasks.filter(t => t.dayOfWeek?.toLowerCase() === dayInfo.key.toLowerCase());
      
      const items = isSunday 
        ? [{ id: 'domenica-task', taskName: 'Solo Daily Tasks', completed: false, day: dayInfo.key, postponed: false }]
        : dayTasks.map(t => ({ id: t.id, taskName: t.title, completed: t.completed, day: dayInfo.key, postponed: t.postponed }));

      return { dayInfo, isCatchAllDay, isSunday, items };
    });
  }, [state.weeklyTasks]);

  const renderWeeklyItem = useCallback(({ item }: any) => {
    return (
      <View style={styles.cardsList}>
        {item.items.map((taskItem: any) => (
          <TaskItem 
            key={`${item.dayInfo.key}-${taskItem.id}`}
            item={taskItem}
            dayInfo={item.dayInfo}
            isSunday={item.isSunday}
            isCatchAllDay={item.isCatchAllDay}
            pastMissedTasks={pastMissedTasks}
            language={state.language}
            toggleTask={toggleTask}
            postponeTaskToFriday={postponeTaskToFriday}
          />
        ))}
      </View>
    );
  }, [pastMissedTasks, state.language, toggleTask, postponeTaskToFriday]);

  const renderMonthlyItem = useCallback(({ item: task }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
            onPress={() => toggleMonthlyTask(task.id)}
          >
            {task.completed && <Feather name="check" size={14} color="#FFFFFF" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenMonthlyGuide(task.id)}>
            <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>{task.title}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => handleOpenMonthlyGuide(task.id)} style={{ padding: 4 }}>
            <Feather name="info" size={20} color="#8A7B66" />
          </TouchableOpacity>
          {task.completed ? (
            <View style={styles.badgeCompleted}>
              <Text style={styles.badgeCompletedText}>{t('completed', state.language)}</Text>
            </View>
          ) : (
            <View style={styles.badgePending}>
              <Text style={styles.badgePendingText}>{t('pending', state.language)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  ), [state.language, handleOpenMonthlyGuide, toggleMonthlyTask]);

  const ListHeader = useCallback(() => (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('planning', state.language)}</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditSchedule')}
        >
          <Feather name="edit-2" size={12} color="#1A2F2F" />
          <Text style={styles.editButtonText}>{t('edit', state.language)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segmentButton, viewMode === 'weekly' && styles.segmentActive]}
          onPress={() => setViewMode('weekly')}
        >
          <Text style={[styles.segmentText, viewMode === 'weekly' && styles.segmentTextActive]}>{t('weekly', state.language)}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentButton, viewMode === 'monthly' && styles.segmentActive]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.segmentText, viewMode === 'monthly' && styles.segmentTextActive]}>{t('monthly', state.language)}</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'weekly' && (
        <View style={styles.daysBarWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysBar}>
            {DAYS.map((day, index) => {
              const isActive = selectedDay === index;
              return (
                <TouchableOpacity 
                  key={day.short} 
                  style={[styles.dayChip, isActive && styles.activeDayChip]}
                  onPress={() => setSelectedDay(index)}
                >
                  <Text style={[styles.dayChipText, isActive && styles.activeDayChipText]}>{day.short}</Text>
                  {isActive && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {viewMode === 'monthly' && (
        <View style={styles.monthlyContainer}>
          <View style={styles.monthlyHeader}>
            <Text style={styles.monthlyTitle}>{t('monthly_tasks', state.language)}</Text>
            <TouchableOpacity onPress={() => {
              if (window.confirm) {
                if (window.confirm(t('reset_monthly_confirm', state.language))) resetMonthlyTasks();
              } else {
                Alert.alert(t('reset_monthly', state.language), t('reset_monthly_confirm', state.language), [
                  { text: t('cancel', state.language), style: "cancel" },
                  { text: t('reset', state.language), style: "destructive", onPress: resetMonthlyTasks }
                ]);
              }
            }} style={styles.resetButton}>
              <Feather name="rotate-ccw" size={14} color="#8A7B66" />
              <Text style={styles.resetButtonText}>{t('reset', state.language)}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.monthlySubtitle}>{t('monthly_subtitle', state.language)}</Text>
        </View>
      )}
    </>
  ), [state.language, viewMode, navigation, selectedDay, resetMonthlyTasks]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={viewMode === 'weekly' ? weeklyData : state.monthlyTasks}
        keyExtractor={(item: any) => viewMode === 'weekly' ? item.dayInfo.key : item.id}
        renderItem={viewMode === 'weekly' ? renderWeeklyItem : renderMonthlyItem}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F9F9' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { color: '#1A2F2F', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  editButtonText: { color: '#1A2F2F', fontSize: 12, fontWeight: '600' },
  segmentContainer: { flexDirection: 'row', backgroundColor: '#E0EAE9', borderRadius: 20, padding: 4, marginBottom: 20 },
  segmentButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  segmentActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  segmentText: { color: '#5A6B6B', fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: '#1A2F2F', fontWeight: '800' },
  monthlyContainer: { marginTop: 10 },
  monthlyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  monthlyTitle: { fontSize: 16, fontWeight: '800', color: '#1A2F2F' },
  monthlySubtitle: { fontSize: 14, color: '#5A6B6B', marginBottom: 20 },
  resetButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8D6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  resetButtonText: { color: '#8A7B66', fontSize: 12, fontWeight: '700' },
  daysBarWrapper: { marginBottom: 24 },
  daysBar: { flexDirection: 'row' },
  dayChip: { backgroundColor: '#FFFFFF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#FFFFFF', elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2 },
  activeDayChip: { backgroundColor: '#00A3A1', borderColor: '#00A3A1' },
  dayChipText: { color: '#5A6B6B', fontSize: 12, fontWeight: '600' },
  activeDayChipText: { color: '#FFFFFF', fontWeight: '700' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', marginTop: 2 },
  cardsList: { gap: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#D0E3E3' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#A8C3C8', justifyContent: 'center', alignItems: 'center' },
  checkboxCompleted: { backgroundColor: '#00A3A1', borderColor: '#00A3A1' },
  dayLabel: { color: '#8A7B66', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  taskTitle: { color: '#1A2F2F', fontSize: 18, fontWeight: '600' },
  taskCompleted: { textDecorationLine: 'line-through', color: '#A8C3C8' },
  badgeCompleted: { backgroundColor: '#D5F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeCompletedText: { color: '#00A3A1', fontSize: 12, fontWeight: '700' },
  badgePending: { backgroundColor: '#F3E8D6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgePendingText: { color: '#8A7B66', fontSize: 12, fontWeight: '700' },
  catchAllContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#F3E8D6', marginHorizontal: -16, marginBottom: -16, paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  catchAllHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  catchAllTitle: { color: '#5C4E3A', fontSize: 12, fontWeight: '700' },
  catchAllSubtitle: { color: '#8A7B66', fontSize: 12, marginBottom: 8 },
  catchAllItem: { paddingVertical: 2 },
  catchAllItemText: { color: '#3A2E1A', fontSize: 13, fontWeight: '500' },
  catchAllEmpty: { color: '#3A2E1A', fontSize: 13, fontStyle: 'italic', marginTop: 4 },
});
