import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { PageContainer } from '@/components/ui/PageContainer';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function OptionalAuthScreen() {
  const router = useRouter();
  const linkGoogleAccount = useAuthStore((s) => s.linkGoogleAccount);
  const signInAnonymously = useAuthStore((s) => s.signInAnonymously);

  const handleContinueWithGoogle = async () => {
    try {
      await linkGoogleAccount();
      // Route to /(tabs) and let the (tabs)/_layout guard decide if they need onboarding
      router.replace('/(tabs)');
    } catch (e: any) {
      // The recovery modal or toasts handle errors natively via useAuthStore
    }
  };

  const handleSkip = async () => {
    // Generate the anonymous session only now, as they have chosen to proceed locally
    await signInAnonymously();
    router.push('/onboarding');
  };

  return (
    <PageContainer>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        {/* Logo */}
        <Image
          source={require('@/assets/images/app-icon.png')}
          style={{ width: 100, height: 100, marginBottom: 24, borderRadius: 20 }}
          resizeMode="contain"
        />

        <Text style={{ color: '#f0c96b', fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
          مرحباً بك في مُراجعة
        </Text>

        <Text style={{ color: '#8b949e', fontSize: 16, textAlign: 'center', marginBottom: 40, lineHeight: 26 }}>
          سجل دخولك أو أنشئ حساباً باستخدام Google لمزامنة بياناتك، أو استمر محلياً للبدء فوراً.
        </Text>

        <View style={{ width: '100%', gap: 16 }}>
          <TouchableOpacity
            onPress={handleContinueWithGoogle}
            style={{
              backgroundColor: '#2ea043',
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: 'center',
              flexDirection: 'row-reverse',
              justifyContent: 'center',
              gap: 12,
              shadowColor: '#2ea043',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              المتابعة باستخدام Google
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginVertical: 8 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#30363d' }} />
            <Text style={{ color: '#8b949e', marginHorizontal: 12, fontSize: 14 }}>أو</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#30363d' }} />
          </View>

          <TouchableOpacity
            onPress={handleSkip}
            style={{
              backgroundColor: '#21262d',
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#30363d',
            }}
          >
            <Text style={{ color: '#e6edf3', fontWeight: 'bold', fontSize: 16 }}>
              تخطي كحساب محلي
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </PageContainer>
  );
}
