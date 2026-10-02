import { Alert, Platform } from 'react-native';

/**
 * Displays a cross-platform confirmation dialog that works safely on iOS, Android, and Web.
 */
export const confirmAction = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = 'OK',
  cancelText: string = 'Annulla'
): void => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
};

/**
 * Displays a cross-platform information alert that works safely on iOS, Android, and Web.
 */
export const showAlert = (title: string, message?: string): void => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  Alert.alert(title, message);
};
