import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppContext } from '../context/AppContext';
import { t } from '../i18n';
import { RootStackParamList } from '../types';
import { requestNotificationPermissions, scheduleDailyReminder, cancelAllReminders } from '../services/notificationService';
import { exportAppStatePayload, shareToTelegram } from '../utils/syncUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { state, resetDailyTasks, resetActiveChallenge, factoryReset, toggleNotifications, updateReminderTime, setLanguage, syncTasks, createHousehold, joinHousehold, leaveHousehold } = useAppContext();
  
  const [timeInput, setTimeInput] = useState(state.reminderTime || '09:00');
  
  // Supabase Household State
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [householdNameInput, setHouseholdNameInput] = useState('');
  
  // Sync Modal State
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncTab, setSyncTab] = useState<'telegram' | 'qr'>('telegram');
  const [isScanning, setIsScanning] = useState(false);
  
  // Camera Permissions
  const [permission, requestPermission] = useCameraPermissions();

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert("Permessi Negati", "Devi abilitare le notifiche nelle impostazioni del dispositivo.");
        return;
      }
      await scheduleDailyReminder(timeInput);
      toggleNotifications(true);
    } else {
      await cancelAllReminders();
      toggleNotifications(false);
    }
  };

  const handleTimeBlur = async () => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!regex.test(timeInput)) {
      Alert.alert("Formato non valido", "Inserisci l'ora nel formato HH:mm (es. 09:00)");
      setTimeInput(state.reminderTime);
      return;
    }
    updateReminderTime(timeInput);
    if (state.notificationsEnabled) {
      await scheduleDailyReminder(timeInput);
    }
  };

  const handleResetDaily = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("Vuoi davvero resettare le 5 task giornaliere di oggi?")) {
        resetDailyTasks();
        window.alert("Daily tasks resettate.");
      }
      return;
    }
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
    if (Platform.OS === 'web') {
      if (window.confirm("Vuoi cancellare i progressi della tua sfida attuale? Questa operazione è irreversibile.")) {
        resetActiveChallenge();
        window.alert("Sfida annullata.");
      }
      return;
    }
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
    if (Platform.OS === 'web') {
      if (window.confirm("ATTENZIONE: Questa operazione eliminerà tutti i dati salvati, inclusi i progressi, le sfide e le guide personalizzate. Vuoi continuare?")) {
        factoryReset();
        window.alert("L'app è stata riportata alle impostazioni di fabbrica.");
        navigation.navigate('MainTabs');
      }
      return;
    }
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

  const handleLeaveHousehold = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("Sei sicuro di voler lasciare questa casa? Perderai l'accesso condiviso.")) {
        leaveHousehold();
        window.alert("Hai lasciato la casa.");
      }
      return;
    }
    Alert.alert(
      "Lascia / Elimina Casa",
      "Sei sicuro di voler lasciare questa casa? Perderai l'accesso condiviso.",
      [
        { text: "Annulla", style: "cancel" },
        { text: "Lascia", style: "destructive", onPress: () => {
          leaveHousehold();
        }}
      ]
    );
  };

  const handleScanQRCode = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(t('sync_camera_error', state.language), t('sync_camera_permission', state.language));
        return;
      }
    }
    setIsScanning(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setIsScanning(false);
    setSyncModalVisible(false);
    
    // Check if it's our sync URL
    if (data.startsWith('simplyclean://sync?data=')) {
      const payload = data.split('simplyclean://sync?data=')[1];
      syncTasks(payload);
    } else {
      // Maybe it's just the payload
      syncTasks(data);
    }
  };

  const syncPayload = exportAppStatePayload(state);
  const syncUrl = `simplyclean://sync?data=${syncPayload}`;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 40, paddingBottom: insets.bottom || 20 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A2F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings', state.language)}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>{t('notifications', state.language)}</Text>
        
        <View style={styles.settingItem}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFF4E5' }]}>
            <Feather name="bell" size={20} color="#F39C12" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{t('daily_reminders', state.language)}</Text>
            <Text style={styles.settingDescription}>Ricevi un avviso per il focus quotidiano</Text>
          </View>
          <Switch 
            value={state.notificationsEnabled} 
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#E0EAE9', true: '#00A3A1' }}
          />
        </View>

        {state.notificationsEnabled && (
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t('reminder_time', state.language)}</Text>
              <Text style={styles.settingDescription}>A che ora vuoi ricevere l'avviso?</Text>
            </View>
            <TextInput
              style={styles.timeInput}
              value={timeInput}
              onChangeText={setTimeInput}
              onBlur={handleTimeBlur}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              placeholder="09:00"
            />
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t('language', state.language)}</Text>
        
        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[styles.segmentButton, state.language === 'it' && styles.segmentActive]}
            onPress={() => setLanguage('it')}
          >
            <Text style={[styles.segmentText, state.language === 'it' && styles.segmentTextActive]}>Italiano 🇮🇹</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentButton, state.language === 'en' && styles.segmentActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.segmentText, state.language === 'en' && styles.segmentTextActive]}>English 🇬🇧</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t('data_management', state.language)}</Text>

        <TouchableOpacity style={styles.settingItem} onPress={() => setSyncModalVisible(true)}>
          <View style={[styles.iconContainer, { backgroundColor: '#E0F4FF' }]}>
            <Feather name="refresh-cw" size={20} color="#0099FF" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{t('sync_title', state.language)}</Text>
            <Text style={styles.settingDescription}>Sincronizza lo stato con il tuo partner</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8A9A9A" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleResetDaily}>
          <View style={styles.iconContainer}>
            <Feather name="rotate-ccw" size={20} color="#00A3A1" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{t('reset_daily', state.language)}</Text>
            <Text style={styles.settingDescription}>Azzera le 5 task giornaliere di oggi</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8A9A9A" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleResetChallenge}>
          <View style={styles.iconContainer}>
            <Feather name="x-circle" size={20} color="#E67E22" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{t('reset_challenges', state.language)}</Text>
            <Text style={styles.settingDescription}>Cancella i progressi della sfida in corso</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8A9A9A" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={handleFactoryReset}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFF0F0' }]}>
            <Feather name="trash-2" size={20} color="#FF6B6B" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: '#FF6B6B' }]}>{t('factory_reset', state.language)}</Text>
            <Text style={styles.settingDescription}>Elimina tutti i dati e riporta l'app a zero</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>CASA CONDIVISA (CLOUD)</Text>

        {state.household ? (
          <>
            <View style={styles.settingItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#E0F4FF' }]}>
                <Feather name="home" size={20} color="#0099FF" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{state.household.name || 'La mia Casa'}</Text>
                <Text style={styles.settingDescription}>Codice Invito: {state.household.invite_code}</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={handleLeaveHousehold}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF0F0' }]}>
                <Feather name="log-out" size={20} color="#FF6B6B" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: '#FF6B6B' }]}>Lascia / Elimina Casa</Text>
                <Text style={styles.settingDescription}>Abbandona il gruppo condiviso</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Unisciti a una Casa</Text>
                <TextInput
                  style={styles.textInput}
                  value={inviteCodeInput}
                  onChangeText={setInviteCodeInput}
                  placeholder="Codice Invito (6 lettere)"
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity onPress={() => { if (inviteCodeInput.length === 6) joinHousehold(inviteCodeInput); }} style={[styles.actionButton, inviteCodeInput.length !== 6 && {opacity: 0.5}]}>
                <Text style={styles.actionButtonText}>Unisciti</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Crea nuova Casa</Text>
                <TextInput
                  style={styles.textInput}
                  value={householdNameInput}
                  onChangeText={setHouseholdNameInput}
                  placeholder="Nome (es. Casa Nostra)"
                />
              </View>
              <TouchableOpacity onPress={() => createHousehold(householdNameInput)} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Crea</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sync Modal */}
      <Modal visible={syncModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setSyncModalVisible(false); setIsScanning(false); }}>
        <View style={[styles.modalSafeArea, { paddingTop: insets.top || 40, paddingBottom: insets.bottom || 20 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('sync_title', state.language)}</Text>
            <TouchableOpacity onPress={() => { setSyncModalVisible(false); setIsScanning(false); }}>
              <Ionicons name="close" size={24} color="#1A2F2F" />
            </TouchableOpacity>
          </View>

          {!isScanning ? (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.segmentContainer}>
                <TouchableOpacity 
                  style={[styles.segmentButton, syncTab === 'telegram' && styles.segmentActive]}
                  onPress={() => setSyncTab('telegram')}
                >
                  <Text style={[styles.segmentText, syncTab === 'telegram' && styles.segmentTextActive]}>{t('sync_telegram', state.language)}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.segmentButton, syncTab === 'qr' && styles.segmentActive]}
                  onPress={() => setSyncTab('qr')}
                >
                  <Text style={[styles.segmentText, syncTab === 'qr' && styles.segmentTextActive]}>{t('sync_qr', state.language)}</Text>
                </TouchableOpacity>
              </View>

              {syncTab === 'telegram' ? (
                <View style={styles.syncTabContent}>
                  <View style={styles.previewBox}>
                    <Text style={styles.previewText}>
                      {state.language === 'it' ? '🧹 SimplyClean Sync\n\nHo completato alcune attività in casa! Clicca il link per sincronizzare la nostra app:\n\n' : '🧹 SimplyClean Sync\n\nI completed some chores! Click the link to sync our app:\n\n'}
                      <Text style={{ color: '#0099FF' }}>{syncUrl.substring(0, 40)}...</Text>
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => shareToTelegram(state, state.language)}>
                    <Text style={styles.primaryButtonText}>{t('sync_send_telegram', state.language)}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.syncTabContent}>
                  <View style={styles.qrContainer}>
                    <QRCode
                      value={syncUrl}
                      size={200}
                      color="black"
                      backgroundColor="white"
                    />
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleScanQRCode}>
                    <Text style={styles.primaryButtonText}>{t('sync_scan_qr', state.language)}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }}>
              <CameraView 
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
              />
              <TouchableOpacity style={styles.cancelScanButton} onPress={() => setIsScanning(false)}>
                <Text style={styles.cancelScanText}>{t('sync_cancel', state.language)}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0EAE9' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A2F2F' },
  container: { padding: 20, flexGrow: 1 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#5A6B6B', marginBottom: 16, letterSpacing: 0.5 },
  settingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0EAE9' },
  dangerItem: { borderColor: '#FFEEEE', backgroundColor: '#FFFAFA' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#1A2F2F', marginBottom: 4 },
  settingDescription: { fontSize: 13, color: '#8A9A9A' },
  timeInput: { backgroundColor: '#F0F4F4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, fontWeight: 'bold', color: '#1A2F2F', textAlign: 'center', width: 70 },
  segmentContainer: { flexDirection: 'row', backgroundColor: '#E0EAE9', borderRadius: 16, padding: 4, marginBottom: 12 },
  segmentButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  segmentActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  segmentText: { color: '#5A6B6B', fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: '#1A2F2F', fontWeight: '800' },
  modalSafeArea: { flex: 1, backgroundColor: '#F6F9F9' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0EAE9', backgroundColor: '#FFFFFF' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A2F2F' },
  modalContent: { padding: 20, flexGrow: 1 },
  syncTabContent: { marginTop: 24, flex: 1, alignItems: 'center' },
  previewBox: { backgroundColor: '#E0EAE9', padding: 16, borderRadius: 16, width: '100%', marginBottom: 24 },
  previewText: { color: '#5A6B6B', fontSize: 14, lineHeight: 22 },
  primaryButton: { backgroundColor: '#00A3A1', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center', shadowColor: '#00A3A1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  qrContainer: { padding: 24, backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  cancelScanButton: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  cancelScanText: { color: '#1A2F2F', fontSize: 16, fontWeight: 'bold' },
  textInput: { backgroundColor: '#F0F4F4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1A2F2F', marginTop: 8 },
  actionButton: { backgroundColor: '#00A3A1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginLeft: 12 },
  actionButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
});
