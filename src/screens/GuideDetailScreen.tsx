import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Recipe, Guide } from '../types';
import TaskItem from '../components/TaskItem';
import TimerWidget from '../components/TimerWidget';
import { useAppContext } from '../context/AppContext';

type RootStackParamList = {
  GuidesList: undefined;
  GuideDetail: { item: Recipe | Guide; type: 'recipe' | 'guide' };
};

type Props = NativeStackScreenProps<RootStackParamList, 'GuideDetail'>;

export default function GuideDetailScreen({ route, navigation }: Props) {
  const { item, type } = route.params;
  const { toggleTimerActive, state } = useAppContext();
  
  // Local state for checking off ingredients or steps
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [sessionActive, setSessionActive] = useState(false);

  const handleToggle = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startSession = () => {
    setSessionActive(true);
    if (!state.timerActive) {
      toggleTimerActive();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom Header to go back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2C3E35" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{item.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {type === 'recipe' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredienti</Text>
            <View style={styles.card}>
              {(item as Recipe).ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <TaskItem 
                    title={ingredient} 
                    completed={!!checkedItems[`ingredient-${index}`]} 
                    onToggle={() => handleToggle(`ingredient-${index}`)} 
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {type === 'guide' && (
          <View style={styles.section}>
            {!sessionActive ? (
              <TouchableOpacity style={styles.startButton} onPress={startSession}>
                <Ionicons name="play" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>Start Guided Session</Text>
              </TouchableOpacity>
            ) : (
              <TimerWidget />
            )}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Procedura</Text>
            <View style={styles.card}>
              {(item as Guide).steps.map((stepItem, index) => (
                <View key={index} style={styles.stepRow}>
                  <Text style={styles.stepNumber}>{stepItem.step}.</Text>
                  <View style={{ flex: 1 }}>
                    <TaskItem 
                      title={stepItem.description} 
                      completed={!!checkedItems[`step-${index}`]} 
                      onToggle={() => handleToggle(`step-${index}`)} 
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E35',
  },
  container: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E35',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#2C3E35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  ingredientRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 5,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7A9A8B',
    marginRight: 10,
    marginTop: 12, // Align with TaskItem text
  },
  startButton: {
    backgroundColor: '#7A9A8B', // Soft Sage Green
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7A9A8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
