import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import TodayScreen from '../screens/TodayScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditScheduleModal from '../screens/EditScheduleModal';
import ChallengesScreen from '../screens/ChallengesScreen';
import GuidesScreen from '../screens/GuidesScreen';
import GuideDetailScreen from '../screens/GuideDetailScreen';
import AddGuideScreen from '../screens/AddGuideScreen';
import { RootStackParamList } from '../types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function GuidesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GuidesList" component={GuidesScreen} />
      <Stack.Screen name="GuideDetail" component={GuideDetailScreen} />
      <Stack.Screen 
        name="AddGuide" 
        component={AddGuideScreen} 
        options={{ presentation: 'modal' }} 
      />
    </Stack.Navigator>
  );
}

import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';

function ChallengesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChallengesList" component={ChallengesScreen} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Custom headers in screens
        tabBarActiveTintColor: '#00A3A1', // Teal
        tabBarInactiveTintColor: '#8E8E93', // Gray
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Today') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'ChallengesStack') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'GuidesStack') {
            iconName = focused ? 'book' : 'book-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen} 
        options={{ title: 'Pianifica' }}
      />
      <Tab.Screen 
        name="ChallengesStack" 
        component={ChallengesStack} 
        options={{ title: 'Challenges' }}
      />
      <Tab.Screen 
        name="GuidesStack" 
        component={GuidesStack} 
        options={{ title: 'Guides' }} 
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditSchedule" component={EditScheduleModal} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
