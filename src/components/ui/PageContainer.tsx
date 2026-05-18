import React from 'react';
import { View, ScrollView, Platform, ScrollViewProps } from 'react-native';

interface PageContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  noPadding?: boolean;
  noScroll?: boolean;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * PageContainer
 * A shared wrapper for all screen content.
 * On Web: centers content to a max-width of 680px for a clean desktop layout.
 * On Mobile: renders as a normal full-width ScrollView with safe top padding.
 */
export function PageContainer({ children, noPadding, noScroll, ...props }: PageContainerProps) {
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  
  // Calculate dynamic top padding. 48 looks good on Web, but native needs the inset plus a little breathing room.
  const topPadding = isWeb ? 40 : insets.top + 24;

  const contentStyle: any = isWeb ? { width: '100%', maxWidth: 680, paddingHorizontal: 24, paddingTop: topPadding } : { paddingHorizontal: 16, paddingTop: topPadding };

  if (noScroll) {
    return (
      <View className="flex-1 bg-[#0d1117]" {...props}>
        <View style={[contentStyle, { flex: 1 }]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#0d1117]"
      contentContainerStyle={isWeb ? { alignItems: 'center', paddingBottom: 32 } : { paddingBottom: 32 }}
      {...props}
    >
      <View style={contentStyle}>
        {children}
      </View>
    </ScrollView>
  );
}
