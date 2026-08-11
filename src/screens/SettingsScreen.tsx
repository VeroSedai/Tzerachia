import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { resetDailyTasks, resetActiveChallenge, factoryReset } = useAppContext();

  const handleResetDaily = () => {
    Alert.alert(
      "Resetta Daily Tasks",
      "Vuoi davvero resettare le 5 task giornaliere di oggi?",
      [
        { text: "Annulla", style: "cancel" },
        { text: "Resetta", style: "destructive", onPress: () => {
          resetDailyTasks();
          Alert.alert("Successo", "Daily tasks resettate.");
        }}
      ]
    );
  };

  const handleResetChallenge = () => {
    Alert.alert(
      "Resetta Sfida Attiva",
      "Vuoi cancellare i progressi della tua sfida attuale? Questa operazione è irreversibile.",
      [
        { text: "Annulla", style: "cancel" },
        { text: "Resetta", style: "destructive", onPress: () => {
          resetActiveChallenge();
          Alert.alert("Successo", "Sfida annullata.");
        }}
      ]
    );
  };

  const handleFactoryReset = () => {
    Alert.alert(
      "Ripristina Impostazioni di Fabbrica",
      "ATTENZIONE: Questa operazione eliminerà tutti i dati salvati, inclusi i progressi, le sfide e le guide personalizzate. Vuoi continuare?",
      [
        { text: "Annulla", style: "cancel" },
        { text: "Ripristina Tutto", style: "destructive", onPress: () => {
          factoryReset();
          Alert.alert("Successo", "L'app è stata riportata alle impostazioni di fabbrica.");
          navigation.navigate('MainTabs');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A2F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Impostazioni</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>GESTIONE DATI</Text>

        <TouchableOpacity style={styles.settingItem} onPress={handleResetDaily}>
          <View style={styles.iconContainer}>
            <Feather name="rotate-ccw" size={20} color="#00A3A1" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Resetta Daily Tasks</Text>
            <Text style={styles.settingDescription}>Azzera le 5 task giornaliere di oggi</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8A9A9A" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleResetChallenge}>
          <View style={styles.iconContainer}>
            <Feather name="x-circle" size={20} color="#E67E22" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Resetta Sfida Attiva</Text>
            <Text style={styles.settingDescription}>Cancella i progressi della sfida in corso</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8A9A9A" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={handleFactoryReset}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFF0F0' }]}>
            <Feather name="trash-2" size={20} color="#FF6B6B" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: '#FF6B6B' }]}>Ripristina Impostazioni</Text>
            <Text style={styles.settingDescription}>Elimina tutti i dati e riporta l'app a zero</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0EAE9' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A2F2F' },
  container: { padding: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#5A6B6B', marginBottom: 16, letterSpacing: 0.5 },
  settingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0EAE9' },
  dangerItem: { borderColor: '#FFEEEE', backgroundColor: '#FFFAFA' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#1A2F2F', marginBottom: 4 },
  settingDescription: { fontSize: 13, color: '#8A9A9A' }
});