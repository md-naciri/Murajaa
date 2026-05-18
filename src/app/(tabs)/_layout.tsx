import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { View, ActivityIndicator } from 'react-native';

const TAB_ICON_SIZE = 24;

export default function TabLayout() {
  const hasCompletedOnboarding = useHifzStore(s => s.hasCompletedOnboarding);
  const _hasHydrated = useHifzStore(s => s._hasHydrated);

  if (!_hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d1117', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d4a843" />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#d4a843',
        tabBarInactiveTintColor: '#8b949e',
        tabBarStyle: {
          backgroundColor: '#0d1117',
          borderTopColor: '#30363d',
        },
      }}
    >
      <Tabs.Screen
        name="settings"
        options={{
          title: 'إعدادات',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'الخريطة',
          tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'السجل',
          tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: 'الأسبوع',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'اليوم',
          tabBarIcon: ({ color }) => <Ionicons name="today-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      </Tabs>
    </View>
  );
}
