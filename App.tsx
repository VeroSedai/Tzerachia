import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { TimerProvider } from './src/context/TimerContext';
import AppNavigator from './src/navigation/AppNavigator';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

export default function App() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppProvider>
          <TimerProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </TimerProvider>
        </AppProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F6F9F9',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#00A3A1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
