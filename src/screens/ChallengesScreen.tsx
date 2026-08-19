import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppContext } from '../context/AppContext';
import { RootStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../i18n';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ChallengesList'>;
};

export default function ChallengesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { state, startChallenge } = useAppContext();
  const activeChallenge = state.activeChallenge;

  const handlePress = (challengeId: '7-day' | '28-day') => {
    if (activeChallenge?.id === challengeId && activeChallenge.status !== 'completed') {
      navigation.navigate('ChallengeDetail', { challengeId });
    } else {
      startChallenge(challengeId);
      navigation.navigate('ChallengeDetail', { challengeId });
    }
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
    <View style={[styles.safeArea, { paddingTop: insets.top || 40, paddingBottom: insets.bottom || 20 }]}>
      <ScrollView contentContainerStyle={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F6',
  },
  container: {
    padding: 20,
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
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E35',
    marginBottom: 10,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7A9A8B',
  },
  actionButton: {
    backgroundColor: '#7A9A8B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
