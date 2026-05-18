import React from 'react';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';

interface BadgeProps {
  label: string;
  variant?: 'izhar' | 'review' | 'done' | 'gold';
}

export function Badge({ label, variant = 'review' }: BadgeProps) {
  const styles = {
    izhar: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    review: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    done: 'bg-green-500/10 border-green-500/20 text-green-400',
    gold: 'bg-gold-dim/20 border-gold-dim text-gold-light',
  };

  return (
    <View className={`px-2.5 py-0.5 rounded-full border ${styles[variant].split(' ').slice(0, 2).join(' ')}`}>
      <Text className={`text-[10px] font-bold text-center ${styles[variant].split(' ')[2]}`}>
        {label}
      </Text>
    </View>
  );
}

