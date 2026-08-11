import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

try {
  // Set the handler so notifications show up in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
} catch (e) {
  console.warn("Notifications non supportate in questo ambiente.", e);
}

export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.warn("Impossibile richiedere i permessi per le notifiche (forse sei su Expo Go Android SDK 53+):", error);
    return false;
  }
};

export const scheduleDailyReminder = async (timeString: string) => {
  try {
    // Cancel any existing notifications first to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const [hourStr, minuteStr] = timeString.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute)) {
      console.error("Invalid time format passed to scheduleDailyReminder. Expected HH:mm");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Simply Clean 🧹",
        body: "È ora dei 15 minuti di Focus! Dai un'occhiata alle task di oggi.",
        sound: true,
      },
      trigger: {
        hour: hour,
        minute: minute,
        repeats: true,
      } as any,
    });
  } catch (error) {
    console.warn("Impossibile programmare la notifica:", error);
  }
};

export const cancelAllReminders = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn("Impossibile cancellare le notifiche:", error);
  }
};
