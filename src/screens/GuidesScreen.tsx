import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import { guides, recipes } from '../data/guidesAndRecipes';

const CATEGORIES = [
  { label: 'Detergenti Fai-da-te', icon: 'droplet' },
  { label: 'Speed Cleaning', icon: 'zap' },
  { label: 'Cucina', icon: 'coffee' },
  { label: 'Bagno', icon: 'life-buoy' },
  { label: 'Tessili & Divani', icon: 'layout' }
];

interface Props {
  navigation: NativeStackNavigationProp<any, any>;
}

export default function GuidesScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredRecipes = recipes.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (!activeCategory || activeCategory === 'Detergenti Fai-da-te')
  );

  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (!activeCategory || activeCategory !== 'Detergenti Fai-da-te')
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.appName}>Simply Clean</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.screenTitle}>Guide & Risorse</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8A9A9A" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca guide e ricette..."
            placeholderTextColor="#8A9A9A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
          {/* Categories */}
          <Text style={styles.sectionTitle}>CATEGORIE RAPIDE</Text>
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

          {/* List */}
          {filteredGuides.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>GUIDE POPOLARI</Text>
              <View style={styles.listContainer}>
                {filteredGuides.map(guide => (
                  <TouchableOpacity 
                    key={guide.id} 
                    style={styles.card}
                    onPress={() => navigation.navigate('GuideDetail', { item: guide, type: 'guide' })}
                  >
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{guide.title}</Text>
                      {guide.duration && <Text style={styles.cardSubtitle}>{guide.duration}</Text>}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#A8C3C8" />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {filteredRecipes.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>RICETTE DETERGENTI FAI-DA-TE</Text>
              <View style={styles.listContainer}>
                {filteredRecipes.map(recipe => (
                  <TouchableOpacity 
                    key={recipe.id} 
                    style={styles.card}
                    onPress={() => navigation.navigate('GuideDetail', { item: recipe, type: 'recipe' })}
                  >
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{recipe.title}</Text>
                      <Text style={styles.cardSubtitle}>Aceto & Olii essenziali</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#A8C3C8" />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
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
  listContainer: {
    gap: 12,
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
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8A9A9A',
    marginTop: 4,
  },
});
