import React from 'react';
import { View, Text } from 'react-native';
import { PageContainer } from '@/components/ui/PageContainer';

export default function MapScreen() {
  return (
    <PageContainer>
      <View className="items-center justify-center py-20">
        <Text className="text-[#d4a843] text-lg font-bold mb-2">الخريطة</Text>
        <Text className="text-gray-500 text-sm">هذه الشاشة قيد التطوير</Text>
      </View>
    </PageContainer>
  );
}
