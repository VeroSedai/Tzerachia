import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { t } from '../../i18n';

import { Colors } from '../../constants/theme';

/**
 * Expo Router bottom tab layout for the main 4 application sections.
 */
export default function TabLayout() {
  const { state } = useAppContext();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#D0D0D0',
          // 64dp content area: fits icon (24) + label (12) + padding without clipping
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_today', state.language),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: t('tab_schedule', state.language),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: t('tab_challenges', state.language),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="guides"
        options={{
          title: t('tab_guides', state.language),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
