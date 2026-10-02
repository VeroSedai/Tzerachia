import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppContext } from '../../context/AppContext';
import { t } from '../../i18n';
import { guides as defaultGuides } from '../../data/guidesAndRecipes';
import { format, addDays } from 'date-fns';
import { confirmAction } from '../../utils/alertUtils';
import { Task } from '../../types';

const DAYS = [
  { short: 'LUN', key: 'Lunedì' },
  { short: 'MAR', key: 'Martedì' },
  { short: 'MER', key: 'Mercoledì' },
  { short: 'GIO', key: 'Giovedì' },
  { short: 'VEN', key: 'Venerdì' },
  { short: 'SAB', key: 'Sabato' },
  { short: 'DOM', key: 'Domenica' },
];

interface ScheduleTaskItemData {
  id: string;
  taskName: string;
  completed: boolean;
  day: string;
  postponed?: boolean;
}

interface ScheduleTaskItemProps {
  item: ScheduleTaskItemData;
  dayInfo: { short: string; key: string };
  isSunday: boolean;
  isCatchAllDay: boolean;
  pastMissedTasks: Task[];
  language: 'it' | 'en';
  toggleTask: (taskId: string) => void;
  postponeTaskToFriday: (taskId: string) => void;
}

const ItemSeparator = () => <View style={{ height: 16 }} />;

/**
 * Memoized Task Item Component for Schedule screen.
 */
