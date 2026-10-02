import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppContext } from '../../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';

export default function ChallengesScreen() {
  const router = useRouter();
  const { state, startChallenge } = useAppContext();
  const activeChallenge = state.activeChallenge;

  const handlePress = (challengeId: '7-day' | '28-day') => {
    if (activeChallenge?.id !== challengeId || activeChallenge.status === 'completed') {
      startChallenge(challengeId);
    }
    router.push({
      pathname: '/challenge-detail',
      params: { challengeId },
    });
  };

  const getChallengeStatusText = (id: string) => {
    if (activeChallenge?.id === id) {
      if (activeChallenge.status === 'completed') return t('challenge_completed', state.language);
      return `${t('challenge_in_progress', state.language)} - ${t('day_progress', state.language)} ${activeChallenge.currentDay} ${t('of', state.language)} ${activeChallenge.durationDays}`;
    }
    return t('challenge_not_started', state.language);
  };

  const getChallengeProgress = (id: string) => {
    if (activeChallenge?.id === id) {
      return (activeChallenge.currentDay / activeChallenge.durationDays) * 100;
    }
    return 0;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>{t('challenges_header', state.language)}</Text>
        
        {/* 7-Day Quick Start Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash" size={24} color="#7A9A8B" />
            <Text style={styles.cardTitle}>7-Day Quick Start</Text>
          </View>
          <Text style={styles.cardDescription}>
            Una settimana intensiva per riportare la tua casa alla base della pulizia Tzerachìa. Perfetta per iniziare!
          </Text>
          <Text style={styles.statusText}>{getChallengeStatusText('7-day')}</Text>
          
          {activeChallenge?.id === '7-day' && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${getChallengeProgress('7-day')}%` }]} />
            </View>
          )}

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handlePress('7-day')}
          >
            <Text style={styles.actionButtonText}>
              {activeChallenge?.id === '7-day' && activeChallenge.status === 'active' ? t('in_progress', state.language) : t('start_challenge', state.language)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 28-Day Challenge Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={24} color="#A8C3C8" />
            <Text style={styles.cardTitle}>28-Day Challenge</Text>
          </View>
          <Text style={styles.cardDescription}>
            Costruisci l'abitudine definitiva. Segui il metodo per un mese intero e trasforma la tua routine per sempre.
          </Text>
          <Text style={styles.statusText}>{getChallengeStatusText('28-day')}</Text>
          
          {activeChallenge?.id === '28-day' && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${getChallengeProgress('28-day')}%` }]} />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#A8C3C8' }]} 
            onPress={() => handlePress('28-day')}
          >
            <Text style={styles.actionButtonText}>
              {activeChallenge?.id === '28-day' && activeChallenge.status === 'active' ? t('in_progress', state.language) : t('start_challenge', state.language)}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F6',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E35',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2C3E35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E35',
    marginLeft: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#556B60',
    lineHeight: 20,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A9A8B',
    marginBottom: 10,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#EAEFEA',
    borderRadius: 4,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7A9A8B',
    borderRadius: 4,
  },
  actionButton: {
    backgroundColor: '#7A9A8B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
