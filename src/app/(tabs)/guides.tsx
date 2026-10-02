import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import { t } from '../../i18n';
import { Recipe, Guide } from '../../types';
import { guides as defaultGuides, recipes as defaultRecipes } from '../../data/guidesAndRecipes';

const DEFAULT_CATEGORIES = [
  { label: 'Detergenti Fai-da-te', icon: 'droplet' },
  { label: 'Speed Cleaning', icon: 'zap' },
  { label: 'Cucina', icon: 'coffee' },
  { label: 'Bagno', icon: 'life-buoy' },
  { label: 'Tessili & Divani', icon: 'layout' }
];

interface GuideItemProps {
  item: Recipe | Guide;
  type: 'recipe' | 'guide';
  language: 'it' | 'en';
  onPress: () => void;
}

const GuideItem = React.memo(({ item, type, language, onPress }: GuideItemProps) => {
  const subtitle = useMemo(() => {
    if (type === 'recipe') {
      const recipe = item as Recipe;
      return recipe.category || t('diy_recipe', language);
    }
    const guide = item as Guide;
    return guide.duration || guide.category || null;
  }, [item, type, language]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#A8C3C8" />
    </TouchableOpacity>
  );
});

interface GuideSection {
  title: string;
  data: (Recipe | Guide)[];
  type: 'recipe' | 'guide';
}

export default function GuidesScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const CATEGORIES = useMemo(() => [
    ...DEFAULT_CATEGORIES,
    ...state.customCategories.map(c => ({ label: c, icon: 'folder' }))
  ], [state.customCategories]);

  const sections: GuideSection[] = useMemo(() => {
    const allRecipes = [...defaultRecipes, ...state.customRecipes];
    const allGuides = [...defaultGuides, ...state.customGuides];
    
    const filteredRecipes = allRecipes.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
      (!activeCategory || r.category === activeCategory)
    );
  
    const filteredGuides = allGuides.filter(g => 
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
      (!activeCategory || g.category === activeCategory)
    );

    const result: GuideSection[] = [];
    if (filteredGuides.length > 0) {
      result.push({ title: t('cleaning_guides', state.language).toUpperCase(), data: filteredGuides, type: 'guide' });
    }
    if (filteredRecipes.length > 0) {
      result.push({ title: t('recipes', state.language).toUpperCase(), data: filteredRecipes, type: 'recipe' });
    }
    return result;
  }, [state.customRecipes, state.customGuides, searchQuery, activeCategory, state.language]);

  const handleOpenItem = useCallback((item: Recipe | Guide, type: 'recipe' | 'guide') => {
    router.push({
      pathname: '/guide-detail',
      params: { item: JSON.stringify(item), type },
    });
  }, [router]);

  const renderItem = useCallback(({ item, section }: { item: Recipe | Guide; section: GuideSection }) => {
    return (
      <GuideItem 
        item={item} 
        type={section.type} 
        language={state.language} 
        onPress={() => handleOpenItem(item, section.type)} 
      />
    );
  }, [handleOpenItem, state.language]);

  const renderSectionHeader = useCallback(({ section }: { section: GuideSection }) => (
    <Text style={[styles.sectionTitle, { marginTop: section.type === 'recipe' ? 24 : 0 }]}>{section.title}</Text>
  ), []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SectionList<Recipe | Guide, GuideSection>
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <View style={styles.logoRow}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoText}>T</Text>
                </View>
                <Text style={styles.appName}>Tzerachìa</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/settings')}>
                <Ionicons name="settings-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.titleActionRow}>
              <Text style={styles.screenTitle}>{t('tab_guides', state.language)}</Text>
              <TouchableOpacity 
                style={styles.addGuideButton}
                onPress={() => router.push('/add-guide')}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addGuideButtonText}>{t('add_guide', state.language)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#8A9A9A" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search_guides', state.language)}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#8A9A9A"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#8A9A9A" />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.categoryHeader}>{t('quick_categories', state.language)}</Text>
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat, idx) => {
                const isActive = activeCategory === cat.label;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                    onPress={() => setActiveCategory(isActive ? null : cat.label)}
                  >
                    <Feather 
                      name={cat.icon as any} 
                      size={14} 
                      color={isActive ? '#FFFFFF' : '#5A6B6B'} 
                      style={{ marginRight: 6 }} 
                    />
                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F9',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A3A1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2F2F',
  },
  titleActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginBottom: 0,
  },
  addGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A3A1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addGuideButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0E3E3',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A2F2F',
  },
  categoryHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8A9A9A',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0E3E3',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryPillActive: {
    backgroundColor: '#00A3A1',
    borderColor: '#00A3A1',
  },
  categoryText: {
    fontSize: 13,
    color: '#5A6B6B',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8A9A9A',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0E3E3',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8A9A9A',
  },
});
