import React from 'react';
import { View, ScrollView, Platform, ScrollViewProps } from 'react-native';

interface PageContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

/**
 * PageContainer
 * A shared wrapper for all screen content.
 * On Web: centers content to a max-width of 680px for a clean desktop layout.
 * On Mobile: renders as a normal full-width ScrollView.
 */
export function PageContainer({ children, noPadding, ...props }: PageContainerProps) {
  const isWeb = Platform.OS === 'web';

  return (
    <ScrollView
      className="flex-1 bg-[#0d1117]"
      contentContainerStyle={isWeb ? { alignItems: 'center', paddingBottom: 32 } : { paddingBottom: 32 }}
      {...props}
    >
      <View
        style={isWeb ? { width: '100%', maxWidth: 680, paddingHorizontal: 24, paddingTop: 40 } : { paddingHorizontal: 16, paddingTop: 48 }}
      >
        {children}
      </View>
    </ScrollView>
  );
}
