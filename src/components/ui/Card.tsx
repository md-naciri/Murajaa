import React from 'react';
import { View, Text, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  title?: string;
  icon?: React.ReactNode;
}

export function Card({ title, icon, children, className = '', ...props }: CardProps) {
  return (
    <View className={`bg-surface-1 border border-surface-2 rounded-2xl p-5 mb-4 ${className}`} {...props}>
      {(title || icon) && (
        <View className="flex-row items-center gap-2 mb-4">
          {icon}
          {title && <Text className="text-gold font-bold tracking-widest text-xs uppercase">{title}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}
