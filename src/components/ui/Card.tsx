import React from 'react';
import { View,  ViewProps } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';

interface CardProps extends ViewProps {
  title?: string;
  icon?: React.ReactNode;
}

export function Card({ title, icon, children, style, ...props }: CardProps) {
  return (
    <View 
      style={[
        {
          backgroundColor: '#161b22', // bg-surface-1
          borderWidth: 1,
          borderColor: '#30363d', // border-surface-2
          borderRadius: 16, // rounded-2xl
          padding: 20, // p-5
          marginBottom: 16, // mb-4
        },
        style
      ]} 
      {...props}
    >
      {(title || icon) && (
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {icon}
          {title && (
            <Text 
              style={{ 
                color: '#d4a843', // text-gold
                fontWeight: 'bold', 
                letterSpacing: 1, // tracking-widest
                fontSize: 12, // text-xs
                textTransform: 'uppercase', 
                textAlign: 'right' 
              }}
            >
              {title}
            </Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

