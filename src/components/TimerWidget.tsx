import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

export default function TimerWidget() {
  const { state, toggleTimerActive, setTimer } = useAppContext();
  
  const minutes = Math.floor(state.timerDuration / 60);
  const seconds = state.timerDuration % 60;
  const progressPercent = Math.max(0, Math.min(100, (state.timerDuration / (15 * 60)) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={16} color="#FFFFFF" />
        <Text style={styles.headerText}>TIMER SESSIONE</Text>
      </View>
      <Text style={styles.timeText}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </Text>
      
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.playButton} onPress={toggleTimerActive}>
          <Ionicons name={state.timerActive ? 'pause' : 'play-outline'} size={18} color="#00A3A1" />
          <Text style={styles.playButtonText}>{state.timerActive ? 'Pausa' : 'Avvia Timer'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={() => {
            if (state.timerActive) toggleTimerActive();
            setTimer(15 * 60);
          }}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#00A3A1',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#00A3A1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  playButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  playButtonText: {
    color: '#00A3A1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  resetButton: {
    flex: 0.4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});
