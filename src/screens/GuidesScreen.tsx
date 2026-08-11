import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { t } from '../i18n';
import { guides as defaultGuides, recipes as defaultRecipes } from '../data/guidesAndRecipes';

const DEFAULT_CATEGORIES = [
  { label: 'Detergenti Fai-da-te', icon: 'droplet' },
  { label: 'Speed Cleaning', icon: 'zap' },
  { label: 'Cucina', icon: 'coffee' },
  { label: 'Bagno', icon: 'life-buoy' },
  { label: 'Tessili & Divani', icon: 'layout' }
];

interface Props {
  navigation: NativeStackNavigationProp<any, any>;
}

const GuideItem = React.memo(({ item, type, navigation }: any) => (
  <TouchableOpacity 
    style={styles.card}
    onPress={() => navigation.navigate('GuideDetail', { item, type })}
  >
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {type === 'recipe' ? (
        <Text style={styles.cardSubtitle}>Aceto & Olii essenziali</Text>
      ) : item.duration ? (
        <Text style={styles.cardSubtitle}>{item.duration}</Text>
      ) : null}
    </View>
    <Ionicons name="chevron-forward" size={20} color="#A8C3C8" />
  </TouchableOpacity>
));

export default function GuidesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const CATEGORIES = useMemo(() => [
    ...DEFAULT_CATEGORIES,
    ...state.customCategories.map(c => ({ label: c, icon: 'folder' }))
  ], [state.customCategories]);

  const sections = useMemo(() => {
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

    const result = [];
    if (filteredGuides.length > 0) {
      result.push({ title: t('cleaning_guides', state.language).toUpperCase(), data: filteredGuides, type: 'guide' });
    }
    if (filteredRecipes.length > 0) {
      result.push({ title: t('recipes', state.language).toUpperCase(), data: filteredRecipes, type: 'recipe' });
    }
    return result;
  }, [state.customRecipes, state.customGuides, searchQuery, activeCategory, state.language]);

  const renderItem = useCallback(({ item, section }: any) => {
    return <GuideItem item={item} type={section.type} navigation={navigation} />;
  }, [navigation]);

  const renderSectionHeader = useCallback(({ section: { title } }: any) => (
    <Text style={[styles.sectionTitle, { marginTop: title.includes('RICETTE') ? 24 : 0 }]}>{title}</Text>
  ), []);

  const ListHeader = useCallback(() => (
    <>
      <View style={styles.headerRow}>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.appName}>Tzerachìa</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={[styles.screenTitle, { marginBottom: 0 }]}>{t('tab_guides', state.language)}</Text>
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#00A3A1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 }}
          onPress={() => navigation.navigate('AddGuide')}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', marginLeft: 4 }}>{t('add_guide', state.language)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8A9A9A" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_guides', state.language)}
          placeholderTextColor="#8A9A9A"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Text style={styles.sectionTitle}>{t('quick_categories', state.language)}</Text>
      <View style={styles.categoriesWrapper}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.label}
            style={[styles.categoryChip, activeCategory === cat.label && styles.categoryChipActive]}
            onPress={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
          >
            <Feather name={cat.icon as any} size={14} color={activeCategory === cat.label ? '#FFFFFF' : '#1A2F2F'} style={{ marginRight: 6 }} />
            <Text style={[styles.categoryText, activeCategory === cat.label && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  ), [state.language, navigation, searchQuery, CATEGORIES, activeCategory]);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 40, paddingBottom: insets.bottom || 20 }]}>
      <SectionList<any, any>
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
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
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00A3A1', // Teal
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
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0EAE9',
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1A2F2F',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5A6B6B',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  categoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0EAE9',
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#00A3A1',
    borderColor: '#00A3A1',
  },
  categoryText: {
    color: '#1A2F2F',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0EAE9',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2F2F',
    flexShrink: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8A9A9A',
    marginTop: 4,
    flexShrink: 1,
  },
});
