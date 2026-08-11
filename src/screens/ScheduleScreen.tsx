import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const DAYS = [
  { short: 'LUN', key: 'Lunedì' },
  { short: 'MAR', key: 'Martedì' },
  { short: 'MER', key: 'Mercoledì' },
  { short: 'GIO', key: 'Giovedì' },
  { short: 'VEN', key: 'Venerdì' },
  { short: 'SAB', key: 'Sabato' },
  { short: 'DOM', key: 'Domenica' },
];

export default function ScheduleScreen() {
  const { state, toggleTask } = useAppContext();
  
  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; 
  const [selectedDay, setSelectedDay] = useState(currentDayIndex);

  const pastMissedTasks = state.weeklyTasks.filter(t => {
    if (t.completed || t.type === 'catch-all') return false;
    const taskDayIndex = DAYS.findIndex(d => d.key.toLowerCase() === t.dayOfWeek?.toLowerCase());
    return taskDayIndex !== -1 && taskDayIndex < 4; // Monday to Thursday
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>CALENDARIO SETTIMANALE</Text>
          <TouchableOpacity style={styles.editButton}>
            <Feather name="edit-2" size={12} color="#1A2F2F" />
            <Text style={styles.editButtonText}>Modifica</Text>
          </TouchableOpacity>
        </View>

        {/* Days Filter Bar */}
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

        {/* Tasks List */}
        <View style={styles.cardsList}>
          {DAYS.map((dayInfo) => {
            const isCatchAllDay = dayInfo.key === 'Venerdì';
            const isSunday = dayInfo.key === 'Domenica';
            const dayTasks = state.weeklyTasks.filter(t => t.dayOfWeek?.toLowerCase() === dayInfo.key.toLowerCase());
            
            const itemsToRender = isSunday 
              ? [{ id: 'domenica-task', taskName: 'Solo Daily Tasks', completed: false, day: dayInfo.key }]
              : dayTasks.map(t => ({ id: t.id, taskName: t.title, completed: t.completed, day: dayInfo.key }));

            return itemsToRender.map(item => (
              <View key={`${dayInfo.key}-${item.id}`} style={styles.card}>
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
                      <Text style={styles.badgeCompletedText}>Completato</Text>
                    </View>
                  ) : (
                    <View style={styles.badgePending}>
                      <Text style={styles.badgePendingText}>In corso</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Special Catch-All Box for Friday */}
                {isCatchAllDay && (
                  <View style={styles.catchAllContainer}>
                    <View style={styles.catchAllHeader}>
                      <Feather name="inbox" size={16} color="#8A7B66" />
                      <Text style={styles.catchAllTitle}>VENERDÌ: CATCH-ALL DAY (RECUPERO)</Text>
                    </View>
                    <Text style={styles.catchAllSubtitle}>Task arretrate recuperate automaticamente:</Text>

                    {pastMissedTasks && pastMissedTasks.length > 0 ? (
                      pastMissedTasks.map((task) => (
                        <View key={`catchall-${task.id}`} style={styles.catchAllItem}>
                          <Text style={styles.catchAllItemText}>• {task.title} ({task.dayOfWeek})</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.catchAllEmpty}>🎉 Nessuna task saltata questa settimana!</Text>
                    )}
                  </View>
                )}
              </View>
            ));
          })}
        </View>
      </ScrollView>
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
