import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { t } from '../i18n';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TimerWidget() {
  const { state, toggleTimerActive, setTimer } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const minutes = Math.floor(state.timerDuration / 60);
  const seconds = state.timerDuration % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progressPercent = Math.max(0, Math.min(100, (state.timerDuration / (15 * 60)) * 100));

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
  };

  if (!isExpanded) {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity style={styles.compactHeader} onPress={toggleExpand} activeOpacity={0.8}>
          <View style={styles.compactLeft}>
            <Ionicons name="time-outline" size={18} color="#00A3A1" />
            <Text style={styles.compactTitle}>{t('session_timer', state.language)}</Text>
            <Text style={styles.compactTimeText}>{timeFormatted}</Text>
          </View>
          <View style={styles.compactRight}>
            <TouchableOpacity 
              style={styles.compactPlayBtn} 
              onPress={(e) => {
                e.stopPropagation();
                toggleTimerActive();
              }}
            >
              <Ionicons name={state.timerActive ? 'pause' : 'play-outline'} size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Ionicons name="chevron-down" size={18} color="#00A3A1" style={{ marginLeft: 8 }} />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpand} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="time-outline" size={16} color="#FFFFFF" />
          <Text style={styles.headerText}>{t('session_timer', state.language).toUpperCase()}</Text>
        </View>
        <Ionicons name="chevron-up" size={18} color="#FFFFFF" />
      </TouchableOpacity>
      
      <Text style={styles.timeText}>{timeFormatted}</Text>
      
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.playButton} onPress={toggleTimerActive}>
          <Ionicons name={state.timerActive ? 'pause' : 'play-outline'} size={18} color="#00A3A1" />
          <Text style={styles.playButtonText}>{state.timerActive ? t('pause_timer', state.language) : t('start_timer', state.language)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={() => {
            if (state.timerActive) toggleTimerActive();
            setTimer(15 * 60);
          }}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.resetButtonText}>{t('reset', state.language)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D0E3E3',
    marginBottom: 16,
    overflow: 'hidden',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2F2F',
  },
  compactTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00A3A1',
    marginLeft: 4,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactPlayBtn: {
    backgroundColor: '#00A3A1',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#00A3A1',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#00A3A1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
