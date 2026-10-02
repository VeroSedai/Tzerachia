import 'react-native-url-polyfill/auto';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';
import { TimerProvider } from '../context/TimerContext';


interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Root error boundary to catch and report runtime crashes gracefully.
 */
class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary] Unhandled exception:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Si è verificato un problema inatteso</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message || 'Errore sconosciuto'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRestart} activeOpacity={0.8}>
            <Text style={styles.retryText}>Riavvia Applicazione</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppProvider>
          <TimerProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ presentation: 'card', headerShown: false }} />
              <Stack.Screen name="edit-schedule" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="add-guide" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="guide-detail" options={{ presentation: 'card', headerShown: false }} />
              <Stack.Screen name="challenge-detail" options={{ presentation: 'card', headerShown: false }} />
            </Stack>
          </TimerProvider>
        </AppProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#F6F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#5A6B6B',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#00A3A1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
