import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useToastStore } from '@/core/store/useToastStore';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Toast() {
  const { visible, message, type } = useToastStore();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-50);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(insets.top + 10, { damping: 15 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-50, { duration: 300 });
    }
  }, [visible, insets.top]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return '#2ea043';
      case 'error': return '#f85149';
      default: return '#58a6ff';
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.toast, { borderRightColor: getColor() }]}>
        <Text style={styles.message}>{message}</Text>
        <Ionicons name={getIcon()} size={24} color={getColor()} style={styles.icon} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363d',
    borderRightWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: '90%',
  },
  icon: {
    marginLeft: 12,
  },
  message: {
    color: '#e6edf3',
    fontFamily: 'Amiri-Regular',
    fontSize: 16,
    textAlign: 'right',
    flexShrink: 1,
  },
});
