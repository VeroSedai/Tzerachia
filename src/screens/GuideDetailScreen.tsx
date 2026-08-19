import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Recipe, Guide } from '../types';
import TaskItem from '../components/TaskItem';
import TimerWidget from '../components/TimerWidget';
import { useAppContext } from '../context/AppContext';
import { t } from '../i18n';

type RootStackParamList = {
  GuidesList: undefined;
  GuideDetail: { item: Recipe | Guide; type: 'recipe' | 'guide' };
};

type Props = NativeStackScreenProps<RootStackParamList, 'GuideDetail'>;

export default function GuideDetailScreen({ route, navigation }: Props) {
  const { item, type } = route.params;
  const { toggleTimerActive, state, deleteCustomGuide, deleteCustomRecipe, deleteCustomCategory } = useAppContext();
  
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

  const normalizedSteps = React.useMemo(() => {
    const rawSteps = type === 'guide' ? ((item as Guide).steps || (item as any).content) : (item as any).steps;
    if (!rawSteps) return [];
    if (Array.isArray(rawSteps)) {
      return rawSteps.map((s, idx) => {
        if (typeof s === 'string') return { number: idx + 1, title: `Passaggio ${idx + 1}`, description: s };
        return {
          number: s.number || s.step || idx + 1,
          title: s.title || `Passaggio ${idx + 1}`,
          description: s.description || s.text || JSON.stringify(s)
        };
      });
    }
    if (typeof rawSteps === 'string') {
      return (rawSteps as string).split('\n').filter(Boolean).map((line, idx) => ({
        number: idx + 1,
        title: `Passaggio ${idx + 1}`,
        description: line
      }));
    }
    return [];
  }, [item, type]);

  const normalizedIngredients = React.useMemo(() => {
    if (type !== 'recipe') return [];
    const rawIngredients = (item as Recipe).ingredients;
    if (!rawIngredients) return [];
    if (Array.isArray(rawIngredients)) {
      return rawIngredients.map(i => typeof i === 'string' ? i : ((i as any).name || JSON.stringify(i)));
    }
    if (typeof rawIngredients === 'string') {
      return (rawIngredients as string).split('\n').filter(Boolean);
    }
    return [];
  }, [item, type]);

  const isCustom = (item as any).isCustom || !!(item as any).created_by || !!(item as any).household_id || item.id.startsWith('custom-');
  const guideDuration = type === 'guide' ? (item as Guide).duration : undefined;

  const handleDelete = () => {
    const doDelete = () => {
      if (type === 'guide') {
        deleteCustomGuide(item.id);
      } else {
        deleteCustomRecipe(item.id);
      }

      if (item.category && state.customCategories.includes(item.category)) {
        const remainingGuides = state.customGuides.filter(g => g.id !== item.id && g.category === item.category);
        const remainingRecipes = state.customRecipes.filter(r => r.id !== item.id && r.category === item.category);
        if (remainingGuides.length === 0 && remainingRecipes.length === 0) {
          deleteCustomCategory(item.category);
        }
      }

      navigation.goBack();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('confirm_delete', state.language))) {
        doDelete();
      }
      return;
    }

    Alert.alert(
      t('delete', state.language),
      t('confirm_delete', state.language),
      [
        { text: t('cancel', state.language), style: "cancel" },
        { text: t('delete', state.language), style: "destructive", onPress: doDelete }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#1A2F2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{item.title}</Text>
        {isCustom ? (
          <TouchableOpacity onPress={handleDelete} style={styles.backButton}>
            <Feather name="trash-2" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {type === 'recipe' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('ingredients', state.language)}</Text>
            <View style={styles.card}>
              {normalizedIngredients.map((ingredient, index) => (
                <View key={index} style={[styles.ingredientRow, index === normalizedIngredients.length - 1 && { borderBottomWidth: 0 }]}>
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
              <TouchableOpacity style={styles.startButton} onPress={startSession} activeOpacity={0.85}>
                <Ionicons name="play" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>{t('start_guided_session', state.language)}</Text>
                {guideDuration && (
                  <View style={styles.durationBadge}>
                    <Ionicons name="time-outline" size={12} color="#00A3A1" />
                    <Text style={styles.durationBadgeText}>{guideDuration}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <TimerWidget />
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('procedure', state.language)}</Text>
            <View style={styles.card}>
              {normalizedSteps.map((stepItem, index) => {
                const isCompleted = !!checkedItems[`step-${index}`];
                const isLast = index === normalizedSteps.length - 1;
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.stepRow, isLast && { borderBottomWidth: 0 }]}
                    onPress={() => handleToggle(`step-${index}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.stepBadge, isCompleted && styles.stepBadgeCompleted]}>
                      {isCompleted ? (
                        <Feather name="check" size={14} color="#FFFFFF" />
                      ) : (
                        <Text style={styles.stepBadgeText}>{stepItem.number}</Text>
                      )}
                    </View>
                    <Text style={[styles.stepDescription, isCompleted && styles.stepDescriptionCompleted]}>
                      {stepItem.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
    backgroundColor: '#F6F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0EAE9',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1A2F2F',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#D0E3E3',
    elevation: 2,
    shadowColor: '#00A3A1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  ingredientRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F4',
    paddingVertical: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F4',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00A3A1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepBadgeCompleted: {
    backgroundColor: '#8A9A9A',
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepDescription: {
    fontSize: 15,
    color: '#1A2F2F',
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  stepDescriptionCompleted: {
    textDecorationLine: 'line-through',
    color: '#8A9A9A',
  },
  startButton: {
    backgroundColor: '#00A3A1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00A3A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  durationBadge: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  durationBadgeText: {
    color: '#00A3A1',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});
