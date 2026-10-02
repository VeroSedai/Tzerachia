import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { Colors } from '../constants/theme';

export default function AddGuideScreen() {
  const router = useRouter();
  const { state, addCustomGuide, addCustomRecipe, addCustomCategory } = useAppContext();
  
  const [type, setType] = useState<'guide' | 'recipe'>('guide');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Detergenti Fai-da-te');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [items, setItems] = useState<string[]>(['']);

  const baseCategories = ['Detergenti Fai-da-te', 'Speed Cleaning', 'Cucina', 'Bagno', 'Tessili & Divani'];
  // Combine base categories, custom ones, and the special "+ Nuova Categoria"
  const CATEGORIES = [...new Set([...baseCategories, ...state.customCategories]), '+ Nuova Categoria'];

  const handleAddItem = () => {
    setItems([...items, '']);
  };

  const handleItemChange = (text: string, index: number) => {
    const newItems = [...items];
    newItems[index] = text;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const filteredItems = items.filter(i => i.trim() !== '');
    if (filteredItems.length === 0) return;

    let finalCategory = category;
    if (category === '+ Nuova Categoria') {
      if (!newCategoryName.trim()) return;
      finalCategory = newCategoryName.trim();
      addCustomCategory(finalCategory);
    }

    const id = `custom-${Date.now()}`;

    if (type === 'guide') {
      addCustomGuide({
        id,
        title,
        category: finalCategory,
        steps: filteredItems.map((desc, i) => ({ step: i + 1, description: desc }))
      });
    } else {
      addCustomRecipe({
        id,
        title,
        category: finalCategory,
        ingredients: filteredItems
      });
    }

    // Reset local state
    setTitle('');
    setCategory('Detergenti Fai-da-te');
    setIsNewCategory(false);
    setNewCategoryName('');
    setItems(['']);
    setType('guide');

    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1A2F2F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuova {type === 'guide' ? 'Guida' : 'Ricetta'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={!title.trim()}>
            <Text style={[styles.saveText, !title.trim() && styles.saveTextDisabled]}>Salva</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'guide' && styles.typeButtonActive]}
              onPress={() => { setType('guide'); setItems(['']); }}
            >
              <Text style={[styles.typeButtonText, type === 'guide' && styles.typeButtonTextActive]}>Guida</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'recipe' && styles.typeButtonActive]}
              onPress={() => { setType('recipe'); setItems(['']); }}
            >
              <Text style={[styles.typeButtonText, type === 'recipe' && styles.typeButtonTextActive]}>Ricetta</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Titolo</Text>
          <TextInput
            style={styles.input}
            placeholder={type === 'guide' ? 'Es. Pulizia profonda forno' : 'Es. Spray Vetri Fai-da-te'}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#8A9A9A"
          />

          <Text style={styles.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {CATEGORIES.map((cat, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                onPress={() => {
                  setCategory(cat);
                  setIsNewCategory(cat === '+ Nuova Categoria');
                }}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isNewCategory && (
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Nome nuova categoria"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholderTextColor="#8A9A9A"
            />
          )}

          <Text style={[styles.label, { marginTop: 24 }]}>
            {type === 'guide' ? 'Passaggi' : 'Ingredienti'}
          </Text>
          
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemIndex}>{index + 1}.</Text>
              <TextInput
                style={styles.itemInput}
                placeholder={type === 'guide' ? `Descrizione passaggio ${index + 1}` : `Ingrediente ${index + 1}`}
                value={item}
                onChangeText={(text) => handleItemChange(text, index)}
                placeholderTextColor="#8A9A9A"
                multiline={type === 'guide'}
              />
              {items.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveItem(index)} style={styles.removeButton}>
                  <Feather name="minus-circle" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Feather name="plus" size={16} color={Colors.primary} />
            <Text style={styles.addButtonText}>
              Aggiungi {type === 'guide' ? 'passaggio' : 'ingrediente'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0EAE9',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2F2F',
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  saveTextDisabled: {
    color: Colors.primaryMuted,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E0EAE9',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  typeButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B6B',
  },
  typeButtonTextActive: {
    color: '#1A2F2F',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A2F2F',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A2F2F',
    marginBottom: 16,
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8A9A9A',
    width: 24,
  },
  itemInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A2F2F',
  },
  removeButton: {
    padding: 8,
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    marginTop: 10,
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
});
