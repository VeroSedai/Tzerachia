import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SectionList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import { t } from '../../i18n';
import { Recipe, Guide } from '../../types';
import { guides as defaultGuides, recipes as defaultRecipes } from '../../data/guidesAndRecipes';
import { Colors } from '../../constants/theme';

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
  isLast: boolean;
}

/**
 * Flat list item - no card border, clean Material 3 style row.
 */
const GuideItem = React.memo(({ item, type, language, onPress, isLast }: GuideItemProps) => {
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
      style={[styles.listItem, !isLast && styles.listItemDivider]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.title}</Text>
        {subtitle ? <Text style={styles.listItemSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.primaryMuted} />
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

  const renderItem = useCallback(({ item, section, index }: { item: Recipe | Guide; section: GuideSection; index: number }) => {
    const isLast = index === section.data.length - 1;
    return (
      <GuideItem
        item={item}
        type={section.type}
        language={state.language}
        onPress={() => handleOpenItem(item, section.type)}
        isLast={isLast}
      />
    );
  }, [handleOpenItem, state.language]);

  const renderSectionHeader = useCallback(({ section }: { section: GuideSection }) => (
    <Text style={[styles.sectionTitle, { marginTop: section.type === 'recipe' ? 28 : 0 }]}>{section.title}</Text>
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
            {/* Compact top app bar: only logo icon + settings */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Scrolling page title - M3 style large headline */}
            <Text style={styles.pageTitle}>{t('tab_guides', state.language)}</Text>

            {/* Search bar - filled tonal, no heavy border */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search_guides', state.language)}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.textMuted}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Category filter chips - filled tonal when active, surface when not */}
            <Text style={styles.categoryHeader}>{t('quick_categories', state.language)}</Text>
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat, idx) => {
                const isActive = activeCategory === cat.label;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                    onPress={() => setActiveCategory(isActive ? null : cat.label)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={cat.icon as any}
                      size={13}
                      color={isActive ? Colors.primary : Colors.textSecondary}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('no_guides_found', state.language)}</Text>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-guide')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8FB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 96, // Extra bottom padding for FAB clearance
  },

  // --- Top App Bar ---
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  settingsBtn: {
    padding: 4,
  },

  // --- Page Headline (scrolls with content) ---
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 20,
    letterSpacing: -0.5,
  },

  // --- Search Bar - Filled tonal (no border, surface background) ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  // --- Category Chips - Filled tonal style ---
  categoryHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    // Tonal surface background (no border)
    backgroundColor: '#E9EEF4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryLight,
  },
  categoryChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // --- Section Header ---
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  // --- Flat List Items (no card, clean rows with dividers) ---
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 4,
  },
  listItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  listItemContent: {
    flex: 1,
    marginRight: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  // --- Empty State ---
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },

  // --- Floating Action Button ---
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
