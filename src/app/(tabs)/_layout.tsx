import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TAB_ICON_SIZE = 24;

export default function TabLayout() {
  return (
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
        name="index"
        options={{
          title: 'اليوم',
          tabBarIcon: ({ color }) => <Ionicons name="today-outline" size={TAB_ICON_SIZE} color={color} />,
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
        name="review"
        options={{
          title: 'المراجعة',
          tabBarIcon: ({ color }) => <Ionicons name="sync-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'خريطة',
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
        name="settings"
        options={{
          title: 'إعدادات',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  );
}
