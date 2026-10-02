import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppContext } from '../context/AppContext';
import { t } from '../i18n';
import { requestNotificationPermissions, scheduleDailyReminder, cancelAllReminders } from '../services/notificationService';
import { exportAppStatePayload, shareToTelegram } from '../utils/syncUtils';
import { confirmAction, showAlert } from '../utils/alertUtils';

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    state, 
    resetDailyTasks, 
    resetActiveChallenge, 
    factoryReset, 
    toggleNotifications, 
    updateReminderTime, 
    setLanguage, 
    syncTasks, 
    createHousehold, 
    joinHousehold, 
    leaveHousehold 
  } = useAppContext();
  
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

  const handleFactoryReset = () => {
    confirmAction(
      t('factory_reset', state.language),
      t('factory_reset_confirm', state.language),
      () => {
        factoryReset();
      },
      t('delete', state.language),
      t('cancel', state.language)
    );
  };

  const handleCreateHousehold = async () => {
    if (!householdNameInput.trim()) {
      showAlert(t('error', state.language), "Inserisci un nome per la casa");
      return;
    }
    try {
      await createHousehold(householdNameInput.trim());
      setHouseholdNameInput('');
      showAlert(t('success', state.language), "Casa creata con successo!");
    } catch (e: any) {
      showAlert(t('error', state.language), e.message || "Errore nella creazione");
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCodeInput.trim()) {
      showAlert(t('error', state.language), "Inserisci il codice invito");
      return;
    }
    try {
      await joinHousehold(inviteCodeInput.trim());
      setInviteCodeInput('');
      showAlert(t('success', state.language), "Ti sei unito alla casa!");
    } catch (e: any) {
      showAlert(t('error', state.language), e.message || "Codice non valido");
    }
  };

  const handleLeaveHousehold = () => {
    confirmAction(
      t('leave_household', state.language),
      "Sei sicuro di voler abbandonare la casa condivisa?",
      async () => {
        try {
          await leaveHousehold();
          showAlert(t('success', state.language), "Hai lasciato la casa.");
        } catch (e: any) {
          showAlert(t('error', state.language), e.message || "Errore");
        }
      },
      t('delete', state.language),
      t('cancel', state.language)
    );
  };

  const handleStartScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
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
    if (data.startsWith('tzerachia://sync?data=')) {
      const payload = data.split('tzerachia://sync?data=')[1];
      syncTasks(payload);
    } else {
      // Maybe it's just the payload
      syncTasks(data);
    }
  };

  const syncPayload = exportAppStatePayload(state);
  const syncUrl = `tzerachia://sync?data=${syncPayload}`;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A2F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings', state.language)}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Language Section */}
        <Text style={styles.sectionHeader}>{t('language', state.language)}</Text>
        <View style={styles.card}>
          <View style={styles.languageRow}>
            <TouchableOpacity 
              style={[styles.langBtn, state.language === 'it' && styles.langBtnActive]}
              onPress={() => setLanguage('it')}
            >
              <Text style={[styles.langBtnText, state.language === 'it' && styles.langBtnTextActive]}>Italiano 🇮🇹</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langBtn, state.language === 'en' && styles.langBtnActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langBtnText, state.language === 'en' && styles.langBtnTextActive]}>English 🇬🇧</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync Section */}
        <Text style={styles.sectionHeader}>{t('sync_title', state.language)}</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.syncButtonRow} 
            onPress={() => setSyncModalVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F0F0' }]}>
                <Ionicons name="sync-outline" size={20} color="#00A3A1" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.itemTitle}>{t('sync_title', state.language)}</Text>
                <Text style={styles.itemSubtitle}>{t('sync_subtitle', state.language)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C0B3A0" />
          </TouchableOpacity>
        </View>

        {/* Supabase Household Section */}
        <Text style={styles.sectionHeader}>{t('shared_household', state.language)}</Text>
        <View style={styles.card}>
          {state.household ? (
            <View style={{ paddingVertical: 4 }}>
              <View style={styles.householdHeader}>
                <View>
                  <Text style={styles.householdName}>{state.household.name || t('my_household', state.language)}</Text>
                  <Text style={styles.inviteCodeLabel}>{t('invite_code_label', state.language)} <Text style={styles.inviteCode}>{state.household.invite_code}</Text></Text>
                </View>
                <TouchableOpacity onPress={handleLeaveHousehold} style={styles.leaveBtn}>
                  <Text style={styles.leaveBtnText}>{t('leave_household', state.language)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 4 }}>
              {/* Join Household */}
              <Text style={styles.subHeader}>{t('join_household_title', state.language)}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('join_household_placeholder', state.language)}
                  placeholderTextColor="#8A7B66"
                  value={inviteCodeInput}
                  onChangeText={setInviteCodeInput}
                  autoCapitalize="characters"
                  maxLength={6}
                />
                <TouchableOpacity style={styles.actionBtn} onPress={handleJoinHousehold}>
                  <Text style={styles.actionBtnText}>{t('join_btn', state.language)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Create Household */}
              <Text style={styles.subHeader}>{t('create_household_title', state.language)}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('create_household_placeholder', state.language)}
                  placeholderTextColor="#8A7B66"
                  value={householdNameInput}
                  onChangeText={setHouseholdNameInput}
                />
                <TouchableOpacity style={styles.actionBtn} onPress={handleCreateHousehold}>
                  <Text style={styles.actionBtnText}>{t('create_btn', state.language)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <Text style={styles.sectionHeader}>{t('notifications', state.language)}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{t('daily_reminders', state.language)}</Text>
              <Text style={styles.itemSubtitle}>Ricevi una notifica all'orario stabilito</Text>
            </View>
            <Switch
              value={state.notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#D0E3E3', true: '#00A3A1' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{t('reminder_time', state.language)}</Text>
              <Text style={styles.itemSubtitle}>Formato 24 ore (es. 09:00)</Text>
            </View>
            <TextInput
              style={styles.timeInput}
              value={timeInput}
              onChangeText={setTimeInput}
              onBlur={handleTimeBlur}
              placeholder="09:00"
              placeholderTextColor="#8A7B66"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <Text style={styles.sectionHeader}>{t('data_management', state.language)}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={resetDailyTasks}>
            <View>
              <Text style={styles.itemTitle}>{t('reset_daily', state.language)}</Text>
              <Text style={styles.itemSubtitle}>{t('reset_daily_sub', state.language)}</Text>
            </View>
            <Feather name="refresh-cw" size={18} color="#5A6B6B" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={resetActiveChallenge}>
            <View>
              <Text style={styles.itemTitle}>{t('reset_challenges', state.language)}</Text>
              <Text style={styles.itemSubtitle}>{t('reset_challenges_sub', state.language)}</Text>
            </View>
            <Feather name="rotate-ccw" size={18} color="#5A6B6B" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleFactoryReset}>
            <View>
              <Text style={[styles.itemTitle, { color: '#FF6B6B' }]}>{t('factory_reset', state.language)}</Text>
              <Text style={styles.itemSubtitle}>{t('factory_reset_sub', state.language)}</Text>
            </View>
            <Feather name="trash-2" size={18} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Tzerachìa v1.1.0 • Simply Clean Routine</Text>
      </ScrollView>

      {/* Sync Modal */}
      <Modal
        visible={syncModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setSyncModalVisible(false);
          setIsScanning(false);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F9F9' }}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => {
                setSyncModalVisible(false);
                setIsScanning(false);
              }} 
              style={styles.backButton}
            >
              <Ionicons name="close" size={24} color="#1A2F2F" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('sync_title', state.language)}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Tab Selector */}
          <View style={styles.syncTabRow}>
            <TouchableOpacity 
              style={[styles.syncTabBtn, syncTab === 'telegram' && styles.syncTabBtnActive]}
              onPress={() => {
                setSyncTab('telegram');
                setIsScanning(false);
              }}
            >
              <Text style={[styles.syncTabText, syncTab === 'telegram' && styles.syncTabTextActive]}>
                {t('sync_telegram', state.language)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.syncTabBtn, syncTab === 'qr' && styles.syncTabBtnActive]}
              onPress={() => setSyncTab('qr')}
            >
              <Text style={[styles.syncTabText, syncTab === 'qr' && styles.syncTabTextActive]}>
                {t('sync_qr', state.language)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, padding: 20 }}>
            {syncTab === 'telegram' ? (
              <View style={styles.telegramContainer}>
                <View style={styles.telegramCard}>
                  <Ionicons name="paper-plane-outline" size={48} color="#00A3A1" />
                  <Text style={styles.syncDescTitle}>{t('sync_send_telegram', state.language)}</Text>
                  <Text style={styles.syncDescText}>
                    Invia lo stato delle tue attività su Telegram al tuo partner. Cliccando il link ricevuto, l'app sincronizzerà i progressi.
                  </Text>
                  <TouchableOpacity 
                    style={styles.telegramButton}
                    onPress={() => shareToTelegram(state, state.language)}
                  >
                    <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.telegramButtonText}>{t('sync_send_telegram', state.language)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.qrContainer}>
                {isScanning ? (
                  <View style={styles.scannerWrapper}>
                    <CameraView
                      style={StyleSheet.absoluteFill}
                      facing="back"
                      barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                      }}
                      onBarcodeScanned={handleBarCodeScanned}
                    />
                    <TouchableOpacity 
                      style={styles.cancelScanBtn}
                      onPress={() => setIsScanning(false)}
                    >
                      <Text style={styles.cancelScanText}>{t('sync_cancel', state.language)}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
                    <Text style={styles.qrTitle}>Fai inquadrare questo codice</Text>
                    <Text style={styles.qrSubtitle}>L'altro dispositivo aggiornerà le attività istantaneamente.</Text>
                    
                    <View style={styles.qrWrapper}>
                      <QRCode
                        value={syncUrl}
                        size={220}
                        color="#1A2F2F"
                        backgroundColor="#FFFFFF"
                      />
                    </View>

                    <TouchableOpacity 
                      style={styles.scanButton}
                      onPress={handleStartScan}
                    >
                      <Ionicons name="camera-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.scanButtonText}>{t('sync_scan_qr', state.language)}</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2F2F',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8A9A9A',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D0E3E3',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F0F4F4',
    borderWidth: 1,
    borderColor: '#E0EAE9',
  },
  langBtnActive: {
    backgroundColor: '#00A3A1',
    borderColor: '#00A3A1',
  },
  langBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B6B',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
  },
  syncButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F4',
    marginVertical: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2F2F',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#8A9A9A',
  },
  timeInput: {
    backgroundColor: '#F0F4F4',
    borderWidth: 1,
    borderColor: '#D0E3E3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2F2F',
    textAlign: 'center',
    width: 80,
  },
  versionText: {
    textAlign: 'center',
    color: '#8A9A9A',
    fontSize: 12,
    marginTop: 24,
  },
  householdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  householdName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2F2F',
  },
  inviteCodeLabel: {
    fontSize: 13,
    color: '#5A6B6B',
    marginTop: 2,
  },
  inviteCode: {
    fontWeight: 'bold',
    color: '#00A3A1',
    letterSpacing: 1,
  },
  leaveBtn: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  leaveBtnText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  subHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B6B',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F0F4F4',
    borderWidth: 1,
    borderColor: '#D0E3E3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1A2F2F',
  },
  actionBtn: {
    backgroundColor: '#00A3A1',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  syncTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  syncTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0E3E3',
  },
  syncTabBtnActive: {
    backgroundColor: '#00A3A1',
    borderColor: '#00A3A1',
  },
  syncTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B6B',
  },
  syncTabTextActive: {
    color: '#FFFFFF',
  },
  telegramContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  telegramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0E3E3',
    width: '100%',
  },
  syncDescTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginTop: 16,
    marginBottom: 8,
  },
  syncDescText: {
    fontSize: 14,
    color: '#5A6B6B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  telegramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A3A1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
  },
  telegramButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrContainer: {
    flex: 1,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 13,
    color: '#8A9A9A',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D0E3E3',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A3A1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scannerWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  cancelScanBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  cancelScanText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
