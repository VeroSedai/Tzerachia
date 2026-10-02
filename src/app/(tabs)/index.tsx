import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TimerWidget from '../../components/TimerWidget';
import { useAppContext } from '../../context/AppContext';
import { t } from '../../i18n';
import {
  getTodayStr,
  getLastNDays,
  formatDateForPicker,
  formatDisplayDate,
  getTodayWeekdayName,
} from '../../utils/dateUtils';
import { Colors } from '../../constants/theme';

interface DailyTaskItemProps {
  id: string;
  title: string;
  completed: boolean;
  onToggle: (id: string) => void;
}

/**
 * Memoized daily task row item.
 */
const DailyTaskItem = React.memo(function DailyTaskItem({
  id,
  title,
  completed,
  onToggle,
}: DailyTaskItemProps) {
  const handlePress = useCallback(() => {
    onToggle(id);
  }, [id, onToggle]);

  return (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
        {completed && <Feather name="check" size={14} color="#FFFFFF" />}
      </View>
      <Text style={[styles.taskTitle, completed && styles.taskTitleCompleted]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
});

interface CustomTaskItemProps {
  id: string;
  title: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Memoized user-created custom task item.
 */
const CustomTaskItem = React.memo(function CustomTaskItem({
  id,
  title,
  completed,
  onToggle,
  onDelete,
}: CustomTaskItemProps) {
  const handleToggle = useCallback(() => {
    onToggle(id);
  }, [id, onToggle]);

  const handleDelete = useCallback(() => {
    onDelete(id);
  }, [id, onDelete]);

  return (
    <View style={styles.taskCard}>
      <TouchableOpacity
        style={styles.customTaskContent}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
          {completed && <Feather name="check" size={14} color="#FFFFFF" />}
        </View>
        <Text style={[styles.taskTitle, completed && styles.taskTitleCompleted]}>
          {title} <Text style={styles.extraTag}>(Extra)</Text>
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
        <Feather name="trash-2" size={18} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );
});

export default function TodayScreen() {
  const router = useRouter();
  const {
    state,
    toggleTask,
    postponeTaskToFriday,
    addCustomTask,
    toggleCustomTask,
    deleteCustomTask,
    setSelectedDate,
  } = useAppContext();

  const [newCustomTask, setNewCustomTask] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);

  const todayStr = getTodayStr();
  const selectedDate = state.selectedDate || todayStr;
  const isTodaySelected = selectedDate === todayStr;

  const past15Days = useMemo(() => getLastNDays(15), [todayStr]);

  const dateString = useMemo(
    () => formatDisplayDate(selectedDate, state.language),
    [selectedDate, state.language]
  );

  // Italian weekday name for querying weeklyTasks (which uses Italian day names as keys)
  const itDayName = useMemo(() => getTodayWeekdayName('it'), []);
  // Weekday name formatted for display according to active user language
  const displayDayName = useMemo(
    () => getTodayWeekdayName(state.language).toUpperCase(),
    [state.language]
  );

  const focusTask = useMemo(() => {
    return state.weeklyTasks.find(
      t => t.dayOfWeek?.toLowerCase() === itDayName.toLowerCase()
    );
  }, [state.weeklyTasks, itDayName]);

  // Derive daily task completions for the selected date
  const selectedDateCompletedIds = useMemo(() => {
    return isTodaySelected
      ? state.dailyTasks.filter(t => t.completed).map(t => t.id)
      : state.dailyTasksCompletionsByDate[selectedDate] || [];
  }, [isTodaySelected, state.dailyTasks, state.dailyTasksCompletionsByDate, selectedDate]);

  const completedDailyTasksCount = useMemo(() => {
    return state.dailyTasks.filter(t => selectedDateCompletedIds.includes(t.id)).length;
  }, [state.dailyTasks, selectedDateCompletedIds]);

  const todaysCustomTasks = useMemo(() => {
    return state.customTasks.filter(t => t.date === selectedDate);
  }, [state.customTasks, selectedDate]);

  const handleToggleTask = useCallback((id: string) => {
    toggleTask(id);
  }, [toggleTask]);

  const handleToggleCustomTask = useCallback((id: string) => {
    toggleCustomTask(id);
  }, [toggleCustomTask]);

  const handleDeleteCustomTask = useCallback((id: string) => {
    deleteCustomTask(id);
  }, [deleteCustomTask]);

  const handlePostponeFocusTask = useCallback((id: string) => {
    postponeTaskToFriday(id);
  }, [postponeTaskToFriday]);

  const handleAddCustomTask = useCallback(() => {
    if (newCustomTask.trim()) {
      addCustomTask(newCustomTask.trim(), selectedDate);
      setNewCustomTask('');
      setIsAddingCustom(false);
    }
  }, [newCustomTask, addCustomTask, selectedDate]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Custom Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>T</Text>
            </View>
            <Text style={styles.appName}>Tzerachìa</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowHistoryPicker(prev => !prev)}
              style={[styles.headerIconBtn, (showHistoryPicker || !isTodaySelected) && styles.headerIconBtnActive]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={showHistoryPicker || !isTodaySelected ? '#FFFFFF' : '#5A6B6B'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.headerIconBtn}
            >
              <Ionicons name="settings-outline" size={20} color="#5A6B6B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date / History Header */}
        {!showHistoryPicker && isTodaySelected && (
          <Text style={styles.dateText}>{dateString}</Text>
        )}

        {/* 15-Day Date Selector Bar */}
        {(showHistoryPicker || !isTodaySelected) && (
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
        )}

        {/* Selected Date Header Banner if historical */}
        {!isTodaySelected && (
          <TouchableOpacity
            style={styles.historyBanner}
            onPress={() => setSelectedDate(todayStr)}
          >
            <Ionicons name="time-outline" size={16} color={Colors.primary} />
            <Text style={styles.historyBannerText}>
              {t('history_prefix', state.language)} {dateString}
            </Text>
            <View style={styles.historyReturnBtn}>
              <Text style={styles.historyReturnText}>{t('back_to_today', state.language)}</Text>
            </View>
          </TouchableOpacity>
        )}

        {isTodaySelected && <TimerWidget />}

        {/* Daily Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('daily_tasks', state.language)}</Text>
          <Text style={styles.sectionSubtitle}>
            {5 - completedDailyTasksCount} {t('tasks_to_complete', state.language)}
          </Text>
        </View>

        <View style={styles.tasksList}>
          {state.dailyTasks.map(task => {
            const isCompleted = selectedDateCompletedIds.includes(task.id);
            return (
              <DailyTaskItem
                key={task.id}
                id={task.id}
                title={task.title}
                completed={isCompleted}
                onToggle={handleToggleTask}
              />
            );
          })}
          {todaysCustomTasks.map(task => (
            <CustomTaskItem
              key={task.id}
              id={task.id}
              title={task.title}
              completed={task.completed}
              onToggle={handleToggleCustomTask}
              onDelete={handleDeleteCustomTask}
            />
          ))}
        </View>

        {isAddingCustom ? (
          <View style={styles.customInputRow}>
            <TextInput
              style={styles.customTextInput}
              placeholder={t('new_extra_placeholder', state.language)}
              value={newCustomTask}
              onChangeText={setNewCustomTask}
              onSubmitEditing={handleAddCustomTask}
              autoFocus
            />
            <TouchableOpacity onPress={handleAddCustomTask} style={styles.confirmCustomBtn}>
              <Feather name="check" size={16} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsAddingCustom(false)} style={styles.cancelCustomBtn}>
              <Feather name="x" size={16} color="#5A6B6B" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addCustomBtn}
            onPress={() => setIsAddingCustom(true)}
          >
            <Feather name="plus" size={16} color={Colors.primary} />
            <Text style={styles.addCustomBtnText}>{t('add_task_btn', state.language)}</Text>
          </TouchableOpacity>
        )}

        {/* Focus of the day (Show on Today) */}
        {isTodaySelected && (
          <>
            <Text style={[styles.sectionTitle, styles.focusSectionTitle]}>
              {t('weekly_focus', state.language)}
            </Text>

            <View style={styles.focusCard}>
              <View style={styles.focusHeader}>
                <Ionicons name="sparkles-outline" size={16} color="#8A7B66" />
                <Text style={styles.focusDayName}>{displayDayName}</Text>
              </View>
              {focusTask && !focusTask.postponed ? (
                <TouchableOpacity
                  style={styles.focusTaskRow}
                  onPress={() => handleToggleTask(focusTask.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.focusCheckbox,
                      focusTask.completed && styles.focusCheckboxCompleted,
                    ]}
                  >
                    {focusTask.completed && <Feather name="check" size={14} color="#FFFFFF" />}
                  </View>
                  <Text
                    style={[
                      styles.focusTitle,
                      focusTask.completed && styles.focusTitleCompleted,
                    ]}
                  >
                    {focusTask.title}
                  </Text>
                  {focusTask.completed && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>
                        {t('completed', state.language)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.focusTitle}>
                  {focusTask ? focusTask.title : t('no_tasks_today', state.language)}
                </Text>
              )}

              <Text style={styles.focusDescription}>
                {focusTask
                  ? focusTask.completed
                    ? t('focus_completed_msg', state.language)
                    : t('focus_in_progress_msg', state.language)
                  : t('rest_day_msg', state.language)}
              </Text>

              {focusTask && (
                <View>
                  {focusTask.postponed ? (
                    <View style={styles.postponedBadgeContainer}>
                      <Ionicons name="calendar-outline" size={14} color="#5A6B6B" />
                      <Text style={styles.postponedBadgeText}>
                        {t('postponed', state.language)}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.guideCard}
                        onPress={() => router.push('/(tabs)/guides')}
                      >
                        <View style={styles.guideCheckbox} />
                        <Text style={styles.guideText}>
                          {t('open_guide_prefix', state.language)} {focusTask.title}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#8A7B66"
                          style={{ marginLeft: 'auto' }}
                        />
                      </TouchableOpacity>

                      {!focusTask.completed &&
                        focusTask.dayOfWeek?.toLowerCase() !== 'venerdì' &&
                        focusTask.dayOfWeek?.toLowerCase() !== 'domenica' && (
                          <TouchableOpacity
                            style={styles.postponeButton}
                            onPress={() => handlePostponeFocusTask(focusTask.id)}
                          >
                            <Ionicons name="time-outline" size={16} color="#5A6B6B" />
                            <Text style={styles.postponeButtonText}>
                              {t('postpone_to_friday', state.language)}
                            </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F9',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
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
    backgroundColor: Colors.primary,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datePickerContainer: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    borderColor: Colors.border,
    alignItems: 'center',
    minWidth: 70,
  },
  datePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    color: Colors.primaryLight,
  },
  historyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  historyBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginLeft: 6,
    flex: 1,
  },
  historyReturnBtn: {
    backgroundColor: Colors.primary,
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
    borderColor: Colors.border,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primaryMuted,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
  customTaskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  extraTag: {
    fontSize: 12,
    color: '#8A7B66',
  },
  deleteButton: {
    padding: 4,
  },
  customInputRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  customTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  confirmCustomBtn: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 16,
  },
  cancelCustomBtn: {
    backgroundColor: '#F0F4F4',
    padding: 12,
    borderRadius: 16,
    marginLeft: 8,
  },
  addCustomBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addCustomBtnText: {
    marginLeft: 6,
    color: Colors.primary,
    fontWeight: '600',
  },
  focusSectionTitle: {
    marginTop: 24,
    marginBottom: 12,
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
  focusTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  focusCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C0B3A0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCheckboxCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  focusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A2E1A',
    marginBottom: 6,
  },
  focusTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8A9A9A',
  },
  completedBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 12,
  },
  completedBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  focusDescription: {
    fontSize: 14,
    color: '#5C4E3A',
    lineHeight: 20,
    marginBottom: 16,
  },
  postponedBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
  },
  postponedBadgeText: {
    fontSize: 14,
    color: '#5A6B6B',
    fontWeight: '500',
    marginLeft: 8,
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
  postponeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#F0F4F4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0EAE9',
  },
  postponeButtonText: {
    fontSize: 14,
    color: '#5A6B6B',
    fontWeight: '600',
    marginLeft: 6,
  },
});
