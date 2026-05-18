import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useHifzStore } from '@/features/hifz/hooks/useHifzStore';
import { getAppDate } from '@/core/domain/dateHelpers';

export function DevTimeTravel() {
  if (!__DEV__) return null; // Safety net: NEVER show in production

  const devDateOffset = useHifzStore((s) => s.devDateOffset);
  const setDevDateOffset = useHifzStore((s) => s.setDevDateOffset);

  const handleIncrement = () => setDevDateOffset(devDateOffset + 1);
  const handleDecrement = () => setDevDateOffset(devDateOffset - 1);
  const handleReset = () => setDevDateOffset(0);

  const currentDate = getAppDate(devDateOffset);
  const shortDateStr = `${currentDate.getDate()}/${currentDate.getMonth() + 1}`;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: Platform.OS === 'web' ? 24 : 100, // Above tab bar on mobile
        left: 20,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderWidth: 1,
        borderColor: '#0284c7', // Dev blue color
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 10,
        zIndex: 9999,
      }}
    >
      <Pressable onPress={handleIncrement} style={({ pressed }) => [btnStyle, { opacity: pressed ? 0.5 : 1 }]}>
        <Ionicons name="play-forward" size={20} color="#38bdf8" />
      </Pressable>

      <Pressable onPress={handleReset} style={({ pressed }) => [{ alignItems: 'center' }, { opacity: pressed ? 0.5 : 1 }]}>
        <Text style={{ color: '#38bdf8', fontSize: 13, fontWeight: 'bold' }}>
          {shortDateStr}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 10 }}>
          {devDateOffset === 0 ? 'اليوم' : `يوم ${devDateOffset > 0 ? '+' : ''}${devDateOffset}`}
        </Text>
      </Pressable>

      <Pressable onPress={handleDecrement} style={({ pressed }) => [btnStyle, { opacity: pressed ? 0.5 : 1 }]}>
        <Ionicons name="play-back" size={20} color="#38bdf8" />
      </Pressable>
    </View>
  );
}

const btnStyle: object = {
  backgroundColor: 'rgba(2, 132, 199, 0.2)',
  width: 44,
  height: 44,
  borderRadius: 22,
  justifyContent: 'center',
  alignItems: 'center',
};
