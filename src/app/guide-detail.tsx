import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Recipe, Guide } from '../types';
import TaskItem from '../components/TaskItem';
import TimerWidget from '../components/TimerWidget';
import { useAppContext } from '../context/AppContext';
import { useTimerContext } from '../context/TimerContext';
import { t } from '../i18n';
import { confirmAction } from '../utils/alertUtils';
import { Colors } from '../constants/theme';

export default function GuideDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ item: string; type: 'recipe' | 'guide' }>();
  
  const type = params.type || 'guide';
  const item: Recipe | Guide = useMemo(() => {
    try {
      return typeof params.item === 'string' ? JSON.parse(params.item) : (params.item || { id: '', title: '' });
    } catch {
      return { id: '', title: '' };
    }
  }, [params.item]);

  const { state, deleteCustomGuide, deleteCustomRecipe, deleteCustomCategory } = useAppContext();
  const { timerActive, toggleTimerActive } = useTimerContext();
  
  // Local state for checking off ingredients or steps
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [sessionActive, setSessionActive] = useState(false);

  const handleToggle = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startSession = () => {
    setSessionActive(true);
    if (!timerActive) {
      toggleTimerActive();
    }
  };

  const normalizedSteps = useMemo(() => {
    const rawSteps = type === 'guide'
      ? (item as Guide).steps || (item as Guide).content
      : (item as Recipe).steps;
    if (!rawSteps) return [];
    const stepPrefix = t('step_prefix', state.language);

    if (Array.isArray(rawSteps)) {
      return rawSteps.map((s, idx) => {
        if (typeof s === 'string') {
          return { number: idx + 1, title: `${stepPrefix} ${idx + 1}`, description: s };
        }
        return {
          number: s.number || s.step || idx + 1,
          title: s.title || `${stepPrefix} ${idx + 1}`,
          description: s.description || s.text || JSON.stringify(s),
        };
      });
    }
    if (typeof rawSteps === 'string') {
      return rawSteps.split('\n').filter(Boolean).map((line, idx) => ({
        number: idx + 1,
        title: `${stepPrefix} ${idx + 1}`,
        description: line,
      }));
    }
    return [];
  }, [item, type, state.language]);

  const normalizedIngredients = useMemo(() => {
    if (type !== 'recipe') return [];
    const rawIngredients = (item as Recipe).ingredients;
    if (!rawIngredients) return [];
    if (Array.isArray(rawIngredients)) {
      return rawIngredients.map(i => (typeof i === 'string' ? i : JSON.stringify(i)));
    }
    if (typeof rawIngredients === 'string') {
      return rawIngredients.split('\n').filter(Boolean);
    }
    return [];
  }, [item, type]);

  const isCustom = item.isCustom || !!item.created_by || !!item.household_id || item.id.startsWith('custom-');
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

      router.back();
    };

    confirmAction(
      t('delete', state.language),
      t('confirm_delete', state.language),
      doDelete,
      t('delete', state.language),
      t('cancel', state.language)
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
                    <Ionicons name="time-outline" size={12} color={Colors.primary} />
                    <Text style={styles.durationBadgeText}>{guideDuration}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <TimerWidget />
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('procedure', state.language)}</Text>
            <View style={styles.card}>
              {normalizedSteps.map((step, index) => (
                <View key={index} style={[styles.stepRow, index === normalizedSteps.length - 1 && { borderBottomWidth: 0 }]}>
                  <TouchableOpacity 
                    style={styles.stepHeader}
                    onPress={() => handleToggle(`step-${index}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, checkedItems[`step-${index}`] && styles.checkboxCompleted]}>
                      {checkedItems[`step-${index}`] && <Feather name="check" size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.stepNumber, checkedItems[`step-${index}`] && styles.stepCompletedText]}>
                      {step.title}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepDescription, checkedItems[`step-${index}`] && styles.stepDescCompleted]}>
                    {step.description}
                  </Text>
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
    backgroundColor: '#F6F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0EAE9',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F2F',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  ingredientRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F4',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  durationBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  stepRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F4',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primaryMuted,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A2F2F',
  },
  stepCompletedText: {
    textDecorationLine: 'line-through',
    color: '#8A9A9A',
  },
  stepDescription: {
    fontSize: 14,
    color: '#5A6B6B',
    lineHeight: 20,
    paddingLeft: 32,
  },
  stepDescCompleted: {
    color: '#A0B0B0',
  },
});
