import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  try {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    );
  } catch (error) {
    console.error("Errore critico durante l'avvio dell'app:", error);
    return null;
  }
}