const TaskItem = React.memo(function TaskItem({
  item,
  dayInfo,
  isSunday,
  isCatchAllDay,
  pastMissedTasks,
  language,
  toggleTask,
  postponeTaskToFriday,
}: ScheduleTaskItemProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          if (!isSunday) toggleTask(item.id);
        }}
        activeOpacity={isSunday ? 1 : 0.7}
      >
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
            onPress={() => {
              if (!isSunday) toggleTask(item.id);
            }}
            disabled={isSunday}
          >
            {item.completed && <Feather name="check" size={14} color="#FFFFFF" />}
          </TouchableOpacity>
          <View>
            <Text style={[styles.taskTitle, item.completed && styles.completedText]}>
              {item.taskName}
            </Text>
            {item.postponed && (
              <Text style={styles.postponedTag}>
                {t('postponed', language)}
              </Text>
            )}
          </View>
        </View>

        {!isSunday && !isCatchAllDay && !item.completed && !item.postponed && (
          <TouchableOpacity
            style={styles.postponeButton}
            onPress={() => postponeTaskToFriday(item.id)}
          >
            <Feather name="clock" size={12} color="#00A3A1" />
            <Text style={styles.postponeText}>{t('postpone_to_friday', language)}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {isCatchAllDay && (
        <View style={styles.catchAllBox}>
          <Text style={styles.catchAllTitle}>
            {t('catch_all_subtitle', language)}
          </Text>
          {pastMissedTasks.length === 0 ? (
            <Text style={styles.emptyText}>{t('no_missed_tasks', language)}</Text>
          ) : (
            pastMissedTasks.map(task => (
              <View key={task.id} style={styles.catchAllItem}>
                <Text style={styles.catchAllItemText}>• {task.title} ({task.dayOfWeek})</Text>
                <TouchableOpacity onPress={() => toggleTask(task.id)}>
                  <Feather name="check-circle" size={16} color="#00A3A1" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
});

export default function ScheduleScreen() {
  const router = useRouter();
  const { 
    state, 
    toggleTask, 
    postponeTaskToFriday, 
    resetMonthlyTasks, 
    addCustomTask, 
    toggleCustomTask, 
    deleteCustomTask 
  } = useAppContext();
  
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedDay, setSelectedDay] = useState(0);
  const [addingForDay, setAddingForDay] = useState<number | null>(null);
  const [newCustomTasks, setNewCustomTasks] = useState<Record<number, string>>({});

  const getDateForDayIndex = (dayIndex: number): string => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = addDays(today, mondayOffset);
    const targetDate = addDays(monday, dayIndex);
    return format(targetDate, 'yyyy-MM-dd');
  };

  const handleAddCustomTask = (dayIndex: number) => {
    const text = newCustomTasks[dayIndex]?.trim();
    if (text) {
      const dateStr = getDateForDayIndex(dayIndex);
      addCustomTask(text, dateStr);
      setNewCustomTasks(prev => ({ ...prev, [dayIndex]: '' }));
      setAddingForDay(null);
    }
  };

  const handleOpenGuide = useCallback((guideTitle: string) => {
    const guide = defaultGuides.find(g => g.title.toLowerCase().includes(guideTitle.toLowerCase())) || defaultGuides[0];
    if (guide) {
      router.push({
        pathname: '/guide-detail',
        params: { item: JSON.stringify(guide), type: 'guide' },
      });
    }
  }, [router]);

  const pastMissedTasks = useMemo(() => {
    const today = new Date().getDay();
    const currentDayIndex = today === 0 ? 6 : today - 1;
    return state.weeklyTasks.filter(t => {
      const taskDayIndex = DAYS.findIndex(d => d.key.toLowerCase() === t.dayOfWeek?.toLowerCase());
      return (t.postponed || (!t.completed && taskDayIndex !== -1 && taskDayIndex < currentDayIndex)) && t.type !== 'catch-all';
    });
  }, [state.weeklyTasks]);

  const weeklyData = useMemo(() => {
    return DAYS.map((dayInfo, index) => {
      const dateStr = getDateForDayIndex(index);
      const dayTasks = state.weeklyTasks.filter(t => t.dayOfWeek?.toLowerCase() === dayInfo.key.toLowerCase());
      const customTasksForDay = state.customTasks.filter(t => t.date === dateStr);
      
      return {
        dayInfo,
        index,
        dateStr,
        tasks: dayTasks.map(t => ({
          id: t.id,
          taskName: t.title,
          completed: t.completed,
          day: dayInfo.key,
          postponed: t.postponed,
        })),
        customTasks: customTasksForDay
      };
    });
  }, [state.weeklyTasks, state.customTasks]);

  const renderWeeklyItem = useCallback(({ item }: any) => {
    const dayInfo = item.dayInfo;
    const isSunday = item.index === 6;
    const isCatchAllDay = item.index === 4;

    return (
      <View key={dayInfo.key} style={styles.dayGroup}>
        {item.tasks.map((task: any) => (
          <TaskItem 
            key={task.id}
            item={task}
            dayInfo={dayInfo}
            isSunday={isSunday}
            isCatchAllDay={isCatchAllDay}
            pastMissedTasks={pastMissedTasks}
            language={state.language}
            toggleTask={toggleTask}
            postponeTaskToFriday={postponeTaskToFriday}
          />
        ))}

        {item.customTasks.map((task: any) => (
          <View key={task.id} style={[styles.card, { marginTop: 8 }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.leftSection, { flex: 1 }]}>
                <TouchableOpacity
                  style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
                  onPress={() => toggleCustomTask(task.id)}
                >
                  {task.completed && <Feather name="check" size={14} color="#FFFFFF" />}
                </TouchableOpacity>
                <Text style={[styles.taskTitle, task.completed && styles.completedText]}>
                  {task.title} <Text style={{ fontSize: 12, color: '#8A7B66' }}>(Extra)</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteCustomTask(task.id)} style={{ padding: 4 }}>
                <Feather name="trash-2" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {addingForDay === item.index ? (
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={{ flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D0E3E3', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 }}
              placeholder={t('new_extra_placeholder', state.language)}
              value={newCustomTasks[item.index] || ''}
              onChangeText={(text) => setNewCustomTasks(prev => ({ ...prev, [item.index]: text }))}
              onSubmitEditing={() => handleAddCustomTask(item.index)}
              autoFocus
            />
            <TouchableOpacity onPress={() => handleAddCustomTask(item.index)} style={{ backgroundColor: '#00A3A1', padding: 12, borderRadius: 16 }}>
              <Feather name="check" size={16} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAddingForDay(null)} style={{ backgroundColor: '#F0F4F4', padding: 12, borderRadius: 16, marginLeft: 8 }}>
              <Feather name="x" size={16} color="#5A6B6B" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }} onPress={() => setAddingForDay(item.index)}>
            <Feather name="plus" size={16} color="#00A3A1" />
            <Text style={{ marginLeft: 6, color: '#00A3A1', fontWeight: '600' }}>{t('add_task_btn', state.language)}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [pastMissedTasks, state.language, toggleTask, postponeTaskToFriday, addingForDay, newCustomTasks, toggleCustomTask, deleteCustomTask]);

  const renderMonthlyItem = useCallback(({ item: task }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.leftSection, { flex: 1, marginRight: 8 }]}>
          <TouchableOpacity
            style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
            onPress={() => toggleTask(task.id)}
          >
            {task.completed && <Feather name="check" size={14} color="#FFFFFF" />}
          </TouchableOpacity>
          <Text style={[styles.taskTitle, task.completed && styles.completedText]}>
            {task.title}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.guideBadge}
          onPress={() => handleOpenGuide(task.title)}
        >
          <Feather name="book-open" size={12} color="#00A3A1" />
          <Text style={styles.guideBadgeText}>Guida</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [toggleTask, handleOpenGuide]);

  const ListHeader = useMemo(() => (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('planning', state.language)}</Text>
        {viewMode === 'weekly' && (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => router.push('/edit-schedule')}
          >
            <Feather name="edit-3" size={14} color="#1A2F2F" />
            <Text style={styles.editButtonText}>{t('edit', state.language)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segment Selector */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, viewMode === 'weekly' && styles.segmentActive]}
          onPress={() => setViewMode('weekly')}
        >
          <Text style={[styles.segmentText, viewMode === 'weekly' && styles.segmentTextActive]}>
            {t('weekly', state.language)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, viewMode === 'monthly' && styles.segmentActive]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.segmentText, viewMode === 'monthly' && styles.segmentTextActive]}>
            {t('monthly', state.language)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Days Filter Bar (Weekly View) */}
      {viewMode === 'weekly' ? (
        <View style={styles.daysBarWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={DAYS}
            keyExtractor={d => d.key}
            contentContainerStyle={styles.daysBar}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.dayChip, selectedDay === index && styles.activeDayChip]}
                onPress={() => setSelectedDay(index)}
              >
                <Text style={[styles.dayChipText, selectedDay === index && styles.activeDayChipText]}>
                  {item.short}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <View style={styles.monthlyContainer}>
          <View style={styles.monthlyHeader}>
            <Text style={styles.monthlyTitle}>{t('monthly_tasks', state.language)}</Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                confirmAction(
                  t('reset', state.language),
                  t('reset_monthly_confirm', state.language),
                  resetMonthlyTasks,
                  t('reset', state.language),
                  t('cancel', state.language)
                );
              }}
            >
              <Feather name="rotate-ccw" size={12} color="#8A7B66" />
              <Text style={styles.resetButtonText}>{t('reset', state.language)}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.monthlySubtitle}>
            {t('monthly_subtitle', state.language)}
          </Text>
        </View>
      )}
    </View>
  ), [state.language, viewMode, router, selectedDay, resetMonthlyTasks]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={viewMode === 'weekly' ? [weeklyData[selectedDay]] : state.monthlyTasks}
        keyExtractor={(item: any) => (viewMode === 'weekly' ? item.dayInfo.key : item.id)}
        renderItem={viewMode === 'weekly' ? renderWeeklyItem : renderMonthlyItem}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F9F9' },
  container: { flex: 1 },
  content: { paddingVertical: 16, paddingBottom: 32, paddingHorizontal: 16, flexGrow: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 4 },
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
  dayChipText: { color: '#5A6B6B', fontSize: 12, fontWeight: '700' },
  activeDayChipText: { color: '#FFFFFF' },
  dayGroup: { marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#D0E3E3' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#A8C3C8', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxCompleted: { backgroundColor: '#00A3A1', borderColor: '#00A3A1' },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#1A2F2F' },
  completedText: { textDecorationLine: 'line-through', color: '#8E8E93' },
  postponedTag: { fontSize: 11, color: '#00A3A1', marginTop: 2, fontWeight: '500' },
  postponeButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E0F0F0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  postponeText: { fontSize: 11, fontWeight: '600', color: '#00A3A1' },
  guideBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  guideBadgeText: { fontSize: 11, fontWeight: '600', color: '#00A3A1' },
  catchAllBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F4F4' },
  catchAllTitle: { fontSize: 12, fontWeight: '700', color: '#5A6B6B', marginBottom: 8 },
  catchAllItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catchAllItemText: { fontSize: 13, color: '#1A2F2F' },
  emptyText: { fontSize: 12, color: '#8A9A9A', fontStyle: 'italic' },
});
