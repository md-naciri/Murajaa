import React from 'react';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <View className="my-2">
      <View className="flex-row-reverse justify-between mb-1.5">
        <Text className="text-gray-400 text-xs">{label || 'التقدم'}</Text>
        <Text className="text-gray-400 text-xs">{current} / {total}</Text>
      </View>
      <View className="h-2.5 bg-surface-2 rounded-full overflow-hidden border border-gray-800 relative">
        <View 
          className="h-full bg-gold rounded-full absolute right-0" 
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
}

