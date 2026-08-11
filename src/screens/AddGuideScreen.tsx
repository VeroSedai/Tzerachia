import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

interface Props {
  navigation: NativeStackNavigationProp<any, any>;
}

export default function AddGuideScreen({ navigation }: Props) {
  const { addCustomGuide, addCustomRecipe } = useAppContext();
  
  const [type, setType] = useState<'guide' | 'recipe'>('guide');
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<string[]>(['']);

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

    const id = `custom-${Date.now()}`;

    if (type === 'guide') {
      addCustomGuide({
        id,
        title,
        steps: filteredItems.map((desc, i) => ({ step: i + 1, description: desc }))
      });
    } else {
      addCustomRecipe({
        id,
        title,
        ingredients: filteredItems
      });
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1A2F2F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuova {type === 'guide' ? 'Guida' : 'Ricetta'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={!title.trim()}>
            <Text style={[styles.saveText, !title.trim() && styles.saveTextDisabled]}>Salva</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'guide' && styles.typeButtonActive]}
              onPress={() => { setType('guide'); setItems(['']); }}
            >
              <Text style={[styles.typeButtonText, type === 'guide' && styles.typeButtonTextActive]}>Guida (Step)</Text>
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
            placeholder={type === 'guide' ? "Es. Pulizia profonda frigo" : "Es. Sgrassatore universale"}
            placeholderTextColor="#8A9A9A"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>{type === 'guide' ? 'Passaggi' : 'Ingredienti'}</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={styles.itemInput}
                placeholder={type === 'guide' ? "Descrivi il passaggio..." : "Nome ingrediente..."}
                placeholderTextColor="#8A9A9A"
                value={item}
                onChangeText={(text) => handleItemChange(text, index)}
                multiline={type === 'guide'}
              />
              <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem(index)}>
                <Feather name="trash-2" size={18} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Feather name="plus" size={16} color="#00A3A1" style={{ marginRight: 6 }} />
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
  safeArea: { flex: 1, backgroundColor: '#F6F9F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0EAE9', backgroundColor: '#FFFFFF' },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A2F2F' },
  saveText: { fontSize: 16, fontWeight: 'bold', color: '#00A3A1' },
  saveTextDisabled: { color: '#A8C3C8' },
  container: { padding: 20, paddingBottom: 60 },
  typeSelector: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: '#E0EAE9' },
  typeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  typeButtonActive: { backgroundColor: '#00A3A1' },
  typeButtonText: { fontSize: 14, fontWeight: '600', color: '#5A6B6B' },
  typeButtonTextActive: { color: '#FFFFFF' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#1A2F2F', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0EAE9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1A2F2F', marginBottom: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  itemNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 4 },
  itemNumberText: { color: '#00A3A1', fontSize: 12, fontWeight: 'bold' },
  itemInput: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0EAE9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: '#1A2F2F', minHeight: 44 },
  removeButton: { padding: 12, marginLeft: 4, marginTop: 2 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#00A3A1', borderStyle: 'dashed', marginTop: 10 },
  addButtonText: { color: '#00A3A1', fontSize: 14, fontWeight: '600' },
});
