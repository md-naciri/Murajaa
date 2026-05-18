import React from 'react';
import { Text, TextProps, StyleSheet, Platform } from 'react-native';

export function AppText(props: TextProps) {
  const flattenedStyle = StyleSheet.flatten(props.style || {});
  
  // Detect if the requested style is bold
  const isBold = 
    flattenedStyle.fontWeight === 'bold' || 
    flattenedStyle.fontWeight === '700' || 
    flattenedStyle.fontWeight === '600' ||
    flattenedStyle.fontWeight === '800';
  
  // We explicitly load the beautiful Cairo font.
  // On Android, if we pass 'fontWeight: bold' with a custom font that isn't mapped in native XML, 
  // it silently falls back to the ugly system font. 
  // To fix this, we map to the exact bold font file and UNSET the fontWeight.
  const customStyle = {
    fontFamily: isBold ? 'Cairo_700Bold' : 'Cairo_400Regular',
    ...(Platform.OS === 'android' && isBold ? { fontWeight: 'normal' as const } : {})
  };

  return (
    <Text 
      {...props} 
      style={[
        props.style, 
        customStyle 
      ]} 
    />
  );
}

